import { Component, inject, signal } from '@angular/core';
import { LoaderService } from '../../services/loader-service';

@Component({
  selector: 'loader',
  standalone: false,
  templateUrl: './loader.html',
  styleUrl: './loader.scss',
})
export class LoaderComponent {
  private readonly loaderService = inject(LoaderService);

  protected isShowed=signal<boolean>(false);

  constructor() {
    this.loaderService.isShowed$
      .subscribe((show: boolean) => {
        this.isShowed.set(show);
      })
  }
}
