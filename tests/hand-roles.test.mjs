import {test} from 'node:test';import assert from 'node:assert/strict';
import {createHandRoleTracker} from '../hand-roles.js';
const hand=x=>Array.from({length:21},()=>({x,y:.5}));const label=s=>[{categoryName:s}];
test('first arriving hand controls opening regardless of handedness or detector order',()=>{
 const t=createHandRoleTracker();let r=t.update([hand(.2)],[label('Left')],0);assert.equal(r.control.index,0);assert.equal(r.switcher,null);
 r=t.update([hand(.8),hand(.22)],[label('Right'),label('Left')],100);assert.equal(r.control.index,1);assert.equal(r.switcher.index,0);
 r=t.update([hand(.24),hand(.78)],[label('Left'),label('Right')],200);assert.equal(r.control.index,0);assert.equal(r.switcher.index,1);
});
test('losing the first hand never promotes the second; returning restores its role',()=>{
 const t=createHandRoleTracker();t.update([hand(.2)],[label('Right')],0);t.update([hand(.2),hand(.8)],[label('Right'),label('Left')],100);
 let r=t.update([hand(.8)],[label('Left')],200);assert.equal(r.control,null);assert.equal(r.switcher.index,0);
 r=t.update([hand(.7),hand(.3)],[label('Left'),label('Right')],800);assert.equal(r.control.index,1);assert.equal(r.switcher.index,0);
});
test('a second hand arriving after the first leaves keeps a separate role',()=>{
 const t=createHandRoleTracker();t.update([hand(.2)],[label('Left')],0);const r=t.update([hand(.8)],[label('Right')],700);assert.equal(r.control,null);assert.equal(r.switcher.index,0);
});
test('handedness flicker does not change a nearby hand role; reset allows reassignment',()=>{
 const t=createHandRoleTracker();t.update([hand(.2)],[label('Left')],0);let r=t.update([hand(.22)],[label('Right')],100);assert.equal(r.control.id,'first');assert.equal(r.switcher,null);
 t.reset();r=t.update([hand(.8)],[label('Right')],200);assert.equal(r.control.id,'first');
});
test('simultaneous arrival asks for a single first hand',()=>{
 const t=createHandRoleTracker();assert.equal(t.update([hand(.2),hand(.8)],[label('Left'),label('Right')],0).needsFirst,true);
});

test('the same hand can start a new round from the other side of the camera',()=>{
 const t=createHandRoleTracker();t.update([hand(.05)],[label('Left')],0);t.update([],[],1000);
 const r=t.update([hand(.95)],[label('Left')],2500);assert.equal(r.control.id,'first');assert.equal(r.switcher,null);
});

test('a fast second hand remains the switcher when its handedness label flickers',()=>{
 const t=createHandRoleTracker();t.update([hand(.2)],[label('Left')],0);
 t.update([hand(.2),hand(.8)],[label('Left'),label('Right')],85);
 const r=t.update([hand(.2),hand(.55)],[label('Left'),label('Left')],170);
 assert.equal(r.control?.index,0);assert.equal(r.switcher?.index,1);
});

test('lowering both hands starts a new round: the former switcher can control bloom',()=>{
 const t=createHandRoleTracker();
 t.update([hand(.2)],[label('Left')],0);
 t.update([hand(.2),hand(.8)],[label('Left'),label('Right')],100);
 t.update([],[],200);
 let r=t.update([],[],800);assert.equal(r.needsFirst,true);assert.deepEqual(r.assigned,[false,false]);assert.equal(r.sessionReset,true);
 r=t.update([hand(.8)],[label('Right')],900);assert.equal(r.control?.label,'Right');assert.equal(r.switcher,null);
 r=t.update([hand(.2),hand(.8)],[label('Left'),label('Right')],1000);assert.equal(r.control?.index,1);assert.equal(r.switcher?.index,0);
});
test('a short full-hand detection gap keeps roles, but a full pause resets on re-entry',()=>{
 const t=createHandRoleTracker();t.update([hand(.2)],[label('Left')],0);t.update([hand(.2),hand(.8)],[label('Left'),label('Right')],100);
 t.update([],[],200);let r=t.update([hand(.8)],[label('Right')],350);assert.equal(r.control,null);assert.equal(r.switcher?.index,0);
 t.update([],[],400);r=t.update([hand(.8)],[label('Right')],1100);assert.equal(r.control?.label,'Right');assert.equal(r.switcher,null);assert.equal(r.sessionReset,true);
});
test('both hands returning together after a pause asks for one hand first',()=>{
 const t=createHandRoleTracker();t.update([hand(.2)],[label('Left')],0);t.update([hand(.2),hand(.8)],[label('Left'),label('Right')],100);
 t.update([],[],200);const r=t.update([hand(.2),hand(.8)],[label('Left'),label('Right')],900);assert.equal(r.needsFirst,true);assert.equal(r.control,null);assert.equal(r.switcher,null);
});
