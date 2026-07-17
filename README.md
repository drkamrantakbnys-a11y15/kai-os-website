# Project KAI / KAI OS Website

The public marketing site for Project KAI and KAI OS, a modular AI operating system for automation, research, content creation, and digital business workflows. Live at [projectkai.dev](https://projectkai.dev).

Built with [Astro](https://astro.build).

## Project Structure

```text
/
├── public/              # Static assets (favicon, robots.txt, sitemap.xml)
├── src
│   ├── assets/          # Images and SVGs
│   ├── components/      # Page sections (Hero, About, Agents, Research, Footer, ...)
│   ├── layouts/         # Shared page layout
│   └── pages/           # Routes (index, about, agents, research, blog, contact, ...)
└── package.json
```

## Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                            |
| :------------------------ | :------------------------------------------------ |
| `npm install`              | Installs dependencies                             |
| `npm run dev`               | Starts local dev server at `localhost:4321`       |
| `npm run build`             | Build the production site to `./dist/`            |
| `npm run preview`           | Preview the build locally, before deploying       |
| `npm run astro ...`         | Run CLI commands like `astro add`, `astro check`  |
| `npm run astro -- --help`  | Get help using the Astro CLI                      |

## Learn More

Feel free to check the [Astro documentation](https://docs.astro.build).
