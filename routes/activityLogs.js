import express from 'express';
import Log from '../models/Log.js';
import { ensureRoles, isAuthenticated } from '../middlewares/auth.js';
import { logRouteAccess } from '../middlewares/loggerMiddleware.js';

const router = express.Router();

// За API заявки (оставяме го както е)
router.get('/', logRouteAccess('API Логове'), async (req, res) => {
  const { userId, action, fromDate, toDate, limit = 100 } = req.query;

  const filter = {};
  if (userId) filter.userId = userId;
  if (action) filter.action = action;
  if (fromDate || toDate) filter.createdAt = {};
  if (fromDate) filter.createdAt.$gte = new Date(fromDate);
  if (toDate) filter.createdAt.$lte = new Date(toDate);

  try {
    const logs = await Log.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    res.json(logs);
  } catch (error) {
    res.status(500).send('Грешка при зареждане на логовете.');
  }
});

// 🔍 Визуален изглед за админ/модератор
router.get('/view', isAuthenticated, ensureRoles(['admin', 'moderator']), logRouteAccess('Гледа Записи'), async (req, res) => {
  try {
    const logs = await Log.find().sort({ createdAt: -1 }).limit(100);
    res.render('activity-logs', {
      title: 'Дневници на действия',
      user: req.user,
      logs
    });
  } catch (error) {
    res.status(500).send('Грешка при визуализиране на логовете.');
  }
});

export default router;

/* оригиналния код на логовете, който е закоментиран
import express from 'express';
import ActivityLog from '../models/ActivityLog.js';
import { ensureRoles } from '../middlewares/auth.js';

const router = express.Router();

router.use(ensureRoles);

// Връща всички логове с опции за филтриране: userId, action, дата
router.get('/', async (req, res) => {
  const { userId, action, fromDate, toDate, limit = 100 } = req.query;

  const filter = {};
  if (userId) filter.userId = userId;
  if (action) filter.action = action;
  if (fromDate || toDate) filter.createdAt = {};
  if (fromDate) filter.createdAt.$gte = new Date(fromDate);
  if (toDate) filter.createdAt.$lte = new Date(toDate);

  try {
    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    res.json(logs);
  } catch (error) {
    res.status(500).send('Грешка при зареждане на логовете.');
  }
});

export default router;*/