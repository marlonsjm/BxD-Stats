'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, Play } from 'lucide-react';

const Lightbox = ({ item, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Visualização de mídia"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh] w-full p-4" onClick={e => e.stopPropagation()}>
        {item.type === 'image' ? (
          <Image
            src={item.src}
            alt={item.alt}
            width={item.width}
            height={item.height}
            sizes="100vw"
            className="w-full h-full max-h-[85vh] object-contain"
          />
        ) : (
          <video controls autoPlay playsInline className="w-full h-full max-h-[85vh]">
            <source src={item.src} type="video/mp4" />
            Seu navegador não suporta a reprodução de vídeo.
          </video>
        )}
      </div>
      <button
        onClick={onClose}
        aria-label="Fechar visualização"
        className="absolute top-3 right-3 flex h-11 w-11 items-center justify-center text-white bg-black/50 rounded-full hover:bg-black"
      >
        <X size={24} aria-hidden="true" />
      </button>
    </div>
  );
};

export function GalleryGrid({ items }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const closeLightbox = useCallback(() => setSelectedItem(null), []);

  if (items.length === 0) {
    return <p className="text-center text-gray-400 py-12">Nenhuma imagem encontrada na galeria.</p>;
  }

  return (
    <>
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {items.map((item) => (
          <button
            key={item.src}
            type="button"
            onClick={() => setSelectedItem(item)}
            aria-label={item.type === 'video' ? `Reproduzir vídeo: ${item.alt}` : `Ampliar imagem: ${item.alt}`}
            className="relative block w-full overflow-hidden rounded-lg cursor-pointer group focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            <Image
              src={item.thumbnail || item.src}
              alt={item.alt}
              width={item.width}
              height={item.height}
              sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
              className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {item.type === 'video' && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Play aria-hidden="true" className="h-12 w-12 text-white/90" fill="currentColor" />
              </span>
            )}
          </button>
        ))}
      </div>

      {selectedItem && <Lightbox item={selectedItem} onClose={closeLightbox} />}
    </>
  );
}
