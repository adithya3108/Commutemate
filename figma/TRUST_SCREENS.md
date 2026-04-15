# CommuteMate — Trust System Screens (v1.1)

Four new screens added to the Figma file for the trust and safety layer.

---

## Why trust is the product

Before anyone will share a ride with a stranger, three questions must be answered:

1. **Who is this person?** — are they real, verified, not random?
2. **Are they safe?** — has the community vouched for them?
3. **Am I comfortable?** — do they match my personal safety preferences?

All four screens below exist to answer these questions before, during, and after every ride.

---

## Page 3 additions — 4 new screens

Add these after the existing 4 screens. Label the Figma section: `🔒 Trust system`.

---

## Screen 5: Work email verification + IT park tagging

**When shown:** First time the user opens the app. Onboarding step 1 of 3.  
**Goal:** Verify this is a real IT professional and tag their workplace.

### Layout

```
┌─────────────────────────────────┐
│ Shield icon (40px, teal-50 bg)  │ centered
│ "Join CommuteMate"              │ 14px, weight 500, centered
│ "Only verified IT professionals"│ 10px, text-secondary, centered
├─────────────────────────────────┤
│ ┌──── WORK EMAIL CARD ────────┐ │
│ │ Work email                  │ 10px label, text-secondary
│ │ [priya@zoho.com         ]   │ input, bg-secondary, 12px
│ │ ✓ Zoho · verified company   │ 10px, green-600, weight 500
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ ┌──── TRUST NOTICE ───────────┐ │ bg: green-50
│ │ 🛡 Only IT professionals    │
│ │   We verify every email.    │
│ │   Personal emails not       │
│ │   accepted.                 │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ your it park                    │ section label
├─────────────────────────────────┤
│ ┌──── IT PARK SELECTOR ───────┐ │
│ │ [Zoho Campus ✓]             │ selected: teal-50, teal border
│ │ [RMZ Millenia, Perungudi]   │ unselected: bg-secondary
│ │ [SP Infocity, Sholingan.]   │ unselected: bg-secondary
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ [Continue →]                    │ primary button, full width
└─────────────────────────────────┘
```

### Key design decisions
- The ✓ verified indicator appears dynamically after email entry — reassures user their company is recognised
- IT park is shown as a radio-style selector (not a dropdown) — fewer taps, clearer
- If company domain is not in the verified list, show: "We'll verify your email shortly" (still allowed in, just flagged as unverified tier)
- Personal email domains (gmail, yahoo, hotmail etc.) show: "Please use your work email" in red — never allowed

