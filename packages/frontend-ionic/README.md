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
- **Database**: SQLite with [sql.js](https://sql.js.org/) and [@capacitor-community/sqlite](https://github.com/capacitor-community/sqlite)
- **Mobile Runtime**: [Capacitor](https://capacitorjs.com/)
- **Styling**: TailwindCSS + Ionic Components
- **Audio Recording**: [capacitor-voice-recorder](https://github.com/tchvu3/capacitor-voice-recorder)

## 🛠️ Prerequisites

- **Node.js**
- **npm** or **yarn**
- **Capacitor CLI**: `npm install -g @capacitor/cli`
- **Ionic CLI**: `npm install -g @ionic/cli`

### For Mobile Development

- **iOS**: Xcode 14+ (macOS only)
- **Android**: Android Studio with SDK 33+

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd species-id/packages/frontend-ionic
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

4. **Prepare species data** (see [Data Management](#data-management))

   ```bash
   # Process CSV files into SQL
   node scripts/process-bird-data.mjs --orders sheets/orders.csv --birds sheets/birds.csv --output bird_data.sql

   # Convert SQL to SQLite database
   sqlite3 species-production.db < bird_data.sql
   ```

5. **Download assets** (optional, for production data)
   ```bash
   ./scripts/download-s3-assets.sh
   node scripts/generate-index-json.mjs
   node scripts/validate-index-against-db.mjs src/assets/species-data/databases/species-production.db external-assets/index.json
   ```

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

### Setup Requirements

The `src/assets/species-data/` directory must be populated before the app will function. This can be done by:

1. **Cloning a species data repository** into this location
2. **Creating your own dataset** following the expected structure
3. **Symlinking** an existing species data directory

### Expected Species Data Structure

The `src/assets/species-data/` directory should contain:

```
src/assets/species-data/
├── audios/
├── databases/
│   ├── db-config.json         # Database configuration
│   └── species-production.db  # SQLite database file
├── images/
│   ├── birds/
│   └── plants/
├── templates/
│   └── config.template.json   # Configuration template (optional)
└── index.json                 # Asset index file (if using external assets)
```

#### Key Files Explained

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

- **`templates/config.template.json`**: Optional configuration template for different deployment environments

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
