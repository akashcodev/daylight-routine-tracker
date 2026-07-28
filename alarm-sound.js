// alarm-sound.js
// Watches #alarmDialog and plays #alarmSound whenever it opens (i.e. whenever
// daily.js triggers the "time for your routine" popup), and stops the sound
// when the dialog closes — whether by Snooze, "I'm on it", or Esc.
// No changes to daily.js are needed: this works no matter how daily.js
// opens/closes the dialog (showModal(), close(), form submit, etc.).

(function () {
  const alarmDialog = document.getElementById('alarmDialog');
  const alarmSound = document.getElementById('alarmSound');

  if (!alarmDialog || !alarmSound) return;

  function handleDialogToggle() {
    if (alarmDialog.open) {
      alarmSound.currentTime = 0;
      alarmSound.play().catch((err) => {
        // Most browsers block audio until the user has interacted with the
        // page at least once (e.g. clicked "Add activity"). This just logs
        // it rather than throwing.
        console.log('Alarm sound could not autoplay yet:', err);
      });
    } else {
      alarmSound.pause();
      alarmSound.currentTime = 0;
    }
  }

  const observer = new MutationObserver(handleDialogToggle);
  observer.observe(alarmDialog, { attributes: true, attributeFilter: ['open'] });
})();
