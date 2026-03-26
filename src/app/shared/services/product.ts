import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProductType, ResponseProductType } from '../../../types/product.type';
import { ActiveParamsType } from '../../../types/active-params.type';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private http = inject(HttpClient);

  public getBestProducts(): Observable<ProductType[]> {
    return this.http.get<ProductType[]>(environment.api + 'products/best');
  }

  public getProducts(params: ActiveParamsType): Observable<ResponseProductType> {
    return this.http.get<ResponseProductType>(environment.api + 'products', {
      params: params
    });
  }

  public searchProducts(query: string): Observable<ProductType[] > {
    return this.http.get< ProductType[] >(environment.api + 'products/search?query=' + query);
  }

  public getProduct(url: string): Observable<ProductType> {
    return this.http.get<ProductType>(environment.api + 'products/' + url);
  }
}
