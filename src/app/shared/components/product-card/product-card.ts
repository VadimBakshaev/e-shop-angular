import { Component, DestroyRef, inject, Input, OnInit, signal } from '@angular/core';
import { ProductType } from '../../../../types/product.type';
import { environment } from '../../../../environments/environment';
import { CartService } from '../../services/cart-service';
import { AuthService } from '../../../core/auth/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FavoriteService } from '../../services/favorite-service';
import { DefaultResponseType } from '../../../../types/default-response.type';
import { FavoriteType } from '../../../../types/favorite.type';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'product-card',
  standalone: false,
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCardComponent implements OnInit {
  @Input() product!: ProductType;
  @Input() isLight: boolean = false;
  @Input() countInCart: number | undefined = 0;

  private readonly cartService = inject(CartService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly favoriteService = inject(FavoriteService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly serverPath: string = environment.serverStaticPath;
  protected count: number = 1;
  protected isInCart = signal<boolean>(false);
  protected isInFavorite = signal<boolean>(false);
  protected isLogged = toSignal(this.authService.isLogged$, { initialValue: false });

  public ngOnInit(): void {
    if (this.countInCart) {
      this.count = this.countInCart;
      this.isInCart.set(true);
    }
    if (this.product.isInFavorite && this.product.isInFavorite === true) {
      this.isInFavorite.set(true);
    }
  }

  protected updateCount(value: number) {
    this.count = value;
    if (this.countInCart) {
      this.updeteCart(this.product.id, this.count);
    }
  }

  protected addToCart() {
    this.updeteCart(this.product.id, this.count);
  }

  protected removeFromCart() {
    this.updeteCart(this.product.id, 0);
  }

  private updeteCart(id: string, count: number) {
    this.cartService.updateCart(id, count)
      .pipe(
        debounceTime(500),
        takeUntilDestroyed(this.destroyRef),
        catchError(error => {
          this.handleError(error, 'Ошибка при обновлении корзины');
          return of(null)
        }))
      .subscribe(() => {
        if (count === 0) {
          this.countInCart = 0;
          this.isInCart.set(false);
          this.count = 1;
        } else {
          this.countInCart = count;
          this.isInCart.set(true);
        }
      });
  }

  protected addToFavorite() {
    if (!this.isLogged) {
      this.snackBar.open('Для добавление в избранное необходимо авторизоваться');
      return;
    }
    this.favoriteService.addFavorite(this.product.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(error => {
          this.handleError(error, 'Ошибка при изменении избранного');
          return of(null)
        }))
      .subscribe((data: FavoriteType | DefaultResponseType | null) => {
        if (!data || (data as DefaultResponseType).error !== undefined) {
          throw new Error((data as DefaultResponseType).message);
        };
        this.product.isInFavorite = true;
        this.isInFavorite.set(true);
      })
  }

  protected removeFromFavorite() {
    this.favoriteService.removeFavorite(this.product.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(error => {
          this.handleError(error, 'Ошибка при изменении избранного');
          return of(null)
        })
      )
      .subscribe(
        (data: DefaultResponseType | null) => {
          if (!data || data.error) {
            console.error(data ? data.message : 'error');
          } else {
            console.log(data.message);
            this.product.isInFavorite = false;
            this.isInFavorite.set(false);
          }
        }
      )
  }

  private handleError(error: HttpErrorResponse, message: string): void {
    console.error(error);
    this.snackBar.open(message);
  }
}
