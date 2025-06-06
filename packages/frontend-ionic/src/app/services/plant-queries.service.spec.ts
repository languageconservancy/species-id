import { TestBed } from '@angular/core/testing';

import { PlantQueriesService } from './plant-queries.service';

describe('PlantQueriesService', () => {
  let service: PlantQueriesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlantQueriesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
