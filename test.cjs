const fs = require('fs'), vm = require('vm'), assert = require('assert');
const ww = fs.readFileSync(__dirname + '/Library.js', 'utf8');
const innerPath = __dirname + '/../review/inner.js';
const inner = fs.existsSync(innerPath) ? fs.readFileSync(innerPath, 'utf8') : null;
let tests = 0;
function fresh(){ return {state:{memory:{frontMemory:'KEEP',authorsNote:'KEEP NOTE'}},history:[],storyCards:[]}; }
function run(shared, hook, text, n=1, integrated=false, extra={}){
  const logs=[];
  const env={...shared,text,info:{actionCount:n,...(hook==='context'?{maxChars:12000,memoryLength:0}:{}),...extra},log:x=>logs.push(x)};
  env.addStoryCard=(keys,entry='',type='',title=keys,description='',options={})=>{const card={id:env.storyCards.length+1,keys,entry,type,title,description};env.storyCards.push(card);return options.returnCard?card:env.storyCards.length-1;};
  env.removeStoryCard=i=>env.storyCards.splice(i,1);
  env.updateStoryCard=(i,keys,entry,type)=>Object.assign(env.storyCards[i],{keys,entry,type});
  vm.createContext(env);
  const config=integrated?'\nMainSettings.InnerSelf.IMPORTANT_SCENARIO_CHARACTERS="Leah"; MainSettings.InnerSelf.THOUGHT_FORMATION_CHANCE_PER_TURN=100; MainSettings.InnerSelf.IS_THOUGHT_CHANCE_HALF_FOR_DO_SAY_STORY=false;\n':'';
  const wrapper=fs.readFileSync(__dirname+'/'+hook[0].toUpperCase()+hook.slice(1)+'.js','utf8');
  const result=vm.runInContext((integrated?inner+'\n':'')+config+ww+'\n'+wrapper+'\n'+(integrated?"InnerSelf('"+hook+"');\n":'')+'modifier(text);',env,{timeout:2000});
  return {result,logs,env};
}
function check(name, fn){ fn(); tests++; console.log('PASS '+name); }

