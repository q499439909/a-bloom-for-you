// Minimal fixture decoder: non-interlaced 8-bit RGB/RGBA PNG, using only Node built-ins.
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
export function decodePNG(bytes){
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20),type=bytes[25];
 assert.equal(bytes[24],8);assert.equal(bytes[28],0);assert.ok(type===2||type===6);
 const channels=type===6?4:3,stride=width*channels,chunks=[];
 for(let at=8;at<bytes.length;){const size=bytes.readUInt32BE(at);if(bytes.toString('ascii',at+4,at+8)==='IDAT')chunks.push(bytes.subarray(at+8,at+8+size));at+=size+12;}
 const packed=inflateSync(Buffer.concat(chunks));assert.equal(packed.length,(stride+1)*height);
 const rows=new Uint8Array(stride*height),rgba=new Uint8ClampedArray(width*height*4);
 const paeth=(a,b,c)=>{const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);return da<=db&&da<=dc?a:db<=dc?b:c;};
 for(let y=0;y<height;y++){
  const filter=packed[y*(stride+1)];assert.ok(filter<=4);
  for(let x=0;x<stride;x++){
   const left=x>=channels?rows[y*stride+x-channels]:0,up=y?rows[(y-1)*stride+x]:0,corner=y&&x>=channels?rows[(y-1)*stride+x-channels]:0;
   const prediction=filter===0?0:filter===1?left:filter===2?up:filter===3?Math.floor((left+up)/2):paeth(left,up,corner);
   rows[y*stride+x]=(packed[y*(stride+1)+x+1]+prediction)&255;
  }
 }
 for(let i=0;i<width*height;i++){rgba.set(rows.subarray(i*channels,i*channels+3),i*4);rgba[i*4+3]=channels===4?rows[i*channels+3]:255;}
 return {width,height,data:rgba};
}