### Verified badge component
- Background: `green-50` (#EAF3DE)
- Text: `green-600` (#3B6D11), weight 500, 10px
- Shield icon: 8×8px, green-600 stroke
- Pill style: radius-sm, padding 2px 7px

---

## Screen 6: Gender and safety preferences

**When shown:** Onboarding step 2 of 3.  
**Goal:** Let users set who they're comfortable commuting with. Handled with dignity — no judgment, complete privacy.

### Layout

```
┌─────────────────────────────────┐
│ "Safety preferences"            │ 13px, weight 500
│ "These help us match you..."    │ 10px, text-secondary
├─────────────────────────────────┤
│ i identify as                   │ section label
│ [Woman ✓] [Man] [Other]         │ 3-column radio
├─────────────────────────────────┤
│ i prefer to commute with        │ section label
│ ┌──── WOMEN ONLY (selected) ──┐ │ pink-50 bg, pink border 1.5px
│ │ Women only               ✓  │ pink-600 text
│ │ Only matched with women     │ 9px, pink-400
│ └─────────────────────────────┘ │
│ ┌──── ANYONE VERIFIED ────────┐ │ bg-secondary, default border
│ │ Anyone verified             │ text-primary
│ │ Any verified IT professional│ 9px, text-secondary
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ ┌──── PRIVACY NOTE ───────────┐ │ pink-50 bg
│ │ 🛡 Your preference is       │
│ │   private. Others only see  │
│ │   that a preference is set. │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ your home area                  │ section label
│ ┌──── AREA INPUT ─────────────┐ │
│ │ T.Nagar, Chennai            │ bg-secondary input
│ │ Exact address never shared. │ 9px, text-tertiary
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ [Set up my profile →]           │ primary button
└─────────────────────────────────┘
```

### Gender selector component
- 3 options in a row: "Woman" / "Man" / "Other"
- Selected: `teal-50` bg, `teal-400` border 1.5px, `teal-600` text
- Unselected: `bg-secondary`, default border, `text-secondary`
- Equal width (flex: 1), height 36px, radius-md

### Preference selector component (full-width radio cards)
- Selected (Women only): `pink-50` bg (#FBEAF0), `pink-400` border 1.5px (#D4537E)
- Title: `pink-800` (#72243E), weight 500, 11px
- Subtitle: `pink-600` (#993556), 9px
- Checkmark: 14px circle, `pink-400` bg, white tick

### Privacy note
- Background: `pink-50` — same family as selection, reinforces the connection
- Shield icon: `pink-600` stroke
- Text: `pink-800`, 9px, line-height 1.4

### Critical design rule
Never show gender preference to other commuters in any explicit way. The ride card only shows a lock icon or "women preferred" label — never the requester's gender. This protects privacy while filtering correctly.

---

## Screen 7: Ride card with full trust signals

**When shown:** Home screen, after trust system is live. Replaces the basic ride card from Screen 1.  
**What's new:** Company verified badge, gender filter banner, star rating, tag history.

### Changes from original ride card

**New: gender filter banner** (shown at top when preference is set)
- Background: `pink-50`
- Icon: shield, `pink-600`
- Text: "Showing women-only commutes · your preference" — `pink-800` 10px weight 500

**New: verified company badge** (on the person's name row)
- Shield icon inline before company name
- Background: `green-50`, text: `green-600`
- Format: "✓ Zoho" or "✓ TCS" — short, prominent
- Size: 9px text, fits inline with name

**New: gender preference pill** (optional, when sharer has set a preference)
- "women only" in `pink-50` bg, `pink-600` text
- Only shown if sharer has set women-only preference
- Never shown if preference is "anyone verified"

**New: star rating row**
- Star icon: 11×11px, `amber-400` fill (#EF9F27)
- Rating number: 10px weight 500
- Ride count: "23 rides" 10px text-secondary
- Top tags from trust signals: 2 max, shown as small teal pills (8px text)

### Full ride card spec

```
┌──── RIDE CARD ──────────────────────────────────┐
│ [MK]  Meera K.  [✓ Zoho]  [women only]  [bike] │
│       Siruseri, OMR · bike · 9:30 AM            │
│ ─────────────────────────────────────────────── │
│ ⭐ 4.9 · 23 rides · [punctual] [smooth ride]    │
│ ●────○────●  (stop dots)                        │
│ +0min  petrol ₹18  [Join commute]               │
└─────────────────────────────────────────────────┘
```

### Component specs

**Star rating component:**
- Container: flex row, gap 4px, align-items center
- Star: SVG path, 11×11px, fill `#EF9F27` (amber-400)
- Number: 10px weight 500 text-primary
- Separator dot: "·" text-secondary
- Ride count: 10px text-secondary
- Tags: pill-teal, 8px text, 1px 5px padding

**Verified badge (inline):**
- Prefix: mini shield SVG, 8×8px, green-600
- Text: company short name, 9px, green-600
- Background: green-50 pill
- Radius: radius-sm

---

## Screen 8: Post-ride rating

**When shown:** After every completed ride. Shown to both the commuter and the sharer.  
**Goal:** Build the trust graph privately. Reward positives only. Provide a safety escape hatch.

### Layout

```
┌─────────────────────────────────┐
│ "How was the ride?"             │ 13px, weight 500
│ "Private · Meera won't see..."  │ 10px, text-secondary
├─────────────────────────────────┤
│ ┌──── RIDE AGAIN CARD ────────┐ │
│ │ [MK avatar, 40px]           │ centered
│ │ Meera K. · Zoho             │ 12px, weight 500
│ │ Would you ride with Meera   │ 10px, text-secondary
│ │ again?                      │
│ │ [👍 Yes!]  [👎 Not really]  │ 2-col selection
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ leave a note (tap all that...)  │ section label
│ ┌──── TAGS CARD ─────────────┐ │
│ │ [punctual ✓] [good company✓] │ selected: teal border
│ │ [smooth ride] [safe riding]  │ unselected: bg-secondary
│ │ [comfortable]                │
│ │                              │
│ │ Only positive tags. For      │ 9px, text-tertiary
│ │ concerns, contact support.   │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ ┌──── REPORT CARD ───────────┐ │ bg-secondary
│ │ Report a concern            │ 10px, weight 500
│ │ If you felt unsafe, tap     │ 9px, text-secondary
│ │ here. Goes to safety team.  │
│ │ Report this ride →          │ 10px, coral-400
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Meera's trust profile           │ 10px, weight 500
│ [4.9 community] [23 rides]      │ 2-col metric cards
├─────────────────────────────────┤
│ [Done]                          │ primary button
└─────────────────────────────────┘
```

### Ride-again selector
- Two equal columns, height 60px each, radius-md
- Yes (selected): `teal-50` bg, `teal-400` border 1.5px, thumbs-up emoji 18px, "Yes!" `teal-600` 10px weight 500
- Not really (unselected): `bg-secondary`, default border, thumbs-down emoji 18px, "Not really" text-secondary 10px
- Emoji size: explicitly 18px (don't inherit container)

### Tag selector
- Positive tags only. No negative options anywhere in the UI.
- Selected: `teal-50` bg, `teal-400` border 1px, text `teal-600`
- Unselected: `bg-secondary`, default border, text `text-secondary`
- Layout: flex-wrap, gap 5px
- Padding: 4px 10px each

### Report escape hatch
- Background: `bg-secondary` — understated, not alarming
- "Report this ride →" in `coral-400` (#D85A30) — visible but not red (red would feel like emergency)
- Leads to a separate support form (out of scope for v1 mockup)
- Critical: this is the safety valve. It must exist on every post-ride screen.

### Trust metric cards
- 2-column grid, `bg-secondary`, radius-md, padding 6px 10px
- Number: 16px weight 500
- Label: 9px text-secondary
- Note: these show the OTHER person's stats, not your own

---

## Component library additions (Page 4)

Add these to the Figma components page:

```
Trust/
├── VerifiedBadge           (shield + company name, green)
├── GenderPill              (women only / men only, pink)
├── StarRating              (star + number + count)
├── TrustTagPill            (positive tag, teal, selectable state)
├── RideAgainSelector       (yes/no 2-col card)
├── GenderSelector          (woman/man/other 3-col radio)
├── PreferenceCard          (full-width radio card, pink selected)
├── PrivacyNote             (shield + text, tinted bg)
└── ReportLink              (coral text, understated)
```

---

## Figma page additions (Page 5 — Annotations)

Add a new annotation section: `🔒 Trust system design decisions`

Document:
- Why we don't show a trust score number (avoids gaming + anxiety)
- Why gender preference is never shown explicitly to other users
- Why there are only positive tags (negative feedback goes to support, not to the person)
- Why the report link is coral, not red (visible but not alarming)
- Why the verified badge shows company name, not just a checkmark (specific trust, not generic)
- Why IT park is selected from a curated list, not free-text (prevents spoofing)
