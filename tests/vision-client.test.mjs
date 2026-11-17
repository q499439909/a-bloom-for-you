import {test} from 'node:test';import assert from 'node:assert/strict';import {createVisionClient} from '../vision-client.js';
function installWorker(t){const previous=globalThis.Worker,workers=[];globalThis.Worker=class{constructor(){workers.push(this);this.terminated=false;}postMessage(value){this.sent=value;}terminate(){this.terminated=true;}reply(data){this.onmessage({data});}};t.after(()=>{globalThis.Worker=previous;});return workers;}
test('initialization progress is forwarded without completing the initialization request',async t=>{
 const workers=installWorker(t),progress=[];const client=createVisionClient({onProgress:value=>progress.push(value)});const pending=client.request('init',{mode:'hand'});const worker=workers[0];
 worker.reply({type:'progress',message:'下载手势模型…'});worker.reply({id:worker.sent.id,result:{ready:true}});assert.deepEqual(await pending,{ready:true});assert.deepEqual(progress,['下载手势模型…']);
});
test('a timed-out initialization discards the stuck worker so retry starts cleanly',async t=>{
 const workers=installWorker(t);t.mock.timers.enable({apis:['setTimeout']});const client=createVisionClient();
 const failure=assert.rejects(client.request('init',{mode:'hand'}),/超时/);t.mock.timers.tick(180001);await failure;assert.equal(workers[0].terminated,true);
 const retry=client.request('init',{mode:'hand'});assert.equal(workers.length,2);workers[1].reply({id:workers[1].sent.id,result:{ready:true}});assert.deepEqual(await retry,{ready:true});
});
test('camera start joins the existing background warm-up instead of initializing twice',async t=>{
 const workers=installWorker(t),client=createVisionClient();let requests=0;
 const first=client.request('init',{mode:'hand'}),worker=workers[0];const original=worker.postMessage.bind(worker);worker.postMessage=value=>{requests++;original(value);};
 const second=client.request('init',{mode:'hand'});
 worker.reply({id:1,result:{ready:true}});worker.reply({id:2,result:{ready:true}});await Promise.all([first,second]);assert.equal(first,second);assert.equal(requests,0);
});
