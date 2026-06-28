# Architecture — Diretriz Tecnologia (Site Institucional)

> Documento técnico de referência para o site `diretriztecnologia.com.br`.
> Companion de [`business.md`](./business.md).

---

## 1. Visão geral

Site institucional **estático com ilhas interativas**, otimizado para SEO, lead capture e experiência visual premium (WebGL/3D).

Princípios norteadores:

1. **Estático por padrão, interativo onde importa.** HTML pré-renderizado em build, React hidrata só componentes que precisam (hero 3D, form, futuro chatbot).
2. **Performance é feature.** LCP < 2.5s, CLS < 0.1, INP < 200ms — mesmo com 3D.
3. **SEO desde o primeiro commit.** Meta tags, sitemap, structured data, hreflang.
4. **Custo zero na v1.** Toda a stack roda em free tiers viáveis.
5. **Código legível supera cleverness.** CSS Modules em vez de utility soup; nomes claros; comentários só onde o "por quê" não é óbvio.

---

## 2. Stack

| Camada | Tecnologia | Versão alvo | Justificativa |
|---|---|---|---|
| Framework | **Astro** | 5.x | SSG nativo, islands para React, i18n embutido, ótimo SEO |
| UI | **React** | 19.x | Apenas em ilhas interativas (3D, form, chat futuro) |
| Hero animado | **Canvas 2D** (HTMLCanvasElement nativo) | — | v1 usa avião de papel + 320 partículas em curvas Bezier; sem WebGL/R3F nesta fase |
| 3D / WebGL (futuro) | **React Three Fiber** + **drei** | R3F 9.x / drei 10.x | Reservado para v2 quando precisar de cena 3D real |
| Animação 2D | CSS animations + `IntersectionObserver` | nativo | Reveal-on-scroll, transições suaves; sem dependência runtime extra |
| Estilo | **CSS Modules** + custom properties | nativo | Legível, escopado, zero runtime |
| TypeScript | — | 5.x | Em todo o código de aplicação |
| Build | **Vite** (sob Astro) | — | Já vem com Astro |
| Form | **EmailJS** | SDK 4.x | Free tier 200/mês, sem backend |
| Analytics | **Cloudflare Web Analytics** | — | Sem cookie, sem LGPD-banner |
| Hospedagem | **Cloudflare Pages** | — | Free, edge global, preview de PR |
| DNS | **Cloudflare DNS** | — | Apontando `diretriztecnologia.com.br` |

### Dependências esperadas (resumo `package.json`)

```jsonc
{
  "dependencies": {
    "astro": "^5",
    "@astrojs/react": "^4",
    "@astrojs/sitemap": "^3",
    "react": "^19",
    "react-dom": "^19",
    "@react-three/fiber": "^9",
    "@react-three/drei": "^10",
    "three": "^0.170",
    "motion": "^12",
    "gsap": "^3",
    "@emailjs/browser": "^4"
  },
  "devDependencies": {
    "@types/react": "^19",
    "@types/three": "^0.170",
    "typescript": "^5"
  }
}
```

---

## 3. Estrutura de pastas

```
diretriz/
├── docs/                       # esta documentação
│   ├── business.md
│   └── architecture.md
├── public/                     # assets servidos como estão
│   ├── fonts/
│   ├── models/                 # GLB do hero 3D
│   ├── og/                     # imagens Open Graph
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── pages/                  # rotas Astro
│   │   ├── index.astro
│   │   ├── sobre.astro
│   │   ├── servicos.astro
│   │   ├── contato.astro
│   │   └── en/
│   │       ├── index.astro
│   │       ├── about.astro
│   │       ├── services.astro
│   │       └── contact.astro
│   ├── layouts/
│   │   └── Base.astro          # head, meta, hreflang, analytics
│   ├── components/
│   │   ├── astro/              # estáticos (renderizam em build)
│   │   │   ├── Header.astro
│   │   │   ├── Footer.astro
│   │   │   ├── Section.astro
│   │   │   └── Pillar.astro
│   │   └── react/              # ilhas hidratadas
│   │       ├── Hero3D/
│   │       │   ├── Hero3D.tsx
│   │       │   ├── Hero3D.module.css
│   │       │   └── scene.ts
│   │       ├── ContactForm/
│   │       │   ├── ContactForm.tsx
│   │       │   └── ContactForm.module.css
│   │       └── Cursor/
│   │           └── Cursor.tsx
│   ├── content/                # conteúdo i18n (Astro Content Collections)
│   │   ├── pt/
│   │   │   ├── home.md
│   │   │   ├── sobre.md
│   │   │   ├── servicos.md
│   │   │   └── contato.md
│   │   └── en/
│   │       ├── home.md
│   │       └── ...
│   ├── styles/
│   │   ├── tokens.css          # custom properties (cores, fontes, spacing, motion)
│   │   ├── reset.css
│   │   └── global.css
│   ├── lib/
│   │   ├── emailjs.ts          # wrapper do SDK
│   │   ├── seo.ts              # builder de meta tags
│   │   └── i18n.ts             # helpers de tradução
│   └── env.d.ts
├── astro.config.mjs
├── tsconfig.json
├── package.json
├── .gitignore
├── .nvmrc
└── README.md
```

