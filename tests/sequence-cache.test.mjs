import {test} from 'node:test';import assert from 'node:assert/strict';
import {createSequenceCache} from '../sequence-cache.js';
const settle=()=>new Promise(r=>setTimeout(r,35));
test('decoded frames stay bounded, eviction releases images, and evicted frames can reload',async()=>{
 let running=0,maximum=0,closed=0;const loads=[];
 const cache=createSequenceCache({capacity:3,concurrency:2,load:async url=>{running++;maximum=Math.max(maximum,running);loads.push(url);await new Promise(r=>setTimeout(r,1));running--;return {url,close(){closed++;}};}});
 cache.request(Array.from({length:10},(_,i)=>String(i)));await settle();
 assert.ok(maximum<=2);assert.equal(closed,7);assert.equal(cache.get('0'),null);assert.equal(cache.get('9').url,'9');
 cache.request(['0']);await settle();assert.equal(cache.get('0').url,'0');assert.equal(loads.filter(v=>v==='0').length,2);
});
