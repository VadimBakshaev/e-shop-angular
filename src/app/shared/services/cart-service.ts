import { HttpClient } from '@angular/common/http';
import { DestroyRef, inject, Injectable } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CartType } from '../../../types/cart.type';
import { DefaultResponseType } from '../../../types/default-response.type';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/auth/auth';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);

  private count: number = 0;
  public count$: Subject<number> = new Subject<number>();

  constructor() {
    this.authService.isLogged$.subscribe(() => {
      this.getCartCount()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (count) => {
            if ((count as DefaultResponseType).error !== undefined) {
              throw new Error((count as DefaultResponseType).message);
            }
            this.setCount((count as { count: number }).count);
          },
          error: (error) => console.error('Failed to get cart count:', error)
        })
    })
  }

  public setCount(count: number): void {
    this.count = count;
    this.count$.next(count);
  }

  public getCart(): Observable<CartType | DefaultResponseType> {
    return this.http.get<CartType | DefaultResponseType>(environment.api + 'cart', { withCredentials: true });
  }

  private getCartCount(): Observable<{ count: number } | DefaultResponseType> {
    return this.http.get<{ count: number } | DefaultResponseType>(environment.api + 'cart/count', { withCredentials: true })
      .pipe(
        tap(data => {
          if (!data.hasOwnProperty('error')) {
            this.setCount((data as { count: number }).count);
          }
        })
      );
  }

  public updateCart(productId: string, quantity: number): Observable<CartType | DefaultResponseType> {
    return this.http.post<CartType | DefaultResponseType>(environment.api + 'cart', { productId, quantity }, { withCredentials: true })
      .pipe(
        tap(data => {
          if (!data.hasOwnProperty('error')) {
            this.setCount((data as CartType).items.reduce((total, item) => total + item.quantity, 0));
          }
        })
      );
  }  
}
