import { useEffect } from "react";

const SITE_URL = 'https://productprepa.com';

export type SeoProps = {
  title: string;
  description?: string;
  canonical?: string;
  image?: string;
  imageAlt?: string;
  url?: string;
  ogType?: string;
  siteName?: string;
  twitterSite?: string;
  twitterCreator?: string;
  robots?: string;
  keywords?: string;
  jsonLd?: object | object[];
};

export function Seo({
  title,
  description,
  canonical,
  image,
  imageAlt,
  url,
  ogType,
  siteName = "ProductPrepa",
  twitterSite = "@nicoproducto",
  twitterCreator = "@nicoproducto",
  robots,
  keywords,
  jsonLd
}: SeoProps) {
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
      // Si empieza con /, agregar el dominio completo
      const fullCanonical = canonical.startsWith('http') 
        ? canonical 
        : `${SITE_URL}${canonical}`;
      link.setAttribute('href', fullCanonical);
    }

    // Robots meta tag
    const robotsContent = robots || 'index, follow';
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute('content', robotsContent);

    // OpenGraph meta tags
    const ogTitle = ensureMeta('property', 'og:title');
    const ogDesc = ensureMeta('property', 'og:description');
    const ogImage = ensureMeta('property', 'og:image');
    const ogImageAlt = ensureMeta('property', 'og:image:alt');
    const ogUrl = ensureMeta('property', 'og:url');
    const ogSiteName = ensureMeta('property', 'og:site_name');
    const ogTypeEl = ensureMeta('property', 'og:type');

    if (ogTitle && title) ogTitle.setAttribute('content', title);
    if (ogDesc && description) ogDesc.setAttribute('content', description);
    if (ogImage && image) ogImage.setAttribute('content', image);
    if (ogImageAlt && imageAlt) ogImageAlt.setAttribute('content', imageAlt);
    if (ogUrl && url) ogUrl.setAttribute('content', url);
    if (ogSiteName && siteName) ogSiteName.setAttribute('content', siteName);
    if (ogTypeEl && ogType) ogTypeEl.setAttribute('content', ogType);

    // Twitter Card meta tags
    const twitterTitle = ensureMeta('name', 'twitter:title');
    const twitterDesc = ensureMeta('name', 'twitter:description');
    const twitterImage = ensureMeta('name', 'twitter:image');
    const twitterImageAlt = ensureMeta('name', 'twitter:image:alt');
    const twitterSiteTag = ensureMeta('name', 'twitter:site');
    const twitterCreatorTag = ensureMeta('name', 'twitter:creator');
    
    if (twitterTitle && title) twitterTitle.setAttribute('content', title);
    if (twitterDesc && description) twitterDesc.setAttribute('content', description);
    if (twitterImage && image) twitterImage.setAttribute('content', image);
    if (twitterImageAlt && imageAlt) twitterImageAlt.setAttribute('content', imageAlt);
    if (twitterSiteTag && twitterSite) twitterSiteTag.setAttribute('content', twitterSite);
    if (twitterCreatorTag && twitterCreator) twitterCreatorTag.setAttribute('content', twitterCreator);

    // Meta keywords tag
    if (keywords) {
      let keywordsMeta = document.querySelector('meta[name="keywords"]');
      if (!keywordsMeta) {
        keywordsMeta = document.createElement('meta');
        keywordsMeta.setAttribute('name', 'keywords');
        document.head.appendChild(keywordsMeta);
      }
      keywordsMeta.setAttribute('content', keywords);
    }

    // JSON-LD Schema
    if (jsonLd) {
      // Remove existing schema if present
      const existingScript = document.querySelector('script[data-seo-jsonld]');
      if (existingScript) {
        existingScript.remove();
      }
      
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-jsonld', 'true');
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, canonical, image, imageAlt, url, ogType, siteName, twitterSite, twitterCreator, robots, keywords, jsonLd]);

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
