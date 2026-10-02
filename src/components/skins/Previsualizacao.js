'use client';

// Previa da skin: imagem 2D por padrao, 3D sob demanda.
//
// O modelo .glb pesa de 1 a 5 MB e o three.js mais uns 600 KB. Carregar isso
// sempre que alguem abre a tela de customizacao seria caro — principalmente no
// celular. Entao o 3D so e baixado quando o jogador pede.

import dynamic from 'next/dynamic';
import { useState } from 'react';

const Viewer3D = dynamic(() => import('@/components/skins/Viewer3D'), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 w-full items-center justify-center rounded-lg border border-gray-700 bg-gray-900/60 text-sm text-gray-500">
      Carregando visualizador...
    </div>
  ),
});

export function Previsualizacao({ imagem, modelUrl, texturaUrls, legacy, meshUnico }) {
  const [mostrar3D, setMostrar3D] = useState(false);

  if (mostrar3D) {
    return (
      <div>
        <Viewer3D
          modelUrl={modelUrl}
          texturaUrls={texturaUrls}
          legacy={legacy}
          semRemoverMesh={meshUnico}
        />
        <button
          type="button"
          onClick={() => setMostrar3D(false)}
          className="mt-2 w-full text-center text-xs text-gray-500 hover:text-gray-300"
        >
          voltar para a imagem
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex h-48 items-center justify-center rounded-lg border border-gray-700 bg-gray-800/40 p-4">
        {imagem ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagem}
            alt=""
            className="max-h-full max-w-full object-contain drop-shadow-lg"
          />
        ) : null}
      </div>

      {modelUrl && (
        <button
          type="button"
          onClick={() => setMostrar3D(true)}
          className="mt-2 w-full rounded-md border border-gray-700 px-3 py-2 text-xs text-gray-400 transition-colors hover:border-cyan-600 hover:text-cyan-300"
        >
          Ver em 3D
          <span className="ml-1 text-gray-600">· baixa alguns MB</span>
        </button>
      )}
    </div>
  );
}
