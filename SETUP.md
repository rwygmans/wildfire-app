# Setup Guide: Splitting Wildfire App to Separate Repo

This guide will help you push the wildfire app to GitHub and deploy it to Netlify.

## Step 1: Initialize Git Repository

```bash
cd ../wildfire-app
git init
git add .
git commit -m "Initial commit: Wildfire History Explorer"
```

## Step 2: Create GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Create a new repository (e.g., `wildfire-history-explorer`)
3. **Do NOT** initialize with README, .gitignore, or license (we already have these)

## Step 3: Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name.

## Step 4: Deploy to Netlify

### Option A: Via Netlify Dashboard (Recommended)

1. Go to [Netlify](https://app.netlify.com) and sign in
2. Click **"Add new site"** → **"Import an existing project"**
3. Select **GitHub** and authorize Netlify
4. Choose your `wildfire-history-explorer` repository
5. Netlify will auto-detect Next.js settings from `netlify.toml`
6. Click **"Deploy site"**

### Option B: Via Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
# Follow the prompts to connect your site
netlify deploy --prod
```

## Step 5: Configure Environment Variables

1. In Netlify dashboard, go to **Site settings** → **Environment variables**
2. Click **"Add variable"**
3. Add:
   - **Key**: `NEXT_PUBLIC_MAPBOX_TOKEN`
   - **Value**: Your Mapbox access token
4. Click **"Save"**
5. Go to **Deploys** tab and click **"Trigger deploy"** → **"Clear cache and deploy site"**

## Step 6: Verify Deployment

1. Visit your Netlify site URL (e.g., `https://your-site-name.netlify.app`)
2. The app should load with the wildfire map
3. Test the interactive features (brush mode, charts, etc.)

## Troubleshooting

### Build Fails

- Check Netlify build logs for errors
- Ensure Node.js version is 18+ (set in `netlify.toml`)
- Verify all dependencies are in `package.json`

### Map Not Loading

- Verify `NEXT_PUBLIC_MAPBOX_TOKEN` is set correctly in Netlify
- Check browser console for Mapbox errors
- Ensure token has proper permissions

### Data Not Loading

- Verify `public/wildfires-lite.parquet` is committed to git
- Check that DuckDB WASM files are in `public/duckdb/`
- Check browser console for loading errors

## Next Steps

- Customize the app name and description
- Add your own domain (optional)
- Set up continuous deployment (automatic on push to main)
- Configure custom build settings if needed

## File Structure

```
wildfire-app/
├── app/
│   ├── components/       # ChartPanel component
│   ├── lib/             # Shared utilities and constants
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Main wildfire page
│   └── globals.css      # Global styles
├── public/
│   ├── duckdb/          # DuckDB WASM files
│   └── wildfires-lite.parquet  # Wildfire data
├── netlify.toml         # Netlify configuration
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
└── README.md           # Project documentation
```

## Notes

- The app is fully self-contained - no backend needed
- All data processing happens in the browser
- Parquet file is ~6 MB (optimized version)
- DuckDB WASM files are required for in-browser SQL queries

