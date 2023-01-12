import { Injectable } from '@angular/core';
import iziToast, { IziToastSettings } from 'izitoast';

@Injectable()
export class DeleteNotificationService {

  public showSuccessNotification(title: string): void {
    const iziToastSettings: IziToastSettings = {
      title: title,
      timeout: 3000,
      position: 'bottomRight'
    }
    iziToast.success(iziToastSettings);
  }

  public showErrorNotification(title: string): void {
    const iziToastSettings: IziToastSettings = {
      title: title,
      timeout: 3000,
      position: 'bottomRight'
    }
    iziToast.error(iziToastSettings);
  }

}
