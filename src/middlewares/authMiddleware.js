import jwt from 'jsonwebtoken'

export const protegerRuta = (req, res, next) => {

    const authHeader = req.headers.authorization

    if(!authHeader?.startsWith("Bearer ")){
        return res.status(401).json({ error: "Token no proporcionado"})
    }

    const token = authHeader.split(" ")[1]

    console.log("Token: ", token);
    
    try {

    const decodificado = jwt.verify(token, process.env.JWT_SECRET)

    console.log("decodificado: ", decodificado);


    next()

} catch (error) {
    return res.status(403).json({error: "token invalido o expirado"})
}
}