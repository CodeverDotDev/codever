import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, of, Subject, Subscription, timer} from 'rxjs';
import {LoaderService} from '../../core/loader/loader.service';
import {debounce, debounceTime, takeWhile} from 'rxjs/operators';


@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.css']
})
export class LoaderComponent implements OnInit, OnDestroy {
  color = 'primary';
  mode = 'indeterminate';
  isLoading: Observable<boolean>;

  private subscription: Subscription;

  constructor(private loaderService: LoaderService) {}

  ngOnInit(): void {
    this.subscription = this.loaderService.isLoading.pipe(
      // debounce(() => timer(1000)),
      debounceTime(1000),
      // takeWhile((res) => res === true)
    )
      .subscribe(isLoading => {
        this.isLoading = of(isLoading)
      });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }


}
