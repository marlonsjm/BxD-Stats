
import { Breadcrumbs } from "@/components/Breadcrumbs";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getKillsRanking, getHeadshotRankings, getClutchRankings, getEntryFragRankings, getMultiKillRankings, getADRRanking, getAccuracyRanking, getMinimosRanking } from "@/lib/rankings";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MetricHeader } from "@/components/MetricHeader";
import { rota } from "@/lib/servidores";

export const revalidate = 300;

export const metadata = {
  title: "Rankings Detalhados",
  description: "Classificações de jogadores de CS2 por kills, headshots, clutches, entry frags, dano e precisão.",
};

const RANK_COLORS = {
  1: 'text-yellow-400',
  2: 'text-gray-300',
  3: 'text-orange-400',
};

function SemDados() {
  return <p className="px-6 pb-6 md:p-0 text-sm text-gray-400">Ainda não há dados suficientes neste servidor.</p>;
}

function RankingTable({ servidor, id, title, description, data, columnHeader, columnDescription }) {
  return (
    <Card id={id} className="bg-gray-800 border-gray-700 text-white rounded-lg scroll-mt-20">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">{title}</CardTitle>
        {description && <p className="text-gray-400 text-sm mt-2">{description}</p>}
      </CardHeader>
      <CardContent className="p-0 md:p-6">
        {data.length === 0 ? <SemDados /> : (
        <table className="min-w-full text-sm responsive-table stats-table">
          <caption className="sr-only">{title}</caption>
          <thead className="bg-gray-900">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-16">Rank</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Jogador</th>
              <MetricHeader
                label={columnHeader}
                description={columnDescription}
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider"
              />
            </tr>
          </thead>
          <tbody className="bg-gray-800">
            {data.map((player) => (
              <tr key={player.rank}>
                <td data-label="Rank" className={`px-4 py-3 font-bold ${RANK_COLORS[player.rank] || 'text-gray-400'}`}>#{player.rank}</td>
                <td data-label="Jogador" className="px-4 py-3 md:text-left">
                  <Link href={rota(servidor, `/player/${player.steamid64}`)} className="inline-flex items-center font-medium text-white hover:underline">
                    {player.name}
                  </Link>
                </td>
                <td data-label={columnHeader} className="px-4 py-3 font-bold font-mono tabular-nums md:text-right">{player.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </CardContent>
    </Card>
  );
}

function MultiKillTable({ servidor, data }) {
  return (
    <Card id="multikills" className="bg-gray-800 border-gray-700 text-white rounded-lg scroll-mt-20">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">Top Multi-Kills</CardTitle>
        <p className="text-gray-400 text-sm mt-2">Jogadores com mais rounds de alto impacto (3K, 4K e ACE).</p>
      </CardHeader>
      <CardContent className="p-0 md:p-6">
        {data.length === 0 ? <SemDados /> : (
        <table className="min-w-full text-sm responsive-table stats-table">
          <caption className="sr-only">Ranking de multi-kills (3K, 4K e ACE).</caption>
          <thead className="bg-gray-900">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-16">Rank</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Jogador</th>
              <MetricHeader label="Total" description="Total de rounds com 3K, 4K ou 5K" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" />
              <MetricHeader label="3K" description="Rounds com 3 kills" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" />
              <MetricHeader label="4K" description="Rounds com 4 kills" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" />
              <MetricHeader label="ACE" description="Rounds com 5 kills (ace)" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" />
            </tr>
          </thead>
          <tbody className="bg-gray-800">
            {data.map((player) => (
              <tr key={player.rank}>
                <td data-label="Rank" className={`px-4 py-3 font-bold ${RANK_COLORS[player.rank] || 'text-gray-400'}`}>#{player.rank}</td>
                <td data-label="Jogador" className="px-4 py-3 text-left">
                  <Link href={rota(servidor, `/player/${player.steamid64}`)} className="inline-flex items-center font-medium text-white hover:underline">
                    {player.name}
                  </Link>
                </td>
                <td data-label="Total" className="px-4 py-3 font-bold font-mono tabular-nums md:text-right">{player.value}</td>
                <td data-label="3K" className="px-4 py-3 text-yellow-400 font-mono tabular-nums md:text-right">{player.enemy3ks}</td>
                <td data-label="4K" className="px-4 py-3 text-orange-400 font-mono tabular-nums md:text-right">{player.enemy4ks}</td>
                <td data-label="ACE" className="px-4 py-3 text-red-400 font-bold font-mono tabular-nums md:text-right">{player.enemy5ks}</td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </CardContent>
    </Card>
  );
}

function KillsTable({ servidor, data }) {
  return (
    <Card id="kills" className="bg-gray-800 border-gray-700 text-white rounded-lg scroll-mt-20">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">Ranking Geral (Kills)</CardTitle>
        <p className="text-gray-400 text-sm mt-2">Jogadores com mais abates acumulados em todas as partidas do servidor.</p>
      </CardHeader>
      <CardContent className="p-0 md:p-6">
        <table className="min-w-full text-sm responsive-table stats-table">
          <caption className="sr-only">Ranking geral por kills.</caption>
          <thead className="bg-gray-900">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-16">Rank</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Jogador</th>
              <MetricHeader label="Kills" description="Total de abates" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" />
              <MetricHeader label="Deaths" description="Total de mortes" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" />
              <MetricHeader label="+/-" description="Diferença entre abates e mortes" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" />
              <MetricHeader label="KDR" description="Razão entre kills e deaths" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" />
              <MetricHeader label="Mapas" description="Total de mapas jogados" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" />
            </tr>
          </thead>
          <tbody className="bg-gray-800">
            {data.map((player) => (
              <tr key={player.rank}>
                <td data-label="Rank" className={`px-4 py-3 font-bold ${RANK_COLORS[player.rank] || 'text-gray-400'}`}>#{player.rank}</td>
                <td data-label="Jogador" className="px-4 py-3 text-left">
                  <Link href={rota(servidor, `/player/${player.steamid64}`)} className="inline-flex items-center font-medium text-white hover:underline">
                    {player.name}
                  </Link>
                </td>
                <td data-label="Kills" className="px-4 py-3 font-bold font-mono tabular-nums text-green-400 md:text-right">{player.kills}</td>
                <td data-label="Deaths" className="px-4 py-3 text-red-400 font-mono tabular-nums md:text-right">{player.deaths}</td>
                <td data-label="+/-" className={`px-4 py-3 font-mono tabular-nums md:text-right ${player.diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {player.diff >= 0 ? `+${player.diff}` : player.diff}
                </td>
                <td data-label="KDR" className="px-4 py-3 font-mono tabular-nums md:text-right">{player.kdr}</td>
                <td data-label="Mapas" className="px-4 py-3 font-mono tabular-nums text-gray-400 md:text-right">{player.maps}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

export default async function RankingsPage({ params }) {
  const { servidor } = await params;
  const [killsRanking, headshotRankings, clutchRankings, entryFragRankings, multiKillRankings, adrRanking, accuracyRanking, minimos] = await Promise.all([
    getKillsRanking(servidor),
    getHeadshotRankings(servidor),
    getClutchRankings(servidor),
    getEntryFragRankings(servidor),
    getMultiKillRankings(servidor),
    getADRRanking(servidor),
    getAccuracyRanking(servidor),
    getMinimosRanking(servidor),
  ]);

  // Mostra o minimo que de fato vale (ver getMinimosRanking): num servidor com
  // poucas partidas ele fica abaixo do padrao, e a descricao avisa.
  const minimo = (chave) => {
    const { valor, unidade, reduzido } = minimos[chave];
    return `(Mínimo de ${valor} ${unidade}${reduzido ? ' — reduzido enquanto o servidor tem poucas partidas' : ''}.)`;
  };

  const breadcrumbItems = [
    { href: rota(servidor), label: "Home" },
    { label: "Rankings" },
  ];

  const metricDescriptions = {
    "HS %": `Percentual de abates que foram headshots. ${minimo('headshots')}`,
    "Clutches Won": "Total de rounds vencidos em uma situação de 1 contra X inimigos.",
    "Entry Success Rate": `Percentual de sucesso ao conseguir o primeiro abate para o time no round. ${minimo('entries')}`,
    "ADR": `Dano médio causado por round jogado. ${minimo('adr')}`,
    "Precisão": `Percentual de tiros que acertaram o alvo. ${minimo('precisao')}`,
  };

  const sections = [
    { id: "kills", label: "Kills" },
    { id: "multikills", label: "Multi-Kills" },
    { id: "headshots", label: "Headshots" },
    { id: "clutches", label: "Clutches" },
    { id: "entries", label: "Entry Frags" },
    { id: "adr", label: "Dano" },
    { id: "precisao", label: "Precisão" },
  ];

  return (
    <TooltipProvider>
      <div className="container mx-auto py-4 md:py-8 text-white">
        <Breadcrumbs items={breadcrumbItems} servidor={servidor} />
        <header className="mb-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold">Rankings Detalhados</h1>
          <p className="text-gray-400 mt-2">Explore as classificações de jogadores por categorias específicas.</p>
          <p className="text-xs text-gray-500 mt-1">Dados atualizados automaticamente a cada 5 minutos.</p>
        </header>

        <nav aria-label="Categorias de ranking" className="mb-8 flex flex-wrap justify-center gap-2">
          {sections.map(section => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="inline-flex items-center min-h-[40px] rounded-full bg-gray-800 px-4 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
            >
              {section.label}
            </a>
          ))}
        </nav>

        <div className="space-y-8">
          <KillsTable servidor={servidor} data={killsRanking} />
          <MultiKillTable servidor={servidor} data={multiKillRankings} />
          {/* Tabelas de 3 colunas lado a lado em telas grandes: evita colunas esticadas e reduz o scroll pela metade */}
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <RankingTable servidor={servidor} id="headshots" title="Top Headshots" data={headshotRankings} columnHeader="HS %" columnDescription={metricDescriptions["HS %"]} />
            <RankingTable servidor={servidor} id="clutches" title="Top Clutches (1vX)" data={clutchRankings} columnHeader="Clutches Won" columnDescription={metricDescriptions["Clutches Won"]} />
            <RankingTable servidor={servidor} id="entries" title="Top Entry Fraggers" data={entryFragRankings} columnHeader="Entry Success Rate" columnDescription={metricDescriptions["Entry Success Rate"]} />
            <RankingTable servidor={servidor} id="adr" title="Top ADR (Dano por Round)" data={adrRanking} columnHeader="ADR" columnDescription={metricDescriptions["ADR"]} />
            <RankingTable servidor={servidor} id="precisao" title="Top Precisão" data={accuracyRanking} columnHeader="Precisão" columnDescription={metricDescriptions["Precisão"]} />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