---

## 4. Build & deploy

### Pipeline

```
git push (main)  →  github.com/DionisioDev/diretriz
                  ↓
Cloudflare Pages detecta o push
                  ↓
Build: npm install && npm run build
                  ↓
Output: ./dist/  (HTML estático + assets)
                  ↓
Deploy edge global (200+ PoPs)
                  ↓
https://diretriztecnologia.com.br
```

### Configuração Cloudflare Pages
- Branch de produção: `main`
- Branch de preview: qualquer outra (gera URL temporária)
- Build command: `npm run build`
- Build output: `dist`
- Node version: 20 LTS (definir em `.nvmrc`)
- Variáveis de ambiente:
  - `PUBLIC_EMAILJS_SERVICE_ID`
  - `PUBLIC_EMAILJS_TEMPLATE_ID`
  - `PUBLIC_EMAILJS_PUBLIC_KEY`

> Variáveis com prefixo `PUBLIC_` são expostas ao client (necessário para EmailJS, que roda no browser). Não há segredo verdadeiro neste estágio. Quando o chatbot entrar (v2), a chave do LLM **fica no Worker**, nunca exposta.

### Domínio
- Comprado externamente
- DNS apontado para Cloudflare
- HTTPS automático (cert managed pelo Cloudflare)
- CNAME `www` → `diretriztecnologia.com.br`

---

## 5. SEO

### Estratégia de base
- HTML pré-renderizado em build → Google indexa sem JS execution
- Meta tags por página via prop do `<Base>` layout
- `<link rel="alternate" hreflang>` para PT/EN
- `<link rel="canonical">` em todas as páginas
- Open Graph + Twitter Card por página
- Sitemap automático via `@astrojs/sitemap`
- `robots.txt` permitindo tudo, apontando sitemap
- Structured data (JSON-LD) — `Organization` no layout, `WebPage` por rota
- Performance Core Web Vitals dentro do verde (afeta ranking)

### Estrutura de URL
- PT: `/`, `/sobre`, `/servicos`, `/contato`
- EN: `/en/`, `/en/about`, `/en/services`, `/en/contact`
- Slugs em **português ou inglês** conforme idioma (não `/pt/sobre` — PT é raiz)

### Palavras-chave alvo (v1, a refinar)
- "desenvolvimento de software sob medida"
- "automação de processos empresariais"
- "integração de IA em sistemas existentes"
- "consultoria técnica software"
- Versão EN equivalente

---

## 6. Internacionalização (i18n)

### Estratégia
- Astro **i18n nativo** com routing por pasta (`/` para PT, `/en/` para EN)
- Conteúdo em **Content Collections** (`src/content/pt/`, `src/content/en/`)
- Helper `t(key, locale)` para strings curtas (header, CTAs, footer)
- Strings de UI em arquivos `pt.json` / `en.json` em `src/lib/`
- Detecção de idioma: header HTTP `Accept-Language` no primeiro acesso, depois respeita escolha manual via switcher
- Hreflang gerado automático no `<Base>`

### Switcher de idioma
- No header: `PT | EN`
- Mantém path equivalente ao trocar (ex: `/sobre` ↔ `/en/about`)
- Persiste preferência em localStorage (chave `diretriz.lang`)

---

## 7. Performance & estratégia 3D

### Orçamento de performance
| Métrica | Alvo | Crítico |
|---|---|---|
| LCP | < 2.5s | < 4.0s |
| CLS | < 0.1 | < 0.25 |
| INP | < 200ms | < 500ms |
| Bundle JS inicial | < 150kb gzip | < 300kb |
| Total de transferência (home) | < 1.5MB | < 3MB |

### Como o 3D não detona a performance

