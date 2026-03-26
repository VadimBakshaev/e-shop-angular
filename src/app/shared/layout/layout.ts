import { Component, inject } from '@angular/core';
import { CategoryWithType } from '../../../types/category.type';
import { CategoryService } from '../services/category';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';

@Component({
  selector: 'app-layout',
  standalone: false,
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class LayoutComponent {
  private readonly categoryService = inject(CategoryService);
  
  protected categories = toSignal(
    this.categoryService.getCategoriesWithTypes().pipe(
      map((categories: CategoryWithType[]) => this.enrichCategoriesWithUrls(categories)),
      catchError((error: HttpErrorResponse) => {
        console.error(error);
        return of([]);
      })
    ),
    { initialValue: [] }
  )
  
  private enrichCategoriesWithUrls(categories: CategoryWithType[]): CategoryWithType[] {
    return categories.map(category => ({
      ...category,
      urlTypes: category.types.map(type => type.url)
    }));
  }
  
  
  // Это то же рабочий код, только добавить импорты
  // private readonly destroyRef = inject(DestroyRef);
  // protected categories = signal<CategoryWithType[]>([]);

  // public ngOnInit(): void {
  //   this.categoryService.getCategoriesWithTypes()
  //     .pipe(takeUntilDestroyed(this.destroyRef))
  //     .subscribe({
  //       next: (categories: CategoryWithType[]) => {
  //         this.categories.set(
  //           categories.map(item => Object.assign(
  //             { urlTypes: item.types.map(item => item.url) }, item)));
  //       },
  //       error: (error: HttpErrorResponse) => console.error(error)
  //     })
  // }  
}
