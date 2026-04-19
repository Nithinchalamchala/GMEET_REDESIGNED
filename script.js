/* ============================================================
   Google Meet Redesign — HCI Interactive Prototype
   JavaScript — All Interactivity
   ============================================================ */

// ============================
// STATE MANAGEMENT
// ============================
const state = {
  isMuted: false,
  isVideoOn: true,
  isSharing: false,
  isHandRaised: false,
  isRecording: false,
  isCaptionsOn: false,
  currentView: 'grid',       // 'grid' | 'speaker'
  currentPanel: null,         // null | 'chat' | 'people'
  meetingStartTime: null,
  timerInterval: null,
  muteClickCount: 0,
  actionHistory: [],
  undoTimeout: null,
  pinnedParticipant: null,
  onboardingStep: 0,
  onboardingDismissed: false,
  networkQuality: 'good',    // 'good' | 'fair' | 'poor'
  chatMessages: [],
};

// ============================
// SVG ICON PATHS (for dynamic changes)
// ============================
const ICONS = {
  micOn: '<svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>',
  micOff: '<svg viewBox="0 0 24 24"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.55-.9l4.17 4.18L21 19.73 4.27 3z"/></svg>',
  videoOn: '<svg viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>',
  videoOff: '<svg viewBox="0 0 24 24"><path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/></svg>',
};

// ============================
// PRE-JOIN SYSTEM CHECK
// HCI: Error Prevention (Nielsen #5), System Status (Nielsen #1)
// ============================
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(runSystemCheck, 400);
});

function runSystemCheck() {
  const checks = [
    { id: 'checkMic', label: 'Microphone', result: 'Working', delay: 600 },
    { id: 'checkCamera', label: 'Camera', result: 'HD Ready', delay: 1000 },
    { id: 'checkSpeaker', label: 'Speaker', result: 'Working', delay: 1400 },
    { id: 'checkNetwork', label: 'Network', result: '12.4 Mbps', delay: 2000 },
  ];

  // Reset all to checking state
  checks.forEach(c => {
    const el = document.getElementById(c.id);
    const icon = el.querySelector('.check-icon');
    const status = el.querySelector('.check-status');
    icon.textContent = '';
    icon.className = 'check-icon checking';
    status.textContent = 'Checking...';
    status.className = 'check-status';
  });

  checks.forEach(c => {
    setTimeout(() => {
      const el = document.getElementById(c.id);
      const icon = el.querySelector('.check-icon');
      const status = el.querySelector('.check-status');

      icon.textContent = '✓';
      icon.className = 'check-icon success';
      status.textContent = c.result;
      status.className = 'check-status good';

      // Animate network bars for the network check
      if (c.id === 'checkNetwork') {
        const bars = document.querySelectorAll('#preNetworkBars .bar');
        bars.forEach(bar => bar.classList.add('active'));
      }
    }, c.delay);
  });
}

// ============================
// JOIN MEETING
// HCI: Mental Models (user expects transition), Closure (lobby → meeting)
// ============================
function joinMeeting() {
  const preJoin = document.getElementById('preJoinScreen');
  const meeting = document.getElementById('meetingScreen');

  preJoin.style.opacity = '0';
  preJoin.style.transition = 'opacity 0.3s';

  setTimeout(() => {
    preJoin.style.display = 'none';
    meeting.classList.add('active');
    meeting.style.opacity = '0';
    meeting.style.transition = 'opacity 0.3s';
    requestAnimationFrame(() => { meeting.style.opacity = '1'; });

    // Start meeting timer
    state.meetingStartTime = Date.now();
    state.timerInterval = setInterval(updateTimer, 1000);

    // Start network quality simulation
    startNetworkSimulation();

    // Show onboarding after 3 seconds
    if (!state.onboardingDismissed) {
      setTimeout(showOnboarding, 3000);
    }

    // Simulate a hand raise from Rahul after 15s
    setTimeout(() => {
      const rahulHand = document.getElementById('rahulHand');
      if (rahulHand) {
        rahulHand.classList.add('visible');
        showToast('Rahul K raised their hand', false);
      }
    }, 15000);
  }, 300);
}

function updateTimer() {
  if (!state.meetingStartTime) return;
  const elapsed = Math.floor((Date.now() - state.meetingStartTime) / 1000);
  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');
  const timerEl = document.getElementById('meetingTimer');
  if (timerEl) timerEl.textContent = `${mins}:${secs}`;
}

// ============================
// MUTE TOGGLE
// HCI: Shneiderman #3 (Feedback), Multi-modal feedback,
//      Nielsen #1 (Visibility of System Status)
// ============================
function toggleMute() {
  state.isMuted = !state.isMuted;
  state.muteClickCount++;

  const btn = document.getElementById('muteBtn');
  const icon = document.getElementById('muteIcon');
  const label = document.getElementById('muteLabel');
  const banner = document.getElementById('muteBanner');
  const localTile = document.getElementById('localTile');
  const localMicIcon = document.getElementById('localMicIcon');
  const pListMic = document.getElementById('pListLocalMic');

  if (state.isMuted) {
    btn.classList.add('active');
    icon.innerHTML = ICONS.micOff;
    label.textContent = 'Unmute';
    banner.classList.add('visible');
    localTile.classList.add('muted-tile');
    localMicIcon.classList.add('muted');
    localMicIcon.innerHTML = ICONS.micOff;
    if (pListMic) pListMic.classList.add('muted');
    addToHistory('mute', 'Microphone muted');
  } else {
    btn.classList.remove('active');
    icon.innerHTML = ICONS.micOn;
    label.textContent = 'Mic';
    banner.classList.remove('visible');
    localTile.classList.remove('muted-tile');
    localMicIcon.classList.remove('muted');
    localMicIcon.innerHTML = ICONS.micOn;
    if (pListMic) pListMic.classList.remove('muted');
    addToHistory('unmute', 'Microphone unmuted');
  }

  // Show contextual tip after 5 manual clicks — Law of Learning
  if (state.muteClickCount === 5 && !state.onboardingDismissed) {
    showContextTip('Mute faster with keyboard!', 'Press <kbd>Space</kbd> to quickly toggle mute instead of clicking the button.');
  }
}

