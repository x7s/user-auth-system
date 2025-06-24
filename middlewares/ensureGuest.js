export function ensureGuest(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}