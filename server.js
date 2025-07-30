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

// 静态资源服务
app.use(express.static(path.join(__dirname, 'public')));
app.use('/image', express.static('image'));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
