# CareConnect Pro Onboarding System

## Overview

The CareConnect Pro Onboarding System is a comprehensive, interactive tutorial system that helps new clinicians quickly learn and master the platform. It combines an animated intro video with hands-on guided tours and optional practice mode.

## Features

### 1. Animated Intro Video (30-45 seconds)
- Problem visualization: Shows the pain of manual documentation
- Solution reveal: Introduces CareConnect's automation
- Impact demonstration: "45 minutes → 30 seconds"
- Smooth CSS/SVG animations with skip option

### 2. Interactive Guided Tour
- **Spotlight effects**: Highlights specific UI elements
- **Smart tooltips**: Context-aware positioning
- **Step-by-step guidance**: Covers all major features
- **Progress tracking**: Shows completion percentage
- **Keyboard navigation**: Arrow keys, Enter, Escape

Tour covers:
- Dashboard zones (Red/Yellow/Green)
- Client timeline interaction
- Bulk update functionality
- Document generation
- Discharge checklist
- House weather system
- Quick actions

### 3. Practice Mode (Optional)
- **Safe sandbox**: Uses sample data, doesn't affect real clients
- **Guided tasks**: Step-by-step instructions with validation
- **Achievement system**: Celebrates task completion
- **3 sample clients**: At different stages (Day 2, Day 15, Day 28)

### 4. Progress Management
- **Auto-resume**: Picks up where user left off
- **Skip option**: Can be skipped and replayed later
- **Completion tracking**: Stores progress in localStorage
- **Replay anytime**: From Settings menu or Ctrl+Shift+H

## File Structure

```
onboarding/
├── onboarding-manager.js      # Core state management and orchestration
├── onboarding-video.js         # Animated intro video component
├── onboarding-tour.js          # Interactive guided tour engine
├── onboarding-practice.js      # Practice mode with sample data
├── onboarding-content.js       # All text content and instructions
├── onboarding-styles.css       # Complete styling with animations
└── README.md                   # This file
```

## Integration

The onboarding system is automatically integrated into CareConnect Pro through:

1. **Build System**: `build-simple.js` copies onboarding files to dist
2. **Enhancement**: `enhancements/onboarding-integration.js` loads and initializes
3. **Auto-detection**: Launches automatically for new users
4. **Dashboard hook**: Triggers after successful login

## Usage

### For New Users
1. Create account and log in
2. Onboarding launches automatically
3. Watch intro video (skippable after 5 seconds)
4. Follow guided tour through features
5. Optionally complete practice tasks

### For Existing Users
- **Replay Tutorial**: Settings → Tutorial & Help
- **Keyboard Shortcut**: Ctrl+Shift+H (or Cmd+Shift+H on Mac)
- **Progress Badge**: Shows if onboarding incomplete

## State Management

Onboarding state is stored in `localStorage` with key `careconnect_onboarding`:

```javascript
{
    started: boolean,           // Has user started onboarding
    completed: boolean,         // Has user completed all steps
    skipped: boolean,          // Did user skip onboarding
    videoWatched: boolean,     // Video completion status
    tourCompleted: boolean,    // Tour completion status
    practiceCompleted: boolean, // Practice completion status
    currentStep: number,       // Current tour step index
    completedSteps: array,     // Array of completed step indices
    lastAccessed: string,      // ISO timestamp of last access
    version: string            // Onboarding version
}
```

## Customization

### Adding New Tour Steps

Edit `onboarding-content.js`:

```javascript
OnboardingContent.tour.steps.push({
    id: 'new-feature',
    target: '.feature-selector',
    title: 'New Feature',
    content: 'Description of the feature...',
    position: 'bottom',
    highlight: true,
    proTip: 'Optional pro tip here'
});
```

### Modifying Video Scenes

Edit `onboarding-content.js` video scenes:

