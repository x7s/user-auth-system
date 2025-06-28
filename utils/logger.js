import Log from '../models/Log.js';

// 🔧 Универсален логгер
export async function createLog({ user, action, details, ip }) {
  try {
    await Log.create({ user, action, details, ip });
  } catch (error) {
    console.error('Грешка при създаване на лог:', error);
  }
}

// ✅ Логва успешно влизане
export async function logLogin(user, ip) {
  await createLog({
    user: user._id,
    action: 'login',
    details: `Потребител ${user.email} влезе в системата.`,
    ip,
  });
}

// ✅ Логва изход
export async function logLogout(user, ip) {
  await createLog({
    user: user._id,
    action: 'logout',
    details: `Потребител ${user.email} излезе от системата.`,
    ip,
  });
}

// ✅ Логва промяна на профил
export async function logProfileUpdate(user, changes, ip) {
  await createLog({
    user: user._id,
    action: 'profile_update',
    details: `Потребител ${user.email} промени профила: ${changes}`,
    ip,
  });
}

// ✅ Логва изтриване на акаунт
export async function logAccountDeletion(user, ip) {
  await createLog({
    user: user._id,
    action: 'account_deletion',
    details: `Потребител ${user.email} изтри акаунта си.`,
    ip,
  });
}
