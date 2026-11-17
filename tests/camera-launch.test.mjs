import {test} from 'node:test';import assert from 'node:assert/strict';
import {launchCamera} from '../camera-launch.js';
test('previously granted permission starts camera without a second-page click',async()=>{
 let started=0,prompted=0;const result=await launchCamera({queryPermission:async()=> 'granted',start:async()=>{started++;return true;},showConsent:()=>prompted++});
 assert.equal(result,true);assert.equal(started,1);assert.equal(prompted,0);
});
for(const permission of ['prompt','denied'])test(`${permission} permission shows consent without accessing camera first`,async()=>{
 let started=0,reason;await launchCamera({queryPermission:async()=>permission,start:async()=>started++,showConsent:r=>reason=r});
 assert.equal(started,0);assert.equal(reason,permission);
});
test('unsupported permission query falls back to the consent dialog',async()=>{
 let started=0,reason;await launchCamera({queryPermission:async()=>{throw Error('unsupported');},start:async()=>started++,showConsent:r=>reason=r});
 assert.equal(started,0);assert.equal(reason,'prompt');
});