// ============================
// VIDEO TOGGLE
// HCI: Shneiderman #3 (Feedback), Consistency (same pattern as mute)
// ============================
function toggleVideo() {
  state.isVideoOn = !state.isVideoOn;

  const btn = document.getElementById('videoBtn');
  const icon = document.getElementById('videoIcon');
  const label = document.getElementById('videoLabel');
  const localTile = document.getElementById('localTile');

  if (!state.isVideoOn) {
    btn.classList.add('active');
    icon.innerHTML = ICONS.videoOff;
    label.textContent = 'Start Video';
    if(localTile) localTile.classList.add('video-off');
    addToHistory('videoOff', 'Camera turned off');
    showToast('Camera turned off');
  } else {
    btn.classList.remove('active');
    icon.innerHTML = ICONS.videoOn;
    label.textContent = 'Camera';
    if(localTile) localTile.classList.remove('video-off');
    addToHistory('videoOn', 'Camera turned on');
    showToast('Camera turned on');
  }
}

// ============================
// SCREEN SHARE
// HCI: Feedback (Shneiderman #3), Mapping (Norman),
//      System Status, Screen Share Feedback
// ============================
function toggleScreenShare() {
  state.isSharing = !state.isSharing;

  const btn = document.getElementById('shareBtn');
  const label = document.getElementById('shareLabel');
  const banner = document.getElementById('screenShareBanner');
  const localTile = document.getElementById('localTile');
  const overlay = document.getElementById('localShareOverlay');

  if (state.isSharing) {
    btn.classList.add('active');
    label.textContent = 'Stop';
    banner.classList.add('visible');
    localTile.classList.add('screen-sharing');
    overlay.classList.add('visible');
    addToHistory('shareStart', 'Screen sharing started');
    showToast('You are now presenting to everyone');
  } else {
    btn.classList.remove('active');
    label.textContent = 'Present';
    banner.classList.remove('visible');
    localTile.classList.remove('screen-sharing');
    overlay.classList.remove('visible');
    addToHistory('shareStop', 'Screen sharing stopped');
    showToast('Presentation ended');
  }
}

// ============================
// REACTIONS
// HCI: Emotional Design (Norman), Learnability, Flexibility
// ============================
function toggleReactions() {
  const menu = document.getElementById('reactionsMenu');
  menu.classList.toggle('visible');
}

function sendReaction(emoji) {
  // Close menu
  document.getElementById('reactionsMenu').classList.remove('visible');

  // Create floating reaction animation
  const reaction = document.createElement('div');
  reaction.className = 'floating-reaction';
  reaction.textContent = emoji;
  reaction.style.left = (window.innerWidth / 2 - 16 + (Math.random() - 0.5) * 100) + 'px';
  reaction.style.bottom = '120px';
  document.body.appendChild(reaction);

  setTimeout(() => reaction.remove(), 2600);

  showToast(`You reacted with ${emoji}`, false);
}

// ============================
// HAND RAISE
// HCI: Recognition vs Recall, Visibility, Affordance
// ============================
function toggleHandRaise() {
  state.isHandRaised = !state.isHandRaised;

  const btn = document.getElementById('handBtn');
  const label = document.getElementById('handLabel');
  const handIcon = document.getElementById('localHandRaised');

  if (state.isHandRaised) {
    btn.classList.add('active');
    label.textContent = 'Lower';
    handIcon.classList.add('visible');
    addToHistory('handRaise', 'Hand raised');
    showToast('You raised your hand');
  } else {
    btn.classList.remove('active');
    label.textContent = 'Raise';
    handIcon.classList.remove('visible');
    addToHistory('handLower', 'Hand lowered');
    showToast('Hand lowered');
  }
}

// ============================
// CHAT PANEL
// HCI: Recognition vs Recall (Nielsen #6), Consistency, Learnability
// ============================
function toggleChat() {
  if (state.currentPanel === 'chat') {
    closePanel();
  } else {
    openPanel('chat');
  }
}

function togglePeople() {
  if (state.currentPanel === 'people') {
    closePanel();
  } else {
    openPanel('people');
  }
}

function openPanel(type) {
  const panel = document.getElementById('sidePanel');
  const chatPanel = document.getElementById('chatPanel');
  const peoplePanel = document.getElementById('participantsPanel');

  chatPanel.style.display = 'none';
  peoplePanel.style.display = 'none';

  if (type === 'chat') {
    chatPanel.style.display = 'flex';
  } else {
    peoplePanel.style.display = 'flex';
  }

  panel.classList.add('open');
  state.currentPanel = type;
}

function closePanel() {
  const panel = document.getElementById('sidePanel');
  panel.classList.remove('open');
  state.currentPanel = null;
}

function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;

  const msgContainer = document.getElementById('chatMessages');
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const msgHTML = `
    <div class="chat-message self">
      <div class="msg-header">
        <div class="msg-avatar avatar-color-0">AN</div>
        <span class="msg-name">You</span>
        <span class="msg-time">${time}</span>
      </div>
      <div class="msg-text">${escapeHtml(text)}</div>
    </div>
  `;

  msgContainer.insertAdjacentHTML('beforeend', msgHTML);
  input.value = '';
  msgContainer.scrollTop = msgContainer.scrollHeight;

  // Simulate reply after 2 seconds
  setTimeout(() => {
    const replies = [
      { name: 'Prof. Sivaselvan', initials: 'BS', color: 1, text: 'Good point! Let\'s discuss further.' },
      { name: 'Priya S', initials: 'PS', color: 3, text: 'I agree with that.' },
      { name: 'Rahul K', initials: 'RK', color: 2, text: '👍' },
    ];
    const reply = replies[Math.floor(Math.random() * replies.length)];
    const replyTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const replyHTML = `
      <div class="chat-message">
        <div class="msg-header">
          <div class="msg-avatar avatar-color-${reply.color}">${reply.initials}</div>
          <span class="msg-name">${reply.name}</span>
          <span class="msg-time">${replyTime}</span>
        </div>
        <div class="msg-text">${reply.text}</div>
      </div>
    `;
    msgContainer.insertAdjacentHTML('beforeend', replyHTML);
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }, 2000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Handle Enter key in chat input
document.addEventListener('DOMContentLoaded', () => {
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendChatMessage();
      }
    });
  }
});

// ============================
// MORE OPTIONS
// ============================
function toggleMore() {
  // Toggle recording as a demo
  state.isRecording = !state.isRecording;
  const badge = document.getElementById('recordingBadge');

  if (state.isRecording) {
    badge.classList.add('active');
    showToast('Recording started');
    addToHistory('recordStart', 'Recording started');
  } else {
    badge.classList.remove('active');
    showToast('Recording stopped');
    addToHistory('recordStop', 'Recording stopped');
  }
}

