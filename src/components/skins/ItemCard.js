// Card de um item do loadout (arma, skin, luva, agente ou kit de musica).
//
// Tres formas, conforme as props:
//   href     -> link (navega para a tela seguinte)
//   onSelect -> botao (escolhe o item na hora)
//   nenhum   -> estatico
//
// Nao tem 'use client': e o ItemGrid que carrega o estado. Assim o card tambem
// pode ser renderizado no servidor em telas sem interacao.

import Link from 'next/link';

function Conteudo({ image, label, sublabel, badge, equipped, salvando }) {
  return (
    <>
      {/* Altura fixa para a grade nao "dancar" entre itens de proporcoes
          diferentes (faca vs AWP). */}
      <div className="relative flex h-24 w-full items-center justify-center px-2">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            loading="lazy"
            className="max-h-full max-w-full object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <span className="text-xs text-gray-600">sem imagem</span>
        )}

        {salvando ? (
          <span className="absolute right-0 top-0 rounded-full bg-gray-700/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-200">
            Salvando
          </span>
        ) : (
          equipped && (
            <span
              className="absolute right-0 top-0 rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-300 ring-1 ring-cyan-500/40"
              title="Equipado"
            >
              Equipado
            </span>
          )
        )}
      </div>

      <div className="mt-3 w-full">
        <p className="truncate text-sm font-medium text-white" title={label}>
          {label}
        </p>
        {sublabel && (
          <p
            className={`truncate text-xs ${equipped ? 'text-cyan-400' : 'text-gray-500'}`}
            title={sublabel}
          >
            {sublabel}
          </p>
        )}
        {badge && <p className="mt-1 text-[11px] text-gray-600">{badge}</p>}
      </div>
    </>
  );
}

export function ItemCard({
  href,
  onSelect,
  image,
  label,
  sublabel,
  badge,
  equipped = false,
  salvando = false,
}) {
  const classe = `group flex w-full flex-col items-center rounded-lg border bg-gray-800/50 p-3 text-center transition-colors ${
    equipped
      ? 'border-cyan-600/60 hover:border-cyan-400'
      : 'border-gray-700 hover:border-gray-500'
  }`;

  const conteudo = (
    <Conteudo
      image={image}
      label={label}
      sublabel={sublabel}
      badge={badge}
      equipped={equipped}
      salvando={salvando}
    />
  );

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={equipped}
        className={`${classe} hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400`}
      >
        {conteudo}
      </button>
    );
  }

  if (href) {
    return (
      <Link href={href} className={`${classe} hover:bg-gray-800`}>
        {conteudo}
      </Link>
    );
  }

  return <div className={classe}>{conteudo}</div>;
}
