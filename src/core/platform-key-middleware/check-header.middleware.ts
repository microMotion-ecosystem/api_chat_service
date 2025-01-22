import {
    Injectable,
    NestMiddleware,
    UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class CheckHeaderMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: () => void) {
        const xPlatformHeader = req.headers['x-platform'];
        if (req.url.startsWith('/api/') && xPlatformHeader !== process.env.PLATFORM_NAME ) {
            throw new UnauthorizedException('Invalid X platform Key in the Header');
        }
        next();
    }
}
