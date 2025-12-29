
/**
 * @file errorHandler.ts
 * @module middleware/errorHandler
 * @author eventFlow Team
 * @description Global middleware for handling errors in the Express app. Sends structured error responses to the client.
 * @created 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 * @dependency Express
 */
import { Request, Response, NextFunction } from 'express';

// Middleware error handler
export function errorHandler(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  console.error(err); // Log error to console
  
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    success: false,
    error: message,
  });
}

export default errorHandler;