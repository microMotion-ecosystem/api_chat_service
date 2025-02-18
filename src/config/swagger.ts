import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as process from 'node:process';

export class SwaggerConfig {
  static setup(app: any) {
    const config = new DocumentBuilder()
      .setTitle(process.env.APP_NAME)
      .setDescription(process.env.APP_DESCRIPTION)
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .addGlobalParameters({
        name: 'x-Platform',
        in: 'header',
        example: 'yu2ahel',
        required: true,
        description: 'Platform Key',
      })
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // Add `api/v1` prefix to all paths in the Swagger document
    const modifiedDocument = {
      ...document,
      paths: Object.keys(document.paths).reduce((acc, path) => {
        acc[`/api/v1${path}`] = document.paths[path];
        return acc;
      }, {}),
    };

    SwaggerModule.setup('api-docs', app, modifiedDocument);
  }
}
