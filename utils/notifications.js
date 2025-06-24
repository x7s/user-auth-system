import Notification from '../models/Notification.js';

export async function createNotification(userId, message) {
  try {
    const notif = new Notification({ userId, message });
    await notif.save();
    return notif;
  } catch (error) {
    console.error('Грешка при създаване на нотификация:', error);
  }
}