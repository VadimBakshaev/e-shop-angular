import { TestBed } from '@angular/core/testing';

import { ActiveFilterService } from './active-filter-service';

describe('ActiveFilterService', () => {
  let service: ActiveFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActiveFilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
