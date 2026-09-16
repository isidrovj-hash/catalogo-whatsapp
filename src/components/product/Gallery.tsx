'use client';

import { useState } from 'react';

interface GalleryImage {
  url: string;
  altText: string | null;
}

export function Gallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-surface-sunken text-sm text-ink-soft/50">
        Sin imagen disponible
      </div>
    );
  }

  // Ya se validó arriba que `images.length > 0`, así que `images[0]` siempre
  // existe en tiempo de ejecución; el "!" es necesario porque
  // `noUncheckedIndexedAccess` (tsconfig) no puede inferir eso solo del
  // `return` anterior basado en `.length`.
  const active = images[activeIndex] ?? images[0]!;

  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-lg bg-surface-sunken">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={active.url} alt={active.altText ?? productName} className="h-full w-full object-cover" />
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image.url + index}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded border-2 transition-colors ${
                index === activeIndex ? 'border-brand' : 'border-transparent'
              }`}
              aria-label={`Ver imagen ${index + 1} de ${productName}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
