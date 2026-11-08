import numpy as np, wave, json, sys
S=sys.argv[1]
w=wave.open(S+'/vo/vo.wav');sr=w.getframerate();x=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768
hop=int(sr*0.01);n=len(x)//hop
db=20*np.log10(np.array([np.sqrt(np.mean(x[i*hop:(i+1)*hop]**2)) for i in range(n)])+1e-9)
sp=db>-50
# speech runs
runs=[];i=0
while i<n:
    if sp[i]:
        j=i
        while j<n and sp[j]: j+=1
        runs.append([i/100,j/100]); i=j
    else: i+=1
# merge runs separated by < 0.6s (keep comma pauses as is)
m=[runs[0][:]]
for a,b in runs[1:]:
    if a-m[-1][1]<0.6: m[-1][1]=b
    else: m.append([a,b])
words=[]
for s in json.load(open(S+'/vo/transcript.json')):
    for wd in s['words']: words.append(wd)
# default gap 0.42s, longer after specific phrases (dramatic beats)
long_after={'avant.':0.7,'mort.':1.0,'jardin.':0.6,'souvenir.':0.6,'journée.':0.6,'mangent.':0.8,'Polarois.':0.7,'Satan.':0.6,'morts.':0.7}
def gap_for(prev_end):
    # find word ending near prev_end
    best=min(words,key=lambda wd:abs(wd['e']-prev_end))
    t=best['w'].strip()
    for k,v in long_after.items():
        if t.endswith(k) or t.endswith(k.rstrip('.')): return v
    return 0.42
keep=[]  # intervals of original audio to keep
pad=0.08
cur=max(0,m[0][0]-pad)
for k in range(len(m)):
    a,b=m[k]
    if k+1<len(m):
        g=gap_for(b)
        nxt=m[k+1][0]
        real=nxt-b
        if real<=g: continue
        # keep [cur, b+g/2] then resume at nxt-g/2
        keep.append((cur,b+g/2)); cur=nxt-g/2
    else:
        keep.append((cur,min(len(x)/sr,b+0.5)))
INTRO=1.8
out=[];mapping=[];t=INTRO
for a,b in keep:
    mapping.append((a,b,t)); out.append(x[int(a*sr):int(b*sr)]); t+=b-a
y=np.concatenate([np.zeros(int(INTRO*sr),np.float32)]+out)
def remap(tt):
    for a,b,t0 in mapping:
        if a-1e-3<=tt<=b+1e-3: return t0+(tt-a)
    # in a removed gap: snap to nearest kept boundary
    best=None
    for a,b,t0 in mapping:
        if tt<a: return t0
    return mapping[-1][2]+mapping[-1][1]-mapping[-1][0]
nw=[{'w':wd['w'].strip(),'s':round(remap(wd['s']),3),'e':round(remap(wd['e']),3)} for wd in words]
json.dump(nw,open(S+'/vo/words_new.json','w'),ensure_ascii=False,indent=0)
wo=wave.open(S+'/vo/vo_edit.wav','wb');wo.setnchannels(1);wo.setsampwidth(2);wo.setframerate(sr);wo.writeframes((np.clip(y,-1,1)*32767).astype(np.int16).tobytes());wo.close()
print('total', len(y)/sr)
# print sentences
line=[];st=None
for wd in nw:
    if st is None: st=wd['s']
    line.append(wd['w'])
    if wd['w'].endswith(('.','?','!')):
        print(f"{st:7.2f}-{wd['e']:7.2f}  {' '.join(line)}"); line=[]; st=None
if line: print(f"{st:7.2f}-{nw[-1]['e']:7.2f}  {' '.join(line)}")
