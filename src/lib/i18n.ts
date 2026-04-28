/**
 * i18n — utilities para PT/EN.
 *
 * O Astro 5 já roteia por pasta (`/` PT, `/en/` EN). Este módulo centraliza:
 * - tipos de locale
 * - dicionário de strings de UI (header, footer, CTAs, labels)
 * - função `t(key, locale)` para uso em componentes Astro e React
 */

export type Locale = 'pt' | 'en';

export const locales: Locale[] = ['pt', 'en'];
export const defaultLocale: Locale = 'pt';

export const localeNames: Record<Locale, string> = {
  pt: 'Português',
  en: 'English',
};

export const localeShort: Record<Locale, string> = {
  pt: 'PT',
  en: 'EN',
};

type StringDict = Record<Locale, string>;

const dictionary = {
  'site.name': {
    pt: 'Diretriz Tecnologia',
    en: 'Diretriz Tecnologia',
  },
  'hero.tagline': {
    pt: 'Construímos. Rápido. Sob medida. Robusto.',
    en: 'We build. Fast. Tailored. Solid.',
  },
  'hero.subtagline': {
    pt: 'Tecnologia que aponta na direção do seu negócio.',
    en: 'Technology that points your business in the right direction.',
  },
  'cta.contact': {
    pt: 'Falar com a Diretriz',
    en: 'Talk to Diretriz',
  },
  'cta.discover': {
    pt: 'Conhecer',
    en: 'Discover',
  },
  'nav.home': { pt: 'Início', en: 'Home' },
  'nav.about': { pt: 'Sobre', en: 'About' },
  'nav.services': { pt: 'Serviços', en: 'Services' },
  'nav.contact': { pt: 'Contato', en: 'Contact' },
  'footer.rights': {
    pt: 'Todos os direitos reservados.',
    en: 'All rights reserved.',
  },
} as const satisfies Record<string, StringDict>;

export type DictionaryKey = keyof typeof dictionary;

export function t(key: DictionaryKey, locale: Locale = defaultLocale): string {
  const entry = dictionary[key];
  return entry[locale] ?? entry[defaultLocale];
}

/**
 * Mapeia o path atual para o equivalente no outro idioma.
 * Ex: `/sobre` em PT → `/en/about` em EN.
 */
const routeMap: Record<string, Record<Locale, string>> = {
  home: { pt: '/', en: '/en/' },
  about: { pt: '/sobre', en: '/en/about' },
  services: { pt: '/servicos', en: '/en/services' },
  contact: { pt: '/contato', en: '/en/contact' },
};

export function getLocalizedPath(routeKey: keyof typeof routeMap, locale: Locale): string {
  return routeMap[routeKey][locale];
}

export function getAlternateLocale(locale: Locale): Locale {
  return locale === 'pt' ? 'en' : 'pt';
}
