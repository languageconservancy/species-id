import { TestBed } from '@angular/core/testing';
import { BirdQueriesService } from './bird-queries.service';
import { SqljsService } from './sqljs.service';
import { Species, SpeciesType } from 'app/models/species.model';
import * as speciesModel from 'app/models/species.model';

describe('BirdQueriesService', () => {
  let service: BirdQueriesService;
  let sqljsServiceSpy: jasmine.SpyObj<SqljsService>;

  beforeEach(async () => {
    sqljsServiceSpy = jasmine.createSpyObj('SqljsService', ['executeQuery', 'init', 'close']);
    sqljsServiceSpy.init.and.resolveTo();
    sqljsServiceSpy.close.and.resolveTo();

    TestBed.configureTestingModule({
      providers: [BirdQueriesService, { provide: SqljsService, useValue: sqljsServiceSpy }],
    });
    service = TestBed.inject(BirdQueriesService);
    await sqljsServiceSpy.init();
  });

  afterEach(async () => {
    await sqljsServiceSpy.close();
  });

  describe('getFull', () => {
    it('should return mapped species from the database', async () => {
      const dbRows = [{ species_id: 1 }];
      sqljsServiceSpy.executeQuery.and.resolveTo({ values: dbRows });
      const mapSpy = spyOn(speciesModel, 'mapSpeciesWithImagesAndOrder').and.returnValue([
        {
          type: SpeciesType.Bird,
          id: 1,
        } as Species,
      ]);
      const result = await service.getAllBirds();
      expect(sqljsServiceSpy.executeQuery).toHaveBeenCalled();
      expect(mapSpy).toHaveBeenCalledWith(dbRows);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(1);
    });

    it('should throw if sqljsService throws', async () => {
      sqljsServiceSpy.executeQuery.and.rejectWith(new Error('DB error'));
      await expectAsync(service.getAllBirds()).toBeRejectedWithError('DB error');
    });
  });

  describe('getById', () => {
    it('should return the mapped species if found', async () => {
      const dbRows = [{ species_id: 1 }];
      sqljsServiceSpy.executeQuery.and.resolveTo({ values: dbRows });
      const mapSpy = spyOn(speciesModel, 'mapSpeciesWithImagesAndOrder').and.returnValue([
        { id: 1, type: SpeciesType.Bird } as Species,
      ]);
      const result = await service.getBirdById(1);
      expect(sqljsServiceSpy.executeQuery).toHaveBeenCalledWith(jasmine.any(String), [1]);
      expect(mapSpy).toHaveBeenCalledWith(dbRows);
      expect(result).toEqual(jasmine.objectContaining({ id: 1 }));
    });

    it('should return null if no species found', async () => {
      sqljsServiceSpy.executeQuery.and.resolveTo({ values: [] });
      const mapSpy = spyOn(speciesModel, 'mapSpeciesWithImagesAndOrder');
      const result = await service.getBirdById(999);
      expect(result).toBeNull();
      expect(mapSpy).not.toHaveBeenCalled();
    });

    it('should throw if sqljsService throws', async () => {
      sqljsServiceSpy.executeQuery.and.rejectWith(new Error('DB error'));
      await expectAsync(service.getBirdById(1)).toBeRejectedWithError('DB error');
    });
  });
});
