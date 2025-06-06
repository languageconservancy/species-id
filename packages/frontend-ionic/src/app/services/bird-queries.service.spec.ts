import { TestBed } from '@angular/core/testing';

import { BirdQueriesService } from './bird-queries.service';

describe('BirdQueriesService', () => {
  let service: BirdQueriesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BirdQueriesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
