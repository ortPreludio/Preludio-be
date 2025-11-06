import jwt from "jsonwebtoken";

function extractToken(req) {
  const h = req.headers.authorization;
  const bearer = h?.startsWith("Bearer ") ? h.slice(7) : null;
  const token = req.cookies?.token || bearer;

  if (h?.startsWith("Bearer ")) return h.slice(7);
  return req.cookies?.token || null;
}

export function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ message: "Falta token" });
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: p.sub || p.id || p._id, rol: p.rol };
    next();
  } catch {
    res.status(401).json({ message: "Token inválido o expirado" });
  }
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "No autenticado" });
  if (!roles.includes(req.user.rol)) return res.status(403).json({ message: "Prohibido" });
  next();
};

// Ver a sí mismo o tener rol (ej: ADMIN)
export const requireSelfOrRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "No autenticado" });
  if (req.params.id && req.user.id?.toString() === req.params.id?.toString()) return next();
  if (roles.includes(req.user.rol)) return next();
  return res.status(403).json({ message: "Prohibido" });
};

// Alias de compatibilidad
export const protegerRuta = requireAuth;
export const roleGate = (...r) => requireRole(...r);

// opcional
export function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (token) {
    try {
      const p = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: p.sub || p.id || p._id, rol: p.rol };
    } catch {}
  }
  next();
}
