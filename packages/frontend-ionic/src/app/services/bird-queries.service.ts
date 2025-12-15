import { Injectable } from '@angular/core';
import { SqljsService } from 'app/services/sqljs.service';
import { Species, mapSpeciesWithImagesAndOrder } from 'app/models/species.model';
import { ASSET_PATHS } from 'app/constants/app-consts';

@Injectable({
  providedIn: 'root',
})
export class BirdQueriesService {
  constructor(private sqljsService: SqljsService) {}

  async getFull(): Promise<Species[]> {
    try {
      const result = await this.sqljsService.executeQuery(
        `SELECT
          birds.id AS species_id,
          birds.latin_name AS species_name_scientific,
          bird_crow_names.crow_word AS species_name_local,
          bird_english_names.english_name AS species_name_en,
          birds.category AS species_category,
          bird_crow_names.literal_meaning AS species_name_meaning_en,
          '' AS species_description_local,
          birds.description_en AS species_description_en,
          birds.habitat_en AS species_habitat_en,
          birds.food_habits_en AS species_food_habits_en,
          birds.map_image AS species_map_image,
          bird_images.file_name AS image_file_name,
          bird_images.caption AS image_caption,
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
        GROUP BY birds.id, bird_images.id, bird_song_audios.id
        ORDER BY birds.id, bird_images.sort_order, bird_song_audios.sort_order;`
      );
      return mapSpeciesWithImagesAndOrder(result);
    } catch (error) {
      console.error(ASSET_PATHS.ERROR_EMOJI, 'Error executing query:', error);
      throw error;
    }
  }

  async getById(id: number): Promise<Species | null> {
    try {
      const result = await this.sqljsService.executeQuery(
        `SELECT
          birds.id AS species_id,
          birds.latin_name AS species_name_scientific,
          bird_crow_names.crow_word AS species_name_local,
          bird_english_names.english_name AS species_name_en,
          birds.category AS species_category,
          bird_crow_names.literal_meaning AS species_name_meaning_en,
          '' AS species_description_local,
          birds.description_en AS species_description_en,
          birds.habitat_en AS species_habitat_en,
          birds.food_habits_en AS species_food_habits_en,
          birds.map_image AS species_map_image,
          bird_images.file_name AS image_file_name,
          bird_images.caption AS image_caption,
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
}