1. **Hero 3D carrega em ilha** — Astro renderiza HTML estático com fallback (gradient + imagem), React hidrata depois. LCP fica no HTML, não no canvas.
2. **GLB comprimido com Draco / Meshopt**, < 500kb.
3. **`<Hero3D client:visible>`** — só carrega quando entra no viewport.
4. **Texturas em KTX2** quando possível.
5. **Reduce motion** respeitado: `prefers-reduced-motion` desliga animações pesadas e 3D vira imagem estática.
6. **Mobile**: cena simplificada (menos polígonos, sem post-processing) ou substituída por vídeo curto.

### Fonts (Geist Sans + Geist Mono, self-hosted)
- Arquivos `.woff2` em `public/fonts/`, carregados via `@font-face` com `font-display: swap`
- Preload do peso usado no hero (`<link rel="preload" as="font">`)
- Subset latin + latin-ext (cobre PT + EN)
- Sem chamada externa ao Google Fonts (privacidade + performance)

### Imagens
- `astro:assets` para otimização automática
- Formato AVIF com fallback WebP
- `loading="lazy"` exceto hero
- `width`/`height` sempre declarados (evita CLS)

---

## 8. Acessibilidade (WCAG 2.1 AA)

- Contraste mínimo 4.5:1 em texto normal, 3:1 em texto grande — validar paleta no Stark/Contrast
- Navegação por teclado: focus ring visível, ordem lógica, skip-to-content
- ARIA apenas onde HTML semântico não basta
- Animação respeita `prefers-reduced-motion`
- 3D tem alternativa estática para leitor de tela
- Form de contato: labels associados, `aria-invalid`, `aria-describedby` em erros
- Idioma declarado no `<html lang>` e atualizado no switcher
- Imagens decorativas com `alt=""`, imagens de conteúdo com alt descritivo

---

## 9. Segurança

### Headers HTTP (arquivo `public/_headers`, aplicado pelo Cloudflare Pages)
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://static.cloudflareinsights.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```
> A CSP é same-origin: o browser só faz `fetch` para `/api/chat` e `/api/contact`.
> Resend roda server-side e o Workers AI é binding — não há domínio de API externo no client.
> EmailJS foi **removido** do stack (não aparece mais na CSP).

### Form e dados
- Envio via **Resend** server-side na Pages Function `/api/contact` (`functions/_shared/email.ts`); `RESEND_API_KEY` é secret no Cloudflare, nunca exposto ao client.
- Validação de Origin nos POST de `/api/*` (`functions/_middleware.ts`) + rate-limit por IP e teto diário de e-mails (`functions/_shared/email-budget.ts`).
- Honeypot (campo `website`) + validação de tamanho (name ≤ 120, company ≤ 160, phone ≤ 40, message ≤ 4000, e-mail ≤ 254) em `functions/api/contact.ts`.
- Sanitização: `escapeHtml` em todos os campos e na transcrição do template (`functions/_shared/email.ts`); transcrição marcada como conteúdo não confiável do visitante.
- Detalhe de erro do Resend fica só no log do servidor (não vaza ao cliente).
- LGPD: **pendente** publicar política de privacidade e aviso de consentimento no envio (ver `docs/security-review.md`).
- Sem armazenamento próprio de leads na v1 (chegam só por e-mail).

### Dependências
- `npm audit` no CI
- Renovate ou Dependabot habilitado
- Apenas pacotes mantidos e populares

---

## 10. Form de contato (EmailJS)

### Fluxo
```
Usuário preenche form  →  React valida  →  EmailJS SDK envia  →
Template no EmailJS dispara e-mail  →  Diretriz recebe lead estruturado
```

### Configuração
- Conta EmailJS gratuita (200 e-mails/mês — suficiente para v1)
- Service: SMTP da Diretriz (ou Gmail/SES via SMTP)
- Template: 1 template parametrizado com todos os campos do form
- Destinatário: `diretriztecnologia@gmail.com` (definido)

### Validação
- Client-side: HTML5 + validação custom (email, length)
- Honeypot anti-bot
- Mensagem de sucesso/erro inline (não alert)
- Estado de loading no submit
- Bloqueio de envio duplicado

### Fallback
Se EmailJS falhar, exibir botão "Copiar e-mail e enviar manualmente" com link `mailto:` pré-preenchido.

---

## 11. Analytics

**Cloudflare Web Analytics** habilitado no painel do Cloudflare Pages.

