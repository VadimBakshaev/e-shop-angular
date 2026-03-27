import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FavoriteService } from '../../../shared/services/favorite-service';
import { FavoriteType } from '../../../../types/favorite.type';
import { DefaultResponseType } from '../../../../types/default-response.type';
import { environment } from '../../../../environments/environment';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { CartService } from '../../../shared/services/cart-service';
import { catchError, combineLatest, filter, throwError } from 'rxjs';
import { CartType } from '../../../../types/cart.type';
import { MatSnackBar } from '@angular/material/snack-bar';

interface FavoriteWithCartType extends FavoriteType {
  isInCart: boolean,
  quantity: number
}

@Component({
  selector: 'app-favorite',
  standalone: false,
  templateUrl: './favorite.html',
  styleUrl: './favorite.scss',
})
export class FavoriteComponent {
  private readonly favoriteService = inject(FavoriteService);
  private readonly cartService = inject(CartService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar = inject(MatSnackBar);

  protected cart = toSignal(this.cartService.getCart(), { initialValue: null });
  protected products = signal<FavoriteWithCartType[]>([]);
  protected serverDefault: string = environment.serverStaticPath;

  constructor() {
    combineLatest([
      this.favoriteService.getFavorites(),
      toObservable(this.cart).pipe(filter(cart => cart !== null))
    ]).pipe(
      takeUntilDestroyed(),
      catchError((error) => {
        this.snackBar.open('Ошибка при загрузке избранного');
        return throwError(() => error);
      })
    ).subscribe({
      next: ([favorites, cart]) => {
        if (this.isErrorResponse(favorites)) {
          this.snackBar.open(favorites.message);
          return;
        }
        if (this.isErrorResponse(cart)) {
          this.snackBar.open(cart.message);
          return;
        }
        const richProducts = this.enrichProductsWithCart(favorites, cart);
        this.products.set(richProducts);
      }
    })
  }

  private enrichProductsWithCart(
    favorites: FavoriteType[],
    cart: CartType
  ): FavoriteWithCartType[] {
    return favorites.map(product => {
      const cartItem = cart.items.find(
        cartItem => cartItem.product.id === product.id
      );

      return {
        ...product,
        isInCart: !!cartItem,
        quantity: cartItem?.quantity ?? 0
      };
    });
  }

  protected removeFromFavorites(id: string) {
    this.favoriteService.removeFavorite(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(
        (data: DefaultResponseType) => {
          if (data.error) {
            console.error(data.message);
          } else {
            this.products.update(products => products.filter(product => product.id !== id));
          }
        }
      )
  }

  protected updateCartQuantity(productId: string, quantity: number): void {
    this.cartService.updateCart(productId, quantity).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(response => {
      if (this.isErrorResponse(response)) {
        this.snackBar.open(response.message);
        return;
      };
      this.products.update(products =>
        products.map(product =>
          product.id === productId
            ? { ...product, quantity, isInCart: quantity > 0 }
            : product
        )
      );
    });
  }

  private isErrorResponse<T>(response: T | DefaultResponseType): response is DefaultResponseType {
    return response &&
      typeof response === 'object' &&
      'error' in response &&
      response.error === true &&
      'message' in response;
  }
}
