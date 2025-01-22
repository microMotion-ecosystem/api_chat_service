import { Global, INestApplication, Module } from '@nestjs/common';
import {
  ClientProviderOptions,
  ClientsModule,
  MicroserviceOptions,
  Transport,
} from '@nestjs/microservices';

//  npm install @nestjs/microservices amqplib amqp-connection-manager
function registerMicroservice(
  ProviderName: string = 'RABBITMQ_SERVICE',
  rabbitmqQueueName: string,
): ClientProviderOptions {
  return {
    name: ProviderName,
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL],
      queue: rabbitmqQueueName,
      queueOptions: {
        durable: false,
      },
    },
  };
}

@Global()
@Module({
  imports: [
    ClientsModule.register([
      /*

      * add more Service Provider here to interact it in Services
      * inject it in the constructor like this:
      * @Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy,
      * then you can emit event like this:
      * this.client.emit<any>('event-name', 'ay haga');
      */
      // registerMicroservice('AUTH_MQ_SERVICE','user_profile_service.to.auth_service'),
      // registerMicroservice('RABBITMQ_SERVICE2', 'to.logger_service'),
    ]),
  ],
  exports: [ClientsModule],
})
export class RabbitMqConfigModule {
  static async setup(app: INestApplication<any>) {
    const listenToMicroservice = (rabbitmqQueueName: string) => {
      app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: rabbitmqQueueName,
          queueOptions: {
            durable: false,
          },
        },
      });
    };

    /*
     *  add more microservice Listener to listen to it from outside
     *  on starting of this app
     * you should add event listener in a controller to listen to this microservice
     * like this:
     * @EventPattern('event-name')
     * async handleEventName(data: any) {}
     * */
    // listenToMicroservice('fuse1');
    // listenToMicroservice('auth_service.to.user_profile_service');
    await app.startAllMicroservices();
  }
}
