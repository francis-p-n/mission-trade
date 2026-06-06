# Mission Market — Detailed Game Spec and System Design

## 1. Purpose

Mission Market is a live, multiplayer simulation game for youth sessions. It is designed to be experienced on a projector, managed by a facilitator, and played from one student’s device per group.

The game is intentionally structured to create emotional tension around:

- Short-term gain versus long-term faithfulness
- Movement versus perseverance
- Visible results versus hidden growth

The gameplay should feel simple to students age 17. It should not require any knowledge of real stock trading. Students are only making choices between a few clearly named options.

The lesson is not that money is bad. The lesson is that people often chase immediate reward and lose patience with what matters most.

---

## 2. Experience Summary

### Three Views

**Presenter View**
- Shown on the main screen or projector
- Audience-facing
- Displays the live story of the game in a simple, dramatic way
- Does not expose hidden rigging details
- Uses beginner-friendly language only

**Admin View**
- Hidden facilitator dashboard
- Used to control the game flow
- Allows the facilitator to rig outcomes, trigger events, and adjust values
- Shows all internal data, including hidden targets and player behavior

**Mobile Player View**
- Opened by students on their phones
- Used to join the session and select a stock each round
- Designed to be minimal, fast, and easy to understand
- One choice per round

---

## 3. Core Game Concept

Each round, students choose where to place their Session Credits.

There are four investment paths:

1. **Stable Path** — low risk, steady return
2. **Popular Path** — driven by hype and group momentum
3. **Success Path** — high-risk, high-reward, flashy growth
4. **Foundation Path** — slow, unimpressive, but eventually rewarded heavily

The student experience should be:
- easy to understand
- emotionally engaging
- visibly competitive
- slightly unpredictable

The facilitator can rig the game so that the Foundation Path appears weak for most of the session, then spikes near the end.

That creates the intended lesson about patience and staying faithful when results are not immediate.

---

## 4. Audience Level and Messaging

The presenter-facing language should be intentionally simple and concrete.

Avoid terms like:
- volatility
- portfolio
- equities
- dividends
- market cap
- speculation

Use terms like:
- path
- credits
- growth
- risk
- steady
- sudden rise
- hold
- switch

A 17-year-old should understand the game in under one minute.

Example presenter language:
- “This path grows slowly but safely.”
- “This one looks exciting, but it changes a lot.”
- “This path has been quiet for a while.”
- “Someone just made a big move.”

---

## 5. Game Flow

### Session Setup
1. Facilitator creates a session.
2. System generates a short session code.
3. QR code is displayed on the presenter screen.
4. Students scan the QR code and join on their phones.
5. Facilitator starts the game when everyone is ready.

### Round Flow
1. New round opens.
2. Students choose one path.
3. Choices lock at the end of the timer.
4. The system calculates results.
5. Presenter view animates the change.
6. Leaderboard updates.
7. Next round begins.

### End Game
1. Final values are revealed.
2. Foundation Path spikes if the facilitator triggers it.
3. Leaderboard is shown.
4. Debrief begins.

---

## 6. Game Rules

### Starting State
- Every student begins with the same amount of Session Credits.
- Default starting amount: `100`
- Each player may choose only one path per round.
- A player may switch paths between rounds.
- All credits are assigned to the selected path.

### Round Length
- Recommended: `45–90 seconds`
- The timer should be visible in both Presenter and Player views.

### Choice Rules
- A student must choose one path before the round ends.
- If they do not choose, they remain on their previous selection, or the system can auto-assign a default path.
- No partial split investing unless that feature is added later.

### Scoring Rules
- Each path has a current value.
- The player’s credits are multiplied by the path’s current value growth for that round.
- The system should show only the simplified result to players.

---

## 7. Investment Paths

### Stable Path
**Description:**
“Steady. Predictable. Low drama.”

**Purpose in the lesson:**
Represents comfort and safety.

**Behavior:**
- Small increases most rounds
- Rare large changes
- Attractive to cautious players

---

### Popular Path
**Description:**
“Everyone is talking about it.”

**Purpose in the lesson:**
Represents approval, hype, and fear of missing out.

**Behavior:**
- Can rise when many students pick it
- Can collapse quickly if the crowd moves away
- Useful for showing how popularity can be unstable

---

### Success Path
**Description:**
“Big reward, big risk.”

**Purpose in the lesson:**
Represents ambition, validation, and visible achievement.

**Behavior:**
- Strong swings up or down
- Tempts students with the possibility of a fast lead
- Often looks attractive early on

---

