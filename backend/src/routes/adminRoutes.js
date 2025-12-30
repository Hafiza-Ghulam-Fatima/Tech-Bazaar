const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const adminCategoryController = require('../controllers/adminCategoryController');
const adminProductController = require('../controllers/adminProductController');

// Test route
router.get('/test', protect, admin, (req, res) => {
  res.json({
    success: true,
    message: 'Admin route is working',
    user: req.user
  });
});

// Dashboard stats
router.get('/dashboard', protect, admin, adminController.getDashboardStats);

// User management
router.get('/users', protect, admin, adminController.getUsers);
router.put('/users/:id', protect, admin, adminController.updateUser);
router.delete('/users/:id', protect, admin, adminController.deleteUser);

// Order management
router.get('/orders', protect, admin, adminController.getOrders);
router.get('/orders/:id', protect, admin, adminController.getOrderDetails);
router.put('/orders/:id/status', protect, admin, adminController.updateOrderStatus);

// Product management - Use adminController for list and create, adminProductController for specific operations
router.get('/products', protect, admin, adminController.getAllProducts);
router.post('/products', protect, admin, adminController.createProduct);
router.get('/products/:id', protect, admin, adminProductController.getProductById);
router.put('/products/:id', protect, admin, adminProductController.updateProduct);
router.delete('/products/:id', protect, admin, adminProductController.deleteProduct);

// Category management
router.get('/categories', protect, admin, adminCategoryController.getCategories);
router.get('/categories/:id', protect, admin, adminCategoryController.getCategoryById);
router.post('/categories', protect, admin, adminCategoryController.createCategory);
router.put('/categories/:id', protect, admin, adminCategoryController.updateCategory);
router.delete('/categories/:id', protect, admin, adminCategoryController.deleteCategory);

module.exports = router;