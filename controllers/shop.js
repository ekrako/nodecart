const Product = require('../models/product');
const Order = require('../models/order');

exports.getProducts = (req, res, _next) => {
  Product.find()
    .then(products => {
      // console.log(products);
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getProduct = (req, res, _next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
        isAuthenticated: req.session.isLoggedIn,
        csrfToken: req.csrfToken()
      });
    })
    .catch(err => console.log(err));
};

exports.getIndex = (req, res, _next) => {
  console.log(req.session.user)
  Product.find()
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getCart = (req, res, _next) => {
  req.session.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products,
      });
    })
    .catch(err => console.log(err));
};

exports.postCart = (req, res, _next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.session.user.addToCart(product);
    })
    .then(_result => {
      // console.log(result);
      res.redirect('/cart');
    });
};

exports.postCartDeleteProduct = (req, res, _next) => {
  const prodId = req.body.productId;
  req.session.user
    .removeFromCart(prodId)
    .then(_result => {
      res.redirect('/cart');
    })
    .catch(err => console.log(err));
};

exports.postOrder = (req, res, _next) => {
  req.session.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.session.user.email,
          userId: req.session.user
        },
        products: products
      });
      return order.save();
    })
    .then(_result => {
      return req.session.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => console.log(err));
};

exports.getOrders = (req, res, _next) => {
  Order.find({ 'user.userId': req.session.user._id })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
      });
    })
    .catch(err => console.log(err));
};
