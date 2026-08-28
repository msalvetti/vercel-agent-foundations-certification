# Vercel Swag Store — Vercel Agent Foundations Certification

A Next.js e-commerce app used as the hands-on project for the Vercel Agent Foundations Certification.

The repo has two layers:

1. **A working storefront** — products, search, product pages, cart, promotions, and categories, backed by the live Vercel Swag Store API. There is no local product or cart database; reads happen in Server Components and mutations go through Server Actions, so the deployment-protection secret never reaches the client.
2. **The agents built during the certification** — a customer shopping agent and a back-office admin agent (`lib/agent.ts`, `lib/tools.ts`, `lib/workflows/*`, the `/api/chat*` and `/api/admin/chat` routes). The starter left these as stubs returning `501`; they are implemented here.

## Certification submission

The certification spans four chapter groups, and the last one lives in a separate repository because `eve init` scaffolds its own project.

| Chapter group | Where it lives |
| --- | --- |
| Project Setup | this repo |
| Build a Shopping Agent — Chat Agent, Tools, Generative UI, Workflows | this repo |
| Build a Store Admin Agent — Admin Agent Setup, Sandbox, Persistent Memory | this repo |
| The Agent Framework — Setup, Tools, Skills, Subagents | **[vercel-my-agent-eve](https://github.com/msalvetti/vercel-my-agent-eve)** |

### What to look at in this repo

| Chapter | Files |
| --- | --- |
| Chat Agent | `lib/agent.ts`, `app/api/chat/route.ts`, `components/agent-chat.tsx` |
| Tools | `lib/tools.ts` — catalog, category, product-detail and return tools |
| Generative UI | `components/agent-product-list.tsx`, `components/agent-product-card.tsx` |
| Workflows | `lib/workflows/return-flow.ts` (one durable step per action), `lib/workflows/chat-flow.ts` (`DurableAgent`), `app/api/chat/[id]/stream/route.ts` (resumable stream) |
| Admin Agent Setup | `lib/workflows/admin-chat-flow.ts`, the four back-office tools in `lib/tools.ts`, `components/admin-agent-chat.tsx` |
| Sandbox | `lib/sandbox.ts`, the `bash` tool in `lib/tools.ts`, the terminal renderer in `components/admin-agent-chat.tsx` |
| Persistent Memory | `readMemories()` and the composed memory protocol in `lib/workflows/admin-chat-flow.ts` |

## Tech stack

- **Next.js 16** (App Router) with **React 19**
- **TypeScript** (`strict`), `@/*` path alias → project root
- **Tailwind CSS v4** + **shadcn/ui** (new-york style); `lucide-react` icons
- **AI SDK 7** (`ai`, `@ai-sdk/react`) for the agent chapters
- **pnpm** (see `pnpm-lock.yaml`)

## Getting started

Prerequisites: Node.js 18+ and [pnpm](https://pnpm.io).

```bash
pnpm install
cp .env.example .env.local   # then fill in BYPASS_SECRET
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The storefront only needs `BYPASS_SECRET` to run. The agent routes also need `AI_GATEWAY_API_KEY`. The `STORE_BUSINESS_AGENT_*` variables belong to an alternative admin-agent setup and are unused here.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `AI_GATEWAY_API_KEY` | Yes, for the agents | Vercel AI Gateway key. Every model call goes through it. Without it the agent routes fail on the first request. |
| `BYPASS_SECRET` | Yes | Vercel deployment-protection bypass secret. Sent as the `x-vercel-protection-bypass` header on every API call. Server-only — never give it a `NEXT_PUBLIC_` prefix. |
| `API_BASE_URL` | No | Override the backend API base URL. Defaults to `https://vercel-agentic-swag-store-api.vercel.app/api`. |
| `STORE_BUSINESS_AGENT_URL` | Admin chat only | HTTP base URL of the deployed store-business-agent. |
| `STORE_BUSINESS_AGENT_BASIC_USER` | Admin chat only | HTTP Basic auth user matching the agent's `ADMIN_AGENT_BASIC_USER`. |
| `STORE_BUSINESS_AGENT_BASIC_PASSWORD` | Admin chat only | HTTP Basic auth password matching the agent's `ADMIN_AGENT_BASIC_PASSWORD`. |
| `NEXT_PUBLIC_SITE_URL` | No | Public site URL used for metadata. Defaults to `http://localhost:3000`. |

`.env.local` is gitignored; `.env.example` is the redacted template.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the dev server on http://localhost:3000 |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Wired to `eslint .`, but ESLint is not installed yet — this fails until a linter is added |

There is no test framework configured.

## Project structure

```
app/
  (store)/                 # storefront route group
    page.tsx               # / — home (force-static, revalidate 60)
    search/                # /search — dynamic, reads ?q & ?category
    products/[param]/      # /products/:idOrSlug — SSG product detail
  admin/                   # /admin dashboard + /admin/login (demo auth)
  api/
    chat/route.ts          # customer chat — starts the chatFlow workflow
    chat/[id]/stream/      # re-attaches to a running workflow's stream
    admin/chat/route.ts    # admin agent chat — starts the adminChatFlow workflow
  layout.tsx               # synchronous root layout (keeps routes statically renderable)
lib/
  api.ts                   # typed fetch wrapper for the Swag Store API (server-only)
  types.ts                 # shared API/domain types
  format.ts                # formatPrice() — API prices are integer cents
  cart-token.ts            # httpOnly cart_token cookie helpers
  cart-actions.ts          # 'use server' cart mutations (revalidateTag('cart'))
  admin-auth.ts            # demo admin auth constants
  admin-actions.ts         # 'use server' admin login/logout
  agent.ts, tools.ts       # ToolLoopAgent + the tools both agents share
  workflows/               # durable chat / admin-chat / return flows
components/
  cart-*.tsx               # cart provider, button, and sheet (client)
  agent-chat.tsx, admin-agent-chat.tsx, ai-elements/   # chat UI (workshop)
  header, footer, product-*, promo-banner, category-showcase, ...
```

## How it works

### Storefront & data layer

`lib/api.ts` is a typed `fetch` wrapper that talks to the live Swag Store API and injects the `BYPASS_SECRET`. It's server-only by convention. Read endpoints use ISR (`next: { revalidate: 300, tags: [...] }`); stock checks and all cart endpoints use `cache: 'no-store'`. Cart mutations run as Server Actions and call `revalidateTag('cart')`.

The cart UUID issued by the API is stored in an `httpOnly` `cart_token` cookie (`lib/cart-token.ts`). `components/cart-provider.tsx` hydrates the cart on the client at mount and uses `useOptimistic` for snappy updates, so the root layout can stay synchronous and routes can render statically.

Render modes: `/` is **static** (`force-static`, `revalidate = 60`), `/products/[param]` is **SSG** (`generateStaticParams` + `generateMetadata`), and `/search` is **dynamic** (it reads `searchParams`).

### Admin

`/admin` is gated behind `/admin/login` with a simple demo cookie set by `lib/admin-actions.ts`. The dashboard hosts the admin agent chat UI, which posts to `/api/admin/chat`. That route starts the `adminChatFlow` workflow and streams its output back.

## Deployment

Deploys to [Vercel](https://vercel.com). In the project's environment variables set `BYPASS_SECRET` (and the `STORE_BUSINESS_AGENT_*` values if you've built the admin-agent chapter). `images.remotePatterns` in `next.config.mjs` is whitelisted for the Vercel Blob hosts the API serves product images from — add hostnames there if the API starts returning images from a new domain.
