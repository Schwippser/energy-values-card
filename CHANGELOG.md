# Changelog

## 0.1.3-prerelease

- Gas and water: the unit (m³ / L) is now set per value under "Edit values" (Gas consumption / Water consumption)
- New option **Decimals** for every value under "Edit values" and for custom values (`decimals_by_value`, `decimals` in `custom_values`)
- Removed `volume_decimals` and `liter_decimals` (ignored if still present). Defaults without an own setting: kWh = `decimals`, % = 0, m³ = 2, L = 0

## 0.1.1 / 0.1.2-prerelease

- Compact layout and sparklines
- Per-value options for icon, trend (display, colors, favorable direction) and background
- Extended debug output

## 0.1.0-prerelease

First public prerelease.

- Shows consumption, grid import, grid export, solar, battery charge/discharge, self-sufficiency (autarky), low-carbon share (CO₂ signal), gas and water from the Energy dashboard configuration
- Follows the `energy-date-selection` of the dashboard view (falls back to "today" if there is none)
- Selectable values, custom names, icons on/off, date and title on/off
- Custom background colors with opacity per value
- Gas and water in m³ or liters, separate decimals
- Custom entities as additional values (from long-term statistics, follow the date selection)
- Trend compared with the previous period (percent / absolute, colored good/bad), per-value direction for custom values, trend can be switched off per value
- Optional selection chips (two columns) to hide values in the card
- Visual editor, German and English labels
- `debug: true` shows period, detected sources and raw values
