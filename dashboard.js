/* ============================================================
   Google Meet Next — Smart Dashboard Interactivity
   Psychology: Commitment, Reciprocity, Scarcity, Role Models
   ============================================================ */

const State = {
    role: null,
    captchaType: 'novel',
    captchaPassed: false,
    meetingType: 'instant',
    currentTip: 1
};

// Data models for Personas
const PersonaData = {
    student: {
        title: "Meeting Dashboard",
        welcome: "Welcome back, Anjani",
        badge: "Verified Student",
        spBanner: "<strong>Urgent:</strong> Prof. Sivaselvan requested your presence. <span class='social-proof-inline'>14 other students</span> are already waiting.",
        tips: [
            { icon: "🎤", title: "Pro Tip: Mute with Space", desc: "Press the spacebar to quickly mute/unmute. 3x faster than clicking!" },
            { icon: "📝", title: "Pro Tip: Take Notes In-Meeting", desc: "Click the Notes button to write & export meeting notes without leaving the call." },
            { icon: "🎯", title: "Pro Tip: Focus Mode", desc: "Use Focus Mode to dim distractions and highlight only the speaker. Great for lectures!" }
        ]
    },
    teacher: {
        title: "Educator Dashboard",
        welcome: "Good morning, Prof. Sivaselvan",
        badge: "Verified Educator",
        spBanner: "<strong>Action required:</strong> HCI Class starts soon. <span class='social-proof-inline'>84 students</span> are waiting for you.",
        tips: [
            { icon: "📊", title: "Pro Tip: Live Polls", desc: "Use Live Polls to check student understanding mid-lecture. It boosts engagement by 40%." },
            { icon: "👥", title: "Pro Tip: Breakout Rooms", desc: "Instantly shuffle students into small groups for discussions using the Breakout panel." },
            { icon: "⏱️", title: "Pro Tip: Break Reminders", desc: "Enable automated break reminders during long lectures to prevent student cognitive overload." }
        ]
    },
    professional: {
        title: "Workspace Dashboard",
        welcome: "Hello, Team Lead",
        badge: "Verified Professional",
        spBanner: "<strong>Next up:</strong> Client Sync in 5 mins. <span class='social-proof-inline'>3 colleagues</span> have already joined.",
        tips: [
            { icon: "🖼️", title: "Pro Tip: Virtual Backgrounds", desc: "Hide office clutter with our professional blur and gradient virtual backgrounds." },
            { icon: "📝", title: "Pro Tip: Auto-Export Notes", desc: "Take meeting minutes directly in the side panel and export immediately after the call." },
            { icon: "🎯", title: "Pro Tip: Focus Mode", desc: "Dim non-speaking participants to stay completely focused during important client presentations." }
        ]
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initInfiniteScroll();
    initTextCaptcha();
    initGridCaptcha();
    initDragCaptcha();
    startScarcityTimer();
});

// ============================
// 1. ROLE SELECTION (Commitment & Consistency)
// ============================
function selectRole(role) {
    State.role = role;
    
    // Update Persona Data
    const data = PersonaData[role];
    document.getElementById('dashboardTitle').textContent = data.title;
    document.getElementById('dashboardWelcome').textContent = data.welcome;
    document.getElementById('userBadgeText').textContent = data.badge;
    document.getElementById('bannerText').innerHTML = data.spBanner;
    
    // Update Onboarding Wizard
    document.getElementById('onboardingGreeting').textContent = `Welcome, ${role.charAt(0).toUpperCase() + role.slice(1)}!`;
    const icons = { student: '🎓', teacher: '👩‍🏫', professional: '💼' };
    document.getElementById('onboardingAvatar').textContent = icons[role];
    
    // Update Tips
    data.tips.forEach((tip, idx) => {
        const card = document.getElementById(`tip-${idx+1}`);
        card.querySelector('.tip-icon').textContent = tip.icon;
        card.querySelector('h4').textContent = tip.title;
        card.querySelector('p').textContent = tip.desc;
    });

    // Save role to localStorage so the meeting interface can read it
    localStorage.setItem('meet_persona', role);

    // Transition Screens
    document.getElementById('roleScreen').style.display = 'none';
    document.getElementById('onboardingScreen').style.display = 'flex';
}

// ============================
// 2. ONBOARDING WIZARD (Reciprocity)
// ============================
function nextOnboardingTip() {
    if (State.currentTip < 3) {
        document.getElementById(`tip-${State.currentTip}`).classList.remove('visible');
        document.querySelector(`.dot[data-tip="${State.currentTip}"]`).classList.remove('active');
        
        State.currentTip++;
        
        document.getElementById(`tip-${State.currentTip}`).classList.add('visible');
        document.querySelector(`.dot[data-tip="${State.currentTip}"]`).classList.add('active');
        
        if (State.currentTip === 3) {
            document.getElementById('onboardingNextBtn').textContent = "Go to Dashboard";
        }
    } else {
        skipOnboardingWizard();
    }
}

function skipOnboardingWizard() {
    document.getElementById('onboardingScreen').style.display = 'none';
    document.getElementById('dashboardMain').style.display = 'flex';
}

