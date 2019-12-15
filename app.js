const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDbStore = require('connect-mongodb-session')(session);
const secrets = require('./config/secret');
const csrf = require('csurf');
const flash = require('connect-flash');

const errorController = require('./controllers/error');
const User = require('./models/user');
const isAuth = require('./middleware/is-auth');

const app = express();
const store = new MongoDbStore({
  uri: secrets.mongoConnectionString,
  collection: 'sessions'
});
const csrfProtecetion = csrf();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: secrets.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store
  })
);

app.use(csrfProtecetion);
app.use(flash());
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  if (req.session.user) {
    User.findById(req.session.user._id)
      .then(user => {
        if (user) {
          req.session.user = user;
          return next();
        }
        next();
      })
      .catch(err => {
        throw new Error(err);
      });
  }
});


app.use('/admin', isAuth, adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);
app.use(errorController.get404);
app.use((error, req, res, next) => {
  errorController.get500(req, res, next);
})
mongoose
  .connect(secrets.mongoConnectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })

  .then(_result => {
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });
