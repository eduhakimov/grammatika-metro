const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const app=$("#app");
const byId=Object.fromEntries(LESSONS.map(l=>[l.id,l]));
LESSONS.forEach(l=>{const A=AUD[l.id]||{m:[],q:[]};l.more=A.m;l.aud=A.q});
const lineOf=Object.fromEntries(LINES.map(l=>[l.id,l]));
const tense=Object.fromEntries(TENSES.map(t=>[t.k,t]));
tense.fpc.f="S|a:will have been|v:V-ing";
const GT={n:"Be going to",uz:"Oldindan qilingan reja yoki dalilga asoslangan taxmin",les:"going-to",ex:"{s:She} {a:is going to} {v:work} in a bank."};
const LS="grammatika-metro";
let P={done:{},best:{},srs:{},days:{},pre:{}},timer=0;
const save=()=>{try{localStorage.setItem(LS,JSON.stringify(P))}catch(e){}};
const canSpeak="speechSynthesis" in window;
const SPK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';

const TN=/^(day|days|week|weeks|month|months|year|years|morning|afternoon|evening|night|weekend|weekends|summer|winter|spring|autumn|time|moment|hour|hours|minute|minutes|monday|tuesday|wednesday|thursday|friday|saturday|sunday|sundays|mondays|saturdays|january|february|march|april|may|june|july|august|september|october|november|december|noon|midnight|lunchtime|o'clock)$/;
const NUMW=/^(\d[\d:]*|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|a|an|many|few|several)$/;
const PPREP=new Set("in at on to from into near under behind between opposite next above over inside outside through across".split(" "));
const STOPW=new Set("and but because when while if that who which whose so although than or before after unless until by where".split(" "));
const VBASE=/^(be|have|do|go|buy|see|read|play|work|study|pass|get|make|take|come|help|open|close|live|learn|leave|call|eat|drink|watch|visit|stay|swim|drive|speak|write|meet|sell|find|give|tell|finish|start|rest|hurry|smoke|wear|park|touch|sit|be)$/;
function colorTail(ws,nextVerb,pv){
  const r=[];let st="o";
  for(let i=0;i<ws.length;i++){
    const w=ws[i],n=ws[i+1]||"",n2=ws[i+2]||"";
    const ts=/^(yesterday|today|tomorrow|now|tonight|soon|later|recently|lately|yet|then)$/.test(w)||(/^(every|last|next|this|these|all|each)$/.test(w)&&TN.test(n))||(w==="right"&&n==="now")||(/^(in|on|at|for|since|during|until|by|before|after)$/.test(w)&&(/^\d/.test(n)||TN.test(n)||(/^(the|a|an|my)$/.test(n)&&TN.test(n2))||(NUMW.test(n)&&TN.test(n2))))||(NUMW.test(w)&&(n2==="ago"||n==="ago"))||w==="ago";
    if(ts)st="t";
    else if(STOPW.has(w))break;
    else if(w==="to"&&(i===ws.length-1?nextVerb:VBASE.test(n))){r[i]=null;continue}
    else if(w==="to"&&/^(listen|talk|speak|spoke|writ|wrote|belong|explain|said|say|give|gave|sen[dt])/.test(pv||"")){}
    else if(st!=="t"&&(PPREP.has(w)||/^(here|there|home|abroad|upstairs|downstairs)$/.test(w)))st="p";
    if(st==="o"&&(/^(very|much|well|hard|fast|too|also|again|always|usually|often|never|just|already|still|not|please|ever|sometimes|out|up|down|off|away|back)$/.test(w)||(/ly$/.test(w)&&w.length>4))){r[i]=null;continue}
    r[i]=st;
  }
  return r;
}
function tailHtml(text){
  const tk=text.match(/[A-Za-z']+|\d[\d:]*|[^A-Za-z\d']+/g)||[],wi=[];let stop=tk.length;
  for(let i=0;i<tk.length;i++){if(/^[A-Za-z'\d]/.test(tk[i]))wi.push(i);else if(/[,;:.?!()“”→\/]/.test(tk[i])){stop=i;break}}
  const idx=wi.filter(i=>i<stop),rs=colorTail(idx.map(i=>tk[i].toLowerCase()),false),role={};
  idx.forEach((i,k)=>{if(rs[k])role[i]=rs[k]});
  let h="",i=0;
  while(i<tk.length){
    if(role[i]){let j=i;while(j+2<tk.length&&role[j+2]===role[i]&&/^\s+$/.test(tk[j+1]))j+=2;h+=`<span class="g g${role[i]}">${tk.slice(i,j+1).join("")}</span>`;i=j+1}
    else h+=tk[i++];
  }
  return h;
}
const mkB=s=>s.replace(/\{([savno]):([^}]+)\}/g,(m,k,t)=>`<span class="g g${k}">${t}</span>`);
const mk=s=>{const m=/[“→]/.test(s)?null:s.match(/^(.*\{[va]:[^}]+\})([^{}]*)$/);return m?mkB(m[1])+tailHtml(m[2]):mkB(s)};
const LEG='<span class="g gs">ega</span><span class="g ga">yordamchi fe\'l</span><span class="g gv">asosiy fe\'l</span><span class="g gn">inkor</span><span class="g go">to\'ldiruvchi</span><span class="g gp">joy</span><span class="g gt">vaqt</span>';
const plain=s=>s.replace(/\{[savno]:([^}]+)\}/g,"$1");
const esc=s=>s.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
const spk=t=>canSpeak?`<button class="spk" type="button" data-say="${esc(t)}" aria-label="Tinglash">${SPK}</button>`:"";
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const pick=a=>a[Math.floor(Math.random()*a.length)];
const nrm=s=>s.toLowerCase().replace(/[’`‘]/g,"'").replace(/[.?!]+$/,"").replace(/\s+/g," ").trim();
const stars=p=>p>=100?3:p>=85?2:p>=70?1:0;
const doneCount=()=>LESSONS.filter(l=>P.done[l.id]).length;

function fchips(str,plus){
  const parts=str.split("|").map(t=>{
    if(t==="S")return [1,`<span class="g gs">Ega</span>`];
    const m=t.match(/^([avno]):(.*)$/);
    if(!m)return [0,`<span class="o">${t}</span>`];
    return m[1]==="o"?[0,`<span class="o">${m[2]}</span>`]:[1,`<span class="g g${m[1]}">${m[2]}</span>`];
  });
  return `<div class="fm">`+parts.map((p,i)=>(plus&&i&&p[0]&&parts[i-1][0]?`<i class="pl">+</i>`:"")+p[1]).join("")+`</div>`;
}

/* ---------- conjugator ---------- */
function conj(tk,s,v,form){
  const third=/^(He|She|It)$/.test(s),I=s==="I";
  const be=I?"am":third?"is":"are",was=I||third?"was":"were",have=third?"has":"have";
  let aux,main;
  const M={pc:[[be],v.ing],pp:[[have],v.pp],ppc:[[have,"been"],v.ing],pastc:[[was],v.ing],pastp:[["had"],v.pp],pastpc:[["had","been"],v.ing],
    fs:[["will"],v.b],fc:[["will","be"],v.ing],fp:[["will","have"],v.pp],fpc:[["will","have","been"],v.ing]};
  if(tk==="ps"){ if(form==="p"){aux=[];main=third?v.s:v.b}else{aux=[third?"does":"do"];main=v.b} }
  else if(tk==="pasts"){ if(form==="p"){aux=[];main=v.p}else{aux=["did"];main=v.b} }
  else [aux,main]=M[tk];
  let t=[];
  if(form==="q"){
    const a0=aux[0];t.push(["a",a0[0].toUpperCase()+a0.slice(1)],["s",I?"I":s.toLowerCase()]);
    aux.slice(1).forEach(a=>t.push(["a",a]));
  }else{
    t.push(["s",s]);
    aux.forEach((a,i)=>{t.push(["a",a]);if(form==="n"&&i===0)t.push(["n","not"])});
  }
  t.push(["v",main],["o",v.r]);
  const end=form==="q"?"?":".";
  return {html:t.map(([k,x])=>k==="o"?tailHtml(x):`<span class="g g${k}">${x}</span>`).join(" ")+end,text:t.map(x=>x[1]).join(" ")+end};
}

/* ---------- timeline ---------- */
function tlSvg(items){
  const X=p=>30+p*5.4,Y=64;let s="",d=0;const dl=()=>`style="animation-delay:${(d+=.18).toFixed(2)}s"`;
  s+=`<rect x="24" y="${Y-24}" width="${X(50)-24}" height="48" rx="10" fill="var(--soft)" opacity=".55"/>`;
  s+=`<line x1="30" y1="${Y}" x2="566" y2="${Y}" stroke="var(--rule)" stroke-width="4" stroke-linecap="round"/><path d="M560 ${Y-7} 574 ${Y} 560 ${Y+7}" fill="none" stroke="var(--rule)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
  s+=`<line x1="${X(50)}" y1="30" x2="${X(50)}" y2="98" stroke="var(--ink)" stroke-width="2.5"/><circle cx="${X(50)}" cy="${Y}" r="5" fill="var(--ink)"/>`;
  s+=`<text x="30" y="118">O'TMISH</text><text x="${X(50)}" y="118" text-anchor="middle" class="lab">HOZIR</text><text x="570" y="118" text-anchor="end">KELAJAK</text>`;
  items.forEach(it=>{
    const [k,a,b,c]=it;
    if(k==="dot")s+=`<circle class="an" ${dl()} cx="${X(a)}" cy="${Y}" r="10" fill="var(--lc)"/><text class="lab anf" ${dl()} x="${X(a)}" y="28" text-anchor="middle">${b}</text>`;
    if(k==="bar")s+=`<rect class="anb" ${dl()} x="${X(a)}" y="${Y-8}" width="${X(b)-X(a)}" height="16" rx="8" fill="var(--lc)"/><text class="lab anf" ${dl()} x="${(X(a)+X(b))/2}" y="28" text-anchor="middle">${c}</text>`;
    if(k==="rep"){for(let i=0;i<7;i++)s+=`<circle class="an" ${dl()} cx="${X(a+(b-a)*i/6)}" cy="${Y}" r="7" fill="var(--lc)"/>`;s+=`<text class="lab anf" ${dl()} x="${(X(a)+X(b))/2}" y="28" text-anchor="middle">${c}</text>`}
    if(k==="link")s+=`<g class="anf" ${dl()}><path d="M${X(a)} ${Y+12} Q${(X(a)+X(b))/2} ${Y+42} ${X(b)-4} ${Y+8}" fill="none" stroke="var(--lc)" stroke-width="2.5" stroke-dasharray="5 5"/><path d="M${X(b)-13} ${Y+9} l9 -1 -3 9" fill="none" stroke="var(--lc)" stroke-width="2.5" stroke-linecap="round"/><text class="lab" x="${(X(a)+X(b))/2-6}" y="${Y+40}" text-anchor="middle">${c}</text></g>`;
    if(k==="x")s+=`<g class="anf" ${dl()}><path d="M${X(a)} ${Y-11} l9 11 -9 11 -9 -11z" fill="var(--card)" stroke="var(--ink)" stroke-width="2.5"/><text x="${X(a)}" y="100" text-anchor="middle">${b}</text></g>`;
  });
  return `<svg class="tl" viewBox="0 0 600 126" role="img" aria-label="Vaqt chizig'i">${s}</svg>`;
}

/* ---------- lesson visuals ---------- */
const VIS={
"to-be":{t:"flow",q:"Ega kim?",o:[["I","am","I am ready."],["he / she / it","is","She is ready."],["you / we / they","are","They are ready."]]},
"have-got":{t:"flow",q:"Ega kim?",o:[["I / you / we / they","have got","We have got a car."],["he / she / it","has got","She has got a car."]]},
"there-is":{t:"flow",q:"Nechta narsa bor?",o:[["bitta","There is","There is a book."],["ikki va undan ko'p","There are","There are two books."]]},
"word-order":{t:"train",h:"Gap poyezdi: vagonlar joyini almashtirmaydi",c:[["Kim?","I"],["Nima qildi?","read"],["Nimani?","a book"],["Qayerda?","at home"],["Qachon?","yesterday"]]},
"ps-vs-pc":{t:"swap",la:"Doim shunday",a:"{s:He} {v:works} in a hospital.",lb:"Aynan hozir",b:"{s:He} {a:is} {v:working} now."},
"pp-vs-ps":{t:"swap",la:"Vaqt aytilgan",a:"{s:I} {v:lost} my keys yesterday.",lb:"Natija hozir",b:"{s:I} {a:have} {v:lost} my keys."},
"used-to":{t:"swap",la:"Ilgari",a:"{s:I} {a:used to} {v:play} football.",lb:"Hozir",b:"{s:I} {a:do} {n:not} {v:play} football now."},
"going-to":{t:"flow",q:"Gapingiz nimaga asoslangan?",o:[["oldindan qilingan reja","be going to + V1","I am going to buy a bike."],["ko'z oldidagi dalil","be going to + V1","It is going to rain."]]},
"fut-compare":{t:"scale",h:"Kelajak qanchalik oldindan belgilangan?",o:[["will",15,"hozir qaror qildim"],["going to",50,"oldindan reja"],["Present Continuous",80,"kelishilgan uchrashuv"],["Present Simple",100,"rasmiy jadval"]]},
"can-could":{t:"shift",h:"Vaqtga qarab shakl",r:[["hozir","can"],["o'tmish","could"],["kelajak","will be able to"]]},
"must-have-to":{t:"flow",q:"Nima demoqchisiz?",o:[["Majbur","must / have to","I must go."],["Shart emas","don't have to","You don't have to come."],["Taqiq","mustn't","You mustn't smoke here."]]},
"should":{t:"scale",h:"Gap qanchalik qat'iy?",o:[["could",30,"yumshoq taklif"],["should / ought to",60,"maslahat"],["had better",82,"kuchli ogohlantirish"],["must",100,"majburiyat"]],hl:1},
"may-might":{t:"scale",h:"Ishonch darajasi",o:[["must be",95,"aminman"],["may / might",50,"balki"],["can't be",6,"mumkin emas"]]},
"passive-basic":{t:"swap",la:"Active",a:"{s:Tom} {v:cleans} {o:the room}.",lb:"Passive",b:"{o:The room} {a:is} {v:cleaned} (by Tom)."},
"passive-tenses":{t:"shift",h:"V3 joyida turadi, faqat be o'zgaradi",r:[["Present Simple","is made"],["Past Simple","was made"],["Present Continuous","is being made"],["Present Perfect","has been made"],["Future","will be made"],["Modal","must be made"]]},
"cond-0-1":{t:"scale",h:"Shart qanchalik real?",o:[["Zero",100,"doim shunday bo'ladi"],["First",75,"bo'lishi mumkin"],["Second",25,"hozir haqida xayol"],["Third",3,"o'tmish, o'zgarmaydi"]],hl:[0,1]},
"cond-2":{t:"scale",h:"Shart qanchalik real?",o:[["Zero",100,"doim shunday bo'ladi"],["First",75,"bo'lishi mumkin"],["Second",25,"hozir haqida xayol"],["Third",3,"o'tmish, o'zgarmaydi"]],hl:[2]},
"cond-3":{t:"scale",h:"Shart qanchalik real?",o:[["Zero",100,"doim shunday bo'ladi"],["First",75,"bo'lishi mumkin"],["Second",25,"hozir haqida xayol"],["Third",3,"o'tmish, o'zgarmaydi"]],hl:[3]},
"wish":{t:"shift",h:"Nimadan norozisiz?",r:[["hozirgi holatdan","wish + Past Simple"],["o'tmishdagi ishdan","wish + Past Perfect"],["birovning odatidan","wish + would + V1"]]},
"rep-statements":{t:"shift",h:"Zamon bir qadam orqaga",r:[["am / is / are","was / were"],["V1 (work)","V2 (worked)"],["V2, have + V3","had + V3"],["will","would"],["can","could"],["today, tomorrow","that day, the next day"]]},
"rep-questions":{t:"swap",la:"Asl savol",a:"“Where {a:do} {s:you} {v:live}?”",lb:"Yetkazilgani",b:"He asked where {s:I} {v:lived}."},
"questions":{t:"swap",la:"Darak gap",a:"{s:You} {a:are} {v:reading}.",lb:"Savol",b:"{a:Are} {s:you} {v:reading}?"},
"tag-questions":{t:"flow",q:"Gap qanday?",o:[["ijobiy (+)","inkor dumcha (−)","It is cold, isn't it?"],["inkor (−)","ijobiy dumcha (+)","It isn't cold, is it?"]]},
"gerund-inf":{t:"flow",q:"Birinchi fe'l qaysi guruhdan?",o:[["enjoy, finish, mind, avoid","+ V-ing","I enjoy reading."],["want, decide, hope, plan","+ to V1","I want to read."],["predlog: in, at, of, about","+ V-ing","good at reading"]]},
"articles":{t:"flow",q:"Tinglovchi qaysi narsa ekanini biladimi?",o:[["Yo'q, istalgan bittasi","a / an","I saw a dog."],["Ha, aynan o'sha","the","The dog was big."],["Umuman shu turdagi narsalar","artiklsiz","Dogs are clever."]]},
"countable":{t:"flow",q:"Otni sanash mumkinmi?",o:[["Ha: book, apple","many, a few","many books"],["Yo'q: water, money","much, a little","much water"],["Ikkalasida ham","some, any, a lot of","some books, some water"]]},
"comparison":{t:"scale",h:"Uch daraja",o:[["tall",55,"oddiy"],["taller",78,"qiyosiy: ikkitasini solishtirish"],["the tallest",100,"orttirma: eng zo'ri"]]},
"adverbs":{t:"swap",la:"Qanday odam? Sifat",a:"{s:She} {a:is} a {o:careful} driver.",lb:"Qanday haydaydi? Ravish",b:"{s:She} {v:drives} {o:carefully}."},
"prep-time":{t:"nest",o:[["IN","yil, oy, fasl: in 2026, in May, in summer"],["ON","kun va sana: on Monday, on 5 May"],["AT","aniq soat: at 7 o'clock"]]},
"prep-place":{t:"place"},
"relative":{t:"swap",la:"Ikki gap",a:"This is the man. {s:He} {v:helped} me.",lb:"Bitta gap",b:"This is the man {a:who} {v:helped} me."},
"linkers":{t:"flow",q:"Keyingi fikr qayoqqa buriladi?",o:[["sabab","because","...because it rained."],["natija","so","...so I stayed home."],["zidlik","although / but","Although it rained, ..."]]}
};
function visHtml(id){
  const v=VIS[id];if(!v)return "";let h="",d=0;const dl=()=>`style="animation-delay:${(d+=.16).toFixed(2)}s"`;
  if(v.t==="swap")h=`<div class="sw anf" ${dl()}><small>${v.la}</small><span>${mk(v.a)}</span></div><div class="sw-a anf" ${dl()}>↓</div><div class="sw anf" ${dl()}><small>${v.lb}</small><span>${mk(v.b)}</span></div>`;
  if(v.t==="shift")h=`<div class="shift">${v.r.map(r=>`<span class="anf" ${dl()}>${r[0]}</span><i class="anf" ${dl()}>→</i><span class="to anf" ${dl()}>${r[1]}</span>`).join("")}</div>`;
  if(v.t==="scale"){const hl=[].concat(v.hl??[]);h=`<div class="sc">${v.o.map((o,i)=>`<b class="${hl.includes(i)?"hl":""}">${o[0]}</b><div class="scb"><div class="bar"><i class="anb" ${dl()} style="width:${o[1]}%;animation-delay:${(d).toFixed(2)}s;${hl.length&&!hl.includes(i)?"opacity:.35":""}"></i></div><small>${o[2]}</small></div>`).join("")}</div>`}
  if(v.t==="nest")h=v.o.reduceRight((inner,o)=>`<div class="nest"><div><b>${o[0]}</b><span>${o[1]}</span></div>${inner}</div>`,"");
  if(v.t==="train")h=`<div class="train">${v.c.map(c=>`<div class="car anf" ${dl()}><small>${c[0]}</small><b>${c[1]}</b></div>`).join("")}</div>`;
  if(v.t==="flow")h=`<p class="flq">${v.q}</p><div class="flow">${v.o.map(o=>`<div class="fl anf" ${dl()}><small>${o[0]}</small><i>↓</i><b>${o[1]}</b><span>${o[2]}</span></div>`).join("")}</div>`;
  if(v.t==="place"){
    const ball=(x,y,t,tx,ty)=>`<g class="an" ${dl()}><circle cx="${x}" cy="${y}" r="13" fill="var(--lc)"/></g><text class="lab anf" ${dl()} x="${tx}" y="${ty}" text-anchor="middle">${t}</text>`;
    h=`<svg class="tl" viewBox="0 0 600 230" role="img" aria-label="Joy predloglari"><g fill="none" stroke="var(--ink)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M210 120h230M230 120v80M420 120v80"/><path d="M250 120V66h80v54"/><path d="M60 200v-60M150 200v-60"/></g><line x1="20" y1="202" x2="580" y2="202" stroke="var(--rule)" stroke-width="4" stroke-linecap="round"/>
    ${ball(290,103,"in the box",290,54)}${ball(385,105,"on the table",385,80)}${ball(325,187,"under the table",325,160)}${ball(490,187,"next to the table",505,160)}${ball(105,187,"between",105,128)}</svg>`;
  }
  return `<section class="blk vis">${v.h?`<p class="vis-t">${v.h}</p>`:`<h2>Bir qarashda</h2>`}${h}</section>`;
}
const SIGX={"to-be":["am","is","are","was","were"],"have-got":["have got","has got"],"there-is":["there is","there are"],"used-to":["used to"],"going-to":["going to"],
"can-could":["can","could","be able to"],"must-have-to":["must","have to","mustn't","don't have to"],"should":["should","ought to","had better"],"may-might":["may","might","must be","can't be"],
"passive-basic":["be + V3","by"],"cond-0-1":["if","unless","when","as soon as"],"cond-2":["if + V2","would","If I were you"],"cond-3":["if + had V3","would have"],"wish":["wish","if only"],
"rep-statements":["said","told","that"],"rep-questions":["asked","if / whether","told ... to"],"tag-questions":["isn't it?","don't you?","shall we?"],
"gerund-inf":["enjoy","finish","mind","want","decide","hope"],"articles":["a","an","the"],"countable":["much","many","a few","a little","some","any"],
"comparison":["than","more","the most","as ... as","-er","-est"],"adverbs":["-ly","well","too","enough"],"prep-time":["in","on","at","for","since","ago"],"prep-place":["in","on","at","to","under","between"],
"relative":["who","which","that","whose","where"],"linkers":["because","so","although","however","despite"]};
Object.entries(SIGX).forEach(([id,a])=>{if(byId[id]&&!byId[id].sig)byId[id].sig=a});

/* ---------- quiz engine ---------- */
const norm=(e,les,i)=>Object.assign(e[0]==="mc"?{t:"mc",q:e[1],o:e[2],a:e[3],w:e[4]}:e[0]==="in"?{t:"in",q:e[1],a:e[2],w:e[3]}:{t:"ord",a:e[1],uz:e[2]},{les,id:i==null?null:les+":"+i},i==null||!byId[les].aud[i]?{}:typeof byId[les].aud[i]==="string"?{ref:byId[les].aud[i]}:{ref:byId[les].aud[i][0],x:byId[les].aud[i].slice(1)});
function ruleBox(it){
  const L=byId[it.les];if(!L||!it.ref)return "";
  const k=it.ref[0],row=(k==="u"?L.use:k==="m"?L.more:L.err)[+it.ref.slice(1)];if(!row)return "";
  return `<div class="rule" style="--lc:${lineOf[L.line].c}"><small>Bu qoida darsda tushuntirilgan · ${L.t}, “${k==="e"?"Xatolar":"Misollar"}” qadami</small>${k==="e"?`<b>${row[2]}</b><span class="fm-ex"><s>${row[0]}</s> → ${row[1]}</span>`:`<b>${row[0]}</b><span class="fm-ex">${mk(row[1])}</span><span class="cap">${row[2]}</span>`}<button class="btn sm" type="button" data-rule-go="${it.les}|${it.ref}">Darsda ko'rsatish</button></div>`;
}
const items=l=>l.ex.map((e,i)=>norm(e,l.id,i));
const canon=s=>nrm(s).replace(/,/g,"").replace(/\bwon't\b/g,"will not").replace(/\bcan't\b|\bcannot\b/g,"can not").replace(/\bshan't\b/g,"shall not").replace(/n't\b/g," not").replace(/'m\b/g," am").replace(/'re\b/g," are").replace(/'ve\b/g," have").replace(/'ll\b/g," will").replace(/\s+/g," ").trim();
const today=()=>{const d=new Date;return Math.floor((d-d.getTimezoneOffset()*6e4)/864e5)};
const INT=[1,3,7,16,35],GOAL=20;
function record(it,ok){
  const t=today();P.days[t]=(P.days[t]||0)+1;
  if(it.id){
    const e=P.srs[it.id];
    if(ok){
      if(!e)P.srs[it.id]={iv:1,d:t+INT[1],ok:1};
      else{if(e.d<=t){e.iv=Math.min(e.iv+1,4);e.d=t+INT[e.iv]}e.ok=(e.ok||0)+1;if(e.ok>=3)delete e.err}
    }else P.srs[it.id]={iv:0,d:t+1,ok:0,err:1};
  }
  save();count();
}
function quiz(host,list,done,opt={}){
  let i=0,score=0,res=[];const its=[...list];
  const gap=q=>q.replace(/___/g,'<span class="gap"></span>');
  const sent=(it,fill)=>{
    if(fill==null)return null;let s;
    if(it.t==="ord"||it.t==="tr")s=fill;
    else if(/___/.test(it.q)){
      if(/^\(/.test(fill))return null;
      const g=(it.q.match(/___/g)||[]).length,ps=fill.split(" / ");
      if(ps.length===g){let k=0;s=it.q.replace(/___/g,()=>ps[k++])}else if(g===1)s=it.q.replace("___",fill);else return null;
    }else if(/\s/.test(fill)&&/[.?!]$/.test(fill))s=fill;else return null;
    s=s.replace(/\s*\((?!by )[^)]*\)/g,"");if(s.includes("→"))s=s.slice(s.lastIndexOf("→")+1);
    s=s.replace(/<[^>]+>/g," ").replace(/[“”]/g,"").replace(/\b[AB]: /g,"").trim();
    return /[a-z]/i.test(s)&&s.split(" ").length>1?s:null;
  };
  const brk=(it,ok,right,mine)=>{
    const r=sent(it,right),m=ok?null:sent(it,mine);if(!r)return "";
    return `<div class="brk">${m&&canon(m)!==canon(r)?`<div class="brk-r bad"><small>Sizning gapingiz</small><span>${analyze(m).html}</span></div>`:""}<div class="brk-r ok"><small>To'g'ri gap</small><span>${analyze(r).html}</span></div><div class="legend">${LEG}</div></div>`;
  };
  function fin(ok,right,why,mine){
    const it=its[i];if(ok)score++;res.push({les:it.les,ok});
    if(!opt.norec)record(it,ok);
    if(!ok&&opt.requeue&&!it.re)its.push(Object.assign({},it,{re:1}));
    $(".qz-fb",host).innerHTML=`<div class="fb ${ok?"ok":"bad"} anf"><b>${ok?"To'g'ri!":"Xato"}</b>${ok?"":`<span>To'g'ri javob: <code>${right}</code></span>`}${!ok&&it.x&&it.o&&it.x[it.o.indexOf(mine)]?`<span class="whyx"><b>Nega “${mine}” mos emas:</b> ${it.x[it.o.indexOf(mine)]}</span>`:""}<span>${ok?"":"<b class=\"whyr\">Nega to'g'ri javob shunday:</b> "}${why||""}</span>${brk(it,ok,right,mine)}${ruleBox(it)}${!ok&&byId[it.les]&&opt.link?`<a href="#dars-${it.les}">Dars: ${byId[it.les].t}</a>`:""}</div><button class="btn pri" id="nx" type="button">${i+1<its.length?"Keyingi savol":"Natijani ko'rish"}</button>`;
    const b=$("#nx",host);b.onclick=()=>{i++;show()};b.focus({preventScroll:true});
  }
  function show(){
    if(i>=its.length)return done(score,its.length,res);
    let it=its[i];
    if(it.t==="mc"&&it.typed&&(it.q.match(/___/g)||[]).length===1&&/^[A-Za-z' ]+$/.test(it.o[it.a]))it=its[i]=Object.assign({},it,{t:"in",a:[it.o[it.a]]});
    let h=`<div class="qz"><div class="qz-top"><span>${i+1} / ${its.length}</span><div class="bar"><i style="width:${i/its.length*100}%"></i></div>${it.re?"<span>qayta urinish</span>":""}</div>`;
    if(it.t==="mc"){
      const os=shuffle(it.o.map((t,k)=>({t,ok:k===it.a})));
      h+=`<p class="qq">${gap(it.q)}</p><div class="opts">${os.map(o=>`<button class="opt" type="button" data-ok="${o.ok?1:0}">${o.t}</button>`).join("")}</div>`;
    }else if(it.t==="in"){
      h+=`<p class="qq">${gap(it.q)}</p><p class="qhint">Bo'sh joyga mos so'zni xotiradan yozing.</p><form class="inrow" id="inf"><input id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Javob"><button class="btn pri">Tekshirish</button></form>`;
    }else if(it.t==="tr"){
      h+=`<p class="qq">${it.q}</p><p class="fm-ex">${it.src}</p><form class="inrow" id="inf"><input id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Javob"><button class="btn pri">Tekshirish</button></form>`;
    }else{
      h+=`<p class="qq">${it.uz}</p><p class="qhint">So'zlarni bosib, inglizcha gapni to'g'ri tartibda yig'ing.</p><div class="words ans" id="wa"></div><div class="words" id="wb"></div><button class="btn pri" id="chk" type="button" disabled>Tekshirish</button>`;
    }
    host.innerHTML=h+`<div class="qz-fb"></div></div>`;
    if(it.t==="mc")$$(".opt",host).forEach(b=>b.onclick=()=>{
      $$(".opt",host).forEach(x=>{x.disabled=true;if(x.dataset.ok==="1")x.classList.add("ok")});
      const ok=b.dataset.ok==="1";if(!ok)b.classList.add("bad");fin(ok,it.o[it.a],it.w,b.textContent);
    });
    if(it.t==="in"||it.t==="tr")$("#inf",host).onsubmit=e=>{
      e.preventDefault();const inp=$("#ans",host);if(!inp.value.trim()||inp.disabled)return;
      inp.disabled=true;$("#inf button",host).disabled=true;
      fin(it.a.map(canon).includes(canon(inp.value)),it.a[0],it.w,inp.value.trim());
    };
    if(it.t==="ord"){
      const end=/\?$/.test(it.a)?"?":".",ws=it.a.replace(/[?.]$/,"").split(" ");
      let bank=shuffle(ws.map((w,k)=>k));if(ws.length>1&&bank.every((k,j)=>k===j))bank.reverse();
      let ch=[],lock=false;
      const draw=()=>{
        $("#wa",host).innerHTML=ch.map(k=>`<button class="word" type="button" data-k="${k}">${ws[k]}</button>`).join("")+(ch.length===ws.length?`<span class="qhint">${end}</span>`:"");
        $("#wb",host).innerHTML=bank.map(k=>`<button class="word${ch.includes(k)?" used":""}" type="button" data-k="${k}">${ws[k]}</button>`).join("");
        $("#chk",host).disabled=ch.length!==ws.length||lock;
        $$("#wb .word",host).forEach(b=>b.onclick=()=>{if(lock)return;ch.push(+b.dataset.k);draw()});
        $$("#wa .word",host).forEach(b=>b.onclick=()=>{if(lock)return;ch=ch.filter(k=>k!==+b.dataset.k);draw()});
      };
      draw();
      $("#chk",host).onclick=()=>{lock=true;$("#chk",host).disabled=true;fin(ch.map(k=>ws[k]).join(" ")===ws.join(" "),it.a.replace(/[?.]$/,"")+end,"",ch.map(k=>ws[k]).join(" ")+end)};
    }
  }
  show();
}

/* ---------- memory: mnemonics, cards, spaced review ---------- */
const MN={"to-be":"Fe'l yo'qmi? Am, is, are qo'y.","have-got":"He, she, it: has. Qolganlari: have.","there-is":"Bitta: is. Ko'p: are. Gap boshida there.","word-order":"Kim, nima qildi, nimani, qayerda, qachon.",
"pres-simple":"Har doim bo'lsa Simple; he, she, it ga -s.","pres-cont":"Hozir bo'lyaptimi? Be va -ing birga yuradi.","ps-vs-pc":"Doim: Simple. Hozir: Continuous.","pres-perfect":"Aniq vaqt aytilsa, Perfect ketadi.","pres-perf-cont":"Qachondan beri? Have been va -ing.",
"past-simple":"Kecha bo'ldi, tugadi: V2. Did kelsa, V1 qaytadi.","past-cont":"Uzun fon: was -ing. Qisqa voqea: V2.","pp-vs-ps":"“Qachon?” degan savolga javob bormi? Past Simple.","past-perfect":"Ikki o'tgan ishdan oldingisi: had V3.","past-perf-cont":"O'sha paytgacha qancha? Had been -ing.","used-to":"Ilgari ha, hozir yo'q: used to.",
"will":"Hozir qaror qildim: will.","going-to":"Reja yoki dalil bor: going to.","fut-compare":"Hozir qaror: will. Reja: going to. Kelishuv: -ing. Jadval: Simple.","fut-cont":"Ertaga shu paytda: will be -ing.","fut-perfect":"By ko'rsang: will have V3.",
"can-could":"Modaldan keyin to yo'q, -s yo'q.","must-have-to":"Mustn't: mumkin emas. Don't have to: shart emas.","should":"Maslahat: should. To qo'shilmaydi.","may-might":"Aminman: must be. Balki: might. Mumkin emas: can't be.",
"passive-basic":"Be va V3: nima qilindi.","passive-tenses":"V3 qimirlamaydi, be zamonni kiyadi.","cond-0-1":"If dan keyin will yo'q.","cond-2":"Xayol bo'lsa bir qadam orqaga: if V2, would V1.","cond-3":"O'tmish afsusi: if had V3, would have V3.","wish":"Qaniydi: zamon bir qadam orqaga.",
"rep-statements":"Gapni yetkazsang, zamon bir qadam orqaga.","rep-questions":"Yetkazilgan savol endi savol emas: ega oldin, fe'l keyin.","questions":"Yordamchi fe'l eganing oldiga sakraydi.","tag-questions":"Gap plyus bo'lsa, dumcha minus.",
"gerund-inf":"Yoqtirish: -ing. Xohish va reja: to. Predlogdan keyin: -ing.","articles":"Birinchi marta: a. Tanish bo'lsa: the.","countable":"Sanalsa many, sanalmasa much.","comparison":"Qisqa so'zga -er, uzun so'zga more.","adverbs":"Qanday narsa: sifat. Qanday qilib: -ly.",
"prep-time":"IN katta, ON o'rta, AT nuqta.","prep-place":"Ichida in, ustida on, nuqtada at.","relative":"Odam: who. Narsa: which. Egalik: whose.","linkers":"Sabab: because. Natija: so. Zidlik: although."};
const ftxt=f=>f.split("|").map(t=>t==="S"?"Ega":t.replace(/^[avno]:/,"")).join(" + ").replace(/ \+ ([,?])/g,"$1");
function cardHtml(L){
  const ln=lineOf[L.line],fs=L.f?Object.values(L.f):[];
  const txt=[L.t+" ("+L.s+")",...fs.map(ftxt),L.sig?"Belgi so'zlar: "+L.sig.join(", "):"",...[...L.use,...L.more].map(u=>"• "+u[0]),"Misol: "+plain(L.use[0][1])+" ("+L.use[0][2]+")","Eslab qoling: "+MN[L.id]].filter(Boolean).join("\n");
  return `<div class="ccard" style="--lc:${ln.c}"><small><span class="badge">${ln.n}</span> ${ln.t}</small><b>${L.t}</b>${fs.map(f=>fchips(f,true)).join("")}
  ${L.sig?`<div class="chips">${L.sig.map(s=>`<span class="chip">${s}</span>`).join("")}</div>`:""}
  <ul class="rl">${[...L.use,...L.more].map(u=>`<li>${u[0]}</li>`).join("")}</ul>
  <p class="fm-ex">${mk(L.use[0][1])}</p><p class="cap">${L.use[0][2]}</p><p class="mn">${MN[L.id]}</p>
  <div class="cell-b"><a href="#dars-${L.id}">Darsni ochish</a><button class="btn sm" type="button" data-copy="${esc(txt)}">Nusxa olish</button></div></div>`;
}
const valid=k=>{const j=k.lastIndexOf(":"),L=byId[k.slice(0,j)];return L&&L.ex[+k.slice(j+1)]};
const itemOf=k=>{const j=k.lastIndexOf(":");return Object.assign(norm(valid(k),k.slice(0,j),+k.slice(j+1)),{typed:(P.srs[k]||{}).iv>=2})};
const dueKeys=()=>{const t=today();return Object.keys(P.srs).filter(k=>P.srs[k].d<=t&&valid(k)).sort((a,b)=>P.srs[a].d-P.srs[b].d)};
const errKeys=()=>Object.keys(P.srs).filter(k=>P.srs[k].err&&valid(k));
function streak(){const t=today();let n=0,d=(P.days[t]||0)>=GOAL?t:t-1;while((P.days[d]||0)>=GOAL){n++;d--}return n}
function todayHtml(){
  const t=today(),n=dueKeys().length,c=P.days[t]||0,mx=Math.max(GOAL,...Array.from({length:7},(x,i)=>P.days[t-i]||0));
  const dn=["Ya","Du","Se","Ch","Pa","Ju","Sh"];
  return `<div class="today"><a class="btn ${n?"pri":""}" href="#takror">${n?"Bugungi takror: "+n+" ta savol":"Takror bo'limi"}</a>
  <div class="goal"><span>Bugungi maqsad: ${Math.min(c,GOAL)} / ${GOAL} javob${c>=GOAL?" · bajarildi":""} · Ketma-ket ${streak()} kun</span><div class="bar"><i style="width:${Math.min(100,c/GOAL*100)}%"></i></div></div>
  <div class="wk" aria-label="Oxirgi 7 kun">${Array.from({length:7},(x,i)=>{const d=t-6+i,v=P.days[d]||0;return `<div class="${v>=GOAL?"met":""}" title="${v} javob"><i style="height:${Math.max(4,v/mx*100)}%"></i><span>${dn[new Date(d*864e5).getUTCDay()]}</span></div>`}).join("")}</div></div>`;
}
function mixItems(id){
  const others=LESSONS.filter(l=>l.id!==id&&P.done[l.id]),same=others.filter(l=>l.line===byId[id].line);
  const src=shuffle([...same,...same,...others]).slice(0,4);
  return shuffle([...shuffle(items(byId[id])).slice(0,4),...src.map(l=>pick(items(l)))]);
}
function takror(){
  const t=today(),due=dueKeys(),errs=errKeys(),doneL=LESSONS.filter(l=>P.done[l.id]);
  const fut=Object.values(P.srs).map(e=>e.d).filter(d=>d>t),nx=fut.length?Math.min(...fut)-t:0;
  const byL={};errs.forEach(k=>{const l=k.slice(0,k.lastIndexOf(":"));byL[l]=(byL[l]||0)+1});
  const menu=()=>{
    app.innerHTML=`<section class="page"><h1>Takror</h1><p class="lead">Har bir savol unutilish arafasida qaytadi: to'g'ri javobdan keyin oraliq uzayadi (${INT.join(" → ")} kun), xatodan keyin savol ertaga yana chiqadi. Uzoq oraliqli savollarda variantlar bo'lmaydi, javobni xotiradan yozasiz.</p>
    <div class="modes">
      <button class="card mode" type="button" id="m1"${due.length?"":" disabled"}><b>Bugungi takror</b><span>${due.length?due.length+" ta savol navbatda turibdi.":nx?"Bugun savol yo'q. Keyingi takror "+nx+" kundan keyin.":"Hali takror yo'q. Avval biror darsning mashqini ishlang."}</span><em>${Object.keys(P.srs).length} ta savol kuzatuvda</em></button>
      <button class="card mode" type="button" id="m2"${errs.length?"":" disabled"}><b>Xatolar daftari</b><span>${errs.length?errs.length+" ta savolda xato qilgansiz. Uch marta to'g'ri javob bersangiz, savol daftardan chiqadi.":"Daftar bo'sh."}</span><em>${Object.keys(byL).length} ta mavzu</em></button>
      <button class="card mode" type="button" id="m3"${doneL.length>1?"":" disabled"}><b>Aralash mashq</b><span>${doneL.length>1?"O'tilgan "+doneL.length+" ta bekatdan 10 ta aralash savol.":"Kamida ikkita bekat o'tilgach ochiladi."}</span><em>Qaysi qoida kerakligini o'zingiz tanlaysiz</em></button>
    </div>
    ${errs.length?`<div class="card"><h2>Xato qilingan mavzular</h2><div class="rows" style="margin-top:12px">${Object.keys(byL).sort((a,b)=>byL[b]-byL[a]).map(l=>`<div class="row" style="--lc:${lineOf[byId[l].line].c}"><a href="#dars-${l}">${byId[l].t}</a><div class="bar"><i style="width:${Math.min(100,byL[l]/byId[l].ex.length*100)}%"></i></div><span>${byL[l]}</span></div>`).join("")}</div></div>`:""}
    ${todayHtml()}</section>`;
    $("#m1").onclick=()=>run("Bugungi takror",shuffle(due.slice(0,15)).map(itemOf));
    $("#m2").onclick=()=>run("Xatolar daftari",shuffle(errs).slice(0,15).map(itemOf));
    $("#m3").onclick=()=>run("Aralash mashq",shuffle(doneL.flatMap(items)).slice(0,10));
  };
  const run=(title,list)=>{
    app.innerHTML=`<section class="page" style="max-width:760px;margin:0 auto"><a class="back" href="#takror" id="bk">← Takror bo'limi</a><h1>${title}</h1><div class="card" id="tz"></div></section>`;
    $("#bk").onclick=e=>{e.preventDefault();takror()};
    quiz($("#tz"),list,(sc,n)=>{
      $("#tz").innerHTML=`<div class="res"><div class="big">${sc} / ${n}</div><p>${sc===n?"Hammasi to'g'ri. Bu savollar endi uzoqroq oraliqdan keyin qaytadi.":"Xato qilingan savollar ertaga yana chiqadi."}</p><div class="hero-act"><button class="btn pri" id="mn2" type="button">Takror bo'limiga qaytish</button><a class="btn" href="#home">Xarita</a></div></div>`;
      $("#mn2").onclick=()=>takror();
    },{requeue:true,link:true});
  };
  menu();
}
function kartochka(){
  let cur="";
  app.innerHTML=`<section class="page"><h1>Eslatma kartochkalar</h1><p class="lead">Har bir mavzuning eng kerakli qismi bitta kartochkada: formula, belgi so'zlar, misol va eslab qolish iborasi. “Nusxa olish” tugmasi bilan matnini kursdoshlaringizga yuborishingiz mumkin.</p>
  <div class="chips" id="kf"><button class="chip on" type="button" data-l="">Hammasi</button>${LINES.map(l=>`<button class="chip" type="button" data-l="${l.id}">${l.t}</button>`).join("")}</div><div class="ccards" id="kc"></div></section>`;
  const draw=()=>{$("#kc").innerHTML=LESSONS.filter(l=>!cur||l.line===cur).map(cardHtml).join("")};
  $$("#kf .chip").forEach(b=>b.onclick=()=>{cur=b.dataset.l;$$("#kf .chip").forEach(x=>x.classList.toggle("on",x===b));draw()});
  draw();
}
function diktant(){
  const pool=LESSONS.flatMap(l=>l.use.map(u=>({s:plain(u[1]),uz:u[2],les:l.id})).filter(x=>/^[A-Z][A-Za-z ,']+[.?]$/.test(x.s)&&x.s.split(" ").length>=3&&x.s.split(" ").length<=9));
  let list=shuffle(pool).slice(0,8),i=0,ok=0;
  app.innerHTML=`<section class="page" style="max-width:760px;margin:0 auto"><h1>Diktant</h1><p class="lead">Gapni tinglang va eshitganingizni yozing. Quloq va yozuv birga ishlaganda qoida mustahkamroq o'rnashadi.</p><div class="card" id="dz"></div></section>`;
  if(!canSpeak){$("#dz").innerHTML=`<p>Bu brauzerda ovoz chiqarish imkoni yo'q. Diktant uchun sahifani Chrome, Edge yoki Safari brauzerida oching.</p>`;return}
  const say=(t,r)=>{try{const u=new SpeechSynthesisUtterance(t);u.lang="en-US";u.rate=r;speechSynthesis.cancel();speechSynthesis.speak(u)}catch(e){}};
  const show=()=>{
    if(i>=list.length){$("#dz").innerHTML=`<div class="res"><div class="big">${ok} / ${list.length}</div><p>Diktant tugadi.</p><div class="hero-act"><button class="btn pri" id="da" type="button">Yana bir marta</button></div></div>`;$("#da").onclick=diktant;return}
    const x=list[i];
    $("#dz").innerHTML=`<div class="qz"><div class="qz-top"><span>${i+1} / ${list.length}</span><div class="bar"><i style="width:${i/list.length*100}%"></i></div></div>
    <div class="hero-act"><button class="btn pri" type="button" id="d1">Tinglash</button><button class="btn" type="button" id="d2">Sekinroq tinglash</button></div>
    <form class="inrow" id="df"><input id="da2" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Eshitgan gapingiz" placeholder="Eshitganingizni yozing"><button class="btn pri">Tekshirish</button></form><div id="dfb"></div></div>`;
    $("#d1").onclick=()=>say(x.s,.9);$("#d2").onclick=()=>say(x.s,.6);
    $("#df").onsubmit=e=>{
      e.preventDefault();const inp=$("#da2");if(!inp.value.trim()||inp.disabled)return;inp.disabled=true;$("#df button").disabled=true;
      const good=canon(inp.value)===canon(x.s);if(good)ok++;record({},good);
      const a=analyze(x.s);
      $("#dfb").innerHTML=`<div class="fb ${good?"ok":"bad"} anf"><b>${good?"To'g'ri!":"Farq bor"}</b><span class="fm-ex">${a.html}</span><span>${x.uz}</span><span>Mavzu: <a href="#dars-${x.les}">${byId[x.les].t}</a></span></div><button class="btn pri" id="dn" type="button" style="margin-top:12px">${i+1<list.length?"Keyingi gap":"Natijani ko'rish"}</button>`;
      $("#dn").onclick=()=>{i++;show()};$("#dn").focus({preventScroll:true});
    };
  };
  show();
}
function kirish(){
  const extra={pres:1,past:1,fut:1,modal:1,cond:1,pass:1};let list=[];
  LINES.forEach(ln=>{const ls=LESSONS.filter(l=>l.line===ln.id);ls.slice(0,extra[ln.id]?2:1).forEach(l=>{const it=items(l).find(x=>x.t==="mc");if(it)list.push(it)})});
  list.sort((a,b)=>LESSONS.indexOf(byId[a.les])-LESSONS.indexOf(byId[b.les]));
  app.innerHTML=`<section class="page" style="max-width:760px;margin:0 auto"><h1>Kirish testi</h1><p class="lead">${list.length} ta savol, har bir yo'nalishdan. Natijaga qarab qaysi bekatdan boshlash kerakligi ko'rsatiladi. Bilmagan savolingizda taxmin qilib belgilayvering.</p><div class="card" id="tz"></div></section>`;
  quiz($("#tz"),list,(sc,n,res)=>{
    const by={};res.forEach(r=>{const l=byId[r.les].line;by[l]=by[l]||[0,0];by[l][1]++;if(r.ok)by[l][0]++});
    const first=res.find(r=>!r.ok),st=first?byId[first.les]:null;
    if(st){P.start=st.id;save()}
    $("#tz").innerHTML=`<div class="res"><div class="big">${sc} / ${n}</div>
    <div class="rows">${LINES.filter(l=>by[l.id]).map(l=>`<div class="row" style="--lc:${l.c}"><span>${l.t}</span><div class="bar"><i style="width:${by[l.id][0]/by[l.id][1]*100}%"></i></div><span>${by[l.id][0]}/${by[l.id][1]}</span></div>`).join("")}</div>
    <p>${st?`<b>Tavsiya:</b> “${st.t}” bekatidan boshlang. Undan oldingi mavzularni bilasiz, lekin takror uchun ko'z yugurtirib chiqish foydali.`:"<b>Hammasi to'g'ri.</b> Bilimingizni “Katta imtihon” bilan sinab ko'ring."}</p>
    <div class="hero-act">${st?`<a class="btn pri" href="#dars-${st.id}">Boshlash: ${st.t}</a>`:`<a class="btn pri" href="#test">Testga o'tish</a>`}<a class="btn" href="#home">Xarita</a></div></div>`;
  },{norec:true});
}

/* ---------- home ---------- */
function home(){
  const d=doneCount(),next=(!d&&byId[P.start])||LESSONS.find(l=>!P.done[l.id])||LESSONS[0];
  let h=`<section class="hero"><div class="hero-t">
    <p class="eyebrow">Ingliz tili grammatikasi · ${LESSONS.length} dars</p>
    <h1>Har bir mavzu bitta bekat. Bekatma-bekat butun grammatika.</h1>
    <p class="lead">Har bir dars besh qadamdan iborat: g'oya, formula, misollar, xatolar va mashq. Savollar keyin unutilish arafasida takrorga qaytadi.</p>
    <div class="hero-act"><a class="btn pri" href="#dars-${next.id}">${d?"Davom etish":"Boshlash"}: ${next.t}</a><a class="btn" href="#tahlil">Gapni tahlil qilish</a></div>
    ${todayHtml()}<div class="prog"><span>${d} / ${LESSONS.length} bekat o'tildi</span><div class="bar"><i style="width:${d/LESSONS.length*100}%"></i></div></div>
  </div>
  <div class="board" aria-live="off"><div class="board-h"><span>Bitta gap, 12 zamon</span><span id="bi"></span></div>
    <div id="bw"></div>
    <div class="legend">${LEG}</div>
  </div></section>
  <section class="tools">
    <a class="tool" href="#takror"><b>Takror</b><span>Oraliqli takrorlash, xatolar daftari va aralash mashq.</span></a>
    <a class="tool" href="#kirish"><b>Kirish testi</b><span>Qaysi bekatdan boshlashni aniqlab beradi.</span></a>
    <a class="tool" href="#kartochka"><b>Eslatma kartochkalar</b><span>Har bir mavzu bitta kartochkada, eslab qolish iborasi bilan.</span></a>
    <a class="tool" href="#diktant"><b>Diktant</b><span>Gapni tinglang va eshitganingizni yozing.</span></a>
    <a class="tool" href="#tahlil"><b>Gap tahlilchisi</b><span>Inglizcha gap yozing, undagi butun grammatika ajratib ko'rsatiladi.</span></a>
    <a class="tool" href="#detektor"><b>Grammatika detektori</b><span>Savollarga javob bering, qaysi mavzu kerakligini bilib oling.</span></a>
    <a class="tool" href="#jadval"><b>12 zamon jadvali</b><span>Bitta gap barcha zamonlarda qanday o'zgarishini ko'ring.</span></a>
    <a class="tool" href="#test"><b>Test va imtihon</b><span>Aralash savollar, “zamonni top” o'yini va zaif mavzular.</span></a>
    <a class="tool" href="#fellar"><b>Noto'g'ri fe'llar</b><span>${IRREG.length} ta fe'lning uch shaklini mashq qiling.</span></a>
  </section>
  <section class="map"><h2>Yo'nalishlar xaritasi</h2>`;
  LINES.forEach(ln=>{
    const ls=LESSONS.filter(l=>l.line===ln.id),dn=ls.filter(l=>P.done[l.id]).length;
    h+=`<div class="line" style="--lc:${ln.c}"><div class="line-h"><span class="badge">${ln.n}</span><b>${ln.t}</b><small>${dn} / ${ls.length} bekat</small></div><div class="sts">`+
      ls.map(l=>`<a class="st${P.done[l.id]?" done":""}" href="#dars-${l.id}">${l.t}<small>${P.done[l.id]?"★".repeat(stars(P.done[l.id]))+" "+P.done[l.id]+"%":l.s}</small></a>`).join("")+`</div></div>`;
  });
  app.innerHTML=h+`</section>`;
  let k=1;const v=VERBS[0];
  const tick=()=>{const t=TENSES[k%12];$("#bi").textContent=String(k%12+1).padStart(2,"0")+" / 12";
    $("#bw").innerHTML=`<div class="swap" style="--lc:#5FD3A0;display:flex;flex-direction:column;gap:10px"><div class="board-n">${t.n}</div><div class="board-s">${conj(t.k,"She",v,"p").html}</div>${tlSvg(t.tl)}<div class="board-u">${t.uz}</div></div>`;k++};
  tick();timer=setInterval(tick,3200);
}

/* ---------- lesson ---------- */
function lesson(id){
  const L=byId[id],ln=lineOf[L.line],idx=LESSONS.indexOf(L),T=L.tk&&tense[L.tk];
  const inLine=LESSONS.filter(l=>l.line===L.line),forms=L.f&&Object.values(L.f).some(v=>v.includes("n:"));
  const fall=L.f?Object.values(L.f).join(" "):"";
  const key=[["V1","asosiy shakl (go)"],["V2","o'tgan zamon shakli (went)"],["V3","uchinchi shakl (gone)"],["V-ing","-ing shakli (going)"]].filter(k=>fall.includes(k[0]));
  const pre=!P.pre[id]&&!P.done[id]&&items(L).find(x=>x.t==="mc");
  let fh="";
  if(L.f){
    fh=`<section class="blk"><h2>Formula</h2>`;
    if(forms)fh+=`<div class="seg" id="fseg">${[["p","Darak (+)"],["n","Inkor (−)"],["q","Savol (?)"]].filter(x=>L.f[x[0]]).map((x,i)=>`<button type="button" data-f="${x[0]}"${i?"":' class="on"'}>${x[1]}</button>`).join("")}</div><div id="fbox"></div>`;
    else fh+=`<div class="frows">${Object.values(L.f).map(f=>fchips(f)).join("")}</div>`;
    if(key.length)fh+=`<div class="fkey">${key.map(k=>`<span><b>${k[0]}</b> ${k[1]}</span>`).join("")}</div>`;
    fh+=`</section>`;
  }
  if(L.sig)fh+=`<section class="blk"><h2>${T?"Signal so'zlar":"Belgi so'zlar"}</h2><p class="cap">Gapda shularni ko'rsangiz, katta ehtimol bilan aynan shu mavzu.</p><div class="chips">${L.sig.map(s=>`<span class="chip">${s}</span>`).join("")}</div></section>`;
  const steps=[
    ["G'oya",(pre?`<section class="blk pre" id="pre"><p class="vis-t">Avval o'zingiz sinab ko'ring</p><p class="cap">Hali o'rganmagan bo'lsangiz ham taxmin qiling. Avval urinib ko'rilgan narsa yaxshiroq esda qoladi.</p><p class="qq">${pre.q.replace(/___/g,'<span class="gap"></span>')}</p><div class="opts">${shuffle(pre.o.map((t,k)=>[t,k===pre.a])).map(o=>`<button class="opt" type="button" data-ok="${o[1]?1:0}">${o[0]}</button>`).join("")}</div><div id="prefb"></div><button class="back" type="button" id="preskip" style="border:0;background:none;cursor:pointer;padding:0">O'tkazib yuborish</button></section>`:"")+`<div class="stp-in" id="goya"${pre?" hidden":""}><section class="blk idea"><h2>Sodda qilib aytganda</h2><p>${L.idea}</p><p class="mn">${MN[id]}</p></section>`+(T?`<section class="blk"><h2>Vaqt chizig'ida</h2>${tlSvg(T.tl)}<p class="cap">${T.uz}.</p></section>`:"")+visHtml(id)+`</div>`],
    fh&&["Formula",fh],
    ["Misollar",`<section class="blk"><h2>Qachon ishlatiladi</h2><div class="uses">${L.use.map((u,i)=>`<div class="use anf" data-rule="u${i}" style="animation-delay:${i*.12}s"><small>${u[0]}</small><span class="en">${mk(u[1])}</span>${spk(plain(u[1]).replace(/[“”→]/g," "))}<span class="uz">${u[2]}</span></div>`).join("")}</div></section>`+(L.more.length?`<section class="blk"><h2>Mayda, lekin muhim qoidalar</h2><p class="cap">Mashqlarda aynan shu tafsilotlar ham so'raladi.</p><div class="uses">${L.more.map((u,i)=>`<div class="use anf" data-rule="m${i}" style="animation-delay:${i*.12}s"><small>${u[0]}</small><span class="en">${mk(u[1])}</span>${spk(plain(u[1]))}<span class="uz">${u[2]}</span></div>`).join("")}</div></section>`:"")],
    ["Xatolar",`<section class="blk"><h2>Xatoni toping</h2><p class="cap">Avval xato qayerdaligini o'zingiz o'ylab ko'ring, keyin kartochkani bosing.</p><div class="errs">${L.err.map((e,i)=>`<button class="errc" type="button" data-rule="e${i}"><span class="w"><span class="x">✕</span>${e[0]}</span><span class="hint">To'g'risini ko'rish uchun bosing</span><span class="r rv"><span class="v">✓</span>${e[1]}</span><span class="y rv">${e[2]}</span></button>`).join("")}</div></section>`],
    ["Mashq",`<section class="blk"><h2>Mashqlar</h2><div id="qz"></div></section>`]
  ].filter(Boolean);
  app.innerHTML=`<article class="lesson${P.all?" showall":""}" style="--lc:${ln.c}"><a class="back" href="#home">← Xaritaga qaytish</a>
  <header class="l-head"><span class="l-line"><span class="badge">${ln.n}</span> ${ln.t} · ${inLine.indexOf(L)+1}-bekat</span><h1>${L.t}</h1><p class="lead">${L.s}</p></header>
  <div class="l-bar"><div class="stepper" id="stp">${steps.map((s,i)=>`<button type="button" data-i="${i}"><i>${i+1}</i>${s[0]}</button>`).join("")}<button type="button" class="all" id="allb"></button></div>
  <div class="focusbar"><span>Diqqatni qarating:</span><button type="button" class="fa on" data-r="">hammasi</button><button type="button" class="g gs" data-r="s">ega</button><button type="button" class="g ga" data-r="a">yordamchi fe'l</button><button type="button" class="g gv" data-r="v">asosiy fe'l</button><button type="button" class="g gn" data-r="n">inkor</button><button type="button" class="g go" data-r="o">to'ldiruvchi</button><button type="button" class="g gp" data-r="p">joy</button><button type="button" class="g gt" data-r="t">vaqt</button></div></div>
  ${steps.map((s,i)=>`<div class="stp" data-i="${i}">${s[1]}<div class="stp-nav">${i?`<button class="btn" type="button" data-go="${i-1}">← ${steps[i-1][0]}</button>`:"<span></span>"}${i<steps.length-1?`<button class="btn pri" type="button" data-go="${i+1}">Keyingi qadam: ${steps[i+1][0]} →</button>`:""}</div></div>`).join("")}
  <nav class="l-nav">${idx?`<a class="btn" href="#dars-${LESSONS[idx-1].id}">← ${LESSONS[idx-1].t}</a>`:"<span></span>"}${idx<LESSONS.length-1?`<a class="btn" href="#dars-${LESSONS[idx+1].id}">${LESSONS[idx+1].t} →</a>`:""}</nav></article>`;
  const art=$(".lesson"),seen=new Set;
  const go=(i,scroll)=>{
    seen.add(i);
    $$(".stp",art).forEach(s=>{const on=+s.dataset.i===i;s.classList.toggle("cur",on);
      if(on)$$(".an,.anb,.anf",s).forEach(e=>{e.style.animationName="none";e.getBoundingClientRect();e.style.animationName=""})});
    $$("#stp button[data-i]").forEach(b=>{b.classList.toggle("on",+b.dataset.i===i);b.classList.toggle("seen",seen.has(+b.dataset.i))});
    if(scroll){const y=(P.all?$(`.stp[data-i="${i}"]`,art):$(".l-head",art)).getBoundingClientRect().top+window.scrollY-(P.all?130:70);window.scrollTo({top:y,behavior:"smooth"})}
  };
  const allLabel=()=>{$("#allb").textContent=P.all?"Qadam-baqadam ko'rish":"Hammasini birga ko'rish"};
  $$("#stp button[data-i]").forEach(b=>b.onclick=()=>go(+b.dataset.i,true));
  $$("[data-go]",art).forEach(b=>b.onclick=()=>go(+b.dataset.go,true));
  $("#allb").onclick=()=>{P.all=!P.all;save();art.classList.toggle("showall",P.all);allLabel()};
  $$(".focusbar button",art).forEach(b=>b.onclick=()=>{
    if(b.dataset.r)art.dataset.focus=b.dataset.r;else delete art.dataset.focus;
    $$(".focusbar button",art).forEach(x=>x.classList.toggle("on",x===b));
  });
  $$(".errc",art).forEach(b=>b.onclick=()=>b.classList.toggle("open"));
  window.gotoRule=ref=>{
    const el=$(`[data-rule="${ref}"]`,art);if(!el)return;
    const st=+el.closest(".stp").dataset.i;go(st);if(el.classList.contains("errc"))el.classList.add("open");
    setTimeout(()=>{window.scrollTo({top:el.getBoundingClientRect().top+window.scrollY-170,behavior:"smooth"});el.classList.remove("flash");el.getBoundingClientRect();el.classList.add("flash")},60);
  };
  allLabel();go(0);
  if(window.HL&&window.HL[0]===id){const r=window.HL[1];window.HL=null;if(pre){$("#pre").remove();P.pre[id]=1;$("#goya").hidden=false}setTimeout(()=>window.gotoRule(r),80)}
  if(pre&&$("#pre")){
    const open=()=>{P.pre[id]=1;save();$("#goya").hidden=false;const sk=$("#preskip");if(sk)sk.remove();$$("#goya .an,#goya .anb,#goya .anf").forEach(e=>{e.style.animationName="none";e.getBoundingClientRect();e.style.animationName=""})};
    $("#preskip").onclick=()=>{$("#pre").remove();open()};
    $$("#pre .opt").forEach(b=>b.onclick=()=>{
      $$("#pre .opt").forEach(x=>{x.disabled=true;if(x.dataset.ok==="1")x.classList.add("ok")});
      const ok=b.dataset.ok==="1";if(!ok)b.classList.add("bad");
      $("#prefb").innerHTML=`<div class="fb ${ok?"ok":"bad"} anf"><b>${ok?"To'g'ri topdingiz!":"Hali bilmasligingiz tabiiy"}</b><span>Nima uchun shundayligini quyidagi tushuntirishdan bilib olasiz.</span></div>`;open();
    });
  }
  if(forms){
    const draw=f=>{$("#fbox").innerHTML=fchips(L.f[f],true)+(T?`<p class="fm-ex anf" style="margin-top:12px">${conj(L.tk,"She",VERBS[0],f).html}</p>`:"");$$("#fseg button").forEach(b=>b.classList.toggle("on",b.dataset.f===f))};
    $$("#fseg button").forEach(b=>b.onclick=()=>draw(b.dataset.f));draw("p");
  }
  const trs=()=>{if(!T)return [];const s=pick(SUBJ),v=pick(VERBS);return [["n","Gapni inkor shaklga o'tkazing."],["q","Shu gapdan savol yasang."]].map(([f,q])=>({t:"tr",q,src:conj(L.tk,s,v,"p").text,a:[conj(L.tk,s,v,f).text],w:"",les:id}))};
  const start=()=>quiz($("#qz"),[...items(L),...trs()],(sc,n)=>{
    const p=Math.round(sc/n*100),pass=p>=70;
    if(pass){P.done[id]=Math.max(P.done[id]||0,p);save();count()}
    const nx=LESSONS[idx+1];
    $("#qz").innerHTML=`<div class="res"><div class="big">${sc} / ${n}</div><div class="stars" aria-label="${stars(p)} yulduz">${"★".repeat(stars(p))}${"☆".repeat(3-stars(p))}</div>
      <p>${pass?"Bekat o'tildi. "+(p===100?"Hammasi to'g'ri!":"Uch yulduz uchun yana bir urinib ko'ring."):"Bekatni ochish uchun kamida 70 foiz kerak. Tushuntirishni qayta o'qib, yana urinib ko'ring."}</p>
      <div class="hero-act"><button class="btn" id="re" type="button">Qayta ishlash</button>${pass&&doneCount()>1?`<button class="btn" id="mx" type="button">Aralash mashq: oldingi mavzular bilan</button>`:""}${pass&&nx?`<a class="btn pri" href="#dars-${nx.id}">Keyingi bekat: ${nx.t}</a>`:""}</div>
      <p class="cap">Bu savollar takror bo'limida bir necha kundan keyin yana chiqadi.</p>${cardHtml(L)}</div>`;
    $("#re").onclick=start;
    if($("#mx"))$("#mx").onclick=()=>quiz($("#qz"),mixItems(id),(s2,n2)=>{$("#qz").innerHTML=`<div class="res"><div class="big">${s2} / ${n2}</div><p>Aralash mashq tugadi. Xato qilingan savollar ertaga takrorga chiqadi.</p><div class="hero-act"><button class="btn" id="re" type="button">Dars mashqini qayta ishlash</button>${nx?`<a class="btn pri" href="#dars-${nx.id}">Keyingi bekat: ${nx.t}</a>`:""}</div></div>`;$("#re").onclick=start},{link:true});
  });
  start();
}

/* ---------- detector ---------- */
const DET={q:"Nima demoqchisiz?",o:[
["Ish-harakat qachon bo'lishini aytmoqchiman",{q:"Ish-harakat qaysi vaqtga tegishli?",o:[
 ["O'tmishga",{q:"O'tmishdagi bu ish qanday?",o:[
  ["Bo'ldi va tugadi, qachonligi ma'lum (kecha, o'tgan yili)","pasts"],["O'sha paytda davom etayotgan edi (fon)","pastc"],["O'tmishdagi boshqa ishdan oldin tugagan edi","pastp"],["O'tmishdagi paytgacha ma'lum vaqt davom etgan edi","pastpc"],["Bo'lgan, lekin qachonligi aytilmaydi, natijasi hozir muhim","pp"],["Ilgari odat edi, endi yo'q","L:used-to"]]}],
 ["Hozirga",{q:"Hozirgi bu ish qanday?",o:[
  ["Odat, har doim shunday, doimiy haqiqat","ps"],["Aynan hozir yoki shu kunlarda davom etyapti","pc"],["Oldin boshlangan va hozirgacha davom etyapti (qachondan beri)","ppc"],["Hozirgina tugadi, natijasi ko'z oldimizda","pp"]]}],
 ["Kelajakka",{q:"Kelajakdagi bu ish qanday?",o:[
  ["Hozir qaror qildim, va'da yoki taxmin","fs"],["Oldindan reja qilganman yoki dalil ko'rinib turibdi","L:going-to"],["Kelajakdagi aniq paytda davom etayotgan bo'ladi","fc"],["Belgilangan muddatgacha tugab bo'ladi (by ...)","fp"],["Muddatgacha ma'lum vaqt davom etgan bo'ladi","fpc"]]}]]}],
["Qila olish, majburiyat, maslahat yoki ehtimolni",{q:"Aniqrog'i qaysi biri?",o:[
 ["Qila olaman, ruxsat, iltimos","L:can-could"],["Majbur, shart emas yoki taqiq","L:must-have-to"],["Maslahat bermoqchiman","L:should"],["Ehtimol yoki xulosa (balki, bo'lsa kerak)","L:may-might"]]}],
["Shart yoki orzuni (agar ..., qaniydi ...)",{q:"Bu shart qanday?",o:[
 ["Doim shunday bo'ladi yoki kelajakda bo'lishi mumkin","L:cond-0-1"],["Hozir haqida xayol, real emas","L:cond-2"],["O'tmish haqida afsus, o'zgartirib bo'lmaydi","L:cond-3"],["Qaniydi ... (orzu, norozilik)","L:wish"]]}],
["Kim qilgani muhim emas, nima qilingani muhim",{q:"Qaysi zamonda?",o:[
 ["Hozirgi yoki o'tgan oddiy zamon (qilinadi, qilindi)","L:passive-basic"],["Boshqa zamonlar yoki modal bilan","L:passive-tenses"]]}],
["Birovning gapini yetkazmoqchiman",{q:"U nima degan edi?",o:[
 ["Oddiy gap aytgan","L:rep-statements"],["Savol bergan, buyurgan yoki iltimos qilgan","L:rep-questions"]]}],
["Savol bermoqchiman",{q:"Qanday savol?",o:[
 ["Oddiy savol (ha / yo'q yoki nima, qayerda, qachon)","L:questions"],["Tasdiqlatib olish: shunday emasmi?","L:tag-questions"]]}],
["Narsa, miqdor, joy yoki vaqtni aniq aytmoqchiman",{q:"Nimani aniqlashtirmoqchisiz?",o:[
 ["Kim yoki nima ekanini (am, is, are)","L:to-be"],["Biror joyda nimadir borligini","L:there-is"],["Kimda nima borligini","L:have-got"],["Qaysi narsa: a, an yoki the","L:articles"],["Qancha yoki nechta","L:countable"],["Qachon: in, on, at","L:prep-time"],["Qayerda yoki qayerga","L:prep-place"]]}],
["Solishtirmoqchi yoki tasvirlamoqchiman",{q:"Nimani?",o:[
 ["Kattaroq, yaxshiroq, eng zo'r","L:comparison"],["Ish qanday bajarilganini (tez, yaxshi)","L:adverbs"]]}],
["Gaplarni ulash yoki fe'llarni yonma-yon qo'yish",{q:"Qaysi holat?",o:[
 ["Odam yoki narsani gap bilan ta'riflash (who, which)","L:relative"],["Sabab, natija, zidlik (because, so, although)","L:linkers"],["Ikki fe'l yonma-yon: -ing yoki to","L:gerund-inf"],["So'zlarni gapda to'g'ri tartibda qo'yish","L:word-order"]]}]
]};
function detektor(){
  const sig={};LESSONS.forEach(l=>(l.sig||[]).forEach(s=>(sig[s]=sig[s]||[]).push(l)));
  app.innerHTML=`<section class="page"><div><h1>Grammatika detektori</h1></div><p class="lead">Aytmoqchi bo'lgan fikringiz haqida savollarga javob bering. Detektor butun grammatika ichidan kerakli mavzuni, formulasini va misolini topib beradi.</p>
  <div class="det"><div class="card steps" id="steps"></div><div class="card outc" id="out" style="--lc:var(--rule)"></div></div>
  <div class="card" style="display:flex;flex-direction:column;gap:12px"><h2>Belgi so'z bo'yicha qidirish</h2><p class="cap">Gapda uchragan so'zni bosing, u qaysi mavzuga ishora qilishini ko'rasiz.</p>
  <div class="chips">${Object.keys(sig).sort((a,b)=>a.localeCompare(b)).map(s=>`<button class="chip" type="button" data-s="${esc(s)}">${s}</button>`).join("")}</div><div id="sg" class="cap">Hali so'z tanlanmadi.</div></div></section>`;
  let path=[];
  const out=k=>{
    const o=$("#out");
    if(!k){o.style.setProperty("--lc","var(--rule)");o.innerHTML=`<h2>Natija shu yerda chiqadi</h2><p class="cap" style="margin-top:8px">Savollarga javob bering.</p>`;return}
    const isL=k.startsWith("L:"),t=isL?null:tense[k],L=byId[isL?k.slice(2):t.les],ln=lineOf[L.line];
    const ex=isL?{html:mk(L.use[0][1]),text:plain(L.use[0][1])}:conj(k,"She",VERBS[0],"p");
    o.style.setProperty("--lc",ln.c);
    o.innerHTML=`<div style="display:flex;flex-direction:column;gap:12px" class="anf"><p class="eyebrow">Sizga kerakli mavzu</p><h2 style="font-size:28px">${isL?L.t:t.n}</h2><p>${isL?L.s:t.uz}.</p>${L.f||t&&t.f?fchips(t&&t.f||L.f.p,true):""}<div class="cell-b"><span class="fm-ex">${ex.html}</span>${spk(ex.text)}</div>${t&&t.tl?tlSvg(t.tl):""}<a class="btn pri" href="#dars-${L.id}" style="align-self:flex-start">Darsni ochish</a></div>`;
  };
  const draw=()=>{
    let node=DET,h="",lvl=0,res=null;
    while(node&&node.q){
      const sel=path[lvl];
      h+=`<div class="step"><h3>${lvl+1}. ${node.q}</h3><div class="opts">${node.o.map((o,j)=>`<button class="opt${sel===j?" on":""}" type="button" data-l="${lvl}" data-j="${j}"${sel!=null&&sel!==j?' style="display:none"':""}>${o[0]}</button>`).join("")}${sel!=null?`<button class="back" type="button" data-l="${lvl}" data-j="-1" style="border:0;background:none;cursor:pointer;padding:0;text-align:left">Boshqa javob tanlash</button>`:""}</div></div>`;
      if(sel==null)break;
      const nx=node.o[sel][1];if(typeof nx==="string"){res=nx;break}node=nx;lvl++;
    }
    $("#steps").innerHTML=h;out(res);
    $$("#steps [data-l]").forEach(b=>b.onclick=()=>{path=path.slice(0,+b.dataset.l);if(+b.dataset.j>=0)path.push(+b.dataset.j);draw()});
  };
  draw();
  $$(".chips .chip",app).forEach(b=>b.onclick=()=>{
    $$(".chips .chip",app).forEach(x=>x.classList.toggle("on",x===b));
    $("#sg").innerHTML=`<b>${b.dataset.s}</b> shu mavzularga ishora qiladi: `+sig[b.dataset.s].map(l=>`<a href="#dars-${l.id}">${l.t}</a>`).join(", ")+".";
  });
}

/* ---------- sentence analyzer ---------- */
const XIR="become became become|bite bit bitten|blow blew blown|cut cut cut|draw drew drawn|grow grew grown|hide hid hidden|hit hit hit|hold held held|keep kept kept|lend lent lent|let let let|put put put|ride rode ridden|ring rang rung|rise rose risen|set set set|show showed shown|shut shut shut|spend spent spent|stand stood stood|steal stole stolen|throw threw thrown|wake woke woken|cost cost cost|mean meant meant|fight fought fought|feed fed fed|lead led led|stick stuck stuck|lay laid laid|freeze froze frozen|shake shook shaken|tear tore torn|bear bore born|hurt hurt hurt|hang hung hung|dig dug dug|shoot shot shot|bend bent bent|forgive forgave forgiven";
const LEX={v2:new Set,v3:new Set,ed:new Set,v0:new Set,base:new Set("work play watch study live like love want need help call ask answer open close start finish stop try use walk talk look listen learn cook clean wash visit travel arrive stay wait rain snow happen move change turn enjoy hope decide plan remember believe agree pass fail miss carry cry smile laugh jump dance paint repair invite".split(" "))};
[...IRREG.map(v=>[v[0],v[1],v[2]]),...XIR.split("|").map(x=>x.split(" "))].forEach(([b,p,pp])=>{
  if(b==="be"||b==="have"||b==="do")return;LEX.base.add(b);
  if(pp===b){LEX.v0.add(b);if(p!==b)LEX.v2.add(p)}else if(p===pp)LEX.ed.add(p);else{LEX.v2.add(p);LEX.v3.add(pp)}
});
LEX.v3.add("done");
const AUXT={am:"BE",is:"BE",are:"BE",was:"WAS",were:"WAS",be:"BE0",been:"BEEN",being:"BEING",have:"HAVE",has:"HAVE",had:"HAD",do:"DO",does:"DO",did:"DID",will:"WILL",shall:"WILL",would:"WOULD",can:"MOD",could:"MOD",may:"MOD",might:"MOD",must:"MOD",should:"MOD"};
const PRON=new Set(["i","you","he","she","it","we","they"]);
const ADVS=new Set("just already never ever always often still also really usually sometimes probably recently only yet certainly definitely".split(" "));
const NOTV=new Set("tired interested bored excited married worried surprised scared pleased crowded talented relaxed frightened embarrassed confused disappointed satisfied need bed red hundred indeed speed seed weed shed naked wicked thing nothing something anything everything morning evening during king wing ceiling interesting boring exciting amazing wedding spring string".split(" "));
function wtag(w){
  if(AUXT[w])return AUXT[w];
  if(w==="not")return "NOT";if(w==="to")return "TO";if(PRON.has(w))return "PR";if(ADVS.has(w))return "ADV";if(w==="going")return "GOING";
  if(NOTV.has(w))return "x";
  if(LEX.v3.has(w))return "V3";if(LEX.v2.has(w))return "V2";if(LEX.ed.has(w))return "ED";if(LEX.v0.has(w))return "V0";
  if(/[a-z]{2,}ed$/.test(w))return "ED";if(/[a-z]{2,}ing$/.test(w))return "ING";
  if(LEX.base.has(w)||LEX.base.has(w.replace(/ies$/,"y"))||LEX.base.has(w.replace(/es$/,""))||LEX.base.has(w.replace(/s$/,"")))return "VB";
  return "x";
}
function analyze(raw){
  raw=raw.replace(/[’‘]/g,"'").trim();
  const toks=raw.match(/[A-Za-z']+|\d+|[^\sA-Za-z\d]/g)||[];
  const flat=[];// {w,tag,ti}
  toks.forEach((tk,ti)=>{
    const w=tk.toLowerCase();if(!/[a-z\d]/.test(w))return;
    const push=x=>flat.push({w:x,tag:wtag(x),ti});
    let m;
    if(m=w.match(/^(.+)n't$/)){push({ca:"can",wo:"will",sha:"shall"}[m[1]]||m[1]);push("not")}
    else if(w==="cannot"){push("can");push("not")}
    else if(m=w.match(/^(.+)'(m|re|ve|ll|d|s)$/)){
      push(m[1]);
      if(m[2]==="m")push("am");else if(m[2]==="re")push("are");else if(m[2]==="ve")push("have");else if(m[2]==="ll")push("will");
      else if(m[2]==="d")flat.push({w:"'d",tag:"D?",ti});
      else if(PRON.has(m[1])||["there","that","what","who","where","here","how"].includes(m[1]))flat.push({w:"'s",tag:"S?",ti});
    }else push(w);
  });
  flat.forEach((f,i)=>{
    if(f.tag!=="D?"&&f.tag!=="S?")return;
    let j=i+1;while(flat[j]&&(flat[j].tag==="ADV"||flat[j].tag==="NOT"))j++;
    const nt=flat[j]?flat[j].tag:"",nw=flat[j]?flat[j].w:"";
    if(f.tag==="D?"){const h=["V3","ED","BEEN"].includes(nt)||nw==="better";f.w=h?"had":"would";f.tag=h?"HAD":"WOULD"}
    else{const h=["V3","ED","BEEN"].includes(nt)||nw==="got";f.w=h?"has":"is";f.tag=h?"HAVE":"BE"}
  });
  const isQ=/\?\s*$/.test(raw),low=" "+flat.map(f=>f.w).join(" ")+" ",T=" "+flat.map(f=>f.tag).join(" ")+" ";
  const G=isQ?"(?: (?:x|ADV|NOT|PR|VB)){0,4}":"(?: (?:ADV|NOT|PR)){0,3}",V="(?:V3|ED|V0)",I="(?:ING|GOING)";
  const has=(...seq)=>new RegExp(" "+seq.join(G+" ")+" ").test(T),hw=re=>re.test(low);
  const F=[];const add=(k,h,p,les,main)=>F.push({k,h,p,les,main});
  let tn=null,pas=false,why="";
  const set=(k,w,p)=>{if(!tn){tn=k;why=w;pas=!!p}};
  if(has("WILL","HAVE","BEEN",V))set("fp","will have been + V3",1);
  if(has("WILL","HAVE","BEEN",I))set("fpc","will have been + V-ing");
  if(has("WILL","BE0",V))set("fs","will be + V3",1);
  if(has("WILL","BE0",I))set("fc","will be + V-ing");
  if(has("WILL","HAVE",V))set("fp","will have + V3");
  let modal=null;
  const cw=/ (if|unless|wish|wishes|wished) /.test(low)||/ if only /.test(low);
  if(cw);else if(has("(?:MOD|WOULD)","HAVE",V))modal="modal + have + V3 (o'tmish haqida)";
  else if(has("(?:MOD|WOULD)","BE0",V)){modal="modal + be + V3";pas=true}
  if(!modal){
    if(has("HAVE","BEEN",I))set("ppc","have / has been + V-ing");
    if(has("HAD","BEEN",I))set("pastpc","had been + V-ing");
    if(has("HAVE","BEEN",V))set("pp","have / has been + V3",1);
    if(has("HAD","BEEN",V))set("pastp","had been + V3",1);
    if(has("BE","BEING",V))set("pc","am / is / are being + V3",1);
    if(has("WAS","BEING",V))set("pastc","was / were being + V3",1);
  }
  const goingTo=has("(?:BE|WAS)","GOING","TO");
  if(!modal&&!goingTo){
    if(has("BE",I))set("pc","am / is / are + V-ing");
    if(has("WAS",I))set("pastc","was / were + V-ing");
    if(has("BE",V))set("ps","am / is / are + V3",1);
    if(has("WAS",V))set("pasts","was / were + V3",1);
    if(hw(/ (have|has) (not )?got /))set("ps","have / has got (egalik)");
    if(has("HAVE",V))set("pp","have / has + V3");
    if(has("HAD",V)&&!hw(/ had better /))set("pastp","had + V3");
    if(/ WILL /.test(T))set("fs","will + V1");
  }
  const anyMod=/ (MOD|WOULD) /.test(T);
  if(!tn&&!modal&&!anyMod&&!goingTo){
    if(hw(/ used to /))set("pasts","used to + V1");
    else if(/ DID /.test(T))set("pasts","did + V1");
    else if(/ V2 /.test(T))set("pasts","fe'lning ikkinchi shakli (V2)");
    else if(/ ED /.test(T))set("pasts","fe'l + ed");
    else if(/ WAS /.test(T))set("pasts","was / were");
    else if(/ DO /.test(T))set("ps","do / does + V1");
    else if(/ BE /.test(T))set("ps","am / is / are");
    else if(/ (VB|V0|HAVE) /.test(T))set("ps","fe'lning asosiy shakli (V1)");
  }
  const cond=hw(/ (if|unless) /)&&!hw(/ (asked?|asks|wonder\w*|know|tell \w+) if /);
  const wish=hw(/ (wish|wishes|wished) | if only /);
  if(wish){
    const sub=has("HAD",V)||/ HAD BEEN /.test(T)?"o'tmishdagi ishdan afsus (wish + Past Perfect)":/ WOULD /.test(T)?"birovning odatidan norozilik (wish + would)":"hozirgi holatdan norozilik (wish + Past Simple)";
    add("Orzu va afsus","I wish / If only",sub,"wish",true);
  }else if(cond){
    const wh=has("WOULD","HAVE",V)||(hw(/ (could|might) /)&&has("MOD","HAVE",V)),hadv=has("HAD",V)||/ HAD(?: NOT)? BEEN /.test(T),wo=/ WOULD /.test(T)||(hw(/ (could|might) /)&&/ (V2|ED|WAS|DID) /.test(T));
    if(hadv&&wh)add("Shart gap","Third Conditional","if + had + V3, would have + V3: o'tmishdagi afsus","cond-3",true);
    else if(hadv&&wo)add("Shart gap","Mixed Conditional","if + had + V3, would + V1: o'tmishdagi sabab, hozirgi natija","cond-3",true);
    else if(wo)add("Shart gap","Second Conditional","if + Past Simple, would + V1: hozir haqida xayol","cond-2",true);
    else if(/ (WILL|MOD) /.test(T))add("Shart gap","First Conditional","if + Present Simple, will + V1: haqiqiy kelajak","cond-0-1",true);
    else add("Shart gap","Zero Conditional","if + Present Simple, Present Simple: doimiy haqiqat","cond-0-1",true);
  }
  const rep=!/["“”]/.test(raw)&&hw(/ (said|told|asked|explained|replied|answered) /);
  if(rep){
    if(hw(/ asked /)||hw(/ told \w+ (not )?to /))add("O'zlashtirma gap","Reported: savol yoki buyruq",hw(/ asked /)?"asked + if / wh-so'z + darak tartibi":"told + kim + (not) to + V1","rep-questions",!F.length);
    else add("O'zlashtirma gap","Reported: darak gap","said / told + zamon bir qadam orqaga surilgan","rep-statements",!F.length);
  }
  const plainTense=!cond&&!wish;
  if(goingTo&&plainTense)add("Kelajak","Be going to","am / is / are going to + V1: reja yoki dalil","going-to",!F.length);
  if(tn&&!modal){
    const t=tense[tn];
    add(plainTense&&!rep?"Zamon":"Fe'l guruhi zamoni",t.n+(pas?" · Passive":""),why+". "+t.uz+".",t.les,!F.length);
  }
  if(pas)add("Nisbat","Passive Voice","be + V3: nima qilingani muhim, kim qilgani emas",tn==="ps"||tn==="pasts"?"passive-basic":"passive-tenses");
  if(modal)add("Modal qurilma",modal,modal.includes("have")?"should have + V3 afsus, must have + V3 xulosa":"modal fe'ldan keyin be + V3",modal.includes("have")?"should":"passive-tenses",!F.length);
  const md=(re,h,p,les)=>{if(hw(re))add("Modal fe'l",h,p,les,!F.length&&!tn)};
  md(/ (can|could) | (am|is|are|was|were|be|been) able to /,"can / could / be able to","qobiliyat, ruxsat yoki iltimos","can-could");
  md(/ must | (have|has|had) to /,"must / have to","majburiyat; mustn't taqiq, don't have to shart emas","must-have-to");
  md(/ should | ought to | had better /,"should / ought to / had better","maslahat","should");
  md(/ (may|might) /,"may / might","ehtimol yoki rasmiy ruxsat","may-might");
  if(hw(/ must be | can not be /))add("Xulosa","must be / can't be","dalilga asoslangan aniq xulosa","may-might");
  if(/ WOULD /.test(T)&&!cond&&!wish&&!rep)add("Would","would + V1","muloyim iltimos, taklif yoki xayoliy natija","cond-2",!F.length&&!tn);
  if(isQ){
    if(/,\s*[a-z']+(n't)?( not)? (i|you|he|she|it|we|they|there)\s*\?\s*$/i.test(raw))add("Savol","Tag question","gap ijobiy bo'lsa dumcha inkor, inkor bo'lsa ijobiy","tag-questions");
    else if(/^(do you know|can you tell|could you tell|i wonder)/i.test(raw))add("Savol","Bilvosita savol","ichki savolda darak tartibi: ega + fe'l","questions");
    else if(/^(who|what|which)\s+(?!do |does |did |is |are |was |were |will |can |have |has |would |should )/i.test(raw))add("Savol","Egaga savol","who / what + fe'l, do / does / did ishlatilmaydi","questions");
    else if(/^(who|what|where|when|why|how|which|whose)\b/i.test(raw))add("Savol","Wh-savol","so'roq so'z + yordamchi fe'l + ega + fe'l","questions");
    else add("Savol","Ha / yo'q savoli","yordamchi fe'l eganing oldiga chiqadi","questions");
  }
  if(hw(/ there (is|are|was|were|will be|has been|have been) /))add("Qurilma","There is / there are","biror joyda nimadir bor","there-is");
  if(hw(/ (have|has) (not )?got /))add("Qurilma","Have got","egalik: kimda nima bor","have-got");
  if(hw(/ used? to /)&&!hw(/ (am|is|are|was|were|get|got) used to /))add("Qurilma","Used to","ilgari odat edi, endi yo'q","used-to");
  if(hw(/ than | the (most|least) \w+ | the \w+est | as \w+ as | (better|worse|best|worst) /))add("Sifat darajasi","Qiyoslash",hw(/ the (most|\w+est|best|worst) /)?"orttirma daraja: the + -est / the most":hw(/ as \w+ as /)?"tenglik: as + sifat + as":"qiyosiy daraja: -er / more + than","comparison");
  if(hw(/ (enjoy\w*|finish\w*|mind|avoid\w*|keeps?|kept|suggest\w*|practis\w*|consider\w*) (not )?\w+ing /))add("Ikki fe'l","Fe'l + V-ing (gerund)","enjoy, finish, mind, avoid dan keyin -ing","gerund-inf");
  if(hw(/ (want\w*|decide\w*|hope\w*|plan\w*|need\w*|promise\w*|learn\w*|agree\w*|refuse\w*|offer\w*|manage\w*) (not )?to \w+/))add("Ikki fe'l","Fe'l + to V1 (infinitive)","want, decide, hope, plan dan keyin to","gerund-inf");
  {const m=low.match(/ (at|of|about|for|after|before|without|by|in) (\w{3,}ing) /);if(m&&!NOTV.has(m[2]))add("Predlog + fe'l","Predlog + V-ing",m[1]+" dan keyin fe'l -ing oladi: "+m[2],"gerund-inf")}
  if(!/^(who|which|whose|where)\b/i.test(raw)&&hw(/ \w+ (who|which|whose) | the \w+ (that|where) \w+/))add("Murakkab gap","Relative clause","who, which, that, whose, where ot haqida qo'shimcha ma'lumot beradi","relative");
  {const m=low.match(/ (because of|because|although|though|however|despite|in spite of|so that|therefore|but) /);if(m)add("Bog'lovchi",m[1],({because:"sabab","because of":"sabab (ot oldidan)",although:"zidlik",though:"zidlik",however:"zidlik",despite:"zidlik (ot oldidan)","in spite of":"zidlik (ot oldidan)","so that":"maqsad",therefore:"natija",but:"zidlik"})[m[1]],"linkers")}
  {const m=low.match(/ (how much|how many|much|many|a few|a little|a lot of|some|any) /);if(m)add("Miqdor",m[1],"sanaladigan va sanalmaydigan otlarga qarab tanlanadi","countable")}
  {const m=low.match(/ (in|on|at) (\d{4}|january|february|march|april|may|june|july|august|september|october|november|december|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}|night|noon|midnight|the (morning|afternoon|evening)|summer|winter|spring|autumn|weekends?) /)||low.match(/ (since|ago) /);
   if(m)add("Vaqt predlogi",m[1],"in: uzun davr, on: kun, at: aniq soat; since: ...dan beri, ago: oldin","prep-time")}
  if(!F.length)add("Natija","Aniq qurilma topilmadi","Gapda tanish fe'l shakli uchramadi. Gapni to'liq va inglizcha yozganingizni tekshiring.","word-order",true);
  if(!F.some(f=>f.main))F[0].main=true;
  F.sort((a,b)=>(b.main?1:0)-(a.main?1:0));
  // colouring
  const role={};let firstV=flat.findIndex(f=>!["x","PR","ADV","TO","NOT"].includes(f.tag));
  flat.forEach((f,i)=>{
    let r=null;const nx=flat.slice(i+1).find(x=>!["ADV","NOT","PR"].includes(x.tag));
    if(["BE","WAS","BE0","BEEN","BEING","WILL","WOULD","MOD"].includes(f.tag))r="a";
    else if(["HAVE","HAD","DO","DID"].includes(f.tag))r=nx&&["V3","ED","V0","VB","BEEN","ING","V2","HAVE","BE0"].includes(nx.tag)||isQ&&i===0?"a":"v";
    else if(f.tag==="GOING")r=flat[i+1]&&flat[i+1].tag==="TO"?"a":"v";
    else if(["VB","V0"].includes(f.tag)&&flat[i-1]&&/^(the|a|an|my|your|his|her|our|their|this|that|some|any)$/.test(flat[i-1].w))r=null;
    else if(["V3","V2","ED","V0","ING","VB"].includes(f.tag))r="v";
    else if(f.tag==="NOT")r="n";
    else if(f.tag==="PR")r="s";
    if(r)role[f.ti]=role[f.ti]==="a"?"a":r;
  });
  if(firstV>0&&!isQ&&!flat.slice(0,firstV).some(f=>f.tag==="PR")){const ti=flat[firstV].ti;let st=ti-1,n=0;while(st>=0&&n<4&&/^[A-Za-z]+$/.test(toks[st])&&(role[st]==null||ADVS.has(toks[st].toLowerCase()))&&!/^(if|when|because|although|and|but|that|so|while|after|before|unless)$/i.test(toks[st])){if(!ADVS.has(toks[st].toLowerCase()))role[st]="s";st--;n++}}
  const isW=i=>/^[A-Za-z'\d]/.test(toks[i]||"");
  let vs=toks.map((t,i)=>role[i]==="v"?i:-1).filter(i=>i>=0);
  if(!vs.length&&!isQ){const la=toks.map((t,i)=>role[i]==="a"?i:-1).filter(i=>i>=0);if(la.length){let k=la[0];while(role[k+1]==="a"||role[k+1]==="n")k++;vs=[k]}}
  vs.forEach(v=>{
    let j=v+1;while(role[j]==="n")j++;
    const st=j;while(j<toks.length&&isW(j)&&role[j]==null)j++;
    if(j>st){const rs=colorTail(toks.slice(st,j).map(x=>x.toLowerCase()),role[j]==="v",toks[v].toLowerCase());rs.forEach((r,k)=>{if(r)role[st+k]=r})}
  });
  let html="";
  for(let i=0;i<toks.length;i++){
    const sp=i&&!(toks[i].length===1&&/^[^A-Za-z\d]/.test(toks[i]))?" ":"";
    if(!role[i]){html+=sp+toks[i].replace(/</g,"&lt;");continue}
    let j=i;while("opts".includes(role[i])&&role[j+1]===role[i])j++;
    html+=sp+`<span class="g g${role[i]}">${toks.slice(i,j+1).join(" ")}</span>`;i=j;
  }
  return {html,F,text:raw};
}
function tahlil(){
  const exs=["She has been working here since 2020.","If I had known, I would have called you.","The bridge was built in 1990.","He told me that he was tired.","You should see a doctor.","This is the most interesting book I have ever read.","Where does your brother work?","I enjoy reading books in the evening."];
  app.innerHTML=`<section class="page"><h1>Gap tahlilchisi</h1><p class="lead">Istalgan inglizcha gapni yozing. Tahlilchi undagi zamonni, modal fe'lni, shart gapni, majhul nisbatni va boshqa qurilmalarni ajratib ko'rsatadi hamda tegishli darsga yo'llaydi.</p>
  <form class="an-in" id="af"><input id="as" aria-label="Inglizcha gap" autocomplete="off" spellcheck="false" placeholder="Inglizcha gap yozing"><button class="btn pri">Tahlil qilish</button></form>
  <div class="chips">${exs.map(e=>`<button class="chip" type="button" data-e="${esc(e)}">${e}</button>`).join("")}</div>
  <div class="card" style="display:flex;flex-direction:column;gap:14px"><div class="cell-b"><div class="an-s" id="ar"></div><span id="asp"></span></div>
  <div class="legend">${LEG}</div></div>
  <div class="finds" id="afn"></div>
  <p class="cap">Tahlilchi qoidalar asosida ishlaydi. Juda uzun yoki noodatiy gaplarda adashishi mumkin, shuning uchun natijani dars bilan solishtirib ko'ring.</p></section>`;
  const run=s=>{
    if(!s.trim())return;$("#as").value=s;const r=analyze(s);
    $("#ar").innerHTML=r.html;$("#asp").innerHTML=spk(r.text);
    $("#afn").innerHTML=r.F.map((f,i)=>{const L=byId[f.les],c=L?lineOf[L.line].c:"var(--rule)";
      return `<div class="find anf${f.main?" main":""}" style="--lc:${c};animation-delay:${i*.08}s"><small>${f.k}</small><b>${f.h}</b><span>${f.p}</span>${L?`<a href="#dars-${L.id}">Dars: ${L.t} →</a>`:""}</div>`}).join("");
  };
  $("#af").onsubmit=e=>{e.preventDefault();run($("#as").value)};
  $$(".chip[data-e]").forEach(b=>b.onclick=()=>run(b.dataset.e));
  run(exs[0]);
}
/* ---------- 12 tenses table ---------- */
function jadval(){
  let s="She",v=0,f="p";
  app.innerHTML=`<section class="page"><h1>12 zamon jadvali</h1><p class="lead">Ega, fe'l va gap turini tanlang. Bitta gap barcha zamonlarda qanday o'zgarishini solishtiring.</p>
  <div class="ctl"><label for="sj">Ega</label><select id="sj">${SUBJ.map(x=>`<option${x===s?" selected":""}>${x}</option>`).join("")}</select>
  <label for="vb">Fe'l</label><select id="vb">${VERBS.map((x,i)=>`<option value="${i}">${x.b} ${x.r}</option>`).join("")}</select>
  <div class="seg" id="fm">${[["p","Darak (+)"],["n","Inkor (−)"],["q","Savol (?)"]].map((x,i)=>`<button type="button" data-f="${x[0]}"${i?"":' class="on"'}>${x[1]}</button>`).join("")}</div></div>
  <div class="scroll"><div class="grid12" id="g"></div></div>
  <div class="legend">${LEG}</div></section>`;
  const rows=["Simple","Continuous","Perfect","Perfect Continuous"],cols=["#2F7FE0","#1E9E6A","#8B5CD6"];
  const draw=()=>{
    let h=`<span></span><span class="hd">O'tgan</span><span class="hd">Hozirgi</span><span class="hd">Kelasi</span>`;
    TENSES.forEach((t,i)=>{
      if(i%3===0)h+=`<span class="hd">${rows[i/3]}</span>`;
      const c=conj(t.k,s,VERBS[v],f);
      h+=`<div class="cell" style="--lc:${cols[i%3]}"><b>${t.n}</b><div class="cell-b"><span class="sen">${c.html}</span>${spk(c.text)}</div><span class="cap">${t.uz}</span><a href="#dars-${t.les}">Darsni ochish</a></div>`;
    });
    $("#g").innerHTML=h;
  };
  $("#sj").onchange=e=>{s=e.target.value;draw()};$("#vb").onchange=e=>{v=+e.target.value;draw()};
  $$("#fm button").forEach(b=>b.onclick=()=>{f=b.dataset.f;$$("#fm button").forEach(x=>x.classList.toggle("on",x===b));draw()});
  draw();
}

/* ---------- tests ---------- */
function tenseGame(n){
  return Array.from({length:n},()=>{
    const t=pick(TENSES),f=pick(["p","p","n","q"]),c=conj(t.k,pick(SUBJ),pick(VERBS),f);
    const o=shuffle([t.n,...shuffle(TENSES.filter(x=>x!==t).map(x=>x.n)).slice(0,3)]);
    return {t:"mc",q:`Bu gap qaysi zamonda?<br><span style="font-family:var(--mono)">${c.text}</span>`,o,a:o.indexOf(t.n),w:t.uz+".",les:t.les};
  });
}
function test(){
  const pool=LESSONS.flatMap(l=>items(l).filter(x=>x.t!=="ord"));
  const modes=[["tez","Tezkor test","10 ta aralash savol, barcha mavzulardan.",()=>shuffle(pool).slice(0,10)],
    ["katta","Katta imtihon","30 ta savol. Oxirida har bir yo'nalish bo'yicha natija.",()=>shuffle(pool).slice(0,30)],
    ["zamon","Zamonni top","10 ta gap. Har birining zamonini bir qarashda aniqlang.",()=>tenseGame(10)]];
  const menu=()=>{
    app.innerHTML=`<section class="page"><h1>Bilimni tekshirish</h1><p class="lead">Savollar har safar yangidan aralashtiriladi. Natijada qaysi mavzuni takrorlash kerakligi ko'rsatiladi.</p>
    <div class="modes">${modes.map(m=>`<button class="card mode" type="button" data-m="${m[0]}"><b>${m[1]}</b><span>${m[2]}</span><em>${P.best[m[0]]!=null?"Eng yaxshi natija: "+P.best[m[0]]+"%":"Hali ishlanmagan"}</em></button>`).join("")}</div></section>`;
    $$(".mode").forEach(b=>b.onclick=()=>run(modes.find(m=>m[0]===b.dataset.m)));
  };
  const run=m=>{
    app.innerHTML=`<section class="page" style="max-width:760px;margin:0 auto"><a class="back" href="#test" id="bk">← Test turlari</a><h1>${m[1]}</h1><div class="card" id="tz"></div></section>`;
    $("#bk").onclick=e=>{e.preventDefault();menu()};
    quiz($("#tz"),m[3](),(sc,n,res)=>{
      const p=Math.round(sc/n*100);P.best[m[0]]=Math.max(P.best[m[0]]||0,p);save();
      const by={};res.forEach(r=>{const l=byId[r.les].line;by[l]=by[l]||[0,0];by[l][1]++;if(r.ok)by[l][0]++});
      const weak=[...new Set(res.filter(r=>!r.ok).map(r=>r.les))];
      $("#tz").innerHTML=`<div class="res"><div class="big">${p}%</div><p>${sc} / ${n} ta to'g'ri javob.</p>
      <div class="rows">${LINES.filter(l=>by[l.id]).map(l=>`<div class="row" style="--lc:${l.c}"><span>${l.t}</span><div class="bar"><i style="width:${by[l.id][0]/by[l.id][1]*100}%"></i></div><span>${by[l.id][0]}/${by[l.id][1]}</span></div>`).join("")}</div>
      ${weak.length?`<p><b>Takrorlash kerak:</b> ${weak.map(w=>`<a href="#dars-${w}">${byId[w].t}</a>`).join(", ")}.</p>`:"<p><b>Zaif mavzu topilmadi.</b></p>"}
      <div class="hero-act"><button class="btn pri" id="ag" type="button">Yana bir marta</button><button class="btn" id="mn" type="button">Test turlari</button></div></div>`;
      $("#ag").onclick=()=>run(m);$("#mn").onclick=menu;
    });
  };
  menu();
}

/* ---------- irregular verbs ---------- */
function fellar(){
  let order=shuffle(IRREG),i=0,ok=0,tot=0;
  app.innerHTML=`<section class="page"><h1>Noto'g'ri fe'llar</h1><p class="lead">Past Simple uchun ikkinchi shakl (V2), Perfect zamonlar va Passive uchun uchinchi shakl (V3) kerak. Kartochkada fe'lni ko'rib, ikkala shaklini yozing.</p>
  <div class="card flash" id="fl"></div>
  <div class="card scroll"><table><thead><tr><th>V1</th><th>V2</th><th>V3</th><th>Ma'nosi</th></tr></thead><tbody>${IRREG.map(v=>`<tr><td>${v[0]}</td><td>${v[1]}</td><td>${v[2]}</td><td>${v[3]}</td></tr>`).join("")}</tbody></table></div></section>`;
  const show=()=>{
    const v=order[i%order.length];
    $("#fl").innerHTML=`<div class="qz-top"><span>To'g'ri: ${ok} / ${tot}</span></div><div><div class="v1">${v[0]}</div><span class="cap">${v[3]}</span></div>
    <form id="ff" style="display:flex;flex-direction:column;gap:12px"><div class="inrow"><label for="v2">V2 (Past Simple)<input id="v2" autocomplete="off" autocapitalize="off" spellcheck="false"></label><label for="v3">V3 (Past Participle)<input id="v3" autocomplete="off" autocapitalize="off" spellcheck="false"></label></div><button class="btn pri" style="align-self:flex-start">Tekshirish</button></form><div id="ffb"></div>`;
    $("#ff").onsubmit=e=>{
      e.preventDefault();if($("#v2").disabled)return;
      const chk=(inp,ans)=>[ans,...ans.split("/")].includes(nrm(inp.value));
      const good=chk($("#v2"),v[1])&&chk($("#v3"),v[2]);tot++;if(good)ok++;
      $("#v2").disabled=$("#v3").disabled=true;$("#ff button").disabled=true;
      $("#ffb").innerHTML=`<div class="fb ${good?"ok":"bad"}"><b>${good?"To'g'ri!":"Xato"}</b><span><code>${v[0]} · ${v[1]} · ${v[2]}</code></span></div><button class="btn pri" id="fn" type="button" style="margin-top:12px">Keyingi fe'l</button>`;
      $("#fn").onclick=()=>{i++;show()};$("#fn").focus({preventScroll:true});
    };
  };
  show();
}

/* ---------- router ---------- */
function count(){$("#count").textContent=doneCount()+" / "+LESSONS.length+" bekat";const n=dueKeys().length,b=$("#nb");if(b){b.textContent=n||"";b.hidden=!n}}
function route(){
  clearInterval(timer);
  const h=(location.hash||"#home").slice(1);
  if(h.startsWith("dars-")&&byId[h.slice(5)])lesson(h.slice(5));
  else ({detektor,jadval,test,fellar,tahlil,takror,kartochka,diktant,kirish}[h]||home)();
  const key=h.startsWith("dars-")?"home":({detektor:1,jadval:1,test:1,fellar:1,tahlil:1,takror:1,kartochka:1,diktant:1,kirish:1}[h]?h:"home");
  $$("#nav a").forEach(a=>a.classList.toggle("on",a.getAttribute("href")==="#"+key));
  count();window.scrollTo(0,0);
}
document.addEventListener("click",e=>{
  const na=e.target.closest(".top a");if(na&&na.getAttribute("href")===(location.hash||"#home")){route();return}
  const rg=e.target.closest("[data-rule-go]");
  if(rg){const [les,ref]=rg.dataset.ruleGo.split("|");if((location.hash||"")==="#dars-"+les&&window.gotoRule)window.gotoRule(ref);else{window.HL=[les,ref];location.hash="#dars-"+les}return}
  const c=e.target.closest("[data-copy]");
  if(c){const done=t=>{c.textContent=t;setTimeout(()=>c.textContent="Nusxa olish",1600)};try{navigator.clipboard.writeText(c.dataset.copy).then(()=>done("Nusxa olindi"),()=>done("Nusxa olinmadi"))}catch(err){done("Nusxa olinmadi")}return}
  const b=e.target.closest("[data-say]");if(!b)return;
  try{const u=new SpeechSynthesisUtterance(b.dataset.say);u.lang="en-US";u.rate=.9;speechSynthesis.cancel();speechSynthesis.speak(u)}catch(err){}
});
function boot(d){
  if(d&&d.done)P=d;else try{const s=JSON.parse(localStorage.getItem(LS));if(s&&s.done)P=s}catch(e){}
  P.best=P.best||{};P.srs=P.srs||{};P.days=P.days||{};P.pre=P.pre||{};
  window.addEventListener("hashchange",route);route();
}
window.claude?.hot?.snapshot?.(()=>P);
window.claude?.hot?.ready?window.claude.hot.ready(boot):boot(window.claude?.hot?.data??{});
</script>
