import { Injectable } from '@angular/core';
import { MatDialogConfig } from '@angular/material/dialog';
import { ScrollStrategy, ScrollStrategyOptions } from '@angular/cdk/overlay';

@Injectable()
export class LoginDialogHelperService {
  scrollStrategy: ScrollStrategy;

  constructor(private readonly scrollStrategyOptions: ScrollStrategyOptions) {
    this.scrollStrategy = this.scrollStrategyOptions.noop();
  }

  loginDialogConfig(message: string) {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.scrollStrategy = this.scrollStrategy;
    dialogConfig.data = {
      message: message,
    };

    return dialogConfig;
  }
}
