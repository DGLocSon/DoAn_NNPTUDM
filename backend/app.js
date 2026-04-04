var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
let mongoose = require('mongoose');

var app = express();

// ===== MIDDLEWARE =====
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ===== API ROUTES =====
app.use('/api/v1', require('./routes'));

// ===== CONNECT DB =====
mongoose.connect('mongodb://localhost:27017/bookstore');

mongoose.connection.on('connected', function () {
  console.log("MongoDB connected");
});

mongoose.connection.on('disconnected', function () {
  console.log("MongoDB disconnected");
});

// ===== HANDLE 404 =====
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API not found"
  });
});

// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

module.exports = app;