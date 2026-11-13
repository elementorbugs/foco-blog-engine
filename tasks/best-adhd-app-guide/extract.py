import json,re,html,glob,os,sys
out=[]
def txt(x): return re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',x))).strip()
for f in sorted(glob.glob(sys.argv[1]+'/*.json')):
    d=json.load(open(f))[0]; c=d['content']['rendered']; slug=os.path.basename(f)[:-5]
    r={'slug':slug,'id':d['id'],'title':txt(d['title']['rendered']),'modified':d['modified'][:10]}
    m=re.search(r'<div class="foco-table-wrap foco-cmp2[^"]*">([\s\S]*?)</table>',c)
    if m:
        t=m.group(1)
        a=re.search(r'class="cm-app">([\s\S]*?)</th>',t)
        if a:
            r['name']=txt(re.search(r'<b>([\s\S]*?)</b>',a.group(1)).group(1)) if '<b>' in a.group(1) else txt(a.group(1))
            sm=re.search(r'<small>([\s\S]*?)</small>',a.group(1)); r['summary']=txt(sm.group(1)) if sm else ''
        ic=re.search(r'<img[^>]+src="([^"]+)"',t); r['icon']=ic.group(1) if ic else ''
        lab=re.search(r'cm-label">([^<]*)',t); r['checked']=txt(lab.group(1)) if lab else ''
        for row in re.findall(r'<tr>([\s\S]*?)</tr>',t):
            th=re.search(r'<th scope="row"[^>]*>([\s\S]*?)</th>',row)
            if th:
                tds=re.findall(r'<td[^>]*>([\s\S]*?)</td>',row)
                r[txt(th.group(1))]=txt(tds[0]) if tds else ''
    tl=re.search(r'<div class="foco-tldr">([\s\S]*?)</div>',c); r['tldr']=txt(tl.group(1)) if tl else ''
    out.append(r)
json.dump(out,open(sys.argv[2],'w'),indent=1,ensure_ascii=False)
for r in out: print(r['slug'],'|',r.get('name'),'|',r.get('summary'),'|',r.get('Best for','')[:60],'|',r.get('Platforms','')[:40])
