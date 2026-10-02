'use client';

// Formulario de customizacao de uma skin: desgaste, seed, etiqueta e StatTrak.
//
// Luvas nao aceitam etiqueta nem StatTrak no jogo, entao esses campos somem.
// O 3D e os adesivos ficam para a fase 5.

import { useState, useTransition } from 'react';
import { salvarCustomizacao } from '@/app/skins/actions';
import { AvisoErro, ehActionDesatualizada } from '@/components/skins/AvisoErro';
import { AdesivosEditor } from '@/components/skins/AdesivosEditor';
import {
  FAIXAS_DESGASTE,
  NAMETAG_MAX,
  SEED_MAX,
  faixaDoDesgaste,
} from '@/lib/skins/desgaste';

export function CustomizarForm({ item, paint, team, ehLuva, inicial }) {
  const [wear, setWear] = useState(Number(inicial.wear ?? 0.000001));
  const [seed, setSeed] = useState(String(inicial.seed ?? 0));
  const [nametag, setNametag] = useState(inicial.nametag ?? '');
  const [stattrak, setStattrak] = useState(Boolean(inicial.stattrak));
  const [adesivos, setAdesivos] = useState(inicial.adesivos);
  const [chaveiro, setChaveiro] = useState(inicial.chaveiro);

  const [pendente, startTransition] = useTransition();
  const [aviso, setAviso] = useState(null); // { tipo: 'ok'|'erro', texto }

  const faixa = faixaDoDesgaste(wear);

  const salvar = () => {
    setAviso(null);
    startTransition(async () => {
      try {
        const r = await salvarCustomizacao({
          item,
          paint,
          team,
          wear,
          seed: Number(seed),
          nametag,
          stattrak,
          adesivos,
          chaveiro,
        });
        setAviso(
          r?.ok
            ? { tipo: 'ok', texto: 'Salvo. Reconecte ao servidor para ver no jogo.' }
            : { tipo: 'erro', texto: r?.erro ?? 'Não foi possível salvar.' }
        );
      } catch (e) {
        // Aba aberta durante um deploy: o id da server action nao existe mais.
        setAviso(
          ehActionDesatualizada(e)
            ? { tipo: 'desatualizada' }
            : { tipo: 'erro', texto: 'Não foi possível salvar. Tente de novo.' }
        );
      }
    });
  };

  const rotulo = 'mb-2 block text-sm font-medium text-gray-300';
  const campo =
    'w-full rounded-md border border-gray-700 bg-gray-800/60 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-cyan-500 focus:outline-none';

  return (
    <div className="space-y-7 rounded-lg border border-gray-700 bg-gray-800/40 p-6">
      {/* Desgaste */}
      <div>
        <label htmlFor="wear" className={rotulo}>
          Desgaste{' '}
          <span className="font-normal text-gray-500">
            — {faixa.label} ({wear.toFixed(4)})
          </span>
        </label>

        <input
          id="wear"
          type="range"
          min="0"
          max="1"
          step="0.0001"
          value={wear}
          onChange={(e) => setWear(Number(e.target.value))}
          className="w-full accent-cyan-500"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {FAIXAS_DESGASTE.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setWear(f.valor)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                faixa.id === f.id
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                  : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
              }`}
              title={f.label}
            >
              {f.curto}
            </button>
          ))}
        </div>
      </div>

      {/* Seed */}
      <div>
        <label htmlFor="seed" className={rotulo}>
          Padrão (seed)
          <span className="ml-1 font-normal text-gray-500">— 0 a {SEED_MAX}</span>
        </label>
        <input
          id="seed"
          type="number"
          min="0"
          max={SEED_MAX}
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          className={`${campo} max-w-[160px]`}
        />
        <p className="mt-1 text-xs text-gray-500">
          Define o desenho da textura. Em facas e Case Hardened é o que separa um
          padrão comum de um raro.
        </p>
      </div>

      {/* Etiqueta e StatTrak: so para armas */}
      {!ehLuva && (
        <>
          <div>
            <label htmlFor="nametag" className={rotulo}>
              Etiqueta
              <span className="ml-1 font-normal text-gray-500">
                — até {NAMETAG_MAX} caracteres, opcional
              </span>
            </label>
            <input
              id="nametag"
              type="text"
              maxLength={NAMETAG_MAX}
              value={nametag}
              onChange={(e) => setNametag(e.target.value)}
              placeholder="sem etiqueta"
              className={`${campo} max-w-sm`}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="stattrak"
              type="checkbox"
              checked={stattrak}
              onChange={(e) => setStattrak(e.target.checked)}
              className="h-4 w-4 accent-cyan-500"
            />
            <label htmlFor="stattrak" className="text-sm text-gray-300">
              StatTrak™
              <span className="ml-1 text-gray-500">
                — o contador de mortes é mantido pelo servidor
              </span>
            </label>
          </div>
          <div className="border-t border-gray-800 pt-6">
            <AdesivosEditor
              adesivos={adesivos}
              setAdesivos={setAdesivos}
              chaveiro={chaveiro}
              setChaveiro={setChaveiro}
            />
          </div>
        </>
      )}

      <AvisoErro
        erro={aviso?.tipo === 'desatualizada' ? 'desatualizada' : aviso?.tipo === 'erro' ? aviso.texto : null}
        onFechar={() => setAviso(null)}
      />

      <div className="flex items-center gap-4 border-t border-gray-800 pt-5">
        <button
          type="button"
          onClick={salvar}
          disabled={pendente}
          className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-2 font-bold text-white shadow transition-all hover:from-cyan-400 hover:to-blue-400 disabled:opacity-60"
        >
          {pendente ? 'Salvando...' : 'Salvar'}
        </button>

        {aviso?.tipo === 'ok' && (
          <p role="status" className="text-sm text-cyan-300">
            {aviso.texto}
          </p>
        )}
      </div>
    </div>
  );
}
