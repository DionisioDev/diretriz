# Design Brief — Diretriz Tecnologia

> Documento autocontido. Pode ser entregue isolado a um designer ou IA de design.
> Objetivo: site institucional premium para `diretriztecnologia.com.br`.

---

## 1. O que é a Diretriz Tecnologia

Empresa de **soluções em tecnologia sob medida** para empresas de médio porte. Atua em três frentes:

1. **Construção de produtos digitais do zero** (web, mobile, integrações)
2. **Automação de fluxos internos** (sem trocar os sistemas que o cliente já usa)
3. **Integração de IA sobre sistemas legados** — diferencial-chave: **não substituímos a tecnologia do cliente, adicionamos camada de IA por cima do que ele já tem**

Tagline oficial:

> **PT:** "Construímos. Rápido. Sob medida. Robusto."
> *Subtagline: Tecnologia que aponta na direção do seu negócio.*
>
> **EN:** "We build. Fast. Tailored. Solid."
> *Subtagline: Technology that points your business in the right direction.*

---

## 2. Posicionamento e tom

### Pilares de mensagem (em ordem de peso)

1. **Velocidade de entrega** — MVPs em semanas, não meses
2. **Entendimento real do problema** — discovery antes de código
3. **Soluções personalizadas** — sem pacote pronto, sem template
4. **Robustez e segurança** — stack moderna, código auditável
5. **IA sobre o legado** — multiplicar valor do que o cliente já tem

### Tom da marca

| É | Não é |
|---|---|
| Sério, direto, confiante | Engessado, distante, formal de mais |
| Técnico onde precisa | Cheio de jargão de consultoria |
| Premium, sofisticado | Caro, exclusivista |
| Moderno, atual | "Trendy", efêmero |
| Brasileiro autêntico | Tradução literal de inglês |

### Antiposicionamentos (o que NÃO somos)

- Agência criativa de fachada
- Fábrica de software de baixo custo
- No-code/low-code repackaged
- Substituto do time de TI do cliente

---

## 3. Público-alvo

### Persona primária — "O Operador Pressionado"
Diretor de operações ou CTO em empresa de 50–500 funcionários. Tem sistema interno que funciona mas trava o crescimento. Critério: **rapidez + previsibilidade**, não menor preço.

### Persona secundária — "O Empreendedor com Ideia"
Founder que tem o problema mapeado, falta time técnico. Critério: **expertise + apresentação profissional**.

### Persona terciária — "O Curioso Técnico"
Dev/arquiteto/recrutador. Não vira cliente, vira canal de indicação. Critério: **respeitar o olhar técnico** (código limpo, performance boa, sem cringe).

---

## 4. Identidade visual

