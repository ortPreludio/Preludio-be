export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export const esc = (s = "") => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Parsea y valida los parámetros de paginación de la query string.
 * @param {Object} query - Parámetros de la query.
 * @returns {Object} - Parámetros parseados: page, limit, skip, sort, sortDir, q.
 */
export const getPaginationParams = (query) => {
    const {
        q = "",
        page = 1,
        limit = 10,
        sort = "createdAt",
        order = "desc",
    } = query;

    const pageNum = clamp(parseInt(page, 10) || 1, 1, 10_000);
    const perPage = clamp(parseInt(limit, 10) || 10, 1, 100);
    const skip = (pageNum - 1) * perPage;
    const sortDir = order === "asc" ? 1 : -1;

    return {
        q,
        page: pageNum,
        limit: perPage,
        skip,
        sort,
        sortDir,
    };
};

/**
 * Construye un filtro $or para consultas de búsqueda en MongoDB.
 * @param {string} q - Busqueda.
 * @param {Array<string>} fields - Campos a buscar.
 * @returns {Object} - El objeto de filtro de MongoDB (o objeto vacío si "q" está vacío).
 */
export const buildSearchFilter = (q, fields) => {
    if (!q) return {};
    const rx = new RegExp(esc(q), "i");
    return {
        $or: fields.map((field) => ({ [field]: rx })),
    };
};
