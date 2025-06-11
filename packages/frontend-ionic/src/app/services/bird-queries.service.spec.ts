import { TestBed } from '@angular/core/testing';
import { BirdQueriesService } from './bird-queries.service';
import { SqliteService } from './sqlite.service';
import { Species, SpeciesType } from 'app/models/species.model';
import * as speciesModel from 'app/models/species.model';

describe('BirdQueriesService', () => {
  let service: BirdQueriesService;
  let sqliteServiceSpy: jasmine.SpyObj<SqliteService>;

  beforeEach(async () => {
    sqliteServiceSpy = jasmine.createSpyObj('SqliteService', ['executeQuery', 'init', 'close']);
    sqliteServiceSpy.init.and.resolveTo();
    sqliteServiceSpy.close.and.resolveTo();

    TestBed.configureTestingModule({
      providers: [BirdQueriesService, { provide: SqliteService, useValue: sqliteServiceSpy }],
    });
    service = TestBed.inject(BirdQueriesService);
    await sqliteServiceSpy.init();
  });

  afterEach(async () => {
    await sqliteServiceSpy.close();
  });

  describe('getFull', () => {
    it('should return mapped species from the database', async () => {
      const dbRows = [{ species_id: 1 }];
      sqliteServiceSpy.executeQuery.and.resolveTo({ values: dbRows });
      const mapSpy = spyOn(speciesModel, 'mapSpeciesWithImagesAndOrder').and.returnValue([
        {
          type: SpeciesType.Bird,
          id: 1,
        } as Species,
      ]);
      const result = await service.getFull();
      expect(sqliteServiceSpy.executeQuery).toHaveBeenCalled();
      expect(mapSpy).toHaveBeenCalledWith(dbRows);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(1);
    });

    it('should throw if sqliteService throws', async () => {
      sqliteServiceSpy.executeQuery.and.rejectWith(new Error('DB error'));
      await expectAsync(service.getFull()).toBeRejectedWithError('DB error');
    });
  });

  describe('getById', () => {
    it('should return the mapped species if found', async () => {
      const dbRows = [{ species_id: 1 }];
      sqliteServiceSpy.executeQuery.and.resolveTo({ values: dbRows });
      const mapSpy = spyOn(speciesModel, 'mapSpeciesWithImagesAndOrder').and.returnValue([
        { id: 1, type: SpeciesType.Bird } as Species,
      ]);
      const result = await service.getById(1);
      expect(sqliteServiceSpy.executeQuery).toHaveBeenCalledWith(jasmine.any(String), [1]);
      expect(mapSpy).toHaveBeenCalledWith(dbRows);
      expect(result).toEqual(jasmine.objectContaining({ id: 1 }));
    });

    it('should return null if no species found', async () => {
      sqliteServiceSpy.executeQuery.and.resolveTo({ values: [] });
      const mapSpy = spyOn(speciesModel, 'mapSpeciesWithImagesAndOrder');
      const result = await service.getById(999);
      expect(result).toBeNull();
      expect(mapSpy).not.toHaveBeenCalled();
    });

    it('should throw if sqliteService throws', async () => {
      sqliteServiceSpy.executeQuery.and.rejectWith(new Error('DB error'));
      await expectAsync(service.getById(1)).toBeRejectedWithError('DB error');
    });
  });
});
