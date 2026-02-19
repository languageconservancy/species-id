import { Injectable } from '@angular/core';
import { SqljsService } from 'app/services/sqljs.service';
import { Species, mapSpeciesWithImagesAndOrder, mapSpeciesForList } from 'app/models/species.model';
import { ASSET_PATHS } from 'app/constants/app-consts';

@Injectable({
  providedIn: 'root',
})
export class BirdQueriesService {
  constructor(private sqljsService: SqljsService) {}

  async getAllBirds(): Promise<Species[]> {
    try {
      const result = await this.sqljsService.executeQuery(
        `SELECT DISTINCT
          birds.id AS species_id,
          birds.latin_name AS species_name_scientific,
          COALESCE(bird_crow_names.crow_word, '') AS species_name_local,
          COALESCE(bird_english_names.english_name, '') AS species_name_en,
          birds.category AS species_category,
          COALESCE(bird_crow_names.literal_meaning, '') AS species_name_meaning_en,
          COALESCE(birds.description_local, '') AS species_description_local,
          COALESCE(birds.description_en, '') AS species_description_en,
          COALESCE(birds.habitat_en, '') AS species_habitat_en,
          COALESCE(birds.food_habits_en, '') AS species_food_habits_en,
          COALESCE(birds.migration_en, '') AS species_migration_en,
          COALESCE(birds.cultural_en, '') AS species_cultural_en,
          birds.map_image AS species_map_image,
          (SELECT bird_images.file_name FROM bird_images WHERE bird_images.bird_id = birds.id ORDER BY bird_images.sort_order LIMIT 1) AS image_file_name,
          (SELECT bird_images.caption FROM bird_images WHERE bird_images.bird_id = birds.id ORDER BY bird_images.sort_order LIMIT 1) AS image_caption,
          (SELECT bird_images.credit FROM bird_images WHERE bird_images.bird_id = birds.id ORDER BY bird_images.sort_order LIMIT 1) AS image_credit,
          (SELECT bird_images.sort_order FROM bird_images WHERE bird_images.bird_id = birds.id ORDER BY bird_images.sort_order LIMIT 1) AS image_sort_order,
          (SELECT bird_song_audios.file_name FROM bird_song_audios WHERE bird_song_audios.bird_id = birds.id ORDER BY bird_song_audios.sort_order LIMIT 1) AS audio_file_name,
          (SELECT bird_song_audios.caption FROM bird_song_audios WHERE bird_song_audios.bird_id = birds.id ORDER BY bird_song_audios.sort_order LIMIT 1) AS audio_caption,
          (SELECT bird_song_audios.sort_order FROM bird_song_audios WHERE bird_song_audios.bird_id = birds.id ORDER BY bird_song_audios.sort_order LIMIT 1) AS audio_sort_order,
          'bird' as species_type
        FROM birds
        LEFT JOIN bird_crow_name_mappings ON birds.id = bird_crow_name_mappings.bird_id
        LEFT JOIN bird_crow_names ON bird_crow_name_mappings.crow_name_id = bird_crow_names.id
        LEFT JOIN bird_english_names ON birds.id = bird_english_names.bird_id AND bird_english_names.id = (
          SELECT MIN(ben.id) FROM bird_english_names ben WHERE ben.bird_id = birds.id
        )
        WHERE bird_crow_names.crow_word IS NOT NULL
        ORDER BY birds.id, bird_crow_names.crow_word;`
      );
      return mapSpeciesForList(result);
    } catch (error) {
      console.error(ASSET_PATHS.ERROR_EMOJI, 'Error executing query:', error);
      throw error;
    }
  }

