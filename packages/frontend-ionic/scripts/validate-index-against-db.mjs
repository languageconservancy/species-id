// validate-index-against-db.mjs
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * Loads the index.json file and returns a set of image and audio files.
 * @param {string} indexPath - The path to the index.json file.
 * @returns {Promise<{birdImageFiles: Set<string>, birdAudioFiles: Set<string>, plantImageFiles: Set<string>}>} - A promise that resolves to an object containing sets of image and audio files.
 */
async function loadIndexJson(indexPath /*: string*/) {
  const raw = await readFile(indexPath, 'utf-8');
  const parsed = JSON.parse(raw);

  const birdImages = parsed.birds?.images.map((x) => path.basename(x.path)) || [];
  const birdAudio = parsed.birds?.audio.map((x) => path.basename(x.path)) || [];
  const plantImages = parsed.plants?.images.map((x) => path.basename(x.path)) || [];

  return {
    birdImageFiles: new Set(birdImages),
    birdAudioFiles: new Set(birdAudio),
    plantImageFiles: new Set(plantImages),
  };
}

/**
 * Loads the database and returns a set of image and audio files.
 * @param {string} dbPath - The path to the database file.
 * @returns {Promise<{birdImageFiles: Set<string>, birdAudioFiles: Set<string>, plantImageFiles: Set<string>}>} - A promise that resolves to an object containing sets of image and audio files.
 */
async function loadDbFilenames(dbPath /*: string*/) {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  let birdImageRows = [];
  let birdAudioRows = [];
  let plantImageRows = [];

  try {
    birdImageRows = await db.all('SELECT file_name FROM bird_images');
    if (birdImageRows.length === 0) {
      console.warn('❌ No bird images found in database');
    }
  } catch (error) {
    console.error('❌ Error loading bird images:', error);
  }

  try {
    birdAudioRows = await db.all('SELECT file_name FROM bird_audio');
    if (birdAudioRows.length === 0) {
      console.warn('❌ No bird audio found in database');
    }
  } catch (error) {
    console.error('❌ Error loading bird audio:', error);
  }

  try {
    plantImageRows = await db.all('SELECT file_name FROM plant_images');
    if (plantImageRows.length === 0) {
      console.warn('❌ No plant images found in database');
    }
  } catch (error) {
    console.error('❌ Error loading plant images:', error);
  }

  await db.close();

  return {
    birdImageFiles: new Set(birdImageRows.map((row) => row.file_name)),
    birdAudioFiles: new Set(birdAudioRows.map((row) => row.file_name)),
    plantImageFiles: new Set(plantImageRows.map((row) => row.file_name)),
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

  const missingFromIndexBirdImages = diff(db.birdImageFiles, index.birdImageFiles);
  const missingFromIndexBirdAudio = diff(db.birdAudioFiles, index.birdAudioFiles);

  const orphanedInIndexBirdImages = diff(index.birdImageFiles, db.birdImageFiles);
  const orphanedInIndexBirdAudio = diff(index.birdAudioFiles, db.birdAudioFiles);

  const missingFromIndexPlantImages = diff(db.plantImageFiles, index.plantImageFiles);
  const orphanedInIndexPlantImages = diff(index.plantImageFiles, db.plantImageFiles);

  console.log('\n🔎 Validation Report');
  console.log('=========================');

  // Bird images and audio - in s3 but missing from index.json
  if (
    missingFromIndexBirdImages.length ||
    missingFromIndexBirdAudio.length ||
    missingFromIndexPlantImages.length
  ) {
    console.log('\n❌ Files referenced in DB but missing from index.json:');
    if (missingFromIndexBirdImages.length) {
      console.log(`- Images: ${missingFromIndexBirdImages.join(', ')}`);
    }
    if (missingFromIndexBirdAudio.length) {
      console.log(`- Audio: ${missingFromIndexBirdAudio.join(', ')}`);
    }
    if (missingFromIndexPlantImages.length) {
      console.log(`- Plant images: ${missingFromIndexPlantImages.join(', ')}`);
    }
  } else {
    console.log('\n✅ All DB files are accounted for in index.json');
  }

  // Bird images and audio - in index.json but not in DB
  if (
    orphanedInIndexBirdImages.length ||
    orphanedInIndexBirdAudio.length ||
    orphanedInIndexPlantImages.length
  ) {
    console.log('\n⚠️ Files in index.json not referenced by DB:');
    if (orphanedInIndexBirdImages.length) {
      console.log(`- Images: ${orphanedInIndexBirdImages.join(', ')}`);
    }
    if (orphanedInIndexBirdAudio.length) {
      console.log(`- Audio: ${orphanedInIndexBirdAudio.join(', ')}`);
    }
    if (orphanedInIndexPlantImages.length) {
      console.log(`- Plant images: ${orphanedInIndexPlantImages.join(', ')}`);
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
