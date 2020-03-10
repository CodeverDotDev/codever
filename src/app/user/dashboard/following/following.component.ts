import { Component, Input, OnInit } from '@angular/core';
import { UserDataService } from '../../../core/user-data.service';
import { UserDataProfile } from '../../../core/model/user-data-profile';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-following',
  templateUrl: './following.component.html',
  styleUrls: ['./following.component.scss']
})
export class FollowingComponent implements OnInit {

  @Input()
  userId: string;

  followedUsers$: Observable<UserDataProfile[]>;

  constructor(private userDataService: UserDataService) { }

  ngOnInit() {
    this.followedUsers$ = this.userDataService.getFollowedUsers$(this.userId);
  }

}
