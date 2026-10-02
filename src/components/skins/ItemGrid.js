'use client';

// Grade de itens do loadout.
//
// Dois modos, decididos por item:
//   - item.href    -> navega (ex.: da grade de armas para as skins daquela arma)
//   - item.payload -> salva na hora, chamando a server action
//
// Feedback otimista: o card clicado ja aparece como equipado enquanto a
// gravacao acontece. Se der erro, volta ao estado anterior e mostra o aviso —
// nada de "salvo!" para algo que nao salvou.

import { useMemo, useState, useTransition } from 'react';
import { aplicarEscolha } from '@/app/skins/actions';
import { ItemCard } from '@/components/skins/ItemCard';
import { AvisoErro, ehActionDesatualizada } from '@/components/skins/AvisoErro';

export function ItemGrid({ items, filtravel = false, vazio = 'Nada por aqui.' }) {
  const [pendente, startTransition] = useTransition();
  const [otimista, setOtimista] = useState(null); // key escolhida mas ainda gravando
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState('');

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return items;
    return items.filter((i) =>
      `${i.label} ${i.sublabel ?? ''}`.toLowerCase().includes(termo)
    );
  }, [items, busca]);

  const escolher = (item) => {
    if (pendente) return;

    const anterior = otimista;
    setOtimista(item.key);
    setErro(null);

    startTransition(async () => {
      try {
        const r = await aplicarEscolha(item.payload);
        if (!r?.ok) {
          setOtimista(anterior);
          setErro(r?.erro ?? 'Não foi possível salvar.');
        }
      } catch (e) {
        // Acontece quando o site foi atualizado com esta aba aberta: o id da
        // server action muda a cada build, e o servidor novo nao reconhece o
        // que o JS antigo manda. Recarregar resolve.
        setOtimista(anterior);
        setErro(
          ehActionDesatualizada(e)
            ? 'desatualizada'
            : 'Não foi possível salvar. Tente de novo.'
        );
      }
    });
  };

  // Enquanto ha uma escolha otimista, ela e a unica equipada da grade.
  const estaEquipado = (item) =>
    otimista !== null ? item.key === otimista : Boolean(item.equipped);

  return (
    <div>
      {filtravel && items.length > 12 && (
        <div className="mb-4">
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={`Filtrar ${items.length} itens...`}
            aria-label="Filtrar itens"
            className="w-full max-w-sm rounded-md border border-gray-700 bg-gray-800/60 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      )}

      <AvisoErro erro={erro} onFechar={() => setErro(null)} />

      {visiveis.length === 0 ? (
        <p className="rounded-lg border border-gray-700 bg-gray-800/50 p-8 text-center text-gray-400">
          {busca ? `Nada encontrado para "${busca}".` : vazio}
        </p>
      ) : (
        <ul
          className={`grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 ${
            pendente ? 'pointer-events-none opacity-70' : ''
          }`}
        >
          {visiveis.map((item) => (
            <li key={item.key}>
              <ItemCard
                href={item.href}
                image={item.image}
                label={item.label}
                sublabel={item.sublabel}
                badge={item.badge}
                equipped={estaEquipado(item)}
                onSelect={item.payload ? () => escolher(item) : undefined}
                salvando={pendente && otimista === item.key}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
