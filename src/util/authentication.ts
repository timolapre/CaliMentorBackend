export async function isAuthenticated(req, res, next) {
  if (!req.session.userId) {
    return res.sendStatus(401);
  }
  return next();
}
