# Limud — GoDaddy cPanel Deployment Guide

## Overview

Limud is a Next.js 14 application. GoDaddy cPanel supports Node.js apps via **Phusion Passenger**. This guide walks you through deploying Limud on GoDaddy shared hosting with cPanel.

---

## Prerequisites

| Requirement | Details |
|---|---|
| GoDaddy Plan | Hosting plan with **cPanel** and **Node.js support** (Business/Ultimate or VPS) |
| Node.js | v18+ (v20 recommended) — select in cPanel |
| PostgreSQL | External provider (Neon, Supabase, or Railway — free tiers available) |
| SSL | GoDaddy free SSL or purchased certificate |
| Domain | Pointed to your GoDaddy hosting |

> **Important:** GoDaddy shared hosting provides MySQL, not PostgreSQL. Limud uses PostgreSQL (via Prisma). Use a free cloud PostgreSQL provider like **Neon** (neon.tech) or **Supabase** (supabase.com).

---

## Method 1: Manual Upload (Recommended for First Deploy)

### Step 1: Build Locally

```bash
# Clone the repo
git clone https://github.com/Fansist/Limud.git
cd Limud

# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Build (creates .next/standalone/)
npm run build

# Prepare the standalone folder
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
cp server.js .next/standalone/
cp .htaccess .next/standalone/
cp package.json .next/standalone/
cp -r prisma .next/standalone/

# Create a tarball
tar -czf limud-deploy.tar.gz -C .next/standalone .
```

Or simply run:
```bash
./deploy-cpanel.sh
```

### Step 2: Upload to GoDaddy

1. **Log in to cPanel** → File Manager
2. Navigate to your **home directory** (`/home/your-username/`)
3. Create a folder called `limud`
4. Upload `limud-deploy.tar.gz` into `limud/`
5. Right-click → **Extract** the archive

### Step 3: Configure Node.js App in cPanel

1. Go to **cPanel → Setup Node.js App**
2. Click **Create Application**
3. Configure:

| Setting | Value |
|---|---|
| Node.js version | 20.x (or 18.x) |
| Application mode | Production |
| Application root | `limud` |
| Application URL | `your-domain.com` |
| Application startup file | `server.js` |

4. Click **Create**

### Step 4: Set Environment Variables

In cPanel Node.js App settings, add these environment variables:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Your PostgreSQL connection string |
| `NEXTAUTH_URL` | `https://your-domain.com` |
| `NEXTAUTH_SECRET` | A random 32+ character string |
| `OPENAI_API_KEY` | Your OpenAI key (or `demo-mode`) |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` |
| `NEXT_PUBLIC_APP_NAME` | `Limud` |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` |

Or create a `.env` file in the `limud/` directory with these values (see `.env.example`).

### Step 5: Initialize Database

Via SSH or cPanel Terminal:
```bash
cd ~/limud
source ~/nodevenv/limud/20/bin/activate
npx prisma db push
npx tsx prisma/seed.ts   # Optional: seed demo data
```

### Step 6: Start/Restart the App

In cPanel → Setup Node.js App → Click **Restart** on your limud app.

Visit `https://your-domain.com` to verify!

---

## Method 2: Git Auto-Deploy

### Step 1: Setup Git in cPanel

1. Go to **cPanel → Git Version Control**
2. Click **Create**
3. Enter your GitHub repo URL: `https://github.com/Fansist/Limud.git`
4. Set repository path: `/home/your-username/limud-repo`
5. Click **Create**

### Step 2: Configure `.cpanel.yml`

The `.cpanel.yml` file in the repo root handles automated deployment:
- Copies files to the app directory
- Installs dependencies
- Builds the app
- Restarts the server

### Step 3: Deploy

```bash
# From your local machine, push to trigger deployment
git push origin main
```

Then in cPanel → Git Version Control → Click **Update from Remote** → **Deploy HEAD Commit**

---

## Database Setup (PostgreSQL)

Since GoDaddy doesn't offer PostgreSQL, use a free cloud provider:

### Option A: Neon (Recommended)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project → copy the connection string
3. Set `DATABASE_URL` in your cPanel environment variables
4. Run `npx prisma db push` via SSH

