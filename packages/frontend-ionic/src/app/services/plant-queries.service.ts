import { Injectable } from '@angular/core';
import { Species, mapSpeciesWithImagesAndOrder, mapSpeciesForList } from 'app/models/species.model';
import { ASSET_PATHS } from 'app/constants/app-consts';
import { SqljsService } from 'app/services/sqljs.service';

@Injectable({
  providedIn: 'root',
})
export class PlantQueriesService {
  constructor(private sqljsService: SqljsService) {}

  async getFull(): Promise<Species[]> {
    try {
      const result = await this.sqljsService.executeQuery(
        `SELECT DISTINCT
          plants.id AS species_id,
          plants.latin_name AS species_name_scientific,
          COALESCE(plant_crow_names.crow_word, '') AS species_name_local,
          COALESCE(plant_english_names.english_name, '') AS species_name_en,
          plants.category AS species_category,
          COALESCE(plant_crow_names.literal_meaning, '') AS species_name_meaning_en,
          COALESCE(plants.description_local, '') AS species_description_local,
          COALESCE(plants.description_en, '') AS species_description_en,
          COALESCE(plants.habitat_en, '') AS species_habitat_en,
          COALESCE(plants.uses_en, '') AS species_uses_en,
          plants.map_image AS species_map_image,
          (SELECT plant_images.file_name FROM plant_images WHERE plant_images.plant_id = plants.id ORDER BY plant_images.sort_order LIMIT 1) AS image_file_name,
          (SELECT plant_images.caption FROM plant_images WHERE plant_images.plant_id = plants.id ORDER BY plant_images.sort_order LIMIT 1) AS image_caption,
          (SELECT plant_images.credit FROM plant_images WHERE plant_images.plant_id = plants.id ORDER BY plant_images.sort_order LIMIT 1) AS image_credit,
          (SELECT plant_images.sort_order FROM plant_images WHERE plant_images.plant_id = plants.id ORDER BY plant_images.sort_order LIMIT 1) AS image_sort_order,
          'plant' as species_type
        FROM plants
        LEFT JOIN plant_crow_name_mappings ON plants.id = plant_crow_name_mappings.plant_id
        LEFT JOIN plant_crow_names ON plant_crow_name_mappings.crow_name_id = plant_crow_names.id
        LEFT JOIN plant_english_names ON plants.id = plant_english_names.plant_id AND plant_english_names.id = (
          SELECT MIN(pen.id) FROM plant_english_names pen WHERE pen.plant_id = plants.id
        )
        WHERE plant_crow_names.crow_word IS NOT NULL
        ORDER BY plants.id, plant_crow_names.crow_word;`
      );
      return mapSpeciesForList(result);
    } catch (error) {
      console.error(ASSET_PATHS.ERROR_EMOJI, 'Error executing query:', error);
      throw error;
    }
  }

  async getById(id: number): Promise<Species | null> {
    try {
      const result = await this.sqljsService.executeQuery(
        `SELECT
          plants.id AS species_id,
          plants.latin_name AS species_name_scientific,
          GROUP_CONCAT(DISTINCT plant_crow_names.crow_word) AS species_name_local,
          GROUP_CONCAT(DISTINCT plant_english_names.english_name) AS species_name_en,
          plants.category AS species_category,
          GROUP_CONCAT(DISTINCT plant_crow_names.literal_meaning) AS species_name_meaning_en,
          COALESCE(plants.description_local, '') AS species_description_local,
          COALESCE(plants.description_en, '') AS species_description_en,
          COALESCE(plants.habitat_en, '') AS species_habitat_en,
          COALESCE(plants.uses_en, '') AS species_uses_en,
          plants.map_image AS species_map_image,
          plant_images.file_name AS image_file_name,
          plant_images.caption AS image_caption,
          plant_images.credit AS image_credit,
          plant_images.sort_order AS image_sort_order,
          'plant' as species_type
        FROM plants
        LEFT JOIN plant_english_names ON plants.id = plant_english_names.plant_id
        LEFT JOIN plant_crow_name_mappings ON plants.id = plant_crow_name_mappings.plant_id
        LEFT JOIN plant_crow_names ON plant_crow_name_mappings.crow_name_id = plant_crow_names.id
        LEFT JOIN plant_images ON plants.id = plant_images.plant_id
        WHERE plants.id = ?
        GROUP BY plants.id, plant_images.id
        ORDER BY plant_images.sort_order;`,
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
   * Get all Crow names for a specific plant species (for detail view)
   */
  async getPlantCrowNames(plantId: number): Promise<Array<{ name: string; meaning: string }>> {
    try {
      const result = await this.sqljsService.executeQuery(
        `SELECT
          plant_crow_names.crow_word as name,
          plant_crow_names.literal_meaning as meaning
        FROM plant_crow_names
        JOIN plant_crow_name_mappings ON plant_crow_names.id = plant_crow_name_mappings.crow_name_id
        WHERE plant_crow_name_mappings.plant_id = ?
        ORDER BY plant_crow_names.crow_word;`,
        [plantId]
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

  async getPlantEnglishNames(plantId: number): Promise<string[]> {
    try {
      const result = await this.sqljsService.executeQuery(
        `SELECT DISTINCT plant_english_names.english_name
         FROM plant_english_names
         WHERE plant_english_names.plant_id = ?
         ORDER BY plant_english_names.english_name;`,
        [plantId]
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

  async getPlantScientificNames(plantId: number): Promise<string[]> {
    try {
      const result = await this.sqljsService.executeQuery(
        `SELECT DISTINCT plants.latin_name as primary_name,
          plant_scientific_synonyms.synonym_name
         FROM plants
         LEFT JOIN plant_scientific_synonyms ON plants.id = plant_scientific_synonyms.plant_id
         WHERE plants.id = ?;`,
        [plantId]
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
