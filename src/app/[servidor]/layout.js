import { notFound } from 'next/navigation';
import { IDS_SERVIDORES, SERVIDORES, isServidor } from '@/lib/servidores';
import { LembrarServidor } from '@/components/SeletorServidor';

// Gera as paginas estaticas (ISR) dos dois servidores no build.
export function generateStaticParams() {
  return IDS_SERVIDORES.map((servidor) => ({ servidor }));
}

// O servidor entra no titulo da aba: "Rankings Detalhados · Online | BxD Stats".
export async function generateMetadata({ params }) {
  const { servidor } = await params;
  if (!isServidor(servidor)) return {};
  const { label } = SERVIDORES[servidor];
  return {
    title: {
      default: `BxD Stats · ${label}`,
      template: `%s · ${label} | BxD Stats`,
    },
  };
}

export default async function ServidorLayout({ children, params }) {
  const { servidor } = await params;
  if (!isServidor(servidor)) notFound();
  return (
    <>
      <LembrarServidor servidor={servidor} />
      {children}
    </>
  );
}
