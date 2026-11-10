/*
 * energy-values-card  (v0.1.2-prerelease)
 * Home Assistant Custom Card: zeigt Verbrauch, Netzbezug, Einspeisung, Solar und
 * Batteriespeicher aus dem Energy-Dashboard an. Die Werte sind auswählbar und die
 * Card reagiert auf die energy-date-selection.
 *
 * Funktionsweise: Von der energy-date-selection wird nur der gewählte Zeitraum
 * übernommen. Die Quellen kommen aus den Energy-Einstellungen (energy/get_prefs),
 * die Werte werden direkt als Statistik-"change" in kWh beim Recorder abgefragt.
 *
 * Einbindung: über HACS (Dashboard) oder manuell: Datei nach /config/www/energy-values-card.js
 * kopieren und als Dashboard-Ressource "/local/energy-values-card.js" (Typ: JavaScript-Modul) anlegen.
 * Lizenz: MIT
 *
 * Beispiel:
 *   - type: energy-date-selection
 *   - type: custom:energy-values-card
 *     title: Energie        # eigener Titel (leer lassen = Standardtitel)
 *     show_title: true      # Titel anzeigen
 *     values: [consumption, grid_import, grid_export, solar, battery_charge, battery_discharge, autarky, co2_signal, gas, water]
 *     layout: list          # list | grid | compact
 *     decimals: 1
 *     show_date: true       # Zeitraum (Datum) im Kopf der Card anzeigen
 *     show_icons: true      # Icons der einzelnen Werte anzeigen
 *     show_trend: true      # Trend im Vergleich zum Vor-Zeitraum anzeigen
 *     trend_display: percent  # percent | absolute | both
 *     trend_colors: true    # Trend farbig (gut/schlecht), sonst neutral
 *     trends:               # Trend je Wert (Standard: an; false = aus)
 *       solar: false
 *     water_unit: m³        # m³ | L  (Einheit des Wasserverbrauchs)
 *     gas_unit: m³          # m³ | L  (Einheit des Gasverbrauchs, nur bei Gas in Volumeneinheiten, nicht bei kWh)
 *     volume_decimals: 2    # Nachkommastellen für Gas/Wasser in m³
 *     liter_decimals: 0     # Nachkommastellen für Gas/Wasser in Litern
 *     custom_values:        # eigene Entitäten als zusätzliche Werte, folgen der energy-date-selection
 *       - entity: sensor.waermepumpe_energie   # braucht Langzeitstatistiken (state_class)
 *         name: Wärmepumpe            # optional
 *         stat: auto                  # auto | change | mean | min | max | state
 *                                     #   auto = Summe im Zeitraum bei Zählern, sonst Durchschnitt
 *         unit: kWh                   # optional (sonst Einheit der Statistik)
 *         decimals: 1                 # optional
 *         icon: mdi:heat-pump         # optional
 *         color: "#ff7043"            # optional (Icon-Farbe)
 *         trend_good: none            # optional: up (Anstieg ist gut) | down (Rückgang ist gut) | none
 *         show_trend: true            # optional: false = kein Trend für diesen Wert
 *         background_color: "#223344" # optional
 *     names:                # optionale eigene Bezeichnungen je Wert
 *       consumption: Haus
 *       grid_import: Netz
 *     background_colors:    # optionale Hintergrundfarben je Wert (CSS-Farbe, "#rrggbb", rgb(), var(--...) oder [r, g, b])
 *       consumption: "#1f2a44"
 *       solar: [255, 152, 0]
 *       grid_import: "rgba(72, 143, 194, 0.2)"
 *       battery_charge: [240, 98, 146, 0.3]   # [r, g, b, a] geht ebenfalls
 *     background_opacity:   # optionale Deckkraft (0-1) je Wert, wird auf die Hintergrundfarbe angewendet
 *       consumption: 0.5
 *     show_selector: false  # Auswahl-Chips direkt in der Card
 *     debug: false          # true = Zeitraum, Quellen und Rohwerte anzeigen
 *     collection_key: null  # nur nötig, wenn die energy-date-selection einen collection_key hat
 */

const CARD_VERSION = "0.1.2-prerelease";

const DEFAULT_VALUES = [
  "consumption",
  "grid_import",
  "grid_export",
  "solar",
  "battery_charge",
  "battery_discharge",
  "autarky",
  "co2_signal",
  "gas",
  "water",
];

const VALUES = {
  consumption: { icon: "mdi:home-lightning-bolt", color: "var(--primary-color, #03a9f4)" },
  grid_import: { icon: "mdi:transmission-tower-export", color: "var(--energy-grid-consumption-color, #488fc2)" },
  grid_export: { icon: "mdi:transmission-tower-import", color: "var(--energy-grid-return-color, #8353d1)" },
  solar: { icon: "mdi:solar-power", color: "var(--energy-solar-color, #ff9800)" },
  battery_charge: { icon: "mdi:battery-plus", color: "var(--energy-battery-in-color, #f06292)" },
  battery_discharge: { icon: "mdi:battery-minus", color: "var(--energy-battery-out-color, #4db6ac)" },
  autarky: { icon: "mdi:shield-home", color: "var(--energy-non-fossil-color, #0f9d58)" },
  co2_signal: { icon: "mdi:molecule-co2", color: "#7cb342" },
  gas: { icon: "mdi:fire", color: "var(--energy-gas-color, #8ab4f8)" },
  water: { icon: "mdi:water", color: "var(--energy-water-color, #00bcd4)" },
};

/** Werte, die in Prozent statt in kWh angezeigt werden. */
const PCT_KEYS = new Set(["autarky", "co2_signal"]);

/** Werte in Volumen- bzw. Gaseinheiten (kein Vergleichsbalken mit den kWh-Werten). */
const VOL_KEYS = new Set(["gas", "water"]);

const I18N = {
  de: {
    title: "Energie",
    consumption: "Verbrauch",
    grid_import: "Netzbezug",
    grid_export: "Einspeisung",
    solar: "Solar",
    battery_charge: "Batterie laden",
    battery_discharge: "Batterie entladen",
    autarky: "Autarkie",
    gas: "Gasverbrauch",
    water: "Wasserverbrauch",
    co2_signal: "CO₂-neutraler Strom",
    loading: "Lade Energiedaten…",
    no_prefs: "Das Energy-Dashboard ist noch nicht eingerichtet.",
    nothing: "Keine Werte ausgewählt oder keine passenden Quellen im Energy-Dashboard.",
    fallback: "Keine energy-date-selection gefunden – zeige heute.",
    ed_title: "Titel",
    ed_show_title: "Titel anzeigen",
    pp: "%-Pkt.",
    prev_period: "Vorperiode",
    ed_trend_short: "Trend",
    cv_show_trend: "Trend anzeigen",
    tr_percent: "Prozent",
    tr_absolute: "Absolute Differenz",
    tr_both: "Beides",
    cv_trend_good: "Trend ist gut bei",
    cv_trend_display: "Trend-Darstellung",
    cv_trend_colors: "Trend farbig (gut/schlecht)",
    tg_none: "neutral",
    tg_up: "Anstieg",
    tg_down: "Rückgang",
    ed_values: "Anzuzeigende Werte",
    ed_layout: "Darstellung",
    ed_decimals: "Nachkommastellen",
    ed_selector: "Auswahl-Chips in der Card anzeigen",
    ed_date: "Datum anzeigen",
    ed_icons: "Icons anzeigen",
    cv_show_icon: "Icon anzeigen",
    ed_bg_combined: "Hintergrundfarben und Deckkraft der Werte",
    ed_bg_color: "Hintergrundfarbe",
    ed_names: "Bezeichnungen der Werte (leer = Standard)",
    ed_water_unit: "Einheit Wasserverbrauch",
    ed_gas_unit: "Einheit Gasverbrauch",
    ed_volume_decimals: "Nachkommastellen Gas/Wasser (m³)",
    ed_liter_decimals: "Nachkommastellen Gas/Wasser (Liter)",
    ed_custom: "Eigene Werte (Entitäten)",
    cv_entity: "Entität",
    cv_name: "Name",
    cv_stat: "Wert aus Statistik",
    st_auto: "Automatisch",
    st_change: "Summe/Änderung im Zeitraum",
    st_mean: "Durchschnitt",
    st_min: "Minimum",
    st_max: "Maximum",
    st_state: "Letzter Wert",
    cv_unit: "Einheit (optional)",
    cv_decimals: "Nachkommastellen",
    cv_icon: "Icon",
    cv_color: "Farbe",
    ed_alpha: "Deckkraft",
    ed_list: "Liste",
    ed_grid: "Kacheln",
    ed_compact: "Kompakt",
  },
  en: {
    title: "Energy",
    consumption: "Consumption",
    grid_import: "Grid import",
    grid_export: "Grid export",
    solar: "Solar",
    battery_charge: "Battery charge",
    battery_discharge: "Battery discharge",
    autarky: "Self-sufficiency",
    gas: "Gas consumption",
    water: "Water consumption",
    co2_signal: "Low-carbon energy",
    loading: "Loading energy data…",
    no_prefs: "The energy dashboard has not been set up yet.",
    nothing: "No values selected or no matching sources in the energy dashboard.",
    fallback: "No energy-date-selection found – showing today.",
    ed_title: "Title",
    ed_show_title: "Show title",
    pp: "pp",
    prev_period: "Previous period",
    ed_trend_short: "Trend",
    cv_show_trend: "Show trend",
    tr_percent: "Percent",
    tr_absolute: "Absolute difference",
    tr_both: "Both",
    cv_trend_good: "Trend is good for",
    cv_trend_display: "Trend display",
    cv_trend_colors: "Colored trend (good/bad)",
    tg_none: "neutral",
    tg_up: "increase",
    tg_down: "decrease",
    ed_values: "Values to show",
    ed_layout: "Layout",
    ed_decimals: "Decimals",
    ed_selector: "Show selection chips in the card",
    ed_date: "Show date",
    ed_icons: "Show icons",
    cv_show_icon: "Show icon",
    ed_bg_combined: "Background colors and opacity of the values",
    ed_bg_color: "Background color",
    ed_names: "Names of the values (empty = default)",
    ed_water_unit: "Water consumption unit",
    ed_gas_unit: "Gas consumption unit",
    ed_volume_decimals: "Decimals gas/water (m³)",
    ed_liter_decimals: "Decimals gas/water (liters)",
    ed_custom: "Custom values (entities)",
    cv_entity: "Entity",
    cv_name: "Name",
    cv_stat: "Statistic value",
    st_auto: "Automatic",
    st_change: "Sum/change in period",
    st_mean: "Average",
    st_min: "Minimum",
    st_max: "Maximum",
    st_state: "Last value",
    cv_unit: "Unit (optional)",
    cv_decimals: "Decimals",
    cv_icon: "Icon",
    cv_color: "Color",
    ed_alpha: "Opacity",
    ed_list: "List",
    ed_grid: "Tiles",
    ed_compact: "Compact",
  },
};

