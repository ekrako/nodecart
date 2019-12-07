const bcrypt = require('bcryptjs');

const User = require('../models/user');

exports.getLogin = (req, res, _next) => {
  res.render('auth/login', {
    pageTitle: 'Login',
    path: '/login',
    isAuthenticated: req.session.isLoggedIn,
    csrfToken: req.csrfToken()
  });
  // console.log(req.session);
};

exports.getSignup = (req, res, _next) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: false,
    csrfToken: req.csrfToken()
  });
};

exports.postLogin = (req, res, _next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email }).then(user => {
    if (!user) {
      return res.redirect('/signup');
    }
    return bcrypt.compare(password, user.password)
      .then(doMatch => {
        if (doMatch) {
          req.session.isLoggedIn = true;
          req.session.user = user;
          return req.session.save(() => res.redirect('/'));
        }
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
  const _confirmPassword = req.body.confirmPassword;

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
      return req.session.save(() => res.redirect('/'));
    }).catch(err => console.log(err));
  }).catch(err => console.log(err));


};


