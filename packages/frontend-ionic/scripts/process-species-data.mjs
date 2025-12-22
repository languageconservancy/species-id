import SpeciesDataParser from './species-csv-to-sqlite-parser.mjs';
import fs from 'fs';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = args[i + 1];

      if (value && !value.startsWith('--')) {
        options[key] = value;
        i++; // Skip the next argument since we used it as a value
      } else {
        options[key] = true; // Flag argument
      }
    }
  }

  return options;
}

// Show usage information
function showUsage() {
  console.log(`
Usage: node process-species-data.mjs [options]

Options:
  --birds <file>             Birds CSV file (optional)
  --plants <file>            Plants CSV file (optional)
  --output <file>            Output SQL file (default: species_data.sql)
  --help                     Show this help message

Examples:
  # Process both birds and plants
  node process-species-data.mjs --birds birds.csv --plants plants.csv

  # Process only birds
  node process-species-data.mjs --birds birds.csv

  # Process only plants
  node process-species-data.mjs --plants plants.csv

  # Custom output file
  node process-species-data.mjs --birds birds.csv --plants plants.csv --output my_data.sql
  `);
}

// Main function
function main() {
  const options = parseArgs();

  // Show help if requested
  if (options.help) {
    showUsage();
    return;
  }

  // Check that at least one species type is provided
  if (!options.birds && !options.plants) {
    console.error('❌ Error: At least one of --birds or --plants must be provided');
    showUsage();
    process.exit(1);
  }

  // Check if provided files exist
  if (options.birds && !fs.existsSync(options.birds)) {
    console.error(`❌ Error: Birds file not found: ${options.birds}`);
    process.exit(1);
  }

  if (options.plants && !fs.existsSync(options.plants)) {
    console.error(`❌ Error: Plants file not found: ${options.plants}`);
    process.exit(1);
  }

  // Set default output file if not provided
  const outputFile = options.output || 'species_data.sql';

  try {
    console.log('🔄 Processing species data...');
    if (options.birds) console.log(`📁 Birds file: ${options.birds}`);
    if (options.plants) console.log(`📁 Plants file: ${options.plants}`);
    console.log(`📁 Output file: ${outputFile}`);

    const parser = new SpeciesDataParser();
    const parsedData = parser.processSpeciesFiles(options.birds, options.plants, outputFile);

    console.log('\n✅ Processing complete!');
    console.log(`📊 Summary:`);
    console.log(`   - Birds: ${parsedData.birds.length}`);
    console.log(`   - Bird English Names: ${parsedData.birdEnglishNames?.length || 0}`);
    console.log(`   - Bird Crow Names: ${parsedData.birdCrowNames?.length || 0}`);
    console.log(`   - Bird Crow Name Mappings: ${parsedData.birdCrowNameMappings?.length || 0}`);
    console.log(`   - Bird Scientific Synonyms: ${parsedData.birdScientificSynonyms?.length || 0}`);
    console.log(`   - Bird Images: ${parsedData.birdImages.length}`);
    console.log(`   - Bird Song Audios: ${parsedData.birdSongAudios.length}`);
    console.log(`   - Bird Text Audios: ${parsedData.birdTextAudios.length}`);
    console.log(`   - Plants: ${parsedData.plants.length}`);
    console.log(`   - Plant English Names: ${parsedData.plantEnglishNames?.length || 0}`);
    console.log(`   - Plant Crow Names: ${parsedData.plantCrowNames?.length || 0}`);
    console.log(`   - Plant Crow Name Mappings: ${parsedData.plantCrowNameMappings?.length || 0}`);
    console.log(
      `   - Plant Scientific Synonyms: ${parsedData.plantScientificSynonyms?.length || 0}`
    );
    console.log(`   - Plant Images: ${parsedData.plantImages.length}`);
    console.log(`   - Plant Text Audios: ${parsedData.plantTextAudios.length}`);
    console.log(`📁 Output written to: ${outputFile}`);

    // Report missing data
    parser.reportMissingData();
  } catch (error) {
    console.error('❌ Error processing files:', error.message);
    process.exit(1);
  }
}

// Run the script
main();

export { parseArgs, showUsage, main };
