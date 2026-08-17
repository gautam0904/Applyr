# Applyr 🚀

A full-stack **Job Application Tracker** that automates and organises your job hunt. Built with Angular 21 (SSR), Node.js + Express, MongoDB, and optionally powered by AI via Groq/OpenRouter/Google Gemini.

## Install on a New Machine

> **Two ways to get Applyr running. Pick one.**

### ⚡ Option A — Download from GitHub Releases (recommended, no source code needed)

Every push to `main` automatically builds and uploads a ready-to-run zip to GitHub Releases.
**Works on Linux, macOS, and Windows — no build tools needed on the target machine.**

---

#### Step 1 — Download the zip

**Via browser:** Go to `https://github.com/gautam0904/Applyr/releases/latest` → click `applyr-deploy.zip`

**Or via terminal (one line):**
```bash
# Mac / Linux
curl -L https://github.com/gautam0904/Applyr/releases/latest/download/applyr-deploy.zip -o applyr-deploy.zip

# Windows (PowerShell)
curl -L https://github.com/gautam0904/Applyr/releases/latest/download/applyr-deploy.zip -o applyr-deploy.zip
```

---

#### Step 2 — Run the setup script

The setup script handles everything automatically on first run.

**🐧 Mac / Linux**
```bash
unzip applyr-deploy.zip
cd applyr-deploy
bash setup.sh
```

**🪟 Windows (PowerShell)**
```powershell
Expand-Archive applyr-deploy.zip
cd applyr-deploy
powershell -ExecutionPolicy Bypass -File .\setup.ps1
# or: right-click setup.ps1 → "Run with PowerShell"
```

> What `setup.sh` / `setup.ps1` does automatically:
> 1. Runs `npm ci --omit=dev` to install backend runtime packages
> 2. Creates `backend/.env` from `backend/.env.example`
> 3. Sets `PUPPETEER_CACHE_DIR` to the correct absolute path for this machine
> 4. Downloads the Puppeteer Chrome binary (~170 MB, takes ~1 min on first run)
> 5. Installs PM2 globally if not already installed

---

#### Step 3 — Fill in your API keys

Open `backend/.env` and fill in the real values:

```bash
nano backend/.env        # Mac / Linux
notepad backend\.env     # Windows
```

Required fields:

```env
# MongoDB Atlas — get from: https://cloud.mongodb.com → Connect → Drivers
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxx.mongodb.net
DBNAME=Applyr

# Groq AI — https://console.groq.com/keys
GROQ_API_KEY=gsk_...

# Google Gemini — https://aistudio.google.com/apikey (comma-separated for key rotation)
GOOGLE_API_KEYS="AIzaSy..., AIzaSy..."

# OpenRouter — https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-v1-...

# Google OAuth (for Drive resume storage)
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REFRESH_TOKEN=1//...
GOOGLE_DRIVE_FOLDER_ID=1jFt...

# APY Hub (web scraping) — https://apyhub.com
APY_HUB_API_KEY=APY0...

# These are set automatically by setup script — do not change
PORT=3000
PUPPETEER_CACHE_DIR=<set by setup script>
```

> Leave `USE_LOCAL_DB` unset (or `false`) — the app uses MongoDB Atlas by default.
> Only set `USE_LOCAL_DB=true` if you have MongoDB installed locally.

---

#### Step 4 — Start the app

```bash
pm2 start ecosystem.config.cjs
```

You should see both services `online`:

```
┌─────┬──────────────────┬────────┬──────────┐
│ id  │ name             │ status │ uptime   │
├─────┼──────────────────┼────────┼──────────┤
│ 0   │ applyr-backend   │ online │ 5s       │
│ 1   │ applyr-frontend  │ online │ 5s       │
| 3.  | n8n              | online | 5s       │
└─────┴──────────────────┴────────┴──────────┘
```

**Frontend → http://localhost:4000**
**API → http://localhost:3000**

---

#### Step 5 — Auto-start on every reboot (optional but recommended)

```bash
pm2 save        # save current process list
pm2 startup     # prints a command — copy and run it once
```

After this, both services start automatically whenever the machine boots.

---

#### Daily commands (all you need)