// ============================
// VIEW TOGGLE (Grid / Speaker)
// HCI: Flexibility, User Control (Nielsen #3)
// ============================
function setView(view) {
  state.currentView = view;
  const grid = document.getElementById('videoGrid');
  const gridBtn = document.getElementById('gridViewBtn');
  const speakerBtn = document.getElementById('speakerViewBtn');

  if (view === 'grid') {
    grid.className = 'video-grid grid-4';
    gridBtn.classList.add('active');
    speakerBtn.classList.remove('active');
  } else {
    grid.className = 'video-grid speaker-view';
    gridBtn.classList.remove('active');
    speakerBtn.classList.add('active');
  }
}

// ============================
// PIN PARTICIPANT
// HCI: User Control & Freedom (Nielsen #3), Flexibility
// ============================
function togglePin(participant) {
  const tiles = document.querySelectorAll('.video-tile');
  const pins = document.querySelectorAll('.tile-pin');

  if (state.pinnedParticipant === participant) {
    // Unpin
    state.pinnedParticipant = null;
    tiles.forEach(t => t.classList.remove('pinned'));
    pins.forEach(p => p.classList.remove('visible'));
    showToast('Unpinned');
  } else {
    // Unpin all first
    tiles.forEach(t => t.classList.remove('pinned'));
    pins.forEach(p => p.classList.remove('visible'));

    // Pin selected
    state.pinnedParticipant = participant;
    const tile = document.querySelector(`[data-participant="${participant}"]`);
    if (tile) {
      tile.classList.add('pinned');
      tile.querySelector('.tile-pin').classList.add('visible');
    }
    showToast(`Pinned ${participant === 'you' ? 'yourself' : participant}`);
  }
}

// ============================
// LEAVE MEETING
// HCI: Error Prevention (Nielsen #5), Shneiderman #4 (Closure),
//      Shneiderman #5 (Error Prevention), Asimov's Laws
// ============================
function attemptLeave() {
  document.getElementById('leaveModal').classList.add('visible');
}

function cancelLeave() {
  document.getElementById('leaveModal').classList.remove('visible');
}

function confirmLeave() {
  document.getElementById('leaveModal').classList.remove('visible');

  // Record final duration
  const elapsed = Math.floor((Date.now() - state.meetingStartTime) / 1000);
  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');
  document.getElementById('endDuration').textContent = `${mins}:${secs}`;

  // Stop timer
  clearInterval(state.timerInterval);

  // Transition to end screen
  const meeting = document.getElementById('meetingScreen');
  const endScreen = document.getElementById('meetingEndedScreen');

  meeting.style.opacity = '0';
  meeting.style.transition = 'opacity 0.3s';

  setTimeout(() => {
    meeting.classList.remove('active');
    meeting.style.opacity = '';
    endScreen.classList.add('active');
    endScreen.style.opacity = '0';
    endScreen.style.transition = 'opacity 0.3s';
    requestAnimationFrame(() => { endScreen.style.opacity = '1'; });
  }, 300);
}

function rejoinMeeting() {
  const endScreen = document.getElementById('meetingEndedScreen');
  const meeting = document.getElementById('meetingScreen');

  endScreen.classList.remove('active');
  meeting.classList.add('active');

  state.meetingStartTime = Date.now();
  state.timerInterval = setInterval(updateTimer, 1000);
}

function goHome() {
  const endScreen = document.getElementById('meetingEndedScreen');
  const preJoin = document.getElementById('preJoinScreen');

  endScreen.classList.remove('active');
  preJoin.style.display = '';
  preJoin.style.opacity = '1';

  // Reset state
  state.isMuted = false;
  state.isVideoOn = true;
  state.isSharing = false;
  state.isHandRaised = false;
  state.isRecording = false;
  state.meetingStartTime = null;

  runSystemCheck();
}

function rateMeeting(stars) {
  const buttons = document.querySelectorAll('.star-btn');
  buttons.forEach((btn, i) => {
    btn.classList.toggle('active', i < stars);
  });
  showToast(`Thanks for your ${stars}-star rating!`, false);
}

// ============================
// CAPTIONS TOGGLE
// HCI: Accessibility, Flexibility, Universal Design
// ============================
function toggleCaptions() {
  state.isCaptionsOn = !state.isCaptionsOn;
  const btn = document.getElementById('captionsBtn');

  if (state.isCaptionsOn) {
    btn.style.color = 'var(--blue-primary)';
    showToast('Live captions turned on', false);
  } else {
    btn.style.color = '';
    showToast('Live captions turned off', false);
  }
}

// ============================
// SETTINGS MODAL
// HCI: User Control (Nielsen #3), Flexibility, Tesler's Law
// ============================
function openSettings() {
  document.getElementById('settingsModal').classList.add('visible');
}

function closeSettings() {
  document.getElementById('settingsModal').classList.remove('visible');
}

function showSettingsTab(btn, tabName) {
  // Update nav buttons
  document.querySelectorAll('.settings-nav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // Show corresponding content
  document.querySelectorAll('.settings-tab-content').forEach(t => t.style.display = 'none');

  const tabMap = {
    audio: 'settingsAudio',
    video: 'settingsVideo',
    general: 'settingsGeneral',
    accessibility: 'settingsAccessibility',
  };

  const target = document.getElementById(tabMap[tabName]);
  if (target) target.style.display = 'block';
}

function toggleHighContrast(toggle) {
  toggle.classList.toggle('on');
  document.body.classList.toggle('high-contrast');
}

// ============================
// KEYBOARD SHORTCUTS
// HCI: Shneiderman #2 (Shortcuts), Nielsen #7 (Flexibility),
//      Recognition vs Recall, Law of Learning
// ============================
function openShortcuts() {
  document.getElementById('shortcutsModal').classList.add('visible');
}

function closeShortcuts() {
  document.getElementById('shortcutsModal').classList.remove('visible');
}

document.addEventListener('keydown', (e) => {
  // Don't trigger shortcuts when typing
  if (isTyping()) return;

  // Space: Toggle mute
  if (e.code === 'Space') {
    e.preventDefault();
    toggleMute();
  }

  // Ctrl + E: Toggle video
  if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
    e.preventDefault();
    toggleVideo();
  }

  // Ctrl + D: Toggle screen share
  if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
    e.preventDefault();
    toggleScreenShare();
  }

  // Ctrl + H: Toggle hand raise
  if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
    e.preventDefault();
    toggleHandRaise();
  }

  // Ctrl + Z: Undo
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    performUndo();
  }

  // Ctrl + G: Toggle grid/speaker view
  if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
    e.preventDefault();
    setView(state.currentView === 'grid' ? 'speaker' : 'grid');
  }

  // C: Toggle captions
  if (e.key === 'c') {
    toggleCaptions();
  }

  // Shift + ?: Open shortcuts
  if (e.key === '?' || (e.shiftKey && e.key === '/')) {
    e.preventDefault();
    openShortcuts();
  }

  // Escape: Close modals
  if (e.key === 'Escape') {
    closeShortcuts();
    closeSettings();
    cancelLeave();
    document.getElementById('reactionsMenu').classList.remove('visible');
  }
});

