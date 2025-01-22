import { HttpException, HttpStatus } from '@nestjs/common';

export class ResponseDto<T = any> {
  status: string;
  message: string;
  data?: T;
  metadata?: { [key: string]: any };
  errors?: any;

  static ok<T>(
    data: T,
    metadata?: { [key: string]: any },
    message?: string,
  ): ResponseDto<T> {
    return {
      status: 'success',
      message,
      data,
      metadata,
    };
  }

  static msg<T>(message?: string): ResponseDto<T> {
    return {
      status: 'success',
      message: message || 'No content',
    };
  }

  static created<T>(data: T, message?: string): ResponseDto<T> {
    return {
      status: 'success',
      message: message || 'Resource created successfully',
      data,
    };
  }

  static success<T = any>(data: T, message?: string): ResponseDto<T> {
    return {
      status: 'success',
      message: message || 'Request processed successfully',
      data,
    };
  }

  static error<T>(message: string, errors?: any): ResponseDto<T> {
    return {
      status: 'error',
      message,
      errors,
    };
  }

  static throwError<T>(message: string, errors?: any): never {
    throw new HttpException(
      ResponseDto.error(message, errors || 'Internal server error'),
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  static throwBadRequest<T>(message: string, errors?: any): never {
    throw new HttpException(
      ResponseDto.error(message, errors || 'Bad request'),
      HttpStatus.BAD_REQUEST,
    );
  }

  static throwUnauthorized<T>(message: string, errors?: any): never {
    throw new HttpException(
      ResponseDto.error(message, errors || 'Unauthorized'),
      HttpStatus.UNAUTHORIZED,
    );
  }

  static throwForbidden<T>(message: string, errors?: any): never {
    throw new HttpException(
      ResponseDto.error(message, errors || 'Forbidden'),
      HttpStatus.FORBIDDEN,
    );
  }

  static throwNotFound<T>(message: string, errors?: any): never {
    throw new HttpException(
      ResponseDto.error(message, errors || 'Not found'),
      HttpStatus.NOT_FOUND,
    );
  }


}
