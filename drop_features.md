# Letter Queue Design: Slide-Fade Animation

## Overview
The slide-fade design implements a horizontal letter queue with smooth transition animations. When letters are used, they zoom into the grid with a two-stage animation (zoom to column top, then drop), while remaining letters slide left and new letters enter from the right.

## Visual Design

### Layout
- **Queue Container**: Horizontal flexbox layout with 4 letter boxes
- **Spacing**: 20px gap between each letter box
- **Dimensions**: Each letter box is 80x80 pixels
- **Container Height**: 120px to accommodate animations

### Letter Boxes
- **Shape**: Rounded rectangles (12px border-radius)
- **Background**: White
- **Font**: 48px bold, centered
- **Shadow**: Subtle drop shadow (0 4px 6px rgba(0,0,0,0.1))

### "Next Up" Letter (First in Queue)
- **Background Color**: Gold (#ffd700)
- **Scale**: 1.1x larger than other letters
- **Shadow**: Enhanced shadow (0 6px 12px rgba(0,0,0,0.2))
- **Purpose**: Visually indicates which letter is about to be used

### Color Scheme
- **Background**: Purple gradient (135deg, #667eea to #764ba2)
- **Letter boxes**: White
- **Next-up highlight**: Gold (#ffd700)
- **Grid cells (empty)**: Translucent white (rgba(255,255,255,0.2))
- **Grid cells (filled)**: Solid white

## Animation Behavior

### Letter Drop Sequence (Two-Stage Animation)

#### Stage 1: Zoom to Column Top (250ms)
1. **Floating Clone Creation**
   - Clone of next-up letter created at queue position
   - Fixed positioning for unrestricted movement
   - Gold background (#ffd700) matching next-up style
   
2. **Zoom Animation** (250ms, ease timing)
   - Translates from queue position to top of clicked column
   - Resizes from 80x80px to 70x70px (grid cell size)
   - Font size adjusts from 48px to 36px
   - Positions exactly aligned with top grid cell
   
#### Stage 2: Connect 4-Style Drop (600ms)
1. **Dropping Piece Creation**
   - Floating clone removed
   - New dropping piece created at top of column
   - Absolutely positioned within column container
   - Gold background maintained during drop
   
2. **Drop Animation** (600ms, cubic-bezier(0.4, 0.0, 0.2, 1))
   - Drops from top cell to lowest empty slot
   - Uses precise distance calculation based on cell positions
   - Smooth deceleration at bottom (cubic-bezier easing)
   
3. **Final Placement**
   - Dropping piece removed after animation
   - Target grid cell filled with letter
   - White background applied to filled cell
   - Cell marked as filled

### Queue Update Sequence

1. **Next-Up Letter Removal**
   - Letter immediately hidden (opacity: 0, no fade)
   - Removed from DOM instantly
   - Visual continuity maintained by floating clone
   
2. **Queue Shift** (500ms duration)
   - Remaining letters slide left into new positions
   - Second letter becomes new "next-up" (gold background + scale)
   - Uses ease timing function
   
3. **New Letter Entrance** (500ms duration)
   - Starts at 100px to the right (off-screen)
   - Starts at opacity 0
   - Slides into final position
   - Fades to opacity 1
   - Uses ease timing function

### Timing Summary
- **Floating clone zoom**: 250ms
- **Connect 4 drop**: 600ms (cubic-bezier for realistic physics)
- **Queue shift**: 500ms (ease)
- **New letter entrance**: 500ms (ease)
- **Total animation time**: ~850ms (zoom + drop, with queue updates concurrent)

## Interactive Elements

### Grid Columns
- **Click Target**: Entire column (5 cells + padding)
- **Hover Effect**: Translucent white background highlight
- **Full Column**: Cursor changes to not-allowed, no highlight
- **Shake Feedback**: Horizontal shake animation (300ms) when clicking full column

### Grid Cells
- **Dimensions**: 70x70 pixels
- **Empty State**: Translucent white background, white border
- **Filled State**: Solid white background, letter displayed
- **Layout**: Column-reverse flex (bottom-up filling like Connect 4)

## Technical Implementation

### Letter Cycling
- Letters cycle through A-Z alphabet
- After Z, cycles back to A
- Index tracked globally (`currentIndex`)

### CSS Classes
- `.letter-box`: Base styles for all letters
- `.next-up`: Applied to first letter in queue
- `.shifting`: Applied during exit (opacity: 0 only, no transform)
- `.entering`: Applied during entrance animation
- `.floating-letter`: Fixed-position clone for zoom animation
- `.dropping-letter`: Absolute-position piece for drop animation
- `.filled`: Applied to grid cells containing letters
- `.full`: Applied to columns at capacity
- `.shake`: Applied for error feedback animation

### Animation Lock
- `isAnimating` flag prevents concurrent animations
- Ensures queue integrity during multi-stage animation
- Released only after grid cell is filled and queue is updated

### Positioning Precision
- Grid container uses `position: relative`
- Grid columns use `position: relative`
- Floating clone uses `position: fixed` with `getBoundingClientRect()`
- Dropping piece uses `position: absolute` with offset calculations
- All positions calculated dynamically for pixel-perfect alignment

## User Experience

### Visual Feedback
- Clear indication of which letter is "next up"
- Smooth two-stage animation creates satisfying physics
- Connect 4-style drop feels natural and familiar
- Shake animation provides clear feedback for full columns
- Hover states indicate clickable columns

### Performance
- Uses CSS transforms (GPU-accelerated)
- Minimal DOM manipulation
- Hardware-accelerated transitions
- Efficient getBoundingClientRect() calculations
- No layout thrashing

### Accessibility Considerations
- Large, readable font size (48px in queue, 36px in grid)
- High contrast (white on colored backgrounds)
- Clear interactive targets (entire column clickable)
- Visual feedback for all interactions
- Cursor changes indicate interactivity

## Grid Implementation Details

### 5×5 Bottom Grid
- **Layout**: 5 columns, each with 5 cells
- **Fill Behavior**: Bottom-to-top (Connect 4 style)
- **Column Tracking**: Array tracking fill count per column (0-5)
- **Full Detection**: Column marked as full when fillCount reaches 5

### Drop Physics
- **Starting Position**: Top cell of clicked column
- **Ending Position**: Lowest empty cell in column
- **Distance Calculation**: Precise pixel measurements using `getBoundingClientRect()`
- **Easing**: `cubic-bezier(0.4, 0.0, 0.2, 1)` for realistic deceleration

### State Management
- `columnFills` array tracks number of filled cells per column
- Grid cells track state via `.filled` class
- Columns track state via `.full` class
- Animation lock prevents race conditions

## Files

### index.html
- Page structure with 4-letter queue
- 5×5 grid container with column-based layout
- Click handlers on columns (not individual cells)

### styles.css
- Purple gradient background
- Letter queue styling with transitions
- Grid cell and column styling
- Floating clone and dropping piece animations
- Hover states and feedback animations
- All transitions use CSS (no JavaScript-driven animations)

### script.js
- Queue management and letter cycling
- Two-stage drop animation orchestration
- Floating clone creation and positioning
- Dropping piece physics calculation
- Grid state tracking and updates
- Column click handlers with full-column detection
- Animation lock management