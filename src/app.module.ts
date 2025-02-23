import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
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
import { ChatController } from './controllers/chat.controller';
import { ChatService } from './services/chat.service';
import { AskLLmService } from './api-services/ask-llm/ask-llm.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './models/message.model';
import { Session, SessionSchema } from './models/session.model';
import { MessageController } from './controllers/message.controller';
import { MessageService } from './services/message.service';
import { SessionController } from './controllers/session.controller';
import { SessionService } from './services/session.service';
import { ApiService } from './core/Api/api.service';
import { CheckUserService } from './api-services/check-user/check-user.service';
import { GateWay } from './services/gateway.events';
import { BullModule } from '@nestjs/bull';
import { BullSevice } from './services/bull.service';
import { MessageProcessor } from './controllers/message.processor';
import { MailerModule } from './nodemailer/nodemailer.module';
import { ConfigService } from '@nestjs/config'
import { UploadService } from './services/upload.service';
import { TextExtractionService } from './services/textExtraction.service';

@Module({
  imports: [MongodbModule,
    HttpModule,
    RabbitMqConfigModule,
    BullModule.forRoot({
      // Configure Redis connection
      redis: {
        host: process.env.Redis_Host,
        port: parseInt(process.env.Redis_Host_Port),
        password: process.env.Redis_Pass,
      },
    }),
    BullModule.registerQueue({
      name: 'messageQueue',
    }),
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Session.name, schema: SessionSchema}
    ]),
    MailerModule,
  ],
  controllers: [
    ChatController,
    MessageController,
    SessionController,
  ],
  providers: [
    AuthApiService,
    JwtStrategy,
    MyHttpService,
    ChatService,
    AskLLmService,
    MessageService,
    SessionService,
    ApiService,
    CheckUserService,
    GateWay,
    BullSevice,
    MessageProcessor,
    UploadService,
    ConfigService,
    TextExtractionService,
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
