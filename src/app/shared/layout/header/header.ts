import { Component, DestroyRef, HostListener, inject, input, OnInit, signal } from '@angular/core';
import { CategoryWithType } from '../../../../types/category.type';
import { AuthService } from '../../../core/auth/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart-service';
import { ProductService } from '../../services/product';
import { ProductType } from '../../../../types/product.type';
import { environment } from '../../../../environments/environment';
import { FormControl } from '@angular/forms';
import { catchError, debounceTime, of } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActiveFilterService } from '../../services/active-filter-service';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);
  private readonly productService = inject(ProductService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly activeFilterService = inject(ActiveFilterService);

  protected isLogged = toSignal(this.authService.isLogged$, { initialValue: false });
  protected cartCount = toSignal(this.cartService.count$, { initialValue: 0 });
  protected staticServerPath = environment.serverStaticPath;
  protected products = signal<ProductType[]>([]);
  protected showProducts = signal<boolean>(false);
  protected searchField = new FormControl();

  public categories = input<CategoryWithType[]>();

  public ngOnInit(): void {
    this.searchField.valueChanges
      .pipe(
        debounceTime(500),
        takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        if (value && value.length > 2) {
          this.productService.searchProducts(value)
            .pipe(
              catchError(error => {
                console.error('Search error:', error);
                this.snackBar.open('Ошибка при поиске товаров');
                return of([]);
              }))
            .subscribe((data: ProductType[]) => {
              this.showProducts.set(true);
              this.products.set(data);
            })
        } else {
          this.products.set([]);
        }
      })
  }

  protected logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.doLogout();
      },
      error: () => {
        this.doLogout();
      }
    })
  }

  private doLogout(): void {
    this.authService.removeUser();
    this.snackBar.open('Вы вышли из системы');
    this.router.navigate(['/']);
  }

  @HostListener('document:click', ['$event'])
  protected click(event: Event): void {
    if (this.showProducts() && (event.target as HTMLElement).className.indexOf('search') === -1) {
      this.showProducts.set(false);
    }
  }

  protected selectProduct(url: string): void {
    this.router.navigate(['/product/' + url]);
    this.searchField.setValue('');
    this.products.set([]);
  }

  protected openFilter(category: CategoryWithType): void {
    if (category.urlTypes && category.urlTypes.length > 0) {
      this.activeFilterService.setActiveFilter({ types: category.urlTypes })
    }
  }
}
