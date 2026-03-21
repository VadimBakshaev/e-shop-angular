import { inject, Injectable } from '@angular/core';
import { Observable, Subject, throwError } from 'rxjs';
import { DefaultResponseType } from '../../../types/default-response.type';
import { LoginResponseType } from '../../../types/login-response.type';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  public readonly accessTokenKey: string = 'accessToken';
  public readonly refreshTokenKey: string = 'refreshToken';
  public readonly userIdKey: string = 'userId';

  private isLogged: boolean = false;
  public isLogged$: Subject<boolean> = new Subject<boolean>();

  constructor() {
    console.log('AuthService activated');
    this.isLogged = !!localStorage.getItem(this.accessTokenKey);
  }

  public login(email: string, password: string, rememberMe: boolean): Observable<DefaultResponseType | LoginResponseType> {
    return this.http.post<DefaultResponseType | LoginResponseType>(environment.api + 'login', {
      email,
      password,
      rememberMe
    })
  }

  public signup(email: string, password: string, passwordRepeat: string): Observable<DefaultResponseType | LoginResponseType> {
    return this.http.post<DefaultResponseType | LoginResponseType>(environment.api + 'signup', {
      email,
      password,
      passwordRepeat
    })
  }

  public logout(): Observable<DefaultResponseType> {
    const tokens = this.getTokens();
    if (tokens && tokens.refreshToken) {
      return this.http.post<DefaultResponseType>(environment.api + 'logout', { refreshToken: tokens.refreshToken })
    }
    throw throwError(() => 'Can not find token');
  }

  public getIsLoggedIn(): boolean {
    return this.isLogged;
  }

  public setUser(accessToken: string, refreshToken: string, userId: string): void {
    localStorage.setItem(this.accessTokenKey, accessToken);
    localStorage.setItem(this.refreshTokenKey, refreshToken);
    localStorage.setItem(this.userIdKey, userId);
    this.isLogged = true;
    this.isLogged$.next(true);
  }

  public removeUser(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userIdKey);
    this.isLogged = false;
    this.isLogged$.next(false);
  }

  public getTokens(): { accessToken: string | null, refreshToken: string | null } {
    return {
      accessToken: localStorage.getItem(this.accessTokenKey),
      refreshToken: localStorage.getItem(this.refreshTokenKey)
    }
  }

  public refresh(): Observable<DefaultResponseType | LoginResponseType> {
    const tokens = this.getTokens();
    if (tokens && tokens.refreshToken) {
      return this.http.post<DefaultResponseType | LoginResponseType>(environment.api + 'refresh', {
        refreshToken: tokens.refreshToken
      })
    }
    throw throwError(() => 'Can not use token');
  }

  public get userId(): string | null {
    return localStorage.getItem(this.userIdKey);
  }
}
