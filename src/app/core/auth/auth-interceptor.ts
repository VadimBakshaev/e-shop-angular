import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { catchError, finalize, Observable, switchMap, throwError } from "rxjs";
import { AuthService } from "./auth";
import { DefaultResponseType } from "../../../types/default-response.type";
import { LoginResponseType } from "../../../types/login-response.type";
import { Router } from "@angular/router";
import { LoaderService } from "../../shared/services/loader-service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly loaderService = inject(LoaderService);

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        this.loaderService.show();
        console.log('intercept active');
        const tokens = this.authService.getTokens();
        if (tokens && tokens.accessToken) {
            const authReq = req.clone({
                headers: req.headers.set('x-access-token', tokens.accessToken)
            });
            return next.handle(authReq)
                .pipe(
                    catchError((error: HttpErrorResponse) => {
                        if (error.status === 401 && !authReq.url.includes('/login') && !authReq.url.includes('/refresh')) {
                            return this.handle401Error(authReq, next);
                        };
                        return throwError(() => error);
                    }),
                    finalize(() => this.loaderService.hide())
                );
        };
        return next.handle(req).pipe(finalize(() => this.loaderService.hide()));
    }

    private handle401Error(req: HttpRequest<any>, next: HttpHandler) {
        return this.authService.refresh().pipe(
            switchMap((result: DefaultResponseType | LoginResponseType) => {
                let error = '';
                if ((result as DefaultResponseType).error !== undefined) {
                    error = (result as DefaultResponseType).message;
                }
                const refreshResult = result as LoginResponseType;
                if (!refreshResult.accessToken || !refreshResult.refreshToken || !refreshResult.userId) {
                    error = 'Ошибка авторизации';
                }
                if (error) return throwError(() => new Error(error));
                this.authService.setUser(refreshResult.accessToken, refreshResult.refreshToken, refreshResult.userId);
                const authReq = req.clone({
                    headers: req.headers.set('x-access-token', refreshResult.accessToken)
                });
                return next.handle(authReq);
            }),
            catchError(error => {
                this.authService.removeUser();
                this.router.navigate(['/']);
                return throwError(() => error);
            })
        )
    }
}
