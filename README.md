# The Path of Function

Educational visual novel project that teaches Python functions through a Ren'Py game, wrapped by a Next.js web app with telemetry, admin tools, and an in-game AI tutor.

## Repo Structure
- `game/` - Ren'Py source
- `frontend/` - Next.js app (UI + API routes) for students/admin
- `database/` - SQL/schema assets
- `infra/` - infrastructure templates
- `docs/` - current project documentation

## Local Development

### 1) Frontend + API
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

App runs at `http://localhost:3000`.

### 2) Ren'Py Game
- Open project in Ren'Py launcher.
- Build web distribution when needed.
- Copy exported web files to `frontend/public/renpy-game/`.

## Ren'Py Bridge Step (Required after each web export)

```bash
cd frontend
npm run renpy:bridge
npm run renpy:bridge:check
```

Without this, telemetry/chat sync can break.

## Deploy to Vercel
- Set Vercel project root directory to `frontend`.
- Configure required environment variables.
- Deploy from the main branch.

Full guide: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Current Docs
- [Documentation Index](docs/README.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Telemetry and Chat Contract](docs/TELEMETRY_AND_CHAT.md)
- [Game Content Notes](docs/GAME_CONTENT.md)

## License
MIT - see [LICENSE](LICENSE).
