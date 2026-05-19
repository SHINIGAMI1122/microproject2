// ============================================================
// FITNESS AI TRACKER - app.js
// Complete vanilla JavaScript for all pages and features
// ============================================================

/* ─────────────────────────────────────────────
   PAGE TITLES MAP
───────────────────────────────────────────── */
const PAGE_TITLES = {
  dashboard: 'Dashboard',
  calories:  'Calorie Tracker',
  gps:       'GPS Tracker',
  habits:    'Daily Habits',
  growth:    'Growth Tracker',
  diet:      'Diet Plans',
  band:      'Connect Band',
  ai:        'AI Assistant'
};

/* ─────────────────────────────────────────────
   NAVIGATION SYSTEM
───────────────────────────────────────────── */
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      switchPage(page);
    });
  });
}

function switchPage(pageName) {
  // Deactivate all nav items and pages
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  // Activate the selected nav item
  const navItem = document.querySelector(`.nav-item[data-page="${pageName}"]`);
  if (navItem) navItem.classList.add('active');

  // Activate the selected page
  const page = document.getElementById(`page-${pageName}`);
  if (page) page.classList.add('active');

  // Update page title
  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = PAGE_TITLES[pageName] || pageName;

  // Run page-specific init when switching
  if (pageName === 'diet') renderDietPlans('all');
  if (pageName === 'habits') { renderHabits(); renderStreaks(); }
  if (pageName === 'growth') { drawGrowthCharts(); renderGrowthTable(); }
  if (pageName === 'calories') { renderMealList(); updateCalorieDisplay(); }
}

/* ─────────────────────────────────────────────
   SIDEBAR TOGGLE
───────────────────────────────────────────── */
function initSidebarToggle() {
  const btn     = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const main    = document.getElementById('mainContent');
  if (!btn) return;
  btn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    main.classList.toggle('sidebar-collapsed');
  });
}

/* ─────────────────────────────────────────────
   DATE DISPLAY
───────────────────────────────────────────── */
function setDateDisplay() {
  const el = document.getElementById('dateDisplay');
  if (!el) return;
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  el.textContent = now.toLocaleDateString('en-US', options);
}

/* ─────────────────────────────────────────────
   ANIMATED COUNTERS
───────────────────────────────────────────── */
function animateCounter(id, target, duration = 1500) {
  const el = document.getElementById(id);
  if (!el) return;
  const start     = 0;
  const startTime = performance.now();
  function update(currentTime) {
    const elapsed  = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + (target - start) * eased).toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function animateAllCounters() {
  animateCounter('calBurned',   847);
  animateCounter('stepCount',   7432);
  animateCounter('heartRate',   72);
  animateCounter('waterIntake', 1800);
}

/* ─────────────────────────────────────────────
   SVG PROGRESS RINGS
───────────────────────────────────────────── */
function animateRing(id, percent, duration = 1500) {
  const el = document.getElementById(id);
  if (!el) return;
  const startTime = performance.now();
  function update(currentTime) {
    const elapsed  = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    const value    = percent * eased;
    el.setAttribute('stroke-dasharray', `${value.toFixed(1)}, 100`);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function animateAllRings() {
  animateRing('calRing',   42);
  animateRing('stepRing',  74);
  animateRing('hrRing',    60);
  animateRing('waterRing', 72);
}

/* ─────────────────────────────────────────────
   CANVAS CHART HELPERS
───────────────────────────────────────────── */
/**
 * Draw a bar chart on a canvas element.
 * @param {HTMLCanvasElement} canvas
 * @param {string[]} labels
 * @param {{ label:string, data:number[], color:string }[]} datasets
 */
function drawBarChart(canvas, labels, datasets) {
  if (!canvas) return;
  const ctx    = canvas.getContext('2d');
  const W      = canvas.width;
  const H      = canvas.height;
  const padL   = 40, padR = 20, padT = 20, padB = 30;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fillRect(0, 0, W, H);

  // Find max value across all datasets
  let maxVal = 0;
  datasets.forEach(ds => ds.data.forEach(v => { if (v > maxVal) maxVal = v; }));
  maxVal = maxVal * 1.15 || 1;

  const numGroups  = labels.length;
  const numSets    = datasets.length;
  const groupW     = chartW / numGroups;
  const barPad     = groupW * 0.15;
  const barW       = (groupW - barPad * 2) / numSets;

  // Grid lines
  const gridLines = 5;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth   = 1;
  for (let i = 0; i <= gridLines; i++) {
    const y = padT + chartH - (i / gridLines) * chartH;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + chartW, y);
    ctx.stroke();
    // Y-axis labels
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font      = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round((i / gridLines) * maxVal), padL - 4, y + 3);
  }

  // Bars
  datasets.forEach((ds, si) => {
    ds.data.forEach((val, gi) => {
      const barH = (val / maxVal) * chartH;
      const x    = padL + gi * groupW + barPad + si * barW;
      const y    = padT + chartH - barH;

      // Gradient fill
      const grad = ctx.createLinearGradient(x, y, x, padT + chartH);
      grad.addColorStop(0, ds.color);
      grad.addColorStop(1, ds.color + '44');
      ctx.fillStyle = grad;

      // Rounded top corners
      const radius = Math.min(4, barW / 2);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + barW - radius, y);
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius);
      ctx.lineTo(x + barW, padT + chartH);
      ctx.lineTo(x, padT + chartH);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
    });
  });

  // X-axis labels
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font      = '11px Inter, sans-serif';
  ctx.textAlign = 'center';
  labels.forEach((label, gi) => {
    const x = padL + gi * groupW + groupW / 2;
    ctx.fillText(label, x, padT + chartH + 18);
  });
}

