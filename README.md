# Species ID - Mobile App

A cross-platform mobile application for species identification, built with Ionic and Angular. The app provides offline access to bird species data with support for images, audio recordings, and detailed species information.

## 🚀 Features

- **Offline-first**: All species data, images, and audio stored locally using SQLite
- **Cross-platform**: Runs on iOS, Android, and web browsers
- **Rich media**: High-quality images and audio recordings for each species
- **Search & Filter**: Advanced search capabilities with multiple filter options
- **Detailed Species Info**: Comprehensive information including local names, scientific names, descriptions
- **Bird Audio**: Playback bird songs and calls
- **Voice Search**: Search species with voice
- **Migraiton Maps**: Visual representations of species habitats

## 📱 Tech Stack

- **Framework**: [Ionic](https://ionicframework.com/) with Angular
- **Database**: SQLite with [sql.js](https://sql.js.org/) (in-memory WASM, bundled database assets)
- **Mobile Runtime**: [Capacitor](https://capacitorjs.com/)
- **Styling**: TailwindCSS + Ionic Components
- **Audio Recording**: [capacitor-voice-recorder](https://github.com/tchvu3/capacitor-voice-recorder)

## 🛠️ Prerequisites

- **Node.js**
- **npm** or **yarn**
- **Capacitor CLI**: `npm install -g @capacitor/cli`
- **Ionic CLI**: `npm install -g @ionic/cli`

## 📦 Quick Start

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up species data** (Required)

   The `src/assets/species-data/` directory is **not included** in this repository. It comes from a separate private repository to allow this main codebase to be used across multiple projects with different species datasets.

   You need to either:
   - Clone the private species data repository into `src/assets/species-data/`
   - Or create your own species data following the expected structure (see [Data Management](#data-management))

   ```bash
   # Example: Clone private species data repo
   git clone <private-species-data-repo-url> src/assets/species-data
   ```

4. **Download assets and copy into species-data**

   If your project stores images and audio in S3, download them and copy into `src/assets/species-data/`:

   ```bash
   S3_BUCKET=your-bucket-name ./scripts/download-s3-assets.sh
   node scripts/generate-index-json.mjs
   ./scripts/copy-species-data-to-app.sh
   ```

   Optionally validate that the index matches your database:
   `node scripts/validate-index-against-db.mjs src/assets/species-data/databases/species-production.db external-assets/index.json`

   Building the database (e.g. from CSV or other sources) is project-specific; see [Data Management](#data-management) for one approach.

5. **Run the app in the browser**

   a) Run this command to serve the app to your browser

   ```bash
   npm run start
   ```

   b) Navigate to localhost:4200 to explore the app

## 🏃‍♂️ Development

### Web Development

```bash
# Start development server
npm start
# or
ionic serve
```

### Mobile Development

#### iOS

```bash
# Build and sync
ionic build
ionic cap sync ios

# Open in Xcode
ionic cap open ios
```

#### Android

```bash
# Build and sync
ionic build
ionic cap sync android

# Open in Android Studio
ionic cap open android
```

## 🗄️ Data Management

The app uses a multi-step data pipeline to convert species information from Google Sheets to a local SQLite database:

### Data Sources

- **Google Sheets**: Source of truth for species data
- **CSV Export**: Intermediate format for processing
- **SQLite Database**: Final format used by the app
- **S3 Assets**: Images and audio files

### Data Processing Pipeline

1. **Export from Google Sheets** to CSV files:
   - `orders.csv` - Bird order classifications
   - `birds.csv` - Individual bird species data

2. **Convert CSV to SQL**:

   ```bash
   node scripts/process-bird-data.mjs --orders sheets/orders.csv --birds sheets/birds.csv --output bird_data.sql
   ```

3. **Create SQLite database**:

   ```bash
   sqlite3 species-production.db < bird_data.sql
   ```

4. **Download media assets**:

   ```bash
   ./scripts/download-s3-assets.sh
   node scripts/generate-index-json.mjs
   ```

5. **Validate data integrity**:
   ```bash
   node scripts/validate-index-against-db.mjs
   ```

### Database Schema

The app uses four main tables:

- **`bird_orders`**: Taxonomic orders (Passeriformes, Falconiformes, etc.)
- **`birds`**: Individual species with names, descriptions, and metadata
- **`bird_images`**: Image references with captions and sort order
- **`bird_audios`**: Audio file references with captions and sort order

## 📁 Project Structure

```
src/
├── app/
│   ├── constants/          # App-wide constants and options
│   ├── modals/            # Modal components (options, update)
│   ├── models/            # TypeScript interfaces and models
│   ├── pages/             # Main app pages
│   │   ├── bird-detail/   # Individual species detail view
│   │   ├── explore-container/ # Species listing and search
│   │   ├── landing/       # Home/welcome page
│   │   ├── settings/      # App settings
│   │   └── tab*/          # Tab navigation pages
│   ├── partials/          # Reusable components
│   │   ├── bird-list-item/    # Species list item
│   │   ├── bird-map/          # Interactive species map
│   │   ├── image-carousel/    # Image gallery
│   │   ├── search-bar/        # Search functionality
│   │   └── ...
│   └── services/          # Business logic and data services
│       ├── sqljs.service.ts       # SQLite database management
│       ├── bird-preferences.service.ts # User preferences
│       ├── analytics.service.ts   # PostHog analytics
│       └── ...
├── assets/
│   ├── species-data/      # Database and configuration files (EXTERNAL - from private repo)
│   └── core/              # Fonts, icons, templates
└── scripts/               # Data processing scripts
```

## 🏗️ Architecture & Multi-Project Design

This repository is designed to be **project-agnostic** and can be used for different species identification projects. The key architectural decision is that **species-specific data is kept separate** from the core application code.

### Separated Concerns

- **This Repository**: Contains the core Ionic/Angular application framework, UI components, and data processing scripts
- **Species Data Repository**: Contains project-specific data including:
  - SQLite databases (`species-production.db`)
  - Configuration files (`db-config.json`)
  - CSV source files (`birds.csv`, `orders.csv`)
  - Asset indexes (`index.json`)

### Benefits

- **Reusability**: Same codebase can power multiple species identification apps
- **Security**: Sensitive or proprietary species data kept in private repositories
- **Modularity**: Easy to swap datasets without changing application code
- **Scalability**: Different projects can have different data structures while sharing core functionality

### Using this app for your own project

The repo is **language- and project-agnostic**: no project-specific content is required in the codebase.

1. **Clone** this repository.
2. **Add species-data**: Clone your species data repo into `src/assets/species-data/`, or create your own (see [Expected Species Data Structure](#expected-species-data-structure)).
3. **Config**: Ensure `src/assets/species-data/config/config.json` exists. Copy from [docs/config.template.json](docs/config.template.json) and set `mainMenuLabel`, `landingSubtitle`, `domainLabels`, `appName`, `appId`, etc.
4. **Branding (optional)**: To use your own app name, bundle ID, and icons, run **before** building:
   ```bash
   node scripts/apply-branding.mjs
   ```
   Then run `ionic build` and `ionic cap sync ios` (or `android`). The script writes `branding.generated.json` (gitignored); Capacitor reads it for app name and ID. Optionally place icon/splash assets in `species-data/branding/` (see [App icon and splash screen](#app-icon-and-splash-screen)).
5. **Build and run** as in [Building & Deployment](#-building--deployment).

Project-specific data, config, and branding live only in the species-data directory (or your own repo). The main app repo stays generic and safe to pull from upstream.

### Setup Requirements

The `src/assets/species-data/` directory must be populated before the app will function. This can be done by:

1. **Cloning a species data repository** into this location
2. **Creating your own dataset** following the expected structure
3. **Symlinking** an existing species data directory

### Expected Species Data Structure

The `src/assets/species-data/` directory should contain:

```
src/assets/species-data/
├── config/
│   └── config.json            # App config (mainMenuLabel, landingSubtitle, domainLabels, appName, appId, etc.)
├── branding/                  # Optional: project icon and splash (see App icon and splash screen)
│   ├── favicon.png            # Web favicon
│   ├── icon-no-bg.png         # In-app menu icon
│   ├── icon.png               # Fallback for web if favicon/icon-no-bg missing
│   ├── ios/                   # iOS assets (apply-branding copies into app)
│   │   ├── AppIcon.png        # 1024×1024 app icon
│   │   └── Splash.imageset/   # Launch screen image set
│   ├── icons/                 # Optional: tab1-icon.svg, tab2-icon.svg for menu and tab icons (see domainIconUrls in config)
│   └── android/               # Android res (mipmap-*, drawable*, values); apply-branding copies into app
├── audios/
├── databases/
│   ├── db-config.json         # Database configuration
│   └── species-production.db  # SQLite database file
├── images/
│   ├── birds/
│   └── plants/
└── index.json                 # Asset index file (if using external assets)
```

A template for `config.json` with all optional keys is in [docs/config.template.json](docs/config.template.json). Copy it to `src/assets/species-data/config/config.json` and fill in your values.

#### Key Files Explained

- **`config/config.json`**: Runtime and optional build-time config. Keys include `mainMenuLabel`, `landingSubtitle`, `domainLabels` (object with `bird` and `plant` display names), `tabLabels` (optional short labels for the tab bar; defaults to `domainLabels`), `domainIconUrls` (optional `bird`/`plant` image URLs for menu and tab icons, e.g. `assets/species-data/branding/icons/tab1-icon.svg`), `aboutDescription`, `aboutBody` (About page copy), `appVersion` (optional; when set, overrides package.json for the version shown in the app), `assetBaseUrl`, `dbName`, `posthogApiKey`, `posthogHost`, and optionally `appName`, `appId`, `splashBackgroundColor` for the apply-branding script.

- **`databases/db-config.json`**: Contains database connection settings

  ```json
  {
    "database": "species-id",
    "encrypted": false,
    "mode": "no-encryption",
    "version": "1",
    "readonly": true
  }
  ```

- **`databases/species-production.db`**: The SQLite database containing all species data (generated from CSV files using the processing scripts)

- **`index.json`**: Index of all media assets (images/audio) with file hashes for integrity checking and download management

#### App icon and splash screen

Branding assets **live in** `species-data/branding/`. The **apply-branding** script copies them into the app at build time (web → `src/assets/core/icon/`, iOS → `ios/App/App/Assets.xcassets/`, Android → `android/app/src/main/res/`). The main app repo only holds generic defaults so upstream pulls never overwrite your branding.

- **Web**: Put `favicon.png` and `icon-no-bg.png` (and optionally `icon.png`) in `species-data/branding/`. apply-branding copies them to `src/assets/core/icon/`.
- **iOS**: Put `AppIcon.png` (1024×1024) and optionally `Splash.imageset/` in `species-data/branding/ios/`. apply-branding copies them into the app’s Assets.xcassets.
- **Android**: Put the same structure as `android/app/src/main/res/` under `species-data/branding/android/` (e.g. `mipmap-mdpi/`, `mipmap-hdpi/`, …, `drawable/`, `drawable-hdpi/`, …, `values/ic_launcher_background.xml`). apply-branding copies them into the app’s `res/`.

To **migrate** existing app icons into species-data (one-time), run `node scripts/copy-branding-to-species-data.mjs`: it copies from the app’s current web and native assets into `species-data/branding/`. Then commit `species-data/branding/` in the species-data repo and use `npm run apply-branding` before builds.

## 🔧 Configuration

### Environment Variables

Create environment files in `src/environments/`:

```typescript
// environment.ts (development)
export const environment = {
  production: false,
};

// environment.prod.ts (production)
export const environment = {
  production: true,
};
```

### Database Configuration

Edit `src/assets/species-data/databases/db-config.json`:

```json
{
  "database": "species-id",
  "encrypted": false,
  "mode": "no-encryption",
  "version": "1",
  "readonly": true
}
```

## 🚀 Building & Deployment

### Web Build

```bash
ionic build --prod
```

### Mobile Build

#### iOS

```bash
ionic build --prod
ionic cap sync ios
# Then build in Xcode
```

#### Android

```bash
ionic build --prod
ionic cap sync android
# Then build in Android Studio
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run linting
npm run lint

# Run e2e tests (if configured)
npm run e2e
```

## 🐛 Troubleshooting

### Common Issues

1. **SQLite database not loading**
   - Ensure `species-production.db` is in the correct assets directory
   - Check database permissions and file size

2. **Images/Audio not displaying**
   - Verify asset files are downloaded and indexed
   - Check `index.json` file is present and valid

3. **Build errors on mobile**
   - Ensure all Capacitor plugins are properly installed
   - Check platform-specific requirements are met

### Debug Mode

Enable debug logging by setting localStorage:

```javascript
localStorage.setItem('debug', 'true');
```

## Data Organization & Presentation

Each row should be a unique species. But a separate row should be used for the same species if the crow word differentiates age.

- Latin names (semi-colon separated, but different ages are separate lines)
- Crow names (semi-colon separated, ordered)
- English names (semi-colon separated)
- Latin names (semi-colon separated)
- Crow name audios (semi-colon separated, ordered, comma-separated for multiple audio for a single name)
- Photos (semi-colon separated)
- Crow name literal meaning (semi-colon separated, ordered)
- Description (HTML formatting for styling text)
- Habitat (HTML formatting for styling text)
- Food Habits (HTML formatting for styling text)
- Category
- Map image

### Mapping

- Crow <-> Latin (Many to Many)
- Crow <-> English (Many to Many)
- Crow <-> Literal (One to One)

### Crow list

- Each unique **Crow name** + **Species** combination gets its own item
- Same Crow name appears multiple times if it maps to different species
- Different Crow names for same species get separate items
- **Examples**
  - akbannakkoopé; ‘one who punches holes in wood’; Downy Woodpecker; (Dryobates pubescens)
  - akbannakkoopé; ‘one who punches holes in wood’; Hairy Woodpecker; (Dryobates villosus)
  - akbannakkoopkáate; ‘little one who punches holes in wood’; Downy Woodpecker; (Dryobates pubescens)
  - akbannakkoopísee; ‘big one who punches holes in wood’; Hairy Woodpecker; (Dryobates villosus)
  - chuuwáawiliche; ‘close to water’; Mountain Plover; (Anarhynchus montanus; Charadrius montanus)

### English list

- Each unique **English name** + **Species** combination gets its own item
- Multiple Crow names for same species are comma-separated
- Same species with different English names get separate items
- **Examples**
  - Downy Woodpecker; akbannakkoopé, akbannakkoopkáate; (Dryobates pubescens)
  - Hairy Woodpecker; akbannakkoopé, akbannakkoopísee; (Dryobates villosus)
  - Anhinga; binnakáake; (Anhinga anhinga)
  - Water Turkey; binnakáake; (Anhinga anhinga)

### Latin names in above lists

- Latin names that include multiple names should stay together

### Latin list

- Each unique **Latin name** gets its own item (Latin names are unique identifiers)
- Multiple Crow names are comma-separated
- Multiple Latin synonyms for same species should be separate items
- **Examples**
  - Anarhynchus montanus; chuuwáawiliche; Mountain Plover
  - Charadrius montanus; chuuwáawiliche; Mountain Plover
  - Dromaius novaehollandiae; dakáakakdaassee; Emu

### Description, Habitat, Uses

- Use HTML formatting for individual words
- Examples: <i>italic</i>, <b>bold</b>, <u>underline</u>

### Photos

- Semi-colon-separated so we can decide how many and which to use
- First photo is used for list view and first photo in detail view

### Crow Name Audios

- Comma-separated within each name so we can display all audio for a given text
- First audio used for list view
- All audios will be in detail view.

### Detail View

akbannakkoopé; akbannakkoopkáate
‘one who punches holes in wood'; 'little one who punches holes in wood’
Downy Woodpecker
(Dryobates pubescens)

## Tables

```sql
-- Bird Tables
CREATE TABLE IF NOT EXISTS birds (
    id INTEGER PRIMARY KEY,
    latin_name TEXT NOT NULL,
    category TEXT NOT NULL,
    description_en TEXT,
    habitat_en TEXT,
    food_habits_en TEXT,
    map_image TEXT
);

CREATE TABLE IF NOT EXISTS bird_english_names (
    id INTEGER PRIMARY KEY,
    bird_id INTEGER NOT NULL,
    english_name TEXT NOT NULL,
    FOREIGN KEY (bird_id) REFERENCES birds(id)
);

CREATE TABLE IF NOT EXISTS bird_crow_names (
    id INTEGER PRIMARY KEY,
    crow_word TEXT NOT NULL,
    literal_meaning TEXT
);

CREATE TABLE IF NOT EXISTS bird_crow_name_mappings (
    id INTEGER PRIMARY KEY,
    crow_name_id INTEGER NOT NULL,
    bird_id INTEGER NOT NULL,
    FOREIGN KEY (crow_name_id) REFERENCES bird_crow_names(id),
    FOREIGN KEY (bird_id) REFERENCES birds(id)
);

CREATE TABLE IF NOT EXISTS bird_scientific_synonyms (
    id INTEGER PRIMARY KEY,
    bird_id INTEGER NOT NULL,
    synonym_name TEXT NOT NULL,
    FOREIGN KEY (bird_id) REFERENCES birds(id)
);

CREATE TABLE IF NOT EXISTS bird_images (
    id INTEGER PRIMARY KEY,
    file_name TEXT NOT NULL,
    bird_id INTEGER NOT NULL,
    caption TEXT,
    sort_order INTEGER,
    FOREIGN KEY (bird_id) REFERENCES birds(id)
);

CREATE TABLE IF NOT EXISTS bird_song_audios (
    id INTEGER PRIMARY KEY,
    file_name TEXT NOT NULL,
    bird_id INTEGER NOT NULL,
    caption TEXT,
    sort_order INTEGER,
    FOREIGN KEY (bird_id) REFERENCES birds(id)
);

CREATE TABLE IF NOT EXISTS bird_text_audios (
    id INTEGER PRIMARY KEY,
    crow_name_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    sort_order INTEGER,
    FOREIGN KEY (crow_name_id) REFERENCES bird_crow_names(id)
);

-- Plant Tables
CREATE TABLE IF NOT EXISTS plants (
    id INTEGER PRIMARY KEY,
    latin_name TEXT NOT NULL,
    category TEXT,
    description_en TEXT,
    habitat_en TEXT,
    uses_en TEXT,
    map_image TEXT
);

CREATE TABLE IF NOT EXISTS plant_english_names (
    id INTEGER PRIMARY KEY,
    plant_id INTEGER NOT NULL,
    english_name TEXT NOT NULL,
    FOREIGN KEY (plant_id) REFERENCES plants(id)
);

CREATE TABLE IF NOT EXISTS plant_crow_names (
    id INTEGER PRIMARY KEY,
    crow_word TEXT NOT NULL,
    literal_meaning TEXT
);

CREATE TABLE IF NOT EXISTS plant_crow_name_mappings (
    id INTEGER PRIMARY KEY,
    crow_name_id INTEGER NOT NULL,
    plant_id INTEGER NOT NULL,
    FOREIGN KEY (crow_name_id) REFERENCES plant_crow_names(id),
    FOREIGN KEY (plant_id) REFERENCES plants(id)
);

CREATE TABLE IF NOT EXISTS plant_scientific_synonyms (
    id INTEGER PRIMARY KEY,
    plant_id INTEGER NOT NULL,
    synonym_name TEXT NOT NULL,
    FOREIGN KEY (plant_id) REFERENCES plants(id)
);

CREATE TABLE IF NOT EXISTS plant_images (
    id INTEGER PRIMARY KEY,
    file_name TEXT NOT NULL,
    plant_id INTEGER NOT NULL,
    caption TEXT,
    sort_order INTEGER,
    FOREIGN KEY (plant_id) REFERENCES plants(id)
);

CREATE TABLE IF NOT EXISTS plant_text_audios (
    id INTEGER PRIMARY KEY,
    crow_name_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    sort_order INTEGER,
    FOREIGN KEY (crow_name_id) REFERENCES plant_crow_names(id)
)
```

## 📚 Scripts Reference

### Data Processing Scripts

| Script                           | Purpose                  | Usage                                                                      |
| -------------------------------- | ------------------------ | -------------------------------------------------------------------------- |
| `process-bird-data.mjs`          | Convert CSV files to SQL | `node scripts/process-bird-data.mjs --orders orders.csv --birds birds.csv` |
| `birds-csv-to-sqlite-parser.mjs` | CSV parser library       | Used by process-bird-data.mjs                                              |
| `download-s3-assets.sh`          | Download media from S3   | `./scripts/download-s3-assets.sh`                                          |
| `generate-index-json.mjs`        | Create asset index       | `node scripts/generate-index-json.mjs`                                     |
| `validate-index-against-db.mjs`  | Validate data integrity  | `node scripts/validate-index-against-db.mjs`                               |

See [scripts/README.md](scripts/README.md) for detailed documentation.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and test thoroughly
4. Commit changes: `git commit -am 'Add new feature'`
5. Push to branch: `git push origin feature/my-feature`
6. Submit a Pull Request

## 📄 License

[Add your license information here]

## 🆘 Support

For questions or issues:

- Check the [troubleshooting section](#troubleshooting)
- Review [scripts documentation](scripts/README.md)
- Open an issue in the repository

---

_Built with ❤️ using Ionic Framework_
