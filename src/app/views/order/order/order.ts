import { Component, DestroyRef, ElementRef, inject, signal, TemplateRef, ViewChild } from '@angular/core';
import { CartService } from '../../../shared/services/cart-service';
import { CartType } from '../../../../types/cart.type';
import { DefaultResponseType } from '../../../../types/default-response.type';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeliveryType } from '../../../../types/delivery.type';
import { FormBuilder, Validators } from '@angular/forms';
import { PaymentType } from '../../../../types/payment.type';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { OrderService } from '../../../shared/services/order-service';
import { OrderType } from '../../../../types/order.type';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from '../../../shared/services/user-service';
import { UserInfoType } from '../../../../types/user-info.type';
import { AuthService } from '../../../core/auth/auth';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-order',
  standalone: false,
  templateUrl: './order.html',
  styleUrl: './order.scss',
})
export class OrderComponent {
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly orderService = inject(OrderService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  private popupDialog: MatDialogRef<any> | null = null;
  protected cart = signal<CartType | null>(null);
  protected totalAmount: number = 0;
  protected totalCount: number = 0;
  protected deliveryType: DeliveryType = DeliveryType.delivery;
  protected deliveryTypes = DeliveryType;
  protected paymentTypes = PaymentType;
  protected orderForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    fatherName: [''],
    phone: ['', Validators.required],
    paymentType: [PaymentType.cashToCourier, Validators.required],
    email: ['', [Validators.required, Validators.email]],
    street: [''],
    house: [''],
    entrance: [''],
    apartment: [''],
    comment: ['']
  });

  @ViewChild('popup') popup!: TemplateRef<ElementRef>;

  constructor() {
    this.cartService.getCart()
      .pipe(takeUntilDestroyed())
      .subscribe((data: CartType | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) throw new Error((data as DefaultResponseType).message);
        this.cart.set(data as CartType);
        if (!this.cart() || (this.cart() && this.cart()?.items.length === 0)) {
          this.snackBar.open('Корзина пустая');
          this.router.navigate(['/']);
          return;
        };
        this.calculateTotal();
      });
      
    this.updateDeliveryTypeValidation();

    if (this.authService.getIsLoggedIn()) {
      this.userService.getUserInfo()
        .pipe(takeUntilDestroyed())
        .subscribe({
          next: (data: UserInfoType | DefaultResponseType) => {
            if ((data as DefaultResponseType).error !== undefined) throw new Error((data as DefaultResponseType).message);
            const userInfo = data as UserInfoType;
            const paramsToUpdate = {
              firstName: userInfo.firstName ?? '',
              lastName: userInfo.lastName ?? '',
              fatherName: userInfo.fatherName ?? '',
              phone: userInfo.phone ?? '',
              paymentType: userInfo.paymentType ?? PaymentType.cashToCourier,
              email: userInfo.email ?? '',
              street: userInfo.street ?? '',
              house: userInfo.house ?? '',
              entrance: userInfo.entrance ?? '',
              apartment: userInfo.apartment ?? '',
              comment: ''
            };
            this.orderForm.setValue(paramsToUpdate);
            if (userInfo.deliveryType) this.deliveryType = userInfo.deliveryType;
          }
        });
    };
  }

  private calculateTotal() {
    this.totalAmount = 0;
    this.totalCount = 0;
    if (this.cart()) {
      this.cart()?.items.forEach(item => {
        this.totalAmount += item.quantity * item.product.price;
        this.totalCount += item.quantity;
      })
    }
  }

  protected changeDeliveryType(type: DeliveryType) {
    this.deliveryType = type;
    this.updateDeliveryTypeValidation();
  }

  private updateDeliveryTypeValidation() {
    if (this.deliveryType === DeliveryType.delivery) {
      this.orderForm.get('street')?.setValidators(Validators.required);
      this.orderForm.get('house')?.setValidators(Validators.required);
    } else {
      this.orderForm.get('street')?.removeValidators(Validators.required);
      this.orderForm.get('house')?.removeValidators(Validators.required);
      this.orderForm.get('street')?.setValue('');
      this.orderForm.get('house')?.setValue('');
      this.orderForm.get('entrance')?.setValue('');
      this.orderForm.get('apartment')?.setValue('');
    }
    this.orderForm.get('street')?.updateValueAndValidity();
    this.orderForm.get('house')?.updateValueAndValidity();
  }

  protected createOrder() {
    if (this.orderForm.valid
      && this.orderForm.value.firstName
      && this.orderForm.value.lastName
      && this.orderForm.value.phone
      && this.orderForm.value.paymentType
      && this.orderForm.value.email) {
      const paramsObject: OrderType = {
        deliveryType: this.deliveryType,
        firstName: this.orderForm.value.firstName,
        lastName: this.orderForm.value.lastName,
        phone: this.orderForm.value.phone,
        paymentType: this.orderForm.value.paymentType,
        email: this.orderForm.value.email,
      }
      if (this.deliveryType === DeliveryType.delivery) {
        if (this.orderForm.value.street) paramsObject.street = this.orderForm.value.street;
        if (this.orderForm.value.apartment) paramsObject.apartment = this.orderForm.value.apartment;
        if (this.orderForm.value.house) paramsObject.house = this.orderForm.value.house;
        if (this.orderForm.value.entrance) paramsObject.entrance = this.orderForm.value.entrance;
      }
      if (this.orderForm.value.comment) paramsObject.comment = this.orderForm.value.comment;
      this.sendOrder(paramsObject);

    } else {
      this.snackBar.open('Заполните необходимые поля');
      this.orderForm.markAllAsTouched();
    }
  }

  private sendOrder(params: OrderType) {
    this.orderService.createOrder(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: OrderType | DefaultResponseType) => {
          if ((data as DefaultResponseType).error !== undefined) throw new Error((data as DefaultResponseType).message);
          this.popupDialog = this.dialog.open(this.popup);
          this.popupDialog.backdropClick().subscribe(() => {
            this.router.navigate(['/']);
          });
          this.cartService.setCount(0);
        },
        error: (errorResponse: HttpErrorResponse) => {
          if (errorResponse.error && errorResponse.error.message) {
            this.snackBar.open(errorResponse.error.message);
          } else {
            this.snackBar.open('Ошибка заказа');
          }
        }
      })
  }

  protected popupClose() {
    this.popupDialog?.close();
    this.router.navigate(['/']);
  }

}
