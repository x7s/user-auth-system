import express from 'express'
import { ensureAuthenticated, authorizeRoles } from '../middlewares/auth.js'
import { getAllLogs, getLogsByUser, getLogsByAction } from '../controllers/logsController.js'

const router = express.Router()

// Всички логове (за админ/модератор)
router.get(
  '/',
  ensureAuthenticated,
  authorizeRoles('admin', 'moderator'),
  getAllLogs
)

// Логове по потребител
router.get(
  '/user/:userId',
  ensureAuthenticated,
  authorizeRoles('admin', 'moderator'),
  getLogsByUser
)

// Логове по действие
router.get(
  '/action/:action',
  ensureAuthenticated,
  authorizeRoles('admin', 'moderator'),
  getLogsByAction
)

export default router