/**
 * Draw a line chart on a canvas element.
 * @param {HTMLCanvasElement} canvas
 * @param {string[]} labels
 * @param {number[]} data
 * @param {string} color  hex color
 */
function drawLineChart(canvas, labels, data, color) {
  if (!canvas || !data || data.length === 0) return;
  const ctx    = canvas.getContext('2d');
  const W      = canvas.width  || canvas.offsetWidth  || 400;
  const H      = canvas.height || canvas.offsetHeight || 200;
  canvas.width  = W;
  canvas.height = H;

  const padL = 45, padR = 20, padT = 20, padB = 30;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  ctx.clearRect(0, 0, W, H);

  let minVal = Math.min(...data);
  let maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;
  minVal -= range * 0.1;
  maxVal += range * 0.1;

  const toX = i => padL + (i / (data.length - 1)) * chartW;
  const toY = v => padT + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;

  // Grid
  const gridLines = 5;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth   = 1;
  for (let i = 0; i <= gridLines; i++) {
    const y = padT + (i / gridLines) * chartH;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + chartW, y);
    ctx.stroke();
    const val = maxVal - (i / gridLines) * (maxVal - minVal);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font      = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val.toFixed(1), padL - 4, y + 3);
  }

  // Gradient fill under line
  const grad = ctx.createLinearGradient(0, padT, 0, padT + chartH);
  grad.addColorStop(0, color + '55');
  grad.addColorStop(1, color + '00');

  ctx.beginPath();
  ctx.moveTo(toX(0), toY(data[0]));
  data.forEach((v, i) => { if (i > 0) ctx.lineTo(toX(i), toY(v)); });
  ctx.lineTo(toX(data.length - 1), padT + chartH);
  ctx.lineTo(toX(0), padT + chartH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(toX(0), toY(data[0]));
  data.forEach((v, i) => { if (i > 0) ctx.lineTo(toX(i), toY(v)); });
  ctx.strokeStyle = color;
  ctx.lineWidth   = 2.5;
  ctx.lineJoin    = 'round';
  ctx.stroke();

  // Dots
  data.forEach((v, i) => {
    ctx.beginPath();
    ctx.arc(toX(i), toY(v), 4, 0, Math.PI * 2);
    ctx.fillStyle   = color;
    ctx.fill();
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth   = 2;
    ctx.stroke();
  });

  // X-axis labels
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font      = '10px Inter, sans-serif';
  ctx.textAlign = 'center';
  labels.forEach((label, i) => {
    ctx.fillText(label, toX(i), padT + chartH + 18);
  });
}

/* ─────────────────────────────────────────────
   DASHBOARD – WEEKLY ACTIVITY CHART
───────────────────────────────────────────── */
function drawActivityChart() {
  const canvas = document.getElementById('activityChart');
  if (!canvas) return;
  // Ensure canvas has pixel dimensions
  canvas.width  = canvas.offsetWidth  || 600;
  canvas.height = canvas.offsetHeight || 200;

  const labels   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const calories = [520, 680, 430, 750, 610, 890, 847];
  const steps    = [5200, 7100, 4300, 8200, 6500, 9800, 7432];

  // Normalise steps to a similar scale as calories for display
  const stepsNorm = steps.map(s => s / 10);

  drawBarChart(canvas, labels, [
    { label: 'Calories', data: calories,   color: '#ff6b35' },
    { label: 'Steps',    data: stepsNorm,  color: '#4fc3f7' }
  ]);
}

