import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { UserDataProfile } from '../../../core/model/user-data-profile';
import { UserDataService } from '../../../core/user-data.service';

@Component({
  selector: 'app-followers',
  templateUrl: './followers.component.html',
  styleUrls: ['./followers.component.scss']
})
export class FollowersComponent implements OnInit {

  @Input()
  userId: string;

  followers$: Observable<UserDataProfile[]>;

  constructor(private userDataService: UserDataService) { }

  ngOnInit() {
    this.followers$ = this.userDataService.getFollowers$(this.userId);
  }

}
