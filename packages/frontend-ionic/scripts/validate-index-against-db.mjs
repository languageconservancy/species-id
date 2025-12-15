// validate-index-against-db.mjs
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * Loads the index.json file and returns a set of image and audio files.
 * @param {string} indexPath - The path to the index.json file.
 * @returns {Promise<{birdSpeciesImages: Set<string>, birdTextAudios: Set<string>, birdSongAudios: Set<string>, birdMapImages: Set<string>, plantSpeciesImages: Set<string>, plantTextAudios: Set<string>, plantMapImages: Set<string>}>} - A promise that resolves to an object containing sets of image and audio files.
 */
async function loadIndexJson(indexPath /*: string*/) {
  const raw = await readFile(indexPath, 'utf-8');
  const parsed = JSON.parse(raw);

  const birdSpeciesImages = parsed.birds?.speciesImages?.map((x) => path.basename(x.path)) || [];
  const birdTextAudios = parsed.birds?.textAudios?.map((x) => path.basename(x.path)) || [];
  const birdSongAudios = parsed.birds?.songAudios?.map((x) => path.basename(x.path)) || [];
  const birdMapImages = parsed.birds?.mapImages?.map((x) => path.basename(x.path)) || [];
  const plantSpeciesImages = parsed.plants?.speciesImages?.map((x) => path.basename(x.path)) || [];
  const plantTextAudios = parsed.plants?.textAudios?.map((x) => path.basename(x.path)) || [];
  const plantMapImages = parsed.plants?.mapImages?.map((x) => path.basename(x.path)) || [];

  return {
    birdSpeciesImages: new Set(birdSpeciesImages),
    birdTextAudios: new Set(birdTextAudios),
    birdSongAudios: new Set(birdSongAudios),
    birdMapImages: new Set(birdMapImages),
    plantSpeciesImages: new Set(plantSpeciesImages),
    plantTextAudios: new Set(plantTextAudios),
    plantMapImages: new Set(plantMapImages),
  };
}

/**
 * Loads the database and returns a set of image and audio files.
 * @param {string} dbPath - The path to the database file.
 * @returns {Promise<{birdSpeciesImages: Set<string>, birdTextAudios: Set<string>, birdSongAudios: Set<string>, birdMapImages: Set<string>, plantSpeciesImages: Set<string>, plantTextAudios: Set<string>, plantMapImages: Set<string>}>} - A promise that resolves to an object containing sets of image and audio files.
 */
async function loadDbFilenames(dbPath /*: string*/) {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  let birdSpeciesImageRows = [];
  let birdTextAudioRows = [];
  let birdSongAudioRows = [];
  let birdMapImageRows = [];
  let plantSpeciesImageRows = [];
  let plantTextAudioRows = [];
  let plantMapImageRows = [];

  try {
    birdSpeciesImageRows = await db.all('SELECT file_name FROM bird_images');
    if (birdSpeciesImageRows.length === 0) {
      console.warn('❌ No bird species images found in database');
    }
  } catch (error) {
    console.error('❌ Error loading bird species images:', error);
  }

  try {
    birdTextAudioRows = await db.all('SELECT file_name FROM bird_text_audios');
    if (birdTextAudioRows.length === 0) {
      console.warn('❌ No bird text audios found in database');
    }
  } catch (error) {
    console.error('❌ Error loading bird text audios:', error);
  }

  try {
    birdSongAudioRows = await db.all('SELECT file_name FROM bird_song_audios');
    if (birdSongAudioRows.length === 0) {
      console.warn('❌ No bird song audios found in database');
    }
  } catch (error) {
    console.error('❌ Error loading bird song audios:', error);
  }

  try {
    birdMapImageRows = await db.all(
      'SELECT map_image FROM birds WHERE map_image IS NOT NULL AND map_image != ""'
    );
    if (birdMapImageRows.length === 0) {
      console.warn('❌ No bird map images found in database');
    }
  } catch (error) {
    console.error('❌ Error loading bird map images:', error);
  }

  try {
    plantSpeciesImageRows = await db.all('SELECT file_name FROM plant_images');
    if (plantSpeciesImageRows.length === 0) {
      console.warn('❌ No plant species images found in database');
    }
  } catch (error) {
    console.error('❌ Error loading plant species images:', error);
  }

  try {
    plantTextAudioRows = await db.all('SELECT file_name FROM plant_text_audios');
    if (plantTextAudioRows.length === 0) {
      console.warn('❌ No plant text audios found in database');
    }
  } catch (error) {
    console.error('❌ Error loading plant text audios:', error);
  }

  try {
    plantMapImageRows = await db.all(
      'SELECT map_image FROM plants WHERE map_image IS NOT NULL AND map_image != ""'
    );
    if (plantMapImageRows.length === 0) {
      console.warn('❌ No plant map images found in database');
    }
  } catch (error) {
    console.error('❌ Error loading plant map images:', error);
  }

  await db.close();

  return {
    birdSpeciesImages: new Set(birdSpeciesImageRows.map((row) => row.file_name)),
    birdTextAudios: new Set(birdTextAudioRows.map((row) => row.file_name)),
    birdSongAudios: new Set(birdSongAudioRows.map((row) => row.file_name)),
    birdMapImages: new Set(birdMapImageRows.map((row) => path.basename(row.map_image))),
    plantSpeciesImages: new Set(plantSpeciesImageRows.map((row) => row.file_name)),
    plantTextAudios: new Set(plantTextAudioRows.map((row) => row.file_name)),
    plantMapImages: new Set(plantMapImageRows.map((row) => path.basename(row.map_image))),
  };
}

