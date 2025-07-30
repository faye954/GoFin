const express = require('express');
const cors = require('cors');
const path = require('path');
const combinedRoutes = require('./routes/quote-combined');
const portfolioRoutes = require('./routes/portfolio');
const historyRoutes = require('./routes/history');

const app = express();
const PORT = 3001;

// 跨域配置
app.use(cors());
// 解析JSON请求体
app.use(express.json());
// 静态文件服务（public目录）
app.use(express.static(path.join(__dirname, 'public')));
// 图片静态服务
app.use('/image', express.static('image'));
app.use('/api', historyRoutes);

// 使用合并后的路由
app.use(combinedRoutes);

app.use('/', portfolioRoutes);

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});