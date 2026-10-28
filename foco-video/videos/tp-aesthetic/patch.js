const fs = require('fs'); let s = fs.readFileSync('build.js', 'utf8');
s = s.replace("{ id: 'coffee', pick: 2, ss: 0.5,", "{ id: 'coffee', pick: 6, ss: 0.5,");
// one drawtext per line, each centered; outline + shadow for bright backgrounds
s = s.replace(/`drawtext=fontfile='\$\{FONT\}':textfile='work\/t\$\{i\}\.txt'[^`]*`,/, "...s.text.map((line, k) => { fs.writeFileSync(path.join('work', `t${i}-${k}.txt`), line); const lh = 78; const y0 = `h*0.40-${(s.text.length * lh) / 2}+${k * lh}`; return `drawtext=fontfile='${FONT}':textfile='work/t${i}-${k}.txt':fontsize=60:fontcolor=white:borderw=2:bordercolor=black@0.28:x=(w-text_w)/2:y=${y0}:shadowcolor=black@0.6:shadowx=0:shadowy=3:alpha='if(lt(t,0.35),t/0.35,1)'`; }),");
fs.writeFileSync('build.js', s); console.log(s.includes("pick: 6") && s.includes('s.text.map((line, k)') ? 'patched' : 'NOT patched');
