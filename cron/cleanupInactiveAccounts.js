import User from '../models/User.js';
import cron from 'node-cron';

const cleanupInactiveAccounts = () => {
  // Стартира всеки ден в 02:00 сутринта
  cron.schedule('0 2 * * *', async () => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 14); // 14 дни назад

      const result = await User.deleteMany({
        emailVerified: false,           // Не са потвърдили имейл
        createdAt: { $lt: cutoffDate }, // Създадени преди повече от 14 дни
      });

      console.log(`[Cron] Изтрити неактивни акаунти: ${result.deletedCount}`);
    } catch (error) {
      console.error('[Cron] Грешка при почистване на неактивни акаунти:', error);
    }
  });
};

export default cleanupInactiveAccounts;