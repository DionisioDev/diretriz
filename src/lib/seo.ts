/**
 * seo — builder de metadados por página.
 * Consumido pelo layout Base.astro.
 */

import type { Locale } from './i18n';

export interface SeoInput {
  title: string;
  description: string;
  locale: Locale;
  path: string;
  ogImage?: string;
}

export interface SeoOutput {
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  locale: string;
  alternates: Array<{ hreflang: string; href: string }>;
}

const SITE_URL = 'https://diretriztecnologia.com.br';
const DEFAULT_OG = '/og/default.png';

const localeToHreflang: Record<Locale, string> = {
  pt: 'pt-BR',
  en: 'en-US',
};

export function buildSeo(input: SeoInput): SeoOutput {
  const { title, description, locale, path, ogImage } = input;
  const canonical = `${SITE_URL}${path}`;

  const ptPath = locale === 'pt' ? path : path.replace(/^\/en/, '') || '/';
  const enPath = locale === 'en' ? path : `/en${path === '/' ? '/' : path}`;

  return {
    title,
    description,
    canonical,
    ogImage: `${SITE_URL}${ogImage ?? DEFAULT_OG}`,
    locale: localeToHreflang[locale],
    alternates: [
      { hreflang: 'pt-BR', href: `${SITE_URL}${ptPath}` },
      { hreflang: 'en-US', href: `${SITE_URL}${enPath}` },
      { hreflang: 'x-default', href: `${SITE_URL}${ptPath}` },
    ],
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Diretriz Tecnologia',
    url: SITE_URL,
    logo: `${SITE_URL}/og/logo.png`,
    description: 'Soluções em tecnologia sob medida — desenvolvimento, automação e IA.',
    sameAs: [],
  };
}
