'use client';

// Copiar o loadout de um lado para o outro.
//
// A acao APAGA tudo do time de destino antes de copiar, entao pede confirmacao
// explicita, dizendo o que vai ser sobrescrito. Nada de window.confirm: fica
// dentro do layout e diz exatamente o que acontece.

import { useState, useTransition } from 'react';
import { copiarLoadout } from '@/app/skins/actions';
import { AvisoErro, ehActionDesatualizada } from '@/components/skins/AvisoErro';
import { TEAM_CT, TEAM_T } from '@/lib/skins/times';

const NOME = { [TEAM_T]: 'TR', [TEAM_CT]: 'CT' };

export function CopiarLoadout({ itensPorTime }) {
  const [pendente, startTransition] = useTransition();
  const [confirmando, setConfirmando] = useState(null); // { de, para }
  const [erro, setErro] = useState(null);
  const [ok, setOk] = useState(null);

  const copiar = (de, para) => {
    setErro(null);
    setOk(null);
    setConfirmando(null);

    startTransition(async () => {
      try {
        const r = await copiarLoadout({ de, para });
        if (r?.ok) setOk(`Loadout do ${NOME[de]} copiado para o ${NOME[para]}.`);
        else setErro(r?.erro ?? 'Não foi possível copiar.');
      } catch (e) {
        setErro(ehActionDesatualizada(e) ? 'desatualizada' : 'Não foi possível copiar.');
      }
    });
  };

  const botao =
    'rounded-full border border-gray-700 px-4 py-2 text-sm text-gray-300 transition-colors hover:border-cyan-500 hover:text-cyan-300 disabled:opacity-50';

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/40 p-5">
      <p className="mb-1 text-sm font-medium text-gray-300">Copiar entre os lados</p>
      <p className="mb-4 text-xs text-gray-500">
        Leva skins, faca, luvas, agente e música de um lado para o outro.
        Pinos não são copiados.
      </p>

      <AvisoErro erro={erro} onFechar={() => setErro(null)} />

      {ok && (
        <p role="status" className="mb-4 text-sm text-cyan-300">
          {ok} Reconecte ao servidor para ver no jogo.
        </p>
      )}

      {confirmando ? (
        <div className="rounded-md border border-amber-700/60 bg-amber-950/40 p-4">
          <p className="text-sm text-amber-200">
            Isto <strong>apaga</strong> o loadout do{' '}
            <strong>{NOME[confirmando.para]}</strong>
            {itensPorTime?.[confirmando.para] > 0
              ? ` (${itensPorTime[confirmando.para]} ${itensPorTime[confirmando.para] === 1 ? 'item' : 'itens'})`
              : ' (que está vazio)'}{' '}
            e o substitui pelo do <strong>{NOME[confirmando.de]}</strong>. Não dá
            para desfazer.
          </p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              disabled={pendente}
              onClick={() => copiar(confirmando.de, confirmando.para)}
              className="rounded-full bg-amber-500/20 px-4 py-1.5 text-sm font-bold text-amber-100 ring-1 ring-amber-500/40 transition-colors hover:bg-amber-500/30 disabled:opacity-50"
            >
              {pendente ? 'Copiando...' : 'Confirmar'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(null)}
              className="text-sm text-gray-400 hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={pendente}
            onClick={() => setConfirmando({ de: TEAM_T, para: TEAM_CT })}
            className={botao}
          >
            TR &rarr; CT
          </button>
          <button
            type="button"
            disabled={pendente}
            onClick={() => setConfirmando({ de: TEAM_CT, para: TEAM_T })}
            className={botao}
          >
            CT &rarr; TR
          </button>
        </div>
      )}
    </div>
  );
}
