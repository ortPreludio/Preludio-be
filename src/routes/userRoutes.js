import express from 'express'
import { getUsers, createUser, getUsersSearch, getUserById } from '../controllers/usersController.js'
import { protegerRuta } from '../middlewares/authMiddleware.js'

const router = express.Router()

// /api/users/
router.get("/", getUsers)
router.get("/search", getUsersSearch)
router.get("/:id", protegerRuta, getUserById) // Nueva ruta - debe ir después de /search
router.get("/", protegerRuta, getUsers)
router.get("/search", protegerRuta, getUsersSearch)
router.post("/", createUser)

export default routerUnauthorized