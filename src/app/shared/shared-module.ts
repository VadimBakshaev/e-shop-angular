import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PasswordRepeatDirective } from './directives/password-repeat';
import { ProductCardComponent } from './components/product-card/product-card';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CategoryFilterComponent } from './components/category-filter/category-filter';
import { CountSelectorComponent } from './components/count-selector/count-selector';
import { LoaderComponent } from './components/loader/loader';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';



@NgModule({
  declarations: [
    PasswordRepeatDirective,
    ProductCardComponent,
    CategoryFilterComponent,
    CountSelectorComponent,
    LoaderComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatProgressSpinnerModule,
    RouterModule
],
  exports:[
    PasswordRepeatDirective,
    ProductCardComponent,
    CategoryFilterComponent,
    LoaderComponent,
    CountSelectorComponent
  ]
})
export class SharedModule { }
