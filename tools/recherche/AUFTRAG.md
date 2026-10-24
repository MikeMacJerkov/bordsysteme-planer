# Rechercheauftrag: Bordsystem-Vorlagen für einen 3D-Bordsysteme-Planer

## Zweck
Ein Browser-Planer für Bordsysteme (12/24 V, 230 V, Wasser, Fäkalien, Kraftstoff, Gas, Bilge, NMEA 2000). Nutzer legen ein neues Boot aus einer **Vorlage** an und passen es dann an. Jede Vorlage beschreibt die **typische Ausstattung eines bekannten Bootsmodells**: welche Bauteile es gibt, typische Größen/Werte, ungefähre Lage im Boot und wie sie verbunden sind. Nutzer sitzen in Potsdam/Berlin (Havel, Mecklenburg) – Binnenreviere.

## Urheberrecht – wichtig
**Keine** Zeichnungen, Pläne oder längeren Texte aus Handbüchern übernehmen. Nur **Fakten** (Bauteilarten, Kapazitäten, Motormodelle, Batteriegrößen, vorhandene Systeme, Lage in Worten wie „unter der Salonbodenplatte“) mit Quell-URL.

## Gute Quellen
Werft-Datenblätter und Prospekte, öffentliche Owner's Manuals (PDF), Charter-Bootsseiten (nennen Tanks, Landstrom, Bugstrahlruder, Heizung, Inverter), Bootstests (yacht.de, boote-magazin.de, Practical Boat Owner, Sailing Today), Gebrauchtboot-Inserate (boat24, yachtworld, botentekoop.nl, de Valk, Makler) mit Ausstattungslisten, Wikipedia/sailboatdata.com für Maße.

## Je Boot ermitteln
- LüA, Breite, Tiefgang (m), Baujahre, **hull** (siehe unten), Bordspannung 12 oder 24 V
- Motor(en): Modell, Kraftstoff, Antrieb (Saildrive/Welle/Außenborder/Z-Antrieb/V-Drive/Direktantrieb), Lichtmaschine A falls auffindbar
- Batterien: Verbraucherbank Ah, Starterbatterie, ggf. Bugstrahl-/Ankerbatterie
- Laden: Landstrom 230 V ja/nein, Ladegerät A, Solar, Inverter/Kombigerät, **Generator** (bei großen Motorbooten häufig)
- Tanks: Frischwasser l, Kraftstoff l, Fäkalientank l (bzw. ob vorhanden)
- Wasser: Druckwasserpumpe, Boiler (Motorwärmetauscher + 230 V), Spülen, Dusche, Heckdusche
- WC (manuell/elektrisch/Chemie), Fäkalientank
- Gas: Flasche und Lage, Herd/Backofen
- Heizung: Diesel-Warmluft/Warmwasser (Webasto/Eberspächer/Planar), Kielkühlung bei Stahlbooten
- Bilgepumpen, Seeventile
- Bug-/Heckstrahlruder, elektrische Ankerwinsch
- Elektronik: Plotter/MFD, UKW, AIS, Instrumente, Autopilot, NMEA-2000-Backbone
- Kühlschrank, sonstige große Verbraucher
- **Lage** je Bauteil: `x` = Anteil der Länge vom Heck (0) zum Bug (1), `side` = "port" | "center" | "starboard", `level` = "bilge" | "below_floor" | "cabin" | "cockpit" | "deck" | "mast"

## hull-Werte
- "segel" – Segelyacht mit Kiel und Mast
- "motor" – Verdränger-Motorboot (Stahl/GFK, Steuerhaus oder Achterkajüte, Binnen/Küste)
- "sport" – Gleiter-Sport-/Kajütboot mit Außenborder oder Z-Antrieb
- "ski" – Wasserskiboot mit **Einbaumotor mittschiffs** (Direktantrieb) oder V-Drive achtern, flacher Freibord, offenes Cockpit. Zusätzlich Feld `"bow": "closed"` (geschlossenes Vorschiff, „closed bow“/„traditional“) oder `"bow": "open"` (Sitzplätze im Bug, „open bow“).