```javascript
OnboardingContent.video.scenes.push({
    id: 'new-scene',
    duration: 8000,
    caption: 'Scene caption',
    narration: 'Scene narration text'
});
```

Then implement rendering in `onboarding-video.js`:

```javascript
case 'new-scene':
    this.renderNewScene(container);
    break;
```

### Styling Changes

All styles are in `onboarding-styles.css` with CSS variables for easy theming:

```css
:root {
    --onboarding-primary: #4ECDC4;
    --onboarding-secondary: #45B7D1;
    --onboarding-success: #6BCF7F;
    /* ... more variables */
}
```

## API Reference

### OnboardingManager

```javascript
// Initialize onboarding system
await window.onboardingManager.initialize();

// Start onboarding flow
await window.onboardingManager.start();

// Skip onboarding
window.onboardingManager.skip();

// Replay onboarding
window.onboardingManager.replay();

// Check if user is new
const isNew = window.onboardingManager.isNewUser();

// Get progress percentage
const progress = window.onboardingManager.getProgress();

// Reset onboarding (for testing)
window.onboardingManager.reset();
```

### OnboardingVideo

```javascript
// Play intro video
const video = new OnboardingVideo(manager);
await video.play();
```

### OnboardingTour

```javascript
// Start guided tour
const tour = new OnboardingTour(manager);
await tour.start();
```

### OnboardingPractice

```javascript
// Start practice mode
const practice = new OnboardingPractice(manager);
await practice.start();
```

## Events

The onboarding system doesn't emit custom events but integrates with existing CareConnect events:

- Hooks into login success
- Waits for dashboard load
- Responds to keyboard shortcuts

## Performance

- **Lazy loading**: Scripts load only when needed
- **Efficient animations**: CSS-based, GPU-accelerated
- **Minimal footprint**: ~50KB total (uncompressed)
- **No external dependencies**: Pure vanilla JavaScript

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## Accessibility

- **Keyboard navigation**: Full keyboard support
- **Screen reader friendly**: Semantic HTML
- **High contrast**: Readable colors
- **Focus indicators**: Clear focus states
- **Skip options**: Can skip any part

## Testing

### Manual Testing Checklist

- [ ] New user auto-launch works
- [ ] Video plays and can be skipped
- [ ] Tour highlights correct elements
- [ ] Tooltips position correctly
- [ ] Navigation buttons work
- [ ] Practice mode validates tasks
- [ ] Progress saves correctly
- [ ] Replay functionality works
- [ ] Keyboard shortcuts work
- [ ] Mobile responsive

### Reset for Testing

```javascript
// In browser console
window.onboardingManager.reset();
location.reload();
```

## Troubleshooting

### Onboarding doesn't launch
- Check if `isLoggedIn` in sessionStorage
- Verify dashboard is loaded
- Check browser console for errors
- Ensure onboarding files are in dist/onboarding/

### Tour highlights wrong element
- Update selector in `onboarding-content.js`
- Ensure element exists when tour reaches that step
- Check for dynamic content loading

### Styles not applying
- Verify `onboarding-styles.css` is loaded
- Check for CSS conflicts with main app
- Inspect element for applied styles

### State not persisting
- Check localStorage is enabled
- Verify `careconnect_onboarding` key exists
- Clear localStorage and retry

## Future Enhancements

Potential improvements for future versions:

1. **Analytics**: Track completion rates and drop-off points
2. **Contextual help**: In-app tooltips for specific features
3. **Video narration**: Add actual voice-over to video
4. **Multi-language**: Support for multiple languages
5. **Role-specific tours**: Different tours for Coaches vs Admins
6. **Interactive demos**: More hands-on practice scenarios
7. **Gamification**: Points, badges, leaderboards
8. **Feedback system**: Collect user feedback on onboarding

## Credits

Built for CareConnect Pro v12+
Designed for Family First Adolescent Services
Created: November 2025

## License

Proprietary - Family First Adolescent Services
Not for distribution outside the organization.

