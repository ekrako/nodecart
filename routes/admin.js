
const { body } = require('express-validator');

const express = require('express');

const adminController = require('../controllers/admin');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', adminController.getAddProduct);

// /admin/products => GET
router.get('/products', adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product', [
    body('imageUrl').isURL().withMessage('Enter a Valid Image Url'),
    body('price').isCurrency({ allow_negatives: false, digits_after_decimal: [1, 2] }).withMessage('Enter Valid Price'),
    body('title').trim().isString().withMessage('Only alphanumeric characters').isLength({ min: 3 }).withMessage('Title should be at least 3 characters long'),
    body('description').trim().isString().withMessage('Only alphanumeric characters').isLength({ min: 5 }).withMessage('description should be at least 5 characters long'),
], adminController.postAddProduct);

router.get('/edit-product/:productId', adminController.getEditProduct);

router.post('/edit-product', [
    body('imageUrl').isURL().withMessage('Enter a Valid Image Url'),
    body('price').isCurrency({ allow_negatives: false, digits_after_decimal: [1, 2] }).withMessage('Enter Valid Price'),
    body('title').trim().isString().withMessage('Only alphanumeric characters').isLength({ min: 3 }).withMessage('Title should be at least 3 characters long'),
    body('description').trim().isString().withMessage('Only alphanumeric characters').isLength({ min: 5 }).withMessage('description should be at least 5 characters long'),
], adminController.postEditProduct);

router.post('/delete-product', adminController.postDeleteProduct);

module.exports = router;
