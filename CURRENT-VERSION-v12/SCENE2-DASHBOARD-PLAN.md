# Scene 2: Dashboard - Cinematic Enhancement Plan

## Current State Analysis

The `DashboardSceneV5.js` (lines 1-532) already has a solid foundation:
- Dark glass-morphism UI with blur effects
- Browser chrome frame mockup
- Client Journey rail with 6 stages (Week 1 → Alumni)
- Flight Plan widget with 4 zones (Red → Green priority)
- House Health widget with animated score bars
- Basic animations (fade in, slide up, count-up numbers)

**Duration**: 30 seconds  
**Voiceover Script**: "Your dashboard shows your entire caseload at a glance. See who's in Week 1 needing extra support, who's approaching Day 14 assessments, and who's in active discharge prep. The Flight Plan organizes your day by urgency—red zone for overdue items, purple for discharge prep, yellow for today's tasks. No more mental gymnastics. Just clarity."

---

## Cinematic Enhancements

### 1. **Camera Work & Depth**

**Opening Shot:**
- Start with dashboard pulled back, angled (rotateX: 15deg, rotateY: -5deg, scale: 0.8)
- Slowly zoom in and straighten over 3s
- Creates "entering the command center" feel

**Parallax Layers:**
- Background: Deep space with subtle floating data particles (slowest)
- Midground: Dashboard frame (medium)
- Foreground: UI callouts and highlights (fastest, responsive to mouse)

### 2. **Ambient Environment**

**Data Particle Field:**
```javascript
// Floating hex/binary particles representing data
// Very subtle, desaturated teal glow
// Drift slowly upward like fireflies
```

**Holographic Glow:**
- Dashboard frame has subtle animated border glow
- Pulsing teal accent light from edges
- Creates "active command center" atmosphere

**Light Rays:**
- Subtle god rays emanating from behind dashboard
- 3-4 beams at different angles, very low opacity

### 3. **Dashboard Frame Enhancement**

**3D Presence:**
- Add subtle drop shadow that responds to perspective
- Border glow animation synced to voiceover emphasis points
- Reflective floor effect beneath (CSS gradient pseudo-element)

**Browser Chrome Polish:**
- Add realistic traffic light hover states
- URL bar has subtle typing animation on reveal
- Tab favicon glows teal

### 4. **Widget Animation Choreography**

**Timeline (synced to voiceover):**

| Time | Voiceover | Animation |
|------|-----------|-----------|
| 0.0s | Scene transition in | Dashboard zooms from far/angled to centered |
| 0.5s | "Your dashboard..." | Header fades in with typewriter effect |
| 1.5s | "entire caseload at a glance" | Client count animates from 0 → 12 with emphasis pulse |
| 3.0s | "See who's in Week 1" | Journey rail slides in, Week 1 stage glows |
| 5.0s | "Day 14 assessments" | Day 14-16 stage pulses RED with urgency |
| 7.0s | "active discharge prep" | Discharge stage glows PURPLE |
| 9.0s | "Flight Plan organizes" | Flight Plan widget rises in with cascade effect |
| 11.0s | "red zone for overdue" | Red zone flashes, icon pulses |
| 13.0s | "purple for discharge prep" | Purple zone highlights |
| 15.0s | "yellow for today's tasks" | Yellow zone highlights |
| 17.0s | "No more mental gymnastics" | All zones settle, brief calm |
| 20.0s | "Just clarity" | House Health widget fades in, scores animate |
| 24.0s | (end of voiceover) | Callout bubble appears with bounce |
| 27.0s | (hold) | Subtle ambient animations continue |
| 29.0s | Transition out | Dashboard pulls back, fades as Journey Scene emerges |

### 5. **Journey Stage Enhancements**

**Visual Polish:**
- Each stage has subtle inner glow matching its color
- On appearance: pop-in with slight overshoot
- Count numbers use "slot machine" rolling effect
- Stage labels have gradient text

**Critical Stage Treatment (Day 14-16):**
- Orange pulsing border animation
- Small warning icon appears
- Count has exclamation accent
- Subtle shake on emphasis

### 6. **Flight Zone Enhancements**

**Entry Animation:**
- Zones slide in from left with stagger
- Each zone has a "deployment" animation (expands from icon)
- Task preview text types in letter-by-letter

**Zone-Specific Effects:**
- Red zone: Subtle heartbeat pulse, emergency feel
- Purple zone: Elegant fade glow, transition feel
- Yellow zone: Soft warm glow, active feel
- Green zone: Calm breathing animation, steady feel

### 7. **House Health Widget**

**Score Bar Animation:**
- Fill with liquid/wave effect (CSS animation)
- Percentage counter counts up with ease-out
- Color shifts slightly as value increases (red → yellow → green gradient)

**Overall Score:**
- Large number has "digital display" appearance
- Pulses briefly on reveal
- Glow intensity matches score (brighter = higher)

### 8. **Interactive Callout Bubble**

**Appearance:**
- Bounces in from bottom-right
- Connected to dashboard with animated line
- Speech tail points to relevant widget

**Content:**
- "One glance. Everyone's status."
- Text types in with cursor blink

### 9. **Transition to Scene 3**

**Exit Animation:**
- Dashboard slowly rotates and scales down
- Ambient particles increase, draw toward center
- Color shifts from dark blue to slightly warmer (journey colors)
- Journey rail widget expands/zooms to become next scene

---

## Technical Implementation

### Key DOM Structure:
```html
<div class="dashboard-scene">
    <!-- Layer 0: Ambient background -->
    <div class="ambient-layer">
        <canvas class="data-particles"></canvas>
        <div class="light-rays"></div>
    </div>
    
    <!-- Layer 1: Dashboard frame -->
    <div class="dashboard-frame-layer">
        <div class="floor-reflection"></div>
        <div class="dashboard-frame">
            <!-- Browser chrome, widgets, etc. -->
        </div>
        <div class="frame-glow"></div>
    </div>
    
    <!-- Layer 2: Callouts/overlays -->
    <div class="callout-layer">
        <div class="callout-bubble"></div>
        <div class="highlight-cursor"></div>
    </div>
</div>
```

### GSAP Timeline Structure:
```javascript
build(tl, startTime, duration) {
    // Phase 1: Camera entrance (0-3s)
    tl.addLabel('entrance', startTime);
    
    // Phase 2: Dashboard reveal (3-9s)
    tl.addLabel('reveal', startTime + 3);
    
    // Phase 3: Feature highlights (9-20s)
    tl.addLabel('features', startTime + 9);
    
    // Phase 4: Summary & callout (20-27s)
    tl.addLabel('summary', startTime + 20);
    
    // Phase 5: Transition out (27-30s)
    tl.addLabel('exit', startTime + 27);
}
```

### Particle System (Canvas):
- 50-80 small particles
- Hex shapes or circles
- Teal/cyan color with low opacity
- Slow upward drift with slight horizontal wobble
- Fade in/out at edges

---

## Files to Modify

1. **`DashboardSceneV5.js`** - Complete scene overhaul
2. **`intro-clinical.js`** - Add mouse parallax event for dashboard
3. Potentially add a `DashboardParticles.js` helper for canvas animation

---

## Success Criteria

- [ ] Dashboard feels like a "command center" revelation
- [ ] Journey stages communicate timeline clearly
- [ ] Flight Plan zones communicate urgency hierarchy
- [ ] House Health shows aggregate wellness at a glance
- [ ] Animations are smooth 60fps
- [ ] Voiceover sync points hit accurately
- [ ] Transition to Scene 3 is seamless
- [ ] Mouse parallax response is subtle but noticeable





