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

export default router;