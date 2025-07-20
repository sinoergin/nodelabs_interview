import ApiError from './ApiError.js';

class AuthenticationError extends ApiError {
    constructor(message = 'Authentication failed') {
        super(401, message);
    }
}

class NotFoundError extends ApiError {
    constructor(message = 'Resource not found') {
        super(404, message);
    }
}

class ValidationError extends ApiError {
    constructor(message = 'Validation error') {
        super(400, message);
    }
}

export { ApiError, AuthenticationError, NotFoundError, ValidationError };
