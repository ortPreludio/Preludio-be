/**
 * Wraps an async function to catch errors and pass them to the next middleware.
 * @param {Function} fn - The async function to wrap.
 * @returns {Function} - The wrapped function.
 */
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
