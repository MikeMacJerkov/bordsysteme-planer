// Recherche-JSON(s) → TEMPLATES (Format von tplState in index.html). Aufruf (im Repo): node tools/vorlagen-conv.js tools/vorlagen-roh.js tools/recherche/*.json – danach Kopfkommentar + "window.TEMPLATES_DATA=" wie in vorlagen.js
const fs = require('fs');
const OUT = process.argv[2], B = process.argv.slice(3).flatMap(p => JSON.parse(fs.readFileSync(p, 'utf8')));
const KINDS = ['bat','shore','charger','inverter','generator','solar','panel','engine','fueltank','watertank','holding','pump','boiler','tap','wc','gas','stove','heater','bilgepump','seacock','thruhull','n2kbus','n2kdev','sensor','consumer'];
const seen = new Set();
const has = (c, s) => c.systems.includes(s);
// Feste Schlüssel aus der Recherche zuerst, Textmuster nur als Rückfall
const BY_KEY = { start_bat:'bat', house_bat:'bat', bt_bat:'bat', charger:'charger', inverter:'inverter', shore:'shore', solar:'solar',
  panel:'panel', isolator:'panel', battery_switch:'panel', heater:'heater', boiler:'boiler', wc:'wc', holding:'holding',
  gas_bottle:'gas', stove:'stove', fueltank:'fueltank', watertank:'watertank', waterpump:'pump', engine:'engine', n2k:'n2kbus',
  galley_sink:'tap', head_sink:'tap', shower:'tap', deck_shower:'tap', bowthruster:'consumer', sternthruster:'consumer', windlass:'consumer',
  bilge_el:'bilgepump', battery_monitor:'consumer', thruhull:'seacock', fridge:'consumer', lights:'consumer', nav_lights:'consumer', stereo:'consumer', audio:'consumer' };
function kind(c) {
  if (KINDS.includes(c.kind)) return c.kind;              // neuere Recherchen liefern den Typ direkt
  if (BY_KEY[c.key]) return BY_KEY[c.key];
  const t = (c.key + ' ' + c.name + ' ' + (c.type || '')).toLowerCase(), v = c.values || {};
  if (/backbone|n2k_bus|nmea.?2000.?bus/.test(t)) return 'n2kbus';
  if (v.ah > 0 || /batter/.test(t)) return 'bat';
  if (/solar/.test(t)) return 'solar';
  if (/landanschl|landstrom|shore/.test(t) && !/lade|charger/.test(t)) return 'shore';
  if (/multiplus|kombi|combi/.test(t)) return 'charger';                 // Wechselrichter/Lader → als Lader (lädt die Batterien)
  if (/inverter|wechselricht/.test(t)) return 'inverter';
  if (/charger|ladeger/.test(t)) return 'charger';
  if (/panel|schalttafel|verteil/.test(t)) return 'panel';
  if (/heiz|heater|webasto|eberspäch|planar/.test(t)) return 'heater';
  if (/boiler|warmwasser(?!heiz)|hot.?water/.test(t)) return 'boiler';
  if (/gas.?flasche|lpg|campingaz|gasbottle|gas_bottle|gas bottle|gasflaschen/.test(t) || (c.key === 'gas')) return 'gas';
  if (/herd|kocher|stove|oven|backofen/.test(t)) return 'stove';
  if ((/motor|engine|außenbord|outboard|diesel|perkins|nanni|volvo|yanmar|mercury|vetus/.test(t)) && has(c, 'fuel') && !/tank|heiz|filter|pumpe/.test(t)) return 'engine';
  if (/tank/.test(t) && has(c, 'fuel')) return 'fueltank';
  if (/fäkal|holding|schmutzwasser|black/.test(t) && /tank/.test(t)) return 'holding';
  if (/tank/.test(t) && has(c, 'fresh')) return 'watertank';
  if (/wc|toilet|toilette/.test(t)) return 'wc';
  if (/bilge|lenz/.test(t) && /pump/.test(t)) return has(c, 'dc12') ? 'bilgepump' : 'consumer';
  if (/pump/.test(t) && has(c, 'fresh')) return 'pump';
  if (/seeventil|seacock|absperr|ventil/.test(t)) return 'seacock';
  if (/durchlass|thru.?hull|borddurch|auslass|outlet|einlass/.test(t)) return 'thruhull';
  if (/spüle|sink|becken|dusche|shower|wasserhahn/.test(t) && has(c, 'fresh')) return 'tap';
  if (has(c, 'n2k')) return has(c, 'dc12') ? 'n2kdev' : 'sensor';
  return 'consumer';
}
const out = [], report = [];
for (const b of B) {
  if (seen.has(b.id)) { report.push('doppelt, übersprungen: ' + b.id); continue; } seen.add(b.id);
  const comps = [], dropped = [];
  for (const c of b.components) {
    let sys = c.systems.slice();
    let k = kind(c);
    if (!sys.length) { if (k === 'wc') sys = ['black']; else { dropped.push(c.name); continue; } }   // z. B. manuelle Ankerwinde: kein System
    if (k === 'consumer' && !has(c, 'dc12') && !sys.length) { dropped.push(c.name); continue; }
    const v = c.values || {}, tc = { key: c.key, k, name: c.name, sys, x: c.x, side: c.side, level: c.level };
    for (const f of ['amp', 'hours', 'ah', 'liter', 'wp']) if (v[f] != null) tc[f] = v[f];
    if (k === 'engine' && v.alternator_a) { tc.amp = v.alternator_a; tc.hours = 1; tc.note = `Lichtmaschine ${v.alternator_a} A (Typwert), Motorlaufzeit 1 h/Tag angenommen – anpassen.`; }
    if (k === 'engine' || k === 'generator') tc.model = c.name;
    if (k === 'generator' && !sys.includes('ac230')) sys.unshift('ac230');
    if (c.source) { try { tc.note = [tc.note, 'Quelle: ' + new URL(c.source).hostname.replace(/^www\./, '')].filter(Boolean).join(' '); } catch (e) {} }
    comps.push(tc);
  }
  const keys = new Set(comps.map(c => c.key));
  const conns = (b.connections || []).filter(x => keys.has(x[0]) && keys.has(x[1]));
  out.push({ id: b.id, name: b.name, maker: b.maker || b.name.split(' ')[0], group: b.group, years: b.years, hull: b.hull, ...(b.bow ? { bow: b.bow } : {}), lengthM: b.loa_m, volt: b.volt, desc: b.desc,
    sources: b.sources || [], uncertain: b.uncertain || [], comps, conns });
  report.push(`## ${b.name} [${b.hull}, ${b.volt} V] ${comps.length} Teile, ${conns.length} Verb.` + (dropped.length ? ` – weggelassen: ${dropped.join(', ')}` : '') +
    '\n   ' + comps.map(c => `${c.key}=${c.k}`).join(' '));
}
const js = 'const TEMPLATES=[\n' + out.map(t => {
  const head = JSON.stringify(Object.fromEntries(Object.entries(t).filter(([k]) => k !== 'comps' && k !== 'conns')));
  return ' ' + head.slice(0, -1) + ',\n  comps:[\n' + t.comps.map(c => '   ' + JSON.stringify(c)).join(',\n') + '],\n  conns:' + JSON.stringify(t.conns) + '}';
}).join(',\n') + '];\n';
fs.writeFileSync(OUT, js);
console.log(report.join('\n'));
