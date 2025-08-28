import { Breadcrumbs } from "@/components/Breadcrumbs";
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

// Sample data - in a real app, this would come from a CMS or database
const galleryItems = [
  { type: 'image', src: 'https://picsum.photos/seed/10/800/1200', alt: 'Highlight 1' },
  { type: 'image', src: 'https://picsum.photos/seed/11/800/600', alt: 'Highlight 2' },
  { type: 'video', src: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4', thumbnail: 'https://picsum.photos/seed/12/800/450' },
  { type: 'image', src: 'https://picsum.photos/seed/13/800/800', alt: 'Highlight 3' },
  { type: 'image', src: 'https://picsum.photos/seed/14/800/1000', alt: 'Highlight 4' },
  { type: 'image', src: 'https://picsum.photos/seed/15/800/700', alt: 'Highlight 5' },
];

const Lightbox = ({ item, onClose }) => (
  <div 
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    onClick={onClose}
  >
    <div className="relative max-w-4xl max-h-[90vh] w-full p-4" onClick={e => e.stopPropagation()}>
      {item.type === 'image' ? (
        <Image src={item.src} alt={item.alt} width={1600} height={1200} className="w-full h-full object-contain" />
      ) : (
        <video controls autoPlay className="w-full h-full">
          <source src={item.src} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
    </div>
    <button 
      onClick={onClose} 
      className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black"
    >
      <X size={24} />
    </button>
  </div>
);

export default function GalleryPage() {
  const [selectedItem, setSelectedItem] = useState(null);

  const breadcrumbItems = [
    { href: "/", label: "Home" },
    { label: "Galeria" },
  ];

  return (
    <main className="bg-gray-900 text-white min-h-screen p-4 md:p-8">
      <div className="container mx-auto">
        <Breadcrumbs items={breadcrumbItems} />
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold">Galeria da Comunidade</h1>
          <p className="text-gray-400 mt-2">Os melhores momentos das nossas partidas.</p>
        </header>

        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {galleryItems.map((item, index) => (
            <div key={index} className="overflow-hidden rounded-lg cursor-pointer group" onClick={() => setSelectedItem(item)}>
              {item.type === 'image' ? (
                <Image 
                  src={item.src} 
                  alt={item.alt} 
                  width={800} 
                  height={800} 
                  className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="relative">
                  <Image 
                    src={item.thumbnail} 
                    alt="Video thumbnail" 
                    width={800} 
                    height={450} 
                    className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <svg className="w-16 h-16 text-white/80" fill="currentColor" viewBox="0 0 20 20"><path d="M8 5.25a.75.75 0 011.5 0v9.5a.75.75 0 01-1.5 0V5.25zM4.5 8.25a.75.75 0 01.75-.75h9.5a.75.75 0 010 1.5h-9.5a.75.75 0 01-.75-.75z"></path></svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {selectedItem && <Lightbox item={selectedItem} onClose={() => setSelectedItem(null)} />}
      </div>
    </main>
  );
}
