import express from 'express'
import { isAuthenticated, authorizeRoles } from '../middlewares/auth.js'
import { getAllLogs, getLogsByUser, getLogsByAction } from '../controllers/logsController.js'

const router = express.Router()

// Всички логове (за админ/модератор)
router.get(
  '/',
  isAuthenticated,
  authorizeRoles('admin', 'moderator'),
  getAllLogs
)

// Логове по потребител
router.get(
  '/user/:userId',
  isAuthenticated,
  authorizeRoles('admin', 'moderator'),
  getLogsByUser
)

// Логове по действие
router.get(
  '/action/:action',
  isAuthenticated,
  authorizeRoles('admin', 'moderator'),
  getLogsByAction
)

export default router