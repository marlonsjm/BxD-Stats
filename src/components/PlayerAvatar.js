import Image from 'next/image';

// Avatar do jogador com fallback para a inicial do nick quando não há
// imagem (sem STEAM_API_KEY, perfil privado ou erro na API).
export function PlayerAvatar({ src, name, size = 28, className = '' }) {
  if (!src) {
    return (
      <span
        aria-hidden="true"
        style={{ width: size, height: size, fontSize: Math.max(11, size * 0.4) }}
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gray-700 font-bold text-gray-300 ${className}`}
      >
        {(name || '?').charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-full bg-gray-700 ${className}`}
    />
  );
}
