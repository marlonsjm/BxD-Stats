// Faixa de contexto no topo de /skins.
//
// Por que existe: a grade mostra "Equipado" so dentro da categoria aberta.
// Escolhendo um rifle, o jogador nao ve qual faca, luva, agente ou musica tem
// — teria de sair clicando nas abas. Estes quatro sao unicos por time, entao
// cabem numa linha.
//
// As armas nao entram aqui de proposito: sao ate ~20 por lado e empurrariam a
// grade para fora da tela. Viram contagem, com link para o loadout completo.

import Link from 'next/link';

export function ResumoLoadout({ resumo, teamSlug, lado }) {
  const { itens, armasComSkin } = resumo;
  const vazio = itens.every((i) => !i.nome) && armasComSkin === 0;

  return (
    <section
      aria-label={`Resumo do loadout do lado ${lado}`}
      className="rounded-lg border border-gray-700 bg-gray-800/30 p-4"
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
          Seu loadout no {lado}
        </p>
        <Link
          href="/skins/loadout"
          className="text-xs text-cyan-400 hover:text-cyan-300"
        >
          ver os dois lados &rarr;
        </Link>
      </div>

      {vazio ? (
        <p className="text-sm text-gray-500">
          Nada equipado neste lado ainda. Escolha abaixo.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
          {itens.map((item) => (
            <li key={item.chave}>
              <Link
                href={`/skins?team=${teamSlug}&cat=${item.chave}`}
                title={item.nome ? `${item.rotulo}: ${item.nome}` : `Escolher ${item.rotulo.toLowerCase()}`}
                className={`flex h-full items-center gap-2 rounded-md border p-2 transition-colors ${
                  item.nome
                    ? 'border-gray-700 bg-gray-800/50 hover:border-cyan-600'
                    : 'border-dashed border-gray-700/70 hover:border-gray-500'
                }`}
              >
                <span className="flex h-9 w-12 shrink-0 items-center justify-center">
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
                  <span className="block text-[10px] uppercase tracking-wide text-gray-500">
                    {item.rotulo}
                  </span>
                  <span
                    className={`block truncate text-xs ${item.nome ? 'text-white' : 'text-gray-600'}`}
                  >
                    {item.nome ?? 'nenhum'}
                  </span>
                  {item.detalhe && (
                    <span className="block truncate text-[10px] text-cyan-400">
                      {item.detalhe}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}

          <li className="col-span-2 sm:col-span-4 lg:col-span-1">
            <Link
              href="/skins/loadout"
              className="flex h-full items-center justify-center rounded-md border border-gray-700 bg-gray-800/50 p-2 text-center transition-colors hover:border-cyan-600"
            >
              <span>
                <span className="block font-orbitron text-lg text-white">
                  {armasComSkin}
                </span>
                <span className="block text-[10px] uppercase tracking-wide text-gray-500">
                  {armasComSkin === 1 ? 'arma com skin' : 'armas com skin'}
                </span>
              </span>
            </Link>
          </li>
        </ul>
      )}
    </section>
  );
}
