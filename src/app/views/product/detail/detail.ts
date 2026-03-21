import { Component, inject, OnInit, signal } from '@angular/core';
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
  private readonly _snackBar = inject(MatSnackBar);

  protected count: number = 1;
  protected readonly serverPath: string = environment.serverStaticPath;
  protected isInCart = signal<boolean>(false);
  protected products = signal<ProductType[]>([]);
  protected product = signal<ProductType | null>(null);
  protected customOptions: OwlOptions = {
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
    this.productService.getBestProducts()
      .subscribe((data: ProductType[]) => {
        this.products.set(data);
      });


    this.activatedRoute.paramMap.subscribe((data) => {
      const param: string | null = data.get('url');
      if (param)
        this.productService.getProduct(param)
          .subscribe((data: ProductType) => {
            this.product.set(data);

            this.cartService.getCart()
              .subscribe((cartData: CartType | DefaultResponseType) => {
                if ((cartData as DefaultResponseType).error !== undefined) throw new Error((cartData as DefaultResponseType).message);

                if (cartData) {
                  const productInCart = (cartData as CartType).items.find(item => item.product.id === data.id);
                  if (productInCart) {
                    this.product.update(current => current ? { ...current, countInCart: productInCart.quantity } : null);
                    //data.countInCart = productInCart.quantity;
                    this.count = productInCart.quantity;
                    this.isInCart.set(true);
                  }
                }
              });

            if (this.authService.getIsLoggedIn()) {
              this.favoriteService.getFavorites()
                .subscribe({
                  next: (favoriteData: FavoriteType[] | DefaultResponseType) => {
                    if (this.isErrorResponse(favoriteData)) {
                      throw new Error(favoriteData.message);
                    } else {
                      const currentProductExists: FavoriteType | undefined = favoriteData.find(item => item.id === this.product()?.id);
                      if (currentProductExists) this.product.update(current => current ? { ...current, isInFavorite: true } : null);
                    }
                  },
                  error: (error) => {
                    console.log(error);
                  }
                })
            };
          })
    })
  }

  protected updateCount(value: number) {
    this.count = value;
    const product = this.product();
    if (product && product.countInCart) {
      this.cartService.updateCart(product.id, this.count)
        .subscribe((data: CartType | DefaultResponseType) => {
          this.isInCart.set(true);
        });
    }
  }

  protected addToCart() {
    this.cartService.updateCart(this.product()!.id, this.count)
      .subscribe((data: CartType | DefaultResponseType) => {
        this.product.update(current => current ? { ...current, countInCart: this.count } : null);
        this.isInCart.set(true);
      });
  }

  protected remove() {
    this.cartService.updateCart(this.product()!.id, 0)
      .subscribe((data: CartType | DefaultResponseType) => {
        this.isInCart.set(false);
        this.count = 1;
      });
  }

  protected addToFavorite() {
    if (!this.authService.getIsLoggedIn()) {
      this._snackBar.open('Для добавление в избранное необходимо авторизоваться');
      return;
    }
    this.favoriteService.addFavorite(this.product()!.id)
      .subscribe((data: FavoriteType | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          throw new Error((data as DefaultResponseType).message);
        };
        this.product.update(current => current ? { ...current, isInFavorite: true } : null);
      })
  }

  protected removeFromFavorite() {
    this.favoriteService.removeFavorite(this.product()!.id).subscribe(
      (data: DefaultResponseType) => {
        if (data.error) {
          console.error(data.message);
        } else {
          console.log(data.message);
          this.product.update(current => current ? { ...current, isInFavorite: false } : null);
        }
      }
    )
  }

  private isErrorResponse(data: any): data is DefaultResponseType {
    return data && typeof data === 'object' && 'error' in data;
  }
}
