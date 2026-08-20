const STORAGE_KEY = "boss-schedule-state-v1";
const CLOUD_STORAGE_KEY = "boss-schedule-cloud-v1";
const CLOUD_DEVICE_KEY = "boss-schedule-cloud-device-v1";
const CLOUD_REPO = "czy77zt/boss-schedule-data";
const CLOUD_DIR = "devices";
const CLOUD_BRANCH = "main";
const CLOUD_DESCRIPTION = "老板日程同步云数据";
const BACKEND_MODE = window.BOSS_BACKEND_MODE || (location.hostname === "czy77zt.github.io" ? "github" : "local");
const LOCAL_API_BASE = location.origin;

const USERS = [
  { id: "assistant", name: "助理", role: "assistant", password: "123456", title: "管理员" },
  { id: "boss", name: "老板", role: "boss", password: "123456", title: "完整编辑权限" }
];

const CATEGORIES = [
  { id: "private", label: "私人" },
  { id: "work", label: "工作" },
  { id: "meeting", label: "会议" },
  { id: "outing", label: "外出" },
  { id: "reception", label: "接待" },
  { id: "deadline", label: "重要截止日" }
];

const PRIORITIES = [
  { id: "urgent", label: "紧急重要", color: "red" },
  { id: "important", label: "重要不紧急", color: "orange" },
  { id: "routine", label: "常规行程", color: "gray" },
  { id: "private", label: "私人行程", color: "private" }
];

const MESSAGE_TYPES = [
  { id: "today", label: "今日重点" },
  { id: "approval", label: "待审批" },
  { id: "risk", label: "风险事项" },
  { id: "tomorrow", label: "明日预告" },
  { id: "reply", label: "普通回复" }
];

const ACTION_LABELS = {
  create: "新增",
  update: "编辑",
  delete: "删除",
  complete: "标记完成",
  uncomplete: "取消完成",
  postpone: "延期",
  batchPostpone: "批量延期",
  clearCompleted: "清理完成"
};

function uid(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function toDateKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function todayKey() {
  return toDateKey(new Date());
}

function parseDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date, amount) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

