import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth';
import { HttpErrorResponse } from '@angular/common/http';
import { DefaultResponseType } from '../../../../types/default-response.type';
import { LoginResponseType } from '../../../../types/login-response.type';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-signup',
  standalone: false,
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class SignupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected signupForm = this.fb.group({
    email: ['', [Validators.email, Validators.required]],
    password: ['', [Validators.required, Validators.pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/)]],
    passwordRepeat: ['', [Validators.required, Validators.pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/)]],
    agree: [false, [Validators.requiredTrue]],
  });

  protected get email() { return this.signupForm.get('email') };
  protected get password() { return this.signupForm.get('password') };
  protected get passwordRepeat() { return this.signupForm.get('passwordRepeat') };
  protected get agree() { return this.signupForm.get('agree') };

  protected signup(): void {
    if (
      this.signupForm.valid &&
      this.signupForm.value.email &&
      this.signupForm.value.password &&
      this.signupForm.value.passwordRepeat) {
      this.authService.signup(this.signupForm.value.email, this.signupForm.value.password, this.signupForm.value.passwordRepeat)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: LoginResponseType | DefaultResponseType) => {
            let error: string | null = null;
            if ((data as DefaultResponseType).error !== undefined) {
              error = (data as DefaultResponseType).message;
            }
            const loginResponse: LoginResponseType = data as LoginResponseType;
            if (!loginResponse.accessToken || !loginResponse.refreshToken || !loginResponse.userId) {
              error = 'Ошибка регистрации';
            }
            if (error) {
              this._snackBar.open(error);
              throw new Error(error);
            }
            this.authService.setUser(loginResponse.accessToken, loginResponse.refreshToken, loginResponse.userId);
            this._snackBar.open('Вы успешно зарегистрировались');
            this.router.navigate(['/']);
          },
          error: (errorResponse: HttpErrorResponse) => {
            if (errorResponse.error && errorResponse.error.message) {
              this._snackBar.open(errorResponse.error.message);
            } else {
              this._snackBar.open('Ошибка регистрации');
            }
          }
        })
    }
  }
}
