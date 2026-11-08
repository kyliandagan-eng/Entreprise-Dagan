const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const {spawn}=require('child_process');
const ROOT=__dirname;const mode=process.argv[2];
(async()=>{
 const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
 p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.route('http://local/**',r=>{const f=path.join(ROOT,decodeURIComponent(new URL(r.request().url()).pathname));const ext=path.extname(f);const ct={'.html':'text/html','.js':'text/javascript','.woff2':'font/woff2'}[ext]||'application/octet-stream';try{r.fulfill({body:fs.readFileSync(f),contentType:ct})}catch(e){r.fulfill({status:404})}});
 await p.goto('http://local/index.html');await p.waitForFunction(()=>window.ready===true,null,{timeout:60000});
 if(mode==='stills'){fs.mkdirSync(ROOT+'/stills',{recursive:true});for(const s of process.argv.slice(3)){const t=+s;await p.evaluate(t=>renderAt(t),t);await p.screenshot({path:`${ROOT}/stills/s_${s}.png`});}await b.close();return;}
 const out=process.argv[3];const N=Math.round(36.6*30);const from=+(process.argv[4]||0),to=+(process.argv[5]||N);
 const ff=spawn('ffmpeg',['-v','error','-y','-f','image2pipe','-framerate','30','-c:v','png','-i','-','-c:v','libx264','-preset','slow','-crf','14','-pix_fmt','yuv420p','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709',out],{stdio:['pipe','inherit','inherit']});
 const t0=Date.now();
 for(let i=from;i<to;i++){await p.evaluate(t=>renderAt(t),i/30);const buf=await p.screenshot({type:'png'});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));if(i%60==0)console.log('frame',i,((Date.now()-t0)/1000).toFixed(0)+'s');}
 ff.stdin.end();await new Promise(r=>ff.on('close',r));await b.close();
})();
