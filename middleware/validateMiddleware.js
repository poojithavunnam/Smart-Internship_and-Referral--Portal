function requireFields(fields) {
  return (req, res, next) => {
    const missing = fields.filter(field => !req.body[field] || req.body[field].toString().trim() === '');
    if (missing.length) {
      return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
    }
    next();
  };
}

module.exports = {
  requireFields,
};
