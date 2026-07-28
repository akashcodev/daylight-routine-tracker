const DEFAULT_ACTIVITIES = [
  { id: 'wake', name: 'Wake up', note: 'Begin with a fresh start', time: '06:00', icon: '\u2600', color: 'sun' },
  { id: 'gym', name: 'Gym', note: 'Move your body, feel strong', time: '07:00', icon: '\u2321', color: 'sky' },
  { id: 'run', name: 'Running', note: 'One step at a time', time: '08:15', icon: '\u2197', color: 'rose' },
  { id: 'swim', name: 'Swimming', note: 'Make a splash', time: '09:30', icon: '\u2248', color: 'sky' },
  { id: 'study', name: 'Study time', note: 'Focus on what matters', time: '10:30', icon: '\u270e', color: 'violet' },
  { id: 'dinner', name: 'Dinner', note: 'Nourish and unwind', time: '20:00', icon: '\u2312', color: 'sun' },
  { id: 'sleep', name: 'Sleep time', note: 'Rest and recharge', time: '22:30', icon: '\u263e', color: 'violet' }
];

const list = document.querySelector('#routineList');
const dateInput = document.querySelector('#routineDate');
const progressText = document.querySelector('#progressText');
const progressBar = document.querySelector('#progressBar');
const activityDialog = document.querySelector('#activityDialog');
const alarmDialog = document.querySelector('#alarmDialog');
const activityForm = document.querySelector('#activityForm');
let alarmed = new Set();
let activeAlarmId = null;

