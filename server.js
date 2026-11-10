/**
 * 本地开发入口（Vercel 上不会执行本文件，走 api/[...path].js）
 */
require('dotenv').config();
const express = require('express');
const { router } = require('./routes');

const app = express();
app.use(express.json());

// 静态文件（index.html / styles.css / app.js 均位于项目根目录，Vercel 也按此结构服务）
app.use(express.static(__dirname, { extensions: ['html'] }));

// API
app.use('/api', router);
app.use('/api', (req, res) => {
  res.status(404).json({ ok: false, error: '接口不存在' });
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`待办应用已启动：http://localhost:${PORT}`);
  console.log(`数据源：${process.env.SUPABASE_URL} (tasks 表)`);
});
