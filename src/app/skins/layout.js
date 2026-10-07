// Layout da area /skins: faixa fixa avisando que as skins daqui so valem na
// LAN. O servidor Online nao tem o plugin WeaponPaints deste banco: usa o
// inventory.cstrike.app, um site externo que nao e nosso. O aviso fica no
// layout para aparecer em todas as telas (grade, escolha, customizacao,
// loadout e login).

import { SeloServidor } from '@/components/SeloServidor';

const SITE_SKINS_ONLINE = 'https://inventory.cstrike.app/';

export default function SkinsLayout({ children }) {
  return (
    <>
      <div className="container pt-6">
        <div
          role="note"
          className="flex flex-col gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/5 px-4 py-3 sm:flex-row sm:items-center sm:gap-3"
        >
          <SeloServidor servidor="lan" className="self-start sm:self-auto" />
          <p className="text-sm text-gray-300">
            Estas skins valem <strong className="text-white">só no servidor LAN</strong>.
            Para o servidor Online, escolha suas skins em{' '}
            <a
              href={SITE_SKINS_ONLINE}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-violet-300 underline decoration-violet-500/50 underline-offset-2 hover:text-violet-200"
            >
              inventory.cstrike.app
              <span className="sr-only"> (abre em nova aba)</span>
            </a>{' '}
            — o que você escolher aqui não aparece lá.
          </p>
        </div>
      </div>
      {children}
    </>
  );
}
