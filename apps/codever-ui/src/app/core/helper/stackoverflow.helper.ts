import { Injectable } from '@angular/core';

@Injectable()
export class StackoverflowHelper {
  public getStackoverflowQuestionIdFromUrl(location: string): string {
    let stackoverflowQuestionId = null;
    const regExpMatchArray = location.match(
      /stackoverflow\.com\/questions\/(\d+)/
    );
    if (regExpMatchArray) {
      stackoverflowQuestionId = regExpMatchArray[1];
    }

    return stackoverflowQuestionId;
  }
}
