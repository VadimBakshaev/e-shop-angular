import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { OrderType } from '../../../types/order.type';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DefaultResponseType } from '../../../types/default-response.type';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly http = inject(HttpClient);

  public createOrder(params:OrderType): Observable<OrderType | DefaultResponseType> {
    return this.http.post<OrderType | DefaultResponseType>(environment.api + 'orders', params, { withCredentials: true });
  }

  public getOrders(): Observable<OrderType[] | DefaultResponseType> {
    return this.http.get<OrderType[] | DefaultResponseType>(environment.api + 'orders');
  }
}
