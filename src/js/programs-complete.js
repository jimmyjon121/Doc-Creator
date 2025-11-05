window.programsData = [];
localStorage.setItem('careconnect_programs', JSON.stringify(window.programsData));
console.log('[Programs] Loaded ' + window.programsData.length + ' programs');