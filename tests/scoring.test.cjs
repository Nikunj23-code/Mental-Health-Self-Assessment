const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../lib/clinical/scoring.ts'), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const exportsObj = {};
new Function('exports','require','module',js)(exportsObj,require,{exports:exportsObj});
const {calculatePHQ9,calculateGAD7} = exportsObj;
function answers(prefix,n,total){
 const out = {}; let remaining=total;
 for(let i=1;i<=n;i++){const v=Math.min(3,remaining);out[prefix+'_q'+i]=v;remaining-=v;}
 return out;
}
for(const [score,expected] of [[0,'minimal'],[4,'minimal'],[5,'mild'],[9,'mild'],[10,'moderate'],[14,'moderate'],[15,'moderately_severe'],[19,'moderately_severe'],[20,'severe'],[27,'severe']]){
 test('PHQ-9 score '+score+' -> '+expected,()=>{
  const out=calculatePHQ9(answers('phq9',9,score));
  assert.equal(out.totalScore,score);
  assert.equal(out.severity,expected);
 });
}
for(const [score,expected] of [[0,'minimal'],[4,'minimal'],[5,'mild'],[9,'mild'],[10,'moderate'],[14,'moderate'],[15,'severe'],[21,'severe']]){
 test('GAD-7 score '+score+' -> '+expected,()=>{
  const out=calculateGAD7(answers('gad7',7,score));
  assert.equal(out.totalScore,score);
  assert.equal(out.severity,expected);
 });
}
test('PHQ-9 item 9 nonzero flags safety irrespective of total score',()=>{
 const res=answers('phq9',9,0);res.phq9_q9=1;
 assert.equal(calculatePHQ9(res).hasCrisisFlag,true);
 res.phq9_q9=0;
 assert.equal(calculatePHQ9(res).hasCrisisFlag,false);
});
test('GAD-7 never sets an item 9 crisis flag',()=>{
 assert.equal(calculateGAD7(answers('gad7',7,21)).hasCrisisFlag,false);
});
