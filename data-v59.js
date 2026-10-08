/* V5.9: pure import validation, complete backups, transactional restoration. */
(function(root){
'use strict';
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const ownedKey=k=>k.startsWith('phases60_')||k.startsWith('phase60_')||k==='custom_cycle_charges';
function dateValid(date){return typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&!isNaN(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date;}
function mergeLogs(current, rows, id){
 if(!Array.isArray(rows))throw Error('Liste de mesures attendue');
 // Validate every row before touching the current state.
 const converted=rows.map(row=>{
  if(!object(row)||!dateValid(row.date))throw Error('Date de mesure invalide');
  const entry={...row};
  const aliases={poids:'weight',taille:'waist',poitrine:'chest',mg:'fat'};
  for(const [alias,key] of Object.entries(aliases))if(Object.hasOwn(row,alias)) {entry[key]=row[alias];delete entry[alias];}
  for(const key of ['weight','waist','chest','fat','muscle','water','sys','dia','pulse','sun']){
   if(!Object.hasOwn(entry,key))continue;
   const raw=entry[key];if(raw===null||raw===''){entry[key]=null;continue;}
   if(typeof raw!=='number'&&typeof raw!=='string')throw Error('Mesure invalide : '+key);
   const n=Number(String(raw).replace(',','.'));if(!Number.isFinite(n)||n<0)throw Error('Mesure invalide : '+key);entry[key]=n;
  }return entry;
 });
 const logs=current.map(x=>({...x}));let imported=0,updated=0;
 for(const entry of converted){const old=logs.find(x=>x.date===entry.date);if(old){Object.assign(old,entry,{id:old.id||entry.id||id()});updated++;}else{logs.push({...entry,id:entry.id||id()});imported++;}}
 logs.sort((a,b)=>a.date.localeCompare(b.date));return {logs,imported,updated};
}
function makeBackup(state,storage,cycleKey){
 const appStorage={};for(let i=0;i<storage.length;i++){const k=storage.key(i);if(ownedKey(k)&&k!=='phases60_v5.9_before_restore')appStorage[k]=storage.getItem(k);}
 return {version:'5.9',schemaVersion:7,savedAt:new Date().toISOString(),state,charges:storage.getItem(cycleKey),appStorage};
}
function validateBackup(x,cycleKey){
 if(!object(x))throw Error('Objet de sauvegarde attendu');
 if(x.schemaVersion!==undefined&&x.schemaVersion!==7)throw Error('Version de schéma non prise en charge');
 const state=Object.hasOwn(x,'state')?x.state:x;
 if(!object(state)||!Array.isArray(state.logs))throw Error('État ou historique manquant');
 for(const key of ['profile','cycleDone','cyclePerformance','dailyState','mealsEaten','checklist','extras','nutritionSnapshots','v59'])if(state[key]!==undefined&&!object(state[key]))throw Error('Structure invalide : '+key);
 mergeLogs([],state.logs,()=> 'validation');
 const appStorage=x.appStorage||{};if(!object(appStorage))throw Error('Stockage invalide');
 for(const [k,v]of Object.entries(appStorage))if(!ownedKey(k)||typeof v!=='string')throw Error('Clé de stockage invalide');
 const charges=Object.hasOwn(x,'charges')?x.charges:(appStorage[cycleKey]??undefined);
 if(charges!==undefined&&charges!==null){if(typeof charges!=='string'||!Array.isArray(JSON.parse(charges)))throw Error('Charges invalides');}
 return {state,appStorage,charges};
}
function restore(storage,key,cycleKey,state,backup){
 const writes={...backup.appStorage,[key]:JSON.stringify(state)};
 if(backup.charges!==undefined) {if(backup.charges===null)writes[cycleKey]=null;else writes[cycleKey]=backup.charges;}
 const before={};for(const k of Object.keys(writes))before[k]=storage.getItem(k);
 // Keep a recoverable copy before replacing any existing data. Stop if no space.
 storage.setItem('phases60_v5.9_before_restore',JSON.stringify({savedAt:new Date().toISOString(),values:before}));
 try{for(const [k,v]of Object.entries(writes)){if(v===null)storage.removeItem(k);else storage.setItem(k,v);}}
 catch(e){for(const [k,v]of Object.entries(before)){if(v===null)storage.removeItem(k);else storage.setItem(k,v);}throw e;}
}
const api={mergeLogs,makeBackup,validateBackup,restore};root.Phase59Data=api;
if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
