import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getStats } from "@/lib/stats";
import { rota } from "@/lib/servidores";
import Link from "next/link";

export const revalidate = 300;

export const metadata = {
  title: "Mapas Jogados",
  description: "Visão geral de todos os mapas de CS2 jogados no servidor BxD.",
};

async function getMapStats(servidor) {
  const { mapasFinalizados } = await getStats(servidor);
  const contagem = new Map();
  mapasFinalizados.forEach(m => contagem.set(m.mapname, (contagem.get(m.mapname) || 0) + 1));
  return [...contagem]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export default async function MapsPage({ params }) {
  const { servidor } = await params;
  const maps = await getMapStats(servidor);

  const breadcrumbItems = [
    { href: rota(servidor), label: "Home" },
    { label: "Mapas" },
  ];

  return (
    <div className="text-white py-4 md:py-8">
      <div className="container mx-auto">
        <Breadcrumbs items={breadcrumbItems} servidor={servidor} />
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold">Mapas Jogados</h1>
          <p className="text-gray-400 mt-2">Visão geral de todos os mapas em nossa rotação.</p>
        </header>

        {maps.length === 0 ? (
          <p className="text-center text-gray-400 py-12">Nenhum mapa jogado ainda.</p>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {maps.map((map) => (
            <Link href={rota(servidor, `/map/${map.name}`)} key={map.name} className="block group">
              <div className="bg-gray-800 rounded-lg shadow-lg p-4 md:p-6 h-full flex flex-col justify-between transition-colors group-hover:bg-gray-700/50">
                <h2 className="text-xl md:text-2xl font-bold capitalize text-white truncate">
                  {map.name.replace(/de_|cs_/, "")}
                </h2>
                <p className="text-sm md:text-base text-gray-400">
                  Jogado {map.count} {map.count > 1 ? 'vezes' : 'vez'}
                </p>
              </div>
            </Link>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}