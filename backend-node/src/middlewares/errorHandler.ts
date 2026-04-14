import { Request, Response, NextFunction } from 'express';

// Global error-handling middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('[Error:', err.message || err, ']');
    const status = err.status || 500;
    res.status(status).json({
        error: err.message || 'Internal Server Error'
    });
};