/**
 * Returns the difference between two sets.
 * @param {Set<string>} setA - The first set.
 * @param {Set<string>} setB - The second set.
 * @returns {string[]} - An array of strings that are in setA but not in setB.
 */
function diff(setA, setB) {
  return [...setA].filter((x) => !setB.has(x));
}

/**
 * Validates the index.json file against the database.
 * @param {string} dbPath - The path to the database file.
 * @param {string} indexPath - The path to the index.json file.
 */
async function validate(dbPath, indexPath) {
  const index = await loadIndexJson(indexPath);
  const db = await loadDbFilenames(dbPath);

  // Calculate differences for all file types
  const missingFromIndex = {
    birdSpeciesImages: diff(db.birdSpeciesImages, index.birdSpeciesImages),
    birdTextAudios: diff(db.birdTextAudios, index.birdTextAudios),
    birdSongAudios: diff(db.birdSongAudios, index.birdSongAudios),
    birdMapImages: diff(db.birdMapImages, index.birdMapImages),
    plantSpeciesImages: diff(db.plantSpeciesImages, index.plantSpeciesImages),
    plantTextAudios: diff(db.plantTextAudios, index.plantTextAudios),
    plantMapImages: diff(db.plantMapImages, index.plantMapImages),
  };

  const orphanedInIndex = {
    birdSpeciesImages: diff(index.birdSpeciesImages, db.birdSpeciesImages),
    birdTextAudios: diff(index.birdTextAudios, db.birdTextAudios),
    birdSongAudios: diff(index.birdSongAudios, db.birdSongAudios),
    birdMapImages: diff(index.birdMapImages, db.birdMapImages),
    plantSpeciesImages: diff(index.plantSpeciesImages, db.plantSpeciesImages),
    plantTextAudios: diff(index.plantTextAudios, db.plantTextAudios),
    plantMapImages: diff(index.plantMapImages, db.plantMapImages),
  };

  console.log('\n🔎 Validation Report');
  console.log('=========================');

  // Check for files referenced in DB but missing from index.json
  const hasMissingFiles = Object.values(missingFromIndex).some((arr) => arr.length > 0);

  if (hasMissingFiles) {
    console.log('\n❌ Files referenced in DB but missing from index.json:');

    if (missingFromIndex.birdSpeciesImages.length) {
      console.log(`- Bird Species Images: ${missingFromIndex.birdSpeciesImages.join(', ')}`);
    }
    if (missingFromIndex.birdTextAudios.length) {
      console.log(`- Bird Text Audios: ${missingFromIndex.birdTextAudios.join(', ')}`);
    }
    if (missingFromIndex.birdSongAudios.length) {
      console.log(`- Bird Song Audios: ${missingFromIndex.birdSongAudios.join(', ')}`);
    }
    if (missingFromIndex.birdMapImages.length) {
      console.log(`- Bird Map Images: ${missingFromIndex.birdMapImages.join(', ')}`);
    }
    if (missingFromIndex.plantSpeciesImages.length) {
      console.log(`- Plant Species Images: ${missingFromIndex.plantSpeciesImages.join(', ')}`);
    }
    if (missingFromIndex.plantTextAudios.length) {
      console.log(`- Plant Text Audios: ${missingFromIndex.plantTextAudios.join(', ')}`);
    }
    if (missingFromIndex.plantMapImages.length) {
      console.log(`- Plant Map Images: ${missingFromIndex.plantMapImages.join(', ')}`);
    }
  } else {
    console.log('\n✅ All DB files are accounted for in index.json');
  }

  // Check for files in index.json but not referenced by DB
  const hasOrphanedFiles = Object.values(orphanedInIndex).some((arr) => arr.length > 0);

  if (hasOrphanedFiles) {
    console.log('\n⚠️ Files in index.json not referenced by DB:');

    if (orphanedInIndex.birdSpeciesImages.length) {
      console.log(`- Bird Species Images: ${orphanedInIndex.birdSpeciesImages.join(', ')}`);
    }
    if (orphanedInIndex.birdTextAudios.length) {
      console.log(`- Bird Text Audios: ${orphanedInIndex.birdTextAudios.join(', ')}`);
    }
    if (orphanedInIndex.birdSongAudios.length) {
      console.log(`- Bird Song Audios: ${orphanedInIndex.birdSongAudios.join(', ')}`);
    }
    if (orphanedInIndex.birdMapImages.length) {
      console.log(`- Bird Map Images: ${orphanedInIndex.birdMapImages.join(', ')}`);
    }
    if (orphanedInIndex.plantSpeciesImages.length) {
      console.log(`- Plant Species Images: ${orphanedInIndex.plantSpeciesImages.join(', ')}`);
    }
    if (orphanedInIndex.plantTextAudios.length) {
      console.log(`- Plant Text Audios: ${orphanedInIndex.plantTextAudios.join(', ')}`);
    }
    if (orphanedInIndex.plantMapImages.length) {
      console.log(`- Plant Map Images: ${orphanedInIndex.plantMapImages.join(', ')}`);
    }
  } else {
    console.log('\n✅ No orphaned files in index.json');
  }

  console.log('\n✅ Validation complete.\n');
}

const [, , dbPath, indexPath] = process.argv;

if (!dbPath || !indexPath) {
  console.error('Usage: node validate-index-against-db.mjs <db.sqlite> <index.json>');
  process.exit(1);
}

validate(dbPath, indexPath).catch((err) => {
  console.error('❌ Error during validation:', err);
  process.exit(1);
});
