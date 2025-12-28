# Wildfire History Explorer

Interactive visualization of historical wildfire perimeters using DuckDB-WASM, Mosaic, and GeoArrow. All data processing happens entirely in the browser with no backend required.

## Features

- **Interactive Map**: Visualize wildfire locations across the United States
- **Linked Charts**: Seasonal patterns, temporal frequency, and cause distribution
- **Brush Mode**: Spatial filtering with real-time updates between map and charts
- **Browser-Only**: All queries run locally using DuckDB-WASM
- **GeoArrow**: Efficient geospatial data format for fast rendering

## Architecture

- **Next.js 15** - React framework
- **DuckDB-WASM** - In-browser SQL database with spatial extensions
- **GeoArrow** - Efficient geospatial data format
- **Deck.gl** - WebGL-powered visualization framework
- **Mosaic** - Coordinated multi-view framework for linked charts
- **Apache Arrow** - Columnar data format

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Set up Mapbox token:**
   - Create a `.env.local` file in the root directory:
   ```bash
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
   ```
   - Get a free token at [mapbox.com](https://www.mapbox.com)

3. **Run the development server:**
```bash
npm run dev
```

4. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## Usage

- **View Mode**: Hover over points to see wildfire details (acres, cause, date, name)
- **Brush Mode**: Click "Brush" to enable spatial filtering on the map
- **Brush Radius**: Adjust the slider to change the selection radius (5-300 km)
- **Sync Brush**: Toggle to sync brush selection with charts for linked filtering
- **Charts**: Interactive histograms that update based on map/chart selections

## Data

This dataset represents the Fire Occurrence Data Record (FODR) produced by the Interagency Fire Occurrence Reporting Modules (InFORM) Application. The FODR is the authoritative fire occurrence data set for the five major federal fire management agencies and some state agencies. The FODR also includes records that are bulk uploaded by state agencies that are not InFORM participators, thus providing a comprehensive fire occurrence data set for the United States.

The dataset includes US wildfires with `Acres > 5`. The data is pre-filtered and optimized in `wildfires-lite.parquet` (6 MB vs 145 MB full dataset).

### Data Columns

- `DateTime` - Fire start date/time
- `Acres` - Fire size in acres
- `Cause` - Fire cause (Natural, Human, Undetermined)
- `FireName` - Name of the fire
- `Latitude` / `Longitude` - Fire location
- `Month` / `Year` - Pre-computed temporal fields

## Deployment

### Netlify

This app is configured for Netlify deployment:

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/wildfire-app.git
   git push -u origin main
   ```

2. **Deploy on Netlify:**
   - Go to [Netlify](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository
   - Netlify will automatically detect the Next.js app and use `netlify.toml`
   - Add your `NEXT_PUBLIC_MAPBOX_TOKEN` as an environment variable in Netlify settings

3. **Build settings** (auto-detected):
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: 18

### Environment Variables

Make sure to set `NEXT_PUBLIC_MAPBOX_TOKEN` in your Netlify site settings:
- Go to Site settings → Environment variables
- Add `NEXT_PUBLIC_MAPBOX_TOKEN` with your Mapbox token

## Tech Stack

- Next.js 15
- React 19
- DuckDB-WASM 1.30.0
- @geoarrow/deck.gl-layers 0.1.0
- @uwdata/mosaic-plot 0.21.1
- Apache Arrow 21.1.0
- Mapbox GL JS 3.17.0

## Development

The app uses:
- **TypeScript** for type safety
- **Next.js App Router** for routing
- **DuckDB spatial extensions** for geospatial queries
- **Mosaic coordinator** for linked view interactions

## License

See LICENSE file for details.

