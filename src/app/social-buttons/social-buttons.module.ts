import { NgModule } from '@angular/core';
import { TweetComponent } from './tweet.component';

@NgModule({
  declarations: [
    TweetComponent
  ],
  exports: [
    TweetComponent
  ]
})
export class SocialButtonsModule {}
