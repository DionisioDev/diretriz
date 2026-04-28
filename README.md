# Diretriz Tecnologia

Site institucional — `diretriztecnologia.com.br`

> Construímos. Rápido. Sob medida. Robusto.

## Stack

Astro 5 + React 19 (islands) · CSS Modules · Geist · Cloudflare Pages

Detalhes completos em [`docs/architecture.md`](docs/architecture.md) e [`docs/business.md`](docs/business.md).

## Comandos

```bash
npm install       # instala dependências
npm run dev       # servidor local em http://localhost:4321
npm run build     # build de produção em ./dist
npm run preview   # preview do build
npm run check     # valida tipos e estrutura Astro
```

Requer **Node 20+** (ver [`.nvmrc`](.nvmrc)).

## Estrutura

```
src/
  pages/          rotas (Astro)
  layouts/        Base layout com head/meta/SEO
  components/
    astro/        componentes estáticos (renderizam em build)
    react/        ilhas hidratadas (3D, form, chat futuro)
  styles/         tokens.css, reset.css, global.css
  content/        conteúdo i18n PT/EN
  lib/            utils (seo, i18n, emailjs)
public/           assets servidos como estão (fonts, models, og)
docs/             documentação de produto e arquitetura
```

## Deploy

Push em `main` → Cloudflare Pages detecta → build → publica em `diretriztecnologia.com.br`.

Configuração detalhada na seção 4 de [`docs/architecture.md`](docs/architecture.md).
