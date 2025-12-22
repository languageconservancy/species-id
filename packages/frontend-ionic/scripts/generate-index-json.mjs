import { readdir, readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';

async function hashFile(filePath) {
  const data = await readFile(filePath);
  return createHash('sha256').update(data).digest('hex');
}

async function scanFolder(folder, basePrefix = '') {
  try {
    const entries = await readdir(folder, { withFileTypes: true });
    const assets = [];

    for await (const entry of entries) {
      const fullPath = path.join(folder, entry.name);
      const relativePath = path.join(basePrefix, entry.name).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        const nested = await scanFolder(fullPath, relativePath);
        assets.push(...nested);
      } else if (entry.isFile()) {
        const hash = await hashFile(fullPath);
        assets.push({ path: relativePath, hash });
      }
    }

    return assets;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`⚠️ Skipping missing folder: ${folder}`);
      return [];
    } else {
      throw error; // rethrow unexpected errors
    }
  }
}

async function generateIndexJson() {
  const root = './external-assets';
  // Check folder exists first
  if (!existsSync(root)) {
    console.error(`❌ ${root} does not exist`);
    process.exit(1);
  }

  // For each path, if it doesn't exist, return an empty array
  const dbFiles = await scanFolder(path.join(root, 'databases'), 'databases');
  const birdsSpeciesImages =
    (await scanFolder(path.join(root, 'birds/species_images'), 'birds/species_images')) || [];
  const birdsTextAudios =
    (await scanFolder(path.join(root, 'birds/text_audios'), 'birds/text_audios')) || [];
  const birdsSongAudios =
    (await scanFolder(path.join(root, 'birds/song_audios'), 'birds/song_audios')) || [];
  const birdsMapImages =
    (await scanFolder(path.join(root, 'birds/map_images'), 'birds/map_images')) || [];
  const plantsSpeciesImages =
    (await scanFolder(path.join(root, 'plants/species_images'), 'plants/species_images')) || [];
  const plantsTextAudios =
    (await scanFolder(path.join(root, 'plants/text_audios'), 'plants/text_audios')) || [];
  const plantsMapImages =
    (await scanFolder(path.join(root, 'plants/map_images'), 'plants/map_images')) || [];

  const index = {
    version: new Date().toISOString().split('T')[0],
    databases: dbFiles,
    birds: {
      speciesImages: birdsSpeciesImages,
      textAudios: birdsTextAudios,
      songAudios: birdsSongAudios,
      mapImages: birdsMapImages,
    },
    plants: {
      speciesImages: plantsSpeciesImages,
      textAudios: plantsTextAudios,
      mapImages: plantsMapImages,
    },
  };

  await writeFile(path.join(root, 'index.json'), JSON.stringify(index, null, 2));
  console.log(`✅ index.json generated in ${root}`);
}

generateIndexJson().catch(console.error);
