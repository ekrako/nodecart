const User = require('../models/user');

exports.getLogin = (req, res, _next) => {
  res.render('auth/login', {
    pageTitle: 'Login',
    path: '/login',
    isAuthenticated: req.session.isLoggedIn
  });
  console.log(req.session);
};

exports.postLogin = (req, res, _next) => {
  User.findById('5de6bf8414ee0a0a3ff5aabc')
    .then(user => {
      req.session.isLoggedIn = true;
      req.session.user = user;
      res.redirect('/');
    })
    .catch(err => console.log(err));
};

exports.postLogout = (req, res, _next) => {
  req.session.destroy(() => {
    res.redirect('/');
  })
};