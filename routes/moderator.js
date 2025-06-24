import express from 'express'
import { isAuthenticated, isModerator } from '../middlewares/auth.js'
import { listUsers } from '../controllers/userController.js'

const router = express.Router()

// Модераторски панел – преглед само
router.get('/users', isAuthenticated, isModerator, listUsers)

export default router