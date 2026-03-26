import { Component, DestroyRef, inject, signal } from '@angular/core';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { ProductService } from '../../../shared/services/product';
import { CartService } from '../../../shared/services/cart-service';
import { CartType } from '../../../../types/cart.type';
import { environment } from '../../../../environments/environment';
import { DefaultResponseType } from '../../../../types/default-response.type';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, of } from 'rxjs';

@Component({
  selector: 'app-cart',
  standalone: false,
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class CartComponent {
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly destroyRef = inject(DestroyRef);

  protected cart = signal<CartType | null>(null);
  protected readonly serverPath: string = environment.serverStaticPath;
  protected totalAmount: number = 0;
  protected totalCount: number = 0;
  protected extraProducts = toSignal(this.productService.getBestProducts(), { initialValue: [] });  

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
    this.cartService.getCart()
      .pipe(
        takeUntilDestroyed(),
        catchError(error => {
          console.error(error);
          return of(null);
        }))
      .subscribe((data: CartType | DefaultResponseType | null) => {
        if (!data || (data as DefaultResponseType).error !== undefined) throw new Error((data as DefaultResponseType).message);
        this.cart.set(data as CartType);
        this.calculateTotal();
      })
  }

  private calculateTotal() {
    this.totalAmount = 0;
    this.totalCount = 0;
    if (this.cart()) {
      this.cart()?.items.forEach(item => {
        this.totalAmount += item.quantity * item.product.price;
        this.totalCount += item.quantity;
      })
    }
  }

  protected updateCount(id: string, value: number) {
    if (this.cart()) {
      this.cartService.updateCart(id, value)
        .pipe(
          debounceTime(500),
          takeUntilDestroyed(this.destroyRef),
          catchError(error => {
            console.error(error);
            return of(null)
          }))
        .subscribe((data: CartType | DefaultResponseType | null) => {
          if (!data || (data as DefaultResponseType).error !== undefined) throw new Error((data as DefaultResponseType).message);
          this.cart.set(data as CartType);
          this.calculateTotal();
        });

    }
  }
}
