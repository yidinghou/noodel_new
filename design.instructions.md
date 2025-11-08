# NOODEL Start Menu - Design Documentation

## 1. General Overview

### Layout Mechanics
The NOODEL start menu uses a **vertical flexbox layout** with three distinct sections arranged in a single column. The layout is centered on the page with a maximum width of 1400px and uses a 1:3:1 flex ratio to emphasize the game grid as the primary focus.

**Main Container Structure:**
- Uses `display: flex` with `flex-direction: column`
- 20px gap between sections
- Responsive scaling with max-width constraint
- Gradient background (green to blue diagonal)

### Three Main Components

#### 1. Card Div (Top Section)
**Purpose:** Branding and game controls  
**Flex Ratio:** 1  
**Contains:**
- Animated NOODEL title with individual letter blocks
- Start Game and Mute buttons
- Score and Letters Remaining statistics

#### 2. Game Grid (Middle Section)
**Purpose:** Interactive 7×6 game board  
**Flex Ratio:** 3 (largest section)  
**Contains:**
- 42 grid squares (7 columns × 6 rows)
- Dynamically generated via JavaScript
- Hover interactions for gameplay

#### 3. Made Words List (Bottom Section)
**Purpose:** Display words created during gameplay  
**Flex Ratio:** 1  
**Contains:**
- "Words Made" title header
- Scrollable list of word items
- Dynamic content populated via JavaScript

---

## 2. Specific Layouts

### 2.1 Card Div Element Specifics

**Container Properties:**
- Flex value of 1
- Semi-transparent white background using rgba(255, 255, 255, 0.95)
- Border radius of 20px
- Padding of 15px
- Box shadow with 20px vertical offset, 40px blur, and subtle black transparency

**Internal Structure:**
1. **Title Section (`.title`)**
   - Letter blocks displayed inline-block
   - Each letter: 30-38px square (responsive via clamp)
   - Individual animations with staggered delays
   - Rotation effects (-2deg odd, +2deg even)
   - After all letters land, instantly change all to green and trigger a shake animation (Wordle-style) for all letter blocks.

2. **Controls Section (`.controls`)**
   - Flexbox horizontal layout
   - 8px gap between buttons
   - Start button (flex: 2) and Mute button (flex: 1)
   - Fade-in animation at 3.4s

