import { EventEmitter, Injectable } from '@angular/core';

import { Error } from './error.model';

@Injectable()
export class ErrorService {
    errorOccurred = new EventEmitter<Error>();

    handleError(error: any) {
        const errorData = new Error(error.title, error.messages);
        this.errorOccurred.emit(errorData);
    }
}
