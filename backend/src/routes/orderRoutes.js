const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, admin } = require('../middleware/auth');
const { validate } = require('../utils/validation');
const { orderValidation } = require('../utils/validation');

// Protected routes
router.use(protect);

router.post('/', validate(orderValidation), orderController.createOrder);
router.get('/', orderController.getUserOrders);
router.get('/:id', orderController.getOrderById);

// Admin only routes
router.put('/:id/status', admin, orderController.updateOrderStatus);

module.exports = router;