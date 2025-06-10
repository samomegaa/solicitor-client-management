#!/bin/bash
set -e

# Load .env if exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

echo "Starting Vercel deployment..."

if ! command -v vercel &> /dev/null; then
  echo "Installing Vercel CLI..."
  npm install -g vercel
else
  echo "Vercel CLI already installed."
fi

vercel login

vercel link --yes

echo "Setting environment variables on Vercel..."
vercel env add JWT_SECRET production --yes <<< "$JWT_SECRET"
vercel env add DATABASE_URL production --yes <<< "$DATABASE_URL"

echo "Deploying to Vercel..."
vercel --prod

echo "Vercel deployment complete!"

