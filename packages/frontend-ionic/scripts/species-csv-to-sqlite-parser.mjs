import fs from 'fs';

class SpeciesDataParser {
  constructor() {
    this.birdOrders = new Map(); // Map to track unique orders
    this.orderCounter = 1;
    this.orderNameToId = new Map(); // Map order names to their IDs
    this.plantCategories = new Map(); // Map to track unique plant categories
    this.categoryCounter = 1;
    this.categoryNameToId = new Map(); // Map category names to their IDs
  }

  /**
   * Parse bird orders CSV first to establish the order IDs
   * @param {string} ordersCsvContent - Raw CSV content for bird orders
   */
  parseOrdersCsv(ordersCsvContent) {
    const rows = this.parseCsvRows(ordersCsvContent);
    const headers = rows[0];

    for (let i = 1; i < rows.length; i++) {
      const rowData = this.createRowData(rows[i], headers);

      const order = {
        id: this.orderCounter++,
        name_scientific: rowData.name_scientific || '',
        description_en: rowData.description_en || `Order: ${rowData.name_scientific}`,
        description_local: rowData.description_local || null,
      };

      this.birdOrders.set(order.id, order);
      this.orderNameToId.set(order.name_scientific, order.id);
    }
  }

  /**
   * Parse plant categories CSV to establish the category IDs
   * @param {string} categoriesCsvContent - Raw CSV content for plant categories
   */
  parsePlantCategoriesCsv(categoriesCsvContent) {
    const rows = this.parseCsvRows(categoriesCsvContent);
    const headers = rows[0];

    for (let i = 1; i < rows.length; i++) {
      const rowData = this.createRowData(rows[i], headers);

      const category = {
        id: this.categoryCounter++,
        name: rowData.name || rowData.category || '',
        description_en:
          rowData.description_en || `Plant category: ${rowData.name || rowData.category}`,
        description_local: rowData.description_local || null,
      };

      this.plantCategories.set(category.id, category);
      this.categoryNameToId.set(category.name, category.id);
    }
  }

  /**
   * Parse plant categories from plant CSV to establish unique categories (fallback method)
   * @param {string} plantsCsvContent - Raw CSV content for plants
   */
  parsePlantCategories(plantsCsvContent) {
    const rows = this.parseCsvRows(plantsCsvContent);
    const headers = rows[0];
    const categories = new Set();

    // Collect all unique categories
    for (let i = 1; i < rows.length; i++) {
      const rowData = this.createRowData(rows[i], headers);
      if (rowData.category && rowData.category.trim()) {
        categories.add(rowData.category.trim());
      }
    }

    // Create category entries
    categories.forEach((categoryName) => {
      const category = {
        id: this.categoryCounter++,
        name: categoryName,
        description_en: `Plant category: ${categoryName}`,
        description_local: null,
      };

      this.plantCategories.set(category.id, category);
      this.categoryNameToId.set(categoryName, category.id);
    });
  }

  /**
   * Parse CSV content and convert to SQLite format
   * @param {string} csvContent - Raw CSV content
   * @returns {Object} Object containing SQL statements and data
   */
  parseCsv(csvContent) {
    const rows = this.parseCsvRows(csvContent);
    const headers = rows[0];
    const birds = [];
    const birdImages = [];
    const birdAudios = [];
    const textAudios = [];

    // Process each data row
    for (let i = 1; i < rows.length; i++) {
      const rowData = this.createRowData(rows[i], headers);
      const bird = this.processBirdRow(rowData, i);

      if (bird) {
        birds.push(bird);

        // Process images if present
        if (rowData.images_json && rowData.images_json.trim()) {
          const images = this.parseJsonArray(rowData.images_json);
          images.forEach((image, index) => {
            birdImages.push({
              file_name: image.file,
              bird_id: i, // Using row index as temporary ID
              caption: image.caption || null,
              sort_order: index + 1,
            });
          });
        }

        // Process audio files if present
        if (rowData.song_audios && rowData.song_audios.trim()) {
          const audios = this.parseJsonArray(rowData.song_audios);
          audios.forEach((audio, index) => {
            birdAudios.push({
              file_name: audio.file,
              bird_id: i, // Using row index as temporary ID
              caption: audio.caption || null,
              sort_order: index + 1,
            });
          });
        }

        // Process crow name audios for text_audios table
        if (rowData.crow_name_audios_json && rowData.crow_name_audios_json.trim()) {
          const audios = this.parseJsonArray(rowData.crow_name_audios_json);
          audios.forEach((audio) => {
            if (audio.file && bird.name_local) {
              textAudios.push({
                text: bird.name_local,
                file_name: audio.file,
                url_prefix: null,
                ipa: null,
              });
            }
          });
        }
      }
    }

    return {
      birdOrders: Array.from(this.birdOrders.values()),
      birds,
      birdImages,
      birdAudios,
      textAudios,
    };
  }

