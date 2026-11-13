# Energy Values Card

[![Home Assistant Marketplace](https://img.shields.io/badge/Home%20Assistant-Marketplace-blue.svg)](https://www.home-assistant.io/integrations/marketplace/)
![Version](https://img.shields.io/badge/version-1.0.0-blue)

[English version](README.md)

Eine Dashboard-Karte für Home Assistant, die auswählbare Werte aus dem **Energy-Dashboard** anzeigt (Verbrauch, Netzbezug, Einspeisung, Solar, Batterie, Autarkie, CO₂-neutraler Anteil, Gas, Wasser) und der **`energy-date-selection`** der Dashboard-Ansicht folgt.

> **Status: frühe Vorabversion.** Die Karte wurde nicht über einen längeren Zeitraum mit verschiedenen Home-Assistant-Versionen getestet. Bitte melde Probleme über die Issue-Vorlage (mit der Ausgabe von `debug: true`).

## Screenshot

<img width="1289" height="170" alt="image" src="https://github.com/user-attachments/assets/eb6b04a5-79ab-4ab3-884b-75a5e5e4b7fb" />

## Funktionen

- Werte: Verbrauch, Netzbezug, Einspeisung, Solar, Batterie laden/entladen, Autarkie, CO₂-neutraler Anteil, Gas, Wasser
- Folgt der Datumsauswahl (Tag / Woche / Monat / Jahr / eigener Zeitraum)
- Werte auswählen, sortieren und umbenennen
- Icons, Titel und Datum abschaltbar
- Eigene Hintergrundfarbe und Deckkraft je Wert
- Gas und Wasser wahlweise in m³ oder Litern; Dezimalstellen je Wert
- Eigene Entitäten als zusätzliche Werte (aus Langzeitstatistiken, folgen der Datumsauswahl)
- Trend im Vergleich zum Vor-Zeitraum (Prozent und/oder absolute Differenz, farbig gut/schlecht)
- Optionale Auswahl-Chips, um einzelne Werte direkt in der Karte auszublenden
- Visueller Editor, Deutsch und Englisch

## Installation

### MARKETPLACE (benutzerdefiniertes Repository)

[![Open your Home Assistant instance and open this repository in HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=YOUR_GITHUB_USER&repository=energy-values-card&category=plugin)

1. MARKETPLACE → ⋮ → **Benutzerdefinierte Repositories**
2. Repository: `https://github.com/Schwippser/energy-values-card`, Kategorie **Dashboard**
3. **Energy Values Card** installieren. Vorabversionen bietet HACS nur an, wenn für das Repository „Beta-Versionen anzeigen" aktiviert ist.
4. Browser neu laden (ggf. Cache leeren).

### Manuell

1. `dist/energy-values-card.js` nach `/config/www/` kopieren
2. Einstellungen → Dashboards → ⋮ → **Ressourcen** → `/local/energy-values-card.js` als **JavaScript-Modul** hinzufügen

## Verwendung

Die Karte gehört auf **dieselbe Dashboard-Ansicht** wie eine `energy-date-selection`. Das Energy-Dashboard muss eingerichtet sein (Einstellungen → Dashboards → Energie).

```yaml
type: vertical-stack
cards:
  - type: energy-date-selection
  - type: custom:energy-values-card
    title: Energie
    values:
      - consumption
      - grid_import
      - grid_export
      - solar
      - battery_charge
      - battery_discharge
      - autarky
```

### Werte

| Schlüssel | Zeigt | Einheit |
| --- | --- | --- |
| `consumption` | Verbrauch: Netzbezug + Solar + Batterie entladen − Einspeisung − Batterie laden | kWh |
| `grid_import` | Netzbezug | kWh |
| `grid_export` | Einspeisung | kWh |
| `solar` | Solarerzeugung | kWh |
| `battery_charge` | In die Batterie geladene Energie | kWh |
| `battery_discharge` | Aus der Batterie entnommene Energie | kWh |
| `autarky` | Anteil des Verbrauchs, der nicht aus dem Netz stammt | % |
| `co2_signal` | Anteil CO₂-neutraler (nicht fossiler) Energie am Verbrauch. Braucht die Integration CO2 Signal / Electricity Maps und eine Netzbezug-Quelle | % |
| `gas` | Gasverbrauch (Quellen vom Typ Gas) | m³ oder kWh, je nach Sensor |
| `water` | Wasserverbrauch (Quellen vom Typ Wasser) | m³ (oder L) |

Werte ohne passende Quelle im Energy-Dashboard blendet die Karte automatisch aus. Die Standardliste `values` enthält alle Werte.

### Optionen

| Option | Standard | Beschreibung |
| --- | --- | --- |
| `title` | `Energie` | Eigener Titel (leer = Standardtitel) |
| `show_title` | `true` | Titel anzeigen |
| `show_date` | `true` | Gewählten Zeitraum im Kopf anzeigen |
| `show_icons` | `true` | Icon jedes Werts anzeigen |
| `show_trend` | `true` | Trend im Vergleich zum Vor-Zeitraum anzeigen |
| `trend_display` | `percent` | `percent`, `absolute` oder `both` |
| `trend_colors` | `true` | Trend grün / rot einfärben (gut / schlecht), sonst neutral |
| `trends` | – | Trend für einzelne Werte abschalten, z. B. `solar: false` |
| `layout` | `list` | `list` oder `grid` (Kacheln) |
| `decimals` | `1` | Standard-Dezimalstellen der kWh-Werte |
| `values` | alle | Liste der anzuzeigenden Werte in dieser Reihenfolge. `[]` zeigt keine Energie-Werte (praktisch, wenn nur eigene Werte erscheinen sollen) |
| `names` | – | Eigene Bezeichnungen, z. B. `solar: PV` |
| `background_colors` | – | Hintergrundfarbe je Wert (`"#rrggbb"`, `rgb()`, `rgba()`, `var(--…)`, Theme-Farbname oder `[r, g, b]` / `[r, g, b, a]`) |
| `background_opacity` | – | Deckkraft `0`–`1` je Wert, wirkt auf die Hintergrundfarbe |
| `show_selector` | `false` | Auswahl-Chips (zwei Spalten) zum Ausblenden einzelner Werte anzeigen |
| `water_unit` | `m³` | `m³` oder `L` |
| `gas_unit` | `m³` | `m³` oder `L` (nur wenn der Gassensor ein Volumen misst, nicht kWh) |
| `decimals_by_value` | – | Dezimalstellen je Wert, z. B. `water: 3`. Ohne Eintrag: kWh = `decimals`, % = 0, m³ = 2, L = 0 |
| `custom_values` | – | Eigene Entitäten als zusätzliche Werte (siehe unten) |
| `collection_key` | – | Nur nötig, wenn die `energy-date-selection` einen eigenen `collection_key` verwendet |
| `debug` | `false` | Zeitraum, erkannte Quellen und Rohwerte unter der Karte anzeigen |

Beispiel mit Namen und Farben:

```yaml
type: custom:energy-values-card
names:
  consumption: Haus
  grid_import: Netz
background_colors:
  solar: [255, 152, 0]
  grid_import: "rgba(72, 143, 194, 0.2)"
background_opacity:
  solar: 0.4
```

### Trend

Jeder Wert kann einen Trend im Vergleich zum **Vor-Zeitraum** des gewählten Zeitraums zeigen: voriger Tag, vorige Woche, voriger Monat, voriges Jahr, bei eigenen Zeiträumen die gleiche Anzahl Tage direkt davor.

- Pfeil und Differenz, z. B. `▲ +12,5 %`. Beim Darüberfahren erscheint der Wert des Vor-Zeitraums.
- Autarkie und CO₂-neutraler Anteil zeigen die Differenz in Prozentpunkten (`%-Pkt.` / `pp`).
- Farben: Grün = günstig, Rot = ungünstig. Weniger Verbrauch, Netzbezug, Gas und Wasser sind günstig; mehr Solar, Einspeisung, Autarkie und CO₂-neutraler Anteil sind günstig. Batterie-Werte und eigene Werte sind neutral, solange du bei einem eigenen Wert kein `trend_good` setzt.
- Verglichen wird der **gesamte** Vor-Zeitraum. Solange der aktuelle Zeitraum noch läuft (z. B. heute), ist der Wert deshalb meist niedriger als der vorige.
- Der Trend lässt sich für einzelne Werte abschalten (`trends: { solar: false }`, bei eigenen Werten `show_trend: false`). Im Editor ist das der Schalter **Trend** neben jeder Bezeichnung unter „Bezeichnungen der Werte".
- Der Trend braucht pro Aktualisierung eine zusätzliche Statistik-Abfrage. Sie entfällt, wenn kein Wert einen Trend zeigt. Mit `show_trend: false` schaltest du ihn ganz aus.

### Eigene Werte

Entitäten mit Langzeitstatistiken (mit `state_class`) lassen sich als Werte hinzufügen. Sie folgen wie die übrigen Werte der Datumsauswahl.

```yaml
custom_values:
  - entity: sensor.waermepumpe_energie
    name: Wärmepumpe
    stat: auto          # auto | change | mean | min | max | state
    unit: kWh           # optional, sonst die Einheit der Statistik
    decimals: 1         # optional
    icon: mdi:heat-pump # optional
    color: "#ff7043"    # optional (Icon-Farbe)
    trend_good: none    # optional: up (Anstieg ist gut) | down (Rückgang ist gut) | none
    show_trend: true    # optional: false = kein Trend für diesen Wert
    background_color: "#223344"  # optional
```

- `stat: auto` summiert bei Zählern (`total` / `total_increasing`) die Änderung im Zeitraum und nimmt bei Messwerten den Durchschnitt.
- Eigene Werte erscheinen nach den Energie-Werten. Für eine andere Reihenfolge trägst du die Entitäts-ID in `values` ein.
- `unit` ändert nur die Beschriftung und rechnet nicht um. Energie rechnet Home Assistant auf kWh um, Volumen auf m³.
- Entitäten ohne Langzeitstatistik zeigen `–`.

## Woher die Daten kommen

- **Zeitraum:** aus der `energy-date-selection` des Dashboards (ohne sie zeigt die Karte „heute").
- **Quellen:** aus der Konfiguration des Energy-Dashboards (`energy/get_prefs`).
- **Werte:** Summen der Langzeitstatistiken dieser Quellen im Zeitraum (`recorder/statistics_during_period`).
- **Verbrauch und Autarkie** berechnet die Karte selbst. Die Formeln orientieren sich am Energy-Dashboard, wurden aber nicht gegen dessen Quellcode geprüft. Kleine Abweichungen sind möglich.
- **CO₂-neutraler Anteil:** über `energy/fossil_energy_consumption` mit dem CO2-Signal-Sensor (fossiler Anteil im Netz, %), der automatisch gefunden wird.

## Bekannte Einschränkungen

- Die Datumsauswahl liest die Karte aus einem internen Frontend-Objekt (`hass.connection._energy`). Das ist keine offizielle Schnittstelle und kann sich mit einem Home-Assistant-Update ändern.
- Als Text (YAML) gesetzte Farben zeigt der Farbwähler im Editor nicht an, und eine im Editor gesetzte Farbe lässt sich nur in YAML wieder entfernen.
- Das Editor-Feld für eigene Werte braucht eine aktuelle Home-Assistant-Version, sonst bearbeitest du `custom_values` in YAML.

## Fehlersuche

Setze `debug: true`. Die Karte zeigt dann den erkannten Zeitraum, die Quelle des Zeitraums (`collection` oder `fallback`), die erkannten Quellen und die Rohwerte je Sensor. Bitte füge diese Ausgabe Fehlerberichten bei, zusammen mit den Werten des Energy-Dashboards für denselben Zeitraum.

## Lizenz

MIT, siehe [LICENSE](LICENSE).