3. **Stats Section (`.stats`)**
   - Horizontal flexbox with space-around distribution
   - Two stat groups: Score and Letters Remaining
   - Light gray background (#f8f9fa)
   - Fade-in animation at 3.7s

**Letter Block Specifications:**
- Dimensions: `clamp(30px, 4vw, 38px)` square
- Font size: `clamp(16px, 2vw, 20px)`
- Colors: Initial gray (#888), transforms to green (#4CAF50)
- Border: 2px solid #333
- Border radius: 10px
- Box shadow: 0 4px 8px rgba(0,0,0,0.2)

### 2.2 Game Grid Specifics

**Wrapper Container:**
- Flex value of 3 (largest section)
- Semi-transparent white background using rgba(255, 255, 255, 0.95)
- Border radius of 20px
- Padding of 15px
- The wrapper must use `display: flex` and stretch the grid to fill all available vertical space. The grid must be large and responsive, filling the flex area. Avoid small grid sizing.
- Grid itself should have max-width of 900px and use flex: 1, width: 100%, height: 100% for full area usage.

**Grid Layout:**
- CSS Grid display with 7 columns and 6 rows using repeat()
- Each column and row uses 1fr for equal distribution
- 4px gap between grid cells
- Light gray background (#e8e8e8)
- 8px padding around grid
- Border radius of 12px
- The grid must fill the available space in the wrapper, using flex and width/height 100%. Grid squares must scale responsively and not be tiny.

**Grid Square Properties:**
- Aspect ratio: 1:1 (perfect squares)
- Background: Linear gradient (white to light gray)
- Border: 2px solid #ddd
- Border radius: 6px
- Hover state: Blue gradient with 1.05 scale transform

**JavaScript Generation:**
- 42 squares created dynamically
- Each square assigned unique animation delay
- Column-based delay algorithm for realistic drop physics
- Bottom row delays: Random 0.1s - 1.6s
- Upper rows: Progressively earlier to simulate stacking

### 2.3 Made Words List Specifics

**Container Properties:**
- Flex value of 1
- Semi-transparent white background using rgba(255, 255, 255, 0.95)
- Border radius of 20px
- Padding of 30px

**Title Styling:**
- Font size: 20px
- Bold font weight
- Dark gray color (#333)
- Center text alignment
- Margin bottom: 20px

**Words List Layout:**
- Flexbox display with column direction
- 10px gap between word items

**Word Item Styling:**
- Light gray background (#f8f9fa)
- Padding of 12px
- Border radius of 8px
- Left border: 4px solid green (#4CAF50) as accent
- Font weight of 500 (medium)

---

## 3. Animation

### Animation Timeline (Complete Sequence)

**Total Duration:** ~4 seconds

1. **Grid Squares Drop (0.1s - 1.6s)**
   - Random staggered delays per column
   - Drop from -500px with opacity fade-in
   - Duration: 0.4s ease-out per square

2. **Title Letter Blocks Drop (2.0s - 2.5s)**
   - Sequential 0.1s delays (N→O→O→D→E→L)
   - Drop from -300px with rotation
   - Duration: 0.6s ease-out per letter

3. **Letter Color Change & Shake (Instant after drop)**
   - As soon as all letters land, instantly change all letter blocks from gray to green
   - Immediately trigger a shake animation (Wordle-style) for all letter blocks
   - Shake duration: 0.4s

4. **Controls Fade In (2.5s)**
   - Buttons appear with vertical translation
   - Duration: 0.6s ease-out
   - Opacity: 0 → 1

5. **Stats Fade In (2.5s)**
   - Score and letters remaining appear
   - Duration: 0.6s ease-out
   - Opacity: 0 → 1

6. **Word Addition (2.5s)**
   - "NOODEL" added to words list
   - Timed after color change completes

### Keyframe Animations

**`@keyframes dropIn`**
- Purpose: Letter block vertical drop
- From: `translateY(-300px) rotate(-2deg)`
- To: `translateY(0) rotate(-2deg)`

**`@keyframes colorChange`**
- Purpose: Letter background transition
- From: Inherited gray (#888)
- To: Green (#4CAF50)

**`@keyframes fadeIn`**
- Purpose: Controls and stats appearance
- From: `opacity: 0, translateY(20px)`
- To: `opacity: 1, translateY(0)`

**`@keyframes gridSquareDrop`**
- Purpose: Grid square drop animation
- From: `translateY(-500px), opacity: 0`
- To: `translateY(0), opacity: 1`

### Animation Properties

**Letter Blocks:**
- Odd children: `rotate(-2deg)`
- Even children: `rotate(2deg)`
- Hover: `rotate(0) scale(1.1)`
- Chained animations: dropIn → colorChange

**Grid Squares:**
- Algorithm: Column-based random delays
- Physics simulation: Upper rows drop earlier
- Delay calculation: `columnDelay - (rows - 1 - row) * 0.1`

---

## 4. CSS Style and Conventions

### Color Palette

**Primary Colors:**
- Green: `#4CAF50` (letter blocks, accents)
- Blue: `#2196F3` (start button, gradient)
- Orange: `#FF9800` (mute button)

**Neutral Colors:**
- White: `rgba(255, 255, 255, 0.95)` (card backgrounds)
- Gray: `#888` (initial letter state), `#ddd` (borders)
- Light Gray: `#f8f9fa` (stats background, word items)
- Dark Gray: `#333` (text, borders)

**Gradients:**
- Background: `linear-gradient(135deg, #4CAF50 0%, #2196F3 100%)`
- Grid squares: `linear-gradient(145deg, #ffffff, #f5f5f5)`
- Hover: `linear-gradient(145deg, #e3f2fd, #bbdefb)`

### Typography

**Font Family:**
- Primary: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif

**Responsive Sizing with clamp():**
- Letter blocks: `clamp(16px, 2vw, 20px)`
- Buttons: `clamp(10px, 1.2vw, 12px)`
- Stat labels: `clamp(11px, 1.3vw, 12px)`
- Stat values: `clamp(14px, 2vw, 18px)`
- Word title: Fixed 20px

### Spacing Conventions

**Padding:**
- Card: 15px (compact)
- Game grid wrapper: 15px
- Made words: 30px (more breathing room)
- Stats section: 10px
- Word items: 12px

**Margins:**
- Title bottom: 10px
- Controls: 8px vertical
- Stats top: 8px
- Word title bottom: 20px

**Gaps:**
- Main container: 20px
- Controls buttons: 8px
- Grid squares: 4px
- Word list items: 10px

### Border and Shadow Standards

**Border Radius:**
- Cards/containers: 20px (large, modern)
- Letter blocks: 10px
- Stats section: 15px
- Grid squares: 6px
- Word items: 8px
- Buttons: 50px (pill shape)

**Box Shadows:**
- Cards: `0 20px 40px rgba(0,0,0,0.1)`
- Letter blocks: `0 4px 8px rgba(0,0,0,0.2)`
- Buttons: `0 4px 15px rgba(0,0,0,0.2)`

### Interactive States

**Hover Effects:**
- Buttons: `translateY(-2px)` lift
- Letter blocks: `rotate(0) scale(1.1)` straighten and grow
- Grid squares: Blue gradient + `scale(1.05)`

**Transitions:**
- Letter blocks: `transform 0.3s`
- Buttons: `transform 0.2s`
- Grid squares: `all 0.2s ease`

---

## 5. Step-by-Step Development Guide

### 5.1 Foundation Setup

**HTML Structure:**
1. Create basic HTML5 document with proper meta tags
2. Add main container div with class `main-container`
3. Set up three child divs: `card`, `game-grid-wrapper`, `made-words-container`

**Base Styling:**

Body element should have:
- Linear gradient background at 135deg angle from #4CAF50 to #2196F3
- Font family set to 'Segoe UI' with fallbacks
- Padding of 20px

Main container should have:
- Display set to flex
- Flex direction set to column
- Gap of 20px
- Max width of 1400px
- Margin set to 0 auto for centering

**Card Container:**
- Add white background with transparency
- Set border-radius: 20px
- Add box-shadow for depth
- Configure flex: 1

### 5.2 Title Section Implementation

**Letter Blocks:**
1. Create 6 div elements with class `letter-block`
2. Add letters N, O, O, D, E, L as text content
3. Style as inline-block with responsive sizing

**Letter Block Properties:**
- Display as inline-block
- Width and height using clamp(30px, 4vw, 38px) for responsive squares
- Initial background color #888 (gray)
- White text color
- Bold font weight
- Border: 2px solid #333
- Border radius: 10px

**Rotation Setup:**
- Odd children: transform rotate(-2deg)
- Even children: transform rotate(2deg)

### 5.3 Controls and Stats

**Button Structure:**

Create controls div containing:
- Start button with text "🎮 START GAME" and class "start-btn"
- Mute button with text "🔊" and class "mute-btn"

**Button Styling:**
- Use flexbox for horizontal layout
- Start button: flex value of 2 (wider)
- Mute button: flex value of 1 (narrower)
- Pill shape: border-radius of 50px
- Distinct colors per function

**Stats Layout:**

Create stats div with two stat groups:
- Each stat contains a label div and value div
- First stat shows "Score" with value "0"
- Second stat shows "Letters Remaining" with value "100"

### 5.4 Game Grid Implementation

**JavaScript Generation:**

In script section:
- Get reference to grid element by ID "gameGrid"
- Loop 42 times (7 columns × 6 rows)
- For each iteration create a new div element
- Set className to "grid-square"
- Append to gridElement

**Grid Styling:**

Grid container properties:
- Display set to grid
- Grid template columns: repeat(7, 1fr)
- Grid template rows: repeat(6, 1fr)
- Gap of 4px

Grid square properties:
- Aspect ratio of 1/1 for perfect squares
- Linear gradient background at 145deg from white to light gray
- Border: 2px solid #ddd
- Border radius: 6px

### 5.5 Animation Implementation

**Step 1: Define Keyframes**

Create four keyframe animations:

dropIn - transforms from translateY(-300px) rotate(-2deg) to translateY(0) rotate(-2deg)

colorChange - changes background to #4CAF50

fadeIn - transitions from opacity 0 with translateY(20px) to opacity 1 with translateY(0)

gridSquareDrop - transforms from translateY(-500px) opacity 0 to translateY(0) opacity 1

**Step 2: Apply Initial States**

Letter blocks:
- Initial transform: translateY(-300px) rotate(-2deg)
- Animation: dropIn with 0.6s ease-out, forwards fill mode

Controls and stats:
- Initial opacity: 0

Grid squares:
- Initial opacity: 0
- Animation: gridSquareDrop with 0.4s ease-out, forwards fill mode

**Step 3: Configure Delays**
- Letter blocks: Sequential 0.1s increments starting at 2.0s
- Chain color change after drop: delay at 2.9s
- Controls: 3.4s delay
- Stats: 3.7s delay

**Step 4: JavaScript Delay Generation**

Generate column-based random delays:
- Create array for column delays (7 columns)
- For each column, push random value between 0.1 and 1.6 seconds

Apply to grid squares with stacking logic:
- Loop through 6 rows and 7 columns
- Calculate cell index as row times 7 plus column
- If bottom row (row 5): use column delay directly
- If upper row: subtract (5 minus row) times 0.1 from column delay
- Set animation delay as inline style using Math.max to prevent negative values

### 5.6 Made Words Section

**HTML Structure:**

Create made-words-container div containing:
- Title div with class "made-words-title" and text "Words Made"
- Words list div with ID "wordsList" for dynamic content

**Styling:**

Words list properties:
- Display set to flex
- Flex direction set to column
- Gap of 10px between items

Word item properties:
- Background color #f8f9fa
- Padding of 12px
- Border radius of 8px
- Left border: 4px solid #4CAF50 for accent

**Dynamic Word Addition:**

Use setTimeout with 3200ms delay:
- Get reference to wordsList element
- Create new div element
- Set className to "word-item"
- Set innerHTML with strong tag for "NOODEL" and small tag for description
- Append to wordsList

---

## Development Timeline Summary

1. **Initial Wireframe** → Basic HTML structure with static layout
2. **Color Integration** → Applied green/blue color scheme
3. **Animation Addition** → Implemented drop-in letter animations
4. **Grid Addition** → Added interactive game board
5. **Grid Animation** → Random drop physics for squares
6. **Sequence Reorder** → Grid-first animation timeline
7. **Layout Restructure** → Vertical flexbox with three sections
8. **Size Optimization** → Compact card with responsive scaling
9. **Words Section** → Dynamic word list with styled items
10. **Final Polish** → Hover effects, shadows, and timing refinement

**Total Development Iterations:** 8 major versions (header_1 through header_4 with modifications)

---

## Technical Debt & Future Considerations

**Potential Improvements:**
- Add sound effects for animations
- Implement touch events for mobile interaction
- Add loading states for dynamic content
- Create difficulty level variations
- Implement score calculation logic
- Add localStorage for score persistence
- Create responsive breakpoints for tablet sizes
- Add dark mode support
- Implement WCAG AA accessibility standards fully

**Known Limitations:**
- No fallback for JavaScript-disabled browsers
- Animation performance may vary on low-end devices
- Words list doesn't have scroll behavior defined
- No error handling for dynamic content
