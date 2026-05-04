# Byters Lead Finder 🚀

> AI-powered lead generation pipeline for web agencies. Automatically discovers local businesses without websites, generates personalized demo sites, and queues outreach messages.

---

## Architecture Overview

This project has **two independent processes** that must both run:

```
┌─────────────────────────────────────────────────────────────────┐
│                        How It Works                             │
│                                                                 │
│  [Browser / React UI]  ←──── http://localhost:5173             │
│         │                                                       │
│         │ POST /api/generate-leads                             │
│         ↓                                                       │
│  [Node.js Backend]     ←──── http://localhost:3000             │
│    engine/server.js                                             │
│         │                                                       │
│         ├──→ Apify (Google Maps scraper)                        │
│         ├──→ Supabase (lead database)                           │
│         ├──→ Groq AI (lead evaluation)                          │
│         └──→ Demo HTML generator → /public/demo/*.html          │
└─────────────────────────────────────────────────────────────────┘
```

| Folder | What it is |
|--------|-----------|
| `src/` | React frontend — the dashboard UI (runs on Vite, port 5173) |
| `engine/` | Node.js backend — scraper, AI, database, demo generator (port 3000) |
| `templates/` | Base HTML template that gets personalized for each lead |
| `public/demo/` | Generated demo websites (served by the backend) |

---

## Prerequisites

Before you start, make sure you have:

