import { NextFunction, Request, Response } from 'express';

/**
 * Global Error Handling Middleware cho Express API.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('❌ [ErrorHandler] Unhandled Exception:', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Lỗi server nội bộ (Internal Server Error).';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}
