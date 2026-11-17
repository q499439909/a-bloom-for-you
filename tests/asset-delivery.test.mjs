import {test} from 'node:test';import assert from 'node:assert/strict';import {gzipSync} from 'node:zlib';
import {createAssetDelivery,inflateGzip,DELIVERY_MIRROR} from '../asset-delivery.js';
test('the backup model route is pinned inside this repository',()=>{
 assert.equal(DELIVERY_MIRROR,'https://cdn.jsdelivr.net/gh/q499439909/a-bloom-for-you@models-v1/');
});
const options={baseURL:'https://origin.test/',mirrorURL:'https://mirror.test/',hedgeMs:5,timeoutMs:1000};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
test('slow origin is bypassed by a fast mirror and the losing download is cancelled',async()=>{
 const cancelled=[];const fetchImpl=(url,{signal})=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>resolve(new Response(new Uint8Array([1,2,3]))),url.includes('origin')?100:1);signal.addEventListener('abort',()=>{clearTimeout(timer);cancelled.push(url);reject(new Error('aborted'));});});
 const bytes=await createAssetDelivery({...options,fetchImpl}).read('model');assert.deepEqual([...bytes],[1,2,3]);assert.ok(cancelled.some(url=>url.includes('origin')));
});
test('a cached model is reused without contacting either network route',async()=>{
 const storage=new Map();const cache={match:async key=>storage.get(key)?.clone(),put:async(key,value)=>{storage.set(key,value);},delete:async key=>storage.delete(key)};let requests=0;
 const delivery=createAssetDelivery({...options,cacheStorage:{open:async()=>cache},fetchImpl:async()=>{requests++;return new Response(new Uint8Array([4,5]));}});
 await delivery.read('model');await wait(0);await delivery.read('model');assert.equal(requests,1);
});
test('an error page cannot be mistaken for or cached as a compressed model',async()=>{
 const good=gzipSync('model');const delivery=createAssetDelivery({...options,fetchImpl:async url=>new Response(url.includes('origin')?'error page':good)});
 assert.equal(new TextDecoder().decode(await inflateGzip(await delivery.read('model.gz'))),'model');
});
test('both routes failing rejects promptly instead of leaving preparation stuck',async()=>{
 const delivery=createAssetDelivery({...options,fetchImpl:async()=>new Response('not found',{status:404})});await assert.rejects(delivery.read('model'),/404/);
});
