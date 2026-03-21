import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserRoutingModule } from './user-routing-module';
import { LoginComponent } from './login/login';
import { SignupComponent } from './signup/signup';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared-module';


@NgModule({
  declarations: [
    LoginComponent,
    SignupComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    UserRoutingModule
  ],
  exports: [
    LoginComponent,
    SignupComponent
  ]
})
export class UserModule { }
