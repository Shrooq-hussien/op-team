# 🚀 Step-by-Step Deployment Guide for IEEE Menoufia SB

This is your official deployment guide for **Cloudflare Pages + Cloudflare D1 + Cloudflare Workers**.
All Firebase references have been removed.

---

## 🏗️ Architecture

1. **Cloudflare D1 Database** (`ieee-creative-arena-db`): Holds your event tables.
2. **Cloudflare Worker API** (`ieee-creative-arena-api`): Acts as the secure bridge between the frontend and database.
3. **Cloudflare Pages** (Frontend): Serves your visual arena to all users.

---

## 📋 Step 1: Initialize Database Tables in Cloudflare Dashboard
You have already created the database `ieee-creative-arena-db` in the Cloudflare D1 dashboard. Let's execute the following queries in your D1 console to create your tables.

Go to: **Cloudflare Dashboard** → **Workers & Pages** → **D1** → **ieee-creative-arena-db** → **Console**

Copy and run these SQL queries one after another:

```sql
-- 1. Create Events Table
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  brief TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🎮',
  accent TEXT NOT NULL DEFAULT 'from-cyan-400 via-blue-500 to-violet-600',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Create Members Table
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Creative player',
  avatar_id TEXT NOT NULL,
  avatar_icon TEXT NOT NULL,
  avatar_name TEXT NOT NULL,
  avatar_trait TEXT NOT NULL,
  avatar_gradient TEXT NOT NULL,
  avatar_ring TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- 3. Create Ideas Table
CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  title TEXT NOT NULL,
  thought TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  reactions TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- 4. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_members_event_id ON members(event_id);
CREATE INDEX IF NOT EXISTS idx_ideas_event_id ON ideas(event_id);
CREATE INDEX IF NOT EXISTS idx_ideas_member_id ON ideas(member_id);
CREATE INDEX IF NOT EXISTS idx_members_points ON members(points DESC);
```

---

## 📋 Step 2: Configure and Deploy the Cloudflare Worker

Open `worker/wrangler.toml` inside your code.

1. Find your **Database ID** in the Cloudflare D1 dashboard for `ieee-creative-arena-db`.
2. Update the lines in `worker/wrangler.toml`:

```toml
name = "ieee-creative-arena-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "ieee-creative-arena-db"
database_id = "PASTE-YOUR-D1-DATABASE-ID-HERE" # ← Insert your D1 Database ID here!

[vars]
FRONTEND_URL = "*" # ← For now, wildcard allows any frontend connection
```

Now open your terminal, navigate to the `worker/` directory, and deploy the backend API:

```bash
cd worker
npm install
npx wrangler deploy
```

Take note of the URL provided by wrangler once deployed (e.g., `https://ieee-creative-arena-api.YOUR-SUBDOMAIN.workers.dev`).

---

## 📋 Step 3: Connect Frontend and Deploy to Cloudflare Pages

Go to your Cloudflare Dashboard to create your Pages frontend:

1. **Workers & Pages** → **Create Application** → Select the **Pages** tab.
2. Connect your GitHub repository where you uploaded this code.
3. Use the following build settings:
   - **Framework Preset**: None (or use `Create React App` / `Vite`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Expand **Environment variables (advanced)**.
5. Add the following variable:
   - **Variable Name**: `VITE_API_URL`
   - **Value**: `https://ieee-creative-arena-api.YOUR-SUBDOMAIN.workers.dev` (from Step 2)
6. Click **Save and Deploy**.

Cloudflare will automatically build and publish your site! 🚀
You will get a frontend URL like: `https://ieee-menoufia-creative-arena.pages.dev`

---

## 📋 Step 4: Add Final CORS Security (Optional)

To ensure that only your Cloudflare Pages can call your Worker API, update `worker/wrangler.toml` one last time:

```toml
[vars]
FRONTEND_URL = "https://YOUR-SUBDOMAIN.pages.dev" # ← Your actual frontend URL
```

Redeploy the worker one final time:

```bash
cd worker
npx wrangler deploy
```

---

## 📋 Local Development Testing

If you want to run both the frontend and API locally on your laptop:

### Terminal 1: Run Worker API Locally
```bash
cd worker
npm install
npx wrangler dev
```

### Terminal 2: Run Frontend Locally
```bash
# In the project root directory
npm install
npm run dev
```

The app will load on your local development server with direct access to Cloudflare edge database!
