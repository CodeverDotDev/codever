import { NgModule } from '@angular/core';
import { TweetComponent } from './tweet.component';
import { FbShareComponent } from './fb-share.component';

@NgModule({
  declarations: [
    TweetComponent,
    FbShareComponent
  ],
  exports: [
    TweetComponent,
    FbShareComponent
  ]
})
export class SocialButtonsModule {}
