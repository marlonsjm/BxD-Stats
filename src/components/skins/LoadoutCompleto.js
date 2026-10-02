// Visualizacao do loadout dos dois lados.
//
// Compartilhado por /skins/loadout (onde vem acompanhado dos botoes de copiar)
// e por /profile (so leitura). Server component: nao custa JS no cliente.
//
// Os itens ja chegam prontos de montarItensDoLoadout(), em src/lib/skins/loadout.js.

import Link from 'next/link';
import { TEAM_CT, TEAM_T } from '@/lib/skins/times';
import {
  imagemAdesivo,
  imagemChaveiro,
  parseAdesivo,
  parseChaveiro,
} from '@/lib/skins/adesivos';

// Adesivos, chaveiro, etiqueta e StatTrak de uma skin — so aparecem se existirem.
function Extras({ linha }) {
  if (!linha) return null;

  const adesivos = Array.from({ length: 5 }, (_, i) =>
    parseAdesivo(linha[`weapon_sticker_${i}`])
  ).filter((a) => a.id > 0);
  const chaveiro = parseChaveiro(linha.weapon_keychain);

  const etiquetas = [];
  if (linha.weapon_stattrak) {
    etiquetas.push(`StatTrak™ ${linha.weapon_stattrak_count ?? 0}`);
  }
  if (linha.weapon_nametag) etiquetas.push(`"${linha.weapon_nametag}"`);

  if (adesivos.length === 0 && chaveiro.id === 0 && etiquetas.length === 0) return null;

  return (
    <span className="mt-1 flex flex-wrap items-center gap-2">
      {etiquetas.map((t) => (
        <span
          key={t}
          className="rounded bg-gray-700/60 px-1.5 py-0.5 text-[10px] text-gray-300"
        >
          {t}
        </span>
      ))}
      {adesivos.map((a, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={imagemAdesivo(a.id)}
          alt=""
          title={`Adesivo ${a.id}`}
          className="h-5 w-5 object-contain"
        />
      ))}
      {chaveiro.id > 0 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imagemChaveiro(chaveiro.id)}
          alt=""
          title="Chaveiro"
          className="h-5 w-5 object-contain"
        />
      )}
    </span>
  );
}

const GRUPOS = ['Faca', 'Luvas', 'Agente', 'Música', 'Armas'];

function ColunaTime({ team, itens }) {
  const lado = team === TEAM_CT ? 'CT' : 'TR';

  return (
    <section className="rounded-lg border border-gray-700 bg-gray-800/30 p-5">
      <h3 className="mb-4 font-orbitron text-xl font-bold text-white">
        {lado}
        <span className="ml-2 text-sm font-normal text-gray-500">
          {itens.length} {itens.length === 1 ? 'item' : 'itens'}
        </span>
      </h3>

      {itens.length === 0 ? (
        <p className="rounded-md border border-dashed border-gray-700 p-6 text-center text-sm text-gray-500">
          Nada equipado neste lado.
        </p>
      ) : (
        GRUPOS.map((grupo) => {
          const doGrupo = itens.filter((i) => i.grupo === grupo);
          if (doGrupo.length === 0) return null;

          return (
            <div key={grupo} className="mb-5 last:mb-0">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                {grupo}
              </p>
              <ul className="space-y-2">
                {doGrupo.map((item, i) => (
                  <li key={`${item.titulo}-${i}`}>
                    <Link
                      href={item.href}
                      className="flex items-start gap-3 rounded-md border border-gray-700/60 bg-gray-800/40 p-2 transition-colors hover:border-gray-500"
                    >
                      <span className="flex h-12 w-16 shrink-0 items-center justify-center">
                        {item.imagem ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imagem}
                            alt=""
                            loading="lazy"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-[10px] text-gray-600">—</span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-white">
                          {item.titulo}
                        </span>
                        {item.subtitulo && (
                          <span className="block truncate text-xs text-cyan-400">
                            {item.subtitulo}
                          </span>
                        )}
                        <Extras linha={item.detalhe} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })
      )}
    </section>
  );
}

export function LoadoutCompleto({ tr, ct }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ColunaTime team={TEAM_T} itens={tr} />
      <ColunaTime team={TEAM_CT} itens={ct} />
    </div>
  );
}