### Logo
Avião de papel estilizado: triângulo grande em **azul vibrante** (#3b82f6), triângulo menor em **cinza-azulado** (#64748b), com vinco em **azul mais escuro** (#1e40af). Wordmark "Diretriz" em azul-marinho com "tecnologia" em azul vibrante embaixo. **Transmite direção, movimento, precisão.**

### Paleta (definida)

| Token | Hex | Uso |
|---|---|---|
| `--color-bg` | `#0A1628` | Background principal — dark profundo, quase preto-azulado |
| `--color-bg-elevated` | `#0F1E36` | Cards, surfaces elevadas |
| `--color-primary` | `#1D4ED8` | Acentos, CTAs, links |
| `--color-primary-bright` | `#3B82F6` | Hover, glow, gradientes |
| `--color-accent` | `#22D3EE` | Detalhes vibrantes, IA, pontuações |
| `--color-text` | `#F1F5F9` | Texto principal sobre dark |
| `--color-text-muted` | `#94A3B8` | Texto secundário |
| `--color-text-dim` | `#64748B` | Texto auxiliar, separadores |

**Gradientes-chave**: `linear-gradient(135deg, #1D4ED8 → #3B82F6)` para CTAs, `radial-gradient(ellipse at top, rgba(59,130,246,0.15) → transparent)` para fundo glow.

### Tipografia (definida)

- **Display + Body**: **Geist Sans** (família unificada, free, self-hosted via fontsource)
  - Pesos: 400 / 500 / 600 / 700
- **Mono**: **Geist Mono** — peso 500 — para acentos técnicos, números, kickers ("/ Diretriz Tecnologia"), labels
- Escala fluida com `clamp()`. Display do hero pode chegar a `clamp(3.5rem, 2rem + 6vw, 6.5rem)`.

---

## 5. Referências de design e DNA visual desejado

### Sites-referência

1. **Infinite Field** (https://www.infinitefield.xyz/)
   - Site de fundo de high-frequency trading
   - Brutalismo-tech, dark mode profundo, tipografia gigante
   - Scroll cinemático com "scroll to start"
   - WebGL para campos de partículas / formas geométricas abstratas
   - Pouca informação por viewport — vende **postura**

2. **Autonomous Finances** (Awwwards Honorable Mention)
   - "Visually stunning interactive 3D website made for the new era of AI finances"
   - Cor base: ciano/azul (#2596be) — coincide com nossa paleta
   - Hero 3D, agency animations 3D, footer criativo com IA 3D
   - Microinterações ricas em todo lugar

3. **Kriss.ai**
   - Site de produto IA
   - Preloader cinematográfico marcando "isso é uma experiência, não um site"
   - Gradientes etéreos, glassmorphism, formas orgânicas (blobs, curvas)
   - Copy minimalista, hero com forte presença visual

### DNA visual a incorporar (denominador comum das três)

1. **Loader/preloader cinematográfico** com progresso (0% → 100%) marcando entrada
2. **Dark theme profundo** dominante, com acentos vibrantes pontuais
3. **WebGL/3D** em **1-2 seções "uau"** (não no site inteiro — caro)
4. **Scroll storytelling**: pin + parallax + scrub de animações conforme scroll
5. **Tipografia editorial gigante** no hero, hierarquia agressiva
6. **Densidade visual alta, densidade textual baixa** — o site comunica por presença, não por explicação
7. **Microinterações de cursor** (cursor custom magnético, hover states ricos)
8. **Transições cinematográficas** entre seções (não cortes secos)
9. **Toques de "vivacidade IA"**: gradientes orgânicos, partículas, formas que respiram

---

## 6. Estrutura de páginas necessárias

```
/                  Home — hero + pilares + IA + CTA
/sobre             Quem somos, processo, time
/servicos          Detalhamento dos 4 pilares
/contato           Form de contato + canais alternativos
/en/               EN home
/en/about
/en/services
/en/contact
```

### Home — seções obrigatórias (em ordem de scroll)

1. **Hero** — tagline gigante, tagline em 4 palavras com pontos coloridos, subtagline, 2 CTAs ("Falar com a Diretriz" / "Conhecer"), elemento 3D ou WebGL ambient
2. **Manifesto / introdução** — frase grande de posicionamento, fundo com partículas ou shape orgânico
3. **Pilares de oferta** (4 cards/sections, scroll-driven, cada um com micro-animação): Produtos sob medida · Automação de fluxos · IA sobre legado · Consultoria técnica
4. **Seção de IA destacada** — explicação visual de "camada de IA sobre seu sistema atual" (diagrama animado? cards conectando-se? scroll-scrub mostrando integração?)
5. **Como trabalhamos** — 3 a 5 passos, timeline visual, estética monospace
6. **CTA final + footer** — convite forte para contato

### Página de contato — destaque
- Form com 6 campos (nome, empresa, e-mail, telefone, tipo de interesse, descrição)
- Estética: form sobreposto a fundo animado, validação inline, estado de loading no submit
- Mensagem de sucesso celebrativa (não modal padrão)
- Link `mailto:diretriztecnologia@gmail.com` como fallback

---

## 7. Stack técnica obrigatória

> Esta stack é fixa. Design precisa caber nela.

| Camada | Tecnologia |
|---|---|
| Framework | **Astro 5** (SSG + React islands) |
| UI interativa | **React 19** apenas em ilhas (3D, form, chatbot futuro) |
| 3D / WebGL | **React Three Fiber + drei + GSAP/ScrollTrigger** |
| Animação 2D | **Motion** (ex-Framer Motion) |
| Estilo | **CSS Modules + custom properties** (NÃO usar Tailwind) |
| Tipografia | **Geist Sans + Geist Mono** via `@fontsource-variable/geist` |
| i18n | Astro nativo (PT na raiz, EN em `/en/`) |
| Form | **EmailJS** SDK (free tier) |
| Hospedagem | **Cloudflare Pages** |
| Analytics | Cloudflare Web Analytics |

### Restrições importantes
- **Sem Tailwind**. CSS Modules + tokens em `:root` via custom properties.
- **Self-hosted fonts** (sem Google Fonts) para performance + privacidade.
- Componentes 3D **só hidratam quando entram no viewport** (`client:visible`).
- Mobile: cena 3D simplificada ou substituída por imagem/vídeo.

---

## 8. Restrições de performance e acessibilidade

### Performance (alvo)
- LCP < 2.5s
- CLS < 0.1
- INP < 200ms
- Bundle JS inicial < 150kb gzip
- Total da home < 1.5MB
- 3D model GLB com Draco/Meshopt, < 500kb

### Acessibilidade (WCAG 2.1 AA obrigatório)
- Contraste mínimo 4.5:1 (texto normal), 3:1 (texto grande)
- Navegação por teclado total, focus ring visível, skip-to-content
- `prefers-reduced-motion` desliga animações pesadas e troca 3D por imagem estática
- Alternativas textuais para todo conteúdo visual
- ARIA apenas onde HTML semântico não basta

---

## 9. O que NÃO fazer

- ❌ Tailwind
- ❌ Google Fonts (use `@fontsource-variable/geist`)
- ❌ Emojis no UI (a marca é séria, não casual)
- ❌ Animação por animação — toda animação serve a uma narrativa
- ❌ Imagens stock genéricas de "tech" (mãos digitando, hexágonos, redes neurais clichê)
- ❌ Slogans de consultoria genérica ("transformamos seu negócio", "sinergia", "deliverables")
- ❌ Cores fora da paleta definida
- ❌ "Cards de cliente" com logos falsos antes de existirem cases reais
- ❌ Modais para mensagem de sucesso/erro — usar inline
- ❌ Bordas pretas duras — preferir `rgba` translúcido ou gradiente sutil
- ❌ Drop shadows convencionais — usar **glow** sobre primary
- ❌ Cursor padrão em interações importantes — preferir cursor magnético/custom

---

## 10. Inspirações de execução visual

### Hero — direção desejada

**Conceito**: o nome "Diretriz" significa direção. O logo é um avião de papel (movimento, precisão, agilidade). Hero deve traduzir isso em **forma + movimento**.

Possibilidades (escolher uma e refinar):

- **A — Tubo de partículas em movimento direcional** (R3F): pontos azuis fluindo em uma direção, formando uma "esteira de luz" que ecoa o avião
- **B — Forma 3D abstrata respirando**: volume azul/ciano com leve metallic, rotação sutil, parallax com mouse, sombras volumétricas
- **C — Grid de pontos 3D com depth-of-field**: campo infinito de pontos com foco no centro, deformação suave conforme scroll (estilo Infinite Field)
- **D — Avião de papel 3D**: o próprio logo modelado em 3D, com vinco realista, lit por cima, deixando rastro de partículas ao mover

Tagline aparece **com peso editorial**, palavras entrando em cascata, **cada ponto final pintado em cor diferente da paleta** ("Construímos**.** Rápido**.** Sob medida**.** Robusto**.**" — pontos animados como pequenos pulsos).

### Pilares — direção desejada

Cada pilar é um "card" mas **sem visual de card tradicional**. Pode ser:
- Linha tipográfica gigante com número monospace ("01 Produtos") + ilustração 3D pequena ao lado
- Scroll horizontal interno com pin (4 pilares deslizam horizontalmente enquanto a página segue vertical)
- Texto explicativo aparece em fade conforme entra no viewport

### Seção de IA — direção desejada

A frase-chave é **"adicionamos camada de IA sobre o que você já tem"**. Visualizar isso:
- Diagrama animado: blocos representando o sistema legado do cliente em cinza, sobreposição de uma camada azul/ciano translúcida que se conecta a eles
- Ou: shader animado de "energia fluindo" entre duas malhas
- Texto curto, alto contraste, deixar o visual narrar

### Footer — direção desejada
Minimal, monospace, e-mail clicável grande, ano dinâmico. Pode ter sutil shader de fundo (movimento muito lento, quase imperceptível).

---

## 11. Idioma e localização

- **PT-BR** é primário. Conteúdo PT é a fonte de verdade.
- **EN** é tradução fiel, sem adaptação cultural drástica
- Switcher no header: `PT | EN`, mantém posição equivalente ao trocar
- Preserva preferência em `localStorage`

---

## 12. SEO

- HTML pré-renderizado (Astro SSG)
- Meta tags por página (title, description, og:image)
- `<link rel="alternate" hreflang>` para PT/EN
- Sitemap automático
- JSON-LD `Organization` no layout

---

## 13. Entregáveis esperados do design

1. **Mockup completo da Home** (PT) em alta resolução, todas as seções
2. **Variantes de hero** (2-3 propostas) para escolha
3. **Sistema de tokens** (cores, tipografia, espaçamento, motion) atualizado se houver ajuste de paleta
4. **Mockup das 3 páginas internas** (Sobre, Serviços, Contato)
5. **Versão mobile** das telas críticas (Home, Contato)
6. **Especificação de animações** (timing, easing, gatilhos de scroll, comportamento em hover)
7. **Modelo 3D** ou direção exata de quem o produzirá (Spline? Blender? biblioteca de assets?)
8. **Componentes-chave** (Button, Card, Input, Section header) em estados hover/active/focus/disabled
9. **Loading state** — preloader cinematográfico (0% → 100%)
10. **Mensagens de erro/sucesso** do form (inline, não modal)

---

## 14. Resumo em uma frase

> Construir um site institucional **dark, premium, cinematográfico**, com **3D pontual** em até 2 momentos-chave, **tipografia editorial gigante** em Geist, **paleta azul profundo + ciano + cinza-azulado**, que comunica **direção, velocidade e precisão técnica** — referências: Infinite Field, Autonomous Finances, Kriss.ai. Sem Tailwind, sem Google Fonts, sem emoji.
