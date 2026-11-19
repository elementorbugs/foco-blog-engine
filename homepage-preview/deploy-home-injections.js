const fs=require('fs'),https=require('https'),{execFileSync}=require('child_process');
for(const l of fs.readFileSync('.env','utf8').split(/\r?\n/)){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
const {WP_HOST,WP_USER,WP_APP_PASSWORD}=process.env;const auth='Basic '+Buffer.from(WP_USER+':'+WP_APP_PASSWORD).toString('base64');
function rq(method,path,body,headers){return new Promise((res,rej)=>{const q=https.request({hostname:WP_HOST,path,method,headers:Object.assign({Authorization:auth},headers||{})},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res({s:r.statusCode,j:JSON.parse(d)})}catch(e){res({s:r.statusCode,j:d.slice(0,300)})}})});q.on('error',rej);if(body)q.write(body);q.end();});}
async function upload(file,name,type){const b=fs.readFileSync(file);const r=await rq('POST','/wp-json/wp/v2/media',b,{'Content-Type':type,'Content-Disposition':'attachment; filename="'+name+'"','Content-Length':b.length});if(r.s>=300)throw new Error('upload '+r.s+' '+JSON.stringify(r.j).slice(0,200));return r.j.source_url;}
(async()=>{
  const vid='https://www.tryfoco.com/wp-content/uploads/2026/11/foco-home-hero-woman.mp4';
  const pos='https://www.tryfoco.com/wp-content/uploads/2026/11/foco-home-hero-woman.jpg';
  console.log(vid,pos);
  const g=await rq('GET','/wp-json/wp/v2/pages/4760?context=edit');
  const raw=g.j.content.raw; fs.writeFileSync('homepage-backup/page-4760-2026-11-19-pre-proofcopy.html',raw);
  fs.writeFileSync('.tmp/hp/raw.html',raw);
  execFileSync('python',['homepage-preview/hero-video-inject.py',vid,pos,'.tmp/hp/raw.html','.tmp/hp/new0.html']);
  const DU='homepage-preview/done-url.txt'; let doneUrl=fs.existsSync(DU)?fs.readFileSync(DU,'utf8').trim():'';
  if(!doneUrl){doneUrl=await upload('.tmp/hp/livepv/foco-home-shot-done.jpg','foco-home-shot-done.jpg','image/jpeg');fs.writeFileSync(DU,doneUrl);console.log(doneUrl);}
  execFileSync('python',['homepage-preview/feature-opal-inject.py','.tmp/hp/new0.html','.tmp/hp/new1.html',doneUrl]);
  const PU='homepage-preview/pain-art-urls.json'; let pu=fs.existsSync(PU)?JSON.parse(fs.readFileSync(PU,'utf8')):null;
  if(!pu){pu=[];for(let i=1;i<=4;i++)pu.push(await upload('.tmp/hp/livepv/foco-pain-desk-'+i+'.png','foco-pain-desk-'+i+'.png','image/png'));fs.writeFileSync(PU,JSON.stringify(pu));console.log(pu);}
  execFileSync('python',['homepage-preview/pain-art-inject.py','.tmp/hp/new1.html','.tmp/hp/new2.html',...pu]);
  execFileSync('python',['homepage-preview/night-theme-inject.py','.tmp/hp/new2.html','.tmp/hp/new.html']);
  let nw=fs.readFileSync('.tmp/hp/new.html','utf8');
  if(!process.env.STEPS_URL && fs.existsSync('homepage-preview/steps-url.txt'))process.env.STEPS_URL=fs.readFileSync('homepage-preview/steps-url.txt','utf8').trim();
  if(!process.env.STEPS_URL){const st=await upload('.tmp/hp/livepv/foco-home-shot-steps-email2.jpg','foco-home-shot-steps-email2.jpg','image/jpeg');process.env.STEPS_URL=st;console.log(st);}
  nw=nw.replace(/https:\/\/www\.tryfoco\.com\/wp-content\/uploads\/20\d\d\/\d\d\/foco-home-shot-(plan|steps-email)[^"]*\.jpg" alt="[^"]*"/, process.env.STEPS_URL+'" alt="FOCO breaks Reply to important emails into five timed steps"'); if(nw===raw)throw new Error('no change');
  const body=JSON.stringify({content:nw});
  const p=await rq('POST','/wp-json/wp/v2/pages/4760',body,{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)});
  console.log('update',p.s,p.j.status,(p.j.content&&p.j.content.raw||'').includes('fh-hero-video'));
})().catch(e=>{console.error(e.message);process.exit(1)});
