import fs from 'fs';

class SpeciesDataParser {
  constructor() {
    // Normalized name tracking
    this.birdCrowNames = new Map(); // Map crow words to their IDs
    this.plantCrowNames = new Map(); // Map crow words to their IDs
    this.crowNameCounter = 1;
    this.plantCrowNameCounter = 1;

    // Track missing data for summary reporting
    this.missingBirdAudio = new Set(); // Bird crow names missing audio recordings
    this.missingBirdTranslations = new Set(); // Bird crow names missing literal translations
    this.missingPlantAudio = new Set(); // Plant crow names missing audio recordings
    this.missingPlantTranslations = new Set(); // Plant crow names missing literal translations
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
    const birdEnglishNames = [];
    const birdCrowNames = [];
    const birdCrowNameMappings = [];
    const birdScientificSynonyms = [];
    const birdImages = [];
    const birdSongAudios = [];
    const birdTextAudios = [];

    // Process each data row
    for (let i = 1; i < rows.length; i++) {
      const rowData = this.createRowData(rows[i], headers);
      const birdData = this.processBirdRow(rowData, i);

      if (birdData) {
        const { bird, englishNames, crowNames, synonyms } = birdData;
        birds.push(bird);

        // Add English names
        englishNames.forEach((name) => {
          birdEnglishNames.push({
            bird_id: bird.id,
            english_name: name,
          });
        });

        // Add Crow names, mappings, and text audios
        crowNames.forEach((crowNameData) => {
          const { crowName, mapping, textAudios } = this.processCrowName(
            crowNameData,
            bird.id,
            'bird'
          );
          if (crowName) {
            birdCrowNames.push(crowName);
          }
          if (mapping) {
            birdCrowNameMappings.push(mapping);
          }
          if (textAudios) {
            birdTextAudios.push(...textAudios);
          }
        });

        // Add scientific synonyms
        synonyms.forEach((synonym) => {
          birdScientificSynonyms.push({
            bird_id: bird.id,
            synonym_name: synonym,
          });
        });

        // Process images if present (Photos column)
        if (rowData['Photos'] && rowData['Photos'].trim()) {
          const imageFiles = this.parseSemicolonSeparated(rowData['Photos']);
          imageFiles.forEach((imageFile, index) => {
            if (imageFile.trim() && imageFile.trim() !== 'NO RECORDING') {
              birdImages.push({
                file_name: imageFile.trim(),
                bird_id: bird.id,
                caption: null,
                sort_order: index + 1,
              });
            }
          });
        }
      }
    }

    return {
      birds,
      birdEnglishNames,
      birdCrowNames: Array.from(this.birdCrowNames.values()),
      birdCrowNameMappings,
      birdScientificSynonyms,
      birdImages,
      birdSongAudios,
      birdTextAudios,
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
    const plantEnglishNames = [];
    const plantCrowNames = [];
    const plantCrowNameMappings = [];
    const plantScientificSynonyms = [];
    const plantImages = [];
    const plantTextAudios = [];

    // Process each data row
    for (let i = 1; i < rows.length; i++) {
      const rowData = this.createRowData(rows[i], headers);
      const plantData = this.processPlantRow(rowData, i);

      if (plantData) {
        const { plant, englishNames, crowNames, synonyms } = plantData;
        plants.push(plant);

        // Add English names
        englishNames.forEach((name) => {
          plantEnglishNames.push({
            plant_id: plant.id,
            english_name: name,
          });
        });

        // Add Crow names, mappings, and text audios
        crowNames.forEach((crowNameData) => {
          const { crowName, mapping, textAudios } = this.processCrowName(
            crowNameData,
            plant.id,
            'plant'
          );
          if (crowName) {
            plantCrowNames.push(crowName);
          }
          if (mapping) {
            plantCrowNameMappings.push(mapping);
          }
          if (textAudios) {
            plantTextAudios.push(...textAudios);
          }
        });

        // Add scientific synonyms
        synonyms.forEach((synonym) => {
          plantScientificSynonyms.push({
            plant_id: plant.id,
            synonym_name: synonym,
          });
        });

        // Process images if present (Photos column)
        if (rowData['Photos'] && rowData['Photos'].trim()) {
          const imageFiles = this.parseSemicolonSeparated(rowData['Photos']);
          imageFiles.forEach((imageFile, index) => {
            if (imageFile.trim() && imageFile.trim() !== 'NO RECORDING') {
              plantImages.push({
                file_name: imageFile.trim(),
                plant_id: plant.id,
                caption: null,
                sort_order: index + 1,
              });
            }
          });
        }
      }
    }

    return {
      plants,
      plantEnglishNames,
      plantCrowNames: Array.from(this.plantCrowNames.values()),
      plantCrowNameMappings,
      plantScientificSynonyms,
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
    const requiredFields = ['Latin Name', 'English', 'Crow', 'Category'];
    const missingFields = requiredFields.filter(
      (field) => !rowData[field] || rowData[field].trim() === ''
    );

    if (missingFields.length > 0) {
      console.error(`❌ Row ${rowIndex}: Missing required fields: ${missingFields.join(', ')}`);
      console.error(`   Data: ${JSON.stringify(rowData)}`);
      throw new Error(`Row ${rowIndex}: Missing required fields: ${missingFields.join(', ')}`);
    }

    // Parse semicolon-separated English names
    const englishNames = this.parseSemicolonSeparated(rowData['English'] || '');

    // Parse Crow names with their meanings and audio files
    const crowNames = this.parseCrowNames(
      rowData['Crow'],
      null, // No alternate names column in new format
      rowData['Literal Translation'],
      rowData['Audios'],
      'bird'
    );

    // Parse scientific synonyms (semicolon-separated)
    const synonyms = [];
    const latinName = rowData['Latin Name'];
    if (latinName && latinName.includes(';')) {
      const scientificNames = this.parseSemicolonSeparated(latinName);
      // First name is primary, rest are synonyms
      synonyms.push(...scientificNames.slice(1));
      rowData['Latin Name'] = scientificNames[0];
    }

    const bird = {
      id: rowIndex,
      latin_name: rowData['Latin Name'],
      category: rowData['Category'] || null,
      description_en: rowData['Description'] || null,
      habitat_en: rowData['Habitat'] || null,
      food_habits_en: rowData['Food Habits'] || null,
      map_image: rowData['Map'] || null,
    };

    return {
      bird,
      englishNames,
      crowNames,
      synonyms,
    };
  }

  /**
   * Process a single plant row
   */
  processPlantRow(rowData, rowIndex) {
    // Validate required fields for plants
    const requiredFields = ['Latin Name', 'English', 'Crow', 'Category'];
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

    // Parse semicolon-separated English names
    const englishNames = this.parseSemicolonSeparated(rowData['English'] || '');

    // Parse Crow names with their meanings and audio files
    const crowNames = this.parseCrowNames(
      rowData['Crow'],
      null, // No alternate names column in new format
      rowData['Literal Translation'],
      rowData['Audios'],
      'plant'
    );

    // Parse scientific synonyms (semicolon-separated)
    const synonyms = [];
    const latinName = rowData['Latin Name'];
    if (latinName && latinName.includes(';')) {
      const scientificNames = this.parseSemicolonSeparated(latinName);
      // First name is primary, rest are synonyms
      synonyms.push(...scientificNames.slice(1));
      rowData['Latin Name'] = scientificNames[0];
    }

    const plant = {
      id: rowIndex,
      latin_name: rowData['Latin Name'],
      category: rowData['Category'] || null,
      description_en: rowData['Description'] || null,
      habitat_en: rowData['Habitat'] || null,
      uses_en: rowData['Uses'] || null,
      map_image: rowData['Map'] || null,
    };

    return {
      plant,
      englishNames,
      crowNames,
      synonyms,
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
    return `-- Create tables for species data (birds and plants) - Simplified Design

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
);`;
  }

  /**
   * Generate SQL statements
   */
  generateSql(data) {
    const sqlStatements = [];

    // Add CREATE TABLE statements first
    sqlStatements.push(this.generateCreateTableSql());

    // Insert birds
    if (data.birds && data.birds.length > 0) {
      const birdValues = data.birds
        .map(
          (bird) =>
            `(${bird.id}, '${this.escapeSql(bird.latin_name)}', ${bird.category ? `'${this.escapeSql(bird.category)}'` : 'NULL'}, ${bird.description_en ? `'${this.escapeSql(bird.description_en)}'` : 'NULL'}, ${bird.habitat_en ? `'${this.escapeSql(bird.habitat_en)}'` : 'NULL'}, ${bird.food_habits_en ? `'${this.escapeSql(bird.food_habits_en)}'` : 'NULL'}, ${bird.map_image ? `'${this.escapeSql(bird.map_image)}'` : 'NULL'})`
        )
        .join(',\n  ');

      sqlStatements.push(
        `INSERT INTO birds (id, latin_name, category, description_en, habitat_en, food_habits_en, map_image) VALUES\n  ${birdValues};`
      );
    }

    // Insert bird English names
    if (data.birdEnglishNames && data.birdEnglishNames.length > 0) {
      const englishNameValues = data.birdEnglishNames
        .map(
          (name, index) => `(${index + 1}, ${name.bird_id}, '${this.escapeSql(name.english_name)}')`
        )
        .join(',\n  ');

      sqlStatements.push(
        `INSERT INTO bird_english_names (id, bird_id, english_name) VALUES\n  ${englishNameValues};`
      );
    }

    // Insert bird Crow names
    if (data.birdCrowNames && data.birdCrowNames.length > 0) {
      const crowNameValues = data.birdCrowNames
        .map(
          (name) =>
            `(${name.id}, '${this.escapeSql(name.crow_word)}', ${name.literal_meaning ? `'${this.escapeSql(name.literal_meaning)}'` : 'NULL'})`
        )
        .join(',\n  ');

      sqlStatements.push(
        `INSERT INTO bird_crow_names (id, crow_word, literal_meaning) VALUES\n  ${crowNameValues};`
      );
    }

    // Insert bird Crow name mappings
    if (data.birdCrowNameMappings && data.birdCrowNameMappings.length > 0) {
      const mappingValues = data.birdCrowNameMappings
        .map((mapping, index) => `(${index + 1}, ${mapping.crow_name_id}, ${mapping.bird_id})`)
        .join(',\n  ');

      sqlStatements.push(
        `INSERT INTO bird_crow_name_mappings (id, crow_name_id, bird_id) VALUES\n  ${mappingValues};`
      );
    }

    // Insert bird scientific synonyms
    if (data.birdScientificSynonyms && data.birdScientificSynonyms.length > 0) {
      const synonymValues = data.birdScientificSynonyms
        .map(
          (synonym, index) =>
            `(${index + 1}, ${synonym.bird_id}, '${this.escapeSql(synonym.synonym_name)}')`
        )
        .join(',\n  ');

      sqlStatements.push(
        `INSERT INTO bird_scientific_synonyms (id, bird_id, synonym_name) VALUES\n  ${synonymValues};`
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

    // Insert bird song audios
    if (data.birdSongAudios && data.birdSongAudios.length > 0) {
      const audioValues = data.birdSongAudios
        .map(
          (audio, index) =>
            `(${index + 1}, '${this.escapeSql(audio.file_name)}', ${audio.bird_id}, ${audio.caption ? `'${this.escapeSql(audio.caption)}'` : 'NULL'}, ${audio.sort_order})`
        )
        .join(',\n  ');

      sqlStatements.push(
        `INSERT INTO bird_song_audios (id, file_name, bird_id, caption, sort_order) VALUES\n  ${audioValues};`
      );
    }

    // Insert bird text audios
    if (data.birdTextAudios && data.birdTextAudios.length > 0) {
      const textAudioValues = data.birdTextAudios
        .map(
          (textAudio, index) =>
            `(${index + 1}, ${textAudio.crow_name_id}, '${this.escapeSql(textAudio.file_name)}', ${textAudio.sort_order})`
        )
        .join(',\n  ');
      sqlStatements.push(
        `INSERT INTO bird_text_audios (id, crow_name_id, file_name, sort_order) VALUES\n  ${textAudioValues};`
      );
    }

    // Insert plants
    if (data.plants && data.plants.length > 0) {
      const plantValues = data.plants
        .map(
          (plant) =>
            `(${plant.id}, '${this.escapeSql(plant.latin_name)}', ${plant.category ? `'${this.escapeSql(plant.category)}'` : 'NULL'}, ${plant.description_en ? `'${this.escapeSql(plant.description_en)}'` : 'NULL'}, ${plant.habitat_en ? `'${this.escapeSql(plant.habitat_en)}'` : 'NULL'}, ${plant.uses_en ? `'${this.escapeSql(plant.uses_en)}'` : 'NULL'}, ${plant.map_image ? `'${this.escapeSql(plant.map_image)}'` : 'NULL'})`
        )
        .join(',\n  ');

      sqlStatements.push(
        `INSERT INTO plants (id, latin_name, category, description_en, habitat_en, uses_en, map_image) VALUES\n  ${plantValues};`
      );
    }

    // Insert plant English names
    if (data.plantEnglishNames && data.plantEnglishNames.length > 0) {
      const englishNameValues = data.plantEnglishNames
        .map(
          (name, index) =>
            `(${index + 1}, ${name.plant_id}, '${this.escapeSql(name.english_name)}')`
        )
        .join(',\n  ');

      sqlStatements.push(
        `INSERT INTO plant_english_names (id, plant_id, english_name) VALUES\n  ${englishNameValues};`
      );
    }

    // Insert plant Crow names
    if (data.plantCrowNames && data.plantCrowNames.length > 0) {
      const crowNameValues = data.plantCrowNames
        .map(
          (name) =>
            `(${name.id}, '${this.escapeSql(name.crow_word)}', ${name.literal_meaning ? `'${this.escapeSql(name.literal_meaning)}'` : 'NULL'})`
        )
        .join(',\n  ');

      sqlStatements.push(
        `INSERT INTO plant_crow_names (id, crow_word, literal_meaning) VALUES\n  ${crowNameValues};`
      );
    }

    // Insert plant Crow name mappings
    if (data.plantCrowNameMappings && data.plantCrowNameMappings.length > 0) {
      const mappingValues = data.plantCrowNameMappings
        .map((mapping, index) => `(${index + 1}, ${mapping.crow_name_id}, ${mapping.plant_id})`)
        .join(',\n  ');

      sqlStatements.push(
        `INSERT INTO plant_crow_name_mappings (id, crow_name_id, plant_id) VALUES\n  ${mappingValues};`
      );
    }

    // Insert plant scientific synonyms
    if (data.plantScientificSynonyms && data.plantScientificSynonyms.length > 0) {
      const synonymValues = data.plantScientificSynonyms
        .map(
          (synonym, index) =>
            `(${index + 1}, ${synonym.plant_id}, '${this.escapeSql(synonym.synonym_name)}')`
        )
        .join(',\n  ');

      sqlStatements.push(
        `INSERT INTO plant_scientific_synonyms (id, plant_id, synonym_name) VALUES\n  ${synonymValues};`
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

    // Insert plant text audios
    if (data.plantTextAudios && data.plantTextAudios.length > 0) {
      const textAudioValues = data.plantTextAudios
        .map(
          (textAudio, index) =>
            `(${index + 1}, ${textAudio.crow_name_id}, '${this.escapeSql(textAudio.file_name)}', ${textAudio.sort_order})`
        )
        .join(',\n  ');
      sqlStatements.push(
        `INSERT INTO plant_text_audios (id, crow_name_id, file_name, sort_order) VALUES\n  ${textAudioValues};`
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
   * Parse semicolon-separated values
   */
  parseSemicolonSeparated(str) {
    if (!str || str.trim() === '') return [];
    return str
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  /**
   * Parse Crow names with their meanings and audio files
   */
  parseCrowNames(
    crowColumn,
    alternativeNamesLocal,
    literalTranslationColumn,
    audiosColumn,
    speciesType = 'bird'
  ) {
    const crowNames = [];

    // Parse primary crow names
    const allCrowNames = this.parseSemicolonSeparated(crowColumn || '');
    if (alternativeNamesLocal) {
      allCrowNames.push(...this.parseSemicolonSeparated(alternativeNamesLocal));
    }

    // Parse meanings (semicolon-separated, ordered) - handle NO TRANSLATION
    const rawMeanings = this.parseSemicolonSeparated(literalTranslationColumn || '');
    const meanings = rawMeanings.map((meaning) => {
      const trimmed = meaning.trim();
      return trimmed === 'NO TRANSLATION' ? null : trimmed;
    });

    // Parse audio files - semicolon-separated format with comma-separated multiple files
    let audioFiles = [];
    if (audiosColumn) {
      const rawAudios = this.parseSemicolonSeparated(audiosColumn);
      audioFiles = rawAudios.map((audio) => {
        const trimmed = audio.trim();
        if (trimmed === 'NO RECORDING') {
          return null;
        }
        // Handle comma-separated multiple audio files for same crow name
        // For now, take the first audio file (can be enhanced later for multiple)
        const audioList = trimmed
          .split(',')
          .map((a) => a.trim())
          .filter((a) => a.length > 0);
        return audioList.length > 0 ? audioList[0] : null;
      });
    }

    // Create crow name entries and track missing data
    allCrowNames.forEach((crowWord, index) => {
      if (crowWord.trim()) {
        const trimmedCrowWord = crowWord.trim();
        const meaning = meanings[index] || null;
        const audioFile = audioFiles[index] || null;

        // Track missing translations by species type
        if (!meaning || rawMeanings[index]?.trim() === 'NO TRANSLATION') {
          if (speciesType === 'bird') {
            this.missingBirdTranslations.add(trimmedCrowWord);
          } else {
            this.missingPlantTranslations.add(trimmedCrowWord);
          }
        }

        // Track missing audio recordings by species type
        if (!audioFile) {
          // Check if it was explicitly marked as NO RECORDING
          const rawAudio = audiosColumn ? this.parseSemicolonSeparated(audiosColumn)[index] : null;
          if (rawAudio?.trim() === 'NO RECORDING' || !rawAudio) {
            if (speciesType === 'bird') {
              this.missingBirdAudio.add(trimmedCrowWord);
            } else {
              this.missingPlantAudio.add(trimmedCrowWord);
            }
          }
        }

        crowNames.push({
          crow_word: trimmedCrowWord,
          literal_meaning: meaning,
          audio_files: audioFiles[index]
            ? audioFiles[index]
                .split(',')
                .map((a) => a.trim())
                .filter((a) => a.length > 0)
            : [],
        });
      }
    });

    return crowNames;
  }

  /**
   * Process a crow name and return the crow name record, mapping, and text audios
   */
  processCrowName(crowNameData, speciesId, speciesType) {
    const { crow_word, literal_meaning, audio_files } = crowNameData;

    // Use appropriate map based on species type
    const crowNameMap = speciesType === 'bird' ? this.birdCrowNames : this.plantCrowNames;
    const counter = speciesType === 'bird' ? 'crowNameCounter' : 'plantCrowNameCounter';

    // Check if this crow word already exists (without audio files in comparison)
    let crowNameId = null;
    for (const [id, existing] of crowNameMap) {
      if (existing.crow_word === crow_word && existing.literal_meaning === literal_meaning) {
        crowNameId = id;
        break;
      }
    }

    let crowName = null;
    if (!crowNameId) {
      // Create new crow name entry
      crowNameId = this[counter]++;
      crowName = {
        id: crowNameId,
        crow_word,
        literal_meaning,
      };
      crowNameMap.set(crowNameId, crowName);
    }

    // Create mapping
    const mapping = {
      crow_name_id: crowNameId,
      [`${speciesType}_id`]: speciesId,
    };

    // Create text audio entries
    const textAudios = audio_files.map((audioFile, index) => ({
      crow_name_id: crowNameId,
      file_name: audioFile,
      sort_order: index + 1,
    }));

    return { crowName, mapping, textAudios };
  }

  /**
   * Report missing audio recordings and translations
   */
  reportMissingData() {
    // Report missing bird audio
    if (this.missingBirdAudio.size > 0) {
      console.log(`\n🔇 Bird crow names missing audio recordings (${this.missingBirdAudio.size}):`);
      const sortedMissingAudio = Array.from(this.missingBirdAudio).sort();
      sortedMissingAudio.forEach((name) => {
        console.log(`   - ${name}`);
      });
    }

    // Report missing bird translations
    if (this.missingBirdTranslations.size > 0) {
      console.log(
        `\n📝 Bird crow names missing literal translations (${this.missingBirdTranslations.size}):`
      );
      const sortedMissingTranslations = Array.from(this.missingBirdTranslations).sort();
      sortedMissingTranslations.forEach((name) => {
        console.log(`   - ${name}`);
      });
    }

    // Report missing plant audio
    if (this.missingPlantAudio.size > 0) {
      console.log(
        `\n🔇 Plant crow names missing audio recordings (${this.missingPlantAudio.size}):`
      );
      const sortedMissingAudio = Array.from(this.missingPlantAudio).sort();
      sortedMissingAudio.forEach((name) => {
        console.log(`   - ${name}`);
      });
    }

    // Report missing plant translations
    if (this.missingPlantTranslations.size > 0) {
      console.log(
        `\n📝 Plant crow names missing literal translations (${this.missingPlantTranslations.size}):`
      );
      const sortedMissingTranslations = Array.from(this.missingPlantTranslations).sort();
      sortedMissingTranslations.forEach((name) => {
        console.log(`   - ${name}`);
      });
    }

    // Report success if no missing data
    const totalMissing =
      this.missingBirdAudio.size +
      this.missingBirdTranslations.size +
      this.missingPlantAudio.size +
      this.missingPlantTranslations.size;
    if (totalMissing === 0) {
      console.log(`\n✅ All Crow names have audio recordings and literal translations!`);
    }
  }

  /**
   * Escape SQL strings
   */
  escapeSql(str) {
    if (!str) return '';
    return str.replace(/'/g, "''");
  }

  /**
   * Process birds, plants, and their respective category/order files
   */
  processSpeciesFiles(birdsFile, plantsFile, outputFile) {
    try {
      let combinedData = {
        birds: [],
        birdEnglishNames: [],
        birdCrowNames: [],
        birdCrowNameMappings: [],
        birdScientificSynonyms: [],
        birdImages: [],
        birdSongAudios: [],
        birdTextAudios: [],
        plants: [],
        plantEnglishNames: [],
        plantCrowNames: [],
        plantCrowNameMappings: [],
        plantScientificSynonyms: [],
        plantImages: [],
        plantTextAudios: [],
      };

      // Process birds if provided
      if (birdsFile) {
        const birdsCsvContent = fs.readFileSync(birdsFile, 'utf8');
        const birdData = this.parseCsv(birdsCsvContent);

        combinedData.birds = birdData.birds;
        combinedData.birdEnglishNames = birdData.birdEnglishNames;
        combinedData.birdCrowNames = birdData.birdCrowNames;
        combinedData.birdCrowNameMappings = birdData.birdCrowNameMappings;
        combinedData.birdScientificSynonyms = birdData.birdScientificSynonyms;
        combinedData.birdImages = birdData.birdImages;
        combinedData.birdSongAudios = birdData.birdSongAudios;
        combinedData.birdTextAudios = birdData.birdTextAudios;
      }

      // Process plants if provided
      if (plantsFile) {
        const plantsCsvContent = fs.readFileSync(plantsFile, 'utf8');
        const plantData = this.parsePlantsCsv(plantsCsvContent);

        combinedData.plants = plantData.plants;
        combinedData.plantEnglishNames = plantData.plantEnglishNames;
        combinedData.plantCrowNames = plantData.plantCrowNames;
        combinedData.plantCrowNameMappings = plantData.plantCrowNameMappings;
        combinedData.plantScientificSynonyms = plantData.plantScientificSynonyms;
        combinedData.plantImages = plantData.plantImages;
        combinedData.plantTextAudios = plantData.plantTextAudios;
      }

      const sql = this.generateSql(combinedData);
      fs.writeFileSync(outputFile, sql, 'utf8');

      return combinedData;
    } catch (error) {
      console.error('Error processing species files:', error);
      throw error;
    }
  }
}

// Example usage with simplified CSV format
if (import.meta.url === `file://${process.argv[1]}`) {
  const parser = new SpeciesDataParser();

  // Example birds CSV content with category directly included
  const birdsCSV = `Category,Crow,Literal Translation,English,Latin Name,Description,Habitat,Food Habits,Audios,Map,Photos
Passeriformes,áalihte,"black bird","American Crow","Corvus brachyrhynchos","A large black bird","Urban areas","Omnivorous","aalihte1.mp3,aalihte2.mp3","crow_map.jpg","crow1.jpg;crow2.jpg"
Ciconiiformes,akbaakáatdutche,"one who catches children","White Stork","Ciconia ciconia","Large white bird","Wetlands","Fish","stork1.mp3","stork_map.jpg","NO RECORDING"`;

  // Process birds directly (no separate orders file needed)
  const parsedData = parser.parseCsv(birdsCSV);
  const sql = parser.generateSql(parsedData);

  console.log('Generated SQL:');
  console.log(sql);
  console.log(
    `\nSummary: ${parsedData.birds.length} birds, ${parsedData.birdImages.length} images, ${parsedData.birdSongAudios.length} song audio files, ${parsedData.birdTextAudios.length} text audio files`
  );
}

export default SpeciesDataParser;