function isTyping() {
  const active = document.activeElement;
  return active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
}

// Shortcut search filter
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('shortcutSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      document.querySelectorAll('.shortcut-row').forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? 'flex' : 'none';
      });
    });
  }
});

// ============================
// TOAST / UNDO SYSTEM
// HCI: Shneiderman #6 (Easy Reversal), Nielsen #3 (User Control),
//      Error Recovery, Psychological Safety
// ============================
function addToHistory(action, description) {
  state.actionHistory.unshift({
    action,
    description,
    timestamp: Date.now(),
  });
  if (state.actionHistory.length > 10) state.actionHistory.pop();
}

function showToast(message, showUndo = true) {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toastMessage');
  const undoBtn = document.getElementById('toastUndo');
  const timerEl = document.getElementById('toastTimer');

  msgEl.textContent = message;
  undoBtn.style.display = showUndo ? 'inline-block' : 'none';
  toast.classList.add('visible');

  // Timer
  let timeLeft = 4;
  timerEl.textContent = showUndo ? `${timeLeft}s` : '';

  if (state.undoTimeout) clearTimeout(state.undoTimeout);

  const countdown = setInterval(() => {
    timeLeft--;
    if (timeLeft > 0 && showUndo) {
      timerEl.textContent = `${timeLeft}s`;
    } else {
      clearInterval(countdown);
      toast.classList.remove('visible');
    }
  }, 1000);

  state.undoTimeout = setTimeout(() => {
    toast.classList.remove('visible');
    clearInterval(countdown);
  }, 4000);
}

function performUndo() {
  if (state.actionHistory.length === 0) return;

  const last = state.actionHistory.shift();

  switch (last.action) {
    case 'mute':
    case 'unmute':
      toggleMute();
      break;
    case 'videoOn':
    case 'videoOff':
      toggleVideo();
      break;
    case 'shareStart':
    case 'shareStop':
      toggleScreenShare();
      break;
    case 'handRaise':
    case 'handLower':
      toggleHandRaise();
      break;
    case 'recordStart':
    case 'recordStop':
      toggleMore();
      break;
  }

  // Hide toast immediately
  document.getElementById('toast').classList.remove('visible');
}

// ============================
// NETWORK QUALITY SIMULATION
// HCI: System Status (Nielsen #1), Robustness, Error Prevention
// ============================
function startNetworkSimulation() {
  // Periodically change network quality to demonstrate the indicator
  setInterval(() => {
    const qualities = ['good', 'good', 'good', 'fair', 'good'];
    const quality = qualities[Math.floor(Math.random() * qualities.length)];
    updateNetworkIndicator(quality);
  }, 10000);
}

function updateNetworkIndicator(quality) {
  state.networkQuality = quality;
  const indicator = document.getElementById('networkIndicator');
  const label = document.getElementById('networkLabel');
  const bars = document.querySelectorAll('#headerNetworkBars .bar');

  indicator.className = `network-indicator ${quality}`;

  switch (quality) {
    case 'good':
      label.textContent = 'Good';
      bars.forEach(b => { b.className = 'bar active'; });
      break;
    case 'fair':
      label.textContent = 'Fair';
      bars.forEach((b, i) => {
        b.className = i < 3 ? 'bar warn' : 'bar';
      });
      showToast('Network quality decreased. Consider turning off camera.', false);
      break;
    case 'poor':
      label.textContent = 'Poor';
      bars.forEach((b, i) => {
        b.className = i < 1 ? 'bar bad' : 'bar';
      });
      break;
  }
}

function toggleNetworkDetails() {
  showToast(`Network: ${state.networkQuality === 'good' ? '12.4 Mbps (Excellent)' : state.networkQuality === 'fair' ? '2.1 Mbps (Fair)' : '0.4 Mbps (Poor)'}`, false);
}

// ============================
// ONBOARDING TOOLTIPS
// HCI: Learnability, Progressive Disclosure, Law of Learning,
//      Nielsen #10 (Help & Documentation)
// ============================
const onboardingSteps = [
  {
    title: 'Mute with keyboard',
    message: 'Press Space to quickly mute/unmute your microphone. Much faster than clicking!',
    target: '#muteBtn',
    position: 'top',
  },
  {
    title: 'Share your screen',
    message: 'Click Present or press Ctrl+D to share your screen with everyone in the meeting.',
    target: '#shareBtn',
    position: 'top',
  },
  {
    title: 'React to what you hear',
    message: 'Send reactions like 👍 ❤️ or 👏 without interrupting the speaker.',
    target: '#reactionsBtn',
    position: 'top',
  },
  {
    title: 'All keyboard shortcuts',
    message: 'Press Shift+? anytime to see all available keyboard shortcuts.',
    target: '.header-right',
    position: 'bottom',
  },
];

function showOnboarding() {
  if (state.onboardingDismissed || state.onboardingStep >= onboardingSteps.length) return;

  const step = onboardingSteps[state.onboardingStep];
  const tooltip = document.getElementById('onboardingTooltip');
  const titleEl = document.getElementById('tooltipTitle');
  const msgEl = document.getElementById('tooltipMessage');
  const progressEl = document.getElementById('tooltipProgress');
  const nextBtn = document.getElementById('tooltipNextBtn');

  titleEl.textContent = step.title;
  msgEl.textContent = step.message;
  progressEl.textContent = `${state.onboardingStep + 1} of ${onboardingSteps.length}`;
  nextBtn.textContent = state.onboardingStep === onboardingSteps.length - 1 ? 'Done' : 'Next';

  // Position tooltip near target element
  const target = document.querySelector(step.target);
  if (target) {
    const rect = target.getBoundingClientRect();

    tooltip.className = `onboarding-tooltip arrow-${step.position === 'top' ? 'bottom' : 'top'} visible`;

    if (step.position === 'top') {
      tooltip.style.bottom = `${window.innerHeight - rect.top + 12}px`;
      tooltip.style.top = 'auto';
    } else {
      tooltip.style.top = `${rect.bottom + 12}px`;
      tooltip.style.bottom = 'auto';
    }
    tooltip.style.left = `${Math.max(16, rect.left + rect.width / 2 - 140)}px`;
  }
}

