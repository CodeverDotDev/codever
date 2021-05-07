import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, of, Subscription} from 'rxjs';
import {LoaderService} from '../../core/loader/loader.service';
import {debounceTime} from 'rxjs/operators';
import { environment } from '../../../environments/environment';


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
      debounceTime(environment.LOADER_SHOWN_DELAY) // if every all requests are done within a second no loader will be shown
    )
      .subscribe(isLoading => {
        this.isLoading = of(isLoading)
      });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }


}
