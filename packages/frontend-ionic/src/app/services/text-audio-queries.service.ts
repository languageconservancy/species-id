import { Injectable } from '@angular/core';
import { SqljsService } from 'app/services/sqljs.service';
import { TextAudio, mapTextAudio } from 'app/models/text-audio.model';
import { ASSET_PATHS } from 'app/constants/app-consts';
import { SpeciesType } from 'app/models/species.model';

@Injectable({
  providedIn: 'root',
})
export class TextAudioQueriesService {
  constructor(private sqljsService: SqljsService) {}

  /**
   * @param {string} text - The text to search for in the database.
   * @description Retrieves a TextAudio object from the database by its text.
   * If the text is empty, it logs a warning and returns null.
   * If the text is found, it maps the result to a TextAudio object and returns it.
   * @returns {Promise<TextAudio | null>} - A promise that resolves to a TextAudio object or null if not found.
   * @throws Will throw an error if the query execution fails.
   */
  async getByText(text: string, speciesType: SpeciesType): Promise<TextAudio | null> {
    let textAudioTable: string;
    let crowNamesTable: string;

    switch (speciesType) {
      case SpeciesType.Bird:
        textAudioTable = 'bird_text_audios';
        crowNamesTable = 'bird_crow_names';
        break;
      case SpeciesType.Plant:
        textAudioTable = 'plant_text_audios';
        crowNamesTable = 'plant_crow_names';
        break;
      default:
        console.error(ASSET_PATHS.ERROR_EMOJI, `Invalid species type: ${speciesType}`);
        return null;
    }

    if (!text) {
      console.warn(ASSET_PATHS.WARNING_EMOJI, 'TextAudioService.getByText called with empty text');
      return null;
    }

    try {
      // Join text audios with crow names to get the text
      const result = await this.sqljsService.executeQuery(
        `SELECT
          ${textAudioTable}.id,
          ${textAudioTable}.file_name,
          ${textAudioTable}.sort_order,
          ${crowNamesTable}.crow_word as text,
          ${crowNamesTable}.literal_meaning,
          '' as url_prefix,
          '' as ipa
        FROM ${textAudioTable}
        JOIN ${crowNamesTable} ON ${textAudioTable}.crow_name_id = ${crowNamesTable}.id
        WHERE ${crowNamesTable}.crow_word = ?
        ORDER BY ${textAudioTable}.sort_order
        LIMIT 1;`,
        [text]
      );

      if (result.values.length === 0) {
        return null;
      }

      // Convert array of values to object using column names
      const rowValues = result.values[0];
      const row: any = {};
      result.columns.forEach((column: string, index: number) => {
        row[column] = rowValues[index];
      });

      return mapTextAudio(row);
    } catch (error) {
      console.error(ASSET_PATHS.ERROR_EMOJI, 'Error executing query:', error);
      throw error;
    }
  }

  /**
   * Get all text audios for a species by species ID
   * @param {number} speciesId - The ID of the species
   * @param {SpeciesType} speciesType - The type of species (bird or plant)
   * @returns {Promise<TextAudio[]>} - A promise that resolves to an array of TextAudio objects
   */
  async getBySpeciesId(speciesId: number, speciesType: SpeciesType): Promise<TextAudio[]> {
    let textAudioTable: string;
    let crowNamesTable: string;
    let mappingTable: string;
    let speciesIdColumn: string;

    switch (speciesType) {
      case SpeciesType.Bird:
        textAudioTable = 'bird_text_audios';
        crowNamesTable = 'bird_crow_names';
        mappingTable = 'bird_crow_name_mappings';
        speciesIdColumn = 'bird_id';
        break;
      case SpeciesType.Plant:
        textAudioTable = 'plant_text_audios';
        crowNamesTable = 'plant_crow_names';
        mappingTable = 'plant_crow_name_mappings';
        speciesIdColumn = 'plant_id';
        break;
      default:
        console.error(ASSET_PATHS.ERROR_EMOJI, `Invalid species type: ${speciesType}`);
        return [];
    }

    try {
      // Join text audios with crow names and mappings to get all audios for a species
      const result = await this.sqljsService.executeQuery(
        `SELECT
          ${textAudioTable}.id,
          ${textAudioTable}.file_name,
          ${textAudioTable}.sort_order,
          ${crowNamesTable}.crow_word as text,
          ${crowNamesTable}.literal_meaning,
          '' as url_prefix,
          '' as ipa
        FROM ${textAudioTable}
        JOIN ${crowNamesTable} ON ${textAudioTable}.crow_name_id = ${crowNamesTable}.id
        JOIN ${mappingTable} ON ${crowNamesTable}.id = ${mappingTable}.crow_name_id
        WHERE ${mappingTable}.${speciesIdColumn} = ?
        ORDER BY ${crowNamesTable}.crow_word, ${textAudioTable}.sort_order;`,
        [speciesId]
      );

      if (result.values.length === 0) {
        return [];
      }

      // Convert array of values to objects using column names
      return result.values.map((rowValues: any[]) => {
        const row: any = {};
        result.columns.forEach((column: string, index: number) => {
          row[column] = rowValues[index];
        });
        return mapTextAudio(row);
      });
    } catch (error) {
      console.error(ASSET_PATHS.ERROR_EMOJI, 'Error executing query:', error);
      throw error;
    }
  }
}