const tr = (lang) => I18N[(lang || "de").toLowerCase().startsWith("de") ? "de" : "en"];

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** Wandelt einen Konfigurationswert in eine nutzbare CSS-Farbe um (oder null). */
function cssColor(v) {
  if (v == null || v === "") return null;
  if (Array.isArray(v) && v.length >= 3) {
    const rgb = v.slice(0, 3).map((n) => Math.max(0, Math.min(255, Math.round(Number(n)) || 0))).join(", ");
    const alpha = v.length >= 4 && v[3] != null && v[3] !== "" ? Number(v[3]) : NaN;
    return Number.isNaN(alpha) ? `rgb(${rgb})` : `rgba(${rgb}, ${Math.max(0, Math.min(1, alpha))})`;
  }
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  if (/^var\(--[\w-]+(\s*,[^;{}]*)?\)$/.test(s)) return s;
  if (typeof CSS !== "undefined" && CSS.supports && CSS.supports("color", s)) return s;
  // Theme-Farbnamen wie "red" oder "deep-orange" -> var(--red-color)
  if (/^[a-z]+(-[a-z]+)*$/i.test(s)) return `var(--${s.toLowerCase()}-color)`;
  return null;
}

/** Hintergrundfarbe eines Werts inkl. optionaler Deckkraft (0-1) oder null. */
function backgroundFor(config, key) {
  const color = cssColor(config.background_colors?.[key]);
  if (!color) return null;
  const raw = config.background_opacity?.[key];
  if (raw == null || raw === "" || Number.isNaN(Number(raw))) return color;
  let a = Number(raw);
  if (a > 1) a /= 100;
  a = Math.max(0, Math.min(1, a));
  return a >= 1 ? color : `color-mix(in srgb, ${color} ${Math.round(a * 100)}%, transparent)`;
}

const DAY = 86400000;
const PREFS_TTL = 5 * 60 * 1000;
const REFRESH_MS = 60 * 1000;

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

/** Vor-Zeitraum zum gewählten Zeitraum (wie die Vergleichsfunktion des Energy-Dashboards). */
function previousRange(start, end) {
  const shiftDays = (d, n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const lastOfMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
  if (start.toDateString() === end.toDateString()) {
    return { start: shiftDays(start, -1), end: shiftDays(end, -1) }; // Tag
  }
  if (start.getDate() === 1 && sameMonth && end.getDate() === lastOfMonth) {
    // Monat: voriger Kalendermonat
    return {
      start: new Date(start.getFullYear(), start.getMonth() - 1, 1, start.getHours(), start.getMinutes(), start.getSeconds(), start.getMilliseconds()),
      end: new Date(start.getFullYear(), start.getMonth(), 0, end.getHours(), end.getMinutes(), end.getSeconds(), end.getMilliseconds()),
    };
  }
  if (start.getMonth() === 0 && start.getDate() === 1 && end.getMonth() === 11 && end.getDate() === 31 && start.getFullYear() === end.getFullYear()) {
    // Jahr: voriges Kalenderjahr
    return {
      start: new Date(start.getFullYear() - 1, 0, 1, start.getHours(), start.getMinutes(), start.getSeconds(), start.getMilliseconds()),
      end: new Date(end.getFullYear() - 1, 11, 31, end.getHours(), end.getMinutes(), end.getSeconds(), end.getMilliseconds()),
    };
  }
  // Woche und eigene Zeiträume: um die Anzahl der Tage zurückschieben
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const days = Math.round((endDay - startDay) / 86400000) + 1;
  return { start: shiftDays(start, -days), end: shiftDays(end, -days) };
}

/** Bei welcher Richtung eines Werts der Trend "gut" ist (up = Anstieg gut, down = Rückgang gut). */
const TREND_GOOD = {
  consumption: "down",
  grid_import: "down",
  grid_export: "up",
  solar: "up",
  battery_charge: "none",
  battery_discharge: "none",
  autarky: "up",
  co2_signal: "up",
  gas: "down",
  water: "down",
};

/* ---------- Datenaufbereitung ---------- */

/** Sammelt rekursiv alle String-Werte einer Eigenschaft. */
function findProp(obj, name, out = []) {
  if (Array.isArray(obj)) {
    obj.forEach((o) => findProp(o, name, out));
  } else if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      if (k === name && typeof v === "string" && v) out.push(v);
      else findProp(v, name, out);
    }
  }
  return out;
}

/** Ordnet die Statistik-IDs einer Energiequelle den Werten der Card zu. */
function sourceStatIds(s) {
  const r = { grid_import: [], grid_export: [], solar: [], battery_discharge: [], battery_charge: [], gas: [], water: [] };
  if (s?.type === "grid") {
    r.grid_import = findProp(s.flow_from, "stat_energy_from");
    r.grid_export = findProp(s.flow_to, "stat_energy_to");
    // Ältere/abweichende Strukturen: falls im jeweiligen Flow-Objekt
    // keine Statistik-ID gefunden wird, die gesamte Grid-Quelle durchsuchen.
    if (!r.grid_import.length) r.grid_import = findProp(s, "stat_energy_from");
    if (!r.grid_export.length) r.grid_export = findProp(s, "stat_energy_to");
  } else if (s?.type === "solar") {
    r.solar = findProp(s, "stat_energy_from");
  } else if (s?.type === "gas") {
    r.gas = findProp(s, "stat_energy_from");
  } else if (s?.type === "water") {
    r.water = findProp(s, "stat_energy_from");
  } else if (s?.type === "battery") {
    // stat_energy_from = aus der Batterie entnommen, stat_energy_to = in die Batterie geladen
    r.battery_discharge = findProp(s, "stat_energy_from");
    r.battery_charge = findProp(s, "stat_energy_to");
  }
  return r;
}

function collectIds(prefs) {
  const ids = new Set();
  for (const s of prefs?.energy_sources || []) {
    Object.values(sourceStatIds(s)).forEach((list) => list.forEach((id) => ids.add(id)));
  }
  return [...ids];
}

/** Summe aller "change"-Werte einer Statistik (bereits in kWh). */
function sumChange(rows) {
  if (!Array.isArray(rows)) return 0;
  let t = 0;
  for (const r of rows) t += Number(r.change) || 0;
  return t;
}

const ENERGY_UNITS = new Set(["Wh", "kWh", "MWh", "GWh", "TWh", "MJ", "GJ", "cal", "kcal"]);
const VOLUME_FACTORS = { "m³": 1, L: 0.001, mL: 1e-6, gal: 0.003785411784, "ft³": 0.028316846592, CCF: 2.8316846592, MCF: 28.316846592 };

/** Einheit und Umrechnungsfaktor einer Gas-/Wasser-Statistik (Ziel: kWh bzw. m³). */
function volumeInfo(meta, converted) {
  const unit = meta?.statistics_unit_of_measurement || meta?.display_unit_of_measurement || "";
  const cls = meta?.unit_class;
  // Energie wurde bereits vom Recorder in kWh umgerechnet
  if (cls === "energy" || (!cls && ENERGY_UNITS.has(unit))) return { unit: "kWh", factor: 1 };
  if (cls === "volume" && converted) return { unit: "m³", factor: 1 };
  return { unit: "m³", factor: VOLUME_FACTORS[unit] ?? 1 };
}

