import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ProductService } from '../../../shared/services/product';
import { ProductType, ResponseProductType } from '../../../../types/product.type';
import { CategoryService } from '../../../shared/services/category';
import { CategoryWithType } from '../../../../types/category.type';
import { ActivatedRoute, Params } from '@angular/router';
import { ActiveParamsType } from '../../../../types/active-params.type';
import { AppliedFilterType } from '../../../../types/applied-filter.type';
import { ActiveFilterService } from '../../../shared/services/active-filter-service';
import { catchError, combineLatest, debounceTime, map, Observable, of, switchMap } from 'rxjs';
import { CartService } from '../../../shared/services/cart-service';
import { CartType } from '../../../../types/cart.type';
import { FavoriteService } from '../../../shared/services/favorite-service';
import { DefaultResponseType } from '../../../../types/default-response.type';
import { FavoriteType } from '../../../../types/favorite.type';
import { AuthService } from '../../../core/auth/auth';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-catalog',
  standalone: false,
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss',
})
export class CatalogComponent {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly activeFilterService = inject(ActiveFilterService);
  private readonly cartService = inject(CartService);
  private readonly favoriteService = inject(FavoriteService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef: DestroyRef = inject(DestroyRef);

  protected activeParams: ActiveParamsType = { types: [] };
  protected products = signal<ProductType[]>([]);
  protected categoriesWithTypes = signal<CategoryWithType[]>([]);
  protected appliedFilters = signal<AppliedFilterType[]>([]);
  protected cart = signal<CartType | null>(null);
  protected open = signal<boolean>(false);
  protected readonly sortingOptions: { name: string, value: string }[] = [
    { name: 'От А до Я', value: 'az-asc' },
    { name: 'От Я до А', value: 'az-desc' },
    { name: 'По возрастанию цены', value: 'price-asc' },
    { name: 'По убыванию цены', value: 'price-desc' },
  ];
  protected pages: number[] = [];
  protected favoriteProducts: FavoriteType[] | null = null;

  constructor() {
    this.catalogInit();
  }

  private catalogInit(): void {
    const initialData$ = combineLatest({
      cart: this.loadCartHandle(),
      categories: this.loadCategoriesHandle(),
      isLoggedIn: of(this.authService.getIsLoggedIn())
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap(({ cart, categories, isLoggedIn }) => {
        this.cart.set(cart);
        this.categoriesWithTypes.set(categories);

        if (isLoggedIn) {
          return this.loadFavoritesHandle().pipe(
            map(favorites => ({ categories, cart, favorites }))
          )
        };

        return of({ categories, cart, favorites: null });
      })
    );

    initialData$.subscribe({
      next: ({ favorites }) => {
        this.favoriteProducts = favorites;
        this.filtersInit();
        this.processCatalog();
      },
      error: (error) => {
        console.error('Error catalog init', error);
      }
    })
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

  private loadCategoriesHandle(): Observable<CategoryWithType[]> {
    return this.categoryService.getCategoriesWithTypes().pipe(
      map(respnse => {
        if (this.isErrorResponse(respnse)) {
          console.error(respnse.message);
          return [];
        };
        return respnse as CategoryWithType[];
      }),
      catchError(error => {
        console.error('Network error loading categories:', error);
        return of([]);
      })
    )
  }

  private isErrorResponse<T>(response: T | DefaultResponseType): response is DefaultResponseType {
    return response &&
      typeof response === 'object' &&
      'error' in response &&
      response.error === true &&
      'message' in response;
  }

  private filtersInit(): void {
    const currentParams = this.activatedRoute.snapshot.queryParams;

    if (currentParams['types'] || this.hasRangeParams(currentParams)) {
      this.activeParams = {
        ...this.activeParams,
        page: 1,
        ...currentParams
      };
      this.activeFilterService.setActiveFilter(this.activeParams);
      this.setAppliedFilter();
    }
  }

  private hasRangeParams(params: Params): boolean {
    const rangeParams = ['heightFrom', 'heightTo', 'diameterFrom', 'diameterTo'];
    return rangeParams.some(param => param in params);
  }

  private processCatalog(): void {
    this.activeFilterService.activeFilter$
      .pipe(
        debounceTime(500),
        takeUntilDestroyed(this.destroyRef),
        switchMap(params => this.loadProductsHandle(params))
      ).subscribe({
        next: (products) => {
          this.products.set(products);
        },
        error: (error) => {
          console.error('Failed to load products:', error);
          this.products.set([]);
        }
      })
  }

  private loadProductsHandle(params: ActiveParamsType): Observable<ProductType[]> {
    this.activeParams = params;
    this.setAppliedFilter();

    return this.productService.getProducts(params).pipe(
      map(response => this.handleProductsResponse(response)),
      catchError(error => {
        console.error('Network error while loading products:', error);
        return of([]);
      })
    );
  }

  private handleProductsResponse(response: ResponseProductType | DefaultResponseType): ProductType[] {
    if (this.isErrorResponse(response)) {
      console.error('Products API returned error:', response.message);
      return [];
    }
    this.pages = [];
    for (let i = 1; i <= response.pages; i++) {
      this.pages.push(i);
    };

    return this.setProductsWithCartAndFavorites(response.items as ProductType[]);
  }

  private setProductsWithCartAndFavorites(products: ProductType[]): ProductType[] {
    const cart = this.cart();
    const favorites = this.favoriteProducts;

    return products.map(product => {
      const settedProduct = { ...product };
      if (cart?.items) {
        const cartItem = cart.items.find(item => item.product.id === product.id);
        if (cartItem) {
          settedProduct.countInCart = cartItem.quantity;
        }
      };
      if (favorites) {
        settedProduct.isInFavorite = favorites.some(fav => fav.id === product.id);
      };

      return settedProduct;
    });
  }

  private setAppliedFilter(): void {
    this.appliedFilters.set([]);
    this.activeParams.types.forEach((url) => {
      for (let i = 0; i < this.categoriesWithTypes().length; i++) {
        const foundType = this.categoriesWithTypes()[i].types.find((type) => type.url === url);
        if (foundType) {
          this.appliedFilters.update(filters => [...filters, {
            name: foundType.name,
            urlParam: foundType.url
          }]);
        }
      }
    });
    if (this.activeParams.heightFrom) {
      this.appliedFilters.update(filters => [...filters, {
        name: `Высота: от ${this.activeParams.heightFrom} см`,
        urlParam: 'heightFrom'
      }])
    };
    if (this.activeParams.heightTo) {
      this.appliedFilters.update(filters => [...filters, {
        name: `Высота: до ${this.activeParams.heightTo} см`,
        urlParam: 'heightTo'
      }])
    };
    if (this.activeParams.diameterFrom) {
      this.appliedFilters.update(filters => [...filters, {
        name: `Диаметр: от ${this.activeParams.diameterFrom} см`,
        urlParam: 'diameterFrom'
      }])
    };
    if (this.activeParams.diameterTo) {
      this.appliedFilters.update(filters => [...filters, {
        name: `Диаметр: до ${this.activeParams.diameterTo} см`,
        urlParam: 'diameterTo'
      }])
    };
  }

  protected removeAppliedFilter(filter: AppliedFilterType): void {
    if (filter.urlParam === 'heightFrom' ||
      filter.urlParam === 'heightTo' ||
      filter.urlParam === 'diameterFrom' ||
      filter.urlParam === 'diameterTo') {
      delete this.activeParams[filter.urlParam]
    } else {
      this.activeParams.types = this.activeParams.types.filter(type => type !== filter.urlParam);
    };
    this.activeParams.page = 1;
    this.activeFilterService.setActiveFilter(this.activeParams);
  }

  protected toggleOpen(): void {
    this.open.set(!this.open());
  }

  protected sort(value: string): void {
    this.activeParams.sort = value;
    this.activeParams.page = 1;
    this.activeFilterService.setActiveFilter(this.activeParams);
  }

  protected openPage(page: number): void {
    this.activeParams.page = page;
    this.activeFilterService.setActiveFilter(this.activeParams);
  }

  protected openPrevPage(): void {
    if (this.activeParams.page && this.activeParams.page > 1) {
      this.activeParams.page--;
      this.activeFilterService.setActiveFilter(this.activeParams);
    }
  }

  protected openNextPage(): void {
    if (this.activeParams.page && this.activeParams.page < this.pages.length) {
      this.activeParams.page++;
      this.activeFilterService.setActiveFilter(this.activeParams);
    } else if (!this.activeParams.page && this.pages.length > 0) {
      this.activeParams.page = 2;
      this.activeFilterService.setActiveFilter(this.activeParams);
    }
  }
}