function nextOnboardingStep() {
  state.onboardingStep++;
  const tooltip = document.getElementById('onboardingTooltip');

  if (state.onboardingStep >= onboardingSteps.length) {
    tooltip.classList.remove('visible');
    state.onboardingDismissed = true;
    return;
  }

  tooltip.classList.remove('visible');
  setTimeout(showOnboarding, 200);
}

function skipOnboarding() {
  state.onboardingDismissed = true;
  document.getElementById('onboardingTooltip').classList.remove('visible');
}

// ============================
// CONTEXTUAL TIP
// HCI: Learnability, Power Law of Practice
// ============================
function showContextTip(title, body) {
  document.getElementById('ctxTipTitle').textContent = title;
  document.getElementById('ctxTipBody').innerHTML = body;
  document.getElementById('contextTip').classList.add('visible');

  setTimeout(dismissContextTip, 12000);
}

function dismissContextTip() {
  document.getElementById('contextTip').classList.remove('visible');
}

// ============================
// CLOSE MODALS ON OVERLAY CLICK
// HCI: Error Prevention, User Control
// ============================
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('visible');
  }

  // Close reactions menu when clicking outside
  if (!e.target.closest('#reactionsBtn') && !e.target.closest('#reactionsMenu')) {
    document.getElementById('reactionsMenu')?.classList.remove('visible');
  }
});

// ============================
// CONSOLE LOG (for prototype info)
// ============================
console.log('%c🎓 Google Meet Redesign — HCI Interactive Prototype', 'font-size:16px;font-weight:bold;color:#8ab4f8;');
console.log('%cCS23B1102 — Anjani Nithin', 'font-size:12px;color:#9aa0a6;');
console.log('%c─────────────────────────────────', 'color:#3c4043;');
console.log('%cHCI Concepts Implemented:', 'font-weight:bold;color:#81c995;');
console.log(' ✓ Shneiderman\'s 8 Golden Rules');
console.log(' ✓ Nielsen\'s 10 Usability Heuristics');
console.log(' ✓ Fitts\'s Law (button sizing & placement)');
console.log(' ✓ Hick\'s Law (reduced choices)');
console.log(' ✓ Miller\'s Law (7±2 chunking)');
console.log(' ✓ Pareto 80/20 (Vital Few)');
console.log(' ✓ Tesler\'s Law (managed complexity)');
console.log(' ✓ Gestalt Laws (proximity, similarity, closure)');
console.log(' ✓ Primacy/Recency Effect');
console.log(' ✓ Serial Position Effect');
console.log(' ✓ Inverted Pyramid');
console.log(' ✓ Mental Models & Learnability');
console.log(' ✓ Flexibility & Robustness');
console.log(' ✓ Asimov\'s Laws (error prevention)');
console.log(' ✓ Emotional Design (Norman)');
console.log('%c─────────────────────────────────', 'color:#3c4043;');
console.log('%cInteractive Features:', 'font-weight:bold;color:#f28b82;');
console.log(' 🎤 Mute with multi-modal feedback');
console.log(' 📹 Camera toggle');
console.log(' 🖥️ Screen share with presenter view');
console.log(' 💬 Live chat panel');
console.log(' 👥 Participants panel');
console.log(' 👍 Reactions (floating animations)');
console.log(' ✋ Hand raise');
console.log(' ⏺️ Recording indicator');
console.log(' 📊 Network quality indicator');
console.log(' ⌨️ Keyboard shortcuts');
console.log(' ↩️ Undo system (Ctrl+Z)');
console.log(' 📌 Pin participant');
console.log(' 🔲 Grid/Speaker view toggle');
console.log(' 💡 Onboarding tooltips');
console.log(' ♿ Accessibility features');
console.log(' ⭐ Meeting feedback (closure)');

// ==========================================
// END-SEMESTER HCI UPGRADES
// ==========================================

// 1. Anti-Fatigue (Mirror Anxiety) Mode
function toggleSelfView() {
    const localTile = document.getElementById('localTile');
    const pip = document.getElementById('pipSelfStatus');
    
    if (!localTile) return;

    if (localTile.classList.contains('collapsed-self-view')) {
        // Expand
        localTile.classList.remove('collapsed-self-view');
        pip.classList.remove('active');
        showToast('Self-view expanded');
        addToHistory('System', 'Self-view expanded');
    } else {
        // Collapse
        localTile.classList.add('collapsed-self-view');
        pip.classList.add('active');
        // Update PIP mic status to match current logic
        document.getElementById('pipMicIcon').style.color = state.isMuted ? 'var(--red-solid)' : 'var(--text-primary)';
        document.getElementById('pipMicIcon').innerHTML = state.isMuted ? '🔇' : '🎙️';
        showToast('Self-view collapsed to reduce fatigue');
        addToHistory('System', 'Self-view collapsed');
    }
}

// 2. Command Palette (Nielsen #10: Help / Expert Accel)
document.addEventListener('keydown', (e) => {
    // Cmd+K or Ctrl+K
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openCommandPalette();
    }
    // Escape to close
    if (e.key === 'Escape') {
        closeCommandPalette();
    }
});

function openCommandPalette() {
    document.getElementById('commandPaletteOverlay').classList.add('active');
    document.getElementById('cmdInput').focus();
}

function closeCommandPalette() {
    document.getElementById('commandPaletteOverlay').classList.remove('active');
}

function executeCommand(cmd) {
    closeCommandPalette();
    switch(cmd) {
        case 'mute':
            toggleMute();
            break;
        case 'video':
            toggleVideo();
            break;
        case 'share':
            toggleShare();
            break;
        case 'help':
            showToast('Help Documentation opened in new tab.');
            break;
    }
}

