(function () {
  var log = [];
  var f = File.openDialog("Pick the audio JSON exported from Project E");
  if (!f) return;
  f.encoding = "UTF-8"; f.open("r"); var data = eval("(" + f.read() + ")"); f.close();

  function endsWith(s, suf){
    s = s.toLowerCase(); suf = suf.toLowerCase();
    return s.length >= suf.length && s.substr(s.length - suf.length) === suf;
  }
  function getComp(name){
    for (var i = 1; i <= app.project.numItems; i++){
      var c = app.project.item(i);
      if (c instanceof CompItem && c.name === name) return c;
    }
    return null;
  }
  function findItem(name){
    var cands = [];
    for (var i = 1; i <= app.project.numItems; i++){
      var it = app.project.item(i);
      if (it instanceof FootageItem){
        if (it.name === name) return it;
        if (endsWith(it.name, "Marathi.mp3")) cands.push(it);
      }
    }
    return cands.length === 1 ? cands[0] : null;
  }

  app.beginUndoGroup("Replace English VO with Marathi VO");
  var C = data.compositions, i, j, k, replaced = 0;
  for (i = 0; i < C.length; i++){
    var cd = C[i];
    var comp = getComp(cd.name);
    if (!comp){ log.push("Comp not in M: " + cd.name); continue; }

    var eng = [];
    for (k = 1; k <= comp.numLayers; k++) if (endsWith(comp.layer(k).name, "English.mp3")) eng.push(comp.layer(k));

    for (j = 0; j < cd.layers.length; j++){
      var ld = cd.layers[j], old = eng[j], item = findItem(ld.name);
      if (!item){ log.push(cd.name + ": Marathi file not in project: " + ld.name); continue; }

      var idx = 1;
      if (old){ idx = old.index; old.locked = false; old.remove(); }
      else log.push(cd.name + ": no English layer found, added Marathi anyway");

      var L = comp.layers.add(item);
      try { L.stretch = ld.stretch; } catch (e1) {}
      try { L.startTime = ld.startTime; } catch (e2) {}
      try {
        if (ld.inPoint >= L.outPoint){ L.outPoint = ld.outPoint; L.inPoint = ld.inPoint; }
        else { L.inPoint = ld.inPoint; L.outPoint = ld.outPoint; }
      } catch (e3) {}
      try { if (idx > 1) L.moveAfter(comp.layer(idx)); } catch (e4) {}

      try {
        var al = L.property("ADBE Audio Group").property("ADBE Audio Levels");
        var d = ld.audioLevels;
        if (d && d.keyframes && d.keyframes.length){
          for (k = 0; k < d.keyframes.length; k++) al.setValueAtTime(d.keyframes[k].time, d.keyframes[k].value);
        } else if (d && d.value !== null && d.value !== undefined){
          al.setValue(d.value);
        }
      } catch (e5) { log.push(cd.name + ": audio levels not copied"); }
      replaced++;
    }
  }
  app.endUndoGroup();
  alert("Replaced " + replaced + " audio layer(s)." + (log.length ? "\n\n" + log.join("\n") : ""));
})();