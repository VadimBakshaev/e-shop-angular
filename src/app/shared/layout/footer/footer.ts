import { Component, input } from '@angular/core';
import { CategoryWithType } from '../../../../types/category.type';

@Component({
  selector: 'app-footer',
  standalone: false,
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class FooterComponent {
  public categories = input<CategoryWithType[]>();
}
