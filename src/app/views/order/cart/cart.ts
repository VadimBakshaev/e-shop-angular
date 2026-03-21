import { Component, inject, signal } from '@angular/core';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { ProductType } from '../../../../types/product.type';
import { ProductService } from '../../../shared/services/product';
import { CartService } from '../../../shared/services/cart-service';
import { CartType } from '../../../../types/cart.type';
import { environment } from '../../../../environments/environment';
import { DefaultResponseType } from '../../../../types/default-response.type';

@Component({
  selector: 'app-cart',
  standalone: false,
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class CartComponent {
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);

  protected extraProducts = signal<ProductType[]>([]);
  protected cart = signal<CartType | null>(null);
  protected readonly serverPath: string = environment.serverStaticPath;
  protected totalAmount: number = 0;
  protected totalCount: number = 0;

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
        this.extraProducts.set(data);
      });

    this.cartService.getCart().subscribe((data: CartType | DefaultResponseType) => {
      if ((data as DefaultResponseType).error !== undefined) throw new Error((data as DefaultResponseType).message);
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
        .subscribe((data: CartType | DefaultResponseType) => {
          if ((data as DefaultResponseType).error !== undefined) throw new Error((data as DefaultResponseType).message);
          this.cart.set(data as CartType);
          this.calculateTotal();
        });

    }
  }
}
