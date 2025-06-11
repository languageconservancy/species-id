import { TestBed } from '@angular/core/testing';

import { StorageReadyService } from './storage-ready.service';

describe('StorageReadyService', () => {
  let service: StorageReadyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageReadyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
