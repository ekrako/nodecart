exports.getLogin = (req, res, _next) => {
  res.render('auth/login', {
    pageTitle: 'Login',
    path: '/login',
    isAuthenticated: req.session.isLoggedIn
  });
  console.log(req.session);
};

exports.postLogin = (req, res, _next) => {
  req.session.isLoggedIn = true;
  res.redirect('/');
};
