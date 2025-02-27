import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as express from 'express';

@Injectable()
export class SkipJsonParsingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Skip JSON parsing for multipart/form-data requests
    if (req.headers['content-type']?.startsWith('multipart/form-data')) {
      next();
    } else {
      // Apply JSON parsing for other requests
      express.json()(req, res, next);
    }
  }
}
