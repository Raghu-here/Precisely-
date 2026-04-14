"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
// Global error-handling middleware
const errorHandler = (err, req, res, next) => {
    console.error('[Error:', err.message || err, ']');
    const status = err.status || 500;
    res.status(status).json({
        error: err.message || 'Internal Server Error'
    });
};
exports.errorHandler = errorHandler;
