import express from 'express'
import { getUsers, createUser, getUsersSearch } from '../controllers/usersController.js'

const router = express.Router()

// /api/users/
router.get("/", getUsers)
router.get("/search", getUsersSearch)

router.post("/", createUser)

export default router