### Foundation Path
**Description:**
“Looks quiet now. Could take time.”

**Purpose in the lesson:**
Represents faithfulness, perseverance, and long-term mission.

**Behavior:**
- Weak or boring for most of the game
- Can be rigged to surge near the end
- Should appear like a poor choice for several rounds so the final reveal feels meaningful

---

## 8. Presenter View Specification

The Presenter View is the public screen and should feel polished, dramatic, and easy to read from a distance.

### Main Objectives
- Show the game story clearly
- Make each round feel like an event
- Reveal changes in a memorable way
- Keep the text simple enough for the whole room

### Layout

#### Header
- Session title
- Current round number
- Countdown timer
- Session code or “Join via QR” indicator during onboarding

#### Center Area
Large cards for the four paths:
- Stable Path
- Popular Path
- Success Path
- Foundation Path

Each card should display:
- Path name
- Current value
- Trend arrow
- Simple label such as “Growing,” “Falling,” or “Unclear”

Avoid advanced financial charting. Use clean, game-like visuals.

#### Leaderboard Panel
Show the top players by total credits.

Display:
- Rank
- Player name
- Total credits

Keep it short. A top 5 is enough on the projector.

#### Event Feed
A small feed of live updates, for example:
- “Popular Path is attracting attention.”
- “Several players switched to Success Path.”
- “Foundation Path has stayed quiet.”
- “Big movement detected.”

### Presenter Tone
The presenter should sound like a game host, not a finance teacher.

Examples:
- “Round three is now live.”
- “The crowd is leaning toward Success Path.”
- “Foundation Path has been ignored again.”
- “Something unexpected is about to happen.”

---

## 9. Admin View Specification

The Admin View is a private control panel for the facilitator.

### Main Objectives
- Start and stop rounds
- Override outcomes
- Trigger special events
- Inspect player behavior
- Control the final reveal

### Admin Dashboard Sections

#### Session Control
- Create session
- Close session
- Start game
- Pause game
- End game
- Reset game

#### Round Control
- Start round
- Lock choices
- Resolve round
- Advance round
- Extend timer

#### Path Control
Each path should have editable fields:
- Current value
- Minimum change
- Maximum change
- Visibility setting
- Trend override

#### Event Control
Buttons for special events:
- Hype surge
- Market drop
- Stable boost
- Foundation surge
- Full reset

#### Rigging Controls
The admin can:
- Set a hidden target value
- Set round-by-round scripted values
- Override a path immediately
- Delay the Foundation Path spike until a chosen round
- Make a path appear weak even if its hidden target is high

### Hidden Data Visible to Admin Only
- Target values
- Predictive model output
- Player switch history
- Round-by-round planned movement
- Current hidden multipliers

### Admin Safety
Add a confirmation step for destructive actions such as:
- reset game
- delete session
- force final reveal

---

## 10. Mobile Player View Specification

The mobile view must be minimal and frictionless.

### Main Objectives
- Join quickly
- Understand choices immediately
- Make one tap per round
- Show personal progress clearly

### Join Screen
Students open the QR link and see:
- Session name
- Name entry field
- Join button

Optional:
- Display a short session code for manual entry if QR fails

### Lobby Screen
After joining, students see:
- Their display name
- Current Session Credits
- Waiting status
- Game start indicator

### Round Screen
Each round shows:
- The four paths as large buttons/cards
- A brief description for each
- Timer countdown
- Current credits
- Confirmation of current choice

### Choice Rules on Mobile
- One active choice at a time
- Tap to choose
- Tap again only if changing before lock
- Show a clear confirmation state such as “Selected”

### After Lock
Once the round closes:
- Choices become locked
- Screen changes to “Waiting for results”
- Results then animate in

---

## 11. Pricing and Forecast System

This game needs a way to suggest likely movement without exposing exact future values to students.

### Important Principle
Students should not see the hidden target values.

### What students see
- “Likely steady”
- “Looks strong”
- “Uncertain”
- “Sudden rise possible”
- “Weak for now”

### What the admin sees
- Hidden forecast values
- Planned next-round movement
- Probability ranges
- Expected spike timing

### Forecast Model
The system can generate forecast labels based on hidden data.

Example hidden values:
- current value
- target value
- volatility
- confidence score
- scheduled event flags

Example student-facing output:
- Stable Path: “steady”
- Popular Path: “crowd-driven”
- Success Path: “unpredictable”
- Foundation Path: “quiet for now”

### Recommendation
Do not show exact future prices to students. Show only simple labels or arrows.

