import { Injectable } from '@angular/core';

@Injectable()
export class DialogMeasurementsHelper {

  public getRelativeWidth(widthPercent: number) {
    let relativeWidth = (window.innerWidth * widthPercent) / 100;
    if (window.innerWidth > 1500) {
      relativeWidth = (1500 * widthPercent) / 100;
    }

    return relativeWidth + 'px';
  }

  public getRelativeHeight(heightPercent: number) {
    let relativeHeight = (window.innerHeight * heightPercent) / 100;
    if (window.innerHeight > 1200) {
      relativeHeight = (1200 * heightPercent) / 100;
    }

    return relativeHeight + 'px';
  }

}
