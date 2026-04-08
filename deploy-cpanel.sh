#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Limud v8.4.1 — cPanel / GoDaddy Deployment Script
# ─────────────────────────────────────────────────────────────
# Run this script on your local machine to build and prepare
# the deployment package for GoDaddy cPanel hosting.
#
# Usage:
#   chmod +x deploy-cpanel.sh
#   ./deploy-cpanel.sh
#
# What this script does:
#   1. Installs dependencies
#   2. Generates Prisma client
#   3. Builds Next.js in standalone mode
#   4. Copies static assets into the standalone folder
#   5. Creates a deployment-ready tarball
# ─────────────────────────────────────────────────────────────

set -e

echo "============================================="
echo "  Limud — cPanel Deployment Builder"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ─── Step 1: Check prerequisites ──────────────────────────
echo -e "\n${BLUE}[1/6]${NC} Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js not found. Install Node.js 18+ first.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d. -f1 | tr -d v)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js 18+ required. Found: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}  Node.js $(node -v) ✓${NC}"
echo -e "${GREEN}  npm $(npm -v) ✓${NC}"

# ─── Step 2: Install dependencies ─────────────────────────
echo -e "\n${BLUE}[2/6]${NC} Installing dependencies..."
npm ci --production=false
echo -e "${GREEN}  Dependencies installed ✓${NC}"

# ─── Step 3: Generate Prisma client ───────────────────────
echo -e "\n${BLUE}[3/6]${NC} Generating Prisma client..."
npx prisma generate
echo -e "${GREEN}  Prisma client generated ✓${NC}"

# ─── Step 4: Build Next.js (standalone mode) ──────────────
echo -e "\n${BLUE}[4/6]${NC} Building Next.js (standalone output)..."
npm run build
echo -e "${GREEN}  Build complete ✓${NC}"

# ─── Step 5: Assemble standalone deployment ───────────────
echo -e "\n${BLUE}[5/6]${NC} Assembling deployment package..."

# The standalone folder is self-contained but needs static assets
STANDALONE_DIR=".next/standalone"

if [ ! -d "$STANDALONE_DIR" ]; then
    echo -e "${RED}Error: Standalone build not found at $STANDALONE_DIR${NC}"
    echo "Make sure next.config.js has output: 'standalone'"
    exit 1
fi

# Copy static assets into standalone (Next.js doesn't include these automatically)
echo "  Copying static assets..."
cp -r .next/static "$STANDALONE_DIR/.next/static"

echo "  Copying public directory..."
cp -r public "$STANDALONE_DIR/public"

# Copy essential config files
echo "  Copying config files..."
cp server.js "$STANDALONE_DIR/"
cp .htaccess "$STANDALONE_DIR/"
cp package.json "$STANDALONE_DIR/"

# Copy prisma schema (needed for Prisma client at runtime)
if [ -d "prisma" ]; then
    cp -r prisma "$STANDALONE_DIR/"
    echo "  Copying Prisma schema ✓"
fi

# Copy .env.example as reference
if [ -f ".env.example" ]; then
    cp .env.example "$STANDALONE_DIR/.env.example"
fi

echo -e "${GREEN}  Standalone deployment assembled ✓${NC}"

# ─── Step 6: Create deployment tarball ────────────────────
echo -e "\n${BLUE}[6/6]${NC} Creating deployment archive..."

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE_NAME="limud-cpanel-deploy-${TIMESTAMP}.tar.gz"

tar -czf "$ARCHIVE_NAME" -C "$STANDALONE_DIR" .

ARCHIVE_SIZE=$(du -sh "$ARCHIVE_NAME" | cut -f1)
echo -e "${GREEN}  Archive created: $ARCHIVE_NAME ($ARCHIVE_SIZE) ✓${NC}"

# ─── Summary ──────────────────────────────────────────────
echo ""
echo "============================================="
echo -e "${GREEN}  Deployment package ready!${NC}"
echo "============================================="
echo ""
echo -e "${YELLOW}Next steps to deploy on GoDaddy cPanel:${NC}"
echo ""
echo "  1. Upload ${ARCHIVE_NAME} to your cPanel home directory"
echo "     via File Manager or SSH"
echo ""
echo "  2. Extract it to your app directory:"
echo "     cd ~/limud && tar -xzf ~/${ARCHIVE_NAME}"
echo ""
echo "  3. In cPanel → Setup Node.js App:"
echo "     - Node.js version: 20.x (or 18.x minimum)"
echo "     - Application mode: Production"
echo "     - Application root: limud"
echo "     - Application startup file: server.js"
echo "     - Application URL: your-domain.com"
echo ""
echo "  4. Set environment variables in cPanel or create .env:"
echo "     DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL,"
echo "     OPENAI_API_KEY, OPENAI_BASE_URL"
echo ""
echo "  5. Click 'Run NPM Install' if prompted, then restart the app"
echo ""
echo "  See DEPLOY-CPANEL.md for detailed instructions."
echo "============================================="
