# 🚀 Deploy to Cloudflare Pages

## Option 1: Deploy via Cloudflare Dashboard (Recommended)

### Step 1: Push to GitHub
```bash
# Initialize git if not already
git init
git add .
git commit -m "Initial commit - IEEE Creative Arena"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/ieee-creative-arena.git
git branch -M main
git push -u origin main
```

### Step 2: Connect to Cloudflare Pages
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click **Workers & Pages** (left sidebar)
3. Click **Create Application**
4. Select **Pages** tab
5. Click **Connect to Git**
6. Authorize GitHub and select your repo `ieee-creative-arena`
7. Configure build settings:
   - **Production branch**: `main`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node.js version**: `18` (in Environment Variables)
8. Click **Save and Deploy**

### Step 3: Add Firebase Environment Variables
1. In your Cloudflare Pages project → **Settings** → **Environment variables**
2. Add these variables:

| Variable Name | Value |
|--------------|-------|
| `VITE_FIREBASE_API_KEY` | Your Firebase API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | your-project.firebaseapp.com |
| `VITE_FIREBASE_PROJECT_ID` | your-project-id |
| `VITE_FIREBASE_STORAGE_BUCKET` | your-project.appspot.com |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | 123456789 |
| `VITE_FIREBASE_APP_ID` | 1:123456789:web:abc123 |

3. Click **Save**
4. Go to **Deployments** → Click **Retry deployment** on latest

---

## Option 2: Deploy via CLI (Wrangler)

### Step 1: Install Wrangler
```bash
npm install -g wrangler
```

### Step 2: Login to Cloudflare
```bash
wrangler login
```

### Step 3: Build and Deploy
```bash
# Build the project
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=ieee-menoufia-creative-arena
```

---

## Option 3: Deploy via GitHub Actions (Auto-deploy)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=ieee-menoufia-creative-arena
```

---

## 🔧 Update Firebase Config for Environment Variables

Update `src/lib/firebase.ts` to use environment variables:

```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};
```

---

## 🌐 Custom Domain (Optional)

1. In Cloudflare Pages → **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain (e.g., `arena.ieeemenoufia.org`)
4. Follow DNS instructions
5. SSL is automatic! ✅

---

## ✅ Post-Deployment Checklist

- [ ] App loads at `https://your-project.pages.dev`
- [ ] Can create new events
- [ ] Can join as member
- [ ] Can upload ideas
- [ ] Can react to ideas
- [ ] Leaderboard updates in real-time
- [ ] Works on mobile
- [ ] Custom domain connected (optional)

---

## 🐛 Troubleshooting

### Build fails
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Firebase not connecting
- Check environment variables are set correctly
- Ensure Firestore is in "test mode"
- Check browser console for errors

### 404 on page refresh
- Ensure `public/_redirects` file exists with `/* /index.html 200`

---

**Your app will be live at**: `https://ieee-menoufia-creative-arena.pages.dev` 🎉
