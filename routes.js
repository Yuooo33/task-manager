/**
 * 共享路由：本地（server.js）与 Vercel serverless（api/[...path].js）共用
 * 数据层：@supabase/supabase-js → Supabase REST API → tasks 表
 */
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const PRIORITIES = ['高', '中', '低'];

let client = null;
function db() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('缺少 SUPABASE_URL 或 SUPABASE_ANON_KEY 环境变量');
  }
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

function fail(res, status, message, detail) {
  return res.status(status).json({ ok: false, error: message, detail: detail || null });
}

const router = express.Router();

// 查询任务列表
router.get('/tasks', async (req, res) => {
  let supabase;
  try { supabase = db(); } catch (e) { return fail(res, 500, e.message); }

  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, priority, completed, created_at')
    .order('created_at', { ascending: false });

  if (error) return fail(res, 502, '查询任务列表失败', error.message);
  res.json({ ok: true, data });
});

// 新增任务
router.post('/tasks', async (req, res) => {
  let supabase;
  try { supabase = db(); } catch (e) { return fail(res, 500, e.message); }

  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  const priority = req.body?.priority ?? '中';

  if (!title) return fail(res, 400, '任务标题不能为空');
  if (!PRIORITIES.includes(priority)) return fail(res, 400, '优先级只能是 高 / 中 / 低');

  const { data, error } = await supabase
    .from('tasks')
    .insert({ title, priority, completed: false })
    .select('id, title, priority, completed, created_at')
    .single();

  if (error) return fail(res, 502, '新增任务失败', error.message);
  res.status(201).json({ ok: true, data });
});

// 切换完成状态
router.patch('/tasks/:id', async (req, res) => {
  let supabase;
  try { supabase = db(); } catch (e) { return fail(res, 500, e.message); }

  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return fail(res, 400, '任务 id 不合法');
  if (typeof req.body?.completed !== 'boolean') return fail(res, 400, 'completed 必须是布尔值');

  const { data, error } = await supabase
    .from('tasks')
    .update({ completed: req.body.completed })
    .eq('id', id)
    .select('id, title, priority, completed, created_at')
    .maybeSingle();

  if (error) return fail(res, 502, '更新任务失败', error.message);
  if (!data) return fail(res, 404, '任务不存在');
  res.json({ ok: true, data });
});

// 删除任务
router.delete('/tasks/:id', async (req, res) => {
  let supabase;
  try { supabase = db(); } catch (e) { return fail(res, 500, e.message); }

  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return fail(res, 400, '任务 id 不合法');

  const { data, error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) return fail(res, 502, '删除任务失败', error.message);
  if (!data) return fail(res, 404, '任务不存在');
  res.json({ ok: true, data: { id } });
});

// 健康检查
router.get('/health', async (req, res) => {
  let supabase;
  try { supabase = db(); } catch (e) { return fail(res, 500, e.message); }

  const { error } = await supabase.from('tasks').select('id').limit(1);
  if (error) return fail(res, 502, 'Supabase 连接异常', error.message);
  res.json({ ok: true, backend: 'supabase', supabase_url: SUPABASE_URL });
});

module.exports = { router, PRIORITIES };
