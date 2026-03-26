import { Component, DestroyRef, inject, Input, OnInit, signal } from '@angular/core';
import { CategoryWithType } from '../../../../types/category.type';
import { ActiveParamsType } from '../../../../types/active-params.type';
import { ActiveFilterService } from '../../services/active-filter-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'category-filter',
  standalone: false,
  templateUrl: './category-filter.html',
  styleUrl: './category-filter.scss',
})
export class CategoryFilterComponent implements OnInit {
  private readonly activeFilterService = inject(ActiveFilterService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() category: CategoryWithType | null = null;
  @Input() type: string | null = null;

  protected activeParams: ActiveParamsType = { types: [] };
  protected open = signal<boolean>(false);
  protected from: number | null = null;
  protected to: number | null = null;

  public ngOnInit(): void {
    this.activeFilterService.activeFilter$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.activeParams = params;
        this.setActiveFilters(params);
      })
  }

  private setActiveFilters(params: ActiveParamsType): void {
    if (this.type) {
      if (this.type === 'height') {
        this.from = this.activeParams.heightFrom ? +this.activeParams.heightFrom : null;
        this.to = this.activeParams.heightTo ? +this.activeParams.heightTo : null;
        this.open.set(!!(this.from || this.to));
      }
      if (this.type === 'diameter') {
        this.from = this.activeParams.diameterFrom ? +this.activeParams.diameterFrom : null;
        this.to = this.activeParams.diameterTo ? +this.activeParams.diameterTo : null;
        this.open.set(!!(this.from || this.to));
      }
    } else {
      if (params['types']) {
        this.activeParams.types = Array.isArray(params['types']) ? params['types'] : [params['types']];
      }

      if (this.category && this.category.types.length > 0) {
        this.open.set(this.category.types.some((type) => this.activeParams.types.find((item) => item === type.url)));
      }
    }
  }

  protected toggleOpen(): void {
    this.open.set(!this.open());
  }

  protected isInclude(url: string): boolean {
    if (this.activeParams.types.length > 0) {
      return this.activeParams.types.includes(url);
    }
    return false;
  }

  protected get title(): string {
    if (this.type === 'diameter') return 'Диаметр';
    if (this.type === 'height') return 'Высота';
    return '';
  }

  protected updateFilterParam(url: string, checked: boolean): void {
    if (this.activeParams.types.length > 0) {
      const existingTypeInParams: string | undefined = this.activeParams.types.find((type) => type === url);
      if (existingTypeInParams && !checked) {
        this.activeParams.types = this.activeParams.types.filter((type) => type !== url);
      } else if (!existingTypeInParams && checked) {
        this.activeParams.types.push(url);
      }
    } else if (checked) {
      this.activeParams.types = [url];
    }
    this.activeParams.page = 1;
    this.activeFilterService.setActiveFilter(this.activeParams);
  }

  protected updateFilterParamFromTo(param: string, value: string): void {
    if (param === 'heightTo' || param === 'heightFrom' || param === 'diameterFrom' || param === 'diameterTo') {
      if (this.activeParams[param] && !value) {
        delete this.activeParams[param];
      } else {
        this.activeParams[param] = value;
      }
      this.activeFilterService.setActiveFilter(this.activeParams);
    }
  }
}
