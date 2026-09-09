<p align="center">
  <img src="public/favicon.svg" width="72" height="72" alt="Random" />
</p>

<h1 align="center">Random</h1>
<p align="center"><strong>Una pieza de contenido curado a la vez.</strong></p>

Random revela un hecho, un lugar, una palabra o una pregunta por vez, con la
calma de una revista impresa: sin feed, sin scroll infinito, una sola pieza
en pantalla. Las piezas se curan desde Wikidata, NASA y Wikipedia, se
verifican y reescriben con ayuda de un LLM, y también nacen de sugerencias de
visitantes que pasan por una cola de revisión editorial antes de publicarse.

## Stack

- [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router) — React 19, SSR, ruteo por archivos
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Drizzle ORM](https://orm.drizzle.team/) sobre [Neon](https://neon.tech/) (Postgres serverless)
- [Nitro](https://nitro.build/) como adaptador de servidor
- [Groq](https://groq.com/) para reescritura y verificación en el pipeline de curaduría
- [Biome](https://biomejs.dev/) para lint y formato

## CI

Cada PR contra `master` corre el workflow de [Budgetly](.github/workflows/budgetly.yml), que audita el rendimiento con Lighthouse y reporta las métricas.
