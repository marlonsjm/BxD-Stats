'use client';

// Editor dos 5 slots de adesivo e do chaveiro.
//
// O catalogo (10.461 adesivos) fica no servidor: este componente consulta
// /api/skins/catalogo conforme o jogador digita. As imagens vem por URL
// derivada do id, entao um slot preenchido aparece sem precisar de busca.
//
// Estado mora no CustomizarForm, que e quem salva.

import { useEffect, useRef, useState } from 'react';
import {
  ADESIVO_PADRAO,
  CHAVEIRO_PADRAO,
  SEED_CHAVEIRO_MAX,
  imagemAdesivo,
  imagemChaveiro,
} from '@/lib/skins/adesivos';

function Miniatura({ src, alt }) {
  if (!src) return <span className="text-[10px] text-gray-600">vazio</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className="max-h-full max-w-full object-contain" />;
}

// Painel de busca, compartilhado por adesivo e chaveiro.
function Buscador({ tipo, onEscolher, onFechar }) {
  const [termo, setTermo] = useState('');
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const pedido = useRef(0);

  useEffect(() => {
    const meu = ++pedido.current;
    setCarregando(true);

    const t = setTimeout(() => {
      fetch(`/api/skins/catalogo?tipo=${tipo}&q=${encodeURIComponent(termo)}`)
        .then((r) => (r.ok ? r.json() : { itens: [] }))
        .then((d) => {
          // Ignora resposta de busca antiga que chegou atrasada.
          if (meu === pedido.current) {
            setItens(d.itens ?? []);
            setCarregando(false);
          }
        })
        .catch(() => meu === pedido.current && setCarregando(false));
    }, 250);

    return () => clearTimeout(t);
  }, [termo, tipo]);

  return (
    <div className="mt-3 rounded-lg border border-gray-700 bg-gray-900/70 p-4">
      <div className="mb-3 flex items-center gap-3">
        <input
          type="search"
          autoFocus
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder={tipo === 'keychain' ? 'Buscar chaveiro...' : 'Buscar adesivo...'}
          className="w-full rounded-md border border-gray-700 bg-gray-800/60 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-cyan-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={onFechar}
          className="shrink-0 text-sm text-gray-400 hover:text-white"
        >
          Fechar
        </button>
      </div>

      {carregando ? (
        <p className="py-6 text-center text-sm text-gray-500">Buscando...</p>
      ) : itens.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">
          Nada encontrado{termo ? ` para "${termo}"` : ''}.
        </p>
      ) : (
        <ul className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-5 md:grid-cols-6">
          {itens.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onEscolher(item)}
                title={item.name}
                className="flex w-full flex-col items-center gap-1 rounded-md border border-gray-700 bg-gray-800/50 p-2 transition-colors hover:border-cyan-500 hover:bg-gray-800"
              >
                <span className="flex h-12 w-full items-center justify-center">
                  <Miniatura src={item.image} alt="" />
                </span>
                <span className="line-clamp-2 text-[10px] leading-tight text-gray-400">
                  {item.name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {!carregando && itens.length >= 60 && (
        <p className="mt-2 text-center text-xs text-gray-600">
          Mostrando os 60 primeiros — refine a busca.
        </p>
      )}
    </div>
  );
}

export function AdesivosEditor({ adesivos, setAdesivos, chaveiro, setChaveiro }) {
  const [aberto, setAberto] = useState(null); // 0..4 para slot, 'keychain', ou null
  const [ajustando, setAjustando] = useState(null);
  const [nomes, setNomes] = useState({}); // id -> nome, so para exibicao

  // Resolve os nomes do que ja esta equipado (a imagem vem do id).
  useEffect(() => {
    const ids = adesivos.map((a) => a.id).filter((id) => id > 0);
    if (ids.length === 0) return;
    fetch(`/api/skins/catalogo?tipo=sticker&ids=${ids.join(',')}`)
      .then((r) => (r.ok ? r.json() : { itens: [] }))
      .then((d) => {
        const mapa = {};
        for (const i of d.itens ?? []) mapa[i.id] = i.name;
        setNomes((n) => ({ ...n, ...mapa }));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trocarSlot = (indice, novo) => {
    const copia = [...adesivos];
    copia[indice] = novo;
    setAdesivos(copia);
  };

  const escolherAdesivo = (indice, item) => {
    trocarSlot(indice, { ...ADESIVO_PADRAO, id: Number(item.id) });
    setNomes((n) => ({ ...n, [item.id]: item.name }));
    setAberto(null);
  };

  const ajuste = (indice, campo, valor) =>
    trocarSlot(indice, { ...adesivos[indice], [campo]: valor });

  const rotulo = 'mb-2 block text-sm font-medium text-gray-300';

  return (
    <div className="space-y-6">
      {/* --- Adesivos --- */}
      <div>
        <p className={rotulo}>
          Adesivos
          <span className="ml-1 font-normal text-gray-500">— até 5, aplicados nos slots da arma</span>
        </p>

        <ul className="flex flex-wrap gap-3">
          {adesivos.map((a, i) => (
            <li key={i} className="w-24">
              <button
                type="button"
                onClick={() => setAberto(aberto === i ? null : i)}
                title={a.id > 0 ? (nomes[a.id] ?? `Adesivo ${a.id}`) : 'Slot vazio'}
                className={`flex h-20 w-full items-center justify-center rounded-md border p-2 transition-colors ${
                  a.id > 0
                    ? 'border-cyan-600/60 bg-gray-800/60 hover:border-cyan-400'
                    : 'border-dashed border-gray-700 bg-gray-800/30 hover:border-gray-500'
                }`}
              >
                <Miniatura src={imagemAdesivo(a.id)} alt="" />
              </button>

              <p className="mt-1 line-clamp-2 text-center text-[10px] leading-tight text-gray-500">
                {a.id > 0 ? (nomes[a.id] ?? `#${a.id}`) : `Slot ${i + 1}`}
              </p>

              {a.id > 0 && (
                <div className="mt-1 flex justify-center gap-2 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setAjustando(ajustando === i ? null : i)}
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    ajustar
                  </button>
                  <button
                    type="button"
                    onClick={() => trocarSlot(i, { ...ADESIVO_PADRAO })}
                    className="text-red-400 hover:text-red-300"
                  >
                    tirar
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>

        {ajustando !== null && adesivos[ajustando]?.id > 0 && (
          <div className="mt-3 grid gap-4 rounded-lg border border-gray-700 bg-gray-900/50 p-4 sm:grid-cols-3">
            {[
              { campo: 'wear', nome: 'Desgaste', min: 0, max: 1, step: 0.01 },
              { campo: 'scale', nome: 'Escala', min: 0.1, max: 2, step: 0.05 },
              { campo: 'rotation', nome: 'Rotação', min: -180, max: 180, step: 1 },
            ].map(({ campo, nome, min, max, step }) => (
              <div key={campo}>
                <label className="mb-1 block text-xs text-gray-400">
                  {nome} do slot {ajustando + 1}
                  <span className="ml-1 text-gray-600">
                    ({Number(adesivos[ajustando][campo]).toFixed(campo === 'rotation' ? 0 : 2)})
                  </span>
                </label>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={adesivos[ajustando][campo]}
                  onChange={(e) => ajuste(ajustando, campo, Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
            ))}
          </div>
        )}

        {typeof aberto === 'number' && (
          <Buscador
            tipo="sticker"
            onEscolher={(item) => escolherAdesivo(aberto, item)}
            onFechar={() => setAberto(null)}
          />
        )}
      </div>

      {/* --- Chaveiro --- */}
      <div>
        <p className={rotulo}>
          Chaveiro
          <span className="ml-1 font-normal text-gray-500">— pendurado na arma</span>
        </p>

        <div className="flex flex-wrap items-end gap-4">
          <div className="w-24">
            <button
              type="button"
              onClick={() => setAberto(aberto === 'keychain' ? null : 'keychain')}
              className={`flex h-20 w-full items-center justify-center rounded-md border p-2 transition-colors ${
                chaveiro.id > 0
                  ? 'border-cyan-600/60 bg-gray-800/60 hover:border-cyan-400'
                  : 'border-dashed border-gray-700 bg-gray-800/30 hover:border-gray-500'
              }`}
            >
              <Miniatura src={imagemChaveiro(chaveiro.id)} alt="" />
            </button>
            {chaveiro.id > 0 && (
              <button
                type="button"
                onClick={() => setChaveiro({ ...CHAVEIRO_PADRAO })}
                className="mt-1 w-full text-center text-[10px] text-red-400 hover:text-red-300"
              >
                tirar
              </button>
            )}
          </div>

          {chaveiro.id > 0 && (
            <div>
              <label htmlFor="kseed" className="mb-1 block text-xs text-gray-400">
                Seed do chaveiro
              </label>
              <input
                id="kseed"
                type="number"
                min="0"
                max={SEED_CHAVEIRO_MAX}
                value={chaveiro.seed}
                onChange={(e) =>
                  setChaveiro({ ...chaveiro, seed: Number(e.target.value) })
                }
                className="w-32 rounded-md border border-gray-700 bg-gray-800/60 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {aberto === 'keychain' && (
          <Buscador
            tipo="keychain"
            onEscolher={(item) => {
              setChaveiro({ ...CHAVEIRO_PADRAO, id: Number(item.id) });
              setAberto(null);
            }}
            onFechar={() => setAberto(null)}
          />
        )}
      </div>
    </div>
  );
}
