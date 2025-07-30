// app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const combinedRoutes = require('./routes/quote-combined');
const financeRoutes = require('./routes/finance');
const historyRoutes = require('./routes/history');

const app = express();

app.use(cors());
app.use(express.json());

app.use(combinedRoutes);           // 原有主路由
app.use('/finance', financeRoutes); // ✅ 新增
app.use('/history', historyRoutes); // ✅ 新增

app.use(express.static(path.join(__dirname, 'public')));
app.use('/image', express.static('image'));

module.exports = app;