/* ─────────────────────────────────────────────
   DASHBOARD – QUICK LOG
───────────────────────────────────────────── */
function quickLog() {
  const activity = document.getElementById('quickActivity');
  const duration = document.getElementById('quickDuration');
  const calories = document.getElementById('quickCalories');
  const logsEl   = document.getElementById('recentLogs');

  if (!activity.value.trim()) {
    showToast('Please enter an activity name', 'error');
    return;
  }

  const log = {
    activity: activity.value.trim(),
    duration: duration.value || 0,
    calories: calories.value || 0,
    time:     new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  };

  const div = document.createElement('div');
  div.className = 'log-entry';
  div.innerHTML = `
    <div class="log-icon"><i class="fas fa-bolt"></i></div>
    <div class="log-info">
      <strong>${log.activity}</strong>
      <span>${log.duration} min &bull; ${log.calories} kcal</span>
    </div>
    <div class="log-time">${log.time}</div>
  `;
  logsEl.prepend(div);

  // Clear inputs
  activity.value = '';
  duration.value = '';
  calories.value = '';

  showToast(`Logged: ${log.activity}`, 'success');
}

/* ─────────────────────────────────────────────
   DASHBOARD – HABITS MINI PREVIEW
───────────────────────────────────────────── */
function loadHabitsMini() {
  const container = document.getElementById('habitsMini');
  if (!container) return;
  const habits      = getHabits();
  const completions = getHabitCompletions();
  const today       = getTodayKey();

  container.innerHTML = habits.slice(0, 4).map(h => {
    const done = completions[today] && completions[today].includes(h.name);
    return `
      <div class="habit-mini-item ${done ? 'done' : ''}">
        <i class="${h.icon}"></i>
        <span>${h.name}</span>
        <div class="habit-mini-check">${done ? '<i class="fas fa-check"></i>' : ''}</div>
      </div>
    `;
  }).join('');
}

/* ─────────────────────────────────────────────
   DASHBOARD – AI DAILY TIP
───────────────────────────────────────────── */
const FITNESS_TIPS = [
  'Consistency beats intensity. A 30-minute walk every day outperforms a 3-hour gym session once a week.',
  'Drink a glass of water before every meal — it reduces calorie intake by up to 13% and boosts metabolism.',
  'Compound exercises like squats, deadlifts, and bench press activate 70%+ of your muscle mass simultaneously.',
  'Sleep is your secret weapon: 7-9 hours nightly boosts growth hormone by up to 70% and cuts injury risk in half.',
  'Protein at breakfast reduces hunger hormones for the entire day. Aim for 25-30g within 1 hour of waking.',
  'HIIT workouts burn 25-30% more calories than steady-state cardio in the same time window.',
  'Stretching for 10 minutes post-workout reduces next-day soreness by up to 40% and improves flexibility.',
  'Track your meals — people who log food lose 2x more weight than those who don\'t.',
  'Rest days are growth days. Muscles repair and grow during recovery, not during the workout itself.',
  'Walking 10,000 steps daily burns approximately 400-500 extra calories and improves cardiovascular health.'
];

function loadAITip() {
  const el = document.getElementById('aiTipContent');
  if (!el) return;
  setTimeout(() => {
    const tip = FITNESS_TIPS[Math.floor(Math.random() * FITNESS_TIPS.length)];
    el.innerHTML = `
      <div class="ai-tip-text">
        <i class="fas fa-lightbulb tip-icon"></i>
        <p>${tip}</p>
      </div>
    `;
  }, 1500);
}

/* ─────────────────────────────────────────────
   TOAST NOTIFICATIONS
───────────────────────────────────────────── */
function showToast(message, type = 'success') {
  const colors = {
    success: '#66bb6a',
    error:   '#ef5350',
    info:    '#4fc3f7',
    warning: '#ffa726'
  };
  const icons = {
    success: 'fa-check-circle',
    error:   'fa-times-circle',
    info:    'fa-info-circle',
    warning: 'fa-exclamation-triangle'
  };

  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #1e1e3a;
    border-left: 4px solid ${colors[type] || colors.success};
    color: #fff;
    padding: 14px 20px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-family: Inter, sans-serif;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    z-index: 9999;
    transform: translateX(120%);
    transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
    max-width: 320px;
  `;
  toast.innerHTML = `<i class="fas ${icons[type] || icons.success}" style="color:${colors[type]};font-size:18px;"></i><span>${message}</span>`;
  document.body.appendChild(toast);

  // Slide in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });
  });

  // Slide out and remove
  setTimeout(() => {
    toast.style.transform = 'translateX(120%)';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

/* ─────────────────────────────────────────────
   MODALS
───────────────────────────────────────────── */
function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.style.display = 'flex';
  modal.classList.remove('hidden');
  requestAnimationFrame(() => modal.classList.add('modal-open'));
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('modal-open');
  setTimeout(() => {
    modal.style.display = 'none';
    modal.classList.add('hidden');
  }, 250);
}

function initModalBackdropClose() {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });
}

/* ─────────────────────────────────────────────
   LOCAL STORAGE HELPERS
───────────────────────────────────────────── */
function saveLS(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { /* quota */ }
}
function loadLS(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}
function getTodayKey() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}
