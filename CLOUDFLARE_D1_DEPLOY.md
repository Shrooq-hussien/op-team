# 🚀 Deploy to Cloudflare D1 + Pages

Complete guide to deploy with Cloudflare's native database (no Firebase needed!).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge                           │
│  ┌─────────────────┐     ┌──────────────────────────────┐  │
│  │  Cloudflare Pages │     │  Cloudflare Worker (API)     │  │
│  │  (Frontend)       │────▶│  /api/events, /api/members...│  │
│  │                   │     │                              │  │
│  └─────────────────┘     └──────────────┬───────────────┘  │
│                                          │                   │
│                              ┌───────────▼───────────┐      │
│                              │   Cloudflare D1       │      │
│                              │   (SQLite Database)    │      │
│                              └───────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1: Create D1 Database

```bash
# Navigate to worker directory
cd worker

# Install dependencies
npm install

# Login to Cloudflare
npx wrangler login

# Create the D1 database
npx wrangler d1 create ieee-creative-arena-db
```

Copy the `database_id` from the output and update `worker/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "ieee-creative-arena-db"
database_id = "YOUR_DATABASE_ID_HERE"  # ← Paste here
```

---

## Step 2: Initialize Database Schema

```bash
# Execute schema.sql to create tables
npx wrangler d1 execute ieee-creative-arena-db --file=../schema.sql

# Verify tables were created
npx wrangler d1 execute ieee-creative-arena-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

---

## Step 3: Deploy Worker API

```bash
# Deploy the worker
npx wrangler deploy
```

After deployment, you'll get a URL like:
```
https://ieee-creative-arena-api.YOUR_SUBDOMAIN.workers.dev
```

Copy this URL for the next step.

---

## Step 4: Configure Frontend

Create `.env` file in the project root:

```bash
# .env
VITE_API_URL=https://ieee-creative-arena-api.YOUR_SUBDOMAIN.workers.dev
```

---

## Step 5: Deploy Frontend to Cloudflare Pages

### Option A: Via Dashboard
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Workers & Pages** → **Create Application** → **Pages**
3. **Connect to Git** → Select your repo
4. Build settings:
   - **Production branch**: `main`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Add Environment Variable:
   - `VITE_API_URL` = `https://ieee-creative-arena-api.YOUR_SUBDOMAIN.workers.dev`
6. Click **Save and Deploy**

### Option B: Via CLI
```bash
# Build the project
npm run build

# Deploy to Pages
npx wrangler pages deploy dist --project-name=ieee-menoufia-creative-arena
```

---

## Step 6: Update Worker CORS

After Pages deployment, update `worker/wrangler.toml`:

```toml
[vars]
FRONTEND_URL = "https://ieee-menoufia-creative-arena.pages.dev"
```

Redeploy the worker:
```bash
cd worker
npx wrangler deploy
```

---

## 🎉 You're Live!

Your app is now running entirely on Cloudflare:
- **Frontend**: `https://ieee-menoufia-creative-arena.pages.dev`
- **API**: `https://ieee-creative-arena-api.YOUR_SUBDOMAIN.workers.dev`
- **Database**: Cloudflare D1 (SQLite at the edge)

---

## 📊 Database Management

### View Data
```bash
# List all events
npx wrangler d1 execute ieee-creative-arena-db --command="SELECT * FROM events;"

# List all members
npx wrangler d1 execute ieee-creative-arena-db --command="SELECT * FROM members;"

# List all ideas
npx wrangler d1 execute ieee-creative-arena-db --command="SELECT * FROM ideas;"
```

### Reset Database
```bash
# Delete all data
npx wrangler d1 execute ieee-creative-arena-db --command="DELETE FROM ideas;"
npx wrangler d1 execute ieee-creative-arena-db --command="DELETE FROM members;"
npx wrangler d1 execute ieee-creative-arena-db --command="DELETE FROM events;"

# Re-initialize schema
npx wrangler d1 execute ieee-creative-arena-db --file=../schema.sql
```

---

## 🔧 Local Development

```bash
# Terminal 1: Start Worker API locally
cd worker
npx wrangler dev

# Terminal 2: Start Frontend locally
cd ..
npm run dev
```

The local Worker will run on `http://8787` and auto-use local D1 database.

---

## 📈 Free Tier Limits

| Resource | Free Limit |
|----------|------------|
| D1 Reads | 5 million/day |
| D1 Writes | 100,000/day |
| Worker Requests | 100,000/day |
| Pages Bandwidth | Unlimited |
| Pages Builds | 500/month |

More than enough for an IEEE student branch! 🎓

---

## 🐛 Troubleshooting

### CORS Errors
- Ensure `FRONTEND_URL` in worker matches your Pages URL exactly
- Redeploy worker after changing

### Database Not Found
- Verify `database_id` in `worker/wrangler.toml`
- Run `npx wrangler d1 list` to see all databases

### Build Fails
```bash
rm -rf node_modules dist
npm install
npm run build
```

### Worker Not Responding
```bash
# Check worker logs
npx wrangler tail
```

---

## 🌐 Custom Domain (Optional)

### For Pages:
1. Pages → **Custom domains** → Add domain
2. Update DNS as instructed

### For Worker:
1. Workers → **Settings** → **Triggers** → **Custom Domains**
2. Add `api.ieeemenoufia.org`

---

**Everything runs on Cloudflare's edge network — blazing fast worldwide!** ⚡
