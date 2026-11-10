// 前端逻辑：全部通过后端 /api/tasks 访问数据（后端再经 @supabase/supabase-js 落库）
const state = { tasks: [], filter: 'all', priority: '中', busy: false };

const el = {
  title: document.getElementById('task-title'),
  addBtn: document.getElementById('add-btn'),
  list: document.getElementById('task-list'),
  empty: document.getElementById('empty'),
  conn: document.getElementById('conn-state'),
  total: document.getElementById('stat-total'),
  active: document.getElementById('stat-active'),
  done: document.getElementById('stat-done'),
  stamp: document.getElementById('stamp'),
  toast: document.getElementById('toast'),
};

let toastTimer = null;
function toast(msg, isError = false) {
  el.toast.textContent = msg;
  el.toast.className = 'toast' + (isError ? ' error' : '');
  el.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.toast.hidden = true), 2200);
}

async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let payload = null;
  try { payload = await res.json(); } catch (_) {}
  if (!res.ok || !payload?.ok) {
    throw new Error(payload?.error || `请求失败（HTTP ${res.status}）`);
  }
  return payload.data;
}

function formatTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function render() {
  const visible = state.tasks.filter((t) =>
    state.filter === 'all' ? true : state.filter === 'active' ? !t.completed : t.completed
  );

  el.list.innerHTML = '';
  visible.forEach((task) => {
    const li = document.createElement('li');
    li.className = 'task' + (task.completed ? ' done' : '');
    li.dataset.id = task.id;

    const check = document.createElement('button');
    check.type = 'button';
    check.className = 'check' + (task.completed ? ' done' : '');
    check.setAttribute('aria-label', task.completed ? '标记为未完成' : '标记为已完成');
    check.textContent = task.completed ? '✓' : '';
    check.addEventListener('click', () => toggleTask(task));

    const body = document.createElement('div');
    body.className = 'task-body';
    const title = document.createElement('div');
    title.className = 'task-title';
    title.textContent = task.title;
    const meta = document.createElement('div');
    meta.className = 'task-meta';
    const badge = document.createElement('span');
    badge.className = 'badge ' + ({ 高: 'high', 中: 'mid', 低: 'low' }[task.priority] || 'mid');
    badge.textContent = task.priority;
    const time = document.createElement('span');
    time.className = 'time';
    time.textContent = formatTime(task.created_at);
    meta.append(badge, time);
    body.append(title, meta);

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'del';
    del.title = '删除';
    del.textContent = '✕';
    del.addEventListener('click', () => removeTask(task));

    li.append(check, body, del);
    el.list.appendChild(li);
  });

  el.empty.hidden = visible.length > 0;
  const total = state.tasks.length;
  const done = state.tasks.filter((t) => t.completed).length;
  el.total.textContent = total;
  el.active.textContent = total - done;
  el.done.textContent = done;
}

async function loadTasks() {
  try {
    state.tasks = await api('/api/tasks');
    el.conn.textContent = '已连接';
    el.conn.className = 'ok';
    render();
    el.stamp.textContent = '更新于 ' + new Date().toLocaleTimeString('zh-CN', { hour12: false });
  } catch (err) {
    el.conn.textContent = '连接失败';
    el.conn.className = 'bad';
    toast(err.message, true);
  }
}

async function addTask() {
  const title = el.title.value.trim();
  if (!title || state.busy) {
    if (!title) el.title.focus();
    return;
  }
  state.busy = true;
  el.addBtn.disabled = true;
  try {
    const created = await api('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ title, priority: state.priority }),
    });
    state.tasks.unshift(created);
    el.title.value = '';
    render();
    toast('已添加');
  } catch (err) {
    toast(err.message, true);
  } finally {
    state.busy = false;
    el.addBtn.disabled = false;
    el.title.focus();
  }
}

async function toggleTask(task) {
  try {
    const updated = await api(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed: !task.completed }),
    });
    Object.assign(task, updated);
    render();
  } catch (err) {
    toast(err.message, true);
  }
}

async function removeTask(task) {
  try {
    await api(`/api/tasks/${task.id}`, { method: 'DELETE' });
    state.tasks = state.tasks.filter((t) => t.id !== task.id);
    render();
    toast('已删除');
  } catch (err) {
    toast(err.message, true);
  }
}

el.addBtn.addEventListener('click', addTask);
el.title.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});

document.querySelectorAll('.prio').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.prio').forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    state.priority = btn.dataset.priority;
  });
});

document.querySelectorAll('.filter').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    state.filter = btn.dataset.filter;
    render();
  });
});

loadTasks();
