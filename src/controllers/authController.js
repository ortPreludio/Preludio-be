import User from "../models/User.js";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken";

function sign(user) {
  const payload = { id: user._id.toString(), rol: user.rol, email: user.email };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

const generarAccessToken = (user) => {
        //JWT.Sign
        // primer argumento, lo que vas a encriptar
        // segundo argumento, la llave para encriptar / desencriptar
        // tercer argumento, el tiempo que va a durar ese token
    const datosEncriptados = {id: user.id, email: user.email}

    const JWT_KEY = process.env.JWT_SECRET

   return jwt.sign(
        datosEncriptados,
        JWT_KEY,
        { expiresIn: "1h"}
    )
}

const generarRefreshToken = (user) => {

    return jwt.sign(
        {id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d"} 
    )
}
// ¿Hay al menos un ADMIN ya creado?
async function canCreateAdmin() {
  const count = await User.countDocuments({ rol: 'ADMIN' });
  return count === 0;
}

export const register = async (req, res) => {
  const { nombre, apellido, dni, email, password, fechaNacimiento, telefono, rol } = req.body || {};
  if (!nombre || !apellido || !dni || !email || !password || !fechaNacimiento || !telefono) {
    console.log(res);
    
    return res.status(400).json({ message: 'Faltan campos requeridos' });
  }

  const exists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { dni }] }).lean();
  if (exists) return res.status(409).json({ message: 'Email o DNI ya registrados' });

  const hash = await bcrypt.hash(password, 10);
  let finalRol = 'USUARIO';

  // Si ya hay un ADMIN en el sistema, solo ADMINs autenticados pueden crear otro ADMIN (este endpoint público no lo permite)
  if (rol === 'ADMIN') {
    if (await canCreateAdmin()) {
      finalRol = 'ADMIN';
    } else {
      return res.status(403).json({ message: 'No autorizado para crear ADMIN' });
    }
  }

  const user = await User.create({
    nombre, apellido, dni, email, password: hash, fechaNacimiento, telefono, rol: finalRol
  });

  const token = sign(user);
  res.status(201).json({ token, user: { id: user._id, nombre, apellido, email: user.email, rol: user.rol } });
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Faltan credenciales' });
    }
    const emailNorm = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: emailNorm });
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Credenciales inválidas' });

    const token = sign(user);
    res.json({
      token,
      user: { id: user._id, nombre: user.nombre, apellido: user.apellido, email: user.email, rol: user.rol }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error en login', error: err.message });
  }
};

export const refreshToken = (req, res) => {

    const token = req.cookies.refreshToken

    if(!token){
        return res.status(401).json({error: 'No hay refresh Token'})
    }

    try {
        
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);;

        // Si queremos pasarle todos los datos del usuario devuelta, habria que buscar el usuario

        const newAccessToken = jwt.sign(
            {id: decoded.id},
            process.env.JWT_SECRET,
            { expiresIn: '15m'}
        )

        res.json({accessToken: newAccessToken})
        

    } catch (error) {
        
    }
}


export const logout = (req, res) => {

    res.clearCookie('refreshToken')
    res.json({msg: "Logout Exitoso"})
}