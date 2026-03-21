import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ProductService } from '../../../shared/services/product';
import { ProductType } from '../../../../types/product.type';
import { CategoryService } from '../../../shared/services/category';
import { CategoryWithType } from '../../../../types/category.type';
import { ActivatedRoute, Params } from '@angular/router';
import { ActiveParamsType } from '../../../../types/active-params.type';
import { AppliedFilterType } from '../../../../types/applied-filter.type';
import { ActiveFilterService } from '../../../shared/services/active-filter-service';
import { debounceTime, Subscription } from 'rxjs';
import { CartService } from '../../../shared/services/cart-service';
import { CartItems, CartType } from '../../../../types/cart.type';
import { FavoriteService } from '../../../shared/services/favorite-service';
import { DefaultResponseType } from '../../../../types/default-response.type';
import { FavoriteType } from '../../../../types/favorite.type';
import { AuthService } from '../../../core/auth/auth';

@Component({
  selector: 'app-catalog',
  standalone: false,
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss',
})
export class CatalogComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly activeFilterService = inject(ActiveFilterService);
  private readonly cartService = inject(CartService);
  private readonly favoriteService = inject(FavoriteService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef: DestroyRef = inject(DestroyRef);
  private currentParams: Params = { ...this.activatedRoute.snapshot.queryParams };

  protected activeParams: ActiveParamsType = { types: [] };
  protected products = signal<ProductType[]>([]);
  protected categoriesWithTypes = signal<CategoryWithType[]>([]);
  protected appliedFilters = signal<AppliedFilterType[]>([]);
  protected cart = signal<CartType | null>(null);
  protected open = signal<boolean>(false);
  protected sortingOptions: { name: string, value: string }[] = [
    { name: 'От А до Я', value: 'az-asc' },
    { name: 'От Я до А', value: 'az-desc' },
    { name: 'По возрастанию цены', value: 'price-asc' },
    { name: 'По убыванию цены', value: 'price-desc' },
  ];
  protected pages: number[] = [];
  protected favoriteProducts: FavoriteType[] | null = null;

  constructor() {
    this.cartService.getCart()
      .subscribe((data: CartType | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) throw new Error((data as DefaultResponseType).message);
        this.cart.set(data as CartType);
        if (this.authService.getIsLoggedIn()) {
          this.favoriteService.getFavorites()
            .subscribe({
              next: (favoritesData: FavoriteType[] | DefaultResponseType) => {
                if ((favoritesData as DefaultResponseType).error !== undefined) {
                  this.processCatalog();
                  throw new Error((favoritesData as DefaultResponseType).message);
                };
                this.favoriteProducts = favoritesData as FavoriteType[];
                this.processCatalog();
              },
              error: (error) => {
                this.processCatalog();
              }
            });
        } else {
          this.processCatalog();
        }
      })


    this.categoryService.getCategoriesWithTypes()
      .subscribe((data: CategoryWithType[]) => {
        console.log(data);
        this.categoriesWithTypes.set(data);

        if (this.currentParams['types']) {
          this.activeParams.page = 1;
          this.activeFilterService.setActiveFilter(this.currentParams);
          this.setAppliedFilter();
        }
      });

    // this.destroyRef.onDestroy(() => {
    //   subscription.unsubscribe();
    // });
  }

  public ngOnInit(): void {

  }

  private processCatalog() {
    this.activeFilterService.activeFilter$
      .pipe(debounceTime(500))
      .subscribe((params) => {
        console.log('Компонент получил новые фильтры:', params);
        this.activeParams = params;
        this.setAppliedFilter();
        this.productService.getProducts(this.activeParams)
          .subscribe((data) => {
            this.pages = [];
            for (let i = 1; i <= data.pages; i++) {
              this.pages.push(i);
            };

            if (this.cart() && this.cart()!.items.length > 0) {
              data.items.map((product: ProductType) => {
                const productInCart: CartItems | undefined = this.cart()?.items.find(item => item.product.id === product.id);
                if (productInCart) {
                  product.countInCart = productInCart.quantity;
                }
                return product;
              })
            };

            if (this.favoriteProducts) {
              data.items.map(product => {
                const productInFavorite: FavoriteType | undefined = this.favoriteProducts?.find(item => item.id === product.id);
                if (productInFavorite) {
                  product.isInFavorite = true;
                }
                return product;
              })
            };
            this.products.set(data.items);
            console.log('data in catalog',data.items);
          });
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

  protected removeAppliedFilter(filter: AppliedFilterType) {
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

  protected sort(value: string) {
    this.activeParams.sort = value;
    this.activeParams.page = 1;
    this.activeFilterService.setActiveFilter(this.activeParams);
  }

  protected openPage(page: number) {
    this.activeParams.page = page;
    this.activeFilterService.setActiveFilter(this.activeParams);
  }

  protected openPrevPage() {
    if (this.activeParams.page && this.activeParams.page > 1) {
      this.activeParams.page--;
      this.activeFilterService.setActiveFilter(this.activeParams);
    }
  }

  protected openNextPage() {
    if (this.activeParams.page && this.activeParams.page < this.pages.length) {
      this.activeParams.page++;
      this.activeFilterService.setActiveFilter(this.activeParams);
    } else if (!this.activeParams.page && this.pages.length > 0) {
      this.activeParams.page = 2;
      this.activeFilterService.setActiveFilter(this.activeParams);
    }
  }
}