## Ausgabe
Schreibe **eine JSON-Datei** (Pfad steht in deinem Auftrag) mit einem Array, ein Objekt je Boot:
```json
{
  "id": "bavaria-cruiser-41",
  "name": "Bavaria Cruiser 41",
  "group": "Segelyacht" | "Binnen-Motorboot" | "Stahl-Motoryacht" | "Sportboot" | "Wasserskiboot",
  "maker": "Bavaria",
  "years": "2014–2018",
  "hull": "segel",
  "bow": "open",                       // nur bei hull "ski"
  "loa_m": 12.35, "beam_m": 3.99, "draft_m": 2.05,
  "volt": 12,
  "desc": "ein deutscher Satz zur typischen Ausstattung",
  "components": [
    {"key":"engine","kind":"engine","name":"Volvo Penta D2-50","systems":["fuel","dc12"],"x":0.3,"side":"center","level":"below_floor","values":{"alternator_a":115},"source":"https://..."}
  ],
  "connections": [["fueltank","engine","fuel"], ["house_bat","panel","dc12"]],
  "sources": ["https://..."],
  "uncertain": ["was angenommen und nicht gefunden wurde"]
}
```
**Erlaubte `systems`:** "dc12" (Gleichstrom-Bordnetz, auch bei 24 V), "ac230", "fresh", "black", "fuel", "gas", "bilge", "n2k". Jedes Bauteil braucht mindestens ein System. Bauteile ohne System (manuelle Ankerwinde, Paddel …) weglassen; ein Chemie-WC bekommt ["black"].

**Erlaubte `kind`** (bestimmt das Verhalten in der Simulation – bitte sorgfältig wählen):
- "bat" Batterie (values.ah) · "shore" Landanschluss 230 V · "charger" Ladegerät (auch Kombigerät Lader+Inverter) · "inverter" reiner Wechselrichter · "generator" Stromerzeuger 230 V (Diesel) · "solar" Solarmodul (values.wp) · "panel" Schalttafel/Verteilung/Hauptschalter/Trennrelais
- "engine" Antriebsmotor (values.alternator_a) · "fueltank" · "watertank" · "holding" Fäkalientank
- "pump" Druckwasserpumpe · "boiler" Warmwasserbereiter · "tap" Spüle/Waschbecken/Dusche/Heckdusche · "wc" Toilette
- "gas" Gasflasche · "stove" Gasherd/Backofen · "heater" Heizung (Diesel)
- "bilgepump" elektrische Bilgepumpe · "seacock" Seeventil · "thruhull" Borddurchlass/Lenzöffnung
- "n2kbus" NMEA-2000-Backbone · "n2kdev" Gerät am NMEA-Bus mit 12-V-Versorgung (Plotter, Instrumente, AIS, Autopilot) · "sensor" reiner NMEA-Geber ohne eigene Versorgung
- "consumer" sonstiger Gleichstromverbraucher (Kühlschrank, Licht, Bugstrahlruder, Ankerwinsch, Radio, Ballastpumpen, Gebläse …)

**Erlaubte `values`:** "ah", "amp" (Stromaufnahme bzw. Ladestrom in A bei Bordspannung), "hours" (typische Nutzung h/Tag), "liter", "wp", "alternator_a". Für Verbraucher plausible Typwerte für `amp`/`hours` angeben und in `uncertain` als Typwert kennzeichnen.

**Verbindungen** je System: wer speist wen (Batterie → Schalttafel → Verbraucher; Wassertank → Pumpe → Zapfstellen; Landanschluss → Ladegerät → Batterie; Motor-Lichtmaschine → Batterien; Kraftstofftank → Motor/Heizung/Generator; Gasflasche → Herd; WC → Fäkalientank; Bilgepumpe → Seeventil → Borddurchlass; NMEA-Backbone → Geräte). Nur Schlüssel vorhandener Bauteile verwenden.

Je Boot etwa **12–30 Bauteile** – die typischen, aussagekräftigen. Ehrlich bleiben: was für genau dieses Modell nicht auffindbar ist, mit Typwert der Größenklasse füllen und in `uncertain` nennen. **Keine Quellen erfinden.** Qualität vor Menge; lieber ein Modell weniger als geratene Daten ohne Kennzeichnung.

## Abschluss
Prüfe die Datei selbst (z. B. mit `node -e`): gültiges JSON, nur erlaubte systems/kind/values, jede Verbindung zeigt auf vorhandene Schlüssel. Antworte danach **kurz** (max. 25 Zeilen, deutsch): welche Boote drin sind, Datenqualität je Boot (gut/mittel/schwach), größte Lücken. Das JSON nicht in die Antwort kopieren.
