'use client';

// Preview 3D da arma com a skin aplicada.
//
// Carregado SOB DEMANDA (next/dynamic no Previsualizacao.js): os modelos .glb
// pesam 1 a 5 MB cada, e o three.js mais uns 600 KB. Quem nao clicar em "ver em
// 3D" nao baixa nada disso.
//
// Port enxuto do weaponviewer.js do site antigo (1.161 linhas). Ficou de fora a
// projecao de adesivos no modelo: ela dependia de ProjectedMaterial e de uma
// colocacao customizada que o site original nunca chegou a implementar.

import { useEffect, useRef, useState } from 'react';

export default function Viewer3D({ modelUrl, texturaUrls, legacy, semRemoverMesh }) {
  const montagem = useRef(null);
  const [estado, setEstado] = useState('carregando'); // carregando | pronto | erro
  const [detalhe, setDetalhe] = useState(null);

  useEffect(() => {
    let vivo = true;
    let limpar = () => {};

    (async () => {
      try {
        const THREE = await import('three');
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
        const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');

        if (!vivo || !montagem.current) return;

        const container = montagem.current;
        const largura = container.clientWidth;
        const altura = container.clientHeight;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(largura, altura);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        container.appendChild(renderer.domElement);

        const scene = new THREE.Scene();

        // Ambiente procedural do proprio three, em vez do .hdr remoto que o site
        // antigo baixava: o metal precisa de reflexo para nao ficar chapado, e
        // assim nao ha mais um download externo.
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

        const camera = new THREE.PerspectiveCamera(45, largura / altura, 0.1, 1000);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.enablePan = false;

        // --- Modelo ---
        const gltf = await new Promise((resolve, reject) =>
          new GLTFLoader().load(modelUrl, resolve, undefined, reject)
        );
        if (!vivo) return;

        // O .glb traz DUAS versoes da arma (modelo legado e atual) como filhos
        // da cena; a skin diz qual usar pelo campo legacy_model do catalogo.
        // Facas, luvas e taser so tem uma — por isso o semRemoverMesh.
        if (!semRemoverMesh && gltf.scene.children.length > 1) {
          gltf.scene.remove(gltf.scene.children[legacy ? 1 : 0]);
        }

        // --- Textura da skin ---
        if (texturaUrls?.[0]?.length) {
          // Cada textura vem como lista de candidatos (.png e .webp): o
          // catalogo do LielXD tem umas em um formato, outras no outro.
          const carregarTextura = async (candidatos) => {
            for (const url of candidatos ?? []) {
              const t = await new Promise((resolve) =>
                new THREE.TextureLoader().load(url, resolve, undefined, () => resolve(null))
              );
              if (t) return t;
            }
            return null;
          };

          const [mapa, metal] = await Promise.all([
            carregarTextura(texturaUrls[0]),
            carregarTextura(texturaUrls[1]),
          ]);

          for (const t of [mapa, metal]) {
            if (!t) continue;
            t.colorSpace = THREE.SRGBColorSpace;
            t.wrapS = THREE.RepeatWrapping;
            t.wrapT = THREE.RepeatWrapping;
            // flipY false: as texturas do catalogo vem com a orientacao do
            // glTF, nao a do WebGL. Sem isto a skin sai de cabeca para baixo.
            t.flipY = false;
          }

          if (mapa) {
            gltf.scene.traverse((filho) => {
              const nome = filho.material?.name ?? '';
              // Braco e luneta nao recebem a pintura da arma.
              if (!filho.isMesh || nome.includes('bare_arm') || nome.includes('scope')) return;
              filho.material.map = mapa;
              if (metal) filho.material.metalnessMap = metal;
              filho.material.needsUpdate = true;
            });
          }
        }

        // --- Enquadramento ---
        const caixa = new THREE.Box3().setFromObject(gltf.scene);
        const centro = caixa.getCenter(new THREE.Vector3());
        const tamanho = caixa.getSize(new THREE.Vector3());

        gltf.scene.position.sub(centro);

        const pivot = new THREE.Group();
        pivot.add(gltf.scene);
        pivot.rotation.y = Math.PI;
        scene.add(pivot);

        const distancia = tamanho.length();
        camera.position.set(0, distancia * 0.25, distancia * 0.9);
        controls.minDistance = distancia * 0.5;
        controls.maxDistance = distancia * 2;
        controls.update();

        if (!vivo) return;
        setEstado('pronto');

        // --- Laco de render ---
        let frame;
        const render = () => {
          frame = requestAnimationFrame(render);
          controls.update();
          renderer.render(scene, camera);
        };
        render();

        const aoRedimensionar = () => {
          const w = container.clientWidth;
          const h = container.clientHeight;
          if (!w || !h) return;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        window.addEventListener('resize', aoRedimensionar);

        limpar = () => {
          cancelAnimationFrame(frame);
          window.removeEventListener('resize', aoRedimensionar);
          controls.dispose();
          pmrem.dispose();
          // Libera GPU: sem isto, abrir varias armas vaza memoria de video.
          scene.traverse((o) => {
            if (o.isMesh) {
              o.geometry?.dispose();
              const mats = Array.isArray(o.material) ? o.material : [o.material];
              for (const m of mats) {
                m?.map?.dispose();
                m?.metalnessMap?.dispose();
                m?.dispose();
              }
            }
          });
          renderer.dispose();
          renderer.domElement.remove();
        };
      } catch (e) {
        console.error('[skins] viewer 3D falhou:', e);
        if (vivo) {
          setEstado('erro');
          setDetalhe(e?.message ?? null);
        }
      }
    })();

    return () => {
      vivo = false;
      limpar();
    };
  }, [modelUrl, texturaUrls, legacy, semRemoverMesh]);

  return (
    <div className="relative h-80 w-full overflow-hidden rounded-lg border border-gray-700 bg-gray-900/60">
      <div ref={montagem} className="h-full w-full" />

      {estado === 'carregando' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-gray-400">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-cyan-400" />
          Carregando modelo 3D...
        </div>
      )}

      {estado === 'erro' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 text-center text-sm text-gray-400">
          <span>Não foi possível carregar o modelo 3D desta arma.</span>
          {detalhe && <span className="text-xs text-gray-600">{detalhe}</span>}
        </div>
      )}

      {estado === 'pronto' && (
        <p className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-xs text-gray-600">
          arraste para girar · role para aproximar
        </p>
      )}
    </div>
  );
}