// Filter logic for command palette
const cmdInput = document.getElementById('cmdInput');
if (cmdInput) {
    cmdInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('.cmd-item').forEach(item => {
            const txt = item.textContent.toLowerCase();
            item.style.display = txt.includes(term) ? 'flex' : 'none';
        });
    });
}

// 3. Proactive Error Assistance (Screen Share Rapid Click)
let shareClickCount = 0;
let shareClickTimer;

const originalShareBtn = document.getElementById('shareBtn');
if (originalShareBtn) {
    originalShareBtn.addEventListener('click', () => {
        shareClickCount++;
        clearTimeout(shareClickTimer);
        if (shareClickCount >= 3) {
            shareClickCount = 0;
            showContextTip('Struggling to present?', 'Make sure you click the actual thumbnail of the screen you want to share in the browser popup.', originalShareBtn);
        }
        shareClickTimer = setTimeout(() => { shareClickCount = 0; }, 2000);
    });
}

// ==========================================
// FEATURE EXTENSIONS — NEW HCI FEATURES
// ==========================================

// ============================
// MORE MENU (Dropdown)
// ============================
function toggleMoreMenu() {
  const menu = document.getElementById('moreMenu');
  menu.classList.toggle('visible');
}

function closeMoreMenu() {
  document.getElementById('moreMenu').classList.remove('visible');
}

// Close more menu when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('#moreBtn') && !e.target.closest('#moreMenu')) {
    closeMoreMenu();
  }
});

// ============================
// FEATURE 1: BREAKOUT ROOMS
// HCI: Information Architecture, Direct Manipulation (Norman),
//      Gestalt Grouping, Hick's Law, User Control (Nielsen #3)
// ============================
function openBreakoutRooms() {
  document.getElementById('breakoutModal').classList.add('visible');
}

function closeBreakoutRooms() {
  document.getElementById('breakoutModal').classList.remove('visible');
}

function setBreakoutCount(count, btn) {
  document.querySelectorAll('.breakout-preset').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const participants = [
    { name: 'You', initials: 'AN', color: 0 },
    { name: 'Prof. Sivaselvan', initials: 'BS', color: 1 },
    { name: 'Rahul K', initials: 'RK', color: 2 },
    { name: 'Priya S', initials: 'PS', color: 3 },
  ];

  const roomColors = ['🟢', '🔵', '🟡', '🟣'];
  const list = document.getElementById('breakoutRoomsList');
  list.innerHTML = '';

  // Distribute participants into rooms (round-robin for simplicity)
  const rooms = Array.from({ length: count }, () => []);
  participants.forEach((p, i) => rooms[i % count].push(p));

  rooms.forEach((room, i) => {
    const card = document.createElement('div');
    card.className = 'breakout-room-card';
    card.innerHTML = `
      <div class="room-header">
        <span class="room-name">${roomColors[i]} Room ${i + 1}</span>
        <span class="room-count">${room.length} participant${room.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="room-participants">
        ${room.map(p => `
          <div class="room-participant">
            <div class="p-avatar avatar-color-${p.color}" style="width:28px;height:28px;font-size:11px;">${p.initials}</div>
            <span>${p.name}</span>
          </div>
        `).join('')}
      </div>
    `;
    list.appendChild(card);
  });
}

