import { Injectable } from '@angular/core';
import { Species, mapSpeciesWithImagesAndOrder } from 'app/models/species.model';
import { SqliteService } from 'app/services/sqlite.service';

@Injectable({
  providedIn: 'root',
})
export class PlantQueriesService {
  constructor(private sqliteService: SqliteService) {}

  async getPlantsFull(): Promise<Species[]> {
    try {
      const result = await this.sqliteService.executeQuery(
        `SELECT
          plants.*,
          plant_images.file_name, plant_images.caption, plant_images.sort_order,
          plant_orders.name_scientific, plant_orders.description_local, plant_orders.description_en
        FROM plants
        LEFT JOIN plant_images ON plants.id = plant_images.plant_id
        LEFT JOIN plant_orders ON plants.order_id = plant_orders.id
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
          plants.*,
          plant_images.file_name, plant_images.caption, plant_images.sort_order,
          plant_orders.name_scientific, plant_orders.description_local, plant_orders.description_en
        FROM plants
        LEFT JOIN plant_images ON plants.id = plant_images.plant_id
        LEFT JOIN plant_orders ON plants.order_id = plant_orders.id
        WHERE plants.id = ${id}
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
