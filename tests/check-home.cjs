const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('hec-home.js','utf8');const storage=new Map();let fail=false,next=0,events=0;
function load(){const context={window:{dispatchEvent(){events++}},document:{readyState:'loading',addEventListener(){}},crypto:{randomUUID:()=>String(++next)},localStorage:{getItem:key=>storage.get(key)||null,setItem(key,value){if(fail)throw Error('Quota full');storage.set(key,value)}},Event};vm.runInNewContext(source,context);return context.window.HECHome}
let api=load();assert.equal(api.exportData().rooms.length,0);
const room=api.saveRoom({name:'Main Bathroom',unit:'ft',length:8,width:10,height:8,openings:[{type:'Door',width:3,height:7,count:1},{type:'Window',width:2,height:3,count:1}],notes:'Sample measurements'});
const saved=api.exportData().rooms[0],areas=api.areas(saved);assert.equal(areas.floor,80);assert.equal(areas.grossWalls,288);assert.equal(areas.openings,27);assert.equal(areas.netWalls,261);
api.saveProject({roomId:room,name:'Paint bathroom',job:'Painting',status:'Planned',notes:'Test plan'});api=load();assert.equal(api.exportData().rooms[0].name,'Main Bathroom');assert.equal(api.exportData().projects[0].roomId,room);
api.saveRoom({...saved,length:9});assert.equal(api.areas(api.exportData().rooms[0]).floor,90);assert.equal(api.exportData().projects.length,1);
api.archiveRoom(room,true);assert.equal(api.exportData().rooms[0].archived,true);assert.equal(api.exportData().projects.length,1);api.archiveRoom(room,false);
for(const bad of [0,-1,Infinity,'bad'])assert.throws(()=>api.saveRoom({...saved,width:bad}));
assert.throws(()=>api.saveRoom({...saved,unit:'yards'}));assert.throws(()=>api.saveProject({roomId:'missing',name:'Invalid',job:'Painting',status:'Planned'}));assert.throws(()=>api.validate({...api.exportData(),rooms:[saved,saved]}));assert.throws(()=>api.saveRoom({...saved,openings:[{type:'Door',width:100,height:100,count:1}]}));
const before=JSON.stringify(api.exportData());fail=true;assert.throws(()=>api.saveRoom({...saved,name:'Should not save'}),/Quota/);assert.equal(JSON.stringify(api.exportData()),before);fail=false;
const backup=JSON.parse(JSON.stringify(api.exportData()));assert.equal(api.validate(backup).projects[0].name,'Paint bathroom');assert.ok(events>0);
console.log('Rooms/projects: measurements, reload, editing, archive, invalid input and quota safety passed');

const settings={coverage:350,coats:2,container:1,extra:10,volume:'gal',ceiling:false};
const estimate=api.paintEstimate(saved,settings);assert.equal(estimate.surface,261);assert.equal(estimate.containers,2);assert.ok(Math.abs(estimate.quantity-1.64057142857)<1e-8);
assert.equal(api.paintEstimate(saved,{...settings,ceiling:true}).surface,341);
assert.equal(api.paintEstimate(saved,{...settings,coverage:261,coats:1,extra:0}).containers,1);
assert.throws(()=>api.paintEstimate(saved,{...settings,coverage:0}));assert.throws(()=>api.paintEstimate(saved,{...settings,coats:1.5}));assert.throws(()=>api.paintEstimate(saved,{...settings,extra:-1}));
const project=api.exportData().projects[0];api.saveProject({...project,paint:settings});api=load();assert.equal(api.exportData().projects[0].paint.coverage,350);assert.equal(api.validate(api.exportData()).projects[0].paint.coats,2);
console.log('Paint calculations, rounding, validation and settings backup/reload passed');

const board={width:4,length:8,extra:10,ceiling:false};assert.equal(api.drywallEstimate(saved,board).sheets,9);assert.equal(api.drywallEstimate(saved,{...board,ceiling:true}).sheets,12);assert.throws(()=>api.drywallEstimate(saved,{...board,width:0}));
api.saveProject({...api.exportData().projects[0],drywall:board});api=load();assert.equal(api.exportData().projects[0].drywall.width,4);
const matches=api.toolMatches('Drywall',[{name:'Cordless drill'},{name:'Old drill',archived:true},{name:'Drill',loanedTo:'Alex'},{name:'Impact driver'}]);const drills=matches.find(x=>x.name==='Drill or screw gun');assert.equal(drills.matches.length,2);assert.equal(drills.matches[1].loanedTo,'Alex');assert.equal(api.toolMatches('Other',[]).length,0);
console.log('Drywall area estimates, backup persistence, archived exclusion and loan-aware tool matching passed');

const shops=api.retailerLinks('drill & driver #1');assert.equal(shops.length,4);assert.ok(shops.every(x=>new URL(x.url).protocol==='https:'));assert.ok(shops[0].url.includes('drill%20%26%20driver%20%231'));assert.equal(api.retailerLinks('').length,0);assert.equal(api.retailerLinks('drywall',['homeDepot','lowes']).length,2);assert.equal(api.retailerLinks('test',['bad']).length,0);
console.log('Retailer allowlist, query encoding, empty searches and store filtering passed');
