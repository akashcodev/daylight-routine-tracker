const WELLNESS_KEY = 'daylight-wellness-v1';
const todayKey = () => new Date().toLocaleDateString('en-CA');
const read = () => {
  try { return JSON.parse(localStorage.getItem(WELLNESS_KEY)) || { gym: { completed: {}, logs: [] }, swim: [], focus: { minutes: 0, goals: [] } }; }
  catch (_) { return { gym: { completed: {}, logs: [] }, swim: [], focus: { minutes: 0, goals: [] } }; }
};
const write = data => localStorage.setItem(WELLNESS_KEY, JSON.stringify(data));
const toast = message => { const el = document.querySelector('#toast'); if (!el) return; el.textContent = message; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2600); };
const esc = value => { const el = document.createElement('span'); el.textContent = value; return el.innerHTML; };
const dayName = date => date.toLocaleDateString([], { weekday: 'short' });

function bootGym() {
  if (window.__daylight_wellness_booted) return; window.__daylight_wellness_booted = true;
  const schedule = [
    { short: 'MON', title: 'Push', subtitle: 'Chest, shoulders & triceps', exercises: [['Bench press', '4 sets · 8 reps'], ['Incline dumbbell press', '3 sets · 10 reps'], ['Cable fly', '3 sets · 12 reps'], ['Tricep pressdown', '3 sets · 12 reps']] },
    { short: 'TUE', title: 'Pull', subtitle: 'Back & biceps', exercises: [['Lat pulldown', '4 sets · 10 reps'], ['Seated cable row', '3 sets · 10 reps'], ['Face pull', '3 sets · 15 reps'], ['Hammer curl', '3 sets · 12 reps']] },
    { short: 'WED', title: 'Legs', subtitle: 'Quads, hamstrings & calves', exercises: [['Barbell squat', '4 sets · 8 reps'], ['Romanian deadlift', '3 sets · 10 reps'], ['Leg press', '3 sets · 12 reps'], ['Calf raise', '4 sets · 15 reps']] },
    { short: 'THU', title: 'Upper', subtitle: 'Strength & balance', exercises: [['Overhead press', '4 sets · 8 reps'], ['Pull ups', '3 sets · 8 reps'], ['Chest press', '3 sets · 10 reps'], ['Cable row', '3 sets · 12 reps']] },
    { short: 'FRI', title: 'Full body', subtitle: 'Finish strong', exercises: [['Deadlift', '3 sets · 6 reps'], ['Dumbbell lunge', '3 sets · 10 reps'], ['Push ups', '3 sets · 12 reps'], ['Plank', '3 sets · 45 sec']] },
    { short: 'SAT', title: 'Recovery', subtitle: 'Walk, stretch & restore', exercises: [['Long walk', '30 minutes'], ['Mobility flow', '15 minutes'], ['Gentle stretch', '10 minutes']] },
    { short: 'SUN', title: 'Reset', subtitle: 'Rest is training too', exercises: [['Hydrate well', 'All day'], ['Light mobility', '10 minutes'], ['Plan next week', '5 minutes']] }
  ];
  let selected = Math.min(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1, 6);
  const render = () => {
    const data = read(); const item = schedule[selected]; const complete = data.gym.completed[selected] || [];
    document.querySelector('#gymDays').innerHTML = schedule.map((day, index) => `<button class="day-button ${index === selected ? 'active' : ''} ${(data.gym.completed[index] || []).length === day.exercises.length ? 'done' : ''}" data-day="${index}"><strong>${day.short}</strong><span>${index + 27}</span></button>`).join('');
    document.querySelector('#dayTitle').textContent = `${item.short[0] + item.short.slice(1).toLowerCase()} · ${item.title}`;
    document.querySelector('#daySubtitle').textContent = item.subtitle;
    document.querySelector('#workoutTitle').textContent = `${item.title} day`;
    document.querySelector('#exerciseList').innerHTML = item.exercises.map((exercise, index) => `<div class="exercise ${complete.includes(index) ? 'complete' : ''}"><i>${index + 1}</i><div><b>${exercise[0]}</b><small>${exercise[1]}</small></div><button type="button" data-exercise="${index}">${complete.includes(index) ? 'Done ✓' : 'Mark done'}</button></div>`).join('');
    const sessions = schedule.filter((day, index) => (data.gym.completed[index] || []).length === day.exercises.length).length;
    document.querySelector('#gymSessions').textContent = `${sessions} / 5`;

    // Render recent logs
    const logsEl = document.querySelector('#gymLogs');
    if (logsEl) {
      const logs = data.gym.logs || [];
      logsEl.innerHTML = logs.length ? logs.slice(0,6).map(l => `<div class="log-row" style="padding:8px 0;border-top:1px solid rgba(0,0,0,0.05);display:flex;justify-content:space-between;align-items:center"><div><b>${esc(l.exercise)}</b><div class="small-copy" style="opacity:.8">${l.sets} sets · ${l.reps} reps</div></div><small style="opacity:.6">${l.date}</small></div>`).join('') : '<p class="small-copy">No recent logs</p>';
    }
  };
  document.querySelector('#gymDays').addEventListener('click', event => { const button = event.target.closest('[data-day]'); if (button) { selected = Number(button.dataset.day); render(); } });
  document.querySelector('#exerciseList').addEventListener('click', event => { const button = event.target.closest('[data-exercise]'); if (!button) return; const data = read(); const index = Number(button.dataset.exercise); const done = data.gym.completed[selected] || []; data.gym.completed[selected] = done.includes(index) ? done.filter(item => item !== index) : [...done, index]; write(data); render(); toast(done.includes(index) ? 'Exercise returned to your plan.' : 'Nice work — set completed.'); });
  const gymForm = document.querySelector('#gymLogForm');
  function dbg(msg) {
    try {
      console.log(msg);
      var el = document.getElementById('debugLog');
      if (!el) return;
      el.style.display = 'block';
      var p = document.createElement('div'); p.textContent = String(msg); el.appendChild(p);
      if (el.children.length > 6) el.removeChild(el.children[0]);
    } catch (e) { console.warn('dbg failed', e); }
  }
  if (gymForm) {
    dbg('[Wellness] gymLogForm found, attaching submit handler');
    gymForm.addEventListener('submit', event => {
      event.preventDefault();
      const name = document.querySelector('#gymExerciseName') ? document.querySelector('#gymExerciseName').value.trim() : '';
      const sets = document.querySelector('#gymSets') ? Number(document.querySelector('#gymSets').value) : 0;
      const reps = document.querySelector('#gymReps') ? Number(document.querySelector('#gymReps').value) : 0;
      dbg('[Wellness] gym form submit: ' + name + ' | ' + sets + ' x ' + reps);
      if (!name) { toast('Please enter an exercise name.'); return; }
      const data = read();
      data.gym.logs = data.gym.logs || [];
      data.gym.logs.unshift({ exercise: name, sets: sets, reps: reps, date: todayKey() });
      if (data.gym.logs.length > 100) data.gym.logs.length = 100;
      write(data);
      event.target.reset();
      render();
      toast('Set added to your training log.');
    });
  } else {
    dbg('[Wellness] gymLogForm NOT found');
    console.warn('[Wellness] gymLogForm NOT found');
  }
  render();
}

