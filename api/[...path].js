/**
 * Vercel serverless 入口：/api/* 全部由此函数处理
 * 本地开发不使用此文件（本地跑 server.js）
 */
const express = require('express');
const { router } = require('../routes');

const app = express();
app.use(express.json({ limit: '1mb' }));

// 兼容两种 path 形态：/api/tasks 与 /tasks
app.use('/api', router);
app.use('/', router);
app.use((req, res) => {
  res.status(404).json({ ok: false, error: '接口不存在', path: req.url });
});

module.exports = app;