---

## 12. QR Join Flow

The QR code should open a live session page.

### Flow
1. Facilitator creates a session.
2. System generates a short code, such as `K7F2`.
3. System generates a join URL.
4. The QR code points to that URL.
5. Students scan and join on mobile.
6. They enter a display name.
7. They are placed into the waiting lobby.

### Join URL Example
`/join/K7F2`

### QR Requirements
- Easy to scan from a projector
- Large enough for a room
- Regenerate if the session is reset

---

## 13. Recommended Tech Stack

The stack should support real-time updates, mobile access, and a live hosted database.

### Frontend
**Next.js**

Why:
- One codebase for all views
- Works for mobile and desktop
- Good routing for `/presenter`, `/admin`, `/join/[code]`, and `/play/[code]`
- Easy to deploy

### Styling
**Tailwind CSS**

Why:
- Fast UI development
- Easy responsive design
- Useful for presenter/mobile layout differences

### Database and Realtime
**Supabase**

Why:
- Hosted PostgreSQL database
- Realtime subscriptions
- Authentication if needed
- Good fit for live game state
- Easy to connect from web clients

### Hosting
**Vercel**

Why:
- Simple deployment for Next.js
- Fast preview builds
- Good for live event updates

### QR Code Generation
Use a server-side or client-side QR generation library.

### Optional Forecast Intelligence
A small internal prediction service can generate future path estimates.

This can be:
- rule-based
- random with constraints
- assisted by an AI model

The AI should only help with internal commentary or forecast labels. It should not expose hidden rigging data to students.

---

## 14. System Design

## 14.1 High-Level Architecture

```text
Student Phones  --->  Next.js Player UI  --->  Supabase
Presenter Screen --->  Next.js Presenter UI --->  Supabase
Admin Console    --->  Next.js Admin UI     --->  Supabase
```

All three interfaces read from and write to the same session state.

Supabase acts as the source of truth for:
- session data
- player data
- round state
- path values
- event history
- leaderboard values

---

## 14.2 Component Breakdown

### Client Applications
1. **Presenter App**
   - reads session state
   - subscribes to realtime changes
   - renders the public game screen

2. **Admin App**
   - writes overrides and events
   - controls rounds
   - updates hidden values

3. **Player App**
   - joins a session
   - sends choices
   - listens for round changes and results

### Backend Services
1. **Session Service**
   - creates sessions
   - stores session codes
   - manages session lifecycle

2. **Round Engine**
   - opens and closes rounds
   - calculates value changes
   - resolves player outcomes

3. **Forecast Engine**
   - produces visible trend labels
   - calculates hidden next-step estimates
   - supports rigged or scripted outcomes

4. **Event Engine**
   - triggers special moments such as Foundation Surge
   - applies path-specific modifiers

5. **Leaderboard Service**
   - calculates current rankings
   - updates credits after each round

---

## 14.3 Data Flow

### Join Flow
1. Admin creates a session.
2. Database stores session and code.
3. Presenter displays QR code.
4. Student scans and opens join page.
5. Player submits display name.
6. Player record is created.
7. Player is assigned to the session.

### Round Flow
1. Admin starts a round.
2. Round state changes to `open`.
3. Players submit path choices.
4. Choices are stored in the database.
5. Timer ends or admin locks choices.
6. Round engine calculates new values.
7. Path values update.
8. Credits update.
9. Presenter and players receive realtime updates.

### Reveal Flow
1. Updated values are written to the database.
2. Realtime updates notify all connected clients.
3. Presenter animates the new values.
4. Leaderboard refreshes.

---

## 14.4 Suggested Database Schema

### sessions
Stores each live game session.

Fields:
- `id`
- `session_code`
- `status` (`lobby`, `active`, `paused`, `ended`)
- `current_round`
- `created_at`
- `started_at`
- `ended_at`

### players
Stores each student.

Fields:
- `id`
- `session_id`
- `display_name`
- `credits`
- `current_path_id`
- `joined_at`
- `is_connected`

### paths
Stores the available options.

Fields:
- `id`
- `session_id`
- `name`
- `description`
- `current_value`
- `hidden_target_value`
- `visible_trend`
- `volatility`
- `is_locked`

### rounds
Stores each round.

Fields:
- `id`
- `session_id`
- `round_number`
- `status`
- `started_at`
- `locked_at`
- `resolved_at`

### choices
Stores each player choice.

Fields:
- `id`
- `session_id`
- `round_id`
- `player_id`
- `path_id`
- `created_at`

