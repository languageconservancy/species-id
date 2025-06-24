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
  const birdsImages = (await scanFolder(path.join(root, 'birds/images'), 'birds/images')) || [];
  const birdsAudio = (await scanFolder(path.join(root, 'birds/audio'), 'birds/audio')) || [];
  const plantsImages = (await scanFolder(path.join(root, 'plants/images'), 'plants/images')) || [];

  const index = {
    version: new Date().toISOString().split('T')[0],
    databases: dbFiles,
    birds: {
      images: birdsImages,
      audio: birdsAudio,
    },
    plants: {
      images: plantsImages,
    },
  };

  await writeFile(path.join(root, 'index.json'), JSON.stringify(index, null, 2));
  console.log(`✅ index.json generated in ${root}`);
}

generateIndexJson().catch(console.error);
