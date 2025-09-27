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
          plants.name_scientific AS species_name_scientific,
          plants.name_local AS species_name_local,
          plants.name_en AS species_name_en,
          plants.category_id AS category_id,
          plants.name_meaning_en AS species_name_meaning_en,
          plants.description_en AS species_description_en,
          plants.map_image AS species_map_image,
          plant_categories.name AS category_name,
          plant_categories.description_local AS category_description_local,
          plant_categories.description_en AS category_description_en,
          plant_images.file_name AS image_file_name,
          plant_images.caption AS image_caption,
          plant_images.sort_order AS image_sort_order,
          'plant' as species_type
        FROM plants
        LEFT JOIN plant_categories ON plants.category_id = plant_categories.id
        LEFT JOIN plant_images ON plants.id = plant_images.plant_id
      ;`
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
          plants.name_scientific AS species_name_scientific,
          plants.name_local AS species_name_local,
          plants.name_en AS species_name_en,
          plants.category_id AS category_id,
          plants.name_meaning_en AS species_name_meaning_en,
          plants.description_en AS species_description_en,
          plants.map_image AS species_map_image,
          plant_categories.name AS category_name,
          plant_categories.description_local AS category_description_local,
          plant_categories.description_en AS category_description_en,
          plant_images.file_name AS image_file_name,
          plant_images.caption AS image_caption,
          plant_images.sort_order AS image_sort_order,
          'plant' as species_type
        FROM plants
        LEFT JOIN plant_categories ON plants.category_id = plant_categories.id
        LEFT JOIN plant_images ON plants.id = plant_images.plant_id
        WHERE plants.id = ?;`,
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
