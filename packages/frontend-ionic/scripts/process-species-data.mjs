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
  --bird-orders <file>       Bird orders CSV file (required if processing birds)
  --birds <file>             Birds CSV file (optional)
  --plant-categories <file>  Plant categories CSV file (required if processing plants)
  --plants <file>            Plants CSV file (optional)
  --output <file>            Output SQL file (default: species_data.sql)
  --help                     Show this help message

Examples:
  # Process both birds and plants
  node process-species-data.mjs --bird-orders orders.csv --birds birds.csv --plant-categories categories.csv --plants plants.csv

  # Process only birds
  node process-species-data.mjs --bird-orders orders.csv --birds birds.csv

  # Process only plants
  node process-species-data.mjs --plant-categories categories.csv --plants plants.csv

  # Custom output file
  node process-species-data.mjs --bird-orders orders.csv --birds birds.csv --plant-categories categories.csv --plants plants.csv --output my_data.sql
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

  // If birds are provided, bird-orders must also be provided
  if (options.birds && !options['bird-orders']) {
    console.error('❌ Error: --bird-orders is required when processing birds');
    showUsage();
    process.exit(1);
  }

  // If plants are provided, plant-categories must also be provided
  if (options.plants && !options['plant-categories']) {
    console.error('❌ Error: --plant-categories is required when processing plants');
    showUsage();
    process.exit(1);
  }

  // Check if provided files exist
  if (options['bird-orders'] && !fs.existsSync(options['bird-orders'])) {
    console.error(`❌ Error: Bird orders file not found: ${options['bird-orders']}`);
    process.exit(1);
  }

  if (options.birds && !fs.existsSync(options.birds)) {
    console.error(`❌ Error: Birds file not found: ${options.birds}`);
    process.exit(1);
  }

  if (options['plant-categories'] && !fs.existsSync(options['plant-categories'])) {
    console.error(`❌ Error: Plant categories file not found: ${options['plant-categories']}`);
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
    if (options['bird-orders']) console.log(`📁 Bird orders file: ${options['bird-orders']}`);
    if (options.birds) console.log(`📁 Birds file: ${options.birds}`);
    if (options['plant-categories'])
      console.log(`📁 Plant categories file: ${options['plant-categories']}`);
    if (options.plants) console.log(`📁 Plants file: ${options.plants}`);
    console.log(`📁 Output file: ${outputFile}`);

    const parser = new SpeciesDataParser();
    const parsedData = parser.processSpeciesFiles(
      options['bird-orders'],
      options.birds,
      options['plant-categories'],
      options.plants,
      outputFile
    );

    console.log('\n✅ Processing complete!');
    console.log(`📊 Summary:`);
    console.log(`   - Bird Orders: ${parsedData.birdOrders.length}`);
    console.log(`   - Birds: ${parsedData.birds.length}`);
    console.log(`   - Bird Images: ${parsedData.birdImages.length}`);
    console.log(`   - Bird Audios: ${parsedData.birdAudios.length}`);
    console.log(`   - Plant Categories: ${parsedData.plantCategories.length}`);
    console.log(`   - Plants: ${parsedData.plants.length}`);
    console.log(`   - Plant Images: ${parsedData.plantImages.length}`);
    console.log(`   - Text Audios: ${parsedData.textAudios.length}`);
    console.log(`📁 Output written to: ${outputFile}`);
  } catch (error) {
    console.error('❌ Error processing files:', error.message);
    process.exit(1);
  }
}

// Run the script
main();

export { parseArgs, showUsage, main };