```bash
pm2 list                      # check status of all services
pm2 restart all               # restart everything
pm2 stop all                  # stop everything
pm2 restart applyr-backend    # restart backend only
pm2 restart applyr-frontend   # restart frontend only
pm2 logs                      # live logs (all services)
pm2 logs applyr-backend       # backend logs only
pm2 logs applyr-frontend      # frontend logs only
```

---

#### Ports reference

| Service | Port | URL |
|---|---|---|
| Frontend (Angular SSR) | 4000 | http://localhost:4000 |
| Backend (Express API) | 3000 | http://localhost:3000 |
| n8n (optional) | 5678 | http://localhost:5678 |

---

### 🛠 Option B — Clone & Build from Source

Use this if you want to modify the code.
See the [Setup on a New Machine](#setup-on-a-new-machine) section below.

---

---

## Architecture

```
Applyr/
├── Backend/          → Node.js + Express + TypeScript API  (port 3000)
├── Frontend/         → Angular 21 SSR app                  (port 4000)
├── ecosystem.config.cjs  → PM2 process manager config
└── logs/             → PM2 log output
```

```
Browser → http://localhost:4000
             │
     Angular SSR (port 4000)
             │
     Express API (port 3000)
          │          │
    MongoDB       Puppeteer / AI APIs
    (Atlas)       (Groq, Gemini, OpenRouter)
```

**API Routes**

| Route | Description |
|---|---|
| `GET /api/jobs` | List all tracked jobs |
| `POST /api/jobs` | Add a job manually |
| `GET/POST /api/ai` | AI-powered resume/job analysis |
| `GET/POST /api/queue` | Automation job queue |

**Frontend Features**

| Feature | Description |
|---|---|
| Jobs dashboard | Track applications with status (Discovery → Applied → Interview → Offer) |
| Queue | Background automation queue viewer |
| Contacts | Contact management |
| Base Resume | Upload & manage your master resume |
| Tech Stack | Track your skills |

---

## Prerequisites

Install these once on any new machine:

| Tool | Version | Install |
|---|---|---|
| Node.js | v18+ (v22 recommended) | https://nodejs.org or `nvm install 22` |
| npm | v9+ | comes with Node.js |
| PM2 | latest | `npm install -g pm2` |
| Git | any | https://git-scm.com |

> **MongoDB**: This project uses **MongoDB Atlas** (cloud). No local MongoDB installation needed.
> The connection string is in your `.env` file.

---

## Setup on a New Machine

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd Applyr
```

### 2. Set up Backend environment

```bash
cd Backend
cp .env.example .env   # if .env.example exists, else create .env manually
```

Edit `Backend/.env` and fill in all values:

```env
# MongoDB (Atlas cloud — get from MongoDB Atlas dashboard)
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxx.mongodb.net
DBNAME=Applyr

# AI Keys
GROQ_API_KEY=gsk_...
GOOGLE_API_KEYS="key1, key2, key3"
OPENROUTER_API_KEY=sk-or-v1-...

# Google Drive (for resume storage)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
GOOGLE_DRIVE_FOLDER_ID=...

# APY Hub (web scraping)
APY_HUB_API_KEY=APY0...

# Local paths
PORT=3000
PUPPETEER_CACHE_DIR=/absolute/path/to/Applyr/Backend/.cache/puppeteer
```

> ⚠️ **PUPPETEER_CACHE_DIR** must be an absolute path on the current machine.
> Example on Mac: `/Users/yourname/code/MEAN/Applyr/Backend/.cache/puppeteer`
> Example on Linux: `/home/yourname/Applyr/Backend/.cache/puppeteer`

### 3. Install dependencies

```bash
# Backend
cd Backend
npm install         # also installs Puppeteer Chrome automatically via postinstall

# Frontend
cd ../Frontend
npm install
```

### 4. Build everything

```bash
# Build Backend (TypeScript → JavaScript)
cd Backend
npm run build
# Output: Backend/dist/

# Build Frontend (Angular SSR)
cd ../Frontend
npm run build
# Output: Frontend/dist/Applyr/
```

### 5. Install PM2

```bash
npm install -g pm2
```

### 6. Update ecosystem.config.cjs paths

Open `ecosystem.config.cjs` in the project root and update **all absolute paths** to match the current machine:

```js
// Change this line in both apps:
cwd: "/Users/yourname/code/MEAN/Applyr/Backend",   // ← your path
cwd: "/Users/yourname/code/MEAN/Applyr/Frontend",  // ← your path

// And in the backend env:
PUPPETEER_CACHE_DIR: "/Users/yourname/code/MEAN/Applyr/Backend/.cache/puppeteer",

// And the frontend script path:
script: "/Users/yourname/code/MEAN/Applyr/Frontend/dist/Applyr/server/server.mjs",
```

### 7. Start with PM2

```bash
# From project root
pm2 start ecosystem.config.cjs

# Verify both are running
pm2 list
```

You should see:

```
┌─────┬──────────────────┬────────┬──────────┐
│ id  │ name             │ status │ uptime   │
├─────┼──────────────────┼────────┼──────────┤
│ 0   │ applyr-backend   │ online │ 10s      │
│ 1   │ applyr-frontend  │ online │ 10s      │
└─────┴──────────────────┴────────┴──────────┘
```

### 8. Set up auto-start on system boot

```bash
pm2 save
pm2 startup
```

PM2 will print a `sudo ...` command. **Copy and run it in your terminal.**

After that, backend + frontend start automatically every time the machine boots.

---

## Daily Commands

```bash
pm2 list                    # check status of all services
pm2 restart all             # restart everything
pm2 stop all                # stop everything
pm2 restart applyr-backend  # restart backend only
pm2 restart applyr-frontend # restart frontend only
pm2 logs                    # live logs (all services)
pm2 logs applyr-backend     # backend logs only
pm2 logs applyr-frontend    # frontend logs only
```

---

## Development Mode (source code, with hot reload)

If you're actively developing and want live reload instead of PM2:

```bash
# Terminal 1 — Backend
cd Backend
npm run dev         # tsx watch (hot reload on .ts changes)

# Terminal 2 — Frontend
cd Frontend
npm start           # ng serve (live reload on port 4200)
```

> In dev mode, frontend runs on **port 4200** and proxies API calls to backend on **port 3000**.

---

## Rebuilding After Code Changes

When you pull new code or make changes, rebuild before restarting PM2:

```bash
# Rebuild backend
cd Backend && npm run build

# Rebuild frontend
cd ../Frontend && npm run build

# Restart services
cd ..
pm2 restart all
```

Or use this one-liner from the project root:

```bash
(cd Backend && npm run build) && (cd Frontend && npm run build) && pm2 restart all
```

---

## Project Structure

```
Applyr/
│
├── Backend/
│   ├── src/
│   │   ├── index.ts          ← Express app entry point
│   │   ├── DB/
│   │   │   ├── atlas.ts      ← MongoDB Atlas connection
│   │   │   └── local.ts      ← Local MongoDB connection (dev)
│   │   ├── routes/
│   │   │   ├── job.route.ts
│   │   │   ├── ai.route.ts
│   │   │   └── queue.route.ts
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── model/
│   │   └── utils/
│   ├── dist/                 ← Compiled JS (generated by npm run build)
│   ├── .cache/puppeteer/     ← Puppeteer Chrome binary (auto-downloaded)
│   ├── .env                  ← Environment variables (never commit this)
│   ├── package.json
│   └── tsconfig.json
│
├── Frontend/
│   ├── src/
│   │   ├── app/
│   │   │   └── features/
│   │   │       ├── jobs/         ← Job tracking dashboard
│   │   │       ├── queue/        ← Automation queue
│   │   │       ├── contacts/     ← Contact management
│   │   │       ├── baseResume/   ← Resume management
│   │   │       └── tech-stack/   ← Skills tracker
│   │   ├── server.ts             ← Angular SSR Express server
│   │   ├── main.ts
│   │   └── styles.scss
│   ├── dist/Applyr/              ← Built output (generated by npm run build)
│   │   ├── browser/              ← Static assets
│   │   └── server/
│   │       └── server.mjs        ← SSR server entry (run by PM2)
│   └── package.json
│
├── ecosystem.config.cjs      ← PM2 config (manages both services)
├── logs/                     ← PM2 log files
└── README.md
```

---

## Troubleshooting

### Backend not starting — check logs
```bash
pm2 logs applyr-backend --lines 50
```

### Frontend not starting
```bash
pm2 logs applyr-frontend --lines 50
```
Most likely cause: `dist/Applyr/server/server.mjs` doesn't exist — run `npm run build` in `/Frontend`.

### Puppeteer / Chrome errors
```bash
cd Backend && npm install   # re-runs postinstall which downloads Chrome
```
Make sure `PUPPETEER_CACHE_DIR` in `.env` is an **absolute path** that exists on this machine.

### MongoDB connection error
- Check `MONGODB_URI` in `.env` is correct
- Make sure your IP is whitelisted in MongoDB Atlas (Network Access settings)

### Port already in use
```bash
lsof -i :3000   # find what's using port 3000
lsof -i :4000   # find what's using port 4000
```

---

## Ports Reference

| Service | Port | URL |
|---|---|---|
| Frontend (Angular SSR) | 4000 | http://localhost:4000 |
| Backend (Express API) | 3000 | http://localhost:3000 |
| n8n (optional) | 5678 | http://localhost:5678 |
| Dev Frontend (ng serve) | 4200 | http://localhost:4200 |

---

## RAM Usage (approximate)

| Service | RAM |
|---|---|
| applyr-backend | ~150–200 MB |
| applyr-frontend | ~60–80 MB |
| PM2 daemon | ~20 MB |
| **Total** | **~250 MB** |


---

## Deploying Without Source Code

If you want to run the app **without keeping the repo/source code** on the machine (production-style), you only need the built artifacts.

### Minimum files needed at runtime

```
Applyr-deploy/
├── ecosystem.config.cjs        ← PM2 config (update all paths inside)
│
├── backend/
│   ├── dist/                   ← compiled JS (output of npm run build)
│   ├── node_modules/           ← runtime packages (NOT devDependencies)
│   ├── .cache/puppeteer/       ← Chrome binary (~163 MB)
│   └── .env                    ← your secrets and config
│
└── frontend/
    └── dist/Applyr/            ← Angular SSR build output
        ├── browser/            ← static assets
        └── server/
            └── server.mjs      ← SSR server (what PM2 runs)
```

> **Note**: Frontend `node_modules` is NOT needed at runtime.
> Backend `node_modules` IS needed (Express, Mongoose, Puppeteer are runtime deps).

### Steps to build a deploy folder

```bash
# 1. Build everything
cd Backend && npm run build && npm prune --omit=dev && cd ..
cd Frontend && npm run build && cd ..

# 2. Create deploy folder
mkdir -p ~/Applyr-deploy/backend
mkdir -p ~/Applyr-deploy/frontend

# 3. Copy backend runtime only
cp -r Backend/dist           ~/Applyr-deploy/backend/dist
cp -r Backend/node_modules   ~/Applyr-deploy/backend/node_modules
cp -r Backend/.cache         ~/Applyr-deploy/backend/.cache
cp    Backend/.env           ~/Applyr-deploy/backend/.env
cp    Backend/package.json   ~/Applyr-deploy/backend/package.json

# 4. Copy frontend build (no node_modules needed)
cp -r Frontend/dist/Applyr   ~/Applyr-deploy/frontend/dist

# 5. Copy PM2 config
cp ecosystem.config.cjs ~/Applyr-deploy/
```

Then update all absolute paths inside `ecosystem.config.cjs` to point to `~/Applyr-deploy/...`, and start:

```bash
cd ~/Applyr-deploy
pm2 start ecosystem.config.cjs
pm2 save
```

### What is safe to delete

| Path | Reason |
|---|---|
| `Backend/src/` | TypeScript source — compiled into `dist/` |
| `Backend/tsconfig.json` | Build-time only |
| `Frontend/src/` | Angular source — compiled into `dist/Applyr/` |
| `Frontend/node_modules/` | Build-time only, not needed at runtime |
| `Frontend/angular.json`, `tsconfig*.json` | Build config only |
| `.git/` | Version control only |
