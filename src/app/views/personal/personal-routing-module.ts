import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FavoriteComponent } from './favorite/favorite';
import { OrdersComponent } from './orders/orders';
import { InfoComponent } from './info/info';

const routes: Routes = [
  {path:'favorite', component:FavoriteComponent},
  {path:'orders', component:OrdersComponent},
  {path:'profile', component:InfoComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PersonalRoutingModule { }