  /**
   * Parse plants CSV content and convert to SQLite format
   * @param {string} csvContent - Raw CSV content for plants
   * @returns {Object} Object containing SQL statements and data
   */
  parsePlantsCsv(csvContent) {
    const rows = this.parseCsvRows(csvContent);
    const headers = rows[0];
    const plants = [];
    const plantImages = [];
    const plantTextAudios = [];

    // Process each data row
    for (let i = 1; i < rows.length; i++) {
      const rowData = this.createRowData(rows[i], headers);
      const plant = this.processPlantRow(rowData, i);

      if (plant) {
        plants.push(plant);

        // Process images if present
        if (rowData.images_json && rowData.images_json.trim()) {
          const images = this.parseJsonArray(rowData.images_json);
          images.forEach((image, index) => {
            plantImages.push({
              file_name: image.file,
              plant_id: i, // Using row index as temporary ID
              caption: image.caption || null,
              sort_order: index + 1,
            });
          });
        }

        // Process crow name audios for text_audios table
        if (rowData.crow_name_audios_json && rowData.crow_name_audios_json.trim()) {
          const audios = this.parseJsonArray(rowData.crow_name_audios_json);
          audios.forEach((audio) => {
            if (audio.file && plant.name_local) {
              plantTextAudios.push({
                text: plant.name_local,
                file_name: audio.file,
                url_prefix: null,
                ipa: null,
              });
            }
          });
        }
      }
    }

    return {
      plantCategories: Array.from(this.plantCategories.values()),
      plants,
      plantImages,
      plantTextAudios,
    };
  }

