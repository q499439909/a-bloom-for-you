import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pinchRatio,drawTracking} from '../tracking.js';
const points=()=>Array.from({length:21},()=>({x:.5,y:.5}));
test('pinch distance closes at touching tips and is independent of hand size',()=>{
 const p=points();p[0]={x:.5,y:.8};p[9]={x:.5,y:.5};p[4]={x:.35,y:.3};p[8]={x:.65,y:.3};
 const ratio=pinchRatio(p,640,480);assert.ok(ratio>1);
 const smaller=p.map(({x,y})=>({x:.5+(x-.5)*.5,y:.5+(y-.5)*.5}));assert.ok(Math.abs(pinchRatio(smaller,640,480)-ratio)<1e-10);
 const highResolution=pinchRatio(p,1280,960);assert.equal(highResolution,ratio);
 p[8]={...p[4]};assert.equal(pinchRatio(p,640,480),0);
});
test('overlay mirrors video coordinates and clears absent detections',()=>{
 const arcs=[],clears=[];const c={clearRect:(...a)=>clears.push(a),beginPath(){},setLineDash(){},moveTo(){},lineTo(){},stroke(){},arc:(...a)=>arcs.push(a),fill(){},strokeText(){},fillText(){}};
 const surface={width:640,height:480,getContext:()=>c},p=points();p[4]={x:.2,y:.3};
 drawTracking(surface,p,'hand',640,480);assert.ok(arcs.some(([x,y])=>x===512&&y===144));
 drawTracking(surface,null,'hand',640,480);assert.equal(clears.length,2);
});
