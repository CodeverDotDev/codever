import { NgModule } from '@angular/core';
import { TweetComponent } from './tweet.component';
import { FbShareComponent } from './fb-share.component';

@NgModule({
  imports: [TweetComponent, FbShareComponent],
  exports: [TweetComponent, FbShareComponent],
})
export class SocialButtonsModule {}