- Token JS injetado automaticamente
- Mede: pageviews, referrer, país, navegador, Core Web Vitals reais
- **Sem cookie** → não precisa banner LGPD
- Dashboard nativo do Cloudflare

### Eventos a tracear (custom)
A v1 não terá eventos custom (Cloudflare Web Analytics tem suporte limitado). Se necessário, futuro adicionar:
- `lead_form_submitted`
- `lead_form_failed`
- `lang_switched`
- `pillar_clicked`

Provavelmente migrar para **Plausible self-hosted** ou **PostHog free tier** quando precisar de eventos custom robustos.

---

## 12. Decisões arquiteturais (ADR)

### ADR-001 — Astro em vez de Next.js / React puro
**Contexto**: precisamos de SEO impecável + ilhas React interativas.
**Decisão**: Astro.
**Por quê**: SSG nativo, hidratação parcial (`client:*` directives), bundle muito menor que Next.js para sites estáticos, suporte i18n nativo. Next seria overkill; React puro precisaria de prerendering manual.
**Trade-off**: time menos familiar com Astro do que React, mas curva de aprendizado é baixa.

### ADR-002 — CSS Modules em vez de Tailwind
**Contexto**: legibilidade do código foi requisito explícito do stakeholder.
**Decisão**: CSS Modules + custom properties para tokens.
**Por quê**: classes nomeadas semanticamente, CSS isolado por componente, zero runtime, design tokens centralizados em `tokens.css`.
**Trade-off**: digitação um pouco maior; mas legibilidade ganha.

### ADR-003 — Cloudflare Pages em vez de GitHub Pages
**Contexto**: avaliados ambos para custo zero.
**Decisão**: Cloudflare Pages.
**Por quê**: edge functions futuras (chatbot v2), preview de PR, melhor CDN. Mesmo preço (R$ 0).
**Trade-off**: mais um vendor além do GitHub. Aceitável.

### ADR-004 — EmailJS em vez de backend próprio
**Contexto**: form precisa enviar e-mail; v1 sem backend.
**Decisão**: EmailJS free tier.
**Por quê**: zero infra, 200 envios/mês cabem no volume esperado.
**Trade-off**: dependência de SaaS terceiro; chave pública no client (mas escopo dela é limitado por design). Substituível por Worker + Resend quando passar de 200/mês.

### ADR-005 — Cloudflare Web Analytics em vez de GA4
**Contexto**: precisava de analytics simples sem fricção LGPD.
**Decisão**: Cloudflare Web Analytics.
**Por quê**: sem cookie, sem banner, suficiente para visão de tráfego, integrado ao Cloudflare.
**Trade-off**: eventos custom limitados. Migrar quando precisar de funil avançado.

### ADR-006 — Chatbot adiado para v2
**Contexto**: stakeholder priorizou time-to-market.
**Decisão**: v1 sem chatbot. Stack do chat fica para depois.
**Por quê**: chatbot de qualidade exige Worker + prompt engineering + UX testada. Lança o site primeiro, valida tração, depois investe.
**Trade-off**: perde diferencial visual no lançamento. Mitigação: hero 3D já entrega "uau".

---

## 13. Roadmap técnico

### v1 — Lançamento (4–6 semanas estimadas)
- Setup do projeto Astro + React + R3F
- Layouts e componentes estáticos
- Páginas em PT
- Hero 3D
- Form com EmailJS
- Tradução EN
- SEO (meta, sitemap, hreflang, JSON-LD)
- Deploy Cloudflare Pages
- DNS apontado
- Cloudflare Web Analytics ativo
- Smoke test e QA visual

### v2 — Pós-lançamento (3–6 meses)
- Chatbot de qualificação (Cloudflare Worker + LLM)
- Página de cases
- Blog técnico (Content Collections)
- A/B test no hero (Cloudflare A/B)
- Otimização SEO baseada em search console

### v3 — Escala
- Demo interativa de IA pública
- Calculadora de orçamento
- Integração CRM (webhook do form → Pipedrive/HubSpot)
- Newsletter (Buttondown / ConvertKit)

---

## 14. Pontos em aberto

- [ ] Modelo 3D do hero (criar do zero ou customizar GLB existente)
- [ ] Conta EmailJS criada (usuário fará)
- [ ] Conta GitHub + repo criado
- [ ] Cloudflare Pages conectado ao repo do GitHub
- [ ] Política de privacidade redigida (LGPD)
- [ ] DNS apontado para Cloudflare
