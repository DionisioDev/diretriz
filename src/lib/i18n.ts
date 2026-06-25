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
  bullets: string[];
  cta: string;
  featured?: boolean;
}

export interface PillarsBanner {
  title: string;
  desc: string;
  cta: string;
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

export interface OutroItem {
  title: string;
  desc: string;
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
    tagline: [string, string, string];
    sub: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  manifesto: {
    label: string;
    titleStart: string;
    titleAccent: string;
    subtitle: string;
  };
  pillars: {
    label: string;
    titleStart: string;
    titleAccent: string;
    titleEnd: string;
    intro: string;
    items: PillarItem[];
    banner: PillarsBanner;
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
    badge: string;
    titleStart: string;
    titleAccent: string;
    titleEnd: string;
    lede: string;
    features: OutroItem[];
    stats: OutroItem[];
    closingStart: string;
    closingAccent: string;
    form: {
      title: string;
      sub: string;
      name: { label: string; placeholder: string };
      company: { label: string; placeholder: string };
      email: { label: string; placeholder: string };
      topic: { label: string; chips: string[] };
      message: { label: string; placeholder: string };
      submit: string;
      submitting: string;
      successThanks: string;
      successTitle: string;
      successBody: string;
      successHighlight: string;
      successReset: string;
      note: string;
      noteLink: string;
      errorName: string;
      errorEmail: string;
      errorEmailInvalid: string;
      errorMessage: string;
      error: string;
    };
  };
  footer: {
    tagline: string;
    cols: FooterCol[];
    rights: string;
    privacy: string;
  };
  langSwitch: { label: string };
  preloader: { brand: string };
  chat: {
    launcher: string;
    title: string;
    subtitle: string;
    greeting: string;
    placeholder: string;
    send: string;
    disclaimer: string;
    error: string;
    sent: string;
    retry: string;
    open: string;
    close: string;
    newChat: string;
    leadCta: string;
    formTitle: string;
    formName: string;
    formEmail: string;
    formPhone: string;
    formSubmit: string;
    formCancel: string;
    formPrivacy: string;
    formError: string;
  };
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
      tagline: ['tecnologia', 'na direção', 'do seu negócio.'],
      sub: '',
      ctaPrimary: 'Falar com a Diretriz',
      ctaSecondary: 'Conhecer mais',
    },
    manifesto: {
      label: 'Nosso processo',
      titleStart: 'Estratégia, produto e tecnologia trabalhando ',
      titleAccent: 'na mesma direção.',
      subtitle:
        'Um processo simples para transformar desafios complexos em soluções digitais escaláveis.',
    },
    pillars: {
      label: 'Serviços',
      titleStart: 'Três frentes. ',
      titleAccent: 'Uma forma de entregar resultados',
      titleEnd: '.',
      intro:
        'Sem pacote pronto, sem template. Cada projeto começa entendendo o problema antes de qualquer linha de código.',
      items: [
        {
          num: '01',
          title: 'Produtos sob medida',
          desc: 'Construímos produtos digitais do zero — modernos, do seu tamanho, modelados para resolver o seu problema, não o do mercado.',
          bullets: [
            'Soluções escaláveis e modernas',
            'Tecnologias atuais e bem testadas',
            'Foco em performance e experiência',
          ],
          cta: 'Saiba como funciona',
          featured: true,
        },
        {
          num: '02',
          title: 'Automação',
          desc: 'Workflows novos que tiram seu time do operacional repetitivo e devolvem horas para o que importa.',
          bullets: [
            'Workflows inteligentes',
            'Integração com suas ferramentas',
            'Menos tarefas manuais, mais eficiência',
          ],
          cta: 'Ver possibilidades',
        },
        {
          num: '03',
          title: 'Consultoria técnica',
          desc: 'Discovery, arquitetura e segunda opinião para quem tem time interno e precisa de validação externa.',
          bullets: [
            'Discovery e análise de viabilidade',
            'Arquitetura e boas práticas',
            'Code review e mentoria técnica',
          ],
          cta: 'Falar com um especialista',
        },
      ],
      banner: {
        title: 'Não sabe por onde começar?',
        desc: 'Vamos conversar sobre o seu desafio.',
        cta: 'Agendar uma conversa',
      },
    },
    ai: {
      label: 'IA para o seu negócio',
      titleStart: 'O que a IA pode abrir pro seu negócio? Vamos descobrir ',
      titleAccent: 'juntos',
      titleEnd: '.',
      copy:
        'As possibilidades com inteligência artificial crescem todo dia, e cada negócio aproveita de um jeito. Por isso a gente não chega com solução pronta — chega com perguntas. A conversa começa entendendo o seu desafio, enxergando onde a IA encaixa de verdade e imaginando o que dá pra construir a partir daí.',
      cta: 'Vamos conversar sobre IA',
      layerLabel: 'EM EXPLORAÇÃO',
      statusLabel: 'explorando',
      systems: ['Atendimento', 'Análise', 'Operações', 'Documentos', 'Decisão'],
    },
    process: {
      label: 'Como trabalhamos',
      titleStart: 'Cinco passos. ',
      titleAccent: 'Sem mistério.',
      steps: [
        { n: '01', title: 'Entendemos', desc: 'Discovery primeiro. Não escrevemos código antes de mapear o problema de verdade.' },
        { n: '02', title: 'Planejamos', desc: 'Você vê escopo, marcos e o porquê de cada decisão. Sem caixa-preta.' },
        { n: '03', title: 'Construímos', desc: 'Stack moderna, código limpo, escolhas explicáveis.' },
        { n: '04', title: 'Entregamos', desc: 'Em produção, acompanhado — não te deixamos sozinho na hora do uso.' },
        { n: '05', title: 'Evoluímos', desc: 'Iteração contínua junto com seu time, não para ele.' },
      ],
    },
    outro: {
      badge: 'Contato',
      titleStart: 'Pronto para tirar ',
      titleAccent: 'seu projeto',
      titleEnd: ' do papel?',
      lede:
        'Conte o que você precisa e vamos encontrar a melhor forma de transformar sua ideia em realidade.',
      features: [
        { title: 'Resposta rápida', desc: 'Retornamos em até 1 dia útil com uma resposta de verdade.' },
        {
          title: 'Soluções sob medida',
          desc: 'Analisamos seu contexto para propor a melhor solução para o seu negócio.',
        },
        { title: 'Confidencialidade', desc: 'Seus dados e informações estão seguros com a gente.' },
      ],
      stats: [
        { title: 'Atendimento ágil', desc: 'Retorno em até 1 dia útil com uma resposta objetiva.' },
        { title: 'Especialistas de verdade', desc: 'Conversas estratégicas com quem entende do assunto.' },
        { title: 'Soluções que funcionam', desc: 'Tecnologia alinhada com os objetivos do seu negócio.' },
        { title: 'Foco em resultado', desc: 'Nosso objetivo é gerar impacto real para sua empresa.' },
      ],
      closingStart: 'Vamos construir o ',
      closingAccent: 'próximo passo do seu produto.',
      form: {
        title: 'Vamos conversar',
        sub: 'Preencha o formulário e conte mais sobre seu projeto.',
        name: { label: 'Nome', placeholder: 'Como você se chama?' },
        company: { label: 'Onde você trabalha', placeholder: 'Sua empresa' },
        email: { label: 'E-mail corporativo', placeholder: 'seu@email.com' },
        topic: {
          label: 'Sobre o que vamos conversar?',
          chips: ['Produto sob medida', 'Automação', 'IA', 'Outro'],
        },
        message: {
          label: 'Conta o desafio',
          placeholder: 'O contexto, o que está travando, o que seria sucesso pra você.',
        },
        submit: 'Enviar mensagem',
        submitting: 'Enviando',
        successThanks: 'Obrigado',
        successTitle: 'Mensagem enviada!',
        successBody: 'Recebemos seu contato e retornamos em até',
        successHighlight: '1 dia útil',
        successReset: 'Enviar outra mensagem',
        note: 'Não compartilhamos suas informações. Prefere e-mail?',
        noteLink: 'Fale direto',
        errorName: 'Conta pra gente como você se chama.',
        errorEmail: 'Precisamos de um e-mail pra responder.',
        errorEmailInvalid: 'Esse e-mail não parece válido.',
        errorMessage: 'Escreva uma linha sobre o seu desafio.',
        error: 'Não consegui enviar. Tente de novo ou escreva para diretriztecnologia@gmail.com.',
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
            { label: 'IA para o seu negócio', href: '/#ai' },
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
    langSwitch: { label: 'Idioma' },
    preloader: { brand: 'Diretriz' },
    chat: {
      launcher: 'Vamos trocar uma ideia?',
      title: 'Assistente Diretriz',
      subtitle: 'Conte seu desafio — a gente aponta o caminho.',
      greeting:
        'Olá! Qual desafio trouxe você aqui — um produto pra criar, um processo pra automatizar? Conta em poucas palavras.',
      placeholder: 'Escreva sua mensagem…',
      send: 'Enviar',
      disclaimer: 'Assistente com IA para entender seu desafio. Seus dados de contato você deixa no formulário — não passam pela IA.',
      error: 'Algo falhou aqui. Tenta de novo, ou escreve direto pra diretriztecnologia@gmail.com.',
      sent: 'Pronto, recebido! O time da Diretriz responde em até 1 dia útil — e, se quiser, é só continuar a conversa por aqui.',
      retry: 'Tentar de novo',
      open: 'Abrir chat',
      close: 'Fechar chat',
      newChat: 'Nova conversa',
      leadCta: 'Deixar meus dados',
      formTitle: 'Deixar contato',
      formName: 'Seu nome',
      formEmail: 'Seu e-mail',
      formPhone: 'Telefone (opcional)',
      formSubmit: 'Enviar para a Diretriz',
      formCancel: 'Voltar ao chat',
      formPrivacy: 'Enviado direto ao time — seus dados não passam pela IA.',
      formError: 'Confira o nome e um e-mail válido.',
    },
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
      tagline: ['technology', 'in the direction', 'of your business.'],
      sub: '',
      ctaPrimary: 'Talk to Diretriz',
      ctaSecondary: 'Learn more',
    },
    manifesto: {
      label: 'Our process',
      titleStart: 'Strategy, product, and technology working ',
      titleAccent: 'in the same direction.',
      subtitle:
        'A simple process to turn complex challenges into scalable digital solutions.',
    },
    pillars: {
      label: 'Services',
      titleStart: 'Three fronts. ',
      titleAccent: 'One way of delivering results',
      titleEnd: '.',
      intro:
        'No prepackaged solutions, no templates. Every project starts by understanding the problem before any line of code.',
      items: [
        {
          num: '01',
          title: 'Custom products',
          desc: 'We build digital products from scratch — modern, right-sized, modeled to solve your problem, not the market average.',
          bullets: [
            'Scalable and modern solutions',
            'Current and well-tested technologies',
            'Focus on performance and experience',
          ],
          cta: 'See how it works',
          featured: true,
        },
        {
          num: '02',
          title: 'Automation',
          desc: 'New workflows that pull your team out of repetitive operational work and give back hours for what matters.',
          bullets: [
            'Smart workflows',
            'Integration with your tools',
            'Less manual work, more efficiency',
          ],
          cta: 'See possibilities',
        },
        {
          num: '03',
          title: 'Technical consulting',
          desc: 'Discovery, architecture and a second opinion for teams that need outside validation.',
          bullets: [
            'Discovery and feasibility analysis',
            'Architecture and best practices',
            'Code review and technical mentoring',
          ],
          cta: 'Talk to a specialist',
        },
      ],
      banner: {
        title: "Don't know where to start?",
        desc: "Let's talk about your challenge.",
        cta: 'Schedule a conversation',
      },
    },
    ai: {
      label: 'AI for your business',
      titleStart: "What could AI open up for your business? Let's find out ",
      titleAccent: 'together',
      titleEnd: '.',
      copy:
        "The possibilities with artificial intelligence grow every day, and every business taps into them differently. That's why we don't show up with a ready-made solution — we show up with questions. The conversation starts by understanding your challenge, seeing where AI truly fits, and imagining what you can build from there.",
      cta: "Let's talk about AI",
      layerLabel: 'EXPLORING',
      statusLabel: 'exploring',
      systems: ['Support', 'Analysis', 'Operations', 'Documents', 'Decisions'],
    },
    process: {
      label: 'How we work',
      titleStart: 'Five steps. ',
      titleAccent: 'No mystery.',
      steps: [
        { n: '01', title: 'We understand', desc: "Discovery first. We don't write code before truly mapping the problem." },
        { n: '02', title: 'We plan', desc: 'You see scope, milestones and the why behind each decision. No black box.' },
        { n: '03', title: 'We build', desc: 'Modern stack, clean code, choices we can explain.' },
        { n: '04', title: 'We deliver', desc: "In production, supported — we don't leave you alone at go-live." },
        { n: '05', title: 'We evolve', desc: 'Continuous iteration with your team, not just for it.' },
      ],
    },
    outro: {
      badge: 'Contact',
      titleStart: 'Ready to get ',
      titleAccent: 'your project',
      titleEnd: ' off the ground?',
      lede:
        'Tell us what you need and we will find the best way to turn your idea into reality.',
      features: [
        { title: 'Fast response', desc: 'We get back within 1 business day with a real answer.' },
        {
          title: 'Tailored solutions',
          desc: 'We study your context to propose the best solution for your business.',
        },
        { title: 'Confidentiality', desc: 'Your data and information are safe with us.' },
      ],
      stats: [
        { title: 'Agile support', desc: 'A reply within 1 business day with an objective answer.' },
        { title: 'Real experts', desc: 'Strategic conversations with people who know the subject.' },
        { title: 'Solutions that work', desc: 'Technology aligned with your business goals.' },
        { title: 'Focused on results', desc: 'Our goal is to create real impact for your company.' },
      ],
      closingStart: "Let's build the ",
      closingAccent: 'next step of your product.',
      form: {
        title: "Let's talk",
        sub: 'Fill in the form and tell us more about your project.',
        name: { label: 'Name', placeholder: 'Your name' },
        company: { label: 'Where you work', placeholder: 'Your company' },
        email: { label: 'Work email', placeholder: 'you@email.com' },
        topic: {
          label: 'What do you want to talk about?',
          chips: ['Custom product', 'Automation', 'AI', 'Other'],
        },
        message: {
          label: 'Tell us the challenge',
          placeholder: 'The context, what is blocking you, what success looks like.',
        },
        submit: 'Send message',
        submitting: 'Sending',
        successThanks: 'Thank you',
        successTitle: 'Message sent!',
        successBody: 'We received your message and will reply within',
        successHighlight: '1 business day',
        successReset: 'Send another message',
        note: 'We never share your information. Prefer email?',
        noteLink: 'Reach out directly',
        errorName: 'Let us know your name.',
        errorEmail: 'We need an email to reply.',
        errorEmailInvalid: "That email doesn't look valid.",
        errorMessage: 'Write a line about your challenge.',
        error: 'Could not send. Try again or write to diretriztecnologia@gmail.com.',
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
            { label: 'AI for your business', href: '/en/#ai' },
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
    langSwitch: { label: 'Language' },
    preloader: { brand: 'Diretriz' },
    chat: {
      launcher: "Got an idea? Let's chat",
      title: 'Diretriz Assistant',
      subtitle: "Tell us your challenge — we'll point the way.",
      greeting:
        'Hi! What brought you here — a product to build, a process to automate? Tell me in a few words.',
      placeholder: 'Write your message…',
      send: 'Send',
      disclaimer: 'AI assistant to understand your challenge. You leave your contact details in the form — they never go through the AI.',
      error: 'Something failed here. Try again, or write straight to diretriztecnologia@gmail.com.',
      sent: "All set — got it! The Diretriz team will reply within 1 business day, and you're welcome to keep chatting here.",
      retry: 'Try again',
      open: 'Open chat',
      close: 'Close chat',
      newChat: 'New chat',
      leadCta: 'Leave my details',
      formTitle: 'Leave your contact',
      formName: 'Your name',
      formEmail: 'Your email',
      formPhone: 'Phone (optional)',
      formSubmit: 'Send to Diretriz',
      formCancel: 'Back to chat',
      formPrivacy: 'Sent straight to the team — your data never goes through the AI.',
      formError: 'Please check your name and a valid email.',
    },
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
