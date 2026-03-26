import { Component, inject, input } from '@angular/core';
import { CategoryWithType } from '../../../../types/category.type';
import { ActiveFilterService } from '../../services/active-filter-service';

@Component({
  selector: 'app-footer',
  standalone: false,
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class FooterComponent {
  private readonly activeFilterService = inject(ActiveFilterService);

  public categories = input<CategoryWithType[]>();

  protected openFilter(category: CategoryWithType): void {
    if (category.urlTypes && category.urlTypes.length > 0) {
      this.activeFilterService.setActiveFilter({ types: category.urlTypes })
    }
  }
}
