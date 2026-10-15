(function () {
  function endsWith(s, suf){
    s = s.toLowerCase(); suf = suf.toLowerCase();
    return s.length >= suf.length && s.substr(s.length - suf.length) === suf;
  }
  function esc(s){
    return String(s).replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\r/g,"\\r").replace(/\n/g,"\\n").replace(/\t/g,"\\t");
  }
  function json(v){
    if (v === null || v === undefined) return "null";
    var t = typeof v;
    if (t === "string") return '"' + esc(v) + '"';
    if (t === "number") return (isNaN(v) || !isFinite(v)) ? "null" : String(v);
    if (t === "boolean") return v ? "true" : "false";
    if (v instanceof Array){
      var a = [];
      for (var i = 0; i < v.length; i++) a.push(json(v[i]));
      return "[" + a.join(",") + "]";
    }
    var o = [];
    for (var k in v) if (v.hasOwnProperty(k)) o.push(json(k) + ":" + json(v[k]));
    return "{" + o.join(",") + "}";
  }
  function audioLevelsData(layer){
    try {
      var al = layer.property("ADBE Audio Group").property("ADBE Audio Levels");
      var n = al.numKeys, keys = [];
      for (var k = 1; k <= n; k++) keys.push({ time: al.keyTime(k), value: al.keyValue(k) });
      if (n === 0) return { keyframes: [], value: al.value };
      return { keyframes: keys, value: null };
    } catch (e) { return { keyframes: [], value: null }; }
  }

  var comps = [];
  for (var i = 1; i <= app.project.numItems; i++){
    var c = app.project.item(i);
    if (!(c instanceof CompItem)) continue;
    var layers = [];
    for (var j = 1; j <= c.numLayers; j++){
      var L = c.layer(j);
      if (!endsWith(L.name, "Marathi.mp3")) continue;
      layers.push({
        name: L.name,
        inPoint: L.inPoint,
        outPoint: L.outPoint,
        startTime: L.startTime,
        stretch: L.stretch,
        audioLevels: audioLevelsData(L)
      });
    }
    if (layers.length) comps.push({ name: c.name, layers: layers });
  }

  var f = File.saveDialog("Save audio timing JSON", "*.json");
  if (!f) return;
  if (!/\.json$/i.test(f.name)) f = new File(f.fsName + ".json");
  f.encoding = "UTF-8";
  f.open("w"); f.write(json({ compositions: comps })); f.close();
  alert("Exported audio data for " + comps.length + " comp(s).");
})();