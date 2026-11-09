Energy Values Card
![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)
![version](https://img.shields.io/badge/version-0.1.0--prerelease-blue)
Deutsche Version
A Home Assistant dashboard card that shows selectable values from your Energy dashboard (consumption, grid import, grid export, solar, battery, self-sufficiency, low-carbon share, gas, water) and follows the `energy-date-selection` of the dashboard view.
> **Status: early prerelease.** The card was developed without a long test cycle on different Home Assistant versions. Please report problems using the issue template (with `debug: true` output).
Features
Values: consumption, grid import, grid export, solar, battery charge, battery discharge, self-sufficiency, low-carbon share, gas, water
Follows the date selection (day / week / month / year / custom range)
Choose which values are shown, in which order, and rename them
Icons, title and date can be switched off
Custom background color and opacity per value
Gas and water in m³ or liters, with separate decimals
Your own entities as additional values (from long-term statistics, follow the date selection)
Optional selection chips to hide single values directly in the card
Visual editor, German and English
Installation
HACS (custom repository)
![Open your Home Assistant instance and open this repository in HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)
HACS → ⋮ → Custom repositories
Repository: `https://github.com/Schwippser/energy-values-card`, category Dashboard
Install Energy Values Card. Prereleases are only offered if "Show beta versions" is enabled for the repository in HACS.
Reload the browser (clear cache if needed).
Manual
Copy `dist/energy-values-card.js` to `/config/www/`
Settings → Dashboards → ⋮ → Resources → add `/local/energy-values-card.js` as JavaScript module
Usage
Place the card on the same dashboard view as an `energy-date-selection` card. The Energy dashboard must be set up (Settings → Dashboards → Energy).
```yaml
type: vertical-stack
cards:
  - type: energy-date-selection
  - type: custom:energy-values-card
    title: Energy
    values:
      - consumption
      - grid_import
      - grid_export
      - solar
      - battery_charge
      - battery_discharge
      - autarky
```
Values
Key	Shows	Unit
`consumption`	Home consumption: grid import + solar + battery discharge − grid export − battery charge	kWh
`grid_import`	Energy taken from the grid	kWh
`grid_export`	Energy fed into the grid	kWh
`solar`	Solar production	kWh
`battery_charge`	Energy charged into the battery	kWh
`battery_discharge`	Energy taken from the battery	kWh
`autarky`	Share of the consumption that was not taken from the grid	%
`co2_signal`	Share of low-carbon (non-fossil) energy in the consumption. Needs the CO2 Signal / Electricity Maps integration and a grid import source	%
`gas`	Gas consumption (sources of type gas)	m³ or kWh, depending on the sensor
`water`	Water consumption (sources of type water)	m³ (or L)
Values without a matching source in the Energy dashboard are hidden automatically. The default `values` list contains all of them.
Options
Option	Default	Description
`title`	`Energy`	Custom title (empty = default title)
`show_title`	`true`	Show the title
`show_date`	`true`	Show the selected period in the header
`show_icons`	`true`	Show the icon of each value
`layout`	`list`	`list` or `grid` (tiles)
`decimals`	`1`	Decimals for kWh values
`values`	all	List of values to show, in this order. `[]` shows no energy values (useful if you only want custom values)
`names`	–	Custom names, e.g. `solar: PV`
`background_colors`	–	Background color per value (`"#rrggbb"`, `rgb()`, `rgba()`, `var(--…)`, theme color name, or `[r, g, b]` / `[r, g, b, a]`)
`background_opacity`	–	Opacity `0`–`1` per value, applied to the background color
`show_selector`	`false`	Show selection chips (two columns) to hide single values
`water_unit`	`m³`	`m³` or `L`
`gas_unit`	`m³`	`m³` or `L` (only if the gas sensor measures a volume, not kWh)
`volume_decimals`	`2`	Decimals for gas / water in m³
`liter_decimals`	`0`	Decimals for gas / water in liters
`custom_values`	–	Own entities as additional values (see below)
`collection_key`	–	Only needed if the `energy-date-selection` uses its own `collection_key`
`debug`	`false`	Show period, detected sources and raw values below the card
Example with names and colors:
```yaml
type: custom:energy-values-card
names:
  consumption: House
  grid_import: Grid
background_colors:
  solar: [255, 152, 0]
  grid_import: "rgba(72, 143, 194, 0.2)"
background_opacity:
  solar: 0.4
```
Custom values
Entities with long-term statistics (a `state_class`) can be added as values. They follow the date selection like the other values.
```yaml
custom_values:
  - entity: sensor.heat_pump_energy
    name: Heat pump
    stat: auto          # auto | change | mean | min | max | state
    unit: kWh           # optional, otherwise the unit of the statistic
    decimals: 1         # optional
    icon: mdi:heat-pump # optional
    color: "#ff7043"    # optional (icon color)
    background_color: "#223344"  # optional
```
`stat: auto` sums the change in the period for counters (`total` / `total_increasing`) and uses the average for measurements.
Custom values appear after the Energy values. To place them elsewhere, add the entity id to `values`.
`unit` only changes the label, it does not convert the value. Energy is converted to kWh and volumes to m³ by Home Assistant.
Entities without long-term statistics show `–`.
How the data is obtained
Period: read from the `energy-date-selection` of the dashboard (if none is found, the card shows today).
Sources: read from the Energy dashboard configuration (`energy/get_prefs`).
Values: sums of the long-term statistics of these sources for the period (`recorder/statistics_during_period`).
Consumption and self-sufficiency are calculated by the card. The formulas follow the Energy dashboard but were not compared against its source code, so small deviations are possible.
Low-carbon share uses `energy/fossil_energy_consumption` with the CO2 Signal sensor (fossil share of the grid, %), which is detected automatically.
Known limitations
The date selection is read from an internal frontend object (`hass.connection._energy`). This is not an official API and may change with a Home Assistant update.
Colors saved as text (YAML) are not shown in the editor's color picker, and a color set in the editor can only be removed in YAML.
The editor field for custom values needs a recent Home Assistant version; otherwise edit `custom_values` in YAML.
Troubleshooting
Set `debug: true`. The card then shows the detected period, the source of the period (`collection` or `fallback`), the recognized sources and the raw values per sensor. Please include this output in bug reports, together with the values shown in the Energy dashboard for the same period.
License
MIT, see LICENSE.
