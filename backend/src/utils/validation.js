const { body, param, query, validationResult } = require('express-validator');

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0.01 }).withMessage('Valid price is required'),
  body('category_id').isUUID().withMessage('Valid category ID is required'),
  body('brand').optional().trim(),
  body('stock_quantity').isInt({ min: 0 }).withMessage('Stock quantity must be a positive number'),
  body('discount_percent').optional().isFloat({ min: 0, max: 100 }),
  body('is_featured').optional().isBoolean(),
];

const reviewValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim(),
];

const cartValidation = [
  body('productId')
    .isInt({ min: 1 })
    .withMessage('Valid product ID (integer) is required')
    .toInt(),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1')
    .toInt(),
];

const orderValidation = [
  body('shipping_address').isObject().withMessage('Shipping address is required'),
  body('payment_method').isIn(['credit_card', 'paypal', 'cash_on_delivery']).withMessage('Valid payment method is required'),
];

// Validator middleware
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const errorMessages = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
    }));

    res.status(400).json({
      success: false,
      errors: errorMessages,
    });
  };
};

// ID validation middleware
const validateId = [
  param('id').isUUID().withMessage('Invalid ID format'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid ID format' 
      });
    }
    next();
  },
];

module.exports = {
  registerValidation,
  loginValidation,
  productValidation,
  reviewValidation,
  cartValidation,
  orderValidation,
  validate,
  validateId,
};
