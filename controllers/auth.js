const bcrypt = require('bcryptjs');

const User = require('../models/user');

const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const secrets = require('../config/secret');


const transporter = nodemailer.createTransport(sendgridTransport({
  auth: {
    api_key: secrets.sendgridApiKey
  }
}))

exports.getLogin = (req, res, _next) => {
  res.render('auth/login', {
    pageTitle: 'Login',
    path: '/login',
    isAuthenticated: req.session.isLoggedIn,
    errorMessage: req.flash('error'),
    csrfToken: req.csrfToken()
  });
  // console.log(req.session);
};

exports.getSignup = (req, res, _next) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: false,
    errorMessage: req.flash('error'),
    csrfToken: req.csrfToken()
  });
};

exports.postLogin = (req, res, _next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email }).then(user => {
    if (!user) {
      req.flash('error', 'Invalid User or Password');
      return res.redirect('/signup');
    }
    return bcrypt.compare(password, user.password)
      .then(doMatch => {
        if (doMatch) {
          req.session.isLoggedIn = true;
          req.session.user = user;
          return req.session.save(() => res.redirect('/'));
        }
        req.flash('error', 'Invalid User or Password');
        return res.redirect('/login');
      }).catch(err => console.log(err));
  }).catch(err => console.log(err));
};

exports.postLogout = (req, res, _next) => {
  req.session.destroy(() => {
    res.redirect('/');
  })
};
exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  if (password !== confirmPassword) {
    req.flash('error', 'Password don not match');
    return res.redirect('/signup');
  }
  User.findOne({ email }).then(userDoc => {
    if (userDoc) {
      return this.postLogin(req, res, next);
    }
    return bcrypt.hash(password, 12).then(hashedPassword => {
      const user = new User({
        email,
        password: hashedPassword,
        cart: { items: [] }
      })
      return user.save()

    }).then(user => {
      req.session.isLoggedIn = true;
      req.session.user = user;
      transporter.sendMail({
        to: email,
        from: 'node@krakovsky.info',
        subject: 'Welcome to node cart',
        html: `<div dir="ltr"><h1>Hello from nodecart.</h1>
        <p>we love to welcome you to our shop your login credniials are the following.<br>
        E-mail: ${user.email} <br>
        Password: ${password} <br>
        
        we love seeing you at our shop<br>
        The management</p></div>`
      }).catch(err => console.log(err));
      return req.session.save(() => res.redirect('/'));
    }).catch(err => console.log(err));
  }).catch(err => console.log(err));


};


