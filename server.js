const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');

// 引入合并后的路由
const combinedRoutes = require('./routes/quote-combined');

app.use(cors());
app.use(express.json());

// 使用合并后的路由
app.use(combinedRoutes);
const express = require('express');
const cors = require('cors');
const path = require('path');
const combinedRoutes = require('./routes/quote-combined'); // 引入合并后的路由

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

// 使用合并后的路由
app.use(combinedRoutes);

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
// 静态资源服务
app.use(express.static(path.join(__dirname, 'public')));
app.use('/image', express.static('image'));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
