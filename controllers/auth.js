exports.getLogin = (req, res, _next) => {
  req.isLoggedIn =
    req
      .get('Cookie')
      .split(';')[0]
      .split('=')[1] === 'true';
  res.render('auth/login', {
    pageTitle: 'Login',
    path: '/login',
    isAuthenticated: req.isLoggedIn
  });
};

exports.postLogin = (req, res, _next) => {
  res.setHeader('Set-Cookie', 'isLoggedIn=true');
  res.redirect('/');
};
