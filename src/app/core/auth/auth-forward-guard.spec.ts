import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { authForwardGuard } from './auth-forward-guard';

describe('authForwardGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => authForwardGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
