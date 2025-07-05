import User from '../models/User.js'

export async function listUsers(req, res) {
  try {
    const users = await User.find().lean()
    res.render('admin/users', {
      title: 'Списък с потребители',
      users,
      user: req.user
  });
  } catch (err) {
    console.error(err)
    res.status(500).send('Грешка при зареждане на потребители.')
  }
}

export async function updateRole(req, res) {
  try {
    const { userId, role } = req.body

    if (!['admin', 'moderator', 'user'].includes(role)) {
      return res.status(400).send('Невалидна роля')
    }

    await User.findByIdAndUpdate(userId, { role })
    res.redirect('/admin/users')
  } catch (err) {
    console.error(err)
    res.status(500).send('Грешка при промяна на роля.')
  }
}

export const getProfile = async (req, res) => {
  try {
    res.json({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      provider: req.user.provider,
    })
  } catch (err) {
    res.status(500).json({ error: 'Неуспешно зареждане на профил.' })
  }
}