function bootSwim() {
  let stroke = 'Freestyle';
  const render = () => {
    const logs = read().swim; const total = logs.reduce((sum, log) => sum + log.laps, 0);
    document.querySelector('#swimLaps').textContent = total;
    document.querySelector('#swimHistory').innerHTML = logs.length ? logs.slice(0, 4).map(log => `<div class="swim-row"><div><b>${esc(log.stroke)}</b><span> · ${log.date}</span></div><span>${log.laps} laps · ${log.minutes} min</span></div>`).join('') : `<p class="small-copy">Your first swim will appear here.</p>`;
  };
  document.querySelector('#strokeTabs').addEventListener('click', event => { const button = event.target.closest('[data-stroke]'); if (!button) return; stroke = button.dataset.stroke; document.querySelectorAll('.stroke-choice').forEach(choice => choice.classList.toggle('selected', choice === button)); });
  document.querySelector('#swimLogForm').addEventListener('submit', event => { event.preventDefault(); const data = read(); data.swim.unshift({ stroke, laps: Number(document.querySelector('#swimLapsInput').value), minutes: Number(document.querySelector('#swimMinutes').value), date: todayKey() }); write(data); event.target.reset(); render(); toast(`${stroke} session saved — beautiful work.`); });
  render();
}

function bootFocus() {
  const defaults = [{ text: 'Review chapter 4 notes', done: false }, { text: 'Finish practice questions', done: false }, { text: 'Plan tomorrow’s revision', done: false }];
  let seconds = 25 * 60, running = false, timer;
  const renderGoals = () => { const data = read(); if (!data.focus.goals.length) { data.focus.goals = defaults; write(data); } document.querySelector('#goalList').innerHTML = data.focus.goals.map((goal, index) => `<div class="goal ${goal.done ? 'done' : ''}"><button data-goal="${index}">${goal.done ? '✓' : ''}</button><span>${esc(goal.text)}</span><small>${goal.done ? 'Done' : 'Today'}</small></div>`).join(''); document.querySelector('#focusMinutes').textContent = `${data.focus.minutes} minutes`; };
  const renderTimer = () => { const mins = String(Math.floor(seconds / 60)).padStart(2, '0'); const secs = String(seconds % 60).padStart(2, '0'); document.querySelector('#timerDisplay').textContent = `${mins}:${secs}`; document.querySelector('#timerState').textContent = running ? 'STAY WITH IT' : seconds === 0 ? 'SESSION COMPLETE' : 'READY TO FOCUS'; const percent = ((1500 - seconds) / 1500) * 100; document.querySelector('#timerCircle').style.background = `conic-gradient(#7562aa 0 ${percent}%, rgba(117,98,170,.13) ${percent}% 100%)`; document.querySelector('#timerButton').textContent = running ? 'Pause session' : seconds === 0 ? 'Start again' : 'Start session'; };
  document.querySelector('#timerButton').addEventListener('click', () => { if (seconds === 0) seconds = 1500; running = !running; if (running) timer = setInterval(() => { seconds--; if (seconds <= 0) { clearInterval(timer); running = false; seconds = 0; const data = read(); data.focus.minutes += 25; write(data); renderGoals(); toast('Focus session complete. Your mind is stronger for it.'); } renderTimer(); }, 1000); else clearInterval(timer); renderTimer(); });
  document.querySelector('#timerReset').addEventListener('click', () => { clearInterval(timer); seconds = 1500; running = false; renderTimer(); });
  document.querySelector('#goalList').addEventListener('click', event => { const button = event.target.closest('[data-goal]'); if (!button) return; const data = read(); const goal = data.focus.goals[Number(button.dataset.goal)]; goal.done = !goal.done; write(data); renderGoals(); });
  document.querySelector('#goalForm').addEventListener('submit', event => { event.preventDefault(); const data = read(); data.focus.goals.push({ text: document.querySelector('#goalInput').value.trim(), done: false }); write(data); event.target.reset(); renderGoals(); toast('New focus goal added.'); });
  renderGoals(); renderTimer();
}