const localDate = () => new Date().toLocaleDateString('en-CA');
const keyFor = date => `daylight:${date}`;
const key = () => keyFor(dateInput.value);
function blankData() { return { items: [], completed: [], skipped: [], times: {}, alarms: {}, snoozes: {} }; }
function getData(date = dateInput.value) {
  try { return { ...blankData(), ...JSON.parse(localStorage.getItem(keyFor(date)) || '{}') }; }
  catch (_) { return blankData(); }
}
function saveData(data) { localStorage.setItem(key(), JSON.stringify(data)); }
function activities(data = getData()) {
  return [...DEFAULT_ACTIVITIES.map(item => ({ ...item, time: data.times[item.id] || item.time })), ...data.items];
}
function iconFor(name) { return ({ sun: '\u2600', sky: '\u2321', rose: '\u2726', violet: '\u270e' })[name] || '\u2726'; }
function formatTime(time) { return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
function escapeHTML(value) { const el = document.createElement('div'); el.textContent = value; return el.innerHTML; }
function isAlarmOn(data, id) { return data.alarms[id] !== false; }
function displayStatus(data, id) { return data.completed.includes(id) ? 'complete' : data.skipped.includes(id) ? 'skipped' : ''; }
function timeToday(time) { const [hours, minutes] = time.split(':').map(Number); const result = new Date(); result.setHours(hours, minutes, 0, 0); return result; }
function localDateFor(date) { return date.toLocaleDateString('en-CA'); }
function formatDate(date) { return new Date(`${date}T12:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric' }); }

function render() {
  const data = getData();
  const items = activities(data);
  list.innerHTML = items.map(item => {
    const status = displayStatus(data, item.id);
    const alarmOn = isAlarmOn(data, item.id);
    return `<article class="routine-item ${item.color} ${status} ${item.custom ? 'custom' : ''}">
      <span class="activity-icon">${item.icon}</span>
      <div><p class="activity-name">${escapeHTML(item.name)}</p><p class="activity-note">${status === 'skipped' ? 'Skipped for today' : escapeHTML(item.note)}</p></div>
      <label class="time-control" aria-label="Time for ${escapeHTML(item.name)}"><span>\u25f7</span><input type="time" value="${item.time}" data-time="${item.id}" /></label>
      <div class="item-actions">
        <button class="alarm-toggle ${alarmOn ? 'on' : ''}" type="button" data-alarm="${item.id}" aria-label="${alarmOn ? 'Turn off' : 'Turn on'} alarm for ${escapeHTML(item.name)}" title="${alarmOn ? 'Alarm on' : 'Alarm off'}">\u266b</button>
        <button class="skip-button ${status === 'skipped' ? 'active' : ''}" type="button" data-skip="${item.id}" aria-label="${status === 'skipped' ? 'Restore' : 'Skip'} ${escapeHTML(item.name)}" title="${status === 'skipped' ? 'Restore' : 'Skip for today'}">\u21b7</button>
      </div>
      <button class="check-button" type="button" data-complete="${item.id}" aria-label="Mark ${escapeHTML(item.name)} complete">\u2713</button>
      ${item.custom ? `<button class="delete-button" type="button" data-delete="${item.id}" aria-label="Delete ${escapeHTML(item.name)}">\u00d7</button>` : ''}
    </article>`;
  }).join('');
  const complete = data.completed.filter(id => items.some(item => item.id === id)).length;
  progressText.textContent = `${complete} of ${items.length} complete`;
  progressBar.style.width = `${items.length ? (complete / items.length) * 100 : 0}%`;
  document.querySelector('#todayLabel').textContent = dateInput.value === localDate() ? 'YOUR DAILY RHYTHM \u00b7 TODAY' : 'YOUR DAILY RHYTHM';
  renderNextUp(data, items);
  renderWeek();
}

function renderNextUp(data = getData(), items = activities(data)) {
  const name = document.querySelector('#nextActivityName');
  const details = document.querySelector('#nextActivityDetails');
  const countdown = document.querySelector('#nextCountdown');
  if (dateInput.value !== localDate()) { name.textContent = 'Plan ahead'; details.textContent = 'Switch back to today to see your live next activity.'; countdown.textContent = formatDate(dateInput.value); return; }
  const now = new Date();
  const available = items.filter(item => !data.completed.includes(item.id) && !data.skipped.includes(item.id));
  const next = available.find(item => timeToday(item.time) >= now) || available[0];
  if (!next) { name.textContent = 'All done for today'; details.textContent = 'A little rest is part of the routine too.'; countdown.textContent = '\u2713 Great work'; return; }
  const when = timeToday(next.time);
  const minutes = Math.max(0, Math.round((when - now) / 60000));
  name.textContent = next.name;
  details.textContent = `${formatTime(next.time)} \u00b7 ${next.note}`;
  countdown.textContent = when < now ? 'Ready when you are' : minutes < 1 ? 'Starting now' : `in ${minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`}`;
}

function renderWeek() {
  const selected = new Date(`${dateInput.value}T12:00:00`);
  const days = Array.from({ length: 7 }, (_, index) => { const day = new Date(selected); day.setDate(selected.getDate() - 6 + index); return day; });
  const summary = days.map(day => { const date = localDateFor(day); const data = getData(date); return { date, day: day.toLocaleDateString([], { weekday: 'narrow' }), done: data.completed.length }; });
  document.querySelector('#weekDays').innerHTML = summary.map(day => `<span class="week-day ${day.done ? 'done' : ''} ${day.date === dateInput.value ? 'current' : ''}" title="${day.done} completed"><b>${day.day}</b><i>${day.done || '–'}</i></span>`).join('');
  const total = summary.reduce((sum, day) => sum + day.done, 0);
  document.querySelector('#weekTotal').textContent = `${total} done`;
  let streak = 0;
  for (let index = summary.length - 1; index >= 0 && summary[index].done; index--) streak++;
  document.querySelector('#streakText').textContent = streak ? `${streak}-day routine streak \u2726` : 'Complete one activity to begin';
}

function updateTime(id, time) {
  const data = getData(); const custom = data.items.find(item => item.id === id);
  if (custom) custom.time = time; else data.times[id] = time;
  saveData(data); render();
}
function beep() {
  try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); const o = ctx.createOscillator(); const gain = ctx.createGain(); o.connect(gain); gain.connect(ctx.destination); o.frequency.value = 660; gain.gain.setValueAtTime(.09, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + 1.3); o.start(); o.stop(ctx.currentTime + 1.3); } catch (_) {}
}
function showAlarm(item, isSnoozed = false) {
  activeAlarmId = item.id;
  document.querySelector('#alarmTitle').textContent = item.name;
  document.querySelector('#alarmMessage').textContent = isSnoozed ? 'Your 5-minute snooze is over.' : `${formatTime(item.time)} \u2014 ${item.note}`;
  beep(); if (!alarmDialog.open) alarmDialog.showModal();
  if ('Notification' in window && Notification.permission === 'granted') new Notification(`Daylight: ${item.name}`, { body: isSnoozed ? 'Your snooze is over.' : `It\'s ${formatTime(item.time)}. ${item.note}` });
}
function checkAlarms() {
  if (dateInput.value !== localDate()) return;
  const data = getData(); const now = new Date(); const current = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  activities(data).forEach(item => {
    if (!isAlarmOn(data, item.id) || data.completed.includes(item.id) || data.skipped.includes(item.id)) return;
    const alarmKey = `${dateInput.value}:${item.id}:${item.time}`;
    const snoozeKey = `snooze:${dateInput.value}:${item.id}:${data.snoozes[item.id] || ''}`;
    if (data.snoozes[item.id] && now.getTime() >= data.snoozes[item.id] && !alarmed.has(snoozeKey)) { alarmed.add(snoozeKey); delete data.snoozes[item.id]; saveData(data); showAlarm(item, true); }
    else if (item.time === current && !alarmed.has(alarmKey)) { alarmed.add(alarmKey); showAlarm(item); }
  });
  renderNextUp();
}

dateInput.value = localDate();
document.querySelector('#addActivityButton').addEventListener('click', () => { activityForm.reset(); activityDialog.showModal(); });
activityForm.addEventListener('submit', event => {
  event.preventDefault();
  const data = getData(); const name = document.querySelector('#activityName').value.trim(); const color = document.querySelector('input[name="activityColor"]:checked').value;
  data.items.push({ id: `custom-${Date.now()}`, name, note: 'Your custom routine', time: document.querySelector('#activityTime').value, icon: iconFor(color), color, custom: true });
  saveData(data); activityDialog.close(); render();
});
list.addEventListener('click', event => {
  const complete = event.target.closest('[data-complete]'); const remove = event.target.closest('[data-delete]'); const skip = event.target.closest('[data-skip]'); const alarm = event.target.closest('[data-alarm]'); const data = getData();
  if (complete) { const id = complete.dataset.complete; data.completed = data.completed.includes(id) ? data.completed.filter(x => x !== id) : [...data.completed, id]; data.skipped = data.skipped.filter(x => x !== id); saveData(data); render(); }
  if (skip) { const id = skip.dataset.skip; data.skipped = data.skipped.includes(id) ? data.skipped.filter(x => x !== id) : [...data.skipped, id]; data.completed = data.completed.filter(x => x !== id); saveData(data); render(); }
  if (alarm) { const id = alarm.dataset.alarm; data.alarms[id] = !isAlarmOn(data, id); saveData(data); render(); }
  if (remove) { const id = remove.dataset.delete; data.items = data.items.filter(item => item.id !== id); data.completed = data.completed.filter(itemId => itemId !== id); data.skipped = data.skipped.filter(itemId => itemId !== id); delete data.alarms[id]; saveData(data); render(); }
});
list.addEventListener('change', event => { if (event.target.matches('[data-time]')) updateTime(event.target.dataset.time, event.target.value); });
dateInput.addEventListener('change', () => { alarmed = new Set(); render(); });
document.querySelector('#resetButton').addEventListener('click', () => { const data = getData(); data.completed = []; data.skipped = []; saveData(data); render(); });
document.querySelector('#dismissAlarm').addEventListener('click', () => { activeAlarmId = null; alarmDialog.close(); });
document.querySelector('#snoozeAlarm').addEventListener('click', () => { if (activeAlarmId) { const data = getData(); data.snoozes[activeAlarmId] = Date.now() + 5 * 60 * 1000; saveData(data); } activeAlarmId = null; alarmDialog.close(); renderNextUp(); });
document.querySelector('#notificationButton').addEventListener('click', async () => { if (!('Notification' in window)) return; const result = await Notification.requestPermission(); document.querySelector('#notificationButton').classList.toggle('enabled', result === 'granted'); });
if ('Notification' in window && Notification.permission === 'granted') document.querySelector('#notificationButton').classList.add('enabled');
render(); checkAlarms(); setInterval(checkAlarms, 10000);
