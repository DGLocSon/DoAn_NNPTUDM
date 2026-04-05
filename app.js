var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
let mongoose = require('mongoose')
var cors = require('cors');

var indexRouter = require('./routes/index');

var app = express();

// ===== MIDDLEWARE =====
app.use(logger('dev'));
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/v1', require('./routes'));

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