# Deployment (Vercel)

## 1. Pre-Deploy Checks
Run from `frontend/`:

```bash
npm install
npm run build
```

## 2. Environment Variables (Vercel)
Set these in Vercel Project Settings -> Environment Variables:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_KEY=
NEXT_PUBLIC_SITE_URL=https://<your-domain>
JWT_SECRET=
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
BEDROCK_MAX_TOKENS=512
BEDROCK_TEMPERATURE=0.2
ADMIN_EMAIL=jeevanparajuli856@gmail.com
```

## 3. Vercel Project Settings
- Framework preset: `Next.js`
- Root Directory: `frontend`
- Build Command: `npm run build`
- Install Command: `npm install`

## 4. Ren'Py Web Build Sync
After exporting new Ren'Py web distribution:

1. Copy exported files into `frontend/public/renpy-game/`
2. Run:

```bash
cd frontend
npm run renpy:bridge
npm run renpy:bridge:check
```

3. Hard refresh browser (`Ctrl+Shift+R`)

## 5. Smoke Test
- `/` loads home page
- `/code-entry` validates code
- `/game` blocks direct access without code-entry token
- Chat icon appears only from hallway scene onward
- Admin login + dashboard loads
- End of game requires final code verification
