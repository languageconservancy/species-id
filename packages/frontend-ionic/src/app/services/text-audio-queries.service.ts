import { Injectable } from '@angular/core';
import { SqljsService } from 'app/services/sqljs.service';
import { TextAudio, mapTextAudio } from 'app/models/text-audio.model';
import { ASSET_PATHS } from 'app/constants/app-consts';

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
  async getByText(text: string): Promise<TextAudio | null> {
    if (!text) {
      console.warn(ASSET_PATHS.WARNING_EMOJI, 'TextAudioService.getByText called with empty text');
      return null;
    }

    try {
      // Use parameterized queries to prevent SQL injection
      const result = await this.sqljsService.executeQuery(
        `SELECT * FROM text_audios WHERE text = ?;`,
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
}
