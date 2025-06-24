import { Injectable } from '@angular/core';
import { SqliteService } from 'app/services/sqlite.service';
import { TextAudio, mapTextAudio } from 'app/models/text-audio.model';

@Injectable({
  providedIn: 'root',
})
export class TextAudioQueriesService {
  constructor(private sqliteService: SqliteService) {}

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
      console.warn('TextAudioService.getByText called with empty text');
      return null;
    }

    try {
      // Use parameterized queries to prevent SQL injection
      const result = await this.sqliteService.executeQuery(
        `SELECT * FROM text_audios WHERE text = ?;`,
        [text]
      );
      if (result.values.length === 0) {
        return null;
      }
      return mapTextAudio(result.values[0]);
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  }
}
