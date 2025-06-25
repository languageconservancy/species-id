import { Injectable } from '@angular/core';
import { Species, mapSpeciesWithImagesAndOrder } from 'app/models/species.model';
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
          plants.order_id AS order_id,
          plants.name_meaning_en AS species_name_meaning_en,
          plants.description_local AS species_description_local,
          plants.description_en AS species_description_en,
          plant_images.file_name AS image_file_name,
          plant_images.caption AS image_caption,
          plant_images.sort_order AS image_sort_order,
          plant_orders.name_scientific AS order_name_scientific,
          plant_orders.description_local AS order_description_local,
          plant_orders.description_en AS order_description_en
        FROM plants
        LEFT JOIN plant_images ON plants.id = plant_images.plant_id
        LEFT JOIN plant_orders ON plants.order_id = plant_orders.id
      ;`
      );
      return mapSpeciesWithImagesAndOrder(result);
    } catch (error) {
      console.error('Error executing query:', error);
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
          plants.order_id AS order_id,
          plants.name_meaning_en AS species_name_meaning_en,
          plants.description_local AS species_description_local,
          plants.description_en AS species_description_en,
          plant_images.file_name AS image_file_name,
          plant_images.caption AS image_caption,
          plant_images.sort_order AS image_sort_order,
          plant_orders.name_scientific AS order_name_scientific,
          plant_orders.description_local AS order_description_local,
          plant_orders.description_en AS order_description_en
        FROM plants
        LEFT JOIN plant_images ON plants.id = plant_images.plant_id
        LEFT JOIN plant_orders ON plants.order_id = plant_orders.id
        WHERE plants.id = ?;`,
        [id]
      );
      if (result.values.length === 0) {
        return null;
      }
      return mapSpeciesWithImagesAndOrder(result)[0];
    } catch (error) {
      console.error('Error executing query:', error);
      return null;
    }
  }
}
