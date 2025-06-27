import BirdDataParser from './birds-csv-to-sqlite-parser.mjs';
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
Usage: node process-bird-data.mjs [options]

Options:
  --orders <file>     Bird orders CSV file (required)
  --birds <file>      Birds CSV file (required)
  --output <file>     Output SQL file (default: bird_data.sql)
  --help             Show this help message

Examples:
  node process-bird-data.mjs --orders bird_orders.csv --birds birds.csv
  node process-bird-data.mjs --orders orders.csv --birds birds.csv --output my_data.sql
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

  // Check required arguments
  if (!options.orders || !options.birds) {
    console.error('❌ Error: Both --orders and --birds arguments are required');
    showUsage();
    process.exit(1);
  }

  // Check if files exist
  if (!fs.existsSync(options.orders)) {
    console.error(`❌ Error: Orders file not found: ${options.orders}`);
    process.exit(1);
  }

  if (!fs.existsSync(options.birds)) {
    console.error(`❌ Error: Birds file not found: ${options.birds}`);
    process.exit(1);
  }

  // Set default output file if not provided
  const outputFile = options.output || 'bird_data.sql';

  try {
    console.log('🔄 Processing bird data...');
    console.log(`📁 Orders file: ${options.orders}`);
    console.log(`📁 Birds file: ${options.birds}`);
    console.log(`📁 Output file: ${outputFile}`);

    const parser = new BirdDataParser();
    const parsedData = parser.processFiles(options.orders, options.birds, outputFile);

    console.log('\n✅ Processing complete!');
    console.log(`📊 Summary:`);
    console.log(`   - Orders: ${parsedData.birdOrders.length}`);
    console.log(`   - Birds: ${parsedData.birds.length}`);
    console.log(`   - Images: ${parsedData.birdImages.length}`);
    console.log(`   - Audio files: ${parsedData.birdAudios.length}`);
    console.log(` Output written to: ${outputFile}`);
  } catch (error) {
    console.error('❌ Error processing files:', error.message);
    process.exit(1);
  }
}

// Run the script
main();

export { parseArgs, showUsage, main };
