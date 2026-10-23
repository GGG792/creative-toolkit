/* =========================================================
   创意工具箱 - 5个工具的核心逻辑
   ========================================================= */

const $ = (id) => document.getElementById(id);

// ---------- 侧边栏切换 ----------
document.querySelectorAll(".tool-item").forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".tool-item").forEach((x) => x.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    item.classList.add("active");
    $("panel-" + item.dataset.tool).classList.add("active");
  });
});

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1800);
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => toast("已复制到剪贴板")).catch(() => toast("复制失败"));
}

/* ========== 1. 渐变生成器 ========== */
const gradPreview = $("gradPreview");
const gradCss = $("gradCss");

function updateGradient() {
  const c1 = $("gradC1").value;
  const c2 = $("gradC2").value;
  const angle = $("gradAngle").value;
  $("angleVal").textContent = angle;
  const css = `linear-gradient(${angle}deg, ${c1}, ${c2})`;
  gradPreview.style.background = css;
  gradCss.textContent = `background: ${css};`;
}
$("gradC1").addEventListener("input", updateGradient);
$("gradC2").addEventListener("input", updateGradient);
$("gradAngle").addEventListener("input", updateGradient);
$("randomGrad").addEventListener("click", () => {
  $("gradC1").value = randHex();
  $("gradC2").value = randHex();
  $("gradAngle").value = Math.floor(Math.random() * 360);
  updateGradient();
});
$("copyGrad").addEventListener("click", () => copyText(gradCss.textContent));
updateGradient();

function randHex() {
  return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
}

/* ========== 2. 配色方案 ========== */
function genPalette() {
  // 生成和谐的5色：基于HSV，固定饱和度和亮度，均匀分布色相
  const baseHue = Math.floor(Math.random() * 360);
  const palette = $("palette");
  palette.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    const hue = (baseHue + i * 72) % 360;
    const sat = 55 + Math.random() * 25;
    const light = 45 + Math.random() * 20;
    const { hex, rgb } = hslToRgb(hue, sat, light);
    const div = document.createElement("div");
    div.className = "color-swatch";
    div.style.background = hex;
    div.innerHTML = `
      <span class="copy-hint">点击复制</span>
      <span class="hex">${hex}</span>
      <span class="rgb">${rgb}</span>
    `;
    div.addEventListener("click", () => copyText(hex));
    palette.appendChild(div);
  }
}
function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const color = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(255 * color);
  };
  const r = f(0), g = f(8), b = f(4);
  return {
    hex: "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join(""),
    rgb: `rgb(${r},${g},${b})`,
  };
}
$("genPalette").addEventListener("click", genPalette);
$("copyPalette").addEventListener("click", () => {
  const hexes = [...document.querySelectorAll(".color-swatch .hex")].map((e) => e.textContent);
  copyText(hexes.join(", "));
});
genPalette();

/* ========== 3. 密码生成器 ========== */
const pwdDisplay = $("pwdDisplay");
const lenSlider = $("pwdLen");
const lenVal = $("lenVal");
lenSlider.addEventListener("input", () => lenVal.textContent = lenSlider.value);

function genPassword() {
  const len = parseInt(lenSlider.value);
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const num = "0123456789";
  const sym = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  let pool = "";
  if ($("optUpper").checked) pool += upper;
  if ($("optLower").checked) pool += lower;
  if ($("optNum").checked) pool += num;
  if ($("optSym").checked) pool += sym;
  if (!pool) {
    pwdDisplay.textContent = "请至少选择一种字符类型";
    return;
  }
  let pwd = "";
  for (let i = 0; i < len; i++) {
    pwd += pool[Math.floor(Math.random() * pool.length)];
  }
  pwdDisplay.textContent = pwd;
  updateStrength(pwd);
}
function updateStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (pwd.length >= 16) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const pct = (score / 6) * 100;
  const fill = $("strengthFill");
  fill.style.width = pct + "%";
  fill.style.background = pct < 34 ? "#ff5470" : pct < 67 ? "#f5a623" : "#2ecc71";
}
$("genPwd").addEventListener("click", genPassword);
$("copyPwd").addEventListener("click", () => {
  if (pwdDisplay.textContent && pwdDisplay.textContent.length > 10) copyText(pwdDisplay.textContent);
});

/* ========== 4. Markdown 预览 ========== */
const mdInput = $("mdInput");
const mdPreview = $("mdPreview");

function renderMarkdown(text) {
  let html = text
    // 代码块
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre><code>${escapeHtml(code.trim())}</code></pre>`
    )
    // 行内代码
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // 标题
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // 引用
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    // 粗体
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // 斜体
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // 链接
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')
    // 无序列表
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*?<\/li>)/g, (m) => `<ul>${m}</ul>`)
    // 段落
    .replace(/^(?!<[a-z])((?:(?!^\n).)+)$/gm, "<p>$1</p>")
    // 清理多余的 ul 嵌套
    .replace(/<\/ul>\n*<ul>/g, "");
  return html;
}
function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}
mdInput.addEventListener("input", () => {
  mdPreview.innerHTML = renderMarkdown(mdInput.value);
});
mdPreview.innerHTML = renderMarkdown(mdInput.value);

/* ========== 5. 番茄钟 ========== */
let timerMode = 25;
let timerSeconds = 25 * 60;
let timerInterval = null;
let timerRunning = false;
let rounds = 0;

const timerDisplay = $("timerDisplay");

function setMode(min) {
  timerMode = min;
  timerSeconds = min * 60;
  updateTimerDisplay();
  document.querySelectorAll(".mode-btn").forEach((b) => {
    b.classList.toggle("active", parseInt(b.dataset.mode) === min);
  });
}
function updateTimerDisplay() {
  const m = Math.floor(timerSeconds / 60);
  const s = timerSeconds % 60;
  timerDisplay.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  document.title = `${timerDisplay.textContent} - 番茄钟`;
}
function startTimer() {
  if (timerRunning) {
    clearInterval(timerInterval);
    $("timerStart").textContent = "▶ 开始";
    timerRunning = false;
    return;
  }
  timerRunning = true;
  $("timerStart").textContent = "⏸ 暂停";
  timerInterval = setInterval(() => {
    timerSeconds--;
    updateTimerDisplay();
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      $("timerStart").textContent = "▶ 开始";
      if (timerMode === 25) {
        rounds++;
        $("timerRounds").textContent = `已完成 ${rounds} 个番茄`;
        toast("🍅 专注时间结束，休息一下吧！");
      } else {
        toast("休息结束，继续加油！");
      }
    }
  }, 1000);
}
function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  $("timerStart").textContent = "▶ 开始";
  timerSeconds = timerMode * 60;
  updateTimerDisplay();
}
document.querySelectorAll(".mode-btn").forEach((b) => {
  b.addEventListener("click", () => {
    resetTimer();
    setMode(parseInt(b.dataset.mode));
  });
});
$("timerStart").addEventListener("click", startTimer);
$("timerReset").addEventListener("click", resetTimer);
updateTimerDisplay();
