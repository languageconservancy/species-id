import { TestBed } from '@angular/core/testing';

import { CloudStorageSyncService } from './cloud-storage-sync.service';

describe('CloudStorageSyncService', () => {
  let service: CloudStorageSyncService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CloudStorageSyncService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
