import {test} from 'node:test';import assert from 'node:assert/strict';
import {BLOOM_HOLD_MS} from '../bloom-experience.js';
import {bloomGlowEffect,bloomProgressFeedback} from '../bloom-feedback.js';
test('glow stays bright through the whole bloom hold, then fades out',()=>{
 const {keyframes,options}=bloomGlowEffect();
 const peak=Math.max(...keyframes.map(f=>f.opacity));
 const bright=keyframes.filter(f=>f.opacity===peak);
 assert.ok(bright[0].offset*options.duration<=500);
 assert.equal(bright.at(-1).offset*options.duration,BLOOM_HOLD_MS);
 assert.ok(options.duration>BLOOM_HOLD_MS);assert.equal(keyframes.at(-1).opacity,0);
 assert.equal(options.easing,'linear');
});
test('100 percent means the last decoded frame, even in a long sequence',()=>{
 for(const count of [95,169,500]){
  assert.equal(bloomProgressFeedback(-2,count,'waiting').percent,0);
  assert.ok(bloomProgressFeedback(count-2,count,'interactive').percent<100);
  assert.equal(bloomProgressFeedback(count-1,count,'holding').percent,100);
 }
});
test('the progress note guides the reveal, then acknowledges delivery',()=>{
 assert.equal(bloomProgressFeedback(0,169,'waiting').note,'盛放时，祝福显现');
 assert.equal(bloomProgressFeedback(160,169,'finishing').note,'将绽 · 保持片刻');
 assert.equal(bloomProgressFeedback(168,169,'holding').note,'为你盛放');
 assert.equal(bloomProgressFeedback(20,169,'revealed').note,'祝福已送达');
});
