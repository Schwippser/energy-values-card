# Changelog

## v1.0.0 - 2026-11-10

## Added
  - Added independent trendline visibility settings for each built-in energy value.
  - Added an individual trendline visibility option for custom entity values.
  - Added drag-and-drop reordering of built-in values in the card editor.
  - Added an individual icon visibility setting and custom icon selection to each built-in value's editor section.
  - Added a trendline visibility option to the custom entity editor.

## Changed
  - Reorganized the editor into a dedicated Energy Values section, positioned above Custom Values (Entities).
  - Moved each built-in value's settings into its own expandable section, collapsed by default.
  - Renamed the built-in values editor section from Values to Energy Values.
  - Replaced the separate background color picker and opacity control with a single Background color (rgba) text field.
  - RGBA background colors now define their own transparency; legacy background opacity settings remain supported for older configurations.
  - Updated color handling in the editor to provide a safe default for Home Assistant color selectors when no color has been configured.

## Fixed
  - Fixed background color inputs being reset while typing incomplete RGBA values.
  - Fixed color selector initialization when a built-in value has no background color configured.
  - Kept trendline rendering independent from trend text visibility, so either can be enabled or disabled separately.

## Notes
  - Existing configurations are retained; legacy background color and opacity settings continue to be interpreted for backward compatibility.
  - This release is based on the original `v0.1.3-prerelease` source supplied for the update.



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
