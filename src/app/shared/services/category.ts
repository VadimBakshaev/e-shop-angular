import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CategoryType, CategoryWithType, TypesType } from '../../../types/category.type';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private http = inject(HttpClient);

  public getCategories(): Observable<CategoryType[]> {
    return this.http.get<CategoryType[]>(environment.api + 'categories');
  }

  public getCategoriesWithTypes(): Observable<CategoryWithType[]> {
    return this.http.get<TypesType[]>(environment.api + 'types')
      .pipe(
        map((items: TypesType[]) => {
          const array: CategoryWithType[] = [];
          items.forEach((item: TypesType) => {
            const foundItem: CategoryWithType | undefined = array.find((category) => item.category.url === category.url);
            if (foundItem) {
              foundItem.types.push({
                id: item.id,
                name: item.name,
                url: item.url
              })
            } else {
              array.push({
                id: item.category.id,
                name: item.category.name,
                url: item.category.url,
                types: [
                  {
                    id: item.id,
                    name: item.name,
                    url: item.url,
                  }
                ]
              })
            }
          })
          return array;
        })
      );
  }
}