function bootInsights() {
  const data = read(); const completedGym = Object.values(data.gym.completed).filter(items => items.length).length; const laps = data.swim.reduce((sum, log) => sum + log.laps, 0); const focused = data.focus.minutes; let routine = 0;
  for (let offset = 0; offset < 7; offset++) { const day = new Date(); day.setDate(day.getDate() - offset); try { routine += JSON.parse(localStorage.getItem(`daylight:${todayKeyFor(day)}`) || '{}').completed?.length || 0; } catch (_) {} }
  document.querySelector('#routineMetric').textContent = routine; document.querySelector('#gymMetric').textContent = completedGym; document.querySelector('#swimMetric').textContent = laps; document.querySelector('#focusMetric').textContent = `${focused}m`;
  document.querySelector('#recapTitle').textContent = routine + completedGym + laps + focused ? 'A week in motion.' : 'Your first small win is waiting.';
  const values = [routine, completedGym * 3, Math.min(laps / 4, 9), Math.min(focused / 15, 9), 3, 5, 2]; const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']; document.querySelector('#insightBars').innerHTML = values.map((value, index) => `<div class="bar"><i style="height:${Math.max(10, value * 16)}px"></i><span>${labels[index]}</span></div>`).join('');
  const habits = [['☀','Daily rhythm',`${routine} routines done`], ['↗','Training',completedGym ? `${completedGym} active days` : 'Plan your first session'], ['≈','Swimming',laps ? `${laps} laps in the pool` : 'Choose a stroke to begin'], ['✦','Focus',focused ? `${focused} minutes protected` : 'Try one 25-minute session']]; document.querySelector('#habitList').innerHTML = habits.map(habit => `<div class="habit"><i>${habit[0]}</i><div><b>${habit[1]}</b><span>${habit[2]}</span></div><strong>›</strong></div>`).join('');
}
function todayKeyFor(date) { return date.toLocaleDateString('en-CA'); }

const page = document.body.dataset.page;
if (page === 'gym') bootGym();
if (page === 'swim') bootSwim();
if (page === 'focus') bootFocus();
if (page === 'insights') bootInsights();