function setBreakoutDuration(mins, btn) {
  document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function startBreakoutRooms() {
  closeBreakoutRooms();
  showToast('Breakout rooms opened! Participants are being moved.', false);
  addToHistory('breakoutStart', 'Breakout rooms started');
}

function shuffleBreakoutRooms() {
  // Re-trigger the current count with shuffled participants
  const activePreset = document.querySelector('.breakout-preset.active');
  if (activePreset) {
    const count = parseInt(activePreset.textContent);
    setBreakoutCount(count, activePreset);
    showToast('Participants shuffled!', false);
  }
}

// ============================
// FEATURE 2: LIVE POLLS
// HCI: Progressive Disclosure, Feedback (Shneiderman #3),
//      Recognition vs Recall (Nielsen #6), Emotional Design,
//      Closure (Shneiderman #4)
// ============================
function openPoll() {
  document.getElementById('pollsModal').classList.add('visible');
  document.getElementById('pollCreateView').style.display = 'block';
  document.getElementById('pollResultsView').style.display = 'none';
}

function closePoll() {
  document.getElementById('pollsModal').classList.remove('visible');
}

function launchPoll() {
  const questionEl = document.getElementById('pollQuestion');
  const optionInputs = document.querySelectorAll('#pollOptionsList input');
  const question = questionEl.value || 'Poll Question';
  const options = Array.from(optionInputs).map(inp => inp.value || 'Option');

  // Switch to results view
  document.getElementById('pollCreateView').style.display = 'none';
  document.getElementById('pollResultsView').style.display = 'block';

  // Set question
  document.getElementById('pollResultQuestion').textContent = question;

  // Simulate votes with random distribution
  const totalVotes = 4;
  const votes = options.map(() => Math.floor(Math.random() * 3) + 1);
  const voteSum = votes.reduce((a, b) => a + b, 0);
  const percentages = votes.map(v => Math.round((v / voteSum) * 100));

  const colorClasses = ['option-a', 'option-b', 'option-c', 'option-d'];
  const barsContainer = document.getElementById('pollResultsBars');
  barsContainer.innerHTML = '';

  options.forEach((opt, i) => {
    const item = document.createElement('div');
    item.className = 'poll-result-item';
    item.innerHTML = `
      <div class="poll-result-label">
        <span>${opt}</span>
        <span>${percentages[i]}%</span>
      </div>
      <div class="poll-result-bar-bg">
        <div class="poll-result-bar-fill ${colorClasses[i]}" style="width: 0%"></div>
      </div>
    `;
    barsContainer.appendChild(item);
  });

  // Animate bars after a brief delay (progressive disclosure)
  setTimeout(() => {
    document.querySelectorAll('.poll-result-bar-fill').forEach((bar, i) => {
      bar.style.width = `${percentages[i]}%`;
    });
  }, 200);

  document.getElementById('pollVoteCount').textContent = `${totalVotes} votes`;
  document.getElementById('pollTimeLeft').textContent = 'Results';

  showToast('📊 Poll launched! Collecting votes...', false);
  addToHistory('pollLaunch', 'Poll launched');
}

// ============================
// FEATURE 3: VIRTUAL BACKGROUND
// HCI: Recognition vs Recall, Direct Manipulation,
//      Affordance (Norman), Aesthetic-Usability Effect
// ============================
function openBgPicker() {
  document.getElementById('bgModal').classList.add('visible');
}

function closeBgPicker() {
  document.getElementById('bgModal').classList.remove('visible');
}

function setBgEffect(effect, btn) {
  // Clear active states from effects
  document.querySelectorAll('.bg-effect-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.bg-tile').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // Apply to local tile
  applyBackground(effect);
}

function setBgVirtual(bgName, btn) {
  // Clear active states
  document.querySelectorAll('.bg-effect-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.bg-tile').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  applyBackground(bgName);
}

function applyBackground(bgName) {
  const localTile = document.getElementById('localTile');
  if (!localTile) return;

  // Remove all bg- classes
  const classes = [...localTile.classList].filter(c => c.startsWith('bg-'));
  classes.forEach(c => localTile.classList.remove(c));

  if (bgName === 'none') {
    localTile.classList.remove('bg-applied');
    showToast('Background removed', false);
  } else {
    localTile.classList.add('bg-applied', `bg-${bgName}`);
    showToast(`Background "${bgName.replace(/-/g, ' ')}" applied`, false);
  }
}

// ============================
// FEATURE 4: MEETING NOTES
// HCI: Shneiderman #4 (Closure), External Memory Aid (Miller's Law),
//      Flexibility (Nielsen #7), Consistency
// ============================
function toggleNotes() {
  if (state.currentPanel === 'notes') {
    closePanel();
  } else {
    openPanel('notes');
  }
}

// Patch the existing openPanel to handle notes
const _originalOpenPanel = openPanel;
openPanel = function(type) {
  const panel = document.getElementById('sidePanel');
  const chatPanel = document.getElementById('chatPanel');
  const peoplePanel = document.getElementById('participantsPanel');
  const notesPanel = document.getElementById('notesPanelInner');

  chatPanel.style.display = 'none';
  peoplePanel.style.display = 'none';
  if (notesPanel) notesPanel.style.display = 'none';

  if (type === 'chat') {
    chatPanel.style.display = 'flex';
  } else if (type === 'people') {
    peoplePanel.style.display = 'flex';
  } else if (type === 'notes') {
    if (notesPanel) notesPanel.style.display = 'flex';
  }

  panel.classList.add('open');
  state.currentPanel = type;
};

function formatNote(type) {
  if (type === 'bold') {
    document.execCommand('bold');
  } else if (type === 'italic') {
    document.execCommand('italic');
  } else if (type === 'bullet') {
    document.execCommand('insertUnorderedList');
  }
}

function exportNotes() {
  const content = document.getElementById('notesContent');
  if (!content) return;
  const text = content.innerText;
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'meeting-notes.txt';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Notes exported!', false);
}

// Word count updater
document.addEventListener('DOMContentLoaded', () => {
  const notesContent = document.getElementById('notesContent');
  const wordCountEl = document.getElementById('notesWordCount');
  if (notesContent && wordCountEl) {
    const updateWordCount = () => {
      const text = notesContent.innerText.trim();
      const words = text ? text.split(/\s+/).length : 0;
      wordCountEl.textContent = `${words} word${words !== 1 ? 's' : ''}`;
    };
    notesContent.addEventListener('input', updateWordCount);
    updateWordCount();
  }
});

// ============================
// FEATURE 5: FOCUS MODE
// HCI: Attention Management, Signal-to-Noise Ratio,
//      Selective Attention, User Control (Nielsen #3), Tesler's Law
// ============================
state.isFocusMode = false;

function toggleFocusMode() {
  state.isFocusMode = !state.isFocusMode;
  const indicator = document.getElementById('focusModeIndicator');

  if (state.isFocusMode) {
    document.body.classList.add('focus-mode');
    indicator.classList.add('visible');
    showToast('Focus Mode ON — Only active speaker highlighted', false);
    addToHistory('focusOn', 'Focus mode activated');

    // Close side panel to reduce distractions
    closePanel();
  } else {
    document.body.classList.remove('focus-mode');
    indicator.classList.remove('visible');
    showToast('Focus Mode OFF', false);
    addToHistory('focusOff', 'Focus mode deactivated');
  }
}

// ============================
// FEATURE 6: BREAK REMINDER
// HCI: Persuasive Design (Fogg's Model), User Welfare,
//      Error Prevention (fatigue = errors), Nudge Theory,
//      Ethical Design
// ============================
state.breakReminderDismissed = false;
state.breakReminderTimeout = null;

const wellnessTips = [
  'Try the 20-20-20 rule: Every 20 min, look at something 20 feet away for 20 seconds.',
  'Stand up and stretch for 30 seconds — your posture will thank you!',
  'Hydrate! Grab a glass of water during your break.',
  'Take 3 deep breaths to reset your focus before continuing.',
  'Look away from the screen and blink 20 times to reduce eye strain.',
];

function scheduleBreakReminder(delayMs) {
  if (state.breakReminderTimeout) clearTimeout(state.breakReminderTimeout);

  // For demo purposes: show after 2 minutes instead of 45 (configurable)
  // In production this would be 45 * 60 * 1000
  const delay = delayMs || 120000; // 2 minutes for demo

  state.breakReminderTimeout = setTimeout(() => {
    if (!state.breakReminderDismissed) {
      showBreakReminder();
    }
  }, delay);
}

function showBreakReminder() {
  const reminder = document.getElementById('breakReminder');
  const tipEl = document.getElementById('wellnessTip');
  const durationEl = document.getElementById('breakDuration');

  // Calculate actual meeting duration
  if (state.meetingStartTime) {
    const elapsed = Math.floor((Date.now() - state.meetingStartTime) / 1000 / 60);
    durationEl.textContent = `${elapsed} minute${elapsed !== 1 ? 's' : ''}`;
  }

  // Random wellness tip
  tipEl.textContent = wellnessTips[Math.floor(Math.random() * wellnessTips.length)];

  reminder.classList.add('visible');
}

function dismissBreakReminder() {
  document.getElementById('breakReminder').classList.remove('visible');
  state.breakReminderDismissed = true;
  showToast('Break reminder dismissed. Stay healthy! 💪', false);
}

function snoozeBreakReminder() {
  document.getElementById('breakReminder').classList.remove('visible');
  showToast('Break reminder snoozed for 15 minutes', false);
  // Schedule again in 15 mins (use 60s for demo)
  scheduleBreakReminder(60000);
}

// Schedule break reminder when meeting starts
const _originalJoinMeeting = joinMeeting;
joinMeeting = function() {
  _originalJoinMeeting();
  // Schedule break reminder
  scheduleBreakReminder();
};

// ============================
// UPDATED UNDO for new features
// ============================
const _originalPerformUndo = performUndo;
performUndo = function() {
  if (state.actionHistory.length === 0) return;
  const last = state.actionHistory[0];

  switch (last.action) {
    case 'focusOn':
    case 'focusOff':
      toggleFocusMode();
      state.actionHistory.shift();
      document.getElementById('toast').classList.remove('visible');
      return;
    case 'breakoutStart':
      state.actionHistory.shift();
      showToast('Breakout rooms cancelled');
      document.getElementById('toast').classList.remove('visible');
      return;
  }

  _originalPerformUndo();
};

// Add keyboard shortcut for Focus Mode (Ctrl+F)
document.addEventListener('keydown', (e) => {
  if (isTyping()) return;

  // Ctrl+Shift+F: Toggle Focus Mode
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
    e.preventDefault();
    toggleFocusMode();
  }

  // Ctrl+Shift+N: Toggle Notes
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
    e.preventDefault();
    toggleNotes();
  }
});

