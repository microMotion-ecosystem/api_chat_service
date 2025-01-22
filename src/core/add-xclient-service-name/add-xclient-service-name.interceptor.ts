import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import * as process from "node:process";

@Injectable()
export class AddXClientServiceNameInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    request.headers['x-client-service'] = `${process.env.APP_NAME}/${process.env.APP_VERSION} (${process.env.APP_ENV}; ${process.env.port})`;
    request.headers['x-clients-ancestors'] = (request.headers['x-clients-ancestors'] || '') + `, ${process.env.APP_NAME}`;

    return next.handle();
  }
}
