import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSwipeDetector,isOpenPalm} from '../swipe.js';
const point=(x,time,extra={})=>({x,y:.5,time,id:'second',open:true,...extra});
const arm=(d,time=0,x=.4)=>{assert.equal(d.update(point(x,time)).state,'arming');assert.equal(d.update(point(x,time+240)).state,'ready');};
test('preparation is visible before smaller horizontal movements switch once',()=>{
 const d=createSwipeDetector();arm(d);
 const r=d.update(point(.55,400));assert.equal(r.state,'switched');assert.equal(r.direction,1);
 assert.equal(d.update(point(.2,600)).state,'cooldown');
 assert.equal(d.update(point(.2,900)).state,'cooldown');
 arm(d,1300,.6);assert.equal(d.update(point(.45,1700)).direction,-1);
});
test('early movement, closed palm, vertical motion and missing hands do not switch',()=>{
 const d=createSwipeDetector();assert.equal(d.update(point(.2,0)).direction,0);assert.equal(d.update(point(.5,100)).direction,0);
 assert.equal(d.update(point(.6,300,{open:false})).state,'open');
 arm(d,400);assert.equal(d.update(point(.7,800,{y:.9})).direction,0);
 assert.equal(d.update(point(.8,1200,{present:false})).state,'waiting');
 assert.equal(d.update(point(.3,1300,{id:'new-hand'})).state,'arming');
});
test('a brief palm-classifier flicker does not cancel readiness',()=>{
 const d=createSwipeDetector();arm(d);assert.equal(d.update(point(.4,320,{open:false})).state,'ready');assert.equal(d.update(point(.55,400)).direction,1);
});
test('the dedicated switch hand accepts a relaxed thumb, while a fist stays unready',()=>{
 const p=Array.from({length:21},()=>({x:.5,y:.5}));p[0]={x:.5,y:.9};p[9]={x:.5,y:.6};
 for(const i of [8,12,16,20]){p[i]={x:.5,y:.1};p[i-2]={x:.5,y:.5};}
 p[4]={x:.51,y:.12};assert.equal(isOpenPalm(p,640,480),true);
 const mirrored=p.map(({x,y})=>({x:1-x,y}));assert.equal(isOpenPalm(mirrored,640,480),true);
 for(const i of [8,12,16,20])p[i]={x:.5,y:.65};assert.equal(isOpenPalm(p,640,480),false);
});

test('one missed camera detection during preparation does not restart the whole wait',()=>{
 const d=createSwipeDetector();d.update(point(.4,0));d.update(point(.4,85));
 d.update(point(.4,170,{present:false}));
 assert.equal(d.update(point(.4,255)).state,'ready');
 assert.equal(d.update(point(.55,340)).direction,1);
});
