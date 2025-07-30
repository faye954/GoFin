const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// 引入合并后的路由（即原 quoteRoutes 对应的合并路由）
const combinedRoutes = require('./routes/quote-combined');

// 通用中间件配置
app.use(cors()); // 跨域支持
app.use(express.json()); // 解析JSON请求体

// 挂载合并后的路由到 /api/quote 路径下
// （同时覆盖原两个文件的路由挂载逻辑，统一通过合并路由处理）
app.use('/api/quote', combinedRoutes);

// 静态文件服务配置
app.use(express.static(path.join(__dirname, 'public'))); // 公共静态资源
app.use('/image', express.static('image')); // 图片资源路由

// 启动服务
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});