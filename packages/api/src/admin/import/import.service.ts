import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import * as fs from 'fs';
import * as csv from 'csv-parser';

const nameEnField = 'English Name';
const nameLocalField = 'Crow Name';
const nameMeaningEnField = 'English Translation';
const nameLaField = 'Scientific Name';

interface RawBirdCsvRow {
  [nameEnField]: string;
  [nameLocalField]: string;
  [nameMeaningEnField]: string;
  [nameLaField]: string;
}

@Injectable()
export class ImportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Imports bird data from a CSV file into the database.
   * The CSV file should have the following columns:
   * - English Name
   * - Crow Name
   * - English Translation
   * - Scientific Name
   * - Order (optional, if you have taxonomy logic)
   * @param filePath - Path to the CSV file containing bird data
   * @returns Promise<any> resolving to the count of birds imported
   */
  async importBirdCsv(filePath: string): Promise<any> {
    const birds = await this.parseCsv(filePath);
    for (const bird of birds) {
      await this.prisma.bird.upsert({
        where: { nameLa: bird[nameLaField] },
        update: {
          nameLocal: bird[nameLocalField],
          nameMeaningEn: bird[nameMeaningEnField],
          nameEn: bird[nameEnField],
        },
        create: {
          nameEn: bird[nameEnField],
          nameLocal: bird[nameLocalField],
          nameMeaningEn: bird[nameMeaningEnField],
          nameLa: bird[nameLaField],
        },
      });
    }
    return { count: birds.length };
  }

  /**
   * Parses a CSV file and returns an array of objects.
   * Each object represents a row in the CSV file.
   * The keys of the object are the column headers from the CSV.
   * @param {string} filePath - Path to the CSV file
   * @example
   * const data = await this.parseCsv('path/to/file.csv');
   * console.log(data); // [{ 'Column1': 'Value1', 'Column2': 'Value2' }, ...]
   * @returns Promise<any[]>
   * @throws Error if there is an issue reading the file or parsing the CSV.
   */
  private async parseCsv(filePath: string): Promise<RawBirdCsvRow[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (err) => reject(err));
    });
  }
}
