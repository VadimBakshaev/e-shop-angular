import { Component, inject, signal } from '@angular/core';
import { OrderService } from '../../../shared/services/order-service';
import { OrderType } from '../../../../types/order.type';
import { DefaultResponseType } from '../../../../types/default-response.type';
import { OrderStatusUtil } from '../../../shared/utils/order-status.util';

@Component({
  selector: 'app-orders',
  standalone: false,
  templateUrl: './orders.html',
  styleUrl: './orders.scss',
})
export class OrdersComponent {
  private readonly orderService = inject(OrderService);

  protected orders = signal<OrderType[]>([]);

  constructor() {
    this.orderService.getOrders()
      .subscribe((data: OrderType[] | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) throw new Error((data as DefaultResponseType).message);

        this.orders.set((data as OrderType[]).map(item => {
          const status = OrderStatusUtil.getStatus(item.status);
          item.statusName = status.name;
          item.statusColor = status.color;
          return item;
        }));
      })
  }
}
