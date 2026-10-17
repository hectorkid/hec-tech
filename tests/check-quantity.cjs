const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');const c={window:{}};vm.runInNewContext(fs.readFileSync('hec-quantity.js','utf8'),c);const q=c.window.HECQuantity;
assert.equal(q.label({}),'Qty: 1');assert.equal(q.label({quantity:2}),'Qty: 2');
const form=v=>({get:k=>v[k]??null});const full=q.readForm(form({quantity:'2',packaged:'on',packageUnit:'box',perPackage:'100',packageContents:'screws',packageRemaining:''}));
assert.equal(q.label(full),'2 boxes · 200 screws total');const opened=q.readForm(form({quantity:'2',packaged:'on',packageUnit:'box',perPackage:'100',packageContents:'screws',packageRemaining:'137'}));assert.equal(q.label(opened),'2 boxes · 137 screws remaining');
assert.equal(q.label({...opened,packageInfo:{...opened.packageInfo,remaining:0}}),'2 boxes · 0 screws remaining');
for(const values of [{quantity:'0'},{quantity:'1.5'},{quantity:'bad'},{quantity:'2',packaged:'on',packageUnit:'box',perPackage:'0'},{quantity:'2',packaged:'on',packageUnit:'box',perPackage:'100',packageRemaining:'201'}])assert.throws(()=>q.readForm(form(values)));
assert.equal(q.readForm(form({quantity:'2'})).packageInfo,null);assert.equal(q.label(JSON.parse(JSON.stringify(opened))),q.label(opened));assert.ok(!q.badge({quantity:1,packageInfo:{unit:'box',perPackage:1,contents:'<img>'}}).includes('<img>'));
console.log('Quantity: singles, packages, opened/empty totals, validation, backup serialization and escaping passed');

for(const [f,text] of [[1,'1 box'],[.75,'¾ box left'],[.5,'½ box left'],[.25,'¼ box left'],[0,'Empty box']]){const x=q.readForm(form({quantity:'1',packaged:'on',packageUnit:'box',perPackage:'1190',amountMode:'approx',fractionLeft:String(f)}));assert.equal(q.label(x),text);assert.equal(q.label(JSON.parse(JSON.stringify(x))),text);}
assert.equal(q.label({quantity:3,packageInfo:{unit:'box',perPackage:100,amountMode:'approx',fractionLeft:.5}}),'2 full boxes + ½ box');
assert.throws(()=>q.readForm(form({quantity:'1',packaged:'on',packageUnit:'box',perPackage:'100',amountMode:'approx',fractionLeft:'.3'})));
