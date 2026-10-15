(function () {
  function q(s){return '"'+String(s).replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\r/g,"\\r").replace(/\n/g,"\\n").replace(/\t/g,"\\t")+'"';}
  function J(v){
    if (v===null||v===undefined) return "null";
    if (typeof v==="number") return isFinite(v)?String(v):"null";
    if (typeof v==="boolean") return String(v);
    if (typeof v==="string") return q(v);
    var a=[],i;
    if (v instanceof Array){ for(i=0;i<v.length;i++) a.push(J(v[i])); return "["+a.join(",")+"]"; }
    for (i in v) if (v.hasOwnProperty(i)) a.push(q(i)+":"+J(v[i]));
    return "{"+a.join(",")+"}";
  }
  function walk(g, path, out){
    for (var i=1;i<=g.numProperties;i++){
      var p=g.property(i), np=path.concat([i]);
      if (p.propertyType===PropertyType.PROPERTY){
        if (p.numKeys>0){
          var t=[];
          for (var k=1;k<=p.numKeys;k++) t.push(p.keyTime(k));
          out.push({path:np,name:p.name,times:t});
        }
      } else walk(p,np,out);
    }
  }
  var comps=[];
  for (var i=1;i<=app.project.numItems;i++){
    var c=app.project.item(i);
    if (!(c instanceof CompItem)) continue;
    var layers=[];
    for (var j=1;j<=c.numLayers;j++){
      var L=c.layer(j), props=[];
      walk(L,[],props);
      layers.push({name:L.name,inPoint:L.inPoint,outPoint:L.outPoint,startTime:L.startTime,stretch:L.stretch,props:props});
    }
    comps.push({name:c.name,duration:c.duration,workAreaStart:c.workAreaStart,workAreaDuration:c.workAreaDuration,layers:layers});
  }
  var f=File.saveDialog("Save timing JSON","JSON:*.json");
  if(!f) return;
  f.encoding="UTF-8"; f.open("w"); f.write(J({comps:comps})); f.close();
  alert("Exported "+comps.length+" comps.");
})();