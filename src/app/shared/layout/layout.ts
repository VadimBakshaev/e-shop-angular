import { Component, inject, OnInit, signal } from '@angular/core';
import { CategoryType, CategoryWithType } from '../../../types/category.type';
import { CategoryService } from '../services/category';

@Component({
  selector: 'app-layout',
  standalone: false,
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class LayoutComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);

  protected categories = signal<CategoryWithType[]>([]);

  public ngOnInit(): void {
    this.categoryService.getCategoriesWithTypes().subscribe((categories: CategoryWithType[]) => {
      this.categories.set(
        categories.map(item => Object.assign(
          { urlTypes: item.types.map(item => item.url) }, item)));
    })
  }
}
