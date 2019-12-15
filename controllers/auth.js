const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const User = require('../models/user');

const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const secrets = require('../config/secret');
const { validationResult } = require('express-validator');

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
    message: req.flash('message'),
    csrfToken: req.csrfToken(),
    email: null,
    password: null,
    validationErrors: []
  });
  // console.log(req.session);
};

exports.getSignup = (req, res, _next) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: false,
    errorMessage: req.flash('error'),
    message: req.flash('message'),
    csrfToken: req.csrfToken(),
    email: null,
    password: null,
    confirmPassword: null,
    validationErrors: []
  });
};

exports.getReset = (req, res, _next) => {
  res.render('auth/reset', {
    pageTitle: 'Reset Password',
    path: '/reset',
    isAuthenticated: req.session.isLoggedIn,
    errorMessage: req.flash('error'),
    message: req.flash('message'),
    csrfToken: req.csrfToken(),
    email: null,
    validationErrors: []
  });
};

exports.getNewpassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token }).then(user => {
    if (!user) {
      req.flash('error', 'Token does not exist or have been used');
      return res.redirect('/reset');
    }
    if (Date.now() > user.resetTokenExpires) {
      req.flash('error', 'Token experied');
      return res.redirect('/reset');
    }
    res.render('auth/new-password', {
      pageTitle: 'Update Password',
      path: '/reset',
      isAuthenticated: req.session.isLoggedIn,
      errorMessage: req.flash('error'),
      message: req.flash('message'),
      csrfToken: req.csrfToken(),
      userId: user._id.toString(),
      token,
      password: null,
      confirmPassword: null,
      validationErrors: []
    })
  }).catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};


exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      isAuthenticated: false,
      errorMessage: errors.array()[0].msg,
      message: '',
      csrfToken: req.csrfToken(),
      email, password,
      validationErrors: errors.array()
    });
  }
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
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          isAuthenticated: false,
          errorMessage: 'Invalid User or Password',
          message: '',
          csrfToken: req.csrfToken(),
          email, password,
          validationErrors: errors.array()

        });
      }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  }).catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(() => {
    res.redirect('/');
  }).catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      isAuthenticated: false,
      errorMessage: errors.array()[0].msg,
      message: '',
      csrfToken: req.csrfToken(),
      email, password, confirmPassword,
      validationErrors: errors.array()
    });
  }

  bcrypt.hash(password, 12)
    .then(hashedPassword => {
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
        <p><br></p>
        we love seeing you at our shop<br>
        The management</p></div>`
      }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
      return req.session.save(() => res.redirect('/'));
    }).catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.postReset = (req, res, next) => {
  const errors = validationResult(req);
  const email = req.body.email;

  if (!errors.isEmpty()) {
    return res.status(422).render('auth/reset', {
      path: '/reset',
      pageTitle: 'Reset Password',
      isAuthenticated: false,
      errorMessage: errors.array()[0].msg,
      message: '',
      csrfToken: req.csrfToken(),
      email,
      validationErrors: errors.array()
    });
  }
  User.findOne({ email }).then(user => {
    crypto.randomBytes(32, (err, buffer) => {
      if (err) {
        console.error(err);
        req.flash('error', 'General Error');
        return res.redirect('/reset');
      }
      const token = buffer.toString('hex');
      user.resetToken = token;
      user.resetTokenExpires = Date.now() + 3600000;
      user.save().then(user => {
        const link = `http://localhost:3000/reset/${user.resetToken}`
        return transporter.sendMail({
          to: email,
          from: 'node@krakovsky.info',
          subject: 'You forgot your password to nodecart',
          html: `<div dir="ltr"><h1>Password reset from nodecart.</h1>
            <p>we have received a request to reset your account of this<br>
            In order to define a new password click here <a href="${link}" >${link}</a><br>
            <p><br></p>
            we love seeing you at our shop<br>
            The management</p></div>`
        }).then(() => {
          req.flash('message', 'Password reset mail was successfully sent');
          return res.redirect('/login');
        }).catch(err => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
      })
    })
  }).catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });

};


exports.postNewpassword = (req, res, next) => {
  const userId = req.body.userId;
  const token = req.body.token;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('auth/new-password', {
      pageTitle: 'Update Password',
      path: '/reset',
      isAuthenticated: req.session.isLoggedIn,
      errorMessage: errors.array()[0].msg,
      message: req.flash('message'),
      csrfToken: req.csrfToken(),
      userId, password, confirmPassword, token,
      validationErrors: errors.array()
    })
  }
  // if (password !== confirmPassword) {
  //   req.flash('error', 'Passwords do not match');
  //   return res.redirect(`/reset/${token}`);
  // }
  User.findById(userId).then(user => {
    if (user.resetToken !== token) {
      req.flash('error', 'Token does not exist or have been used');
      return res.redirect('/reset');
    }
    if (Date.now() > user.resetTokenExpires) {
      req.flash('error', 'Token experied');
      return res.redirect('/reset');
    }
    return bcrypt.hash(password, 12).then(hashedPassword => {
      user.password = hashedPassword;
      user.resetToken = undefined;
      user.resetTokenExpires = undefined;
      return user.save()
    })
  }).then(() => {
    req.flash('message', 'Password updated successfully');
    return res.redirect('/login');
  }).catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};
