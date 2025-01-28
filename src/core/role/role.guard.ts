import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  
  @Injectable()
  export class RoleGuard implements CanActivate {
    constructor(private reflector: Reflector) {}
  
    canActivate(context: ExecutionContext): boolean {
      const requiredRole = this.reflector.get<string[]>(
        'role',
        context.getHandler(),
      );
      if (!requiredRole) {
        return true;
      }
      const request = context.switchToHttp().getRequest();
      const user = request.user;
  
      if (!requiredRole.includes(user.role)) {
        throw new UnauthorizedException(
          `Access denied: You must have the role of ${requiredRole.join(' & ')} to access this resource.`,
        );
      }
  
      return true;
    }
  }
  