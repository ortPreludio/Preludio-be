import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const signAccessToken = (user) =>
  jwt.sign(
    { sub: user._id.toString(), rol: user.rol, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

const signRefreshToken = (user) =>
  jwt.sign(
    { sub: user._id.toString() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

/** opciones de cookie (ajusta para prod: secure:true + sameSite:'none') */
const ACCESS_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",     // en prod con otro dominio usa 'none' + secure:true
  secure: false,       // en prod detrás de HTTPS => true
  path: "/",
  maxAge: 15 * 60 * 1000, // 15m
};
const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  secure: false,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
};

async function hashPasswordIfNeeded(plain) {
  const saltRounds = 10;
  return bcrypt.hash(plain, saltRounds);
}

// -------- Register --------
export const register = async (req, res) => {
  const { nombre, apellido, dni, email, password, fechaNacimiento, telefono, rol } = req.body || {};
  if (!nombre || !apellido || !dni || !email || !password || !fechaNacimiento || !telefono) {
    return res.status(400).json({ message: "Faltan campos requeridos" });
  }

  // email/dni únicos
  const exists = await User.findOne({ $or: [{ email: String(email).toLowerCase() }, { dni }] }).lean();
  if (exists) return res.status(409).json({ message: "Email o DNI ya registrados" });

  // Rol: solo permitir ADMIN si es el primero del sistema
  let finalRol = "USUARIO";
  if (rol === "ADMIN") {
    const admins = await User.countDocuments({ rol: "ADMIN" });
    if (admins === 0) finalRol = "ADMIN"; else return res.status(403).json({ message: "No autorizado para crear ADMIN" });
  }

  // ⚠️ Si tu modelo hashea en pre('save'), usa password tal cual acá (sin hash)
  const passwordToSave = await hashPasswordIfNeeded(password);

  const user = await User.create({
    nombre,
    apellido,
    dni,
    email,
    password: passwordToSave,
    fechaNacimiento,
    telefono,
    rol: finalRol,
  });

  // emitir cookies
  const access = signAccessToken(user);
  const refresh = signRefreshToken(user);
  res.cookie("token", access, ACCESS_COOKIE_OPTS);
  res.cookie("refreshToken", refresh, REFRESH_COOKIE_OPTS);

  res.status(201).json({
    user: { id: user._id, nombre: user.nombre, apellido: user.apellido, email: user.email, rol: user.rol },
  });
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Faltan credenciales" });

    const emailNorm = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: emailNorm });
    if (!user) return res.status(401).json({ message: "Credenciales inválidas" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Credenciales inválidas" });

    const access = signAccessToken(user);
    const refresh = signRefreshToken(user);

    // setear cookies
    res.cookie("token", access, ACCESS_COOKIE_OPTS);
    res.cookie("refreshToken", refresh, REFRESH_COOKIE_OPTS);

    // no hace falta devolver el token, el navegador guarda la cookie
    res.json({
      user: { id: user._id, nombre: user.nombre, apellido: user.apellido, email: user.email, rol: user.rol },
    });
  } catch (err) {
    res.status(500).json({ message: "Error en login", error: err.message });
  }
};

export const refreshToken = (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ error: "No hay refreshToken" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const access = jwt.sign(
      { sub: decoded.sub },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("token", access, ACCESS_COOKIE_OPTS);
    return res.json({ ok: true });
  } catch (error) {
    return res.status(401).json({ error: "refreshToken inválido o expirado" });
  }
};

// -------- Logout --------
export const logout = (req, res) => {
  res.clearCookie("token", { ...ACCESS_COOKIE_OPTS, maxAge: undefined });
  res.clearCookie("refreshToken", { ...REFRESH_COOKIE_OPTS, maxAge: undefined });
  res.status(204).end();
};