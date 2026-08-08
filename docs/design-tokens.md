# ChargeLocal Design Tokens

## Color

| Token | Hex | Usage |
|-------|-----|-------|
| `graphite` | `#141518` | Map chrome, primary text on light |
| `warmWhite` | `#F7F6F3` | Sheet surfaces, body background |
| `neutralGray` | `#8A8F98` | Secondary text, borders |
| `border` | `#E4E2DD` | Thin dividers |
| `electricIndigo` | `#4F46E5` | Available state, primary CTA, route, charging accent |
| `success` | `#059669` | Completed session |
| `warning` | `#D97706` | Pending / stale availability |
| `danger` | `#DC2626` | Declined, error, report |

Use `electricIndigo` sparingly — never as a full-page wash.

## Typography

- **iOS:** SF Pro (system)
- **Android / Web:** Inter (loaded via expo-font)

| Role | Size | Weight | Line height |
|------|------|--------|-------------|
| `display` | 28px | 600 | 34px |
| `title` | 20px | 600 | 26px |
| `body` | 16px | 400 | 22px |
| `caption` | 13px | 400 | 18px |
| `label` | 12px | 500 | 16px |

## Radius

- Controls: 12px (`rounded-xl`)
- Sheets / panels: 16px
- Large bottom sheets: 20px

## Motion

- Small transitions: 150–250ms, ease-out
- Sheet open/close: 300–450ms, spring (damping ~0.85)
- Respect `prefers-reduced-motion`: disable pulse, reduce sheet animation to opacity only

## Spacing scale

4, 8, 12, 16, 20, 24, 32, 40, 48

## Map markers

- **Residential:** circular marker, house/plug icon, indigo ring when available
- **Public:** simpler plug/lightning, neutral fill
- **Fast:** emphasize kW label, not brand
