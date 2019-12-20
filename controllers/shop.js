const Product = require('../models/product');
const Order = require('../models/order');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const ITEMS_PER_PAGE = 1;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalProducts;
  Product.find().countDocuments().then(amount => {
    totalProducts = amount;
    return Product.find().skip((page - 1) * ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE)
  }).then(products => {
    res.render('shop/product-list', {
      prods: products,
      pageTitle: 'All Products',
      path: '/products',
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalProducts,
      hasPreviousPage: page > 2,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalProducts / ITEMS_PER_PAGE),
    });
  })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalProducts;
  Product.find().countDocuments().then(amount => {
    totalProducts = amount;
    return Product.find().skip((page - 1) * ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE)
  }).then(products => {
    res.render('shop/index', {
      prods: products,
      pageTitle: 'Shop',
      path: '/',
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalProducts,
      hasPreviousPage: page > 2,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalProducts / ITEMS_PER_PAGE),
    });
  })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.getCart = (req, res, next) => {
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
    .catch(err => {


      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });

};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.session.user.addToCart(product);
    })
    .then(_result => {
      // console.log(result);
      res.redirect('/cart');
    }).catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.session.user
    .removeFromCart(prodId)
    .then(_result => {
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });

};

exports.postOrder = (req, res, next) => {
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
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });

};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.session.user._id })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });

};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then(order => {
      if (!order) {
        console.log('order not found ');
        return next(new Error('order not found'));
      }
      if (order.user.userId.toString() !== req.session.user._id.toString()) {
        console.log('order not found for the user');
        return next(new Error('order not found for the user'));
      }
      const invoiceName = `invoice-${orderId}.pdf`;
      const invoicePath = path.join('data', 'invoices', invoiceName);
      const pdfDoc = new PDFDocument();
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${invoiceName}"`);
      pdfDoc.fontSize(26).text(`Invoice - ${orderId}`, { underline: true });
      let totalPrice = 0;
      order.products.forEach(item => {
        pdfDoc.fontSize(14).text(`${item.product.title} (${item.quantity}) - ${item.product.price}$ `);
        totalPrice += item.quantity * item.product.price;

      });
      pdfDoc.fontSize(20).text(`Total: $${totalPrice}`, { underline: true });

      pdfDoc.end();
      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     return next(err);
      //   }

      //   res.setHeader("Content-Type", "application/pdf");
      //   res.setHeader("Content-Disposition", `inline; filename="${invoiceName}"`);
      //   res.send(data);
      // })
      // const file = fs.createReadStream(invoicePath);

      // file.pipe(res);
    }).catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });

};
