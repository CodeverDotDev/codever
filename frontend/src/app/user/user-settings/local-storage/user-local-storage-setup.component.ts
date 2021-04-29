import { Component, Input, OnInit } from '@angular/core';
import { UserData } from '../../../core/model/user-data';
import { UserDataStore } from '../../../core/user/userdata.store';
import { Observable } from 'rxjs';
import { MatRadioChange } from '@angular/material/radio';
import { LocalStorageSaveOptions, LocalStorageService } from '../../../core/cache/local-storage.service';
import { localStorageKeys } from '../../../core/model/localstorage.cache-keys';


@Component({
  selector: 'app-user-local-storage-setup',
  templateUrl: './user-local-storage-setup.component.html',
  styleUrls: ['./user-local-storage-setup.component.scss']
})
export class UserLocalStorageSetupComponent implements OnInit {

  localStorageEnabled = false;

  @Input()
  userData$: Observable<UserData>;
  private userData: UserData;

  constructor(private userDataStore: UserDataStore,
              private localStorageService: LocalStorageService) {
  }

  ngOnInit() {
    this.userData$.subscribe(userData => {
      this.userData = userData;
      if (this.userData.enableLocalStorage) {
        this.localStorageEnabled = true;
      } else {
        this.localStorageEnabled = false;
      }
    });
  }

  selectionChange($event: MatRadioChange) {
    const userEnablesLocalStorageForPersonalData = $event.value;
    if (userEnablesLocalStorageForPersonalData === false) {
      this.localStorageService.cleanUserRelatedData();
    }

    this.userDataStore.updateLocalStorageOption$(userEnablesLocalStorageForPersonalData === true).subscribe(() => {
      const options: LocalStorageSaveOptions = {
        key: localStorageKeys.userLocalStorageConsent,
        data: userEnablesLocalStorageForPersonalData
      }
      this.localStorageService.save(options);
    });
  }

}
