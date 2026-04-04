var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
let mongoose = require('mongoose')

var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/user'); // ❌ không cần nữa

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// ===== API ROUTES =====
app.use('/api/v1', require('./routes')); // 🔥 dùng index router

// app.use('/api/v1/users', usersRouter);
// app.use('/api/v1/roles', require('./routes/role'));
// app.use('/api/v1/auth', require('./routes/auth'));

// app.use('/api/v1/categories', require('./routes/category'));
// app.use('/api/v1/books', require('./routes/book')); 
// app.use('/api/v1/authors', require('./routes/author'));

// app.use('/api/v1/carts', require('./routes/cart'));
// app.use('/api/v1/orders', require('./routes/order'));

// app.use('/api/v1/payments', require('./routes/payment'));
// app.use('/api/v1/shipments', require('./routes/shipment'));

// app.use('/api/v1/addresses', require('./routes/address'));
// app.use('/api/v1/inventories', require('./routes/inventory'));

// app.use('/api/v1/carts', require('./routes/carts'));
// app.use('/api/v1/upload', require('./routes/uploads'));

mongoose.connect('mongodb://localhost:27017/bookstore');
mongoose.connection.on('connected', function () {
  console.log("connected");
})
mongoose.connection.on('disconnected', function () {
  console.log("disconnected");
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;