import { Injectable } from '@angular/core';
import { Species, mapSpeciesWithImagesAndOrder } from 'app/models/species.model';
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
        `SELECT
          plants.id AS species_id,
          plants.latin_name AS species_name_scientific,
          plant_crow_names.crow_word AS species_name_local,
          plant_english_names.english_name AS species_name_en,
          plants.category AS species_category,
          plant_crow_names.literal_meaning AS species_name_meaning_en,
          '' AS species_description_local,
          plants.description_en AS species_description_en,
          plants.habitat_en AS species_habitat_en,
          plants.uses_en AS species_uses_en,
          plants.map_image AS species_map_image,
          plant_images.file_name AS image_file_name,
          plant_images.caption AS image_caption,
          plant_images.sort_order AS image_sort_order,
          'plant' as species_type
        FROM plants
        LEFT JOIN plant_english_names ON plants.id = plant_english_names.plant_id
        LEFT JOIN plant_crow_name_mappings ON plants.id = plant_crow_name_mappings.plant_id
        LEFT JOIN plant_crow_names ON plant_crow_name_mappings.crow_name_id = plant_crow_names.id
        LEFT JOIN plant_images ON plants.id = plant_images.plant_id
        GROUP BY plants.id, plant_images.id
        ORDER BY plants.id, plant_images.sort_order;`
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
          plants.id AS species_id,
          plants.latin_name AS species_name_scientific,
          plant_crow_names.crow_word AS species_name_local,
          plant_english_names.english_name AS species_name_en,
          plants.category AS species_category,
          plant_crow_names.literal_meaning AS species_name_meaning_en,
          '' AS species_description_local,
          plants.description_en AS species_description_en,
          plants.habitat_en AS species_habitat_en,
          plants.uses_en AS species_uses_en,
          plants.map_image AS species_map_image,
          plant_images.file_name AS image_file_name,
          plant_images.caption AS image_caption,
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
}
