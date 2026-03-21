import { Component, HostListener, inject, input, OnInit, signal } from '@angular/core';
import { CategoryType, CategoryWithType } from '../../../../types/category.type';
import { AuthService } from '../../../core/auth/auth';
import { DefaultResponseType } from '../../../../types/default-response.type';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart-service';
import { ProductService } from '../../services/product';
import { ProductType } from '../../../../types/product.type';
import { environment } from '../../../../environments/environment';
import { FormControl } from '@angular/forms';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);
  private readonly productService = inject(ProductService);

  protected isLogged = signal<boolean>(false);
  protected cartCount = signal<number>(0);
  protected staticServerPath = environment.serverStaticPath;
  //protected searchValue: string = '';
  protected products = signal<ProductType[]>([]);
  protected showProducts = signal<boolean>(false);
  protected searchField = new FormControl();

  public categories = input.required<CategoryWithType[]>();

  constructor() {
    this.isLogged.set(this.authService.getIsLoggedIn());
    this.cartService.getCartCount().subscribe(count => {
      if ((count as DefaultResponseType).error !== undefined) throw new Error((count as DefaultResponseType).message);
      this.cartCount.set((count as { count: number }).count);
    });
    this.cartService.count$.subscribe(count => {
      this.cartCount.set(count);
    })
  }

  public ngOnInit(): void {
    this.authService.isLogged$.subscribe((isLoggedIn: boolean) => {
      this.isLogged.set(isLoggedIn);
    });

    this.searchField.valueChanges
      .pipe(
        debounceTime(500)
      )
      .subscribe(value => {
        if (value && value.length > 2) {
          this.productService.searchProducts(value)
            .subscribe((data: ProductType[]) => {
              this.showProducts.set(true);
              this.products.set(data);
            })
        } else {
          this.products.set([]);
        }
      })
  }

  protected logout() {
    this.authService.logout().subscribe({
      next: (data: DefaultResponseType) => {
        this.doLogout();
      },
      error: () => {
        this.doLogout();
      }
    })
  }

  private doLogout(): void {
    this.authService.removeUser();
    this._snackBar.open('Вы вышли из системы');
    this.router.navigate(['/']);
  }

  // protected changedSearchValue(newValue: string) {
  //   this.searchValue = newValue;
  //   this.showProducts = true;
  //   if (this.searchValue && this.searchValue.length > 2) {
  //     this.productService.searchProducts(this.searchValue)
  //       .subscribe((data: ProductType[]) => {
  //         this.products.set(data);          
  //       })
  //   } else {
  //     this.products.set([]);
  //   }
  // }

  @HostListener('document:click', ['$event'])
  click(event: Event) {
    if (this.showProducts && (event.target as HTMLElement).className.indexOf('search') === -1) {
      this.showProducts.set(false);
    }
  }

  protected selectProduct(url: string) {
    this.router.navigate(['/product/' + url]);
    this.searchField.setValue('');
    this.products.set([]);
  }
}
