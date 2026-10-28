const fs=require('fs'),https=require('https');const c=JSON.parse(fs.readFileSync('work/search.json','utf8'));
const getBuf=u=>new Promise((res,rej)=>https.get(u,x=>{if(x.statusCode>=300&&x.headers.location)return getBuf(x.headers.location).then(res,rej);const b=[];x.on('data',d=>b.push(d));x.on('end',()=>res(Buffer.concat(b)));}).on('error',rej));
(async()=>{for(const a of process.argv.slice(2)){const [t,p]=a.split('-');const m=c[t].find(x=>x.pick==p);const f=`work/v-${t}${p}.mp4`;if(!fs.existsSync(f))fs.writeFileSync(f,await getBuf(m.url));console.log(f,m.dur+'s',m.id);}})();
