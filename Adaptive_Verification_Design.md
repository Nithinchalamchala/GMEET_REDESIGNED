# Adaptive User Verification System (AUVS): A Post-CAPTCHA Design

Traditional CAPTCHAs severely violate **HCI principles** by demanding high cognitive load (squinting at distorted text) and failing accessibility standards (audio CAPTCHAs are notoriously error-prone). 

This document proposes a highly usable, inclusive, and adaptive **User Verification System** for the Google Meet redesign that completely overhauls the security-usability paradigm.

---

## 1. System Architecture: The "Invisible-First" Approach

The system operates on a **Risk-Based Adaptive Layering Model**. Verification should be completely invisible to 95% of users. Active challenges are only deployed when silent heuristics flag the user's risk profile.

### Layer 1: Silent Heuristics (Invisible)
**Goal**: Zero cognitive load.
*   **Mouse/Pointer Kinematics:** AI analyzes pointer trajectory. Humans swoop and hesitate (Fitts’s law curve); bots use linear, instant trajectories.
*   **Keystroke Dynamics:** Analyzing typing flight times (time between pressing keys) invisible in the background.
*   **Environment Check:** Headless browser detection, abnormal viewport sizes, and ultra-fast form completion times (under 300ms).

### Layer 2: Gamified Spatial Verification (Low Risk Flagged)
**Goal**: Minimal frustration, high accessibility.
If Layer 1 is unsure, the system deploys a **Spatial Drag-and-Drop**. 
*   **The UI Flow:** Instead of reading distorted text, the user is presented with a context-relevant action: *"Drag the microphone icon onto the podium to join."*
*   **HCI Justification (Low Cognitive Load):** Drag-and-drop utilizes spatial reasoning rather than phonetic/textual processing. It circumvents language barriers entirely and is intrinsically usable for neurodivergent populations (e.g., Dyslexia).

### Layer 3: Multi-Modal Accessibility Challenge (High Risk Flagged)
**Goal**: Error prevention and inclusivity.
If automated, bot-like behaviors persist, a robust but accessible terminal is opened.
*   **The UI Flow:** The user can select their preferred verification method: 
    *   **Visual:** "Point the arrow in the direction the object is facing" (rotation puzzle).
    *   **Audio (Semantic):** Instead of noisy distorted audio, semantically coherent prompts: *“Listen to this 3-second clip and type the color you hear.”*
    *   **Cognitive Logic:** *"What is 2 + 5?"* (Simple semantic math parsed seamlessly by screen readers).

---

## 2. UI Flows \& Interaction Design

### Flow A: The "Golden" Path (Legitimate User)
1. User lands on `dashboard.html`.
2. Types name and selects persona.
3. Clicks "Join Meeting".
4. **Behind the scenes:** System analyzes pointer math (`moveX, moveY` curves) and hardware capabilities. Score = 0.99 (Human).
5. **Result:** User enters directly into the meeting lobby. *Verification time: 0 seconds.*

### Flow B: The "Suspicious" Path (VPN / Automation Tools)
1. User Clicks "Join".
2. **Behind the scenes:** IP flagged as a known VPN, or cursor movements were injected via an automation script. Score = 0.45.
3. System triggers **Adaptive Challenge (Spatial)**.
4. **UI Change:** A small, aesthetically unified modal (using our Trust-Blue `#8ab4f8`) slides in: *"Security Check: Slide the key to the lock to securely enter your meeting."*
5. User slides the slider. The system measures the human imperfection in the drag.
6. **Result:** User validated. Modal turns Green (Success) and fades effortlessly. *Verification time: 2.5 seconds.*

---

## 3. HCI Principles Justification

### Low Cognitive Load \& Error Prevention
By making Layer 1 completely invisible, cognitive load is reduced to absolute zero. If a challenge is served, **Spatial Challenges** (Layer 2) reduce phonetic processing. Furthermore, slider/drag systems forgive minor tremors, aligning with **Error Prevention** (no "typos" like in legacy text CAPTCHAs).

### Security-Usability Balance
Instead of making the challenge universally hard (the legacy approach which punishes humans alongside bots), we make the **analytics hard**. The AI calculates security heuristically based on hundreds of micro-interactions. The user interface remains maximally usable, while the backend bears the security burden.

### Personalized Assistance \& Accessibility
If an assistive technology (like VoiceOver or NVDA) is detected interacting with the DOM, the system entirely skips visual spatial challenges. It immediately offers a highly accessible Semantic Logic challenge. This explicitly prevents screen-reader users from becoming "trapped" in visual-only verifications, respecting WCAG 2.1 compliance fundamentally.

### Adaptive Challenge Difficulty
The verification dynamically scales. A user trying to join 5 meetings in 30 seconds (spam behavior) will see progressively harder challenges. A first-time user sees nothing. This ensures legitimate users aren't punished for the behavior of anomalous actors.
