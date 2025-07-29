const express = require('express');
const cors = require('cors');
const app = express();
const quoteRoutes = require('./routes/quote'); // 确保路径正确

// 跨域和JSON解析配置
app.use(cors());
app.use(express.json());

// 注册股票数据路由
app.use('/api/quote', quoteRoutes);

// 静态文件服务（如前端页面）
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

// 启动服务器
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
