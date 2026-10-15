(function () {
  var log=[];
  var f=File.openDialog("Pick timing JSON"); if(!f) return;
  f.encoding="UTF-8"; f.open("r"); var txt=f.read(); f.close();
  var data=eval("("+txt+")");

  function tryDo(fn){ try{fn();}catch(e){} }
  function getComp(name){
    for (var i=1;i<=app.project.numItems;i++){
      var c=app.project.item(i);
      if (c instanceof CompItem && c.name===name) return c;
    }
    return null;
  }
  function byPath(L,path){
    var p=L;
    for (var i=0;i<path.length;i++) p=p.property(path[i]);
    return p;
  }
  function cp(arr){
    var r=[];
    for (var i=0;i<arr.length;i++) r.push(new KeyframeEase(arr[i].speed,arr[i].influence));
    return r;
  }
  function retime(prop,times,label){
    var n=prop.numKeys, k, d=[];
    if (n!==times.length){ log.push(label+": key count "+n+" vs "+times.length+", skipped"); return; }
    for (k=1;k<n;k++) if (times[k]<=times[k-1]){ log.push(label+": times not increasing, skipped"); return; }
    for (k=1;k<=n;k++){
      var o={v:prop.keyValue(k)};
      tryDo(function(){
        o.it=prop.keyInInterpolationType(k); o.ot=prop.keyOutInterpolationType(k);
        if (o.it===KeyframeInterpolationType.BEZIER || o.ot===KeyframeInterpolationType.BEZIER){
          o.ie=cp(prop.keyInTemporalEase(k)); o.oe=cp(prop.keyOutTemporalEase(k));
        }
        o.tc=prop.keyTemporalContinuous(k); o.ta=prop.keyTemporalAutoBezier(k);
      });
      tryDo(function(){
        if (prop.isSpatial){
          o.is=prop.keyInSpatialTangent(k); o.os=prop.keyOutSpatialTangent(k);
          o.sc=prop.keySpatialContinuous(k); o.sa=prop.keySpatialAutoBezier(k);
        }
      });
      tryDo(function(){ o.rv=prop.keyRoving(k); });
      d.push(o);
    }
    for (k=n;k>=1;k--) prop.removeKey(k);
    for (k=0;k<n;k++) prop.setValueAtTime(times[k],d[k].v);
    for (k=0;k<n;k++){
      var o2=d[k], idx=k+1;
      tryDo(function(){ if(o2.it!==undefined) prop.setInterpolationTypeAtKey(idx,o2.it,o2.ot); });
      tryDo(function(){ if(o2.ie) prop.setTemporalEaseAtKey(idx,o2.ie,o2.oe); });
      tryDo(function(){ if(o2.tc!==undefined) prop.setTemporalContinuousAtKey(idx,o2.tc); });
      tryDo(function(){ if(o2.ta!==undefined) prop.setTemporalAutoBezierAtKey(idx,o2.ta); });
      tryDo(function(){
        if (o2.is){
          prop.setSpatialTangentsAtKey(idx,o2.is,o2.os);
          prop.setSpatialContinuousAtKey(idx,o2.sc);
          prop.setSpatialAutoBezierAtKey(idx,o2.sa);
        }
      });
      tryDo(function(){ if(o2.rv!==undefined) prop.setRovingAtKey(idx,o2.rv); });
    }
  }

  app.beginUndoGroup("Apply timing JSON");
  var C=data.comps, i, j, m;

  // Pass 1: comp durations and work areas
  for (i=0;i<C.length;i++){
    var cd=C[i], comp=getComp(cd.name);
    if(!comp){ log.push("Comp not found: "+cd.name); continue; }
    tryDo(function(){
      comp.duration=cd.duration;
      comp.workAreaStart=cd.workAreaStart;
      comp.workAreaDuration=cd.workAreaDuration;
    });
  }

  // Pass 2: layers and keyframes
  for (i=0;i<C.length;i++){
    var cd2=C[i], comp2=getComp(cd2.name);
    if(!comp2) continue;
    var same=(comp2.numLayers===cd2.layers.length);
    if(!same) log.push(comp2.name+": layer count differs, matching by name");
    for (j=0;j<cd2.layers.length;j++){
      var ld=cd2.layers[j], L=null;
      if (same) L=comp2.layer(j+1);
      else for (m=1;m<=comp2.numLayers;m++) if (comp2.layer(m).name===ld.name){ L=comp2.layer(m); break; }
      if(!L){ log.push(comp2.name+": layer not found: "+ld.name); continue; }
      var wasLocked=L.locked; L.locked=false;
      tryDo(function(){ L.stretch=ld.stretch; });
      tryDo(function(){ L.startTime=ld.startTime; });
      tryDo(function(){
        if (ld.inPoint>=L.outPoint){ L.outPoint=ld.outPoint; L.inPoint=ld.inPoint; }
        else { L.inPoint=ld.inPoint; L.outPoint=ld.outPoint; }
      });
      for (m=0;m<ld.props.length;m++){
        var pd=ld.props[m], prop=null;
        try{ prop=byPath(L,pd.path); }catch(e){}
        if(!prop || prop.numKeys===undefined){ log.push(comp2.name+" / "+ld.name+": property missing: "+pd.name); continue; }
        try{ retime(prop,pd.times,comp2.name+" / "+ld.name+" / "+pd.name); }
        catch(e){ log.push(comp2.name+" / "+ld.name+" / "+pd.name+": error "+e.toString()); }
      }
      L.locked=wasLocked;
    }
  }
  app.endUndoGroup();
  alert("Done."+(log.length?"\n\n"+log.length+" issues:\n"+log.slice(0,15).join("\n"):""));
})();