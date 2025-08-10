import { useEffect } from "react";

export type SeoProps = {
  title: string;
  description?: string;
  canonical?: string;
};

export function Seo({ title, description, canonical }: SeoProps) {
  useEffect(() => {
    if (title) document.title = title;

    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', description);
    }

    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonical);
    }

    // Basic Open Graph sync
    const ogTitle = ensureMeta('property', 'og:title');
    const ogDesc = ensureMeta('property', 'og:description');
    if (ogTitle && title) ogTitle.setAttribute('content', title);
    if (ogDesc && description) ogDesc.setAttribute('content', description);
  }, [title, description, canonical]);

  return null;
}

function ensureMeta(attr: 'name' | 'property', key: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  return el as HTMLMetaElement;
}
