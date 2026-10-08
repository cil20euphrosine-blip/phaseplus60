/* New modules are opt-in records in state.v59; historic cycles remain intact. */
'use strict';
const v59Exercises=[['Développé incliné haltères',3,'8–12'],['Développé couché machine / haltères',3,'8–12'],['Écartés poulie / haltères',2,'12–15']];
const v59Core=['Gainage','Dead bug','Reverse crunch','Pallof press'];
function v59Store(){if(!state.v59)state.v59={};return state.v59;}
function v59Recovery(){
 const night=state.v59?.nights?.[todayKey()];const daily=getDailyState(todayKey())||{};
 const tired=night?.tired||(+daily.fatigue>=8);const fragmented=night&&(+night.awakenings>=2||+night.hours<6);
 return {night,reduce:!!(tired||fragmented),rest:getTensionStatus()==='red'||(+daily.fatigue>=8),text:(!night?'Nuit non renseignée. ':'')+(tired||fragmented?'Volume réduit de 30–40 %, 2–3 RIR, sans échec. Trois séances de 45 min maximum.':'Trois séances de 45 min maximum, 2–3 RIR, sans échec.')};
}
const v59OriginalScore=recoveryScore;
recoveryScore=function(){const base=v59OriginalScore();const r=v59Recovery();return r.reduce?Math.min(base,69):base;};
function renderV59(){
 const r=v59Recovery(),week=Number(document.getElementById('v59Week').value);
 const reduced=week<=2||r.reduce;
 const sets=v59Exercises.map(x=>reduced?Math.max(1,Math.round(x[1]*.65)):x[1]);
 document.getElementById('v59ChestPlan').textContent=r.rest?'Repos aujourd’hui selon le suivi de récupération / symptômes.':v59Exercises.map((x,i)=>`${x[0]} : ${sets[i]} × ${x[2]}`).join(' · ');
 document.getElementById('v59RecoveryAdvice').textContent=r.rest?'Repos conseillé aujourd’hui.':r.text;
 document.getElementById('v59SaveChest').disabled=r.rest;
 const saved=state.v59?.chest?.[todayKey()];
 if(saved)document.getElementById('v59ChestFeedback').textContent='Séance enregistrée aujourd’hui · '+saved.exercises.map(x=>x.feedback).join(' · ');
}
function v59Number(id,min,max){const raw=document.getElementById(id).value;if(raw==='')throw Error('Renseigner tous les champs');const n=Number(raw);if(!Number.isFinite(n)||n<min||n>max)throw Error('Valeur hors limites');return n;}
document.getElementById('v59ChestLog').innerHTML=v59Exercises.map((x,i)=>`<fieldset><legend>${x[0]}</legend><div class="add-food-grid"><label>Charge kg<input id="v59Load${i}" type="number" min="0" max="500" step="0.5"></label><label>Répétitions (dernière série)<input id="v59Reps${i}" type="number" min="1" max="100"></label><label>RIR<input id="v59Rir${i}" type="number" min="0" max="10"></label></div><label><input id="v59Pain${i}" type="checkbox"> Douleur ou technique dégradée</label></fieldset>`).join('');
document.getElementById('v59SaveChest').addEventListener('click',()=>{
 try{
  const recovery=v59Recovery();if(recovery.rest)throw Error('Repos conseillé aujourd’hui');
  const week=+document.getElementById('v59Week').value;
  const exercises=v59Exercises.map((x,i)=>{
   const load=v59Number('v59Load'+i,0,500),reps=v59Number('v59Reps'+i,1,100),rir=v59Number('v59Rir'+i,0,10),pain=document.getElementById('v59Pain'+i).checked;
   const feedback=pain?'Réduire et revoir la technique':recovery.reduce||week<=2?'Maintenir pendant la récupération':reps>=Number(x[2].split('–')[1])&&rir>=2?'Progression possible si toutes les séries sont validées':'Maintenir la charge';
   return {name:x[0],load,reps,rir,pain,feedback,sets:week<=2||recovery.reduce?Math.round(x[1]*.65):x[1]};
  });
  const m=v59Store();m.chest??={};m.chest[todayKey()]={week,exercises,date:todayKey()};saveState();renderV59();showToast('Séance pectoraux enregistrée');
 }catch(e){document.getElementById('v59ChestFeedback').textContent=e.message;}
});
document.getElementById('v59CoreChecks').innerHTML=v59Core.map((name,i)=>`<label style="display:block"><input id="v59Core${i}" type="checkbox"> ${name} · 2 séries réalisées</label>`).join('');
document.getElementById('v59SaveCore').addEventListener('click',()=>{const m=v59Store();m.core??={};m.core[todayKey()]=v59Core.map((name,i)=>({name,done:document.getElementById('v59Core'+i).checked,sets:2}));saveState();document.getElementById('v59CoreFeedback').textContent='Travail abdominal enregistré';});
document.getElementById('v59SleepForm').addEventListener('submit',event=>{
 event.preventDefault();try{const hours=v59Number('v59Hours',0,24),awakenings=v59Number('v59Awakenings',0,30),urinations=v59Number('v59Urinations',0,30);if(!Number.isInteger(awakenings)||!Number.isInteger(urinations)||urinations>awakenings)throw Error('Vérifier le nombre de réveils et de levers');const m=v59Store();m.nights??={};m.nights[todayKey()]={hours,awakenings,urinations,tired:document.getElementById('v59Tired').checked,snoring:document.getElementById('v59Snoring').value};saveState();renderV59();renderAdaptiveRecommendation();renderMuscleDashboard();}catch(e){document.getElementById('v59RecoveryAdvice').textContent=e.message;}
});
document.getElementById('v59Week').addEventListener('change',()=>{v59Store().week=+document.getElementById('v59Week').value;saveState();renderV59();});
document.querySelectorAll('.tab').forEach(tab=>tab.addEventListener('click',renderV59));
document.getElementById('v59Week').value=state.v59?.week||1;
const night=state.v59?.nights?.[todayKey()];if(night){for(const[k,id]of Object.entries({hours:'v59Hours',awakenings:'v59Awakenings',urinations:'v59Urinations',snoring:'v59Snoring'}))document.getElementById(id).value=night[k];document.getElementById('v59Tired').checked=night.tired;}
const core=state.v59?.core?.[todayKey()];if(core)core.forEach((x,i)=>{const e=document.getElementById('v59Core'+i);if(e)e.checked=x.done;});
const session=state.v59?.chest?.[todayKey()];if(session)session.exercises.forEach((x,i)=>{for(const[k,id]of Object.entries({load:'v59Load',reps:'v59Reps',rir:'v59Rir'}))document.getElementById(id+i).value=x[k];document.getElementById('v59Pain'+i).checked=x.pain;});
renderV59();

