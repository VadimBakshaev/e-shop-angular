import { Component, DestroyRef, inject, signal } from '@angular/core';
import { LoaderService } from '../../services/loader-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'loader',
  standalone: false,
  templateUrl: './loader.html',
  styleUrl: './loader.scss',
})
export class LoaderComponent {
  private readonly loaderService = inject(LoaderService);  

  protected isShowed = signal<boolean>(false);

  constructor() {
    this.loaderService.isShowed$
      .pipe(takeUntilDestroyed())
      .subscribe((show: boolean) => {
        this.isShowed.set(show);
      })
  }
}
