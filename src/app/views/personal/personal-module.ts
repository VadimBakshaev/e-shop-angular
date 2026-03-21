import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PersonalRoutingModule } from './personal-routing-module';
import { FavoriteComponent } from './favorite/favorite';
import { InfoComponent } from './info/info';
import { OrdersComponent } from './orders/orders';
import { SharedModule } from '../../shared/shared-module';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    FavoriteComponent,
    InfoComponent,
    OrdersComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    ReactiveFormsModule,
    PersonalRoutingModule
  ]
})
export class PersonalModule { }