document.getElementById('v59NutritionForm').addEventListener('submit',event=>{
 event.preventDefault();try{const protein=v59Number('v59Protein',0,500),lunch=v59Number('v59CarbLunch',0,500),snack=v59Number('v59CarbSnack',0,500),dinner=v59Number('v59CarbDinner',0,500);const m=v59Store();m.nutrition??={};m.nutrition[todayKey()]={protein,lunch,snack,dinner,eggs:document.getElementById('v59Eggs').checked};saveState();renderV59Nutrition();}catch(e){document.getElementById('v59NutritionFeedback').textContent=e.message;}
});
function renderV59Nutrition(){const n=state.v59?.nutrition?.[todayKey()];if(!n)return;for(const[k,id]of Object.entries({protein:'v59Protein',lunch:'v59CarbLunch',snack:'v59CarbSnack',dinner:'v59CarbDinner'}))document.getElementById(id).value=n[k];document.getElementById('v59Eggs').checked=n.eggs;document.getElementById('v59NutritionFeedback').textContent=`Enregistré : ${n.protein} g de protéines (${n.protein>=130&&n.protein<=165?'dans le repère 130–165 g':'hors du repère 130–165 g'}) · ${n.lunch+n.snack+n.dinner} g de glucides répartis déjeuner / collation / dîner. Les autres repas ne sont pas inclus dans ce total.`;}
renderV59Nutrition();