// Update console log with new features
console.log('%c─── NEW HCI EXTENSIONS ───', 'color:#8ab4f8;font-weight:bold;');
console.log(' 🏠 Breakout Rooms (Information Architecture, Gestalt)');
console.log(' 📊 Live Polls (Progressive Disclosure, Closure)');
console.log(' 🖼️ Virtual Backgrounds (Recognition vs Recall, Affordance)');
console.log(' 📝 Meeting Notes (External Memory Aid, Flexibility)');
console.log(' 🎯 Focus Mode (Attention Management, Tesler\'s Law)');
console.log(' ☕ Break Reminder (Persuasive Design, Nudge Theory)');

// ============================
// MEETING ASSISTANT (Liking & Reciprocity)
// ============================
let assistantMuted = false;
setTimeout(() => {
  const assistant = document.getElementById('meetingAssistant');
  if (assistant && !state.isMuted) {
    assistant.style.display = 'flex';
  }
}, 45000); // Popup after 45s if they haven't muted

function closeAssistant() {
  document.getElementById('meetingAssistant').style.display = 'none';
  assistantMuted = true;
  showToast('Got it. I\'ll stay out of your way.', false);
}

// ============================
// BREATHING EXERCISE OVERLAY 
// ============================
let breathingTimer;
function startBreathing() {
  const overlay = document.getElementById('breathingOverlay');
  const text = document.getElementById('breathingText');
  if(overlay) overlay.style.display = 'flex';
  
  let phase = 0;
  breathingTimer = setInterval(() => {
    phase = (phase + 1) % 2;
    text.textContent = phase === 0 ? 'Breathe In...' : 'Breathe Out...';
  }, 4000); // 4 seconds in, 4 seconds out
}

function stopBreathing() {
  clearInterval(breathingTimer);
  document.getElementById('breathingOverlay').style.display = 'none';
}

// Show breathing exercise after 60s demo trigger
setTimeout(() => {
  if (localStorage.getItem('meet_persona') === 'student') {
    startBreathing();
    // Auto stop after 16s (2 cycles)
    setTimeout(stopBreathing, 16000);
  }
}, 60000); 

// ============================
// PREMIUM TOAST TRIGGERS (Scarcity & Authority)
// ============================
setTimeout(() => {
  const toast = document.getElementById('premiumToast');
  if (toast && localStorage.getItem('meet_persona') === 'teacher') {
    toast.style.display = 'flex';
    setTimeout(() => { toast.style.display = 'none'; }, 10000); // Auto hide
  }
}, 25000); 

// ============================
// POST-MEETING GAMIFICATION & SUMMARY
// ============================
// Override confirmLeave to show post-meeting modal instead of end screen directly
const _originalConfirmLeave = confirmLeave;
confirmLeave = function() {
  document.getElementById('leaveModal').classList.remove('visible');
  
  // Stop timer
  clearInterval(state.timerInterval);
  
  const meeting = document.getElementById('meetingScreen');
  const summaryModal = document.getElementById('postMeetingModal');
  
  // Custom logic for streaks based on role
  const role = localStorage.getItem('meet_persona') || 'student';
  const roleStreaks = { student: '4 🔥', teacher: '12 🔥', professional: '24 🔥' };
  document.getElementById('pmStreak').textContent = roleStreaks[role];
  
  meeting.style.opacity = '0';
  meeting.style.transition = 'opacity 0.3s';
  
  setTimeout(() => {
    meeting.classList.remove('active');
    meeting.style.opacity = '';
    
    // Show summary modal
    if(summaryModal) {
      summaryModal.style.display = 'flex';
    } else {
      // Fallback
      _originalConfirmLeave();
    }
  }, 300);
}

/* ============================================================
   PHASE III ACCESSIBILITY LOGIC
   ============================================================ */

window.toggleMotorAssist = function() {
    document.body.classList.toggle('motor-assist-active');
    if(document.body.classList.contains('motor-assist-active')){
        if(typeof window.showMeetingAssistant === 'function') {
            window.showMeetingAssistant("Motor-Assist Enabled: Click targets are enlarged by 150%.", "tip");
        }
    }
};

window.toggleHighContrast = function() {
    document.body.classList.toggle('high-contrast-active');
    if(document.body.classList.contains('high-contrast-active')){
        if(typeof window.showMeetingAssistant === 'function') {
            window.showMeetingAssistant("High-Contrast Mode Enabled for maximum visibility.", "tip");
        }
    }
};

// Global Keyboard Access Listener (WCAG 2.1 Focus compliance)
document.addEventListener('keydown', function(event) {
    // Prevent triggering if user is typing in a chat box or input
    const tag = event.target.tagName.toLowerCase();
    if(tag === 'input' || tag === 'textarea') return;

    switch(event.code) {
        case 'Space':
            event.preventDefault(); // Prevent scrolling down
            if(typeof toggleMic === 'function') toggleMic();
            break;
        case 'KeyC':
        case 'KeyV':
            if(typeof toggleVideo === 'function') toggleVideo();
            break;
        case 'KeyR':
            if(typeof toggleHandRaise === 'function') toggleHandRaise();
            break;
    }
});

