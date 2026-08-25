# Project KAI / KAI OS Website

The public product and documentation site for Project KAI and KAI OS: a local-first, human-controlled AI operating system for conversation, memory, governed automation, content production, research, and paper-trading intelligence. Live at [projectkai.dev](https://projectkai.dev).

Built with [Astro](https://astro.build).

## Project Structure

```text
/
├── functions/           # Optional public-safe serverless bridge
├── public/              # Static assets (favicon, robots.txt, sitemap.xml)
├── scripts/             # Public-site verification and maintenance
├── src
│   ├── assets/          # Images and SVGs
│   ├── components/      # Page sections (Hero, About, Agents, Research, Footer, ...)
│   ├── data/            # Curated and generated public-safe data
│   ├── layouts/         # Shared page layout
│   └── pages/           # Routes (index, about, agents, research, blog, contact, ...)
├── supabase/            # Optional community persistence configuration
└── package.json
```

## Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                            |
| :------------------------ | :------------------------------------------------ |
| `npm install`              | Installs dependencies                             |
| `npm run dev`               | Starts local dev server at `localhost:4321`       |
| `npm run build`             | Build the production site to `./dist/`            |
| `npm run verify`            | Validate public routes, links, metadata, and safety markers |
| `npm run preview`           | Preview the build locally, before deploying       |
| `npm run astro ...`         | Run CLI commands like `astro add`, `astro check`  |
| `npm run astro -- --help`  | Get help using the Astro CLI                      |

## Learn More

Feel free to check the [Astro documentation](https://docs.astro.build).
