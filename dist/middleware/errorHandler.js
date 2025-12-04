"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
// Middleware error handler
function errorHandler(err, req, res) {
    console.error(err); // Log error to console
    const status = typeof err === 'object' && err && 'status' in err ? err.status || 500 : 500;
    const message = typeof err === 'object' && err && 'message' in err ? err.message || 'Internal Server Error' : 'Internal Server Error';
    res.status(status).json({
        success: false,
        error: message,
    });
}
exports.default = errorHandler;
