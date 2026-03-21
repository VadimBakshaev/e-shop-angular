import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CatalogComponent } from './catalog/catalog';
import { DetailComponent } from './detail/detail';

const routes: Routes = [
  {path:'catalog',component:CatalogComponent},
  {path:'product/:url',component:DetailComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductRoutingModule { }
