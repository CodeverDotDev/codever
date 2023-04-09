import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class ImageUploadService {
  constructor(private httpClient: HttpClient) {}

  public uploadImage(image: File): Observable<any> {
    const formData = new FormData();

    formData.append('image', image);

    return this.httpClient.post('/api/v1/image-upload', formData);
  }
}
