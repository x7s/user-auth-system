import cron from 'node-cron';
import Log from '../models/Log.js';  // ако използваме Log модел за логове

// Почистване на логове по-стари от 30 дни
export const startLogCleanupJob = () => {
  // Схема: всеки ден в 3:00 сутринта
  cron.schedule('0 3 * * *', async () => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      const result = await Log.deleteMany({ timestamp: { $lt: cutoffDate } });
      console.log(`[Cron] Изтрити ${result.deletedCount} стари логове (${cutoffDate.toISOString()})`);
    } catch (err) {
      console.error('[Cron] Грешка при почистване на логове:', err);
    }
  }, {
    scheduled: true,
    timezone: "Europe/Sofia" // по избор
  });

  console.log('[Cron] Планирано е почистване на логове всеки ден в 3:00 AM');
};