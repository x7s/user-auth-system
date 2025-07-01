import express from 'express'
import { listUsers, updateRole } from '../controllers/userController.js'
import { isAuthenticated, isAdmin, authorizeRoles, ensureRole } from '../middlewares/auth.js'
import Log from '../models/Log.js'
import { Parser as Json2csvParser } from 'json2csv';

const router = express.Router()

router.get('/', isAuthenticated, isAdmin, (req, res) => {
  res.render('admin', {
    title: 'Администраторски панел',
    user: req.user
  });
});

// Админ панел – списък с потребители
router.get('/users', isAuthenticated, isAdmin, listUsers)

// Промяна на роля на потребител (формата ще подава userId и нова роля)
router.post('/users/update-role', isAuthenticated, isAdmin, updateRole)

// Само администратори и модератори могат да виждат логовете
router.get('/logs', isAuthenticated, authorizeRoles('admin', 'moderator'), async (req, res) => {
  try {
    const logs = await Log.find().populate('user', 'email name').sort({ createdAt: -1 }).limit(100)
    res.json(logs)
  } catch (error) {
    res.status(500).json({ error: 'Грешка при зареждане на логовете.' })
  }
})

// Middleware само за администратори
router.use(isAuthenticated);
router.use(ensureRole('Admin'));

// GET /admin/logs/export?format=json|csv
router.get('/logs/export', async (req, res) => {
  try {
    const format = req.query.format === 'csv' ? 'csv' : 'json';
    const logs = await Log.find().sort({ timestamp: -1 });

    if (format === 'json') {
      res.setHeader('Content-Disposition', 'attachment; filename=logs.json');
      res.json(logs);
    } else {
      // CSV експорт
      const fields = ['userId', 'action', 'timestamp', 'details'];
      const json2csvParser = new Json2csvParser({ fields });
      const csv = json2csvParser.parse(logs.map(log => ({
        userId: log.userId.toString(),
        action: log.action,
        timestamp: log.timestamp.toISOString(),
        details: log.details || ''
      })));

      res.setHeader('Content-Disposition', 'attachment; filename=logs.csv');
      res.header('Content-Type', 'text/csv');
      res.send(csv);
    }
  } catch (error) {
    console.error('Грешка при експорт на логове:', error);
    res.status(500).send('Възникна грешка при експорта.');
  }
});

export default router