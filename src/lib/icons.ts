/* ========================================================================
   Ícones inline dos badges de seção (stroke = currentColor).
   Um por seção — usados pelo componente SectionBadge.
   ======================================================================== */

const svg = (paths: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const sectionIcons = {
  // Manifesto — "Nosso processo" → bússola (na mesma direção)
  about: svg('<circle cx="12" cy="12" r="9"/><path d="M15.6 8.4 L13.2 13.2 L8.4 15.6 L10.8 10.8 Z"/>'),

  // Pillars — "Serviços" → camadas
  services: svg(
    '<path d="M12 3 L20 7.5 L12 12 L4 7.5 Z"/><path d="M4 12 L12 16.5 L20 12"/><path d="M4 16.5 L12 21 L20 16.5"/>'
  ),

  // AISection — "IA" → faísca
  ai: svg(
    '<path d="M12 3 L13.7 8.3 L19 10 L13.7 11.7 L12 17 L10.3 11.7 L5 10 L10.3 8.3 Z"/><path d="M18.5 14.5 L19.3 16.7 L21.5 17.5 L19.3 18.3 L18.5 20.5 L17.7 18.3 L15.5 17.5 L17.7 16.7 Z"/>'
  ),

  // Process — "Como trabalhamos" → fluxo/etapas
  process: svg(
    '<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><path d="M6 7 L6 17"/><path d="M6 5 L14 5 a4 4 0 0 1 4 4 L18 14.5"/><path d="M15 11.5 L18 14.7 L21 11.5"/>'
  ),

  // Outro — "Contato" → balão de conversa
  contact: svg(
    '<path d="M21 11.5a7.5 7.5 0 0 1-10.9 6.7L4 20l1.8-5.1A7.5 7.5 0 1 1 21 11.5z"/><circle cx="8.5" cy="11.5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="11.5" r="1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="11.5" r="1" fill="currentColor" stroke="none"/>'
  ),
} as const;

export type SectionIconKey = keyof typeof sectionIcons;