// ============================
// 3. SCARCITY TIMER
// ============================
function startScarcityTimer() {
    let timeLeft = 5 * 60; // 5 mins
    const timerEl = document.getElementById('timerValue');
    
    setInterval(() => {
        if (timeLeft <= 0) return;
        timeLeft--;
        const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        timerEl.textContent = `${m}:${s}`;
        
        if (timeLeft < 60) {
            document.querySelector('.scarcity-timer').style.animation = 'pulse 1s infinite';
        }
    }, 1000);
}

// ============================
// 4. LEGACY ABANDONMENT: SEGMENTED CONTROLS
// ============================
function setMeetingType(type) {
    State.meetingType = type;
    document.querySelectorAll('.segment').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

// ============================
// 5. LEGACY ABANDONMENT: PASSWORD MASKING
// ============================
function togglePasswordVisibility() {
    const input = document.getElementById('meetingPasscode');
    const toggleBtn = document.querySelector('.toggle-password');
    
    if (input.type === 'text') {
        input.type = 'password';
        toggleBtn.textContent = 'Show';
    } else {
        input.type = 'text';
        toggleBtn.textContent = 'Hide';
    }
}

// ============================
// 6. INFINITE SCROLL (Gestalt Continuity)
// ============================
function initInfiniteScroll() {
    const list = document.getElementById('pastMeetingsList');
    if (!list) return;

    function loadMeetings(count) {
        for(let i=0; i<count; i++) {
            const div = document.createElement('div');
            div.className = 'past-meeting-item';
            const date = new Date(Date.now() - Math.random() * 10000000000).toLocaleDateString();
            div.innerHTML = `<span>Meeting Record</span> <span class="pst-date">${date}</span>`;
            list.appendChild(div);
        }
    }
    
    loadMeetings(7);
    
    list.addEventListener('scroll', () => {
        if (list.scrollTop + list.clientHeight >= list.scrollHeight - 5) {
            document.getElementById('loadingSpinner').style.display = 'block';
            setTimeout(() => {
                loadMeetings(4);
                document.getElementById('loadingSpinner').style.display = 'none';
            }, 800);
        }
    });
}

// ============================
// 7. ADAPTIVE CAPTCHA SYSTEM (Heuristics & Spatial)
// ============================
let heuristicPassed = false;

function triggerSemanticChallenge() {
    document.getElementById('spatialChallenge').style.display = 'none';
    document.getElementById('semanticChallenge').style.display = 'block';
}

function verifySemantic() {
    const val = document.getElementById('semanticResponse').value;
    if (val == "7") {
        State.captchaPassed = true;
        showError("Semantic verification successful.", true);
        finalizeJoin();
    } else {
        showError("Incorrect answer. Please try again.");
    }
}

function initDragCaptcha() {
    const draggable = document.getElementById('userDraggable');
    const target = document.getElementById('meetingRoomTarget');
    
    if (!draggable || !target) return;

    draggable.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', 'user');
        setTimeout(() => draggable.style.opacity = '0.5', 0);
    });

    draggable.addEventListener('dragend', () => {
        draggable.style.opacity = '1';
    });

    target.addEventListener('dragover', e => {
        e.preventDefault();
        target.classList.add('drag-over');
    });

    target.addEventListener('dragleave', () => {
        target.classList.remove('drag-over');
    });

    target.addEventListener('drop', e => {
        e.preventDefault();
        target.classList.remove('drag-over');
        
        if (e.dataTransfer.getData('text/plain') === 'user') {
            target.innerHTML = '✅ Verified Human';
            target.classList.add('success');
            draggable.style.display = 'none';
            State.captchaPassed = true;
            showError("Authentication successful.", true);
            setTimeout(finalizeJoin, 600);
        }
    });
}

// ============================
// 8. VALIDATION & NAVIGATION
// ============================
function validateAndJoin() {
    const passcode = document.getElementById('meetingPasscode').value;
    const btn = document.getElementById('joinMeetingBtn');
    
    if (passcode.trim() === '') {
        showError("Passcode is required.");
        return;
    }

    if (State.captchaPassed) {
        finalizeJoin();
        return;
    }

    // Trigger Layer 1 Invisible Heuristics Simulated UI
    btn.style.display = 'none';
    document.getElementById('invisibleLayer').style.display = 'flex';
    document.getElementById('authErrorMsg').textContent = '';

    setTimeout(() => {
        document.getElementById('invisibleLayer').style.display = 'none';
        
        // Let's assume Student passes invisibly 50% of time for demo, but others require spatial verification
        if (State.role === 'student' && Math.random() > 0.5) {
            State.captchaPassed = true;
            finalizeJoin();
        } else {
            // Trigger Layer 2 Spatial Verification Challenge
            document.getElementById('spatialChallenge').style.display = 'block';
        }
    }, 1500);
}

function finalizeJoin() {
    // Commitment consistency check
    document.querySelector('.progress-step.active').classList.remove('active');
    document.querySelector('.progress-step:last-child').classList.add('completed');
    
    setTimeout(() => {
        window.location.href = "index.html"; 
    }, 500);
}

function showError(msg, isSuccess = false) {
    const errorEl = document.getElementById('authErrorMsg');
    errorEl.textContent = msg;
    errorEl.style.color = isSuccess ? 'var(--success-green)' : 'var(--urgency-red)';
}
