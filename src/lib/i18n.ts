/**
 * i18n — conteúdo do site em PT/EN.
 *
 * Astro 5 roteia por pasta (`/` PT, `/en/` EN). Este módulo centraliza:
 * - tipos de locale e helpers de rota
 * - árvore de conteúdo tipada (SiteContent) para cada locale
 * - getContent(locale) para componentes consumirem
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

/* ----------------------------------------------------------------
   Conteúdo do site (tipado)
   ---------------------------------------------------------------- */

export interface PillarItem {
  num: string;
  title: string;
  desc: string;
  featured?: boolean;
}

export interface ProcessStep {
  n: string;
  title: string;
  desc: string;
}

export interface FooterCol {
  title: string;
  links: { label: string; href: string }[];
}

export interface InfoRow {
  label: string;
  value: string;
  href?: string;
  pulse?: boolean;
}

export interface SiteContent {
  nav: {
    about: string;
    services: string;
    process: string;
    contact: string;
    cta: string;
  };
  hero: {
    kicker: string;
    tagline: [string, string, string, string];
    sub: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  manifesto: {
    label: string;
    lineA: string;
    lineB: string;
  };
  pillars: {
    label: string;
    titleStart: string;
    titleAccent: string;
    titleEnd: string;
    intro: string;
    items: PillarItem[];
  };
  ai: {
    label: string;
    titleStart: string;
    titleAccent: string;
    titleEnd: string;
    copy: string;
    cta: string;
    layerLabel: string;
    statusLabel: string;
    systems: string[];
  };
  process: {
    label: string;
    titleStart: string;
    titleAccent: string;
    steps: ProcessStep[];
  };
  outro: {
    label: string;
    titleStart: string;
    titleAccent: string;
    titleEnd: string;
    lede: string;
    info: InfoRow[];
    socials: { label: string; href: string }[];
    form: {
      name: { label: string; placeholder: string };
      company: { label: string; placeholder: string };
      email: { label: string; placeholder: string };
      topic: { label: string; chips: string[] };
      message: { label: string; placeholder: string };
      submit: string;
      submitted: string;
    };
  };
  footer: {
    tagline: string;
    cols: FooterCol[];
    rights: string;
    privacy: string;
  };
  stub: {
    label: string;
    title: string;
    leadBefore: string;
  };
  langSwitch: { label: string };
  preloader: { brand: string };
}

const content: Record<Locale, SiteContent> = {
  pt: {
    nav: {
      about: 'Sobre',
      services: 'Serviços',
      process: 'Como trabalhamos',
      contact: 'Contato',
      cta: 'Falar com a Diretriz',
    },
    hero: {
      kicker: '/ Diretriz Tecnologia',
      tagline: ['Construímos.', 'Rápido.', 'Sob medida.', 'Robusto.'],
      sub: 'Tecnologia que aponta na direção do seu negócio.',
      ctaPrimary: 'Falar com a Diretriz',
      ctaSecondary: 'Conhecer mais',
    },
    manifesto: {
      label: 'Nosso Manifesto',
      lineA: 'Não substituímos o que você já tem.',
      lineB: 'Amplificamos com tecnologia.',
    },
    pillars: {
      label: 'Serviços',
      titleStart: 'Quatro frentes. ',
      titleAccent: 'Uma forma',
      titleEnd: ' de trabalhar.',
      intro:
        'Sem pacote pronto, sem template. Cada projeto começa entendendo o problema antes de qualquer linha de código.',
      items: [
        {
          num: '01',
          title: 'Produtos sob medida',
          desc: 'Desenvolvemos produtos digitais do zero, com foco no que realmente importa para o seu negócio.',
        },
        {
          num: '02',
          title: 'Automação de fluxos',
          desc: 'Automatizamos processos internos sem trocar os sistemas que você já usa no dia a dia.',
        },
        {
          num: '03',
          title: 'IA sobre legado',
          desc: 'Adicionamos uma camada de inteligência artificial sobre seu sistema atual e multiplicamos o valor do que você já tem.',
          featured: true,
        },
        {
          num: '04',
          title: 'Consultoria técnica',
          desc: 'Apoio estratégico e técnico para decisões de arquitetura, escolha de stack e crescimento do produto.',
        },
      ],
    },
    ai: {
      label: 'Nosso Diferencial',
      titleStart: 'IA sobre o que ',
      titleAccent: 'já existe',
      titleEnd: '.',
      copy:
        'Conectamos nossa camada de IA aos seus sistemas atuais e liberamos novas possibilidades com inteligência, sem ruptura, sem começar do zero.',
      cta: 'Saiba como funciona',
      layerLabel: 'CAMADA DE IA',
      statusLabel: 'online',
      systems: ['ERP', 'CRM', 'Planilhas', 'Sistemas', 'Outros'],
    },
    process: {
      label: 'Como trabalhamos',
      titleStart: 'Cinco passos. ',
      titleAccent: 'Sem mistério.',
      steps: [
        { n: '01', title: 'Entendemos', desc: 'Mergulhamos no seu negócio e no problema de verdade.' },
        { n: '02', title: 'Planejamos', desc: 'Desenhamos a solução sob medida com foco em resultados rápidos.' },
        { n: '03', title: 'Construímos', desc: 'Desenvolvemos com qualidade, testes e transparência total.' },
        { n: '04', title: 'Entregamos', desc: 'Colocamos em produção de forma segura e acompanhada.' },
        { n: '05', title: 'Evoluímos', desc: 'Iteramos e aprimoramos sempre junto com seu time.' },
      ],
    },
    outro: {
      label: '/ Contato',
      titleStart: 'Vamos construir o ',
      titleAccent: 'próximo passo',
      titleEnd: ' do seu negócio.',
      lede:
        'Conta o que está te tirando o sono. A gente responde em até 1 dia útil com uma conversa, não com um orçamento.',
      info: [
        { label: 'E-mail', value: 'diretriztecnologia@gmail.com', href: 'mailto:diretriztecnologia@gmail.com' },
        { label: 'Disponibilidade', value: 'Recebendo novos projetos para 2026', pulse: true },
        { label: 'Tempo de resposta', value: '≤ 24h em dias úteis' },
        { label: 'Onde estamos', value: 'Brasil · Atendimento 100% remoto' },
      ],
      socials: [
        { label: 'LinkedIn', href: '#' },
        { label: 'Instagram', href: '#' },
      ],
      form: {
        name: { label: 'Nome', placeholder: 'Como você se chama?' },
        company: { label: 'Empresa', placeholder: 'Onde você trabalha' },
        email: { label: 'E-mail', placeholder: 'seu@email.com' },
        topic: {
          label: 'Sobre o que vamos conversar?',
          chips: ['Produto sob medida', 'Automação', 'IA sobre legado', 'Consultoria', 'Outro'],
        },
        message: {
          label: 'Conta o desafio',
          placeholder: 'O contexto, o que está travando, o que seria sucesso pra você.',
        },
        submit: 'Enviar mensagem',
        submitted: 'Mensagem enviada',
      },
    },
    footer: {
      tagline: 'Tecnologia que aponta na direção do seu negócio.',
      cols: [
        {
          title: 'Navegação',
          links: [
            { label: 'Sobre', href: '/#sobre' },
            { label: 'Serviços', href: '/#servicos' },
            { label: 'Como trabalhamos', href: '/#processo' },
            { label: 'Contato', href: '/#contato' },
          ],
        },
        {
          title: 'Serviços',
          links: [
            { label: 'Produtos sob medida', href: '/#servicos' },
            { label: 'Automação de fluxos', href: '/#servicos' },
            { label: 'IA sobre legado', href: '/#ai' },
            { label: 'Consultoria técnica', href: '/#servicos' },
          ],
        },
        {
          title: 'Contato',
          links: [
            { label: 'E-mail', href: 'mailto:diretriztecnologia@gmail.com' },
            { label: 'LinkedIn', href: '#' },
            { label: 'Instagram', href: '#' },
          ],
        },
        {
          title: 'Idioma',
          links: [
            { label: 'PT — Português', href: '/' },
            { label: 'EN — English', href: '/en/' },
          ],
        },
      ],
      rights: 'Todos os direitos reservados.',
      privacy: 'Política de Privacidade',
    },
    stub: {
      label: 'Em breve',
      title: 'Esta página está em construção.',
      leadBefore: 'Por enquanto, fale com a gente em',
    },
    langSwitch: { label: 'Idioma' },
    preloader: { brand: 'Diretriz' },
  },
  en: {
    nav: {
      about: 'About',
      services: 'Services',
      process: 'How we work',
      contact: 'Contact',
      cta: 'Talk to Diretriz',
    },
    hero: {
      kicker: '/ Diretriz Tecnologia',
      tagline: ['We build.', 'Fast.', 'Tailored.', 'Solid.'],
      sub: 'Technology that points your business in the right direction.',
      ctaPrimary: 'Talk to Diretriz',
      ctaSecondary: 'Learn more',
    },
    manifesto: {
      label: 'Our Manifesto',
      lineA: "We don't replace what you have.",
      lineB: 'We amplify it with technology.',
    },
    pillars: {
      label: 'Services',
      titleStart: 'Four fronts. ',
      titleAccent: 'One way',
      titleEnd: ' of working.',
      intro:
        'No prepackaged solutions, no templates. Every project starts by understanding the problem before any line of code.',
      items: [
        {
          num: '01',
          title: 'Custom products',
          desc: 'We build digital products from scratch, focused on what truly matters for your business.',
        },
        {
          num: '02',
          title: 'Workflow automation',
          desc: 'We automate internal processes without replacing the systems you already use day to day.',
        },
        {
          num: '03',
          title: 'AI over legacy',
          desc: 'We add an AI layer over your existing system and multiply the value of what you already have.',
          featured: true,
        },
        {
          num: '04',
          title: 'Technical consulting',
          desc: 'Strategic and technical support for architecture decisions, stack choice and product growth.',
        },
      ],
    },
    ai: {
      label: 'Our Edge',
      titleStart: 'AI over what ',
      titleAccent: 'already exists',
      titleEnd: '.',
      copy:
        'We connect our AI layer to your current systems and unlock new possibilities — no disruption, no starting over.',
      cta: 'See how it works',
      layerLabel: 'AI LAYER',
      statusLabel: 'online',
      systems: ['ERP', 'CRM', 'Spreadsheets', 'Internal', 'Other'],
    },
    process: {
      label: 'How we work',
      titleStart: 'Five steps. ',
      titleAccent: 'No mystery.',
      steps: [
        { n: '01', title: 'We understand', desc: 'We dive into your business and the real problem.' },
        { n: '02', title: 'We plan', desc: 'We design the tailored solution focused on fast outcomes.' },
        { n: '03', title: 'We build', desc: 'We develop with quality, tests and full transparency.' },
        { n: '04', title: 'We deliver', desc: 'We ship to production safely and alongside you.' },
        { n: '05', title: 'We evolve', desc: 'We iterate and improve continuously with your team.' },
      ],
    },
    outro: {
      label: '/ Contact',
      titleStart: "Let's build the ",
      titleAccent: 'next step',
      titleEnd: ' of your business.',
      lede:
        "Tell us what's keeping you up at night. We respond within 1 business day with a conversation, not a quote.",
      info: [
        { label: 'Email', value: 'diretriztecnologia@gmail.com', href: 'mailto:diretriztecnologia@gmail.com' },
        { label: 'Availability', value: 'Booking new projects for 2026', pulse: true },
        { label: 'Response time', value: '≤ 24h on business days' },
        { label: 'Where we are', value: 'Brazil · 100% remote engagements' },
      ],
      socials: [
        { label: 'LinkedIn', href: '#' },
        { label: 'Instagram', href: '#' },
      ],
      form: {
        name: { label: 'Name', placeholder: 'Your name' },
        company: { label: 'Company', placeholder: 'Where you work' },
        email: { label: 'Email', placeholder: 'you@email.com' },
        topic: {
          label: 'What do you want to talk about?',
          chips: ['Custom product', 'Automation', 'AI over legacy', 'Consulting', 'Other'],
        },
        message: {
          label: 'Tell us the challenge',
          placeholder: 'The context, what is blocking you, what success looks like.',
        },
        submit: 'Send message',
        submitted: 'Message sent',
      },
    },
    footer: {
      tagline: 'Technology that points your business in the right direction.',
      cols: [
        {
          title: 'Navigation',
          links: [
            { label: 'About', href: '/en/#sobre' },
            { label: 'Services', href: '/en/#servicos' },
            { label: 'How we work', href: '/en/#processo' },
            { label: 'Contact', href: '/en/#contato' },
          ],
        },
        {
          title: 'Services',
          links: [
            { label: 'Custom products', href: '/en/#servicos' },
            { label: 'Workflow automation', href: '/en/#servicos' },
            { label: 'AI over legacy', href: '/en/#ai' },
            { label: 'Technical consulting', href: '/en/#servicos' },
          ],
        },
        {
          title: 'Contact',
          links: [
            { label: 'Email', href: 'mailto:diretriztecnologia@gmail.com' },
            { label: 'LinkedIn', href: '#' },
            { label: 'Instagram', href: '#' },
          ],
        },
        {
          title: 'Language',
          links: [
            { label: 'PT — Português', href: '/' },
            { label: 'EN — English', href: '/en/' },
          ],
        },
      ],
      rights: 'All rights reserved.',
      privacy: 'Privacy Policy',
    },
    stub: {
      label: 'Coming soon',
      title: 'This page is under construction.',
      leadBefore: 'In the meantime, reach us at',
    },
    langSwitch: { label: 'Language' },
    preloader: { brand: 'Diretriz' },
  },
};

export function getContent(locale: Locale): SiteContent {
  return content[locale];
}

/* ----------------------------------------------------------------
   Helpers de rota
   ---------------------------------------------------------------- */

const routeMap = {
  home: { pt: '/', en: '/en/' },
  about: { pt: '/sobre', en: '/en/about' },
  services: { pt: '/servicos', en: '/en/services' },
  contact: { pt: '/contato', en: '/en/contact' },
} as const;

export type RouteKey = keyof typeof routeMap;

export function getLocalizedPath(routeKey: RouteKey, locale: Locale): string {
  return routeMap[routeKey][locale];
}

export function getAlternateLocale(locale: Locale): Locale {
  return locale === 'pt' ? 'en' : 'pt';
}

/**
 * Anchor para seção da home (PT: `/#sobre`, EN: `/en/#sobre`).
 * Usado pelo nav já que o site é single-page com seções na home.
 */
export function getSectionAnchor(section: string, locale: Locale): string {
  const home = routeMap.home[locale];
  return `${home}#${section}`;
}
