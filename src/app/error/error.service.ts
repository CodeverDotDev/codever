import { EventEmitter } from "@angular/core";

import { Error } from "./error.model";

export class ErrorService {
    errorOccurred = new EventEmitter<Error>();

    handleError(error: any) {
        const errorData = new Error(error.title, error.messages);
        //const errorData = new Error('Some error title', 'Some error message');
        this.errorOccurred.emit(errorData);
    }
}
