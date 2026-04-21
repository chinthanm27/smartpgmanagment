# SmartPG Design System

## Visual Direction
Modern, warm, approachable PG management dashboard. Dark-first aesthetic with vibrant amber/orange accents for energy and accessibility. Non-technical Indian PG owners as primary users — UI language emphasizes clarity and calm focus on rent payment tracking.

## Tone & Differentiation
**Tone:** Functional yet warm; professional without coldness. **Differentiation:** Payment status at a glance (green/red badges), collapsible mobile sidebar, warm accent prevents tech fatigue, card-based information hierarchy.

## Color Palette (OKLCH)

| Token | Light L/C/H | Dark L/C/H | Purpose |
|-------|-------------|-----------|---------|
| background | 0.98/0/0 | 0.12/0/0 | Main canvas (near-black in dark) |
| foreground | 0.15/0/0 | 0.95/0/0 | Primary text |
| card | 0.99/0/0 | 0.16/0/0 | Card surfaces, elevated containers |
| primary/accent | 0.7/0.22/48 | 0.7/0.22/48 | Amber/orange CTAs, active states (consistent both modes) |
| success (chart-1) | 0.65/0.19/142 | 0.65/0.19/142 | "Paid" status badge |
| destructive (chart-3) | 0.65/0.19/22 | 0.65/0.19/22 | "Pending/Overdue" status badge |
| muted | 0.92/0/0 | 0.2/0/0 | Secondary text, disabled states |
| border | 0.88/0/0 | 0.24/0/0 | Card borders, dividers (subtle, minimal) |
| sidebar | 0.97/0/0 | 0.16/0/0 | Sidebar background (matches card depth in dark) |

## Typography

| Layer | Font | Size | Weight | Usage |
|-------|------|------|--------|-------|
| Display | General Sans | 28–32px | 600–700 | Dashboard headings, page titles |
| Body | DM Sans | 14–16px | 400–500 | Content, form labels, descriptions |
| Mono | Geist Mono | 12–14px | 400 | Data, amounts, tenant IDs |

**Type Scale:** h1: 32px/700, h2: 24px/600, body: 16px/400, small: 14px/400, caption: 12px/400.

## Elevation & Depth

- **Background (L:0.12):** Near-black canvas, creates visual depth
- **Card (L:0.16):** Subtle lift via lightness difference, minimal shadow
- **Elevated (L:0.2+):** Popovers, modals, dropdowns — reserved for transient elements
- **Shadow hierarchy:** Minimal (card: subtle 4px blur), Elevated (8px–24px blur). No neon/glow effects.

## Structural Zones

| Zone | Background | Border | Purpose |
|------|-----------|--------|---------|
| Header | card (0.16) | border (0.24) | App title, user menu, minimal nav |
| Sidebar | sidebar (0.16) | border (0.24) | Navigation, collapsible on mobile, primary (0.7/0.22/48) for active links |
| Main Content | background (0.12) | none | Dashboard grid, payment cards, spacious padding |
| Card Container | card (0.16) | border (0.24) | Rent items, tenant info, status badges inside |
| Footer | muted (0.2) | border (0.24) | Optional — minimal, text only |

## Spacing & Rhythm

- **Gaps:** 8px (tight), 12px (default), 16px (generous), 24px (section breaks)
- **Card padding:** 16px (compact), 20px (default), 24px (spacious)
- **Density:** Low (dashboard); list items breathe. Status badge = high contrast + clear spacing.
- **Motion:** Smooth transitions (cubic-bezier(0.4, 0, 0.2, 1), 300ms default). Fade-in on load, slide-up for modals.

## Component Patterns

- **Status badges:** Green (paid) or red (overdue), bold text, pill-shaped (full border-radius)
- **Payment cards:** Card background, subtle border, flex row with tenant name | amount | status | actions
- **Sidebar links:** Hover = accent bg (0.7/0.22/48), padding-left increase signals interactivity
- **Buttons:** Primary = accent, foreground text; secondary = muted bg + foreground text; danger = destructive
- **Modals:** Dark overlay, card background, slide-up animation, close icon top-right

## Motion Choreography

- **Page load:** Cards fade-in + slide-up (staggered 50–100ms delay per card)
- **Hover:** Accent color shift (50ms), subtle shadow increase (no jank)
- **Toggle sidebar:** Collapse/expand 250ms ease-out
- **Status update:** Green badge flash (pulse 400ms) then steady
- **Form submit:** Button disabled + spinner (fade-in 100ms)

## Responsive Design

- **Mobile-first:** Base = mobile (sidebar collapsed, icon nav)
- **Tablet (md: 768px):** Sidebar sticky, slight padding increase
- **Desktop (lg: 1024px):** Full sidebar visible, wider content grid
- **Collapsible sidebar:** Toggle button (hamburger) top-left, overlay on mobile, push on tablet/desktop

## Constraints & Anti-Patterns

- ✓ Use semantic tokens only (no hex, rgb, hsl literals)
- ✓ Card borders are subtle — never use full opacity on borders
- ✓ Accent color (0.7/0.22/48) sparingly for CTAs and active states
- ✗ No generic blue buttons
- ✗ No rainbow palettes or scattered animations
- ✗ No full-page gradients or decorative glow effects
- ✗ No status information without color + text (accessibility)

## Signature Detail

**Warm Amber Accent Unifies the UI:** Across buttons, active nav links, status badges (alongside green/red), and ring focus states, the 0.7/0.22/48 amber-orange creates a cohesive, non-corporate identity that resonates with Indian design sensibilities and prevents tech fatigue for non-technical owners.

## Data Visualization

- **Chart-1 (green 142h):** Paid rent, revenue, positive KPIs
- **Chart-2 (amber 48h):** Pending, in-progress, attention-needed
- **Chart-3 (red 22h):** Overdue, risk, losses
- **Chart-4 (purple 260h):** Secondary data, comparisons
- **Chart-5 (gold 80h):** Accents, highlights

All charts use direct OKLCH values; no opacity mixing to avoid muddiness in dark backgrounds.

---

**Last Updated:** April 2026 | **Platform:** Caffeine (Internet Computer) | **Theme:** Dark (primary) | **Fonts:** General Sans + DM Sans + Geist Mono