function formatDate(key) {
  const d = parseDateKey(key);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function formatShortDate(key) {
  const d = parseDateKey(key);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function weekdayLabel(key) {
  const d = parseDateKey(key);
  return `周${"日一二三四五六"[d.getDay()]}`;
}

function formatTime(time) {
  if (!time) return "";
  return time.slice(0, 5);
}

function formatDateTime(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function defaultState() {
  const now = new Date();
  const today = todayKey();
  const tomorrow = toDateKey(addDays(now, 1));
  const inTwoDays = toDateKey(addDays(now, 2));

  return {
    currentUserId: null,
    schedules: [
      {
        id: uid("sch"),
        title: "晨会：确认今日重点",
        category: "meeting",
        priority: "urgent",
        date: today,
        startTime: "09:00",
        endTime: "09:30",
        location: "公司会议室",
        notes: "同步客户来访安排与待审批事项。",
        repeat: "none",
        repeatEnd: "",
        pinned: true,
        starred: true,
        hidden: false,
        completedDates: [],
        createdBy: "assistant",
        createdAt: now.toISOString(),
        updatedBy: "assistant",
        updatedAt: now.toISOString()
      },
      {
        id: uid("sch"),
        title: "重要客户接待",
        category: "reception",
        priority: "important",
        date: today,
        startTime: "14:00",
        endTime: "15:30",
        location: "一楼贵宾厅",
        notes: "提前准备会议资料与茶歇。",
        repeat: "none",
        repeatEnd: "",
        pinned: false,
        starred: false,
        hidden: false,
        completedDates: [],
        createdBy: "assistant",
        createdAt: now.toISOString(),
        updatedBy: "assistant",
        updatedAt: now.toISOString()
      },
      {
        id: uid("sch"),
        title: "项目风险复盘",
        category: "work",
        priority: "routine",
        date: tomorrow,
        startTime: "10:00",
        endTime: "11:00",
        location: "线上会议",
        notes: "核对交付节点。",
        repeat: "weekly",
        repeatEnd: "",
        pinned: false,
        starred: false,
        hidden: false,
        completedDates: [],
        createdBy: "boss",
        createdAt: now.toISOString(),
        updatedBy: "boss",
        updatedAt: now.toISOString()
      },
      {
        id: uid("sch"),
        title: "合同签署截止提醒",
        category: "deadline",
        priority: "urgent",
        date: inTwoDays,
        startTime: "17:00",
        endTime: "17:00",
        location: "法务办公室",
        notes: "完成华南项目补充协议签署。",
        repeat: "none",
        repeatEnd: "",
        pinned: false,
        starred: false,
        hidden: false,
        completedDates: [],
        createdBy: "assistant",
        createdAt: now.toISOString(),
        updatedBy: "assistant",
        updatedAt: now.toISOString()
      }
    ],
    messages: [
      {
        id: uid("msg"),
        type: "today",
        title: "今日重点",
        body: "上午晨会后需要审批两份差旅申请；下午客户接待请提前十分钟到贵宾厅。",
        from: "assistant",
        to: "boss",
        createdAt: new Date(now.getTime() - 1000 * 60 * 18).toISOString(),
        updatedAt: new Date(now.getTime() - 1000 * 60 * 18).toISOString(),
        readBy: { assistant: true, boss: false }
      }
    ],
    logs: [],
    settings: {
      remindStrength: "strong",
      lockScreen: true,
      hiddenPrivate: false,
      notifyPermission: false
    },
    reminderFired: {},
    tombstones: {
      schedules: [],
      messages: []
    },
    lastSync: now.toISOString(),
    meta: {
      lastLocalChangeAt: now.toISOString(),
      lastSyncedAt: null,
      cloudStatus: "未连接",
      cloudError: ""
    }
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return {
      ...defaultState(),
      ...parsed,
      users: USERS,
      settings: { ...defaultState().settings, ...(parsed.settings || {}) },
      reminderFired: parsed.reminderFired || {},
      tombstones: { ...defaultState().tombstones, ...(parsed.tombstones || {}) },
      meta: { ...defaultState().meta, ...(parsed.meta || {}) }
    };
  } catch {
    return defaultState();
  }
}

let state = loadState();
let view = "today";
let selectedDate = todayKey();
let calendarCursor = new Date();
let calendarMode = "month";
let selectedIds = new Set();
let scheduleModal = null;
let searchQuery = "";
let logFilter = "all";
let beforeInstallPrompt = null;
let channel = null;
let reminderTimer = null;
let lastReminderKey = "";
let cloudToken = localStorage.getItem(CLOUD_STORAGE_KEY) || "";
let cloudSyncTimer = null;
let cloudPollTimer = null;
let cloudInFlight = false;
let cloudDeviceId = localStorage.getItem(CLOUD_DEVICE_KEY) || "";

function currentUser() {
  return USERS.find((user) => user.id === state.currentUserId) || null;
}

function otherUser() {
  return USERS.find((user) => user.id !== state.currentUserId) || USERS[1];
}

function persistLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (channel) {
    channel.postMessage({ type: "state-updated", state });
  }
}

function saveState() {
  const now = new Date().toISOString();
  state.lastSync = now;
  state.meta.lastLocalChangeAt = now;
  persistLocal();
  scheduleCloudPush();
}

class CloudError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function isCloudConfigured() {
  return BACKEND_MODE === "local" || Boolean(cloudToken);
}

function setCloudToken(token) {
  cloudToken = String(token || "").trim();
  if (cloudToken) {
    localStorage.setItem(CLOUD_STORAGE_KEY, cloudToken);
  } else {
    localStorage.removeItem(CLOUD_STORAGE_KEY);
  }
}

function clearCloudToken() {
  setCloudToken("");
}

function setCloudStatus(status, error = "") {
  state.meta.cloudStatus = status;
  state.meta.cloudError = error || "";
  persistLocal();
}

function toTimestamp(value) {
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

function utf8ToBase64(value) {
  const bytes = new TextEncoder().encode(String(value));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToUtf8(value) {
  const clean = String(value).replace(/\s/g, "");
  const binary = atob(clean);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function githubApi(path, options = {}) {
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${cloudToken}`,
    "X-GitHub-Api-Version": "2022-11-28",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {})
  };
  const response = await fetch(`https://api.github.com${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await response.text();
  let json = {};
  try {
    json = JSON.parse(text);
  } catch {
    json = { message: text };
  }
  if (!response.ok) {
    throw new CloudError(json.message || `GitHub API ${response.status}`, response.status);
  }
  return { json, status: response.status };
}

function emptyCloudPayload() {
  return {
    version: 1,
    updatedAt: null,
    data: {
      schedules: [],
      messages: [],
      logs: [],
      settings: {},
      tombstones: {
        schedules: [],
        messages: []
      }
    }
  };
}

function cloudPayload() {
  const settings = { ...(state.settings || {}) };
  delete settings.notifyPermission;
  return {
    version: 1,
    updatedAt: state.meta.lastLocalChangeAt || state.lastSync,
    data: {
      schedules: state.schedules || [],
      messages: state.messages || [],
      logs: state.logs || [],
      settings,
      tombstones: state.tombstones || { schedules: [], messages: [] },
      lastSync: state.lastSync
    }
  };
}

function cloudFilePath() {
  if (!cloudDeviceId) {
    cloudDeviceId = uid("device");
    localStorage.setItem(CLOUD_DEVICE_KEY, cloudDeviceId);
  }
  return `${CLOUD_DIR}/${cloudDeviceId}.json`;
}

async function readSingleCloudFile(path) {
  try {
    const { json } = await githubApi(
      `/repos/${CLOUD_REPO}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(CLOUD_BRANCH)}`
    );
    if (!json.content) {
      return { payload: emptyCloudPayload(), sha: json.sha || null };
    }
    const payload = JSON.parse(base64ToUtf8(json.content));
    return { payload, sha: json.sha };
  } catch (error) {
    if (error.status === 404) {
      return { payload: emptyCloudPayload(), sha: null };
    }
    throw error;
  }
}

async function readCloudSnapshot() {
  const ownPath = cloudFilePath();
  let entries = [];
  try {
    const { json } = await githubApi(
      `/repos/${CLOUD_REPO}/contents/${CLOUD_DIR}?ref=${encodeURIComponent(CLOUD_BRANCH)}`
    );
    if (Array.isArray(json)) entries = json;
  } catch (error) {
    if (error.status !== 404) throw error;
  }

  let latest = null;
  let ownSha = null;
  let ownPayload = null;
  const payloads = [];
  for (const entry of entries) {
    if (entry.type !== "file" || !String(entry.path || "").endsWith(".json")) continue;
    try {
      const item = await readSingleCloudFile(entry.path);
      if (entry.path === ownPath) {
        ownSha = item.sha;
        ownPayload = item.payload;
      }
      if (item.payload && item.payload.updatedAt) {
        payloads.push(item.payload);
        if (!latest || toTimestamp(item.payload.updatedAt) > toTimestamp(latest.payload.updatedAt)) {
          latest = item;
        }
      }
    } catch {
      // Ignore malformed device files and continue with the next one.
    }
  }

  return {
    payload: latest ? latest.payload : emptyCloudPayload(),
    payloads,
    ownPayload,
    ownSha
  };
}

async function writeCloudFile(payload, sha, path = cloudFilePath()) {
  const body = {
    message: `${CLOUD_DESCRIPTION}同步`,
    content: utf8ToBase64(JSON.stringify(payload)),
    branch: CLOUD_BRANCH
  };
  if (sha) body.sha = sha;
  return githubApi(`/repos/${CLOUD_REPO}/contents/${encodeURIComponent(path)}`, {
    method: "PUT",
    body
  });
}

function applyCloudPayload(payload) {
  if (!payload || typeof payload !== "object") return false;
  const localNotify = state.settings?.notifyPermission;
  const data = payload.data || {};
  const schedules = Array.isArray(data.schedules) ? data.schedules : [];
  const messages = Array.isArray(data.messages) ? data.messages : [];
  const logs = Array.isArray(data.logs) ? data.logs : [];
  const tombstones = {
    schedules: Array.isArray(data.tombstones?.schedules) ? data.tombstones.schedules : [],
    messages: Array.isArray(data.tombstones?.messages) ? data.tombstones.messages : []
  };
  const settings = {
    ...(data.settings && typeof data.settings === "object" ? data.settings : {}),
    notifyPermission: localNotify
  };
  state.tombstones = {
    schedules: [...new Set([...(state.tombstones?.schedules || []), ...tombstones.schedules])],
    messages: [...new Set([...(state.tombstones?.messages || []), ...tombstones.messages])]
  };
  state.schedules = schedules.filter((item) => !state.tombstones.schedules.includes(item.id));
  state.messages = messages.filter((item) => !state.tombstones.messages.includes(item.id));
  state.logs = logs;
  state.settings = settings;
  state.lastSync = data.lastSync || new Date().toISOString();
  state.meta.lastSyncedAt = payload.updatedAt || null;
  state.meta.lastLocalChangeAt = payload.updatedAt || new Date().toISOString();
  persistLocal();
  refresh();
  return true;
}

function itemTimestamp(item) {
  return toTimestamp(item?.updatedAt || item?.createdAt || item?.time);
}

function mergeCloudData(localPayload, remotePayloads) {
  const payloads = [localPayload, ...(remotePayloads || [])].filter(Boolean);
  const scheduleMap = new Map();
  const messageMap = new Map();
  const logMap = new Map();
  const tombstoneSchedules = new Set();
  const tombstoneMessages = new Set();
  let latestPayload = localPayload;

  payloads.forEach((payload) => {
    if (!latestPayload || toTimestamp(payload.updatedAt) > toTimestamp(latestPayload.updatedAt)) {
      latestPayload = payload;
    }
    (payload.data?.schedules || []).forEach((item) => {
      if (!item.id) return;
      const previous = scheduleMap.get(item.id);
      if (!previous || itemTimestamp(item) >= itemTimestamp(previous)) {
        scheduleMap.set(item.id, item);
      }
    });
    (payload.data?.messages || []).forEach((item) => {
      if (!item.id) return;
      const previous = messageMap.get(item.id);
      if (!previous || itemTimestamp(item) >= itemTimestamp(previous)) {
        messageMap.set(item.id, item);
      }
    });
    (payload.data?.logs || []).forEach((item) => {
      if (!item.id) return;
      const previous = logMap.get(item.id);
      if (!previous || itemTimestamp(item) >= itemTimestamp(previous)) {
        logMap.set(item.id, item);
      }
    });
    (payload.data?.tombstones?.schedules || []).forEach((id) => tombstoneSchedules.add(id));
    (payload.data?.tombstones?.messages || []).forEach((id) => tombstoneMessages.add(id));
  });

  const schedules = [...scheduleMap.values()].filter((item) => !tombstoneSchedules.has(item.id));
  const messages = [...messageMap.values()].filter((item) => !tombstoneMessages.has(item.id));
  const logs = [...logMap.values()];
  const settings = {
    ...(latestPayload.data?.settings && typeof latestPayload.data.settings === "object" ? latestPayload.data.settings : {})
  };

  return {
    version: 1,
    updatedAt: latestPayload.updatedAt || localPayload.updatedAt,
    data: {
      schedules,
      messages,
      logs,
      settings,
      tombstones: {
        schedules: [...tombstoneSchedules],
        messages: [...tombstoneMessages]
      },
      lastSync: latestPayload.data?.lastSync || new Date().toISOString()
    }
  };
}

async function readLocalState() {
  const response = await fetch(`${LOCAL_API_BASE}/api/state`, {
    method: "GET",
    headers: { Accept: "application/json" }
  });
  if (!response.ok) {
    throw new Error(`本地后端返回 ${response.status}`);
  }
  const serverState = await response.json();
  return {
    payload: {
      version: 1,
      updatedAt: serverState.updatedAt || null,
      data: serverState.data || emptyCloudPayload().data
    }
  };
}

async function writeLocalState(payload) {
  const response = await fetch(`${LOCAL_API_BASE}/api/state`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`本地后端写入失败 ${response.status}`);
  }
  return response.json();
}

async function syncLocalBackend() {
  const localPayload = cloudPayload();
  const server = await readLocalState();
  const merged = mergeCloudData(localPayload, [server.payload]);
  const localData = JSON.stringify(localPayload.data);
  const mergedData = JSON.stringify(merged.data);
  const serverData = JSON.stringify(server.payload.data);

  if (localData !== mergedData) {
    applyCloudPayload(merged);
  }

  if (serverData !== mergedData) {
    await writeLocalState(merged);
  }

  state.meta.lastSyncedAt = merged.updatedAt || new Date().toISOString();
  state.meta.lastLocalChangeAt = merged.updatedAt || new Date().toISOString();
  setCloudStatus("已同步");
  persistLocal();
  return { ok: true };
}

async function syncNow() {
  if (!isCloudConfigured()) {
    setCloudStatus("未连接");
    return { ok: false, error: "未配置云同步" };
  }
  if (cloudInFlight) {
    return { ok: false, error: "同步正在进行中" };
  }

  cloudInFlight = true;
  setCloudStatus("同步中");
  try {
    if (BACKEND_MODE === "local") {
      return await syncLocalBackend();
    }
    const snapshot = await readCloudSnapshot();
    const localPayload = cloudPayload();
    const merged = mergeCloudData(localPayload, snapshot.payloads);
    const localData = JSON.stringify(localPayload.data);
    const mergedData = JSON.stringify(merged.data);
    const ownData = snapshot.ownPayload ? JSON.stringify(snapshot.ownPayload.data) : null;
    const needsWrite = snapshot.ownSha === null || ownData !== mergedData;

    if (localData !== mergedData) {
      applyCloudPayload(merged);
    }

    if (needsWrite) {
      let sha = snapshot.ownSha;
      let uploaded = false;
      for (let attempt = 0; attempt < 4; attempt += 1) {
        try {
          await writeCloudFile(merged, sha);
          uploaded = true;
          break;
        } catch (error) {
          if (error.status !== 409 && error.status !== 422) throw error;
          const fresh = await readCloudSnapshot();
          sha = fresh.ownSha;
          if (!sha) {
            try {
              const own = await readSingleCloudFile(cloudFilePath());
              sha = own.sha;
            } catch {
              sha = null;
            }
          }
          await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
        }
      }
      if (!uploaded) {
        try {
          const own = await readSingleCloudFile(cloudFilePath());
          if (own.sha) {
            await writeCloudFile(merged, own.sha);
          }
        } catch (error) {
          if (error.status !== 404) throw error;
        }
      }
    }

    state.meta.lastSyncedAt = merged.updatedAt || new Date().toISOString();
    state.meta.lastLocalChangeAt = merged.updatedAt || new Date().toISOString();
    setCloudStatus("已同步");
    persistLocal();
    return { ok: true };
  } catch (error) {
    setCloudStatus("同步失败", error.message);
    showToast(`云同步失败：${error.message}`);
    return { ok: false, error: error.message };
  } finally {
    cloudInFlight = false;
  }
}

function scheduleCloudPush() {
  if (!isCloudConfigured()) return;
  clearTimeout(cloudSyncTimer);
  cloudSyncTimer = setTimeout(() => {
    syncNow();
  }, 900);
}

async function connectCloud() {
  const input = document.getElementById("cloud-token");
  const token = input?.value?.trim();
  if (!token) {
    showToast("请粘贴 GitHub Token");
    return;
  }
  setCloudToken(token);
  setCloudStatus("同步中");
  renderApp();
  await syncNow();
  renderApp();
}

function disconnectCloud() {
  clearCloudToken();
  state.meta.cloudStatus = "未连接";
  state.meta.cloudError = "";
  state.meta.lastSyncedAt = null;
  persistLocal();
  renderApp();
  showToast("已断开云同步");
}

function setupCloudSync() {
  if (isCloudConfigured()) syncNow();
  scheduleCloudPoll();
  document.addEventListener("visibilitychange", () => {
    if (isCloudConfigured() && !document.hidden && !cloudInFlight) {
      syncNow();
    }
  });
}

function scheduleCloudPoll() {
  clearTimeout(cloudPollTimer);
  cloudPollTimer = setTimeout(() => {
    if (isCloudConfigured() && !document.hidden && !cloudInFlight) {
      syncNow();
    }
    scheduleCloudPoll();
  }, 45000 + Math.floor(Math.random() * 30000));
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function refresh() {
  renderApp();
  updateDocumentBadge();
}

function renderApp() {
  const app = document.getElementById("app");
  const user = currentUser();

  if (!user) {
    app.innerHTML = renderLogin();
    return;
  }

  app.innerHTML = `
    <div class="app">
      <header class="app-header">
        <div class="header-title">
          <span class="dot"></span>
          <span>老板日程同步</span>
        </div>
        <div class="header-user">
          <span>${escapeHTML(user.name)}</span>
          <span class="role-chip">${escapeHTML(user.title)}</span>
          <button class="icon-button" data-action="logout" title="退出登录">⏻</button>
        </div>
        <nav class="nav-bar">
          ${navItems(user).map((item) => navButton(item)).join("")}
        </nav>
      </header>
      <main class="app-body">
        <div id="page-content" class="page">${renderPage(user)}</div>
      </main>
    </div>
    ${scheduleModal ? renderScheduleModal() : ""}
  `;
}

function navItems(user) {
  const items = [
    { id: "today", label: "今日", icon: "◷" },
    { id: "calendar", label: "日程", icon: "▦" },
    { id: "messages", label: "消息", icon: "✉", badge: unreadCountFor(user.id) },
    { id: "settings", label: "设置", icon: "⚙" }
  ];
  if (user.role === "assistant") {
    items.splice(2, 0, { id: "logs", label: "日志", icon: "≣" });
  }
  return items;
}

function navButton(item) {
  return `
    <button data-action="nav" data-view="${item.id}" class="${view === item.id ? "active" : ""}">
      <span class="nav-icon">${item.icon}</span>
      <span>${item.label}</span>
      ${item.badge ? `<span class="badge">${item.badge}</span>` : ""}
    </button>
  `;
}

function renderPage(user) {
  if (view === "calendar") return renderCalendarPage(user);
  if (view === "messages") return renderMessagesPage(user);
  if (view === "logs") return user.role === "assistant" ? renderLogsPage(user) : renderTodayPage(user);
  if (view === "settings") return renderSettingsPage(user);
  return renderTodayPage(user);
}

function renderLogin() {
  return `
    <div class="login-page">
      <div class="login-shell">
        <div class="brand">
          <div class="brand-mark">日</div>
          <h1>老板日程同步</h1>
          <p>助理与老板的双人专属协同日程</p>
        </div>
        <div class="login-card">
          <h2>登录工作台</h2>
          <div class="field">
            <label for="login-account">账号</label>
            <input id="login-account" list="account-list" placeholder="请选择或输入账号" autocomplete="username" />
            <datalist id="account-list">
              <option value="assistant">助理</option>
              <option value="boss">老板</option>
            </datalist>
          </div>
          <div class="field">
            <label for="login-password">密码</label>
            <input id="login-password" type="password" placeholder="演示密码 123456" autocomplete="current-password" />
          </div>
          <button class="primary-button" data-action="login-submit" style="width:100%">登录</button>
          <p class="login-error" id="login-error"></p>
          <div class="quick-login">
            <button data-action="quick-login" data-user="assistant">
              <strong>助理账号</strong>
              <span>精细化管理 · 最高权限</span>
            </button>
            <button data-action="quick-login" data-user="boss">
              <strong>老板账号</strong>
              <span>可新增 · 可编辑 · 可删除</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function login(userId, password = "123456") {
  const user = USERS.find((item) => item.id === userId || item.name === userId);
  if (!user) {
    const err = document.getElementById("login-error");
    if (err) err.textContent = "账号不存在，请选择助理或老板账号。";
    return;
  }
  if (password !== user.password) {
    const err = document.getElementById("login-error");
    if (err) err.textContent = "密码错误，演示密码为 123456。";
    return;
  }
  state.currentUserId = user.id;
  view = "today";
  saveState();
  refresh();
  showToast(`${user.name}已登录`);
  if (isCloudConfigured()) syncNow();
}

function logout() {
  state.currentUserId = null;
  selectedIds = new Set();
  scheduleModal = null;
  saveState();
  refresh();
}

function scheduleById(id) {
  return state.schedules.find((item) => item.id === id);
}

function categoryLabel(id) {
  return (CATEGORIES.find((item) => item.id === id) || {}).label || "工作";
}

function priorityLabel(id) {
  return (PRIORITIES.find((item) => item.id === id) || {}).label || "常规行程";
}

function priorityClass(id) {
  return id === "urgent" ? "urgent" : id === "important" ? "important" : id === "private" ? "private" : "routine";
}

function isScheduleOnDate(schedule, key) {
  if (schedule.repeat === "none") return schedule.date === key;
  const start = parseDateKey(schedule.date);
  const target = parseDateKey(key);
  if (target < start) return false;
  if (schedule.repeatEnd && key > schedule.repeatEnd) return false;
  if (schedule.repeat === "daily") return true;
  if (schedule.repeat === "weekly") return start.getDay() === target.getDay();
  if (schedule.repeat === "monthly") return start.getDate() === target.getDate();
  return false;
}

function isCompleted(schedule, key = todayKey()) {
  return schedule.completedDates.includes(key);
}

function shouldHideSchedule(schedule) {
  return schedule.hidden || (schedule.priority === "private" && state.settings.hiddenPrivate);
}

function schedulesForDate(key) {
  return state.schedules.filter((item) => isScheduleOnDate(item, key));
}

function visibleSchedules(key, includeHidden = false) {
  return schedulesForDate(key).filter((item) => includeHidden || !shouldHideSchedule(item));
}

function sortSchedules(list, key = todayKey()) {
  const order = { urgent: 0, important: 1, routine: 2, private: 3 };
  return [...list].sort((a, b) => {
    const ac = isCompleted(a, key) ? 1 : 0;
    const bc = isCompleted(b, key) ? 1 : 0;
    if (ac !== bc) return ac - bc;
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
    return (a.startTime || "23:59").localeCompare(b.startTime || "23:59");
  });
}

function describeSchedule(schedule, key = schedule.date) {
  const repeat = schedule.repeat === "none" ? "" : ` · 每${schedule.repeat === "daily" ? "日" : schedule.repeat === "weekly" ? "周" : "月"}`;
  return [
    schedule.title,
    `${formatDate(key)} ${formatTime(schedule.startTime)}-${formatTime(schedule.endTime)}`,
    schedule.location ? `地点：${schedule.location}` : "",
    schedule.notes ? `备注：${schedule.notes}` : "",
    priorityLabel(schedule.priority) + repeat
  ].filter(Boolean).join(" | ");
}

function renderTodayPage(user) {
  const key = todayKey();
  const all = sortSchedules(visibleSchedules(key));
  const pinned = all.filter((item) => item.pinned && !isCompleted(item, key));
  const report = buildDailyReport(key);
  const unread = unreadCountFor(user.id);

  return `
    <div class="page-head">
      <div>
        <h1 class="page-title">今日日程</h1>
        <p class="page-subtitle">${formatDate(key)} · ${weekdayLabel(key)} · 已同步 ${formatDateTime(state.lastSync)}</p>
      </div>
      <div class="toolbar">
        <button class="ghost-button" data-action="export-ics">导出日历</button>
        <button class="secondary-button" data-action="share-report">分享日报</button>
        <button class="primary-button" data-action="new-schedule">＋ 新增</button>
      </div>
    </div>

    ${unread ? `<div class="card report-card" style="margin-bottom:14px">
      <div class="section-title">待确认消息</div>
      <div>你有 ${unread} 条未读消息。</div>
      <div class="report-actions"><button class="secondary-button" data-action="nav" data-view="messages">立即查看</button></div>
    </div>` : ""}

    <section class="card report-card">
      <div class="section-title">老板日程日报</div>
      <div class="report-body">${escapeHTML(report)}</div>
      <div class="report-actions">
        <button class="secondary-button" data-action="share-report">转发微信</button>
        <button class="secondary-button" data-action="copy-report">复制文字</button>
      </div>
    </section>

    ${pinned.length ? `
      <section class="section">
        <div class="section-title">置顶重点</div>
        ${pinned.map((item) => scheduleItemHTML(item, key, user)).join("")}
      </section>
    ` : ""}

    <section class="section">
      <div class="section-title">时间轴行程</div>
      <div class="timeline">
        ${all.length ? all.map((item) => scheduleItemHTML(item, key, user)).join("") : emptyState("今天还没有行程，可以从右上角新增。")}
      </div>
    </section>
  `;
}

function buildDailyReport(key) {
  const list = sortSchedules(visibleSchedules(key), key);
  const lines = [`【老板日程日报】${formatDate(key)} ${weekdayLabel(key)}`, `今日共 ${list.length} 项行程。`, ""];
  if (!list.length) {
    lines.push("今日暂无安排，可保持弹性时间。");
  } else {
    list.forEach((item, index) => {
      const status = isCompleted(item, key) ? "（已完成）" : "";
      lines.push(`${index + 1}. ${formatTime(item.startTime)}-${formatTime(item.endTime)} ${item.title}${status}`);
      lines.push(`   分类：${categoryLabel(item.category)} · 优先级：${priorityLabel(item.priority)}`);
      if (item.location) lines.push(`   地点：${item.location}`);
      if (item.notes) lines.push(`   备注：${item.notes}`);
    });
  }
  lines.push("", "注意事项：紧急事项请优先处理；行程如有变化请及时同步助理。");
  return lines.join("\n");
}

function scheduleItemHTML(schedule, key, user, selectable = false, variant = "") {
  const done = isCompleted(schedule, key);
  const checked = selectedIds.has(schedule.id) ? "checked" : "";
  const repeatLabel = schedule.repeat === "none" ? "" : schedule.repeat === "daily" ? "每日" : schedule.repeat === "weekly" ? "每周" : "每月";
  const meta = [
    categoryLabel(schedule.category),
    repeatLabel ? `重复：${repeatLabel}` : "",
    schedule.location ? `地点：${schedule.location}` : ""
  ].filter(Boolean).join(" · ");

  return `
    <article class="schedule-item ${variant} ${done ? "completed" : ""} ${priorityClass(schedule.priority)}">
      <div class="schedule-top">
        <div>
          ${selectable ? `<label class="checkbox-row"><input class="selection-check" type="checkbox" data-action="toggle-select" data-id="${schedule.id}" ${checked} /><span></span></label>` : ""}
          <h3 class="schedule-title">${escapeHTML(schedule.title)}</h3>
          <div class="schedule-meta">${formatTime(schedule.startTime)}-${formatTime(schedule.endTime)} · ${escapeHTML(meta)}</div>
        </div>
        <span class="tag ${priorityClass(schedule.priority)}">${priorityLabel(schedule.priority)}</span>
      </div>
      ${schedule.notes ? `<p class="schedule-notes">${escapeHTML(schedule.notes)}</p>` : ""}
      <div class="item-actions">
        <button class="text-button" data-action="toggle-complete" data-id="${schedule.id}" data-date="${key}">${done ? "已完成" : "标记完成"}</button>
        <button class="icon-button" data-action="edit-schedule" data-id="${schedule.id}" title="编辑">✎</button>
        <button class="icon-button" data-action="delete-schedule" data-id="${schedule.id}" title="删除">✕</button>
        ${user.role === "assistant" ? `<button class="icon-button" data-action="star-schedule" data-id="${schedule.id}" title="星标">${schedule.starred ? "★" : "☆"}</button>` : ""}
      </div>
    </article>
  `;
}

function emptyState(message, icon = "○") {
  return `<div class="empty-state"><span class="empty-icon">${icon}</span>${escapeHTML(message)}</div>`;
}

function renderCalendarPage(user) {
  const cursor = new Date(calendarCursor);
  const month = cursor.getMonth();
  const year = cursor.getFullYear();
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) {
    const d = new Date(year, month, 1 - startOffset + i);
    cells.push(dayCellHTML(toDateKey(d), d.getDate(), true));
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(dayCellHTML(toDateKey(new Date(year, month, d)), d, false));
  }
  let tailDate = new Date(year, month, daysInMonth + 1);
  while (cells.length % 7 !== 0) {
    cells.push(dayCellHTML(toDateKey(tailDate), tailDate.getDate(), true));
    tailDate = addDays(tailDate, 1);
  }

  const listKey = selectedDate;
  const list = sortSchedules(visibleSchedules(listKey), listKey);
  const hasSelection = selectedIds.size > 0;

  const weekStart = addDays(parseDateKey(selectedDate), -parseDateKey(selectedDate).getDay());
  const weekEnd = addDays(weekStart, 6);
  const headTitle =
    calendarMode === "month"
      ? `${year}年${month + 1}月`
      : calendarMode === "week"
        ? `${formatShortDate(toDateKey(weekStart))} - ${formatShortDate(toDateKey(weekEnd))}`
        : `${formatDate(selectedDate)} ${weekdayLabel(selectedDate)}`;

  return `
    <div class="page-head">
      <div>
        <h1 class="page-title">日历</h1>
        <p class="page-subtitle">${user.role === "assistant" ? "月 / 周 / 日视图 · 支持批量操作" : "查看与编辑我的行程"}</p>
      </div>
      <div class="toolbar">
        <button class="secondary-button" data-action="new-schedule">＋ 新增</button>
      </div>
    </div>

    ${user.role === "assistant" ? `
      <div class="selection-bar card">
        <button class="secondary-button" data-action="batch-postpone">批量延后 1 天</button>
        <button class="ghost-button" data-action="clear-completed">清理已完成</button>
        <button class="ghost-button" data-action="clear-selection">取消选择</button>
        <span style="color:var(--muted);font-size:13px">${hasSelection ? `已选 ${selectedIds.size} 项` : "勾选日程后可批量延后"}</span>
      </div>
    ` : ""}

    <section class="card ios-calendar">
      <div class="calendar-head">
        <button class="icon-button" data-action="calendar-prev" title="上一${calendarMode === "month" ? "月" : calendarMode === "week" ? "周" : "天"}">‹</button>
        <h2>${headTitle}</h2>
        <button class="icon-button" data-action="calendar-next" title="下一${calendarMode === "month" ? "月" : calendarMode === "week" ? "周" : "天"}">›</button>
      </div>
      <div class="view-switch">
        <button data-action="calendar-mode" data-mode="month" class="${calendarMode === "month" ? "active" : ""}">月</button>
        <button data-action="calendar-mode" data-mode="week" class="${calendarMode === "week" ? "active" : ""}">周</button>
        <button data-action="calendar-mode" data-mode="day" class="${calendarMode === "day" ? "active" : ""}">日</button>
      </div>
      ${calendarMode === "month" ? `
        <div class="month-grid">
          ${["日", "一", "二", "三", "四", "五", "六"].map((w) => `<div class="weekday">${w}</div>`).join("")}
          ${cells.join("")}
        </div>
      ` : ""}
      ${calendarMode === "week" ? weekGridHTML(weekStart) : ""}
      ${calendarMode === "day" ? dayTimelineHTML(listKey) : ""}
    </section>

    ${calendarMode !== "day" ? `
      <h2 class="selected-date-title">${formatDate(listKey)} ${weekdayLabel(listKey)}</h2>
      ${list.length ? list.map((item) => scheduleItemHTML(item, listKey, user, user.role === "assistant", "ios-event")).join("") : emptyState("当天暂无行程。")}
    ` : ""}
  `;
}

function weekGridHTML(weekStart) {
  let cells = "";
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    const key = toDateKey(d);
    const list = sortSchedules(visibleSchedules(key), key);
    cells += `
      <button class="day-cell week-cell ${key === todayKey() ? "today" : ""} ${key === selectedDate ? "selected" : ""}" data-action="select-date" data-date="${key}">
        <span class="day-number">${d.getMonth() + 1}月${d.getDate()}日 周${"日一二三四五六"[d.getDay()]}</span>
        <span class="week-items">
          ${list.length ? list.slice(0, 3).map((item) => `<i class="week-item ${priorityClass(item.priority)}">${escapeHTML(formatTime(item.startTime))} ${escapeHTML(item.title)}</i>`).join("") : `<i class="week-item empty">暂无安排</i>`}
          ${list.length > 3 ? `<i class="week-item more">还有 ${list.length - 3} 项…</i>` : ""}
        </span>
      </button>`;
  }
  return `<div class="month-grid week-grid">${["日", "一", "二", "三", "四", "五", "六"].map((w) => `<div class="weekday">${w}</div>`).join("")}${cells}</div>`;
}

function dayTimelineHTML(key) {
  const list = sortSchedules(visibleSchedules(key), key);
  const hours = [];
  for (let h = 7; h <= 22; h++) hours.push(h);
  return `
    <div class="day-timeline">
      ${hours.map((h) => {
        const slot = list.filter((item) => parseInt((item.startTime || "00:00").slice(0, 2), 10) === h);
        return `
          <div class="day-hour ${slot.length ? "has-item" : ""}">
            <span class="hour-label">${pad(h)}:00</span>
            <div class="hour-content">
              ${slot.map((item) => `<button class="hour-chip ${priorityClass(item.priority)} ${isCompleted(item, key) ? "done" : ""}" data-action="edit-schedule" data-id="${item.id}" title="点击编辑">${escapeHTML(formatTime(item.startTime))}-${escapeHTML(formatTime(item.endTime))} ${escapeHTML(item.title)}</button>`).join("")}
            </div>
          </div>`;
      }).join("")}
    </div>
    ${list.some((item) => { const h = parseInt((item.startTime || "00:00").slice(0, 2), 10); return h < 7 || h > 22; }) ? `<p class="page-subtitle" style="margin-top:8px">部分行程在 7:00-22:00 之外，请切换到月或周视图查看。</p>` : ""}
  `;
}

function dayCellHTML(key, day, outside) {
  const list = visibleSchedules(key);
  const dots = list.slice(0, 4).map((item) => `<i class="${priorityClass(item.priority)}"></i>`).join("");
  return `
    <button class="day-cell ${outside ? "outside" : ""} ${key === todayKey() ? "today" : ""} ${key === selectedDate ? "selected" : ""}" data-action="select-date" data-date="${key}">
      <span class="day-number">${day}</span>
      <span class="day-dots">${dots}</span>
    </button>
  `;
}

function renderMessagesPage(user) {
  const messages = state.messages
    .filter((item) => item.from === user.id || item.to === user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const other = otherUser();

  return `
    <div class="page-head">
      <div>
        <h1 class="page-title">消息同步</h1>
        <p class="page-subtitle">重要事项双向已读回执</p>
      </div>
      <div class="toolbar">
        <button class="primary-button" data-action="open-message-composer">＋ 发送</button>
      </div>
    </div>

    <section class="card">
      <div class="section-title">与 ${escapeHTML(other.name)} 的同步消息</div>
      ${messages.length ? messages.map((item) => messageItemHTML(item, user)).join("") : emptyState("暂无消息，可从右上角发送。")}
    </section>
  `;
}

function messageItemHTML(message, user) {
  const typeLabel = (MESSAGE_TYPES.find((item) => item.id === message.type) || {}).label || "消息";
  const isRead = message.readBy[user.id];
  const otherRead = message.readBy[otherUser().id];
  const isSender = message.from === user.id;

  return `
    <article class="message-item ${isRead ? "" : "unread"}">
      <div class="message-head">
        <div>
          <span class="message-type">${typeLabel}</span>
          <h3 class="message-title">${escapeHTML(message.title)}</h3>
        </div>
        <span class="message-time">${formatDateTime(message.createdAt)}</span>
      </div>
      <p class="message-body">${escapeHTML(message.body)}</p>
      <div class="message-foot">
        <span class="read-status ${otherRead ? "done" : ""}">
          ${isSender ? (otherRead ? `${otherUser().name}已读` : `等待${otherUser().name}查看`) : (isRead ? "我已读" : "未读")}
        </span>
        ${!isSender && !isRead ? `<button class="text-button" data-action="mark-message-read" data-id="${message.id}">标记已读</button>` : ""}
        <button class="icon-button" data-action="delete-message" data-id="${message.id}" title="删除消息">✕</button>
      </div>
    </article>
  `;
}

function renderMessageComposer() {
  const isAssistant = currentUser().role === "assistant";
  return `
    <div class="modal-backdrop" data-action="close-message-composer">
      <div class="modal" data-stop>
        <div class="modal-head">
          <h2>发送消息</h2>
          <button class="icon-button" data-action="close-message-composer">✕</button>
        </div>
        <div class="field">
          <label>消息类型</label>
          <select id="message-type">
            ${(isAssistant ? MESSAGE_TYPES.slice(0, 4) : MESSAGE_TYPES).map((item) => `<option value="${item.id}">${item.label}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label>标题</label>
          <input id="message-title" placeholder="一句话说明事项" />
        </div>
        <div class="field">
          <label>内容</label>
          <textarea id="message-body" placeholder="输入具体内容、要求或备注"></textarea>
        </div>
        <div class="modal-actions">
          <button class="ghost-button" data-action="close-message-composer">取消</button>
          <button class="primary-button" data-action="send-message">发送</button>
        </div>
      </div>
    </div>
  `;
}

function filterLogs() {
  return state.logs
    .filter((item) => logFilter === "all" || item.action === logFilter)
    .filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return `${item.operatorName} ${item.action} ${item.before} ${item.after}`.toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(b.time) - new Date(a.time));
}

function logsListHTML() {
  const filtered = filterLogs();
  return filtered.length ? filtered.map((item) => logItemHTML(item)).join("") : emptyState("暂无修改记录。");
}

function renderLogsList() {
  const container = document.getElementById("logs-list");
  if (!container) return;
  container.innerHTML = logsListHTML();
}

function renderLogsPage(user) {
  return `
    <div class="page-head">
      <div>
        <h1 class="page-title">修改日志</h1>
        <p class="page-subtitle">全部新增、编辑、延期、完成动作留痕</p>
      </div>
    </div>

    <section class="card">
      <div class="toolbar" style="margin-bottom:12px">
        <select id="log-filter" style="min-height:40px;border:1px solid var(--line);border-radius:8px;padding:0 10px">
          <option value="all" ${logFilter === "all" ? "selected" : ""}>全部动作</option>
          ${Object.entries(ACTION_LABELS).map(([key, label]) => `<option value="${key}" ${logFilter === key ? "selected" : ""}>${label}</option>`).join("")}
        </select>
        <input id="log-search" placeholder="搜索修改内容" value="${escapeHTML(searchQuery)}" style="flex:1;min-width:160px;min-height:40px;border:1px solid var(--line);border-radius:8px;padding:0 10px" />
      </div>
      <div id="logs-list">${logsListHTML()}</div>
    </section>
  `;
}

function logItemHTML(item) {
  return `
    <article class="log-item">
      <div class="log-head">
        <div class="log-title">${ACTION_LABELS[item.action] || item.action} · ${escapeHTML(item.operatorName)}</div>
        <div class="log-time">${formatDateTime(item.time)}</div>
      </div>
      <div class="log-diff">
        ${item.before ? `<div class="log-before">修改前：${escapeHTML(item.before)}</div>` : ""}
        ${item.after ? `<div class="log-after">修改后：${escapeHTML(item.after)}</div>` : ""}
      </div>
    </article>
  `;
}

function renderSettingsPage(user) {
  const settings = state.settings;
  const notificationText = "Notification" in window && Notification.permission === "granted" ? "已开启" : "开启通知";
  const cloudLastSync = state.meta.lastSyncedAt ? formatDateTime(state.meta.lastSyncedAt) : "尚未同步";
  const isLocal = BACKEND_MODE === "local";
  const cloudStatus = isLocal || cloudToken ? (state.meta.cloudStatus === "同步失败" ? state.meta.cloudError || "同步失败" : state.meta.cloudStatus) : "未连接";
  return `
    <div class="page-head">
      <div>
        <h1 class="page-title">设置</h1>
        <p class="page-subtitle">${escapeHTML(user.name)} · ${escapeHTML(user.title)}</p>
      </div>
    </div>

    <section class="card">
      <div class="section-title">提醒与权限</div>
      <div class="settings-list">
        <div class="setting-row">
          <div><strong>系统通知</strong><small>允许浏览器锁屏横幅、震动与铃声</small></div>
          <button class="secondary-button" data-action="request-notification">${notificationText}</button>
        </div>
        <div class="setting-row">
          <div><strong>提醒强度</strong><small>重要事项使用更明显的弹窗</small></div>
          <select data-setting="remindStrength" style="min-height:40px;border:1px solid var(--line);border-radius:8px;padding:0 10px">
            <option value="normal" ${settings.remindStrength === "normal" ? "selected" : ""}>标准</option>
            <option value="strong" ${settings.remindStrength === "strong" ? "selected" : ""}>强提醒</option>
          </select>
        </div>
        <div class="setting-row">
          <div><strong>锁屏弹窗</strong><small>到期时弹出全屏日程提醒</small></div>
          <label class="switch"><input type="checkbox" data-setting="lockScreen" ${settings.lockScreen ? "checked" : ""} /><span></span></label>
        </div>
        <div class="setting-row">
          <div><strong>隐藏私人行程</strong><small>私人行程在列表中显示为灰色且可隐藏</small></div>
          <label class="switch"><input type="checkbox" data-setting="hiddenPrivate" ${settings.hiddenPrivate ? "checked" : ""} /><span></span></label>
        </div>
      </div>
    </section>

    <section class="card section">
      <div class="section-title">云端同步</div>
      <div class="settings-list">
        <div class="setting-row">
          <div><strong>${isLocal ? "电脑后端同步" : "跨设备云同步"}</strong><small>${isLocal ? "手机和电脑通过同一局域网同步，无需 GitHub Token" : "不同手机和电脑共用同一份日程"}</small></div>
          <span class="cloud-status ${isLocal || cloudToken ? "connected" : ""}">${escapeHTML(cloudStatus)}</span>
        </div>
        ${isLocal || cloudToken ? `
          <div class="setting-row">
            <div><strong>最近同步</strong><small>${escapeHTML(cloudLastSync)}</small></div>
            <button class="secondary-button" data-action="cloud-sync">${isLocal ? "立即同步" : "立即云同步"}</button>
          </div>
          ${isLocal ? "" : `
          <div class="setting-row">
            <div><strong>断开云同步</strong><small>本机数据会保留，但不再自动上传或拉取</small></div>
            <button class="danger-button" data-action="disconnect-cloud">断开</button>
          </div>
          `}
        ` : `
          <div class="field cloud-token-field">
            <label for="cloud-token">GitHub Token</label>
            <input id="cloud-token" type="password" placeholder="粘贴你的 GitHub Token" autocomplete="off" />
            <small>需要一个能访问 <strong>czy77zt/boss-schedule-data</strong> 仓库的 token。</small>
          </div>
          <div class="setting-row">
            <div><strong>连接 GitHub 云数据库</strong><small>手机和电脑都粘贴同一个 Token 即可自动同步</small></div>
            <button class="primary-button" data-action="connect-cloud">连接并同步</button>
          </div>
        `}
      </div>
    </section>

    <section class="card section">
      <div class="section-title">应用与数据</div>
      <div class="settings-list">
        <div class="setting-row">
          <div><strong>安装到手机 / 电脑</strong><small>PWA 离线可用，联网时自动与云端同步</small></div>
          <button class="secondary-button" data-action="install-app">安装应用</button>
        </div>
        <div class="setting-row">
          <div><strong>立即同步</strong><small>拉取云端数据，并把本机修改上传</small></div>
          <button class="secondary-button" data-action="manual-sync">立即同步</button>
        </div>
        <div class="setting-row">
          <div><strong>重置演示数据</strong><small>清空所有日程、消息与日志，不可恢复</small></div>
          <button class="danger-button" data-action="reset-data">重置数据</button>
        </div>
      </div>
    </section>
  `;
}

function renderScheduleModal() {
  const editing = scheduleModal && scheduleModal.id ? scheduleById(scheduleModal.id) : null;
  const isEdit = Boolean(editing);
  const values = editing || {
    title: "",
    category: "work",
    priority: "routine",
    date: selectedDate,
    startTime: "09:00",
    endTime: "10:00",
    location: "",
    notes: "",
    repeat: "none",
    repeatEnd: "",
    pinned: false,
    starred: false,
    hidden: false
  };

  return `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal" data-stop>
        <div class="modal-head">
          <h2>${isEdit ? "编辑日程" : "新增日程"}</h2>
          <button class="icon-button" data-action="close-schedule-modal">✕</button>
        </div>
        <form id="schedule-form">
          <div class="form-grid">
            <div class="field full">
              <label>标题</label>
              <input name="title" required maxlength="60" value="${escapeHTML(values.title)}" placeholder="例如：重要客户接待" />
            </div>
            <div class="field">
              <label>分类</label>
              <select name="category">
                ${CATEGORIES.map((item) => `<option value="${item.id}" ${values.category === item.id ? "selected" : ""}>${item.label}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label>优先级</label>
              <select name="priority">
                ${PRIORITIES.map((item) => `<option value="${item.id}" ${values.priority === item.id ? "selected" : ""}>${item.label}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label>日期</label>
              <input name="date" type="date" required value="${values.date}" />
            </div>
            <div class="field">
              <label>重复</label>
              <select name="repeat">
                <option value="none" ${values.repeat === "none" ? "selected" : ""}>不重复</option>
                <option value="daily" ${values.repeat === "daily" ? "selected" : ""}>每日</option>
                <option value="weekly" ${values.repeat === "weekly" ? "selected" : ""}>每周</option>
                <option value="monthly" ${values.repeat === "monthly" ? "selected" : ""}>每月</option>
              </select>
            </div>
            <div class="field">
              <label>开始时间</label>
              <input name="startTime" type="time" value="${values.startTime}" />
            </div>
            <div class="field">
              <label>结束时间</label>
              <input name="endTime" type="time" value="${values.endTime}" />
            </div>
            <div class="field full">
              <label>地点</label>
              <input name="location" maxlength="80" value="${escapeHTML(values.location)}" placeholder="会议室、客户公司或线上链接" />
            </div>
            <div class="field full">
              <label>备注</label>
              <textarea name="notes" maxlength="300" placeholder="注意事项、接待要求、准备资料等">${escapeHTML(values.notes)}</textarea>
            </div>
            <div class="field full">
              <label class="checkbox-row"><input name="pinned" type="checkbox" ${values.pinned ? "checked" : ""} /><span>置顶显示</span></label>
              <label class="checkbox-row"><input name="starred" type="checkbox" ${values.starred ? "checked" : ""} /><span>星标收藏</span></label>
              <label class="checkbox-row"><input name="hidden" type="checkbox" ${values.hidden ? "checked" : ""} /><span>从列表隐藏</span></label>
            </div>
          </div>
          <div class="modal-actions">
            ${isEdit ? `<button type="button" class="danger-button" data-action="delete-schedule-modal" data-id="${editing.id}">删除</button>` : ""}
            <button type="button" class="ghost-button" data-action="close-schedule-modal">取消</button>
            <button type="submit" class="primary-button">${isEdit ? "保存修改" : "创建日程"}</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function openScheduleModal(mode = "new", id = null) {
  scheduleModal = { mode, id };
  renderApp();
}

function closeScheduleModal() {
  scheduleModal = null;
  renderApp();
}

let composerEl = null;

function openMessageComposer() {
  if (composerEl) return;
  const modal = document.createElement("div");
  modal.innerHTML = renderMessageComposer();
  composerEl = modal.firstElementChild;
  document.body.appendChild(composerEl);
}

function closeMessageComposer() {
  if (composerEl) {
    composerEl.remove();
    composerEl = null;
  } else {
    document.querySelector(".modal-backdrop")?.remove();
  }
}

function scheduleFormData(form) {
  const data = new FormData(form);
  return {
    title: data.get("title").trim(),
    category: data.get("category"),
    priority: data.get("priority"),
    date: data.get("date"),
    startTime: data.get("startTime") || "09:00",
    endTime: data.get("endTime") || "10:00",
    location: data.get("location").trim(),
    notes: data.get("notes").trim(),
    repeat: data.get("repeat"),
    repeatEnd: "",
    pinned: Boolean(data.get("pinned")),
    starred: Boolean(data.get("starred")),
    hidden: Boolean(data.get("hidden"))
  };
}

function createSchedule(data) {
  const user = currentUser();
  const now = new Date().toISOString();
  const item = {
    id: uid("sch"),
    ...data,
    completedDates: [],
    createdBy: user.id,
    createdAt: now,
    updatedBy: user.id,
    updatedAt: now
  };
  state.schedules.push(item);
  addLog(item.id, "create", "", describeSchedule(item));
  saveState();
  selectedDate = data.date;
  renderApp();
  showToast("日程已创建");
}

function updateSchedule(id, data) {
  const item = scheduleById(id);
  if (!item) return;
  const before = describeSchedule(item, item.date);
  Object.assign(item, data, { updatedBy: currentUser().id, updatedAt: new Date().toISOString() });
  const after = describeSchedule(item, item.date);
  addLog(id, "update", before, after);
  saveState();
  renderApp();
  showToast("修改已同步并记录日志");
}

function deleteSchedule(id) {
  const item = scheduleById(id);
  if (!item) return;
  addLog(id, "delete", describeSchedule(item, item.date), "");
  state.tombstones.schedules.push(id);
  state.tombstones.schedules = [...new Set(state.tombstones.schedules)];
  state.schedules = state.schedules.filter((s) => s.id !== id);
  selectedIds.delete(id);
  saveState();
  renderApp();
  showToast("日程已删除");
}

function toggleComplete(id, key = todayKey()) {
  const item = scheduleById(id);
  if (!item) return;
  const isDone = isCompleted(item, key);
  if (isDone) {
    item.completedDates = item.completedDates.filter((d) => d !== key);
    addLog(id, "uncomplete", "已完成", "恢复未完成");
  } else {
    item.completedDates.push(key);
    addLog(id, "complete", "未完成", "已完成");
  }
  item.updatedBy = currentUser().id;
  item.updatedAt = new Date().toISOString();
  saveState();
  renderApp();
  showToast(isDone ? "已取消完成" : "已完成");
}

function postponeSchedule(id, days = 1) {
  const item = scheduleById(id);
  if (!item) return;
  const before = describeSchedule(item, item.date);
  item.date = toDateKey(addDays(parseDateKey(item.date), days));
  item.updatedBy = currentUser().id;
  item.updatedAt = new Date().toISOString();
  addLog(id, "postpone", before, describeSchedule(item, item.date));
  saveState();
  renderApp();
  showToast(`已延期至 ${formatShortDate(item.date)}`);
}

function starSchedule(id) {
  const item = scheduleById(id);
  if (!item) return;
  item.starred = !item.starred;
  item.updatedBy = currentUser().id;
  item.updatedAt = new Date().toISOString();
  addLog(id, "update", item.starred ? "未星标" : "已星标", item.starred ? "已星标" : "未星标");
  saveState();
  renderApp();
}

function addLog(scheduleId, action, before, after) {
  const user = currentUser();
  state.logs.push({
    id: uid("log"),
    scheduleId,
    operator: user.id,
    operatorName: user.name,
    action,
    before,
    after,
    time: new Date().toISOString()
  });
}

function unreadCountFor(userId) {
  return state.messages.filter((item) => item.to === userId && !item.readBy[userId]).length;
}

function updateDocumentBadge() {
  const user = currentUser();
  const count = user ? unreadCountFor(user.id) + schedulesForDate(todayKey()).filter((item) => !isCompleted(item, todayKey()) && item.priority === "urgent").length : 0;
  document.title = `${count ? `(${count}) ` : ""}老板日程同步`;
}

function sendMessage(type, title, body) {
  const user = currentUser();
  const other = otherUser();
  if (!title.trim() || !body.trim()) {
    showToast("请填写标题和内容");
    return;
  }
  const message = {
    id: uid("msg"),
    type,
    title: title.trim(),
    body: body.trim(),
    from: user.id,
    to: other.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    readBy: { assistant: user.id === "assistant", boss: user.id === "boss" }
  };
  state.messages.push(message);
  saveState();
  closeMessageComposer();
  renderApp();
  showToast("消息已发送");
}

function markMessageRead(id) {
  const message = state.messages.find((item) => item.id === id);
  if (!message) return;
  message.readBy[currentUser().id] = true;
  message.updatedAt = new Date().toISOString();
  saveState();
  renderApp();
}

function deleteMessage(id) {
  const message = state.messages.find((item) => item.id === id);
  if (!message) return;
  state.tombstones.messages.push(id);
  state.tombstones.messages = [...new Set(state.tombstones.messages)];
  state.messages = state.messages.filter((item) => item.id !== id);
  saveState();
  renderApp();
  showToast("消息已删除");
}

function icsDateTime(date, time) {
  const [hour = 0, minute = 0] = String(time || "00:00").split(":").map(Number);
  return `${date.replaceAll("-", "")}T${pad(hour)}${pad(minute)}00`;
}

function icsEscape(value) {
  return String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll("\n", "\\n");
}

function exportTodayICS() {
  const key = todayKey();
  const list = sortSchedules(visibleSchedules(key), key);
  if (!list.length) {
    showToast("今天没有可导出的日程");
    return;
  }

  const now = new Date();
  const stamp = `${toDateKey(now).replaceAll("-", "")}T${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BossSchedule//CN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH"
  ];

  list.forEach((item) => {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${item.id}@boss-schedule`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsDateTime(item.date, item.startTime)}`,
      `DTEND:${icsDateTime(item.date, item.endTime)}`,
      `SUMMARY:${icsEscape(item.title)}`
    );
    if (item.location) lines.push(`LOCATION:${icsEscape(item.location)}`);
    if (item.notes) lines.push(`DESCRIPTION:${icsEscape(item.notes)}`);
    lines.push(
      "BEGIN:VALARM",
      "TRIGGER:-PT1H",
      "ACTION:DISPLAY",
      `DESCRIPTION:${icsEscape(`日程提醒：${item.title}`)}`,
      "END:VALARM",
      "END:VEVENT"
    );
  });

  lines.push("END:VCALENDAR");
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `老板日程-${key}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  showToast("日历文件已生成，请导入手机系统日历");
}

async function shareReport() {
  const text = buildDailyReport(todayKey());
  if (navigator.share) {
    try {
      await navigator.share({ title: "老板日程日报", text });
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }
  copyText(text, "日报已复制，可粘贴到微信");
}

async function copyReport() {
  copyText(buildDailyReport(todayKey()), "日报已复制");
}

async function copyText(text, message = "已复制") {
  try {
    await navigator.clipboard.writeText(text);
    showToast(message);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    showToast(message);
  }
}

function requestNotificationPermission() {
  if (!("Notification" in window)) {
    showToast("当前浏览器不支持系统通知");
    return;
  }
  Notification.requestPermission().then((permission) => {
    state.settings.notifyPermission = permission === "granted";
    saveState();
    renderApp();
    showToast(permission === "granted" ? "系统通知已开启" : "通知权限未开启");
  });
}

function vibrate(pattern) {
  if ("vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore unsupported vibration.
    }
  }
}

function playBeep() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio may be blocked until user interaction.
  }
}

function checkReminders(isBoot = false) {
  const now = new Date();
  const key = todayKey();
  const items = schedulesForDate(key);
  let changed = false;

  items.forEach((item) => {
    if (isCompleted(item, key)) return;
    const thresholds = [
      { label: "今日提醒", time: parseDateKey(key) },
      { label: "早间提醒", time: new Date(`${key}T08:00:00`) },
      { label: "提前 1 小时", time: new Date(`${key}T${item.startTime}`) - 60 * 60 * 1000 },
      { label: "开始提醒", time: new Date(`${key}T${item.startTime}`) }
    ];
    thresholds.forEach((threshold) => {
      const fireKey = `${item.id}-${key}-${threshold.label}`;
      if (state.reminderFired[fireKey]) return;
      const elapsed = now - threshold.time;
      const shouldFire = isBoot ? elapsed >= 0 && elapsed <= 10 * 60 * 1000 : elapsed >= 0 && elapsed <= 5 * 60 * 1000;
      if (shouldFire) {
        changed = true;
        state.reminderFired[fireKey] = true;
        fireReminder(item, threshold.label, key);
      } else if (elapsed > 10 * 60 * 1000) {
        changed = true;
        state.reminderFired[fireKey] = true;
      }
    });
  });
  if (changed) saveState();
}

function fireReminder(item, label, key) {
  const title = `${label}：${item.title}`;
  const detail = `${formatTime(item.startTime)}-${formatTime(item.endTime)} · ${item.location || "未填地点"}\n${item.notes || ""}`;
  lastReminderKey = item.id;
  showToast(title);
  vibrate([120, 60, 120]);
  playBeep();

  if (state.settings.lockScreen) {
    const overlay = document.getElementById("reminder-overlay");
    document.getElementById("reminder-title").textContent = title;
    document.getElementById("reminder-detail").textContent = detail;
    overlay.hidden = false;
  }

  if (state.settings.notifyPermission && "Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, { body: detail.replaceAll("\n", " · ") });
    } catch {
      // Ignore notification constructor errors.
    }
  }
}

function installApp() {
  if (beforeInstallPrompt) {
    beforeInstallPrompt.prompt();
  } else {
    showToast("使用浏览器菜单中的“添加到主屏幕”安装");
  }
}

function resetData() {
  if (!confirm("确定清空全部日程、消息和日志吗？此操作不可恢复。")) return;
  state = defaultState();
  state.currentUserId = currentUser()?.id || null;
  state.settings.notifyPermission = "Notification" in window && Notification.permission === "granted";
  selectedIds = new Set();
  saveState();
  renderApp();
  showToast("演示数据已重置");
}

function handleClick(event) {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;

  if (action === "login-submit") {
    const account = document.getElementById("login-account").value.trim();
    const password = document.getElementById("login-password").value;
    login(account, password);
    return;
  }

  if (action === "quick-login") {
    login(target.dataset.user, "123456");
    return;
  }

  if (action === "logout") {
    logout();
    return;
  }

  if (action === "nav") {
    view = target.dataset.view;
    selectedIds = new Set();
    scheduleModal = null;
    renderApp();
    return;
  }

  if (action === "new-schedule") {
    openScheduleModal("new");
    return;
  }

  if (action === "edit-schedule") {
    openScheduleModal("edit", target.dataset.id);
    return;
  }

  if (action === "delete-schedule") {
    if (confirm("确认删除这条日程吗？")) deleteSchedule(target.dataset.id);
    return;
  }

  if (action === "delete-schedule-modal") {
    if (confirm("确认删除这条日程吗？")) {
      const id = target.dataset.id;
      scheduleModal = null;
      deleteSchedule(id);
    }
    return;
  }

  if (action === "close-modal") {
    // 只有直接点击遮罩层本身才关闭；点击弹窗内部的输入框、空白处不关闭
    if (event.target === target && target.classList.contains("modal-backdrop")) closeScheduleModal();
    return;
  }

  if (action === "close-schedule-modal") {
    closeScheduleModal();
    return;
  }

  if (action === "toggle-complete") {
    toggleComplete(target.dataset.id, target.dataset.date);
    return;
  }

  if (action === "star-schedule") {
    starSchedule(target.dataset.id);
    return;
  }

  if (action === "toggle-select") {
    const id = target.dataset.id;
    if (target.checked) selectedIds.add(id);
    else selectedIds.delete(id);
    renderApp();
    return;
  }

  if (action === "batch-postpone") {
    const ids = [...selectedIds];
    if (!ids.length) {
      showToast("请先勾选要延后的日程");
      return;
    }
    ids.forEach((id) => postponeSchedule(id, 1));
    selectedIds = new Set();
    renderApp();
    showToast(`已批量延后 ${ids.length} 项日程`);
    return;
  }

  if (action === "clear-completed") {
    const key = selectedDate;
    const oneOffIds = state.schedules.filter((item) => item.repeat === "none" && isCompleted(item, key)).map((item) => item.id);
    oneOffIds.forEach((id) => addLog(id, "clearCompleted", "已完成", "清理"));
    state.schedules = state.schedules.filter((item) => !(item.repeat === "none" && isCompleted(item, key)));
    state.schedules.forEach((item) => {
      if (item.repeat !== "none" && item.completedDates.includes(key)) {
        item.completedDates = item.completedDates.filter((d) => d !== key);
        addLog(item.id, "uncomplete", "已完成", "恢复未完成");
      }
    });
    selectedIds = new Set();
    saveState();
    renderApp();
    showToast(`已清理 ${oneOffIds.length} 项已完成日程`);
    return;
  }

  if (action === "clear-selection") {
    selectedIds = new Set();
    renderApp();
    return;
  }

  if (action === "calendar-prev" || action === "calendar-next") {
    const dir = action === "calendar-prev" ? -1 : 1;
    if (calendarMode === "day") {
      selectedDate = toDateKey(addDays(parseDateKey(selectedDate), dir));
      calendarCursor = parseDateKey(selectedDate);
    } else if (calendarMode === "week") {
      selectedDate = toDateKey(addDays(parseDateKey(selectedDate), dir * 7));
      calendarCursor = parseDateKey(selectedDate);
    } else {
      calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + dir, 1);
      selectedDate = toDateKey(calendarCursor);
    }
    renderApp();
    return;
  }

  if (action === "calendar-mode") {
    calendarMode = target.dataset.mode;
    renderApp();
    return;
  }

  if (action === "select-date") {
    selectedDate = target.dataset.date;
    renderApp();
    return;
  }

  if (action === "open-message-composer") {
    openMessageComposer();
    return;
  }

  if (action === "close-message-composer") {
    // 点击弹窗内部不关闭，只有点遮罩本身或关闭/取消按钮才关闭
    if (target.classList.contains("modal-backdrop") && event.target !== target) return;
    closeMessageComposer();
    return;
  }

  if (action === "send-message") {
    const type = document.getElementById("message-type").value;
    const title = document.getElementById("message-title").value;
    const body = document.getElementById("message-body").value;
    sendMessage(type, title, body);
    return;
  }

  if (action === "mark-message-read") {
    markMessageRead(target.dataset.id);
    return;
  }

  if (action === "delete-message") {
    if (confirm("确认删除这条消息吗？")) deleteMessage(target.dataset.id);
    return;
  }

  if (action === "export-ics") {
    exportTodayICS();
    return;
  }

  if (action === "share-report") {
    shareReport();
    return;
  }

  if (action === "copy-report") {
    copyReport();
    return;
  }

  if (action === "request-notification") {
    requestNotificationPermission();
    return;
  }

  if (action === "install-app") {
    installApp();
    return;
  }

  if (action === "manual-sync") {
    if (!isCloudConfigured()) {
      renderApp();
      showToast("请先在设置中连接 GitHub 云同步");
      return;
    }
    syncNow().then(() => renderApp());
    return;
  }

  if (action === "cloud-sync") {
    syncNow().then(() => renderApp());
    return;
  }

  if (action === "connect-cloud") {
    connectCloud();
    return;
  }

  if (action === "disconnect-cloud") {
    disconnectCloud();
    return;
  }

  if (action === "reset-data") {
    resetData();
    return;
  }

  if (action === "close-reminder") {
    document.getElementById("reminder-overlay").hidden = true;
    return;
  }

  if (action === "complete-reminder") {
    const id = lastReminderKey;
    if (id) toggleComplete(id, todayKey());
    document.getElementById("reminder-overlay").hidden = true;
    return;
  }
}

function handleSubmit(event) {
  if (event.target.id !== "schedule-form") return;
  event.preventDefault();
  const data = scheduleFormData(event.target);
  if (scheduleModal?.id) updateSchedule(scheduleModal.id, data);
  else createSchedule(data);
}

function handleInput(event) {
  if (event.target.dataset.setting) {
    const key = event.target.dataset.setting;
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    state.settings[key] = value;
    saveState();
    return;
  }
  if (event.target.id === "log-search") {
    // 只局部刷新日志列表，不整页重渲染，避免输入框丢焦点、中文输入法被打断
    searchQuery = event.target.value;
    renderLogsList();
    return;
  }
  if (event.target.id === "log-filter") {
    logFilter = event.target.value;
    renderLogsList();
    return;
  }
}

function handleKeydown(event) {
  if (event.key === "Escape") {
    const reminder = document.getElementById("reminder-overlay");
    if (reminder && !reminder.hidden) {
      reminder.hidden = true;
      return;
    }
    if (scheduleModal) closeScheduleModal();
    closeMessageComposer();
  }
  if (event.key === "Enter" && !currentUser()) {
    const account = document.getElementById("login-account");
    const password = document.getElementById("login-password");
    if (account && password && (event.target === account || event.target === password)) {
      login(account.value.trim(), password.value);
    }
  }
}

function setupSyncChannel() {
  if ("BroadcastChannel" in window) {
    channel = new BroadcastChannel("boss-schedule-channel");
    channel.onmessage = (event) => {
      if (event.data?.type === "state-updated" && event.data.state) {
        state = {
          ...defaultState(),
          ...event.data.state,
          users: USERS,
          settings: { ...defaultState().settings, ...(event.data.state.settings || {}) },
          reminderFired: event.data.state.reminderFired || {}
        };
        refresh();
      }
    };
  }
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        state = { ...defaultState(), ...parsed, users: USERS };
        refresh();
      } catch {
        // Ignore malformed state from another tab.
      }
    }
  });
}

function setupServiceWorker() {
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
}

function setupInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    beforeInstallPrompt = event;
  });
}

document.addEventListener("click", handleClick);
document.addEventListener("submit", handleSubmit);
document.addEventListener("input", handleInput);
document.addEventListener("keydown", handleKeydown);

setupSyncChannel();
setupServiceWorker();
setupInstallPrompt();
setupCloudSync();
renderApp();
updateDocumentBadge();
checkReminders(true);
reminderTimer = setInterval(() => checkReminders(false), 30000);
