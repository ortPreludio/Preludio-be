/**
 * Global error handling middleware.
 */
export const errorHandler = (err, req, res, next) => {
    console.error("[ERROR]", err);

    let statusCode = err.statusCode || 500;
    let message = err.message || "Error interno del servidor";

    // Mongoose Validation Error
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors).map((val) => val.message).join(", ");
    }

    // Mongoose Duplicate Key Error
    if (err.code === 11000) {
        statusCode = 409;
        message = `Valor duplicado: ${Object.keys(err.keyValue).join(", ")}`;
    }

    // CastError (Invalid ID)
    if (err.name === "CastError") {
        statusCode = 400;
        message = `Formato inválido para: ${err.path}`;
    }

    res.status(statusCode).json({
        error: true,
        message,
        // Include stack trace only in development/staging
        stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    });
};
