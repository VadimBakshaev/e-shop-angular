import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FavoriteService } from '../../../shared/services/favorite-service';
import { FavoriteType } from '../../../../types/favorite.type';
import { DefaultResponseType } from '../../../../types/default-response.type';
import { environment } from '../../../../environments/environment';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-favorite',
  standalone: false,
  templateUrl: './favorite.html',
  styleUrl: './favorite.scss',
})
export class FavoriteComponent {
  private readonly favoriteService = inject(FavoriteService);
  private readonly destroyRef = inject(DestroyRef);

  protected products = signal<FavoriteType[]>([]);
  protected serverDefault: string = environment.serverStaticPath;

  constructor() {
    this.favoriteService.getFavorites()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (data: FavoriteType[] | DefaultResponseType) => {
          if (this.isErrorResponse(data)) {
            throw new Error(data.message);
          } else {
            this.products.set(data);
          }
        },
        error: (error) => {
          console.error(error);
        }
      })
  }

  protected removeFromFavorites(id: string) {
    this.favoriteService.removeFavorite(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(
        (data: DefaultResponseType) => {
          if (data.error) {
            console.error(data.message);
          } else {
            this.products.update(products => products.filter(product => product.id !== id));            
          }
        }
      )
  }

  private isErrorResponse(data: any): data is DefaultResponseType {
    return data && typeof data === 'object' && 'error' in data;
  }
}
