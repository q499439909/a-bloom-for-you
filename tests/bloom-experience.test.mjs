import {test} from 'node:test';import assert from 'node:assert/strict';
import {createBloomExperience} from '../bloom-experience.js';
const tick=(b,t,value=1,progress=value,options={})=>{b.sample(value,t);return b.update({progress,time:t,...options});};
test('steady opening finishes the sequence before revealing, then holds for two seconds',()=>{
 const b=createBloomExperience();tick(b,0,1,.95);tick(b,250,1,.95);
 let s=tick(b,500,1,.96);assert.equal(s.phase,'finishing');assert.equal(s.target,1);assert.equal(s.revealed,false);
 s=tick(b,600,1,1);assert.equal(s.celebrate,true);assert.equal(s.holding,true);
 s=tick(b,850,0,1);assert.equal(s.target,1);assert.equal(s.celebrate,false);
 for(let t=1100;t<=2350;t+=250)tick(b,t,0,1);
 s=tick(b,2599,0,1);assert.equal(s.holding,true);
 s=tick(b,2600,0,1);assert.equal(s.released,true);assert.equal(s.target,0);assert.equal(s.revealed,true);
});
test('threshold jitter, missing tracking and background pauses do not count as a sustained opening',()=>{
 const b=createBloomExperience();tick(b,0,1,.96);tick(b,250,.8,.8);tick(b,500,1,.96);
 assert.equal(tick(b,750,1,.96).celebrate,false);
 b.clearInput();
 assert.equal(b.update({time:1300,progress:1}).phase,'interactive');
 tick(b,1500,1,1);assert.equal(tick(b,2500,1,1).celebrate,false);
});
test('slower camera inference still completes, but an explicit lost detection cancels qualification',()=>{
 const b=createBloomExperience();tick(b,0,1,.96);tick(b,450,1,.96);
 assert.equal(tick(b,900,1,1).celebrate,true);
 b.reset();tick(b,1000,1,1);b.clearInput();
 assert.equal(b.update({time:1500,progress:1}).celebrate,false);
});
test('completion happens once per round and the blessing survives closing and reopening',()=>{
 const b=createBloomExperience();tick(b,0);tick(b,250);assert.equal(tick(b,500).celebrate,true);
 tick(b,2600,0);tick(b,2850,0);tick(b,3100,1);tick(b,3350,1);
 const s=tick(b,3600,1);assert.equal(s.celebrate,false);assert.equal(s.revealed,true);
});
test('a new flower stays closed until a continuous neutral gesture rearms it',()=>{
 const b=createBloomExperience();b.reset({requireNeutral:true});
 assert.equal(tick(b,0,1).target,0);assert.equal(tick(b,250,1).waitingForNeutral,true);
 tick(b,500,0);assert.equal(tick(b,650,0).waitingForNeutral,true);
 assert.equal(tick(b,700,0).waitingForNeutral,false);assert.equal(tick(b,750,.6).target,.6);
 b.reset({requireNeutral:true});tick(b,1000,0);assert.equal(tick(b,2000,0).waitingForNeutral,true);
});
test('buffered playback cannot reveal early, while autoplay can finish without camera input',()=>{
 const b=createBloomExperience();b.update({time:0,progress:.96,autoplay:true});
 b.update({time:250,progress:.96,autoplay:true,allowCompletion:false});
 assert.equal(b.update({time:500,progress:1,autoplay:true,allowCompletion:false}).revealed,false);
 for(const t of [750,1000,1250])var s=b.update({time:t,progress:1,autoplay:true});
 assert.equal(s.celebrate,true);assert.equal(s.target,1);
});
test('replay and switching reset the blessing and cancel pending holds',()=>{
 const b=createBloomExperience();tick(b,0);tick(b,250);tick(b,500);assert.equal(b.revealed,true);
 b.reset();assert.equal(b.revealed,false);assert.equal(tick(b,750,0).holding,false);
 tick(b,1000);tick(b,1250);tick(b,1500);b.cancelHold();assert.equal(tick(b,1550,0).target,0);
});
