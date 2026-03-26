import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { ProductType } from '../../../../types/product.type';
import { ProductService } from '../../../shared/services/product';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { CartType } from '../../../../types/cart.type';
import { CartService } from '../../../shared/services/cart-service';
import { FavoriteService } from '../../../shared/services/favorite-service';
import { FavoriteType } from '../../../../types/favorite.type';
import { DefaultResponseType } from '../../../../types/default-response.type';
import { AuthService } from '../../../core/auth/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Observable, map, catchError, of, combineLatest, switchMap, debounceTime } from 'rxjs';

@Component({
  selector: 'app-detail',
  standalone: false,
  templateUrl: './detail.html',
  styleUrl: './detail.scss',
})
export class DetailComponent {
  private readonly productService = inject(ProductService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly cartService = inject(CartService);
  private readonly favoriteService = inject(FavoriteService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef: DestroyRef = inject(DestroyRef);

  protected count: number = 1;
  protected isInCart = signal<boolean>(false);
  protected product = signal<ProductType | null>(null);
  protected readonly products = toSignal(this.productService.getBestProducts(), { initialValue: [] });
  protected readonly serverPath: string = environment.serverStaticPath;
  protected readonly customOptions: OwlOptions = {
    loop: true,
    mouseDrag: false,
    touchDrag: false,
    pullDrag: false,
    dots: false,
    margin: 24,
    navSpeed: 700,
    navText: ['', ''],
    responsive: {
      0: {
        items: 1
      },
      400: {
        items: 2
      },
      740: {
        items: 3
      },
      940: {
        items: 4
      }
    },
    nav: false
  }

  constructor() {
    this.activatedRoute.params.pipe(
      takeUntilDestroyed(),
      switchMap(params => {
        if (params['url']) this.detailInit(params['url']);
        return of(void 0);
      }),
      catchError(error => {
        console.error('Error loading product:', error);
        this.snackBar.open('Ошибка загрузки товара');
        return of(null);
      })
    ).subscribe()
  }

  private detailInit(url: string): void {
    combineLatest({
      product: this.loadProductHandle(url),
      cart: this.loadCartHandle(),
      isLoggedIn: of(this.authService.getIsLoggedIn())
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap(({ product, cart, isLoggedIn }) => {

        if (isLoggedIn) {
          return this.loadFavoritesHandle().pipe(
            map(favorites => ({ product, cart, favorites }))
          )
        }

        return of({ product, cart, favorites: null })
      })
    ).subscribe({
      next: ({ product, cart, favorites }) => {
        if (product && cart) {
          const productInCart = cart.items.find(item => item.product.id === product.id);
          if (productInCart) {
            product.countInCart = productInCart.quantity;
            this.count = productInCart.quantity;
            this.isInCart.set(true);
          }
        }
        if (product && favorites) {
          const currentProductExists: FavoriteType | undefined = favorites.find(item => item.id === product.id);
          if (currentProductExists) product.isInFavorite = true;
        }
        this.product.set(product);
      }
    })
  }

  private loadProductHandle(url: string): Observable<ProductType | null> {
    return this.productService.getProduct(url).pipe(
      map(respnse => {
        if (this.isErrorResponse(respnse)) {
          console.error(respnse.message);
          return null;
        };
        return respnse as ProductType;
      }),
      catchError(error => {
        console.error('Network error loading product:', error);
        return of(null);
      })
    )
  }
  private loadCartHandle(): Observable<CartType | null> {
    return this.cartService.getCart().pipe(
      map(respnse => {
        if (this.isErrorResponse(respnse)) {
          console.error(respnse.message);
          return null;
        };
        return respnse as CartType;
      }),
      catchError(error => {
        console.error('Network error loading cart:', error);
        return of(null);
      })
    )
  }

  private loadFavoritesHandle(): Observable<FavoriteType[] | null> {
    return this.favoriteService.getFavorites().pipe(
      map(respnse => {
        if (this.isErrorResponse(respnse)) {
          console.error(respnse.message);
          return null;
        };
        return respnse as FavoriteType[];
      }),
      catchError(error => {
        console.error('Network error loading favorites:', error);
        return of(null);
      })
    )
  }

  protected updateCount(value: number): void {
    const product = this.product();
    if (!product?.id) return;
    this.count = value;
    if (product && product.countInCart) {
      this.updateCartQuantity(product.id, value);
      this.isInCart.set(true);
    }
  }

  protected addToCart(): void {
    const product = this.product();
    if (!product?.id) return;
    this.updateCartQuantity(product.id, this.count);
    this.isInCart.set(true);
  }

  protected removeFromCart(): void {
    const product = this.product();
    if (!product?.id) return;
    this.updateCartQuantity(product.id, 0);
    this.isInCart.set(false);
  }

  private updateCartQuantity(productId: string, quantity: number): void {
    this.cartService.updateCart(productId, quantity).pipe(
      debounceTime(500),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(response => {
      if (this.isErrorResponse(response)) {
        this.snackBar.open(response.message);
        return;
      }
      if (quantity === 0) {
        this.count = 1;
      }
      this.product.update(current =>
        current ? { ...current, countInCart: quantity } : null
      );
    });
  }

  protected toggleFavorite(): void {
    const product = this.product();
    if (!product?.id) return;

    if (!this.authService.getIsLoggedIn()) {
      this.snackBar.open('Для добавления в избранное необходимо авторизоваться');
      return;
    }

    const request$ = product.isInFavorite
      ? this.favoriteService.removeFavorite(product.id)
      : this.favoriteService.addFavorite(product.id);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(response => {
      if (this.isErrorResponse(response)) {
        this.snackBar.open(response.message);
        return;
      }

      this.product.update(current =>
        current ? { ...current, isInFavorite: !current.isInFavorite } : null
      );

      const message = product.isInFavorite
        ? 'Товар удален из избранного'
        : 'Товар добавлен в избранное';
      this.snackBar.open(message);
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
