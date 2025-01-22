import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = `${request.get('host')}${request.originalUrl}`;

    console.info(`Interceptor Request: ${method} ${url}`, {body: request.body, headers: request.headers});
    return next.handle().pipe(
      tap((data) => {
        const response = context.switchToHttp().getResponse();
        console.info(`Interceptor Response: ${method} ${url}`, {
          data,
          headers: response.getHeaders(),
        });
      }),
    );
  }
}
