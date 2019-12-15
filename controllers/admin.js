const Product = require('../models/product');
const { validationResult } = require('express-validator');


exports.getAddProduct = (req, res, _next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    errorMessage: '',
    message: '',
    editing: false,
    csrfToken: req.csrfToken(),
    validationErrors: [],
  });
};

exports.postAddProduct = (req, res, _next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      path: '/admin/add-product',
      pageTitle: 'Add Product',
      isAuthenticated: true,
      errorMessage: errors.array()[0].msg,
      message: '',
      editing: false,
      csrfToken: req.csrfToken(),
      product: { title, imageUrl, price, description },
      validationErrors: errors.array()
    });
  }
  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.session.user
  });
  product
    .save()
    .then(_result => {
      // console.log(result);
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getEditProduct = (req, res, _next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        csrfToken: req.csrfToken(),
        errorMessage: '',
        message: '',
        validationErrors: [],
      });
    })
    .catch(err => console.log(err));
};

exports.postEditProduct = (req, res, _next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedImageUrl = req.body.imageUrl;
  const updatedDesc = req.body.description;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      isAuthenticated: true,
      errorMessage: errors.array()[0].msg,
      message: '',
      editing: true,
      csrfToken: req.csrfToken(),
      product: { _id: prodId, title: updatedTitle, imageUrl: updatedImageUrl, price: updatedPrice, description: updatedDesc },
      validationErrors: errors.array()
    });
  }
  Product.findById(prodId)
    .then(product => {
      if (product.userId.toString() !== req.session.user._id.toString()) {
        res.redirect('/admin/products');
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      product.imageUrl = updatedImageUrl;
      return product.save()
        .then(_result => {
          console.log('UPDATED PRODUCT!');
          res.redirect('/admin/products');
        });
    })
    .catch(err => console.log(err));
};

exports.getProducts = (req, res, _next) => {
  Product.find({ userId: req.session.user._id })
    // .select('title price -_id')
    // .populate('userId', 'name')
    .then(products => {
      // console.log(products);

      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
        csrfToken: req.csrfToken(),
      });

    })
    .catch(err => console.log(err));
};

exports.postDeleteProduct = (req, res, _next) => {
  const prodId = req.body.productId;
  Product.deleteOne({ _id: prodId, userId: req.session.user._id })
    .then(() => {
      console.log('DESTROYED PRODUCT');
      res.redirect('/admin/products');
    })
    .catch(err => console.log(err));
};
