const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.get('/reset', authController.getReset);

router.get('/reset/:token', authController.getNewpassword);

router.post('/login', [
    body('email').normalizeEmail().isEmail().withMessage('Please enter valid email'),
    body('password', 'Minimum password length 6 characters and only alphanumeric characters').trim().isAlphanumeric().isLength({ min: 6 })
], authController.postLogin);

router.post('/signup', [
    body('email').normalizeEmail().isEmail().withMessage('Please enter valid email').custom((email, { _req }) => {
        return User.findOne({ email }).then(userDoc => {
            if (userDoc) {
                return Promise.reject('E-mail already exists')
            }
        })
    }),
    body('password', 'Minimum password length 6 characters and only alphanumeric characters').trim().isAlphanumeric().isLength({ min: 6 }),
    body('confirmPassword').trim().custom((value, { req }) => {
        if (value !== req.body.password) throw Error('Password are not the same')
        return true;
    })
],
    authController.postSignup);

router.post('/logout', authController.postLogout);

router.post('/reset', [
    body('email').normalizeEmail().isEmail().withMessage('Please enter valid email').custom((email, { _req }) => {
        return User.findOne({ email }).then(userDoc => {
            if (!userDoc) {
                return Promise.reject('E-mail was not registered')
            }
        })
    }),], authController.postReset);

router.post('/new-password', [
    body('password', 'Minimum password length 6 characters and only alphanumeric characters').trim().isAlphanumeric().isLength({ min: 6 }),
    body('confirmPassword').trim().custom((value, { req }) => {
        if (value !== req.body.password) throw Error('Password are not the same')
        return true;
    })
], authController.postNewpassword);


module.exports = router;