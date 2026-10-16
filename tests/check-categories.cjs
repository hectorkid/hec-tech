const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('hec-v3.js','utf8');const start=source.indexOf('function hecCategoryForItem(');const end=source.indexOf('function ready',start);
const classify=vm.runInNewContext(source.slice(start,end)+';hecCategoryForItem');
for(const [item,expected] of [
 [{name:'Milwaukee Hammer Drill',category:'Power Tools'},'Power Tools'],
 [{name:'Cordless Hammer Drill',category:'Tools'},'Power Tools'],
 [{name:'Rotary Hammer'},'Power Tools'],
 [{name:'Milwaukee Claw Hammer',category:'Hand Tools'},'Hand Tools'],
 [{name:'Milwaukee Pliers',category:'Tools',brand:'Milwaukee'},'Hand Tools'],
 [{name:'Milwaukee Ratchet',category:'Power Tools'},'Power Tools'],
 [{name:'Milwaukee Bottle',brand:'Milwaukee'},'Other'],
 [{name:'Vehicle drill',category:'Power Tools'},'Power Tools'],
 [{name:'Wireless Router',category:'Electronics'},'Home & Kitchen'],
 [{name:'Table Saw'},'Power Tools'],
 [{name:'Screwdriver'},'Hand Tools'],
 [{name:'Dehumidifier'},'Home & Kitchen']
])assert.equal(classify(item),expected,JSON.stringify(item));
const inventory=[{name:'Hammer Drill',category:'Power Tools'},{name:'Sander',category:'Power Tools'},{name:'Pliers',category:'Hand Tools'}];
const power=inventory.filter(x=>classify(x)==='Power Tools'),hand=inventory.filter(x=>classify(x)==='Hand Tools');assert.equal(power.length,2);assert.equal(hand.length,1);assert.ok(hand.every(x=>!power.includes(x)));
assert.equal((source.match(/const bucket=hecCategoryForItem/g)||[]).length,2,'Counts and category lists use identical rules');
console.log('Category precedence, power/hand separation and shared count/list rules passed');
