import { users } from "../data/users.js";
import User from "../models/User.js";


export const getUsers = async (req, res) => {


    try {

        const user = await User.find()
        res.json(user)

    } catch (error) {
        res.status(500).json({ error: "Error al obtener users", errorMsg: error})
    }
}

export const getUsersSearch = async (req, res) => {

    const {nombre} = req.query

    try {

        const user = await User.find({
            nombre: { 
                $regex: `^${nombre}`,
                $options: 'i'}
        })
        res.json(user)

    } catch (error) {
        res.status(500).json({ error: "Error al obtener users", errorMsg: error})
    }
}

export const createUser = async (req, res) => {

    console.log("req.body: ", req.body);


    if (!req.body.nombre && !req.body.edad && !req.body.email && !req.body.password) {
        res.status(400).json({
            error: "Faltan Datos"
        })
    }

    const nuevoUsuario = {
        nombre: req.body.nombre,
        edad: req.body.edad,
        email: req.body.email,
        password: req.body.password
    };

    try {
        const newUser = await User.create(nuevoUsuario)
        res.status(201).json(newUser)

    } catch (error) {
        res.status(500).json({ error: "Error al crear Alumno", errorMsg: error })
    }

}

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Asumiendo que tenés middleware de autenticación
    const { nombre, apellido, dni, email, telefono, fechaNacimiento } = req.body;

    // Validaciones básicas
    if (!nombre || !apellido || !dni || !email || !telefono || !fechaNacimiento) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email inválido' });
    }

    // Validar DNI (7-10 dígitos)
    if (!/^\d{7,10}$/.test(dni)) {
      return res.status(400).json({ message: 'DNI inválido' });
    }

    // Validar teléfono (6-15 dígitos)
    if (!/^\d{6,15}$/.test(telefono)) {
      return res.status(400).json({ message: 'Teléfono inválido' });
    }

    // Actualizar en la base de datos
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        dni: dni.trim(),
        email: email.trim().toLowerCase(),
        telefono: telefono.trim(),
        fechaNacimiento
      },
      { new: true, runValidators: true }
    ).select('-password'); // No devolver la contraseña

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ 
      message: 'Perfil actualizado correctamente',
      user: updatedUser 
    });

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ message: 'Error al actualizar el perfil' });
  }
};

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await User.findById(id).select('-password'); // No enviar la contraseña
        
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        res.json(user);
        
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ error: "Error al obtener usuario", errorMsg: error.message });
    }
};