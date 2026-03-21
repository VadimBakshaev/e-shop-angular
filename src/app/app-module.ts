import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { LayoutComponent } from './shared/layout/layout';
import { HeaderComponent } from './shared/layout/header/header';
import { FooterComponent } from './shared/layout/footer/footer';
import { MainComponent } from './views/main/main';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { SharedModule } from "./shared/shared-module";
import { CarouselModule } from 'ngx-owl-carousel-o';
import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { AuthInterceptor } from './core/auth/auth-interceptor';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    App,
    LayoutComponent,
    HeaderComponent,
    FooterComponent,
    MainComponent,
  ],
  imports: [
    BrowserModule,
    SharedModule,
    MatSnackBarModule,
    MatMenuModule,
    CarouselModule,
    ReactiveFormsModule,
    AppRoutingModule,
    ReactiveFormsModule
],
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 2500 } },
    provideHttpClient(withInterceptorsFromDi()), 
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [App]
})
export class AppModule { }
