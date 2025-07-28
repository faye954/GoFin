
const express = require('express');
const cors = require('cors');
const app = express();
const quoteRoutes = require('./routes/quote'); // 注意路径是否正确

app.use(cors());
app.use(express.json());

// 注册路由
app.use('/api/quote', quoteRoutes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

const path = require('path');

// 添加这行代码
app.use(express.static(path.join(__dirname, 'public')));
