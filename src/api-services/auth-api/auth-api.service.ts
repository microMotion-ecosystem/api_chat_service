import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { map, Observable } from 'rxjs';
import { MyHttpService } from '../../core/my-http-client-service/my-http.service';
import * as process from 'node:process';

@Injectable()
export class AuthApiService {
  constructor(private httpService: MyHttpService) {}

  validateToken(token: string): Observable<boolean> {
    const url = process.env.URL_AUTH_SERVICE + '/validate'; // replace with your auth service url
    return this.httpService
      .post(url, { token })
      .pipe(map((response) => response.data.isValid));
  }
}
