import express from 'express';
import { isAuthenticated, ensureRoles } from '../middlewares/auth.js'; // съществуващи middlewares
import { logRouteAccess } from '../middlewares/loggerMiddleware.js';
import Log from '../models/Log.js'; // лог модел
import { Parser } from 'json2csv';

const router = express.Router();

// Експорт в JSON
router.get('/logs/export/json', isAuthenticated, ensureRoles(['admin', 'moderator']), logRouteAccess(`Експортира JSON записи`), async (req, res) => {
  try {
    const logs = await Log.find().lean();
    res.setHeader('Content-Disposition', 'attachment; filename=logs.json');
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Грешка при експортиране на логовете.' });
  }
});

// Експорт в CSV
router.get('/logs/export/csv', isAuthenticated, ensureRoles(['admin', 'moderator']), logRouteAccess(`Експортира CSV записи`), async (req, res) => {
  try {
    const logs = await Log.find().lean();
    const fields = ['user', 'action', 'details', 'ip', 'createdAt']; // съобразен с модела лог за да отразява реалната структура на Log
    const parser = new Parser({ fields });
    const csv = parser.parse(logs);
    res.setHeader('Content-Disposition', 'attachment; filename=logs.csv');
    res.setHeader('Content-Type', 'text/csv');
    return res.send(csv);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Грешка при експортиране на логовете.' });
  }
});

export default router;