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
