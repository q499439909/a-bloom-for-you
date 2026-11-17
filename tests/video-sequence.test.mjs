import {test} from 'node:test';import assert from 'node:assert/strict';
import {createVideoSequence,frameIndexAt} from '../video-sequence.js';
class Video extends EventTarget{
 constructor(){super();this.style={};this.readyState=4;this.currentTime=0;this.seeking=false;this.ended=false;this.seeks=[];}
 setAttribute(){}load(){}pause(){}async play(){this.dispatchEvent(new Event('playing'));}
}
const player=video=>createVideoSequence({url:'flower.mp4',count:169,createVideo:()=>video,mount:()=>{}});
test('bloom progress follows decoded media time and does not race ahead during network stalls',async()=>{
 const video=new Video(),sequence=player(video);await sequence.play();video.currentTime=1;
 const before=sequence.position;video.dispatchEvent(new Event('waiting'));
 for(let tick=0;tick<1000;tick++)assert.equal(sequence.position,before);
 assert.equal(sequence.buffering,true);video.currentTime=2;video.dispatchEvent(new Event('playing'));assert.ok(sequence.position>before);
});
test('every original frame remains addressable, including both endpoints',()=>{
 for(const count of [169,95]){const indices=Array.from({length:count},(_,n)=>frameIndexAt((n+.25)/30,count));assert.deepEqual(indices,Array.from({length:count},(_,n)=>n));}
});
test('gesture seeking waits for decoding and holds the previous canvas instead of substituting unrelated frames',()=>{
 const video=new Video(),sequence=player(video);sequence.seek(84);assert.equal(video.currentTime,84.25/30);
 video.seeking=true;assert.equal(sequence.frame,null);sequence.seek(120);assert.equal(video.currentTime,84.25/30);
 video.seeking=false;assert.equal(sequence.frame.index,84);sequence.seek(120);assert.equal(video.currentTime,120.25/30);
});
test('cancelling while loading prevents a delayed play request from restarting',async()=>{
 const video=new Video();video.readyState=0;let played=0;video.play=async()=>{played++;};const sequence=player(video);
 const promise=sequence.play();sequence.pause();video.readyState=4;video.dispatchEvent(new Event('loadeddata'));
 await assert.rejects(promise,{name:'AbortError'});assert.equal(played,0);
});

test('the first flower exposes readiness before background model downloads begin',async()=>{
 const video=new Video();video.readyState=0;const sequence=player(video);let ready=false;
 const preparation=sequence.ready().then(()=>{ready=true;});
 await Promise.resolve();assert.equal(ready,false);
 video.readyState=2;video.dispatchEvent(new Event('loadeddata'));await preparation;assert.equal(ready,true);
});

test('a stalled first video does not hold model preparation indefinitely',async()=>{
 const video=new Video();video.readyState=0;const sequence=player(video);
 await assert.rejects(sequence.ready({timeoutMs:5}),/加载超时/);
});