### events
Stores rigging and special events.

Fields:
- `id`
- `session_id`
- `event_type`
- `payload`
- `triggered_by`
- `triggered_at`

### leaderboard_snapshots
Stores historical ranking moments if needed.

Fields:
- `id`
- `session_id`
- `round_id`
- `player_id`
- `rank`
- `credits`
- `created_at`

---

## 14.5 Realtime Updates

Use realtime subscriptions so the screens update without refresh.

### Events to Broadcast
- session started
- round opened
- round closed
- player joined
- choice submitted
- values updated
- leaderboard updated
- special event triggered
- game ended

### Realtime Behavior
- Presenter screen updates automatically
- Player screens show lock state and results live
- Admin changes appear instantly across the system

---

## 14.6 Security and Access Control

### Presenter View
- Public view
- Read-only
- No secret controls

### Player View
- Public entry through QR or session code
- Can only create or update their own choice
- Cannot see hidden admin values

### Admin View
- Protected by password or login
- Can change values and trigger events
- Can see hidden forecast and rigging information

### Row-Level Protection
Use database rules so:
- players can only modify their own records
- presenter can only read public session state
- admin can access hidden fields

---

## 15. Prediction and Rigging Logic

The system should support both honest simulation and scripted outcomes.

### Three Modes

#### 1. Random Mode
- values change within defined ranges
- useful for general play

#### 2. Scripted Mode
- facilitator preloads a round-by-round path
- useful when the Foundation surge must happen at a specific moment

#### 3. Manual Override Mode
- facilitator directly sets a value
- useful for dramatic timing

### Foundation Surge Example
A scripted hidden plan might look like:
- Rounds 1–6: slow or negative movement
- Round 7: slightly better movement
- Round 8: major surge
- Round 9: final reveal and celebration

This gives the lesson a clear emotional arc.

---

## 16. UX Notes

### Presenter View UX
- Big text
- Big cards
- Minimal clutter
- Smooth animated transitions
- Clear leaderboard visibility

### Player View UX
- Thumb-friendly buttons
- Large tap targets
- Very few words per card
- Immediate confirmation after selection

### Admin View UX
- Dense, but organized
- Tabs or sections for control groups
- Clear “danger zone” styling for override actions
- Visible status indicators for each round

---

## 17. Reliability Considerations

Because this is a live youth event, the app should be resilient.

### Recommended Safeguards
- Keep a local fallback display in case of network lag
- Use automatic reconnection for mobile clients
- Cache the current session code in the browser
- Make the presenter view recover from refresh without losing state
- Add an emergency “resume session” control in admin

### Event Safety
- Test the entire flow before the session
- Have a backup device signed into admin
- Make sure the QR code can be re-shown at any time
- Provide a manual code-entry path in case scanning fails

---

## 18. Build Priorities

### Must Have
- Three views
- QR join flow
- Mobile investment selection
- Admin rigging controls
- Presenter leaderboard and round screen
- Realtime updates

### Should Have
- Hidden forecast system
- Foundation surge event
- Round timer
- Clear game reset flow
- Session code generation

### Nice to Have
- Sound effects
- Confetti on major reveal
- Animated cards
- Session history export
- Optional AI-generated presenter commentary

---

## 19. Suggested File Structure

```text
app/
  presenter/[code]/page.tsx
  admin/[code]/page.tsx
  join/[code]/page.tsx
  play/[code]/page.tsx
  api/
    sessions/
    rounds/
    choices/
    events/
components/
  PresenterBoard.tsx
  AdminPanel.tsx
  PlayerSelector.tsx
  Leaderboard.tsx
lib/
  supabase.ts
  session-engine.ts
  forecast-engine.ts
  round-engine.ts
  qr.ts
  types.ts
```

---

## 20. Final Teaching Intent

The game should not feel like a sermon disguised as a game. It should feel like a real competition first.

The lesson lands when students realize:
- they were impatient
- they were distracted by visible gains
- they abandoned the quiet path too early
- what looked weak at first became the strongest outcome later

That opens the door to a discussion about perseverance, calling, and faithfulness.



## Stocks to implement
1. Calling Stock -- this is the one we want to rig, give the admin options to skyrocket this one while crashing the other one
2. Popular Stock -- the one that everyone wants to choose, make it look like its rising
3. Wealth Stock -- the one that gives high returns, looks good but unstable
4. Stable Stock -- the one that is boring and stable
5. Unstable Stock -- the one that is random and unpredictable
6. Achievement Stock -- the one that soars


and make a few more seemingly random ones as well