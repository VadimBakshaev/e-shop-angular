import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { PaymentType } from '../../../../types/payment.type';
import { DeliveryType } from '../../../../types/delivery.type';
import { UserService } from '../../../shared/services/user-service';
import { DefaultResponseType } from '../../../../types/default-response.type';
import { UserInfoType } from '../../../../types/user-info.type';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-info',
  standalone: false,
  templateUrl: './info.html',
  styleUrl: './info.scss',
})
export class InfoComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  protected deliveryType: DeliveryType = DeliveryType.delivery;
  protected deliveryTypes = DeliveryType;
  protected paymentTypes = PaymentType;
  protected userInfoForm = this.fb.group({
    firstName: [''],
    lastName: [''],
    fatherName: [''],
    phone: [''],
    paymentType: [PaymentType.cashToCourier],
    email: ['', [Validators.required]],
    street: [''],
    house: [''],
    entrance: [''],
    apartment: [''],
  });

  constructor() {
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
          };
          this.userInfoForm.setValue(paramsToUpdate);
          if (userInfo.deliveryType) this.deliveryType = userInfo.deliveryType;
        }
      })
  }

  protected changeDeliveryType(type: DeliveryType) {
    this.deliveryType = type;
    this.userInfoForm.markAsDirty();
  }

  protected updateUserInfo() {
    if (this.userInfoForm.valid) {
      const paramObject: UserInfoType = {
        email: this.userInfoForm.value.email ? this.userInfoForm.value.email : '',
        deliveryType: this.deliveryType,
        paymentType: this.userInfoForm.value.paymentType ? this.userInfoForm.value.paymentType : this.paymentTypes.cashToCourier
      }
      if (this.userInfoForm.value.firstName) paramObject.firstName = this.userInfoForm.value.firstName;
      if (this.userInfoForm.value.lastName) paramObject.lastName = this.userInfoForm.value.lastName;
      if (this.userInfoForm.value.fatherName) paramObject.fatherName = this.userInfoForm.value.fatherName;
      if (this.userInfoForm.value.phone) paramObject.phone = this.userInfoForm.value.phone;
      if (this.userInfoForm.value.street) paramObject.street = this.userInfoForm.value.street;
      if (this.userInfoForm.value.house) paramObject.house = this.userInfoForm.value.house;
      if (this.userInfoForm.value.entrance) paramObject.entrance = this.userInfoForm.value.entrance;
      if (this.userInfoForm.value.apartment) paramObject.apartment = this.userInfoForm.value.apartment;

      this.sendUpdateUserInfo(paramObject);
    } else {
      this.userInfoForm.markAllAsTouched();
      this.snackBar.open('Заполните необходимые поля');
    }
  }

  private sendUpdateUserInfo(params: UserInfoType) {
    this.userService.updateUserInfo(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: DefaultResponseType) => {
          if (data.error) {
            this.snackBar.open(data.message);
            throw new Error(data.message);
          }
          this.snackBar.open('Данные успешно сохранены');
          this.userInfoForm.markAsPristine();
        },
        error: (errorResponse: HttpErrorResponse) => {
          if (errorResponse.error && errorResponse.error.message) {
            this.snackBar.open(errorResponse.error.message);
          } else {
            this.snackBar.open('Ошибка сохранения');
          }
        }
      });
  }
}