- **Node.js 18+** — [Download here](https://nodejs.org) (check: `node --version`)
- **npm** — comes with Node.js (check: `npm --version`)
- API accounts (see [Getting Your API Keys](#getting-your-api-keys) below)

---

## Quick Start

### Step 1 — Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### Step 2 — Install All Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend engine dependencies (REQUIRED — separate package)
cd engine
npm install
cd ..
```

> **Windows shortcut:** Double-click `start.bat` — it does both installs automatically.
> **Mac/Linux shortcut:** Run `bash start.sh`

### Step 3 — Configure Environment Variables

```bash
# Windows
copy .env.example .env

# Mac / Linux
cp .env.example .env
```

Then open `.env` and fill in your API keys. See [Getting Your API Keys](#getting-your-api-keys) below.

### Step 4 — Set Up the Database (Supabase)

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Open **SQL Editor** in your Supabase dashboard
3. Run the schema setup SQL: copy and paste the contents of `engine/schema.sql`
4. Also run `engine/schema_update_v2.sql` and `engine/schema_update_v3.sql` in order

### Step 5 — Start the Backend (Terminal 1)

```bash
npm run start:backend
```

You should see:
```
🚀 Byters Lead Engine running → http://localhost:3000
📂 Demo sites served at  → http://localhost:3000/demo/<slug>.html
```

Verify it's working: open [http://localhost:3000/api/health](http://localhost:3000/api/health)

### Step 6 — Start the Frontend (Terminal 2)

Open a **second terminal window** in the project root:

```bash
npm run start:frontend
```

You should see:
```
  VITE v8.x  ready in XXX ms
  ➜  Local: http://localhost:5173/
```

Open [http://localhost:5173](http://localhost:5173) in your browser. ✅

---

## Getting Your API Keys

You need **three API accounts**. All have free tiers that work for development.

### 1. Groq (AI Evaluation)
- Sign up at [console.groq.com](https://console.groq.com)
- Go to **API Keys** → **Create API Key**
- Add to `.env`:
  ```
  GROQ_API_KEY=gsk_...
  ```

### 2. Supabase (Database)
- Sign up at [supabase.com](https://supabase.com)
- Create a new project
- Go to **Project Settings → API**
- Add to `.env`:
  ```
  VITE_SUPABASE_URL=https://your-project-id.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJ...
  SUPABASE_URL=https://your-project-id.supabase.co
  SUPABASE_ANON_KEY=eyJ...
  ```
  *(Same values, listed twice — once for Vite/browser, once for Node.js)*

### 3. Apify (Google Maps Scraper)
- Sign up at [apify.com](https://apify.com)
- Go to **Settings → Integrations → API Tokens**
- Add to `.env`:
  ```
  APIFY_API_TOKEN=apify_api_...
  VITE_APIFY_API_KEY=apify_api_...
  ```

---

## How to Use

1. **Open the dashboard** at [http://localhost:5173](http://localhost:5173)
2. Click **"Find Leads with AI"** — this triggers the full pipeline:
   - Apify scrapes Google Maps for local businesses
   - Groq AI evaluates each lead (priority score, contact decision)
   - Demo websites are auto-generated for top leads
   - Results are stored in Supabase
3. View leads in the **Lead Finder** tab — click **"Send Pitch"** to open WhatsApp
4. Check the **Analytics** tab for pipeline stats and top prospects
5. See generated demos in the **Template** tab → **Generated Demos Portfolio**

---

## Available Scripts

From the **project root**:

| Command | What it does |
|---------|-------------|
| `npm run start:frontend` | Start the React dashboard (port 5173) |
| `npm run start:backend` | Start the Node.js engine (port 3000) |
| `npm run install:all` | Install both frontend and backend dependencies |
| `npm run dev` | Same as `start:frontend` |
| `npm run build` | Build production bundle for the frontend |

From the **`engine/` folder**:

| Command | What it does |
|---------|-------------|
| `npm run pipeline` | Run the full pipeline manually (Cafe in Mumbai by default) |
| `npm run ingest` | Run just the Apify scraper |

---

## Project Structure

```
byters-lead-finder/
├── src/                    # React frontend
│   ├── App.jsx             # Main dashboard UI
│   ├── supabase.js         # Supabase client (browser)
│   └── services/
│       └── db.js           # Frontend Supabase queries
│
├── engine/                 # Node.js backend (separate npm package)
│   ├── server.js           # Express API server (port 3000)
│   ├── pipeline.js         # Full pipeline orchestrator
│   ├── ingest.js           # Apify scraper
│   ├── normalize.js        # Lead deduplication & hashing
│   ├── groq.js             # AI evaluation via Groq
│   ├── demoGenerator.js    # Demo website generator
│   ├── db.js               # Supabase client (Node.js)
│   └── schema.sql          # Database schema (run once in Supabase)
│
├── templates/
│   └── demo.html           # Base template for generated demo sites
│
├── public/
│   └── demo/               # Auto-generated demo HTML files (git-ignored)
│
├── .env.example            # Template for your .env file
├── .env                    # Your API keys (NEVER commit this)
├── start.bat               # Windows quick-start script
├── start.sh                # Mac/Linux quick-start script
└── package.json            # Frontend dependencies & scripts
```

---

## Troubleshooting

### "Cannot connect to backend" in dashboard
- Make sure the backend is running: `npm run start:backend`
- Check [http://localhost:3000/api/health](http://localhost:3000/api/health) returns `{ "status": "ok" }`

### "Missing Supabase credentials" in console
- Your `.env` is missing `SUPABASE_URL` / `SUPABASE_ANON_KEY`
- Make sure you ran `copy .env.example .env` and filled in all values

### "Cannot find module" errors in engine/
- You forgot to install backend dependencies: `cd engine && npm install`

### Demo links show 404
- Make sure the backend (port 3000) is running — demos are served by Express, not Vite
- Check that `DEMO_BASE_URL=http://localhost:3000` in your `.env`

### Apify scraper fails
- Check your `APIFY_API_TOKEN` is correct
- Make sure you have Apify credits (free tier gives $5/month)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8 |
| Backend | Node.js 18+, Express 5 |
| Database | Supabase (PostgreSQL) |
| AI | Groq (llama-3.1-8b-instant) |
| Scraper | Apify — Google Maps Places crawler |
| Demo Generation | Pure HTML/CSS template engine |

---

## License

MIT
