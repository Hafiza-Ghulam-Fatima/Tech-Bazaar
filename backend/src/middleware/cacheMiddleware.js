const cacheMiddleware = (req, res, next) => {
  if (req.method === 'GET') {
    // Cache products for 5 minutes
    if (req.path.startsWith('/api/products')) {
      res.setHeader('Cache-Control', 'public, max-age=300');
    }
    // Cache categories for 1 hour
    if (req.path === '/api/products/categories') {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  }
  next();
};

module.exports = cacheMiddleware;