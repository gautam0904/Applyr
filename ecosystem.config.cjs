/**
 * PM2 Ecosystem Config — Applyr
 *
 * ✅ Cross-platform: works on Windows, macOS, and Linux.
 * All paths are resolved dynamically from __dirname (the folder this file lives in).
 *
 * Works in two layouts automatically:
 *   Source repo:    ecosystem.config.cjs lives in Applyr/
 *                   → Backend folder = Applyr/Backend/
 *                   → Frontend folder = Applyr/Frontend/
 *
 *   Deploy package: ecosystem.config.cjs lives in applyr-deploy/
 *                   → Backend folder = applyr-deploy/backend/
 *                   → Frontend folder = applyr-deploy/frontend/
 */

const path = require("path");
const fs   = require("fs");

// ── Resolve backend & frontend dirs (works in both source repo and deploy package) ──
const ROOT = __dirname;

function resolveDir(...names) {
  for (const name of names) {
    const full = path.resolve(ROOT, name);
    if (fs.existsSync(full)) return full;
  }
  // Default to first option even if it doesn't exist yet (PM2 will error with a clear message)
  return path.resolve(ROOT, names[0]);
}

const BACKEND  = resolveDir("Backend",  "backend");   // source repo uses "Backend", deploy uses "backend"
const FRONTEND = resolveDir("Frontend", "frontend");  // source repo uses "Frontend", deploy uses "frontend"
const LOGS     = path.resolve(ROOT, "logs");

// Ensure logs directory exists
if (!fs.existsSync(LOGS)) fs.mkdirSync(LOGS, { recursive: true });

module.exports = {
  apps: [
    {
      // ─── Backend: Express API ─────────────────────────────────────────
      name: "applyr-backend",
      script: path.resolve(BACKEND, "dist", "index.js"),
      cwd: BACKEND,

      // Load .env from the backend folder
      env_file: path.resolve(BACKEND, ".env"),

      env: {
        NODE_ENV: "production",
        PORT: 3000,
        // Override Puppeteer cache to a local path (never use /opt/render or CI paths)
        PUPPETEER_CACHE_DIR: path.resolve(BACKEND, ".cache", "puppeteer"),
      },

      watch: false,
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 10,

      out_file:   path.resolve(LOGS, "backend-out.log"),
      error_file: path.resolve(LOGS, "backend-error.log"),
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },

    {
      // ─── Frontend: Angular SSR server ─────────────────────────────────
      name: "applyr-frontend",
      script: path.resolve(FRONTEND, "dist", "Applyr", "server", "server.mjs"),
      cwd: FRONTEND,

      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },

      watch: false,
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 10,

      out_file:   path.resolve(LOGS, "frontend-out.log"),
      error_file: path.resolve(LOGS, "frontend-error.log"),
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
