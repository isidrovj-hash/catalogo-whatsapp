import type { Banner } from '@prisma/client';

export function BannerStrip({ banners }: { banners: Banner[] }) {
  if (banners.length === 0) return null;

  return (
    <section className="container-app py-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {banners.map((banner) => {
          const content = (
            <div className="flex min-h-[100px] flex-col justify-center rounded-lg bg-ink px-6 py-5 text-white">
              <p className="font-display text-xl">{banner.title}</p>
              {banner.subtitle && <p className="mt-1 text-sm text-white/80">{banner.subtitle}</p>}
            </div>
          );
          return banner.linkUrl ? (
            <a key={banner.id} href={banner.linkUrl}>
              {content}
            </a>
          ) : (
            <div key={banner.id}>{content}</div>
          );
        })}
      </div>
    </section>
  );
}
