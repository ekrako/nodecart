const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');

const errorController = require('./controllers/error');
const User = require('./models/user');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const secrets = require('./config/secret');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: secrets.sessionSecret,
    resave: false,
    saveUninitialized: false
  })
);
app.use((req, _res, next) => {
  User.findById('5de6bf8414ee0a0a3ff5aabc')
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => console.log(err));
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose
  .connect(secrets.mongoConnectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })

  .then(_result => {
    User.findOne().then(user => {
      if (!user) {
        const user = new User({
          name: 'Eran Krakovsky',
          email: 'ekrako@test.com',
          cart: {
            items: []
          }
        });
        user.save();
      }
    });
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });
