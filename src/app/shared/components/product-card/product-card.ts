import { Component, inject, input, Input, OnInit, signal } from '@angular/core';
import { ProductType } from '../../../../types/product.type';
import { environment } from '../../../../environments/environment';
import { CartService } from '../../services/cart-service';
import { CartType } from '../../../../types/cart.type';
import { AuthService } from '../../../core/auth/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FavoriteService } from '../../services/favorite-service';
import { DefaultResponseType } from '../../../../types/default-response.type';
import { FavoriteType } from '../../../../types/favorite.type';

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
  private readonly _snackBar = inject(MatSnackBar);
  private readonly favoriteService = inject(FavoriteService);

  protected readonly serverPath: string = environment.serverStaticPath;
  //protected count = signal<number>(1);
  protected count: number = 1;
  protected isInCart = signal<boolean>(false);
  protected isInFavorite = signal<boolean>(false);

  public ngOnInit(): void {
    console.log('ProductCardComponent activeted');
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
      console.log('updateCount ', this.countInCart);
      this.cartService.updateCart(this.product.id, this.count)
        .subscribe((data: CartType | DefaultResponseType) => {
          this.countInCart = this.count;
          this.isInCart.set(true);
        });
    }
  }

  protected addToCart() {
    this.cartService.updateCart(this.product.id, this.count)
      .subscribe((data: CartType | DefaultResponseType) => {
        this.countInCart = this.count;
        this.isInCart.set(true);
      });
  }

  protected remove() {
    this.cartService.updateCart(this.product.id, 0)
      .subscribe((data: CartType | DefaultResponseType) => {
        this.countInCart = 0;
        this.isInCart.set(false);
        this.count = 1;
      });
  }

  protected addToFavorite() {
    if (!this.authService.getIsLoggedIn()) {
      this._snackBar.open('Для добавление в избранное необходимо авторизоваться');
      return;
    }
    this.favoriteService.addFavorite(this.product.id)
      .subscribe((data: FavoriteType | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          throw new Error((data as DefaultResponseType).message);
        };
        this.product.isInFavorite = true;
        this.isInFavorite.set(true);
      })
  }

  protected removeFromFavorite() {

    this.favoriteService.removeFavorite(this.product.id).subscribe(
      (data: DefaultResponseType) => {
        if (data.error) {
          console.error(data.message);
        } else {
          console.log(data.message);
          this.product.isInFavorite = false;
          this.isInFavorite.set(false);
        }
      }
    )
  }
}
