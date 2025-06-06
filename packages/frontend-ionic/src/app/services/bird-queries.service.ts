import { Injectable } from '@angular/core';
import { SqliteService } from 'app/services/sqlite.service';
import { Species, mapSpeciesWithImagesAndOrder } from 'app/models/species.model';

@Injectable({
  providedIn: 'root',
})
export class BirdQueriesService {
  constructor(private sqliteService: SqliteService) {}

  async getFull(): Promise<Species[]> {
    try {
      const result = await this.sqliteService.executeQuery(
        `SELECT
          birds.id AS species_id,
          birds.name_scientific AS species_name_scientific,
          birds.name_local AS species_name_local,
          birds.name_en AS species_name_en,
          birds.order_id AS species_order_id,
          birds.name_meaning_en AS species_name_meaning_en,
          birds.description_local AS species_description_local,
          birds.description_en AS species_description_en,
          bird_images.file_name AS image_file_name,
          bird_images.caption AS image_caption,
          bird_images.sort_order AS image_sort_order,
          bird_orders.name_scientific AS order_name_scientific,
          bird_orders.description_local AS order_description_local,
          bird_orders.description_en AS order_description_en
        FROM birds
        LEFT JOIN bird_images ON birds.id = bird_images.bird_id
        LEFT JOIN bird_orders ON birds.order_id = bird_orders.id
      ;`
      );
      return mapSpeciesWithImagesAndOrder(result.values);
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  }

  async getById(id: number): Promise<Species | null> {
    try {
      const result = await this.sqliteService.executeQuery(
        `SELECT
          birds.id AS species_id,
          birds.name_scientific AS species_name_scientific,
          birds.name_local AS species_name_local,
          birds.name_en AS species_name_en,
          birds.order_id AS species_order_id,
          birds.name_meaning_en AS species_name_meaning_en,
          birds.description_local AS species_description_local,
          birds.description_en AS species_description_en,
          bird_images.file_name AS image_file_name,
          bird_images.caption AS image_caption,
          bird_images.sort_order AS image_sort_order,
          bird_orders.name_scientific AS order_name_scientific,
          bird_orders.description_local AS order_description_local,
          bird_orders.description_en AS order_description_en
        FROM birds
        LEFT JOIN bird_images ON birds.id = bird_images.bird_id
        LEFT JOIN bird_orders ON birds.order_id = bird_orders.id
        WHERE birds.id = ?;`,
        [id]
      );
      if (result.values.length === 0) {
        return null;
      }
      return mapSpeciesWithImagesAndOrder(result.values)[0];
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  }
}
