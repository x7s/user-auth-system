import express from 'express';
import ActivityLog from '../models/ActivityLog.js';
import { isAuthenticated, ensureRole } from '../middlewares/auth.js';
import { logRouteAccess } from '../middlewares/loggerMiddleware.js';

const router = express.Router();

// Само модератори и админи могат да видят логовете
router.get('/', isAuthenticated, ensureRole(['admin', 'moderator']), logRouteAccess('Неоторизиран достъп до логове'), async (req, res) => {
  const logs = await ActivityLog.find()
    .populate('user', 'username email')
    .sort({ createdAt: -1 })
    .limit(100); // последните 100 записи

  res.json(logs);
});

export default router;