/** Liefert { totals, has, perId, groups, units, skipped } (Strom in kWh, Gas/Wasser in units[key]) */
function compute(prefs, stats, meta = {}, volumeConverted = true) {
  const perId = {};
  const groups = {};
  const units = {};
  const skipped = [];
  const sum = (id) => {
    if (!(id in perId)) perId[id] = sumChange(stats?.[id]);
    return perId[id];
  };
  const totals = { grid_import: 0, grid_export: 0, solar: 0, battery_charge: 0, battery_discharge: 0, gas: 0, water: 0 };
  const has = { grid_import: false, grid_export: false, solar: false, battery_charge: false, battery_discharge: false, gas: false, water: false };

  for (const s of prefs?.energy_sources || []) {
    const g = sourceStatIds(s);
    for (const key of Object.keys(g)) {
      for (const id of g[key]) {
        if (key === "gas" || key === "water") {
          const vi = volumeInfo(meta?.[id], volumeConverted);
          if (units[key] && units[key] !== vi.unit) { skipped.push(id); continue; }
          units[key] = vi.unit;
          totals[key] += sum(id) * vi.factor;
        } else {
          totals[key] += sum(id);
        }
        has[key] = true;
        if (!groups[key]) groups[key] = [];
        groups[key].push(id);
      }
    }
  }

  // Gleiche Formel wie im Energy-Dashboard
  totals.consumption = Math.max(
    0,
    totals.grid_import + totals.solar + totals.battery_discharge - totals.grid_export - totals.battery_charge
  );
  has.consumption = has.grid_import || has.solar || has.battery_discharge;

  // Autarkie (in %): Anteil des Verbrauchs, der nicht aus dem Netz stammt.
  // Strom aus dem Netz, der in die Batterie geladen wurde, zählt nicht als Netzbezug fürs Haus.
  const solarSurplus = Math.max(0, totals.solar - totals.grid_export);
  const gridToBattery = Math.max(0, totals.battery_charge - solarSurplus);
  const gridToHome = Math.max(0, totals.grid_import - gridToBattery);
  totals.autarky = totals.consumption > 0 ? Math.max(0, Math.min(1, 1 - gridToHome / totals.consumption)) * 100 : 0;
  has.autarky = has.consumption && has.grid_import;
  has.co2_signal = false; // wird in _load() nach dem Abruf der fossilen Energie gesetzt
  return { totals, has, perId, groups, units, skipped };
}

/* ---------- Card ---------- */

const CARD_CSS = `
        :host { display: block; }
        .content { padding: 16px; }
        .header { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin-bottom: 12px; }
        .title { font-size: 18px; font-weight: 500; color: var(--primary-text-color); }
        .period { font-size: 13px; color: var(--secondary-text-color); white-space: nowrap; }
        .chips { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; margin-bottom: 12px; }
        .chip {
          font: inherit; font-size: 13px; cursor: pointer;
          padding: 4px 10px; border-radius: 16px;
          width: 100%; min-width: 0; text-align: center;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          border: 1px solid var(--divider-color); background: none;
          color: var(--secondary-text-color);
        }
        .chip.on {
          border-color: var(--c);
          background: color-mix(in srgb, var(--c) 18%, transparent);
          color: var(--primary-text-color);
        }
        .list { display: flex; flex-direction: column; gap: 14px; }
        .list .item {
          display: grid; grid-template-columns: 40px 1fr auto;
          grid-template-areas: "i l v";
          column-gap: 12px; row-gap: 6px; align-items: center;
        }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; }
        .grid .item {
          display: flex; flex-direction: column; align-items: flex-start; gap: 6px;
          padding: 12px; border-radius: 12px;
          background: color-mix(in srgb, var(--c) 10%, transparent);
        }
        .compact { display: grid; grid-template-columns: repeat(auto-fit, minmax(115px, 1fr)); gap: 5px; }
        .compact .item {
          display: flex; flex-direction: row; align-items: center; justify-content: space-between;
          gap: 6px; min-width: 0; padding: 5px 7px; border-radius: 6px;
          background: color-mix(in srgb, var(--c) 8%, transparent);
        }
        .compact .label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }
        .compact .value { flex: 0 0 auto; font-size: 14px; white-space: nowrap; }
        .compact .unit { font-size: 10px; }
        .compact .item.has-chart { padding-bottom: 5px !important; }
        .list.no-icon .item, .list .item.no-icon {
          grid-template-columns: 1fr auto;
          grid-template-areas: "l v";
        }
        .item.has-bg { background: var(--bg); }
        .list .item.has-bg { padding: 10px 12px; border-radius: 12px; }
        .icon {
          grid-area: i; width: 40px; height: 40px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: var(--c); background: color-mix(in srgb, var(--c) 18%, transparent);
        }
        .label { grid-area: l; color: var(--secondary-text-color); font-size: 14px; }
        .value { grid-area: v; font-size: 18px; font-weight: 500; color: var(--primary-text-color); }
        .unit { font-size: 12px; font-weight: 400; color: var(--secondary-text-color); }
        .trend { grid-column: 3; grid-row: 2; justify-self: end; font-size: 12px; white-space: nowrap; color: var(--secondary-text-color); }
        .list.no-icon .trend, .list .item.no-icon .trend { grid-column: 2; }
        .item.has-trend .icon, .item.has-trend .label { grid-row: 1 / span 2; }
        /* Diagramm absolut an der Unterkante verankern: kein Restabstand durch Padding oder Flex/Grid-Gap. */
        .item.has-chart { position: relative; overflow: hidden; padding-bottom: 48px !important; }
        .item.has-chart .trend-chart {
          position: absolute; left: 0; right: 0; bottom: 0;
          display: block; width: 100%; height: 42px; min-height: 0;
          margin: 0; grid-column: auto;
        }
        .trend-chart .line { fill: none; stroke: var(--c); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .trend-chart .area { fill: var(--c); opacity: .12; }
        .msg { color: var(--secondary-text-color); padding: 8px 0; }
        .msg.error { color: var(--error-color); }
        .note { margin-top: 10px; font-size: 12px; color: var(--secondary-text-color); }
        .debug {
          margin: 12px 0 0; padding: 8px; font-size: 11px; line-height: 1.4;
          overflow-x: auto; border-radius: 8px;
          background: var(--secondary-background-color); color: var(--primary-text-color);
        }
      `;

class EnergyValuesCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hidden = new Set();
    this._data = null;
    this._range = null;
    this._rangeKey = null;
    this._source = null;
    this._error = null;
    this._prefs = null;
    this._prefsAt = 0;
    this._loadId = 0;
    this._col = null;
    this._lastState = null;
    this._unsub = null;
    this._pollTimer = null;
    this._pollTicks = 0;
    this._refreshTimer = null;
    this._fallbackTimer = null;
    this._todayMode = false;



    this.shadowRoot.addEventListener("click", (ev) => {
      const btn = ev.target.closest?.("[data-key]");
      if (!btn) return;
      const key = btn.dataset.key;
      if (this._hidden.has(key)) this._hidden.delete(key);
      else this._hidden.add(key);
      this._saveHidden();
      this._render();
    });
  }

  static getConfigElement() {
    return document.createElement("energy-values-card-editor");
  }

  static getStubConfig() {
    return { values: [...DEFAULT_VALUES] };
  }

  setConfig(config) {
    if (!config) throw new Error("Ungültige Konfiguration");
    if (config.values != null && !Array.isArray(config.values)) {
      throw new Error("'values' muss eine Liste sein");
    }
    if (config.custom_values != null && !Array.isArray(config.custom_values)) {
      throw new Error("'custom_values' muss eine Liste sein, z. B. - entity: sensor.mein_sensor");
    }
    // Einträge ohne Entität (z. B. frisch im Editor angelegt) werden ignoriert
    const custom = [];
    for (const cv of config.custom_values || []) {
      if (!cv || typeof cv !== "object" || typeof cv.entity !== "string" || !cv.entity.trim()) continue;
      const entity = cv.entity.trim();
      if (custom.some((x) => x.key === entity)) continue;
      custom.push({ ...cv, entity, key: entity });
    }
    const customKeys = new Set(custom.map((x) => x.key));
    const values = Array.isArray(config.values) ? config.values : DEFAULT_VALUES;
    const bad = values.filter((v) => !VALUES[v] && !customKeys.has(v));
    if (bad.length) {
      throw new Error(`Unbekannte Werte: ${bad.join(", ")}. Erlaubt: ${[...Object.keys(VALUES), ...customKeys].join(", ")}`);
    }
    if (config.background_colors != null && (typeof config.background_colors !== "object" || Array.isArray(config.background_colors))) {
      throw new Error("'background_colors' muss ein Objekt sein, z. B. solar: \"#ff9800\"");
    }
    if (config.trends != null && (typeof config.trends !== "object" || Array.isArray(config.trends))) {
      throw new Error("'trends' muss ein Objekt sein, z. B. solar: false");
    }
    if (config.names != null && (typeof config.names !== "object" || Array.isArray(config.names))) {
      throw new Error("'names' muss ein Objekt sein, z. B. solar: \"PV\"");
    }
    const trends = { ...(config.trends || {}) };
    const trendDisplayByValue = { ...(config.trend_display_by_value || {}) };
    const trendColorsByValue = { ...(config.trend_colors_by_value || {}) };
    const trendGoodByValue = { ...(config.trend_good_by_value || {}) };
    // Alte globale Optionen einmalig auf die einzelnen Werte übertragen.
    for (const k of DEFAULT_VALUES) {
      if (config.show_trend === false && trends[k] == null) trends[k] = false;
      if (trendDisplayByValue[k] == null && config.trend_display) trendDisplayByValue[k] = config.trend_display;
      if (trendColorsByValue[k] == null && config.trend_colors != null) trendColorsByValue[k] = config.trend_colors;
    }
    const { show_trend: _oldShowTrend, trend_display: _oldTrendDisplay, trend_colors: _oldTrendColors, ...cleanConfig } = config;
    this._config = {
      layout: "list", decimals: 1, show_date: true, show_icons: true,
      show_title: true, show_selector: false, water_unit: "m³", gas_unit: "m³",
      volume_decimals: 2, liter_decimals: 0, debug: false,
      ...cleanConfig,
      background_colors: config.background_colors || {},
      background_opacity: config.background_opacity || {},
      names: config.names || {}, trends,
      trend_display_by_value: trendDisplayByValue,
      trend_colors_by_value: trendColorsByValue,
      trend_good_by_value: trendGoodByValue,
      values, custom,
    };
    this._loadHidden();
    this._render();
    // geänderte eigene Werte sofort neu laden (z. B. im Editor)
    if (this._hass && this._range) this._load();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._col) this._connect();
    if (this._range && !this._data && !this._loading) this._load();
  }

  connectedCallback() {
    if (this._hass && !this._col) this._connect();
  }

  disconnectedCallback() {
    if (this._unsub) { try { this._unsub(); } catch (_) { /* ignorieren */ } }
    this._unsub = null;
    this._col = null;
    clearInterval(this._pollTimer);
    clearInterval(this._refreshTimer);
    clearTimeout(this._fallbackTimer);
    this._pollTimer = this._refreshTimer = this._fallbackTimer = null;
    this._todayMode = false;
    this._pollTicks = 0;
  }

  getCardSize() {
    const n = this._config?.values?.length || 6;
    return this._config?.layout === "grid" ? 2 + Math.ceil(n / 3) : 1 + n;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }

  /* --- Zeitraum der energy-date-selection --- */

  _connect() {
    const hass = this._hass;
    if (!hass?.connection || !this._config) return;
    // Collections liegen als "_energy" oder "_energy_<key>" an der Verbindung. Je nach
    // Dashboard (z. B. Strom-Tab des Energy-Dashboards) haben sie einen eigenen Key.
    const conn = hass.connection;
    const keys = Object.keys(conn).filter(
      (k) => /energy/i.test(k) && conn[k] && typeof conn[k].subscribe === "function"
    );
    const ck = this._config.collection_key;
    let key = null;
    if (ck) {
      key = [ck, `_energy_${ck}`, `_${ck}`].find((k) => keys.includes(k)) || null;
    }
    if (!key) {
      key = keys.includes("_energy")
        ? "_energy"
        : keys.find((k) => /electric|strom/i.test(k)) || keys[0] || null;
    }
    this._colKey = key;
    this._colKeys = keys;
    const col = key ? conn[key] : null;

    if (col && typeof col.subscribe === "function") {
      this._col = col;
      this._todayMode = false;
      clearTimeout(this._fallbackTimer);
      this._fallbackTimer = null;
      this._unsub = col.subscribe((state) => {
        this._lastState = state;
        this._syncRange();
      });
      // Zusätzlich pollen, damit Zeitraumwechsel auch ohne Callback sofort ankommen
      this._pollTicks = 0;
      this._pollTimer = setInterval(() => {
        this._pollTicks++;
        this._syncRange();
        if (!this._range && this._pollTicks >= 4) this._useToday();
      }, 1000);
      this._syncRange();
      return;
    }

    // Collection existiert noch nicht (die energy-date-selection lädt evtl. später)
    if (!this._fallbackTimer && !this._todayMode) {
      this._fallbackTimer = setTimeout(() => {
        this._fallbackTimer = null;
        if (!this._col) this._useToday();
      }, 2500);
    }
  }

  _syncRange() {
    const col = this._col;
    if (!col) return;
    const start = col.start instanceof Date ? col.start : this._lastState?.start;
    const endRaw = col.end instanceof Date ? col.end : this._lastState?.end;
    if (!(start instanceof Date)) return;
    const end = endRaw instanceof Date ? endRaw : endOfDay(new Date());
    this._applyRange(start, end, "collection");
  }

  _useToday() {
    this._todayMode = true;
    const now = new Date();
    this._applyRange(startOfDay(now), endOfDay(now), "fallback");
  }

  _applyRange(start, end, source) {
    const key = `${start.getTime()}|${end.getTime()}|${source}`;
    if (key === this._rangeKey) return;
    this._rangeKey = key;
    this._range = { start, end };
    this._source = source;
    if (!this._refreshTimer) {
      this._refreshTimer = setInterval(() => this._load(), REFRESH_MS);
    }
    this._load();
  }

  /* --- Daten laden --- */

  async _getPrefs() {
    if (this._prefs && Date.now() - this._prefsAt < PREFS_TTL) return this._prefs;
    try {
      this._prefs = await this._hass.callWS({ type: "energy/get_prefs" });
    } catch (e) {
      if (e?.code === "not_found") this._prefs = { energy_sources: [] };
      else throw e;
    }
    this._prefsAt = Date.now();
    return this._prefs;
  }

  /** Sucht die CO2-Signal-Entität (Anteil fossiler Energie im Netz, in %), wie das Energy-Dashboard. */
  _findCo2Entity() {
    const hass = this._hass;
    const states = hass?.states || {};
    let ids = Object.values(hass?.entities || {})
      .filter((e) => e.platform === "co2signal")
      .map((e) => e.entity_id);
    if (!ids.length) {
      ids = Object.keys(states).filter(
        (id) => id.startsWith("sensor.") && /fossil_fuel_percentage|co2signal|electricity_maps/.test(id)
      );
    }
    return ids.find((id) => states[id]?.attributes?.unit_of_measurement === "%") || null;
  }

  /** Holt die fossile Energie im Netzbezug (wie die CO2-Anzeige im Energy-Dashboard). */
  async _loadCo2(result, range, period) {
    const info = { entity: null, fossil: null, error: null };
    const c = this._config;
    if (!c.values.includes("co2_signal")) return info;
    const gridIds = result.groups.grid_import || [];
    if (!gridIds.length) { info.error = "kein Netzbezug konfiguriert"; return info; }
    const entity = this._findCo2Entity();
    info.entity = entity;
    if (!entity) { info.error = "keine CO2-Signal-Entität gefunden"; return info; }
    try {
      const res = await this._hass.callWS({
        type: "energy/fossil_energy_consumption",
        start_time: range.start.toISOString(),
        end_time: range.end.toISOString(),
        energy_statistic_ids: gridIds,
        co2_statistic_id: entity,
        period,
      });
      info.fossil = Object.values(res || {}).reduce((a, v) => a + (Number(v) || 0), 0);
      const grid = result.totals.grid_import;
      const home = result.totals.consumption;
      const clamp = (v) => Math.max(0, Math.min(100, v));
      info.gridShare = grid > 0 ? clamp((1 - info.fossil / grid) * 100) : null;
      info.homeShare = home > 0 ? clamp((1 - info.fossil / home) * 100) : null;
      info.grid = grid;
      info.home = home;
      // Anteil CO2-neutraler Energie am gesamten Verbrauch (inkl. Solar und Batterie)
      if (info.homeShare != null) {
        result.totals.co2_signal = info.homeShare;
        result.has.co2_signal = true;
      }
    } catch (e) {
      info.error = e?.message || e?.code || JSON.stringify(e);
    }
    return info;
  }

  /** Wertet die Statistiken der eigenen Entitäten für den gewählten Zeitraum aus. */
  _customResults(customs, stats, meta, volumeConverted) {
    const out = {};
    for (const cv of customs) {
      const rows = stats?.[cv.entity];
      const m = meta?.[cv.entity];
      const type = ["change", "mean", "min", "max", "state"].includes(cv.stat) ? cv.stat : m?.has_sum ? "change" : "mean";
      let value = null;
      if (Array.isArray(rows) && rows.length) {
        const nums = rows
          .map((r) => r[type])
          .filter((v) => v != null && Number.isFinite(Number(v)))
          .map(Number);
        if (nums.length) {
          if (type === "change") value = nums.reduce((a, b) => a + b, 0);
          else if (type === "mean") value = nums.reduce((a, b) => a + b, 0) / nums.length;
          else if (type === "min") value = Math.min(...nums);
          else if (type === "max") value = Math.max(...nums);
          else value = nums[nums.length - 1];
        }
      }
      // Energie wurde vom Recorder in kWh, Volumen in m³ umgerechnet
      let unit = m?.statistics_unit_of_measurement ?? m?.display_unit_of_measurement ?? "";
      if (m?.unit_class === "energy") unit = "kWh";
      else if (m?.unit_class === "volume" && volumeConverted) unit = "m³";
      out[cv.key] = { value, type, unit, rows: Array.isArray(rows) ? rows.length : 0 };
    }
    return out;
  }

  async _load() {
    const hass = this._hass;
    const range = this._range;
    if (!hass || !range) return;
    const id = ++this._loadId;
    this._loading = true;
    try {
      const prefs = await this._getPrefs();
      if (id !== this._loadId) return;
      const hasPrefs = !!prefs?.energy_sources?.length;
      const customs = this._config?.custom || [];
      const customIds = customs.map((cv) => cv.entity);
      const ids = [...new Set([...(hasPrefs ? collectIds(prefs) : []), ...customIds])];

      if (!ids.length) {
        this._data = { empty: true, customValues: {} };
        this._error = null;
      } else {
        const span = range.end - range.start;
        const period = span <= 2 * DAY ? "hour" : span <= 400 * DAY ? "day" : "month";
        // Metadaten (Einheiten): Gas, Wasser und eigene Werte
        const volIds = hasPrefs
          ? prefs.energy_sources.flatMap((src) => {
              const g = sourceStatIds(src);
              return [...g.gas, ...g.water];
            })
          : [];
        const metaIds = [...new Set([...volIds, ...customIds])];
        let meta = {};
        if (metaIds.length) {
          try {
            const rows = await hass.callWS({ type: "recorder/get_statistics_metadata", statistic_ids: metaIds });
            meta = Object.fromEntries((rows || []).map((m) => [m.statistic_id, m]));
          } catch (_) {
            meta = {};
          }
        }
        const types = customIds.length ? ["change", "mean", "min", "max", "state"] : ["change"];
        const query = (units, r = range) =>
          hass.callWS({
            type: "recorder/statistics_during_period",
            start_time: r.start.toISOString(),
            end_time: r.end.toISOString(),
            statistic_ids: ids,
            period,
            types,
            units,
          });
        let stats = {};
        let volumeConverted = true;
        try {
          stats = await query({ energy: "kWh", volume: "m³" });
        } catch (_) {
          // ältere HA-Versionen kennen die Einheitenklasse "volume" evtl. nicht
          volumeConverted = false;
          stats = await query({ energy: "kWh" });
        }
        if (id !== this._loadId) return;
        const customValues = this._customResults(customs, stats, meta, volumeConverted);

        // Vor-Zeitraum für den Trend (Fehler hier dürfen die Hauptwerte nicht verhindern)
        let prev = null;
        const cfg = this._config || {};
        const trendWanted =
          (cfg.values || []).some((k) => VALUES[k] && cfg.trends?.[k] !== false) ||
          customs.some((cv) => cv.show_trend !== false && cfg.trends?.[cv.key] !== false);
        if (trendWanted) {
          try {
            const pr = previousRange(range.start, range.end);
            const prevStats = await query(volumeConverted ? { energy: "kWh", volume: "m³" } : { energy: "kWh" }, pr);
            const prevCustom = this._customResults(customs, prevStats, meta, volumeConverted);
            let totals = {};
            let has = {};
            if (hasPrefs) {
              const pres = compute(prefs, prevStats, meta, volumeConverted);
              await this._loadCo2(pres, pr, period);
              totals = pres.totals;
              has = pres.has;
            }
            prev = { totals, has, customValues: prevCustom, label: this._periodLabel(pr.start, pr.end) };
          } catch (_) {
            prev = null;
          }
        }
        // Tageswerte der letzten sieben Tage (einschließlich heute) für die Mini-Liniendiagramme.
        let weekly = {};
        const graphWanted =
          (cfg.values || []).some((k) => VALUES[k] && cfg.trends?.[k] !== false) ||
          customs.some((cv) => cv.show_trend !== false && cfg.trends?.[cv.key] !== false);
        if (graphWanted) {
          try {
            const weekEnd = endOfDay(new Date());
            const weekStart = startOfDay(new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate() - 6));
            const weekStats = await hass.callWS({
              type: "recorder/statistics_during_period",
              start_time: weekStart.toISOString(),
              end_time: weekEnd.toISOString(),
              statistic_ids: ids,
              period: "day",
              types,
              units: volumeConverted ? { energy: "kWh", volume: "m³" } : { energy: "kWh" },
            });
            const dayKey = (v) => {
              const dt = v instanceof Date ? v : new Date(v);
              return Number.isNaN(dt.getTime()) ? "" : `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
            };
            const days = Array.from({ length: 7 }, (_, i) => {
              const dt = new Date(weekStart); dt.setDate(dt.getDate() + i); return dt;
            });
            for (const day of days) {
              const key = dayKey(day);
              const oneDay = Object.fromEntries(ids.map((sid) => [sid, (weekStats?.[sid] || []).filter((row) => dayKey(row.start) === key)]));
              const dayCustom = this._customResults(customs, oneDay, meta, volumeConverted);
              const dayTotals = hasPrefs ? compute(prefs, oneDay, meta, volumeConverted) : { totals: {}, has: {} };
              if (hasPrefs && cfg.values?.includes("co2_signal") && cfg.trends?.co2_signal !== false) {
                await this._loadCo2(dayTotals, { start: day, end: endOfDay(day) }, "day");
              }
              for (const [k, v] of Object.entries(dayTotals.totals)) {
                if (!weekly[k]) weekly[k] = [];
                weekly[k].push(Number.isFinite(v) ? v : null);
              }
              for (const [k, v] of Object.entries(dayCustom)) {
                if (!weekly[k]) weekly[k] = [];
                weekly[k].push(Number.isFinite(v.value) ? v.value : null);
              }
            }
          } catch (_) { weekly = {}; }
        }
        if (id !== this._loadId) return;

        if (!hasPrefs) {
          this._data = { empty: true, customValues, prev, weekly };
        } else {
          const result = compute(prefs, stats, meta, volumeConverted);
          const co2 = await this._loadCo2(result, range, period);
          if (id !== this._loadId) return;
          this._data = {
            ...result,
            co2,
            period,
            customValues,
            prev,
            weekly,
            sources: prefs.energy_sources.map((s) => `${s.type}: ${Object.keys(s).join(", ")}`),
          };
        }
        this._error = null;
      }
    } catch (e) {
      if (id !== this._loadId) return;
      this._error = e?.message || e?.code || JSON.stringify(e);
    }
    this._loading = false;
    this._render();
  }

  /* --- Auswahl (Chips) --- */

  _storageKey() {
    return `energy-values-card:${this._config?.title || "default"}`;
  }

  _loadHidden() {
    try {
      const raw = localStorage.getItem(this._storageKey());
      this._hidden = new Set(raw ? JSON.parse(raw) : []);
      // grid_export wurde in älteren Versionen teils versehentlich als ausgeblendet
      // gespeichert. Da die Quelle inzwischen korrekt erkannt wird, den Eintrag
      // einmalig zurücksetzen, damit "Einspeisung" wieder sichtbar ist.
      this._hidden.delete("grid_export");
      this._saveHidden();
    } catch (_) {
      this._hidden = new Set();
    }
  }

  _saveHidden() {
    try {
      localStorage.setItem(this._storageKey(), JSON.stringify([...this._hidden]));
    } catch (_) { /* ignorieren */ }
  }

  /* --- Darstellung --- */

  _lang() {
    return this._hass?.locale?.language || this._hass?.language || "de";
  }

  _periodLabel(start, end) {
    if (!(start instanceof Date)) return "";
    const lang = this._lang();
    const e = end instanceof Date ? end : start;
    const fmt = (d, o) => new Intl.DateTimeFormat(lang, o).format(d);
    if (start.toDateString() === e.toDateString()) {
      return fmt(start, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    }
    const lastOfMonth = new Date(e.getFullYear(), e.getMonth() + 1, 0).getDate();
    if (
      start.getDate() === 1 &&
      start.getMonth() === e.getMonth() &&
      start.getFullYear() === e.getFullYear() &&
      e.getDate() === lastOfMonth
    ) {
      return fmt(start, { month: "long", year: "numeric" });
    }
    if (
      start.getMonth() === 0 && start.getDate() === 1 &&
      e.getMonth() === 11 && e.getDate() === 31 &&
      start.getFullYear() === e.getFullYear()
    ) {
      return String(start.getFullYear());
    }
    return `${fmt(start, { day: "numeric", month: "short" })} – ${fmt(e, { day: "numeric", month: "short", year: "numeric" })}`;
  }

  _render() {
    if (!this._config) return;
    const c = this._config;
    const t = tr(this._lang());
    const customs = this._data ? c.custom || [] : [];
    const customMap = new Map(customs.map((cv) => [cv.key, cv]));
    const stateOf = (cv) => this._hass?.states?.[cv.entity];
    const label = (k) => {
      const own = String(c.names?.[k] ?? "").trim();
      if (own) return own;
      const cv = customMap.get(k);
      return cv ? cv.name || stateOf(cv)?.attributes?.friendly_name || cv.entity : t[k];
    };
    const d = this._data;

    let period = "";
    let body = "";
    let note = "";
    let debug = "";

    let totals = {};
    let has = {};
    let builtinOk = false;
    let message = "";
    if (this._error) {
      message = `<div class="msg error">${esc(this._error)}</div>`;
    } else if (!d || !this._range) {
      message = `<div class="msg">${esc(t.loading)}</div>`;
    } else if (d.empty) {
      message = `<div class="msg">${esc(t.no_prefs)}</div>`;
    } else {
      builtinOk = true;
      period = this._periodLabel(this._range.start, this._range.end);
      totals = d.totals;
      has = d.has;
    }

    // Reihenfolge: wie in "values"; eigene Werte, die dort nicht stehen, kommen am Ende
    const wantsBuiltin = c.values.some((k) => VALUES[k]);
    const order = [];
    for (const k of c.values) {
      if (customMap.has(k)) order.push(k);
      else if (VALUES[k] && builtinOk && has[k]) order.push(k);
    }
    for (const cv of customs) if (!order.includes(cv.key)) order.push(cv.key);
    const shown = order.filter((k) => !this._hidden.has(k));

    const clampDec = (n) => Math.min(6, Math.max(0, Math.round(Number(n)) || 0));
    const fmt = (v, dec) =>
      new Intl.NumberFormat(this._lang(), { minimumFractionDigits: clampDec(dec), maximumFractionDigits: clampDec(dec) }).format(v);
    const isLiter = (x) => /^(l|liter|litre)$/i.test(String(x ?? "").trim());
    const useLiter = { water: isLiter(c.water_unit), gas: isLiter(c.gas_unit) };

    /** Trendanzeige im Vergleich zum Vor-Zeitraum (leer, wenn kein Vergleichswert vorhanden ist). */
    const trendHtml = (k, cur, prev, unit, dec, good, options = {}) => {
      if (c.trends?.[k] === false || options.show === false || typeof cur !== "number" || typeof prev !== "number") return "";
      if (!Number.isFinite(cur) || !Number.isFinite(prev)) return "";
      const diff = cur - prev;
      const isPctKey = PCT_KEYS.has(k);
      const pct = prev !== 0 ? (diff / Math.abs(prev)) * 100 : null;
      const signed = (n, dd) => {
        const r = Number(n.toFixed(clampDec(dd)));
        return (r > 0 ? "+" : r < 0 ? "−" : "") + fmt(Math.abs(n), dd);
      };
      const configuredMode = c.trend_display_by_value?.[k] ?? options.display;
      const mode = ["percent", "absolute", "both"].includes(configuredMode) ? configuredMode : "percent";
      const absText = `${signed(diff, dec)}${unit ? " " + unit : ""}`;
      let text;
      let flat;
      if (isPctKey) {
        // Autarkie und CO2-Signal werden als Prozentwerte geführt; auch der Trend nutzt %.
        text = `${signed(diff, 1)} %`;
        flat = Math.abs(diff) < 0.05;
      } else if (mode === "absolute" || pct === null) {
        text = absText;
        flat = Math.abs(diff) < 0.5 * Math.pow(10, -clampDec(dec));
      } else if (mode === "both") {
        text = `${absText} · ${signed(pct, 1)} %`;
        flat = Math.abs(diff) < 0.5 * Math.pow(10, -clampDec(dec));
      } else {
        text = `${signed(pct, 1)} %`;
        flat = Math.abs(pct) < 0.05;
      }
      const arrow = flat ? "→" : diff > 0 ? "▲" : "▼";
      let color = "var(--secondary-text-color)";
      const useColors = c.trend_colors_by_value?.[k] ?? options.colors ?? true;
      if (!flat && useColors && (good === "up" || good === "down")) {
        const isGood = (diff > 0) === (good === "up");
        color = isGood ? "var(--success-color, #43a047)" : "var(--error-color, #db4437)";
      }
      const prevText = `${fmt(prev, dec)}${unit ? " " + unit : ""}`;
      const title = `${t.prev_period}${d.prev?.label ? " (" + d.prev.label + ")" : ""}: ${prevText}`;
      return `<div class="trend" style="color:${esc(color)}" title="${esc(title)}">${arrow} ${esc(text)}</div>`;
    };

    /** Kleine SVG-Linie für die letzten sieben Tage. */
    const sparklineHtml = (k) => {
      if (c.layout === "compact" || c.trends?.[k] === false) return "";
      const cv = customMap.get(k);
      if (cv?.show_trend === false) return "";
      const values = d?.weekly?.[k];
      if (!Array.isArray(values) || values.length < 2) return "";
      const nums = values.map((v) => Number.isFinite(v) ? v : null);
      const valid = nums.filter((v) => v != null);
      if (valid.length < 2) return "";
      const min = Math.min(...valid), max = Math.max(...valid);
      const span = max - min || 1;
      const pts = nums.map((v, i) => v == null ? null : [i * (100 / (nums.length - 1)), 32 - ((v - min) / span) * 26]);
      const segments = [];
      let current = [];
      for (const pt of pts) { if (pt) current.push(pt); else if (current.length) { segments.push(current); current = []; } }
      if (current.length) segments.push(current);
      // Catmull-Rom-ähnliche kubische Bézier-Kurven glätten die Übergänge,
      // ohne die vorhandenen Messpunkte oder Lücken in den Daten zu verändern.
      const smoothSegment = (seg) => {
        if (seg.length < 3) {
          return seg.map((pt, i) => `${i ? "L" : "M"}${pt[0].toFixed(1)},${pt[1].toFixed(1)}`).join(" ");
        }
        let dPath = `M${seg[0][0].toFixed(1)},${seg[0][1].toFixed(1)}`;
        for (let i = 0; i < seg.length - 1; i++) {
          const p0 = seg[Math.max(0, i - 1)];
          const p1 = seg[i];
          const p2 = seg[i + 1];
          const p3 = seg[Math.min(seg.length - 1, i + 2)];
          const c1x = p1[0] + (p2[0] - p0[0]) / 6;
          const c1y = p1[1] + (p2[1] - p0[1]) / 6;
          const c2x = p2[0] - (p3[0] - p1[0]) / 6;
          const c2y = p2[1] - (p3[1] - p1[1]) / 6;
          dPath += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
        }
        return dPath;
      };
      const path = segments.map(smoothSegment).join(" ");
      if (!path) return "";
      const first = pts.find(Boolean), last = [...pts].reverse().find(Boolean);
      const area = segments.length === 1 ? `${path} L${last[0].toFixed(1)},36 L${first[0].toFixed(1)},36 Z` : "";
      return `<svg class="trend-chart" viewBox="0 0 100 36" preserveAspectRatio="none" role="img" aria-label="Verlauf der letzten sieben Tage">${area ? `<path class="area" d="${area}"></path>` : ""}<path class="line" d="${path}"></path></svg>`;
    };

    /** Alles, was zur Darstellung eines Werts nötig ist (Icon, Farbe, Text, Hintergrund). */
    const describe = (k) => {
      const cv = customMap.get(k);
      if (cv) {
        const st = stateOf(cv);
        const res = d?.customValues?.[k];
        const num = typeof res?.value === "number" ? res.value : NaN;
        const isNum = Number.isFinite(num);
        const unit = cv.unit ?? res?.unit ?? "";
        const dec = cv.decimals ?? this._hass?.entities?.[cv.entity]?.display_precision ?? c.decimals;
        const text = isNum ? `${esc(fmt(num, dec))}${unit ? `<span class="unit"> ${esc(unit)}</span>` : ""}` : "–";
        return {
          icon: cv.icon || st?.attributes?.icon || "mdi:gauge",
          showIcon: cv.show_icon !== false,
          color: cssColor(cv.color) || "var(--primary-color, #03a9f4)",
          text,
          trend:
            cv.show_trend === false
              ? ""
              : trendHtml(k, isNum ? num : undefined, d.prev?.customValues?.[k]?.value, unit, dec, cv.trend_good || "none", { display: cv.trend_display, colors: cv.trend_colors }),
          bg:
            backgroundFor(c, k) ||
            backgroundFor({ background_colors: { [k]: cv.background_color }, background_opacity: { [k]: cv.background_opacity } }, k),
        };
      }
      let v = totals[k];
      let pv = d.prev?.has?.[k] ? d.prev.totals[k] : undefined;
      const isPct = PCT_KEYS.has(k);
      let unit = isPct ? "%" : d.units?.[k] || "kWh";
      if (VOL_KEYS.has(k) && unit === "m³" && useLiter[k]) {
        v *= 1000;
        if (typeof pv === "number") pv *= 1000;
        unit = "L";
      }
      const decimals = isPct ? 0 : unit === "kWh" ? c.decimals : unit === "L" ? c.liter_decimals : c.volume_decimals;
      return {
        icon: c.icons?.[k] || VALUES[k].icon,
        showIcon: c.show_icons_by_value?.[k] !== false,
        color: VALUES[k].color,
        text: `${esc(fmt(v, decimals))}<span class="unit"> ${esc(unit)}</span>`,
        trend: trendHtml(k, v, pv, unit, decimals, c.trend_good_by_value?.[k] ?? TREND_GOOD[k] ?? "none"),
        bg: backgroundFor(c, k),
      };
    };

    if ((wantsBuiltin || !d || this._error) && !builtinOk && message) body += message;

    if (c.show_selector && order.length) {
      body += `<div class="chips">${order
        .map(
          (k) =>
            `<button class="chip ${this._hidden.has(k) ? "" : "on"}" data-key="${esc(k)}" style="--c:${esc(describe(k).color)}">${esc(label(k))}</button>`
        )
        .join("")}</div>`;
    }

    if (!shown.length) {
      if (builtinOk || (!wantsBuiltin && d && !this._error)) body += `<div class="msg">${esc(t.nothing)}</div>`;
    } else {
      const compact = c.layout === "compact";
      const showIcons = !compact;
      body += `<div class="${compact ? "compact" : c.layout === "grid" ? "grid" : "list"}${showIcons ? "" : " no-icon"}">${shown
        .map((k) => {
          const it = describe(k);
          const chart = sparklineHtml(k);
          return `
            <div class="item${!it.showIcon ? " no-icon" : ""}${it.bg ? " has-bg" : ""}${it.trend ? " has-trend" : ""}${chart ? " has-chart" : ""}" style="--c:${esc(it.color)};${it.bg ? `--bg:${esc(it.bg)};` : ""}">
              ${showIcons && it.showIcon ? `<div class="icon"><ha-icon icon="${esc(it.icon)}"></ha-icon></div>` : ""}
              <div class="label">${esc(label(k))}</div>
              <div class="value">${it.text}</div>
              ${compact ? "" : it.trend || ""}
              ${chart}
            </div>`;
        })
        .join("")}</div>`;
    }
    if (builtinOk && this._source === "fallback") note = `<div class="note">${esc(t.fallback)}</div>`;

    if (builtinOk && c.debug) {
      const lines = [
        `Quelle des Zeitraums: ${this._source}`,
        `Collection-Key: ${this._colKey ?? "keiner gefunden"}`,
        `Collections an der Verbindung: ${(this._colKeys || []).join(", ") || "-"}`,
        `Energy-ähnliche Keys: ${
          Object.keys(this._hass?.connection || {}).filter((k) => /energy/i.test(k)).join(", ") || "-"
        }`,
        `Start: ${this._range.start.toISOString()}`,
        `Ende:  ${this._range.end.toISOString()}`,
        `Periode: ${d.period}`,
        `Vorperiode: ${d.prev ? d.prev.label : "-"}`,
        `CO2-Signal-Entität: ${d.co2?.entity ?? "-"} | fossil: ${d.co2?.fossil == null ? "-" : d.co2.fossil.toFixed(3) + " kWh"}${d.co2?.error ? " | Fehler: " + d.co2.error : ""}`,
        `CO2-neutral: Verbrauch=${d.co2?.home?.toFixed?.(3) ?? "-"} kWh -> ${d.co2?.homeShare?.toFixed?.(3) ?? "-"} % | Netzbezug=${d.co2?.grid?.toFixed?.(3) ?? "-"} kWh -> ${d.co2?.gridShare?.toFixed?.(3) ?? "-"} %`,
        `Gas/Wasser-Einheiten: ${JSON.stringify(d.units || {})}${d.skipped?.length ? " | übersprungen (andere Einheit): " + d.skipped.join(", ") : ""}`,
        `Eigene Werte: ${JSON.stringify(d.customValues || {})}`,
        `Quellen im Energy-Dashboard:`,
        ...(this._prefs?.energy_sources || []).map((s, i) => {
          const ids = sourceStatIds(s);
          return [
            `  Quelle ${i + 1} (${s.type || "unbekannt"}): ${Object.keys(s).join(", ")}`,
            `    stat_energy_to gefunden: ${JSON.stringify(findProp(s, "stat_energy_to"))}`,
            `    grid_export-Zuordnung: ${JSON.stringify(ids.grid_export || [])}`,
            `    flow_to-Struktur: ${JSON.stringify(s.flow_to ?? null)}`,
          ].join("\\n");
        }),
        `grid_export in Card-Auswahl: ${(c.values || []).includes("grid_export") ? "ja" : "nein"}`,
        `grid_export ausgeblendet: ${this._hidden.has("grid_export") ? "ja" : "nein"}`,
        `Anzeigeliste: ${shown.join(", ") || "-"}`,
        `grid_export erkannt: ${has.grid_export ? "ja" : "nein"}`,
        `Nicht gefunden: ${Object.keys(has).filter((k) => !has[k]).join(", ") || "-"}`,
        `--`,
        ...Object.entries(d.groups || {}).flatMap(([key, ids]) => [
          `${key}:`,
          ...ids.map((id) => {
            const rows = this._lastState?.stats?.[id];
            const unit = this._lastState?.statsMetadata?.[id]?.display_unit_of_measurement || "?";
            let coll = "Collection: –";
            if (Array.isArray(rows)) {
              const ch = rows.reduce((a, r) => a + (Number(r.change) || 0), 0);
              const hasSum = rows.length > 1 && rows[0].sum != null && rows[rows.length - 1].sum != null;
              const sg = hasSum ? (rows[rows.length - 1].sum - rows[0].sum).toFixed(3) : "–";
              coll = `Collection: change=${ch.toFixed(3)} sumΔ=${sg} (${rows.length} Zeilen, ${unit})`;
            }
            return `  ${id}: eigen=${d.perId[id].toFixed(3)} kWh | ${coll}`;
          }),
        ]),
        `--`,
        ...Object.entries(totals).map(([k, v]) => `${k}: ${v.toFixed(3)} ${PCT_KEYS.has(k) ? "%" : d.units?.[k] || "kWh"}`),
      ];
      debug = `<pre class="debug">${esc(lines.join("\n"))}</pre>`;
    }

    const title = c.show_title !== false ? (c.title || t.title) : "";
    const showPeriod = c.show_date !== false ? period : "";
    const header =
      title || showPeriod
        ? `<div class="header">
          <div class="title">${esc(title)}</div>
          <div class="period">${esc(showPeriod)}</div>
        </div>`
        : "";
    if (!this._content) {
      this.shadowRoot.innerHTML = `<style>${CARD_CSS}</style><ha-card><div class="content"></div></ha-card>`;
      this._content = this.shadowRoot.querySelector(".content");
    }
    this._content.innerHTML = `${header}${body}${note}${debug}`;
  }
}

/* ---------- Visueller Editor ---------- */

class EnergyValuesCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) this._form.hass = hass;
    this._render();
  }

  _render() {
    if (!this._config) return;
    const t = tr(this._hass?.locale?.language || this._hass?.language);
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const next = { ...ev.detail.value };
        delete next.show_trend;
        delete next.trend_display;
        delete next.trend_colors;
        const ve = next.values_edit;
        delete next.values_edit;
        if (ve) {
          const prev = Array.isArray(this._config?.values) ? this._config.values : DEFAULT_VALUES;
          const kept = prev.filter((k) => !VALUES[k] || ve[`${k}_enabled`] !== false);
          for (const k of DEFAULT_VALUES) {
            if (ve[`${k}_enabled`] !== false && !kept.includes(k)) kept.push(k);
          }
          next.values = kept;

          const names = { ...(this._config?.names || {}) };
          const trends = { ...(this._config?.trends || {}) };
          const displays = { ...(this._config?.trend_display_by_value || {}) };
          const trendColors = { ...(this._config?.trend_colors_by_value || {}) };
          const good = { ...(this._config?.trend_good_by_value || {}) };
          const backgrounds = { ...(this._config?.background_colors || {}) };
          const icons = { ...(this._config?.icons || {}) };
          const iconVisibility = { ...(this._config?.show_icons_by_value || {}) };
          const opacity = { ...(this._config?.background_opacity || {}) };
          for (const k of DEFAULT_VALUES) {
            const n = typeof ve[k] === "string" ? ve[k] : "";
            if (typeof ve[`${k}_icon`] === "string" && ve[`${k}_icon`].trim()) icons[k] = ve[`${k}_icon`].trim();
            else delete icons[k];
            if (ve[`${k}_icon_enabled`] === false) iconVisibility[k] = false;
            else delete iconVisibility[k];
            if (n.trim()) names[k] = n;
            else delete names[k];
            if (ve[`${k}_trend`] === false) trends[k] = false;
            else delete trends[k];
            if (["percent", "absolute", "both"].includes(ve[`${k}_trend_display`])) displays[k] = ve[`${k}_trend_display`];
            else delete displays[k];
            trendColors[k] = ve[`${k}_trend_colors`] === true;
            if (["none", "up", "down"].includes(ve[`${k}_trend_good`])) good[k] = ve[`${k}_trend_good`];
            else delete good[k];
            if (Array.isArray(ve[`${k}_bg`])) backgrounds[k] = ve[`${k}_bg`];
            else if (typeof backgrounds[k] !== "string") delete backgrounds[k];
            const a = ve[`${k}_alpha`];
            if (typeof a === "number" && a < 1) opacity[k] = a;
            else delete opacity[k];
          }
          next.names = names;
          next.trends = trends;
          next.trend_display_by_value = displays;
          next.trend_colors_by_value = trendColors;
          next.trend_good_by_value = good;
          next.icons = icons;
          next.show_icons_by_value = iconVisibility;
          next.background_colors = backgrounds;
          next.background_opacity = opacity;
        }
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: next }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    const labels = {
      title: t.ed_title,
      values: t.ed_values,
      layout: t.ed_layout,
      decimals: t.ed_decimals,
      show_title: t.ed_show_title,
      show_selector: t.ed_selector,
      show_date: t.ed_date,
      show_icons: t.ed_icons,
      water_unit: t.ed_water_unit,
      gas_unit: t.ed_gas_unit,
      volume_decimals: t.ed_volume_decimals,
      liter_decimals: t.ed_liter_decimals,
      custom_values: t.ed_custom,
    };
    for (const k of DEFAULT_VALUES) {
      labels[k] = t.cv_name;
      labels[`${k}_enabled`] = "Anzeigen";
      labels[`${k}_icon_enabled`] = t.cv_show_icon;
      labels[`${k}_icon`] = t.cv_icon;
      labels[`${k}_bg`] = t.ed_bg_color;
      labels[`${k}_alpha`] = t.ed_alpha;
      labels[`${k}_trend`] = t.cv_show_trend;
      labels[`${k}_trend_display`] = t.cv_trend_display;
      labels[`${k}_trend_colors`] = t.cv_trend_colors;
      labels[`${k}_trend_good`] = t.cv_trend_good;
    }
    this._form.hass = this._hass;
    this._form.data = {
      layout: "list",
      decimals: 1,
      show_date: true,
      show_title: true,
      show_selector: false,
      water_unit: "m³",
      gas_unit: "m³",
      volume_decimals: 2,
      liter_decimals: 0,
      ...this._config,
      custom_values: (this._config.custom_values || []).map((cv) => ({ ...cv, show_icon: cv.show_icon !== false })),
      values_edit: Object.fromEntries(
        DEFAULT_VALUES.flatMap((k) => {
          const col = this._config.background_colors?.[k];
          const a = Number(this._config.background_opacity?.[k]);
          const alpha = this._config.background_opacity?.[k] != null && Number.isFinite(a) ? Math.max(0, Math.min(1, a > 1 ? a / 100 : a)) : 1;
          return [
            [`${k}_enabled`, (Array.isArray(this._config.values) ? this._config.values : DEFAULT_VALUES).includes(k)],
            [`${k}_icon_enabled`, this._config.show_icons_by_value?.[k] !== false],
            [`${k}_icon`, this._config.icons?.[k] ?? ""],
            [k, this._config.names?.[k] ?? ""],
            [`${k}_bg`, Array.isArray(col) ? col : undefined],
            [`${k}_alpha`, alpha],
            [`${k}_trend`, this._config.trends?.[k] !== false],
            [`${k}_trend_display`, this._config.trend_display_by_value?.[k] ?? "percent"],
            [`${k}_trend_colors`, this._config.trend_colors_by_value?.[k] !== false],
            [`${k}_trend_good`, this._config.trend_good_by_value?.[k] ?? TREND_GOOD[k] ?? "none"],
          ];
        })
      ),
    };
    this._form.schema = [
      { name: "title", selector: { text: {} } },
      { name: "show_title", selector: { boolean: {} } },
      {
        type: "grid",
        name: "",
        schema: [
          {
            name: "layout",
            selector: {
              select: {
                mode: "dropdown",
                options: [
                  { value: "list", label: t.ed_list },
                  { value: "grid", label: t.ed_grid },
                  { value: "compact", label: t.ed_compact },
                ],
              },
            },
          },
          { name: "decimals", selector: { number: { min: 0, max: 3, mode: "box" } } },
        ],
      },
      {
        type: "grid",
        name: "",
        schema: [
          {
            name: "gas_unit",
            selector: { select: { mode: "dropdown", options: [{ value: "m³", label: "m³" }, { value: "L", label: "L" }] } },
          },
          {
            name: "water_unit",
            selector: { select: { mode: "dropdown", options: [{ value: "m³", label: "m³" }, { value: "L", label: "L" }] } },
          },
          { name: "volume_decimals", selector: { number: { min: 0, max: 4, mode: "box" } } },
          { name: "liter_decimals", selector: { number: { min: 0, max: 4, mode: "box" } } },
        ],
      },
      { name: "show_date", selector: { boolean: {} } },
      { name: "show_selector", selector: { boolean: {} } },
      {
        name: "custom_values",
        selector: {
          object: {
            multiple: true,
            label_field: "name",
            description_field: "entity",
            fields: {
              entity: { label: t.cv_entity, required: true, selector: { entity: {} } },
              name: { label: t.cv_name, selector: { text: {} } },
              stat: {
                label: t.cv_stat,
                selector: {
                  select: {
                    mode: "dropdown",
                    options: [
                      { value: "auto", label: t.st_auto },
                      { value: "change", label: t.st_change },
                      { value: "mean", label: t.st_mean },
                      { value: "min", label: t.st_min },
                      { value: "max", label: t.st_max },
                      { value: "state", label: t.st_state },
                    ],
                  },
                },
              },
              unit: { label: t.cv_unit, selector: { text: {} } },
              decimals: { label: t.cv_decimals, selector: { number: { min: 0, max: 6, mode: "box" } } },
              icon: { label: t.cv_icon, selector: { icon: {} } },
              show_icon: { label: t.cv_show_icon, selector: { boolean: {} } },
              color: { label: t.cv_color, selector: { text: {} } },
              show_trend: { label: t.cv_show_trend, selector: { boolean: {} } },
              trend_display: { label: t.cv_trend_display, selector: { select: { mode: "dropdown", options: [
                { value: "percent", label: t.tr_percent },
                { value: "absolute", label: t.tr_absolute },
                { value: "both", label: t.tr_both },
              ] } } },
              trend_colors: { label: t.cv_trend_colors, selector: { boolean: {} } },
              trend_good: {
                label: t.cv_trend_good,
                selector: {
                  select: {
                    mode: "dropdown",
                    options: [
                      { value: "none", label: t.tg_none },
                      { value: "up", label: t.tg_up },
                      { value: "down", label: t.tg_down },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      {
        type: "expandable",
        name: "values_edit",
        title: "Werte bearbeiten",
        expanded: true,
        schema: DEFAULT_VALUES.flatMap((k, index) => [
          ...(index > 0 ? [{ type: "divider" }] : []),
          {
            type: "expandable",
            name: `${k}_section`,
            title: t[k] || k,
            expanded: true,
            // Die Felder bleiben durch flatten direkt in values_edit erhalten.
            flatten: true,
            schema: [
              {
                type: "grid",
                name: "",
                flatten: true,
                column_min_width: "150px",
                schema: [
                  { name: `${k}_enabled`, selector: { boolean: {} } },
                  { name: `${k}_icon_enabled`, selector: { boolean: {} } },
                  { name: `${k}_icon`, selector: { icon: {} } },
                  { name: k, selector: { text: {} } },
                  { name: `${k}_bg`, selector: { color_rgb: {} } },
                  { name: `${k}_alpha`, selector: { number: { min: 0, max: 1, step: 0.05, mode: "slider" } } },
                  { name: `${k}_trend`, selector: { boolean: {} } },
                  ...(PCT_KEYS.has(k) ? [] : [{ name: `${k}_trend_display`, selector: { select: { mode: "dropdown", options: [
                    { value: "percent", label: t.tr_percent },
                    { value: "absolute", label: t.tr_absolute },
                    { value: "both", label: t.tr_both },
                  ] } } }]),
                  { name: `${k}_trend_colors`, selector: { boolean: {} } },
                  { name: `${k}_trend_good`, selector: { select: { mode: "dropdown", options: [
                    { value: "none", label: t.tg_none },
                    { value: "up", label: t.tg_up },
                    { value: "down", label: t.tg_down },
                  ] } } },
                ],
              },
            ],
          },
        ]),
      },
    ];
    this._form.computeLabel = (s) => labels[s.name] || s.name;
  }
}

customElements.define("energy-values-card", EnergyValuesCard);
customElements.define("energy-values-card-editor", EnergyValuesCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "energy-values-card",
  name: "Energie-Werte",
  description: "Verbrauch, Netzbezug, Einspeisung, Solar und Batterie aus dem Energy-Dashboard – auswählbar und passend zur energy-date-selection.",
  preview: false,
});

console.info(`%c ENERGY-VALUES-CARD %c v${CARD_VERSION} `, "background:#03a9f4;color:#fff", "background:#333;color:#fff");
