export const sendSuccess = (res, data, statusCode = 200, meta) => {
    const payload = {
        success: true,
        data,
        error: null,
        ...(meta ? { meta } : {}),
    };
    return res.status(statusCode).json(payload);
};
export const sendError = (res, message, statusCode = 500, code = 'INTERNAL_ERROR', details) => {
    const payload = {
        success: false,
        data: null,
        error: {
            message,
            code,
            details,
        },
    };
    return res.status(statusCode).json(payload);
};
