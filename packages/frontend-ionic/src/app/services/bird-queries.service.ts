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
          birds.*,
          bird_images.file_name, bird_images.caption, bird_images.sort_order,
          bird_orders.name_scientific, bird_orders.description_local, bird_orders.description_en
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
          birds.*,
          bird_images.file_name, bird_images.caption, bird_images.sort_order,
          bird_orders.name_scientific, bird_orders.description_local, bird_orders.description_en
        FROM birds
        LEFT JOIN bird_images ON birds.id = bird_images.bird_id
        LEFT JOIN bird_orders ON birds.order_id = bird_orders.id
        WHERE birds.id = ${id}
      ;`
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
