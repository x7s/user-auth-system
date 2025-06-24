import express from 'express'
import { isAuthenticated } from '../middlewares/auth.js'
import {
  getAccountSettings,
  updateAccountInfo,
  changePassword,
} from '../controllers/accountController.js'

const router = express.Router()

// Получаване на акаунт настройки (данни)
router.get('/', isAuthenticated, getAccountSettings)

// Актуализация на име и email
router.post('/update', isAuthenticated, updateAccountInfo)

// Смяна на парола
router.post('/change-password', isAuthenticated, changePassword)

export default router