  /**
   * Parse CSV content into rows, handling multi-line fields
   * @param {string} csvContent - Raw CSV content
   * @returns {Array} Array of rows, each row is an array of values
   */
  parseCsvRows(csvContent) {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;
    let i = 0;

    while (i < csvContent.length) {
      const char = csvContent[i];
      const nextChar = csvContent[i + 1];

      if (char === '"') {
        if (nextChar === '"') {
          // Handle escaped quote
          currentField += '"';
          i += 2; // Skip both quotes
        } else {
          // Handle quote delimiter
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        currentRow.push(currentField.trim());
        currentField = '';
        i++;
      } else if (char === '\n' && !inQuotes) {
        // End of row
        currentRow.push(currentField.trim());
        if (currentRow.some((field) => field.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
        i++;
      } else if (char === '\r') {
        // Skip carriage return
        i++;
      } else {
        currentField += char;
        i++;
      }
    }

    // Handle last field and row
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) {
      rows.push(currentRow);
    }

    return rows;
  }

  /**
   * Create row data object from array of values and headers
   * @param {Array} values - Array of field values
   * @param {Array} headers - Array of header names
   * @returns {Object} Object with header names as keys
   */
  createRowData(values, headers) {
    const rowData = {};
    headers.forEach((header, index) => {
      rowData[header] = values[index] || '';
    });
    return rowData;
  }

  /**
   * Parse CSV headers - prioritize comma delimiter for downloaded CSV files
   */
  parseHeaders(headerLine) {
    if (headerLine.includes(',')) {
      return headerLine.split(',').map((h) => h.trim());
    } else if (headerLine.includes('\t')) {
      return headerLine.split('\t').map((h) => h.trim());
    } else {
      return [headerLine.trim()];
    }
  }

  /**
   * Parse a single CSV row
   */
  parseCsvRow(line, headers) {
    const values = this.splitCsvLine(line);
    const rowData = {};

    headers.forEach((header, index) => {
      rowData[header] = values[index] || '';
    });

    return rowData;
  }

  /**
   * Split CSV line handling quoted values - prioritize comma delimiter
   */
  splitCsvLine(line) {
    if (line.includes(',')) {
      return this.splitByDelimiter(line, ',');
    } else if (line.includes('\t')) {
      return this.splitByDelimiter(line, '\t');
    } else {
      return [line.trim()];
    }
  }

  splitByDelimiter(line, delimiter) {
    const values = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (nextChar === '"') {
          // Handle escaped quote
          current += '"';
          i += 2; // Skip both quotes
        } else {
          // Handle quote delimiter
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === delimiter && !inQuotes) {
        values.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    values.push(current.trim());
    return values;
  }

  /**
   * Process a single bird row
   */
  processBirdRow(rowData, rowIndex) {
    // Validate required fields
    const requiredFields = ['name_scientific', 'name_en', 'name_local', 'size', 'order'];
    const missingFields = requiredFields.filter(
      (field) => !rowData[field] || rowData[field].trim() === ''
    );

    if (missingFields.length > 0) {
      console.error(`❌ Row ${rowIndex}: Missing required fields: ${missingFields.join(', ')}`);
      console.error(`   Data: ${JSON.stringify(rowData)}`);
      throw new Error(`Row ${rowIndex}: Missing required fields: ${missingFields.join(', ')}`);
    }

    // Look up the order ID using the order name from CSV
    const orderName = rowData.order;
    const orderId = this.orderNameToId.get(orderName);

    if (!orderId) {
      console.error(
        `❌ Row ${rowIndex}: Order not found: ${orderName}. Available orders: ${Array.from(this.orderNameToId.keys()).join(', ')}`
      );
      throw new Error(`Row ${rowIndex}: Order not found: ${orderName}`);
    }

    return {
      id: rowIndex,
      name_local: rowData.name_local,
      name_en: rowData.name_en,
      alternate_names_local: rowData.alternate_names_local || null,
      alternate_names_en: rowData.alternate_names_en || null,
      name_scientific: rowData.name_scientific,
      name_meaning_en: rowData.name_meaning_en || null,
      description_local: rowData.description_local || null,
      description_en: rowData.description_en || null,
      size: rowData.size,
      order_id: orderId,
    };
  }

  /**
   * Process a single plant row
   */
  processPlantRow(rowData, rowIndex) {
    // Validate required fields for plants
    const requiredFields = ['name_scientific', 'name_en', 'name_local', 'category'];
    const missingFields = requiredFields.filter(
      (field) => !rowData[field] || rowData[field].trim() === ''
    );

    if (missingFields.length > 0) {
      console.error(
        `❌ Plant Row ${rowIndex}: Missing required fields: ${missingFields.join(', ')}`
      );
      console.error(`   Data: ${JSON.stringify(rowData)}`);
      throw new Error(
        `Plant Row ${rowIndex}: Missing required fields: ${missingFields.join(', ')}`
      );
    }

    // Look up the category ID using the category name from CSV
    const categoryName = rowData.category;
    const categoryId = this.categoryNameToId.get(categoryName);

    if (!categoryId) {
      console.error(
        `❌ Plant Row ${rowIndex}: Category not found: ${categoryName}. Available categories: ${Array.from(this.categoryNameToId.keys()).join(', ')}`
      );
      throw new Error(`Plant Row ${rowIndex}: Category not found: ${categoryName}`);
    }

    // Parse "Have Recording?" field
    const hasRecording = rowData['Have Recording?']
      ? ['yes', 'true', '1', 'y'].includes(rowData['Have Recording?'].toLowerCase().trim())
      : false;

    return {
      id: rowIndex,
      name_local: rowData.name_local,
      name_en: rowData.name_en,
      alternative_names_local: rowData.alternative_names_local || null,
      name_scientific: rowData.name_scientific,
      name_meaning_en: rowData.name_meaning_en || null,
      category_id: categoryId,
      has_recording: hasRecording,
    };
  }

  /**
   * Parse JSON array from string with better error handling for CSV format
   */
  parseJsonArray(jsonString) {
    if (!jsonString || jsonString.trim() === '') {
      return [];
    }

    try {
      // Handle escaped quotes in CSV format ("" -> ")
      let cleanedJson = jsonString;
      if (jsonString.includes('""')) {
        cleanedJson = jsonString.replace(/""/g, '"');
      }

      const parsed = JSON.parse(cleanedJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn(`Failed to parse JSON: "${jsonString}"`);
      console.warn('Error:', error.message);
      return [];
    }
  }

  /**
   * Generate CREATE TABLE statements
   */
  generateCreateTableSql() {
    return `-- Create tables for species data (birds and plants)
CREATE TABLE IF NOT EXISTS bird_orders (
    id INTEGER PRIMARY KEY,
    name_scientific TEXT NOT NULL,
    description_en TEXT,
    description_local TEXT
);

CREATE TABLE IF NOT EXISTS birds (
    id INTEGER PRIMARY KEY,
    name_local TEXT,
    name_en TEXT,
    alternate_names_local TEXT,
    alternate_names_en TEXT,
    name_scientific TEXT NOT NULL,
    name_meaning_en TEXT,
    description_local TEXT,
    description_en TEXT,
    size TEXT,
    order_id INTEGER,
    FOREIGN KEY (order_id) REFERENCES bird_orders(id)
);

CREATE TABLE IF NOT EXISTS bird_images (
    id INTEGER PRIMARY KEY,
    file_name TEXT NOT NULL,
    bird_id INTEGER NOT NULL,
    caption TEXT,
    sort_order INTEGER,
    FOREIGN KEY (bird_id) REFERENCES birds(id)
);

CREATE TABLE IF NOT EXISTS bird_audios (
    id INTEGER PRIMARY KEY,
    file_name TEXT NOT NULL,
    bird_id INTEGER NOT NULL,
    caption TEXT,
    sort_order INTEGER,
    FOREIGN KEY (bird_id) REFERENCES birds(id)
);

CREATE TABLE IF NOT EXISTS plant_categories (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description_en TEXT,
    description_local TEXT
);

CREATE TABLE IF NOT EXISTS plants (
    id INTEGER PRIMARY KEY,
    name_local TEXT,
    name_en TEXT,
    alternative_names_local TEXT,
    name_scientific TEXT NOT NULL,
    name_meaning_en TEXT,
    category_id INTEGER,
    has_recording BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (category_id) REFERENCES plant_categories(id)
);

CREATE TABLE IF NOT EXISTS plant_images (
    id INTEGER PRIMARY KEY,
    file_name TEXT NOT NULL,
    plant_id INTEGER NOT NULL,
    caption TEXT,
    sort_order INTEGER,
    FOREIGN KEY (plant_id) REFERENCES plants(id)
);

CREATE TABLE IF NOT EXISTS text_audios (
    id INTEGER PRIMARY KEY,
    text TEXT NOT NULL,
    file_name TEXT NOT NULL,
    url_prefix TEXT,
    ipa TEXT
);`;
  }

  /**
   * Generate SQL statements
   */
  generateSql(data) {
    const sqlStatements = [];

    // Add CREATE TABLE statements first
    sqlStatements.push(this.generateCreateTableSql());

    // Insert bird orders
    if (data.birdOrders.length > 0) {
      const orderValues = data.birdOrders
        .map(
          (order) =>
            `(${order.id}, '${this.escapeSql(order.name_scientific)}', '${this.escapeSql(order.description_en)}', ${order.description_local ? `'${this.escapeSql(order.description_local)}'` : 'NULL'})`
        )
        .join(',\n  ');

      sqlStatements.push(
        `INSERT INTO bird_orders (id, name_scientific, description_en, description_local) VALUES\n  ${orderValues};`
      );
    }

    // Insert birds
    if (data.birds.length > 0) {
      const birdValues = data.birds
        .map(
          (bird) =>
            `(${bird.id}, '${this.escapeSql(bird.name_local)}', '${this.escapeSql(bird.name_en)}', ${bird.alternate_names_local ? `'${this.escapeSql(bird.alternate_names_local)}'` : 'NULL'}, ${bird.alternate_names_en ? `'${this.escapeSql(bird.alternate_names_en)}'` : 'NULL'}, '${this.escapeSql(bird.name_scientific)}', ${bird.name_meaning_en ? `'${this.escapeSql(bird.name_meaning_en)}'` : 'NULL'}, ${bird.description_local ? `'${this.escapeSql(bird.description_local)}'` : 'NULL'}, ${bird.description_en ? `'${this.escapeSql(bird.description_en)}'` : 'NULL'}, '${this.escapeSql(bird.size)}', ${bird.order_id})`
        )
        .join(',\n  ');

      sqlStatements.push(
        `INSERT INTO birds (id, name_local, name_en, alternate_names_local, alternate_names_en, name_scientific, name_meaning_en, description_local, description_en, size, order_id) VALUES\n  ${birdValues};`
      );
    }

    // Insert bird images
    if (data.birdImages.length > 0) {
      const imageValues = data.birdImages
        .map(
          (image, index) =>
            `(${index + 1}, '${this.escapeSql(image.file_name)}', ${image.bird_id}, ${image.caption ? `'${this.escapeSql(image.caption)}'` : 'NULL'}, ${image.sort_order})`
        )
        .join(',\n  ');

      sqlStatements.push(
        `INSERT INTO bird_images (id, file_name, bird_id, caption, sort_order) VALUES\n  ${imageValues};`
      );
    }

    // Insert bird audios
    if (data.birdAudios && data.birdAudios.length > 0) {
      const audioValues = data.birdAudios
        .map(
          (audio, index) =>
            `(${index + 1}, '${this.escapeSql(audio.file_name)}', ${audio.bird_id}, ${audio.caption ? `'${this.escapeSql(audio.caption)}'` : 'NULL'}, ${audio.sort_order})`
        )
        .join(',\n  ');

      sqlStatements.push(
        `INSERT INTO bird_audios (id, file_name, bird_id, caption, sort_order) VALUES\n  ${audioValues};`
      );
    }

    // Insert plant categories
    if (data.plantCategories && data.plantCategories.length > 0) {
      const categoryValues = data.plantCategories
        .map(
          (category) =>
            `(${category.id}, '${this.escapeSql(category.name)}', '${this.escapeSql(category.description_en)}', ${category.description_local ? `'${this.escapeSql(category.description_local)}'` : 'NULL'})`
        )
        .join(',\n  ');

      sqlStatements.push(
        `INSERT INTO plant_categories (id, name, description_en, description_local) VALUES\n  ${categoryValues};`
      );
    }

    // Insert plants
    if (data.plants && data.plants.length > 0) {
      const plantValues = data.plants
        .map(
          (plant) =>
            `(${plant.id}, '${this.escapeSql(plant.name_local)}', '${this.escapeSql(plant.name_en)}', ${plant.alternative_names_local ? `'${this.escapeSql(plant.alternative_names_local)}'` : 'NULL'}, '${this.escapeSql(plant.name_scientific)}', ${plant.name_meaning_en ? `'${this.escapeSql(plant.name_meaning_en)}'` : 'NULL'}, ${plant.category_id}, ${plant.has_recording ? 1 : 0})`
        )
        .join(',\n  ');

      sqlStatements.push(
        `INSERT INTO plants (id, name_local, name_en, alternative_names_local, name_scientific, name_meaning_en, category_id, has_recording) VALUES\n  ${plantValues};`
      );
    }

    // Insert plant images
    if (data.plantImages && data.plantImages.length > 0) {
      const imageValues = data.plantImages
        .map(
          (image, index) =>
            `(${index + 1}, '${this.escapeSql(image.file_name)}', ${image.plant_id}, ${image.caption ? `'${this.escapeSql(image.caption)}'` : 'NULL'}, ${image.sort_order})`
        )
        .join(',\n  ');

      sqlStatements.push(
        `INSERT INTO plant_images (id, file_name, plant_id, caption, sort_order) VALUES\n  ${imageValues};`
      );
    }

    // Insert text audios
    if (data.textAudios && data.textAudios.length > 0) {
      const textAudioValues = data.textAudios
        .map(
          (textAudio, index) =>
            `(${index + 1}, '${this.escapeSql(textAudio.text)}', '${this.escapeSql(textAudio.file_name)}', ${textAudio.url_prefix ? `'${this.escapeSql(textAudio.url_prefix)}'` : 'NULL'}, ${textAudio.ipa ? `'${this.escapeSql(textAudio.ipa)}'` : 'NULL'})`
        )
        .join(',\n  ');

      sqlStatements.push(
        `INSERT INTO text_audios (id, text, file_name, url_prefix, ipa) VALUES\n  ${textAudioValues};`
      );
    }

    return sqlStatements.join('\n\n');
  }

  /**
   * Escape SQL strings
   */
  escapeSql(str) {
    if (!str) return '';
    return str.replace(/'/g, "''");
  }

  /**
   * Process both orders and birds CSV files
   */
  processFiles(ordersFile, birdsFile, outputFile) {
    try {
      // First process the orders CSV
      const ordersCsvContent = fs.readFileSync(ordersFile, 'utf8');
      this.parseOrdersCsv(ordersCsvContent);

      // Then process the birds CSV
      const birdsCsvContent = fs.readFileSync(birdsFile, 'utf8');
      const parsedData = this.parseCsv(birdsCsvContent);
      const sql = this.generateSql(parsedData);

      fs.writeFileSync(outputFile, sql, 'utf8');
      console.log(`Successfully processed ${ordersFile} and ${birdsFile} -> ${outputFile}`);
      console.log(
        `Generated ${parsedData.birdOrders.length} orders, ${parsedData.birds.length} birds, ${parsedData.birdImages.length} images, ${parsedData.birdAudios.length} audio files`
      );

      return parsedData;
    } catch (error) {
      console.error('Error processing files:', error);
      throw error;
    }
  }

  /**
   * Process birds, plants, and their respective category/order files
   */
  processSpeciesFiles(ordersFile, birdsFile, categoriesFile, plantsFile, outputFile) {
    try {
      let combinedData = {
        birdOrders: [],
        birds: [],
        birdImages: [],
        birdAudios: [],
        plantCategories: [],
        plants: [],
        plantImages: [],
        textAudios: [],
      };

      // Process birds if provided
      if (ordersFile && birdsFile) {
        const ordersCsvContent = fs.readFileSync(ordersFile, 'utf8');
        this.parseOrdersCsv(ordersCsvContent);

        const birdsCsvContent = fs.readFileSync(birdsFile, 'utf8');
        const birdData = this.parseCsv(birdsCsvContent);

        combinedData.birdOrders = birdData.birdOrders;
        combinedData.birds = birdData.birds;
        combinedData.birdImages = birdData.birdImages;
        combinedData.birdAudios = birdData.birdAudios;
        combinedData.textAudios = combinedData.textAudios.concat(birdData.textAudios || []);
      }

      // Process plants if provided
      if (categoriesFile && plantsFile) {
        // First parse the categories CSV
        const categoriesCsvContent = fs.readFileSync(categoriesFile, 'utf8');
        this.parsePlantCategoriesCsv(categoriesCsvContent);

        // Then parse the plants CSV
        const plantsCsvContent = fs.readFileSync(plantsFile, 'utf8');
        const plantData = this.parsePlantsCsv(plantsCsvContent);

        combinedData.plantCategories = plantData.plantCategories;
        combinedData.plants = plantData.plants;
        combinedData.plantImages = plantData.plantImages;
        combinedData.textAudios = combinedData.textAudios.concat(plantData.plantTextAudios || []);
      }

      const sql = this.generateSql(combinedData);
      fs.writeFileSync(outputFile, sql, 'utf8');

      console.log(`Successfully processed species data -> ${outputFile}`);
      console.log(`📊 Summary:`);
      console.log(`   - Bird Orders: ${combinedData.birdOrders.length}`);
      console.log(`   - Birds: ${combinedData.birds.length}`);
      console.log(`   - Bird Images: ${combinedData.birdImages.length}`);
      console.log(`   - Bird Audios: ${combinedData.birdAudios.length}`);
      console.log(`   - Plant Categories: ${combinedData.plantCategories.length}`);
      console.log(`   - Plants: ${combinedData.plants.length}`);
      console.log(`   - Plant Images: ${combinedData.plantImages.length}`);

      return combinedData;
    } catch (error) {
      console.error('Error processing species files:', error);
      throw error;
    }
  }
}

// Example usage with both orders and birds CSV
if (import.meta.url === `file://${process.argv[1]}`) {
  const parser = new SpeciesDataParser();

  // Example bird orders CSV content
  const ordersCSV = `name_scientific,description_en,description_local
Passeriformes,Order of perching birds,
Ciconiiformes,Order of storks and related birds,`;

  // Example birds CSV content
  const birdsCSV = `name_scientific,name_en,name_local,alternate_names_local,alternate_names_en,name_meaning_en,description_local,description_en,size,order,images_json,song_audios
Corvus brachyrhynchos,crow,áalihte,,,description of their call,,,Medium-Large,Passeriformes,"[{""file"": ""file.jpg"", ""caption"": ""male""}, {""file"": ""file2.jpg"", ""caption"": ""female""}]","[{""file"": ""file.mp3"", ""caption"": ""female""}]"
Ciconiidae sp.,stork,akbaakáatdutche,,,one who catches children,,,Very Large,Ciconiiformes,,`;

  // Process orders first
  parser.parseOrdersCsv(ordersCSV);

  // Then process birds
  const parsedData = parser.parseCsv(birdsCSV);
  const sql = parser.generateSql(parsedData);

  console.log('Generated SQL:');
  console.log(sql);
  console.log(
    `\nSummary: ${parsedData.birdOrders.length} orders, ${parsedData.birds.length} birds, ${parsedData.birdImages.length} images, ${parsedData.birdAudios.length} audio files`
  );
}

export default SpeciesDataParser;
