import User from "../models/User.js";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken";

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

export const login = async (req, res) =>{


    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({
            error: "Faltan Email o Password"
        })
    }

    try {

        const user = await User.findOne({email})

        if(!user){
            return res.status(404).json({error: "Usuario no encontrado"})
        }

        const match = await bcrypt.compare(password, user.password)

        if(!match){
            return res.status(401).json({error: "Email o Password incorrectos"})
        }

        const accessToken = generarAccessToken(user)

        const refreshToken = generarRefreshToken(user)

        res.cookie('refreshToken', refreshToken,{
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // solo https en produccion
            sameSite: 'strict',
            maxAge: 1000 * 60 * 60 * 24 * 7
        })

        // Mandar el refresh token como cookie
        res.json({accessToken})
 
    } catch (error) {
        
    }
    
}

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