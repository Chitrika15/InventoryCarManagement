export class AppError extends Error {
    statusCode;
    code;
    details;
    constructor(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}
export class BadRequestError extends AppError {
    constructor(message = 'Bad Request', details) {
        super(message, 400, 'BAD_REQUEST', details);
    }
}
export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized access', details) {
        super(message, 401, 'UNAUTHORIZED', details);
    }
}
export class ForbiddenError extends AppError {
    constructor(message = 'Access forbidden: Insufficient permissions', details) {
        super(message, 403, 'FORBIDDEN', details);
    }
}
export class NotFoundError extends AppError {
    constructor(message = 'Resource not found', details) {
        super(message, 404, 'NOT_FOUND', details);
    }
}
export class ConflictError extends AppError {
    constructor(message = 'Resource conflict', details) {
        super(message, 409, 'CONFLICT', details);
    }
}
export class UnprocessableEntityError extends AppError {
    constructor(message = 'Unprocessable Entity', details) {
        super(message, 422, 'UNPROCESSABLE_ENTITY', details);
    }
}
