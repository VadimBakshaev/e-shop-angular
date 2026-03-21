import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FavoriteType } from '../../../types/favorite.type';
import { DefaultResponseType } from '../../../types/default-response.type';

@Injectable({
  providedIn: 'root',
})
export class FavoriteService {
  private readonly http = inject(HttpClient);

  public getFavorites(): Observable<FavoriteType[] | DefaultResponseType> {
    return this.http.get<FavoriteType[] | DefaultResponseType>(environment.api + 'favorites');
  }

  public removeFavorite(productId: string): Observable<DefaultResponseType> {
    return this.http.delete<DefaultResponseType>(environment.api + 'favorites', { body: { productId } });
  }

  public addFavorite(productId: string): Observable<FavoriteType | DefaultResponseType> {
    return this.http.post<FavoriteType | DefaultResponseType>(environment.api + 'favorites', { productId });
  }
}
