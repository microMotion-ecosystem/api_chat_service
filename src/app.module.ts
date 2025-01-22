import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './controllers/app.controller';
import { AppService } from './services/app.service';
import { MongodbModule } from './config/mongodb.module';
import { HttpModule } from '@nestjs/axios';
import { AuthApiService } from './api-services/auth-api/auth-api.service';
import { CheckHeaderMiddleware } from './core/platform-key-middleware/check-header.middleware';
import { JwtStrategy } from './core/jwt-auth-guard/jwt.strategy';
import { RabbitMqConfigModule } from './config/rabbitmq-config.module';
import { RequestsLoggerMiddleware } from './core/requests-logger/requests-logger.middleware';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerInterceptor } from './core/requests-logger/requests-logger.interceptor';
import { AddXClientServiceNameInterceptor } from './core/add-xclient-service-name/add-xclient-service-name.interceptor';
import { MyHttpService } from "./core/my-http-client-service/my-http.service";

@Module({
  imports: [MongodbModule, HttpModule, RabbitMqConfigModule],
  controllers: [AppController],
  providers: [
    AppService,
    AuthApiService,
    JwtStrategy,
    MyHttpService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AddXClientServiceNameInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  // MiddlewareConsumer is used to configure the middleware vvv
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        CheckHeaderMiddleware,
        RequestsLoggerMiddleware,
        /* , otherMiddleWare */
      )
      .forRoutes(
        { path: '*', method: RequestMethod.ALL } /* OR AppController */,
      );
    /*  // to implement other middleware:
     consumer
          .apply(NewMiddleware)
          .forRoutes({ path: 'demo', method: RequestMethod.GET });*/
  }
}
