export class ErrorHandler extends Error {
  statusCode: number;
  success: boolean;

  constructor(message: any, statusCode: number) {
    super(message);
    this.success = false;
    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}
