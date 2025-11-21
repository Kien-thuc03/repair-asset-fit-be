import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        // Xử lý validation errors
        if (Array.isArray(responseObj.message)) {
          message = responseObj.message;
        } else if (responseObj.message) {
          message = responseObj.message;
        } else if (responseObj.error) {
          message = Array.isArray(responseObj.error) 
            ? responseObj.error 
            : responseObj.error;
        } else {
          message = exception.message;
        }
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      statusCode: status,
      message: Array.isArray(message) ? message.join(', ') : message,
      error: Array.isArray(message) ? message : undefined,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    });
  }
}
