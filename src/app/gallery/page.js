import { Breadcrumbs } from "@/components/Breadcrumbs";
import { GalleryGrid } from "@/components/GalleryGrid";
import { getCloudinaryImages } from './actions';

export const revalidate = 300;

export const metadata = {
  title: "Galeria da Comunidade",
};

export default async function GalleryPage() {
  const galleryItems = await getCloudinaryImages();

  const breadcrumbItems = [
    { href: "/", label: "Home" },
    { label: "Galeria" },
  ];

  return (
    <div className="text-white py-4 md:py-8">
      <div className="container mx-auto">
        <Breadcrumbs items={breadcrumbItems} />
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold">Galeria da Comunidade</h1>
          <p className="text-gray-400 mt-2">Os melhores momentos das nossas partidas.</p>
        </header>

        <GalleryGrid items={galleryItems} />
      </div>
    </div>
  );
}