  async getBirdById(id: number): Promise<Species | null> {
    try {
      const result = await this.sqljsService.executeQuery(
        `SELECT
          birds.id AS species_id,
          birds.latin_name AS species_name_scientific,
          GROUP_CONCAT(DISTINCT bird_crow_names.crow_word) AS species_name_local,
          GROUP_CONCAT(DISTINCT bird_english_names.english_name) AS species_name_en,
          birds.category AS species_category,
          GROUP_CONCAT(DISTINCT bird_crow_names.literal_meaning) AS species_name_meaning_en,
          COALESCE(birds.description_local, '') AS species_description_local,
          COALESCE(birds.description_en, '') AS species_description_en,
          COALESCE(birds.habitat_en, '') AS species_habitat_en,
          COALESCE(birds.food_habits_en, '') AS species_food_habits_en,
          COALESCE(birds.migration_en, '') AS species_migration_en,
          COALESCE(birds.cultural_en, '') AS species_cultural_en,
          birds.map_image AS species_map_image,
          bird_images.file_name AS image_file_name,
          bird_images.caption AS image_caption,
          bird_images.credit AS image_credit,
          bird_images.sort_order AS image_sort_order,
          bird_song_audios.file_name AS audio_file_name,
          bird_song_audios.caption AS audio_caption,
          bird_song_audios.sort_order AS audio_sort_order,
          'bird' as species_type
        FROM birds
        LEFT JOIN bird_english_names ON birds.id = bird_english_names.bird_id
        LEFT JOIN bird_crow_name_mappings ON birds.id = bird_crow_name_mappings.bird_id
        LEFT JOIN bird_crow_names ON bird_crow_name_mappings.crow_name_id = bird_crow_names.id
        LEFT JOIN bird_images ON birds.id = bird_images.bird_id
        LEFT JOIN bird_song_audios ON birds.id = bird_song_audios.bird_id
        WHERE birds.id = ?
        GROUP BY birds.id, bird_images.id, bird_song_audios.id
        ORDER BY bird_images.sort_order, bird_song_audios.sort_order;`,
        [id]
      );
      if (result.values.length === 0) {
        return null;
      }
      return mapSpeciesWithImagesAndOrder(result)[0];
    } catch (error) {
      console.error(ASSET_PATHS.ERROR_EMOJI, 'Error executing query:', error);
      return null;
    }
  }

  /**
   * Get all Crow names for a specific bird species (for detail view)
   */
  async getBirdCrowNames(birdId: number): Promise<Array<{ name: string; meaning: string }>> {
    try {
      const result = await this.sqljsService.executeQuery(
        `SELECT
          bird_crow_names.crow_word as name,
          bird_crow_names.literal_meaning as meaning
        FROM bird_crow_names
        JOIN bird_crow_name_mappings ON bird_crow_names.id = bird_crow_name_mappings.crow_name_id
        WHERE bird_crow_name_mappings.bird_id = ?;`,
        [birdId]
      );

      return result.values.map((row: any[]) => ({
        name: row[0] || '',
        meaning: row[1] || '',
      }));
    } catch (error) {
      console.error(ASSET_PATHS.ERROR_EMOJI, 'Error executing query:', error);
      return [];
    }
  }

  async getBirdEnglishNames(birdId: number): Promise<string[]> {
    try {
      const result = await this.sqljsService.executeQuery(
        `SELECT DISTINCT bird_english_names.english_name
         FROM bird_english_names
         WHERE bird_english_names.bird_id = ?;`,
        [birdId]
      );

      return result.values
        .map((row: any[]) => row[0])
        .filter((name: string) => name && name.trim())
        .map((name: string) => name.trim());
    } catch (error) {
      console.error(ASSET_PATHS.ERROR_EMOJI, 'Error executing query:', error);
      return [];
    }
  }

  async getBirdLiteralMeanings(birdId: number): Promise<string[]> {
    try {
      const result = await this.sqljsService.executeQuery(
        `SELECT bird_crow_names.literal_meaning
         FROM bird_crow_names
         JOIN bird_crow_name_mappings ON bird_crow_names.id = bird_crow_name_mappings.crow_name_id
         WHERE bird_crow_name_mappings.bird_id = ?;`,
        [birdId]
      );
      return result.values.map((row: any[]) => row[0] || '');
    } catch (error) {
      console.error(ASSET_PATHS.ERROR_EMOJI, 'Error executing query:', error);
      return [];
    }
  }

  async getBirdScientificNames(birdId: number): Promise<string[]> {
    try {
      const result = await this.sqljsService.executeQuery(
        `SELECT
          birds.latin_name as primary_name,
          bird_scientific_synonyms.synonym_name
         FROM birds
         LEFT JOIN bird_scientific_synonyms ON birds.id = bird_scientific_synonyms.bird_id
         WHERE birds.id = ?;`,
        [birdId]
      );

      const scientificNames: string[] = [];

      // Add the primary scientific name first
      if (result.values.length > 0 && result.values[0][0]) {
        scientificNames.push(result.values[0][0]);
      }

      // Add all synonyms
      result.values.forEach((row: any[]) => {
        if (row[1] && row[1].trim()) {
          scientificNames.push(row[1].trim());
        }
      });

      return scientificNames;
    } catch (error) {
      console.error(ASSET_PATHS.ERROR_EMOJI, 'Error executing query:', error);
      return [];
    }
  }
}