### Option B: Supabase

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Go to Settings → Database → Connection string (URI)
3. Set `DATABASE_URL` in your cPanel environment variables
4. Run `npx prisma db push` via SSH

### Option C: Railway

1. Go to [railway.app](https://railway.app) and create a PostgreSQL service
2. Copy the connection URL
3. Set `DATABASE_URL` in your cPanel environment variables
4. Run `npx prisma db push` via SSH

---

## SSL / HTTPS

1. In cPanel → **SSL/TLS** → ensure your domain has a certificate
2. GoDaddy often provides free AutoSSL
3. The `.htaccess` file forces HTTPS automatically

---

## Troubleshooting

### App shows 503 error
- Check if Node.js app is running in cPanel → Setup Node.js App
- Click **Restart**
- Check error logs: cPanel → Error Log

### App shows blank page
- Verify `.next/standalone/` exists with the built files
- Make sure `public/` and `.next/static/` were copied correctly
- Check Node.js app logs in cPanel

### Database connection errors
- Verify `DATABASE_URL` is set correctly
- Ensure the PostgreSQL provider allows connections from GoDaddy's IP
- Check if SSL mode is required: add `?sslmode=require` to the URL

### Slow startup
- First request after deploy takes 5-15 seconds (cold start)
- Subsequent requests are fast
- This is normal for Phusion Passenger on shared hosting

### .htaccess not working
- Make sure the file was uploaded (it's hidden by default)
- In File Manager → Settings → Show Hidden Files
- Verify `PassengerNodejs` path matches your Node.js version path

### How to find your Node.js path
```bash
# Via SSH or cPanel Terminal:
which node
# Usually: /home/username/nodevenv/appname/20/bin/node
```

---

## File Structure on cPanel

```
/home/your-username/
├── limud/                    # Application directory
│   ├── server.js             # Entry point (Passenger loads this)
│   ├── .htaccess             # Apache config
│   ├── .env                  # Environment variables
│   ├── package.json          # Package info
│   ├── prisma/               # Database schema
│   │   └── schema.prisma
│   ├── public/               # Static files (served by Apache)
│   │   ├── favicon.ico
│   │   ├── manifest.json
│   │   ├── robots.txt
│   │   └── sw.js
│   ├── .next/                # Next.js build output
│   │   ├── standalone/       # Self-contained server
│   │   │   └── server.js     # Next.js standalone server
│   │   └── static/           # Hashed static assets
│   ├── node_modules/         # Dependencies (if using npm install on server)
│   └── tmp/
│       └── restart.txt       # Touch to restart Passenger
├── public_html/              # May symlink or redirect to limud
└── nodevenv/                 # Node.js virtual environments
    └── limud/
        └── 20/               # Node.js v20
```

---

## Updating the App

### Quick update (via SSH):
```bash
cd ~/limud
git pull origin main
source ~/nodevenv/limud/20/bin/activate
npm ci --production=false
npx prisma generate
npm run build
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
touch tmp/restart.txt
```

### Or use the deployment script:
```bash
./deploy-cpanel.sh
# Then upload and extract the new tarball
```

---

## Performance Tips

1. **Enable cPanel caching** if available (Varnish, LiteSpeed Cache)
2. **Use Cloudflare CDN** in front of GoDaddy for faster static assets
3. **Keep PostgreSQL provider** geographically close to GoDaddy server
4. **Monitor memory usage** — shared hosting has limits (~512MB-1GB)
5. **Use `NODE_OPTIONS=--max-old-space-size=384`** to limit Node.js memory

---

## Support

- **Limud Issues**: [github.com/Fansist/Limud/issues](https://github.com/Fansist/Limud/issues)
- **GoDaddy Node.js Help**: [godaddy.com/help](https://www.godaddy.com/help)
- **Prisma Docs**: [prisma.io/docs](https://www.prisma.io/docs)
- **Next.js Standalone**: [nextjs.org/docs/app/api-reference/next-config-js/output](https://nextjs.org/docs/app/api-reference/next-config-js/output)
