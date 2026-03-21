import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from './auth';
import { MatSnackBar } from '@angular/material/snack-bar';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const _snackBar = inject(MatSnackBar);
  if (authService.getIsLoggedIn()) return true;
  _snackBar.open('Необходимо авторизоваться');
  return false;
};