check('time advances after 20 actions, not 11',()=>{const s=fresh();run(s,'input','It is morning.',0);for(let n=1;n<=19;n++)run(s,'input','> You continue.',n);assert.equal(s.state.WorldImmersionV2.time,'morning');assert.equal(s.state.WorldImmersionV2.ticks,19);run(s,'input','> You continue.',20);assert.equal(s.state.WorldImmersionV2.time,'noon');assert.equal(s.state.WorldImmersionV2.ticks,0);});
check('duplicate input does not double count',()=>{const s=fresh();run(s,'input','It is dawn.',0);run(s,'input','Wait.',1);run(s,'input','Wait.',1);assert.equal(s.state.WorldImmersionV2.ticks,1);});
check('explicit story time overrides clock',()=>{const s=fresh();run(s,'input','It is morning.',0);for(let n=1;n<10;n++)run(s,'input','Wait.',n);run(s,'input','It is midnight.',10);assert.equal(s.state.WorldImmersionV2.time,'midnight');assert.equal(s.state.WorldImmersionV2.ticks,0);});
check('questions, quotes and past tense do not set time',()=>{for(const t of ['It is midnight?','It was noon.','"It is night."','If it is morning, we leave.']){const s=fresh();run(s,'input',t,1);assert.equal(s.state.WorldImmersionV2.time,null,t);}});
check('quiet context turns are byte-for-byte unchanged',()=>{const s=fresh(),t='Memory\nRecent story.\n> You walk.';assert.equal(run(s,'context',t,1).result.text,t);});
check('short cue rotates every two counted actions',()=>{const s=fresh(),ids=[],lengths=[];for(let n=1;n<=8;n++){const t=run(s,'context','Story.',n).result.text;const m=t.match(/Cue: (Sight|Sound|Scent|Touch)/);if(m){ids.push(m[1]);lengths.push((t.match(/\[WW_SCENE_GUIDANCE_V29:[^\]]*\]/)||[''])[0].length);}}assert.deepEqual(ids,['Sight','Sound','Scent','Touch']);assert(lengths.every(n=>n<230));});
check('cue covers people, objects and places without a checklist',()=>{const s=fresh();run(s,'context','Story.',1);const t=run(s,'context','Story.',2).result.text;assert(t.includes('present person, object, or place'));assert(!t.includes('appearance, expression'));assert(!t.includes('Do not add'));});
check('retry is stable and does not advance rotation',()=>{const s=fresh();run(s,'context','Story.',1);const a=run(s,'context','Story.',2).result.text;const b=run(s,'context','Story.',2).result.text;assert.equal(a,b);assert.equal(s.state.WorldImmersionV2.sensoryPacing.length,2);});
check('budget skip preserves story and defers same sense',()=>{const s=fresh();run(s,'context','Story.',1);assert.equal(run(s,'context','Story.',2,false,{maxChars:6}).result.text,'Story.');assert(run(s,'context','Story.',3).result.text.includes('Cue: Sight'));});
check('memory boundary and original context are preserved',()=>{const s=fresh(),t='Memory\nStory\n> You ask.';run(s,'context',t,1,false,{memoryLength:6});const r=run(s,'context',t,2,false,{memoryLength:6}).result.text;assert.equal(r.slice(0,6),'Memory');assert.equal(r.replace(/\n\n\[WW_SCENE_GUIDANCE_V29:[^\]]*\]\n\n/,''),t);});
check('clock notice appears only on phase change',()=>{const s=fresh();run(s,'input','It is morning.',0);for(let n=1;n<=20;n++)run(s,'input','Wait.',n);const changed=run(s,'context','Story.',20).result.text;assert(changed.includes('shifted to noon'));assert(!run(s,'context','Story.',21).result.text.includes('Time has'));});
check('phase notice combines with due cue compactly',()=>{const s=fresh();run(s,'input','It is morning.',0);for(let n=1;n<=20;n++){run(s,'input','Wait.',n);run(s,'context','Story.',n);}const t=run(s,'context','Story.',20).result.text;assert(t.includes('Cue:'));assert(t.includes('shifted to noon'));assert((t.match(/\[WW_SCENE_GUIDANCE_V29:[^\]]*\]/)||[''])[0].length<=360);});
check('undo restores clock and notice state',()=>{const s=fresh();run(s,'input','It is morning.',0);for(let n=1;n<=20;n++)run(s,'input','Wait.',n);run(s,'input','Different branch.',10);assert.equal(s.state.WorldImmersionV2.time,'morning');assert.equal(s.state.WorldImmersionV2.ticks,10);assert(!s.state.WorldImmersionV2.timeNotice);});
check('ordinary output remains unchanged',()=>{for(const t of ['A [quiet] room.','(goal = `Stay calm.`) She smiles.','\n\u200B'])assert.equal(run(fresh(),'output',t).result.text,t);});
check('current and older leaked guidance is removed',()=>{assert.equal(run(fresh(),'output','[WW_SCENE_GUIDANCE_V29: Cue: Sight—brief.]\nLeah waits.').result.text,'Leah waits.');assert.equal(run(fresh(),'output','[WW_SCENE_GUIDANCE_V28: Private guidance.]\nStory.').result.text,'Story.');});
check('full context is never truncated',()=>{const s=fresh(),t='x'.repeat(12000);run(s,'context','Story.',1);assert.equal(run(s,'context',t,2).result.text,t);});
check('state and Inner Self memory remain separate',()=>{const s=fresh();s.state.WorldWeaver={legacy:true};run(s,'input','Wait.',1);run(s,'context','Story.',1);assert.deepEqual(s.state.WorldWeaver,{legacy:true});assert.equal(s.state.memory.frontMemory,'KEEP');assert.equal(s.state.memory.authorsNote,'KEEP NOTE');});
if(inner) check('Inner Self hooks coexist with World Immersion',()=>{const s=fresh();run(s,'input','You greet Leah.',1,true);s.history.push({type:'do',text:'> You greet Leah.'});run(s,'context','Leah sits nearby.\n> You greet Leah.',1,true);const c=run(s,'context','Leah sits nearby.\n> You greet Leah.',2,true);assert(c.result.text.includes('Cue: Sight'));const o=run(s,'output','(goal = `Greet my friend.`) Leah waves.',2,true);assert(o.result.text.includes('Leah waves.'));assert(!o.result.text.includes('goal ='));});
else console.log('SKIP Inner Self integration fixture (standalone checks still complete)');
check('long run stays bounded with 20-action phases',()=>{const s=fresh(),ids=[];run(s,'input','It is morning.',0);for(let n=1;n<=141;n++){run(s,'input','Continue.',n);const t=run(s,'context','Story.',n).result.text;const m=t.match(/Cue: (Sight|Sound|Scent|Touch)/);if(m)ids.push(m[1]);}assert.equal(ids.length,70);ids.forEach((x,i)=>assert.equal(x,['Sight','Sound','Scent','Touch'][i%4]));assert.equal(s.state.WorldImmersionV2.time,'morning');assert.equal(s.state.WorldImmersionV2.ticks,1);assert(s.state.WorldImmersionV2.checkpoints.length<=80);assert(s.state.WorldImmersionV2.sensoryPacing.length<=80);});

console.log(tests+' checks passed');
