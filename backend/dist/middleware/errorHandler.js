"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
/**
 * Global Error Handling Middleware cho Express API.
 */
function errorHandler(err, req, res, next) {
    console.error('❌ [ErrorHandler] Unhandled Exception:', err);
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Lỗi server nội bộ (Internal Server Error).';
    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    });
}
