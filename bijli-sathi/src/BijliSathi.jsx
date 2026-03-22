import { useState, useEffect, useRef, useCallback } from "react";

const TARIFFS = [
  { name:"Peak",     start:6,  end:10, rate:8.50, color:"#FF4444", cls:"peak" },
  { name:"Normal",   start:10, end:18, rate:6.00, color:"#F59E0B", cls:"normal" },
  { name:"Peak",     start:18, end:22, rate:8.50, color:"#FF4444", cls:"peak" },
  { name:"Off-Peak", start:22, end:30, rate:3.50, color:"#22C55E", cls:"offpeak" },
];
const CO2_PER_KWH = 0.82;
function getTariff(h) {
  h = h !== undefined ? h : new Date().getHours();
  for (const t of TARIFFS) {
    const s = t.start%24, e = t.end%24;
    if (e>s){ if(h>=s&&h<e) return t; }
    else { if(h>=s||h<e) return t; }
  }
  return TARIFFS[1];
}
function fINR(n){ return "₹"+Number(n).toLocaleString("en-IN",{maximumFractionDigits:0}); }

const INIT_APPS = [
  {id:"1",name:"Air Conditioner",  kwh:1.500,active:true, pref:"10PM–6AM",priority:2,icon:"❄️"},
  {id:"2",name:"Geyser",           kwh:2.000,active:false,pref:"5AM–7AM",  priority:2,icon:"🚿"},
  {id:"3",name:"Washing Machine",  kwh:0.800,active:false,pref:"10PM–6AM", priority:3,icon:"🫧"},
  {id:"4",name:"Refrigerator",     kwh:0.150,active:true, pref:null,       priority:1,icon:"🧊"},
  {id:"5",name:"LED TV",           kwh:0.100,active:true, pref:null,       priority:2,icon:"📺"},
  {id:"6",name:"Microwave",        kwh:1.200,active:false,pref:"12–2PM",   priority:2,icon:"📡"},
  {id:"7",name:"Water Pump",       kwh:0.750,active:false,pref:"5–7AM",    priority:2,icon:"💧"},
  {id:"8",name:"Ceiling Fans",     kwh:0.240,active:true, pref:null,       priority:1,icon:"🌀"},
];
const BADGES_DEF = [
  {id:"energy_saver",icon:"⚡",name:"Energy Saver", cond:"Save ₹500 total"},
  {id:"green_hero",  icon:"🌱",name:"Green Hero",   cond:"Save 10 kg CO₂"},
  {id:"peak_avoider",icon:"🏆",name:"Peak Avoider", cond:"300 energy pts"},
  {id:"night_owl",   icon:"🦉",name:"Night Owl",    cond:"7-day Off-Peak"},
  {id:"bill_buster", icon:"💰",name:"Bill Buster",  cond:"Save ₹1000 total"},
  {id:"eco_warrior", icon:"🌍",name:"Eco Warrior",  cond:"Save 25 kg CO₂"},
];
const LEADERBOARD = [
  {rank:1,name:"Priya Mehta",  city:"Delhi",score:890,you:false},
  {rank:2,name:"Suresh Kumar", city:"Delhi",score:745,you:false},
  {rank:3,name:"Anita Singh",  city:"Delhi",score:620,you:false},
  {rank:4,name:"Rahul Sharma", city:"Delhi",score:340,you:true},
  {rank:5,name:"Vikram Patel", city:"Delhi",score:310,you:false},
  {rank:6,name:"City Avg",     city:"Delhi",score:285,you:false},
];

function Sparkline(){
  const ref = useRef();
  const profile = [0.4,0.35,0.3,0.32,0.4,0.8,2.1,2.8,2.4,1.8,1.5,1.6,1.8,1.6,1.5,1.7,2.0,2.8,3.2,3.0,2.4,1.8,1.2,0.6];
  useEffect(()=>{
    const c=ref.current; if(!c) return;
    const W=c.offsetWidth||320,H=50; c.width=W; c.height=H;
    const ctx=c.getContext("2d"); ctx.clearRect(0,0,W,H);
    const max=Math.max(...profile);
    const pts=profile.map((v,i)=>[(i/23)*W,H-4-((v/max)*(H-10))]);
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,"rgba(255,140,0,0.4)"); g.addColorStop(1,"rgba(255,140,0,0)");
    ctx.beginPath(); ctx.moveTo(pts[0][0],H);
    pts.forEach(p=>ctx.lineTo(p[0],p[1])); ctx.lineTo(W,H); ctx.closePath();
    ctx.fillStyle=g; ctx.fill();
    ctx.beginPath(); ctx.strokeStyle="#FF8C00"; ctx.lineWidth=2; ctx.lineJoin="round";
    pts.forEach((p,i)=>i===0?ctx.moveTo(p[0],p[1]):ctx.lineTo(p[0],p[1])); ctx.stroke();
    const h=new Date().getHours();
    ctx.beginPath(); ctx.arc((h/23)*W,pts[h][1],4,0,Math.PI*2);
    ctx.fillStyle="#FF8C00"; ctx.fill();
  },[]);
  return <canvas ref={ref} style={{width:"100%",height:50}}/>;
}

function DonutRing({kw,color="#FF8C00"}){
  const circ=2*Math.PI*52, dash=circ*Math.min(kw/6,1);
  return(
    <div style={{position:"relative",width:120,height:120,flexShrink:0}}>
      <svg width={120} height={120} style={{transform:"rotate(-90deg)"}}>
        <circle cx={60} cy={60} r={52} fill="none" stroke="#1A2235" strokeWidth={10}/>
        <circle cx={60} cy={60} r={52} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{transition:"stroke-dasharray 0.5s"}}/>
      </svg>
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
        <div style={{fontWeight:800,fontSize:20,color:"#FF8C00",lineHeight:1}}>{kw.toFixed(2)}</div>
        <div style={{fontSize:10,color:"#8899BB"}}>kW live</div>
      </div>
    </div>
  );
}

function getChatResp(msg,apps,score,monthlyKwh,projBill,lastBill){
  const m=msg.toLowerCase(),t=getTariff(),top=[...apps].sort((a,b)=>b.kwh-a.kwh)[0];
  const load=apps.filter(a=>a.active).reduce((s,a)=>s+a.kwh,0)+0.35;
  if(/(bill high|expensive|zyada|reduce bill|why bill|cost more)/.test(m))
    return{text:`📊 Bill Analysis\n\nMonthly pace: ${monthlyKwh.toFixed(1)} kWh → Projected ${fINR(projBill)}\n\n🔴 Top reasons:\n1. ${top.name} is your biggest load at ${top.kwh} kW\n2. Running during ${t.name} (₹${t.rate}/unit) costs 2.4× more than Off-Peak\n3. Total load: ${load.toFixed(2)} kW\n\n💡 Shift ${top.name} to Off-Peak → save ₹${((8.5-3.5)*top.kwh*4*30).toFixed(0)}/month!`,
      chips:["How do I save?","Best schedule"]};
  if(/(which appliance|most power|highest|biggest|kaun)/.test(m)){
    const s=[...apps].sort((a,b)=>b.kwh-a.kwh).slice(0,4),tot=s.reduce((x,a)=>x+a.kwh,1);
    return{text:`⚡ Top Consumers:\n\n`+s.map((a,i)=>`${i+1}. ${a.icon} ${a.name} — ${a.kwh}kW (${((a.kwh/tot)*100).toFixed(0)}%)`).join("\n")+`\n\n💡 ${s[0].name} uses most. Off-Peak shift saves ₹${((8.5-3.5)*s[0].kwh*4*30).toFixed(0)}/month!`,chips:["Schedule?","My bill prediction"]};
  }
  if(/(save|tips|reduce|bachao|help|suggest)/.test(m))
    return{text:`💰 Top 5 Saving Tips:\n\n1. ⏰ Off-Peak shift — AC/Geyser after 10PM at ₹3.50 vs ₹8.50\n2. 🌡️ AC at 26°C — each degree saves ~6%\n3. ⭐ 5-star appliances — 30% less power\n4. 💡 LED bulbs — 80% less than incandescent\n5. 🔌 Kill standby — saves ₹180/month`,chips:["Tariff rates","My energy score"]};
  if(/(tariff|rate|per unit|slot|peak time)/.test(m))
    return{text:`📋 Delhi BSES ToD Tariff:\n\n🔴 Peak 6–10AM & 6–10PM: ₹8.50/unit\n🟡 Normal 10AM–6PM: ₹6.00/unit\n🟢 Off-Peak 10PM–6AM: ₹3.50/unit\n\nNow: ${t.name} (₹${t.rate}/unit)\nOff-Peak is 2.4× cheaper than Peak!`,chips:["When to run washing?","How much can I save?"]};
  if(/(carbon|co2|green|tree|planet)/.test(m)){
    const co2=(monthlyKwh*0.82).toFixed(1),trees=(co2/21).toFixed(1),km=(co2/0.12).toFixed(0);
    return{text:`🌱 Carbon Footprint:\n\n${monthlyKwh.toFixed(0)} kWh → ${co2} kg CO₂ this month\n🌳 Needs ${trees} trees to absorb (1 year each)\n🚗 = ${km} km petrol car driving\n\nIndia grid: 0.82 kg CO₂/kWh`,chips:["How to reduce?","My energy score"]};
  }
  if(/(score|point|badge|rank|level)/.test(m))
    return{text:`🏆 Energy Score: ${score} pts · Pro Saver ⚡\n\nEarn more:\n• +20 pts — Off-Peak usage\n• +50 pts — Save ₹500 total\n• +100 pts — Reduce 10%\n• +15 pts — Accept suggestion\n\nCity rank: Top 25% in Delhi`,chips:["Show badges","Earn more?"]};
  if(/(predict|next month|this month|project)/.test(m)){
    const d=projBill-lastBill,p=((d/lastBill)*100).toFixed(1);
    return{text:`📊 Bill Prediction:\n\nProjected: ${fINR(projBill)}\nvs Last month: ${fINR(lastBill)}\n\n${d>0?`📈 Up ₹${d.toFixed(0)} (+${p}%)`:`📉 Down ₹${Math.abs(d).toFixed(0)} (${p}%)`}\n\n${d/lastBill>0.15?"⚠️ Bill shock! Shift heavy loads to Off-Peak now!":"✅ On track — keep using Off-Peak!"}`,chips:["How to reduce?","Savings tips"]};
  }
  if(/(hello|hi|namaste|hey)/.test(m))
    return{text:`Namaste! 🙏 I'm Bijli Mitra.\n\nCurrent tariff: ${t.name} · ₹${t.rate}/unit\nYour score: ${score} pts\n\nAsk me anything about your energy!`,chips:["Why is my bill high?","Savings tips","Carbon footprint"]};
  return{text:`🤔 I can help with:\n• "Why is my bill high?"\n• "Which appliance uses most?"\n• "How can I save money?"\n• "Tariff rates?"\n• "Carbon footprint?"\n• "Predict my bill"`,chips:["Bill high?","Savings tips","Carbon"]};
}

const C={
  bg:"#0A0E1A",bg2:"#0F1525",bg3:"#141C30",card:"#111827",card2:"#1A2235",
  border:"#1E2D45",saffron:"#FF8C00",green:"#22C55E",red:"#FF4444",
  yellow:"#FFD600",electric:"#00D4FF",text:"#F0F4FF",text2:"#8899BB",text3:"#4A5F80"
};

export default function BijliSathi(){
  const [tab,setTab]=useState("dashboard");
  const [apps,setApps]=useState(INIT_APPS);
  const [liveKw,setLiveKw]=useState(2.84);
  const [monthKwh,setMonthKwh]=useState(124.3);
  const [score,setScore]=useState(340);
  const [earnedBadges]=useState(["energy_saver","peak_avoider"]);
  const [chatMsgs,setChatMsgs]=useState([]);
  const [chatInput,setChatInput]=useState("");
  const [acHours,setAcHours]=useState(8);
  const chatRef=useRef();
  const lastBill=1800;
  const tariff=getTariff();
  const projBill=(monthKwh/Math.max(new Date().getDate(),1))*30*6.0;
  const totalKw=apps.filter(a=>a.active).reduce((s,a)=>s+a.kwh,0)+0.35;
  const co2Month=(monthKwh*CO2_PER_KWH).toFixed(1);
  const billShock=(projBill-lastBill)/lastBill>0.15;
  const cheapRate=3.50;

  useEffect(()=>{
    const iv=setInterval(()=>{
      let load=apps.filter(a=>a.active).reduce((s,a)=>s+a.kwh,0)+0.35;
      const h=new Date().getHours();
      if(h>=6&&h<10)load*=1.1; if(h>=18&&h<22)load*=1.15;
      load*=1+(Math.random()*0.06-0.03);
      setLiveKw(+load.toFixed(3));
      setMonthKwh(p=>+(p+load/60).toFixed(2));
    },3000);
    return()=>clearInterval(iv);
  },[apps]);

  useEffect(()=>{
    if(tab==="assistant"&&chatMsgs.length===0)
      setChatMsgs([{role:"bot",text:`Namaste! 🙏 I'm Bijli Mitra, your AI energy assistant.\n\nCurrent tariff: ${tariff.name} · ₹${tariff.rate}/unit\n\nAsk me about your bill, tips, or carbon footprint!`,chips:["Why is my bill high?","Show savings tips","My carbon footprint"]}]);
  },[tab]);

  useEffect(()=>{ if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight; },[chatMsgs]);

  const sendChat=useCallback((txt)=>{
    const msg=txt||chatInput; if(!msg.trim())return;
    setChatInput("");
    setChatMsgs(p=>[...p,{role:"user",text:msg}]);
    setTimeout(()=>{ const r=getChatResp(msg,apps,score,monthKwh,projBill,lastBill); setChatMsgs(p=>[...p,{role:"bot",...r}]); },500);
  },[chatInput,apps,score,monthKwh,projBill]);

  const toggleApp=id=>setApps(p=>p.map(a=>a.id===id?{...a,active:!a.active}:a));
  const acceptRec=(name,sv)=>{ setScore(s=>s+15); alert(`✅ ${name} scheduled for Off-Peak!\n+15 Energy Score!\nSaving: ₹${sv.toFixed(2)}/hr`); };

  const card=(extra={})=>({background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"16px 18px",...extra});
  const statCard=(glow)=>({...card(),boxShadow:`0 0 40px ${glow||"transparent"}`});
  const tbadge=(cls)=>({display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:700,
    background:cls==="offpeak"?"rgba(34,197,94,0.15)":cls==="normal"?"rgba(245,158,11,0.15)":"rgba(255,68,68,0.15)",
    color:cls==="offpeak"?C.green:cls==="normal"?"#F59E0B":C.red,
    border:`1px solid ${cls==="offpeak"?"rgba(34,197,94,0.3)":cls==="normal"?"rgba(245,158,11,0.3)":"rgba(255,68,68,0.3)"}`});
  const chip=(c)=>({display:"inline-flex",padding:"3px 9px",borderRadius:20,fontSize:10,fontWeight:700,
    background:c==="green"?"rgba(34,197,94,0.15)":c==="red"?"rgba(255,68,68,0.15)":"rgba(0,212,255,0.15)",
    color:c==="green"?C.green:c==="red"?C.red:C.electric});
  const progressBg={background:C.bg3,borderRadius:6,height:7,overflow:"hidden",marginTop:8};
  const progressFill=w=>({height:"100%",borderRadius:6,background:"linear-gradient(90deg,#FF8C00,#00D4FF)",width:w+"%",transition:"width 1s ease"});

  const TABS=[
    {id:"dashboard",icon:"📊",label:"Dashboard"},
    {id:"optimizer",icon:"🎯",label:"Optimizer"},
    {id:"plugs",icon:"🔌",label:"Smart Plugs"},
    {id:"assistant",icon:"🤖",label:"AI Assistant"},
    {id:"bills",icon:"📄",label:"Bill Predictor"},
    {id:"carbon",icon:"🌱",label:"Carbon"},
    {id:"rewards",icon:"🏆",label:"Rewards"},
    {id:"alerts",icon:"🔔",label:"Alerts"},
  ];

  // ─ Dashboard ─
  const Dashboard=()=>(
    <div>
      <div style={{fontSize:20,fontWeight:800,marginBottom:4}}>Good Evening, Rahul 👋</div>
      <div style={{fontSize:12,color:C.text2,marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
        Delhi · <span style={tbadge(tariff.cls)}>● {tariff.name} · ₹{tariff.rate}/unit</span>
      </div>
      {billShock&&<div style={{background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.35)",borderRadius:14,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:22}}>⚠️</span><div>
          <div style={{fontWeight:700,color:C.red,fontSize:14}}>Bill Shock Alert</div>
          <div style={{fontSize:12,color:C.text2}}>Bill projected {fINR(projBill-lastBill)} higher than last month! Shift loads to Off-Peak.</div>
        </div>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
        {[{icon:"⚡",val:liveKw.toFixed(2),label:"Live Load (kW)",sub:"● Live",g:"rgba(255,140,0,0.15)"},
          {icon:"💰",val:`₹${(liveKw*tariff.rate).toFixed(2)}`,label:"Cost / Hour",sub:`${tariff.name} · ₹${tariff.rate}/unit`,g:"rgba(255,68,68,0.12)"},
          {icon:"🗓️",val:monthKwh.toFixed(1),label:"kWh This Month",sub:`${fINR(projBill)} projected`,g:"rgba(34,197,94,0.10)"},
          {icon:"🏆",val:score,label:"Energy Score",sub:"Top 25% Delhi",g:"rgba(124,58,237,0.12)"},
        ].map((s,i)=>(
          <div key={i} style={statCard(s.g)}>
            <div style={{fontSize:24,marginBottom:5}}>{s.icon}</div>
            <div style={{fontWeight:800,fontSize:24,lineHeight:1}}>{s.val}</div>
            <div style={{fontSize:11,color:C.text2,marginTop:4}}>{s.label}</div>
            <div style={{fontSize:10,color:C.text3,marginTop:2}}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
        <div style={card()}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{fontWeight:700}}>⚡ Live Smart Meter</div>
            <span style={chip("green")}>LIVE</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <DonutRing kw={liveKw} color={tariff.color}/>
            <div style={{flex:1}}>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:10,color:C.text2,marginBottom:1}}>Today's Usage</div>
                <div style={{fontWeight:800,fontSize:18}}>18.4 kWh</div>
                <div style={{fontSize:10,color:C.text3}}>Cost: ₹110.4</div>
              </div>
              <div>
                <div style={{fontSize:10,color:C.text2,marginBottom:1}}>Savings Today</div>
                <div style={{fontWeight:800,fontSize:16,color:C.green}}>₹42.00</div>
                <div style={{fontSize:10,color:C.text3}}>vs all-peak scenario</div>
              </div>
            </div>
          </div>
          <div style={{marginTop:12}}>
            <div style={{fontSize:10,color:C.text2,marginBottom:4}}>24-hr Usage Profile</div>
            <Sparkline/>
          </div>
        </div>
        <div style={card()}>
          <div style={{fontWeight:700,marginBottom:12}}>🔌 Appliance Load</div>
          {apps.filter(a=>a.active).sort((a,b)=>b.kwh-a.kwh).slice(0,6).map(a=>{
            const pct=((a.kwh/totalKw)*100).toFixed(0);
            return <div key={a.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontSize:16,width:20,textAlign:"center"}}>{a.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:600}}>{a.name}</div>
                <div style={{fontSize:10,color:C.text2}}>{a.kwh}kW · ₹{(a.kwh*tariff.rate).toFixed(2)}/hr</div>
              </div>
              <div style={{width:80}}>
                <div style={{background:C.bg3,height:5,borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",background:"linear-gradient(90deg,#FF8C00,#00D4FF)",width:Math.min(pct,100)+"%"}}/>
                </div>
              </div>
              <span style={{fontSize:11,color:C.text2,width:28,textAlign:"right"}}>{pct}%</span>
            </div>;
          })}
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{fontWeight:700}}>💡 Top Recommendations</div>
        <span style={{fontSize:12,color:C.saffron,cursor:"pointer"}} onClick={()=>setTab("optimizer")}>See all →</span>
      </div>
      {tariff.name==="Off-Peak"
        ?<div style={{background:"rgba(34,197,94,0.07)",border:"1px solid rgba(34,197,94,0.25)",borderRadius:14,padding:"14px 16px",marginBottom:12}}>
           <div style={{fontWeight:700,color:C.green}}>✅ You're in Off-Peak hours — cheapest rate!</div>
           <div style={{fontSize:12,color:C.text2,marginTop:4}}>All appliances running at ₹3.50/unit. Perfect time for laundry & geyser!</div>
         </div>
        :apps.filter(a=>a.active&&a.priority>=2).sort((a,b)=>b.kwh-a.kwh).slice(0,2).map(a=>{
           const sv=((tariff.rate-cheapRate)*a.kwh).toFixed(2);
           return <div key={a.id} style={{background:"linear-gradient(135deg,rgba(255,140,0,0.07),rgba(0,212,255,0.04))",border:"1px solid rgba(255,140,0,0.22)",borderRadius:14,padding:"14px 16px",marginBottom:12}}>
             <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
               <div style={{fontWeight:700,fontSize:13}}>{a.icon} {a.name} → Shift to Off-Peak</div>
               <div style={{fontWeight:800,fontSize:16,color:C.green}}>Save ₹{sv}/hr</div>
             </div>
             <div style={{fontFamily:"monospace",fontSize:11,color:C.text3,background:C.bg3,padding:"5px 8px",borderRadius:6,marginBottom:8}}>(₹{tariff.rate} − ₹{cheapRate}) × {a.kwh}kW × 1hr = ₹{sv}</div>
             <button style={{background:"linear-gradient(135deg,#FF8C00,#FF5722)",color:"#fff",border:"none",padding:"7px 14px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}} onClick={()=>acceptRec(a.name,parseFloat(sv))}>✅ Accept & Schedule (+15 pts)</button>
           </div>;
        })}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div style={card()}>
          <div style={{fontWeight:700,marginBottom:10}}>🌱 Carbon This Month</div>
          <div style={{display:"flex",gap:16}}>
            {[{e:"💨",v:`${co2Month}kg`,l:"CO₂ emitted"},{e:"🌳",v:(co2Month/21).toFixed(1),l:"trees to offset"},{e:"✅",v:"18.4kg",l:"CO₂ saved"}].map((x,i)=>(
              <div key={i} style={{textAlign:"center",flex:1}}>
                <div style={{fontSize:24}}>{x.e}</div>
                <div style={{fontWeight:800,fontSize:14,color:C.green}}>{x.v}</div>
                <div style={{fontSize:10,color:C.text2}}>{x.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={card()}>
          <div style={{fontWeight:700,marginBottom:10}}>🏆 Energy Score</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <span style={{fontSize:12,color:C.text2}}>Score Progress</span>
            <span style={{fontWeight:800,fontSize:16,color:C.saffron}}>{score} / 600</span>
          </div>
          <div style={progressBg}><div style={progressFill((score/600)*100)}/></div>
          <div style={{fontSize:10,color:C.text3,marginTop:4}}>Pro Saver ⚡ · {600-score} pts to Energy Master</div>
          <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
            {BADGES_DEF.slice(0,4).map(b=><span key={b.id} style={{fontSize:20,opacity:earnedBadges.includes(b.id)?1:0.2}} title={b.name}>{b.icon}</span>)}
          </div>
        </div>
      </div>
    </div>
  );

  // ─ Optimizer ─
  const Optimizer=()=>{
    const hours=Array.from({length:24},(_,i)=>i);
    const totSave=apps.filter(a=>a.priority>=2).reduce((s,a)=>s+Math.max(0,(tariff.rate-cheapRate)*a.kwh*4*30),0);
    return <div>
      <div style={{fontSize:20,fontWeight:800,marginBottom:4}}>🎯 Smart Optimizer</div>
      <div style={{fontSize:12,color:C.text2,marginBottom:16}}>Rule-based · Fully explainable · All formulas shown</div>
      <div style={{...card(),marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={tbadge(tariff.cls)}>● {tariff.name} · ₹{tariff.rate}/unit</span>
          <span style={{fontSize:12,color:C.text2}}>→ Off-Peak at 10 PM (₹3.50/unit)</span>
        </div>
        <code style={{fontSize:11,color:C.electric,background:C.bg3,padding:"4px 8px",borderRadius:6}}>savings=(rate_cur−rate_min)×kW×hrs</code>
      </div>
      <div style={{...card(),marginBottom:14}}>
        <div style={{fontWeight:700,marginBottom:10}}>⏰ 24-Hour Tariff Timeline</div>
        <div style={{display:"flex",height:32,borderRadius:8,overflow:"hidden",gap:1}}>
          {hours.map(h2=>{
            const t=getTariff(h2),isNow=h2===new Date().getHours();
            return <div key={h2} title={`${h2}:00 — ${t.name} ₹${t.rate}/unit`}
              style={{flex:1,background:t.color+(isNow?"FF":"28"),border:isNow?`2px solid ${t.color}`:"none",cursor:"default",position:"relative"}}>
              {isNow&&<div style={{position:"absolute",top:-14,left:"50%",transform:"translateX(-50%)",fontSize:8,color:t.color,fontWeight:700,whiteSpace:"nowrap"}}>NOW</div>}
            </div>;
          })}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
          {[0,6,12,18,23].map(h2=><span key={h2} style={{fontSize:10,color:C.text3}}>{h2}:00</span>)}
        </div>
        <div style={{display:"flex",gap:14,marginTop:8,fontSize:12}}>
          <span><span style={{color:C.red}}>●</span> Peak ₹8.50</span>
          <span><span style={{color:"#F59E0B"}}>●</span> Normal ₹6.00</span>
          <span><span style={{color:C.green}}>●</span> Off-Peak ₹3.50</span>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{fontWeight:700}}>💡 Recommendations</div>
        <span style={{...chip("green"),fontSize:11}}>Save up to {fINR(totSave)}/mo</span>
      </div>
      {apps.filter(a=>a.priority>=2).sort((a,b)=>b.kwh-a.kwh).map(a=>{
        const sv=Math.max(0,(tariff.rate-cheapRate)*a.kwh).toFixed(2);
        const mo=(parseFloat(sv)*4*30).toFixed(0);
        return <div key={a.id} style={{background:"linear-gradient(135deg,rgba(255,140,0,0.07),rgba(0,212,255,0.04))",border:"1px solid rgba(255,140,0,0.22)",borderRadius:14,padding:"14px 16px",marginBottom:12,opacity:a.active?1:0.6}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div style={{fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:8}}>
              {a.icon} {a.name}
              <span style={{...chip(a.active?"green":""),fontSize:9}}>{a.active?"ACTIVE":"IDLE"}</span>
            </div>
            <div style={{fontWeight:800,fontSize:15,color:tariff.name==="Off-Peak"?C.green:C.green}}>{tariff.name!=="Off-Peak"?`Save ₹${sv}/hr`:"✅ Cheapest rate"}</div>
          </div>
          <div style={{fontFamily:"monospace",fontSize:11,color:C.text3,background:C.bg3,padding:"5px 8px",borderRadius:6,marginBottom:8}}>(₹{tariff.rate} − ₹{cheapRate}) × {a.kwh}kW × 1hr = ₹{sv}</div>
          <div style={{display:"flex",gap:14,fontSize:11,color:C.text2,flexWrap:"wrap",marginBottom:8}}>
            <span>⏰ Best: {a.pref||"Off-Peak"}</span>
            <span>📅 Monthly: <b style={{color:C.green}}>₹{mo}</b></span>
            <span>⚡ {a.kwh}kW rated</span>
          </div>
          {tariff.name!=="Off-Peak"&&<button style={{background:"linear-gradient(135deg,#FF8C00,#FF5722)",color:"#fff",border:"none",padding:"7px 14px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}} onClick={()=>acceptRec(a.name,parseFloat(sv))}>✅ Accept (+15 pts)</button>}
        </div>;
      })}
    </div>;
  };

  // ─ Smart Plugs ─
  const plugStatus={"1":{s:"on",l:"ON"},"2":{s:"off",l:"OFF"},"3":{s:"sched",l:"Scheduled 11 PM"},"4":{s:"on",l:"ON (Always)"},"5":{s:"on",l:"ON"},"6":{s:"off",l:"OFF"},"7":{s:"sched",l:"Scheduled 5 AM"},"8":{s:"on",l:"ON"}};
  const Plugs=()=>(
    <div>
      <div style={{fontSize:20,fontWeight:800,marginBottom:4}}>🔌 Smart Plug Control</div>
      <div style={{fontSize:12,color:C.text2,marginBottom:16}}>Simulated smart plug integration — toggle and schedule appliances</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
        <div style={card()}>
          <div style={{fontWeight:700}}>Total Active Load</div>
          <div style={{fontWeight:800,fontSize:30,color:C.saffron,margin:"6px 0"}}>{liveKw.toFixed(2)} kW</div>
          <div style={{fontSize:12,color:C.text2}}>₹{(liveKw*tariff.rate).toFixed(2)}/hr at {tariff.name} rate</div>
        </div>
        <div style={card()}>
          <div style={{fontWeight:700}}>Off-Peak Savings Available</div>
          <div style={{fontWeight:800,fontSize:30,color:C.green,margin:"6px 0"}}>
            ₹{apps.filter(a=>a.active&&a.priority>=2).reduce((s,a)=>s+Math.max(0,(tariff.rate-3.5)*a.kwh),0).toFixed(2)}/hr
          </div>
          <div style={{fontSize:12,color:C.text2}}>By shifting deferrable loads after 10 PM</div>
        </div>
      </div>
      {apps.map(a=>{
        const st=plugStatus[a.id]||{s:"off",l:"OFF"};
        const on=a.active;
        const bc=on?"rgba(34,197,94,0.35)":st.s==="sched"?"rgba(0,212,255,0.25)":C.border;
        const bg=on?"rgba(34,197,94,0.04)":st.s==="sched"?"rgba(0,212,255,0.03)":C.card;
        return <div key={a.id} style={{background:bg,border:`1px solid ${bc}`,borderRadius:14,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:24}}>{a.icon}</span>
            <div>
              <div style={{fontWeight:700,fontSize:14}}>{a.name}</div>
              <div style={{fontSize:11,fontWeight:600,color:on?C.green:st.s==="sched"?C.electric:C.text3,marginTop:1}}>{st.l} · {a.kwh}kW</div>
              {on&&<div style={{fontSize:10,color:C.text3}}>₹{(a.kwh*tariff.rate).toFixed(2)}/hr now</div>}
              {st.s==="sched"&&<div style={{fontSize:10,color:C.electric}}>→ Off-Peak ₹3.50 saves ₹{((tariff.rate-3.5)*a.kwh).toFixed(2)}/hr</div>}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {st.s==="sched"&&<span style={{fontSize:10,color:C.electric}}>⏰ Scheduled</span>}
            <div style={{width:42,height:22,background:on?C.green:C.bg3,borderRadius:11,position:"relative",cursor:"pointer",border:`1px solid ${on?C.green:C.border}`,transition:"background 0.2s"}} onClick={()=>toggleApp(a.id)}>
              <div style={{position:"absolute",top:3,left:on?21:3,width:14,height:14,background:"#fff",borderRadius:"50%",transition:"left 0.2s"}}/>
            </div>
          </div>
        </div>;
      })}
    </div>
  );

  // ─ Assistant ─
  const Assistant=()=>(
    <div>
      <div style={{fontSize:20,fontWeight:800,marginBottom:4}}>🤖 AI Energy Assistant</div>
      <div style={{fontSize:12,color:C.text2,marginBottom:16}}>Rule-based NLU · Powered by your real data · No external API</div>
      <div style={{...card({padding:0,overflow:"hidden"})}}>
        <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,background:"linear-gradient(135deg,#FF8C00,#FF5722)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>⚡</div>
          <div>
            <div style={{fontWeight:700,fontSize:14}}>Bijli Mitra</div>
            <div style={{fontSize:11,color:C.green,fontWeight:600}}>● Online · Data-driven</div>
          </div>
        </div>
        <div ref={chatRef} style={{height:360,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:10}}>
          {chatMsgs.map((m,i)=>(
            <div key={i} style={{display:"flex",gap:8,alignSelf:m.role==="user"?"flex-end":"flex-start",flexDirection:m.role==="user"?"row-reverse":"row",maxWidth:"85%"}}>
              <div style={{width:26,height:26,borderRadius:"50%",background:C.card2,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>{m.role==="user"?"👤":"⚡"}</div>
              <div>
                <div style={{background:m.role==="user"?"rgba(255,140,0,0.12)":C.card2,border:`1px solid ${m.role==="user"?"rgba(255,140,0,0.28)":C.border}`,borderRadius:12,padding:"9px 12px",fontSize:13,lineHeight:1.55,color:C.text,maxWidth:400,wordBreak:"break-word",whiteSpace:"pre-line"}}>
                  {m.text}
                </div>
                {m.chips&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:5}}>
                  {m.chips.map((c,j)=><span key={j} style={{background:"rgba(255,140,0,0.1)",border:"1px solid rgba(255,140,0,0.25)",color:C.saffron,padding:"3px 9px",borderRadius:20,fontSize:11,cursor:"pointer",fontWeight:500}} onClick={()=>sendChat(c)}>{c}</span>)}
                </div>}
              </div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8,padding:"10px 12px",borderTop:`1px solid ${C.border}`}}>
          <input style={{flex:1,background:C.bg3,border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}
            value={chatInput} onChange={e=>setChatInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&sendChat()}
            placeholder="Ask about your bill, usage, carbon... (English/Hinglish)"/>
          <button style={{background:"linear-gradient(135deg,#FF8C00,#FF5722)",color:"#fff",border:"none",padding:"9px 14px",borderRadius:10,fontSize:16,cursor:"pointer"}} onClick={()=>sendChat()}>➤</button>
        </div>
      </div>
    </div>
  );

  // ─ Bills ─
  const Bills=()=>{
    const bills=[1650,lastBill,projBill];
    const maxB=Math.max(...bills)*1.2;
    const acCost=acHours*1.5*(Math.min(acHours,4)*8.5+(Math.max(acHours-4,0)*3.5))/Math.max(acHours,1)*30;
    const acOpt=acHours*1.5*3.5*30;
    return <div>
      <div style={{fontSize:20,fontWeight:800,marginBottom:4}}>📄 Bill Predictor</div>
      <div style={{fontSize:12,color:C.text2,marginBottom:16}}>Month projection + bill shock detection + usage simulator</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
        <div style={card()}>
          <div style={{fontWeight:700,marginBottom:16}}>Monthly Bill Comparison</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:16,minHeight:150,paddingBottom:8}}>
            {[{l:"2 mo ago",v:1650,proj:false},{l:"Last month",v:lastBill,proj:false},{l:"This month",v:projBill,proj:true}].map((b,i)=>(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                <div style={{width:"100%",maxWidth:56,height:Math.round((b.v/maxB)*130),borderRadius:"8px 8px 0 0",background:b.proj?(billShock?"linear-gradient(180deg,#FF4444,#CC0000)":"linear-gradient(180deg,#FF8C00,#FF5722)"):"linear-gradient(180deg,#4A5F80,#1A2235)",transition:"height 0.8s ease"}}/>
                <div style={{fontWeight:800,fontSize:14,color:b.proj&&billShock?C.red:C.text}}>{fINR(b.v)}</div>
                <div style={{fontSize:10,color:C.text3,textAlign:"center"}}>{b.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={card()}>
          <div style={{fontWeight:700,marginBottom:10}}>📊 Appliance Cost Split</div>
          {apps.filter(a=>a.active).sort((a,b)=>b.kwh-a.kwh).map(a=>(
            <div key={a.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
              <span>{a.icon}</span>
              <span style={{flex:1,fontSize:12,fontWeight:600}}>{a.name}</span>
              <span style={{fontWeight:800,fontSize:13,color:C.saffron}}>{fINR(a.kwh*6*30*6)}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{...card(),marginBottom:14}}>
        <div style={{fontWeight:700,marginBottom:10}}>🎮 AC Usage Simulator</div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
          <span style={{fontSize:18}}>❄️</span>
          <div style={{flex:1}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{fontSize:13,fontWeight:600}}>AC Hours / Day</span>
              <span style={{fontWeight:800,color:C.saffron}}>{acHours} hrs</span>
            </div>
            <input type="range" min={0} max={24} value={acHours} onChange={e=>setAcHours(+e.target.value)} style={{width:"100%",accentColor:C.saffron,cursor:"pointer"}}/>
          </div>
        </div>
        <div style={{background:C.bg3,borderRadius:12,padding:14,display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}}>
          {[{l:"Current pattern",v:fINR(acCost),c:C.red,s:`${Math.min(acHours,4)}h peak+${Math.max(acHours-4,0)}h off-peak`},
            {l:"Fully Off-Peak",v:fINR(acOpt),c:C.green,s:`All ${acHours}h at ₹3.50`},
          ].map((x,i)=><div key={i}>
            <div style={{fontSize:10,color:C.text2}}>{x.l}</div>
            <div style={{fontWeight:800,fontSize:22,color:x.c}}>{x.v}<span style={{fontSize:12,fontWeight:400}}>/mo</span></div>
            <div style={{fontSize:10,color:C.text3}}>{x.s}</div>
          </div>)}
          <div style={{background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.25)",borderRadius:10,padding:"10px 14px",textAlign:"center"}}>
            <div style={{fontSize:10,color:C.green}}>Monthly Saving</div>
            <div style={{fontWeight:800,fontSize:22,color:C.green}}>{fINR(Math.max(0,acCost-acOpt))}</div>
          </div>
        </div>
        <div style={{fontSize:11,color:C.text3,marginTop:8}}>Formula: (₹8.50−₹3.50)×1.5kW×{Math.min(acHours,4)} peak hrs×30 days = {fINR((8.5-3.5)*1.5*Math.min(acHours,4)*30)} avoidable cost</div>
      </div>
      {billShock&&<div style={{background:"rgba(255,68,68,0.05)",border:"1px solid rgba(255,68,68,0.3)",borderRadius:14,padding:16,display:"flex",gap:12}}>
        <span style={{fontSize:28}}>⚠️</span>
        <div>
          <div style={{fontWeight:700,color:C.red,fontSize:15,marginBottom:4}}>Bill Shock Detected!</div>
          <div style={{fontSize:13,color:C.text2}}>Tracking {(((projBill-lastBill)/lastBill)*100).toFixed(0)}% higher than last month — {fINR(projBill-lastBill)} increase. AC running during Peak hours is the primary cause.</div>
          <div style={{marginTop:8,fontSize:13,fontWeight:600,color:C.saffron}}>💡 Fix: Shift AC to Off-Peak (10PM–6AM) → Save {fINR((8.5-3.5)*1.5*4*30)}/month</div>
        </div>
      </div>}
    </div>;
  };

  // ─ Carbon ─
  const Carbon=()=>(
    <div>
      <div style={{fontSize:20,fontWeight:800,marginBottom:4}}>🌱 Carbon Impact Tracker</div>
      <div style={{fontSize:12,color:C.text2,marginBottom:16}}>India grid: 0.82 kg CO₂ per kWh</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
        {[{icon:"💨",val:`${co2Month} kg`,label:"CO₂ Emitted",sub:"This month"},
          {icon:"🌳",val:(co2Month/21).toFixed(1),label:"Trees to Offset",sub:"1 year each"},
          {icon:"🚗",val:(co2Month/0.12).toFixed(0),label:"km Car Equivalent",sub:"Petrol car"},
        ].map((s,i)=><div key={i} style={{...statCard("rgba(34,197,94,0.10)"),...{}}}>
          <div style={{fontSize:26,marginBottom:5}}>{s.icon}</div>
          <div style={{fontWeight:800,fontSize:22,color:C.green}}>{s.val}</div>
          <div style={{fontSize:11,color:C.text2,marginTop:4}}>{s.label}</div>
          <div style={{fontSize:10,color:C.text3,marginTop:2}}>{s.sub}</div>
        </div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div style={card()}>
          <div style={{fontWeight:700,marginBottom:12}}>🌿 Your Savings Impact</div>
          {[{e:"🌿",v:"18.4 kg",l:"CO₂ saved by Off-Peak usage",s:"vs all-peak scenario"},
            {e:"🌳",v:`${(18.4/21).toFixed(1)} trees`,l:"Forest offset equivalent",s:"Working 1 year each"},
            {e:"🚗",v:`${(18.4/0.12).toFixed(0)} km`,l:"Car emissions avoided",s:"0.12 kg CO₂/km"},
            {e:"🏭",v:`${(18.4/0.82).toFixed(1)} kWh`,l:"Grid energy saved",s:"Reduced grid load"},
          ].map((r,i)=><div key={i} style={{display:"flex",gap:12,alignItems:"center",padding:"10px 0",borderBottom:i<3?`1px solid ${C.border}`:"none"}}>
            <span style={{fontSize:24}}>{r.e}</span>
            <div><div style={{fontWeight:800,fontSize:16,color:C.green}}>{r.v}</div><div style={{fontSize:12,color:C.text2}}>{r.l}</div><div style={{fontSize:10,color:C.text3}}>{r.s}</div></div>
          </div>)}
        </div>
        <div style={card()}>
          <div style={{fontWeight:700,marginBottom:12}}>🌏 India Context</div>
          <div style={{fontSize:12,color:C.text2,lineHeight:1.7,marginBottom:14}}>
            <p style={{marginBottom:8}}>India's grid emits <b style={{color:C.text}}>0.82 kg CO₂/kWh</b> — coal-heavy generation (~70%).</p>
            <p style={{marginBottom:8}}>Every unit shifted to Off-Peak helps balance grid load, enabling more renewable integration.</p>
            <p>India's target: <b style={{color:C.green}}>500 GW renewable by 2030</b>. 🇮🇳</p>
          </div>
          <div style={{background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:12,padding:14,textAlign:"center"}}>
            <div style={{fontSize:12,fontWeight:700,color:C.green,marginBottom:4}}>✅ Total Carbon Saved</div>
            <div style={{fontWeight:800,fontSize:26,color:C.green}}>18.4 kg CO₂</div>
            <div style={{fontSize:12,color:C.text2}}>≈ planting {(18.4/21).toFixed(1)} trees this year</div>
          </div>
        </div>
      </div>
    </div>
  );

  // ─ Rewards ─
  const Rewards=()=>(
    <div>
      <div style={{fontSize:20,fontWeight:800,marginBottom:4}}>🏆 Rewards & Gamification</div>
      <div style={{fontSize:12,color:C.text2,marginBottom:16}}>Earn points, unlock badges, compete with your city</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
        {[{icon:"⭐",val:score,label:"Energy Score",sub:"Pro Saver ⚡",g:"rgba(255,214,0,0.12)"},
          {icon:"💰",val:"₹1,240",label:"Total Savings",sub:"All time",g:"rgba(34,197,94,0.10)"},
          {icon:"🥇",val:"Top 25%",label:"City Rank",sub:"Delhi",g:"rgba(0,212,255,0.10)"},
        ].map((s,i)=><div key={i} style={statCard(s.g)}>
          <div style={{fontSize:24,marginBottom:5}}>{s.icon}</div>
          <div style={{fontWeight:800,fontSize:22}}>{s.val}</div>
          <div style={{fontSize:11,color:C.text2,marginTop:4}}>{s.label}</div>
          <div style={{fontSize:10,color:C.text3,marginTop:2}}>{s.sub}</div>
        </div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
        <div style={card()}>
          <div style={{fontWeight:700,marginBottom:12}}>🏅 Badges</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {BADGES_DEF.map(b=>{
              const e=earnedBadges.includes(b.id);
              return <div key={b.id} style={{background:e?"rgba(255,214,0,0.05)":C.bg3,border:`1px solid ${e?"rgba(255,214,0,0.35)":C.border}`,borderRadius:12,padding:"12px 8px",textAlign:"center",opacity:e?1:0.4}}>
                <div style={{fontSize:28,marginBottom:5}}>{b.icon}</div>
                <div style={{fontSize:11,fontWeight:700}}>{b.name}</div>
                <div style={{fontSize:9,color:C.text2,marginTop:2}}>{b.cond}</div>
                <div style={{fontSize:9,fontWeight:700,marginTop:4,color:e?"#FFD600":C.text3}}>{e?"✅ EARNED":"🔒"}</div>
              </div>;
            })}
          </div>
        </div>
        <div style={card()}>
          <div style={{fontWeight:700,marginBottom:12}}>📈 Score Progress</div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
            <span style={{fontSize:12,color:C.text2}}>Energy Score</span>
            <span style={{fontWeight:800,fontSize:16,color:C.saffron}}>{score} / 600</span>
          </div>
          <div style={progressBg}><div style={progressFill((score/600)*100)}/></div>
          <div style={{fontSize:10,color:C.text3,marginTop:4}}>Pro Saver ⚡ → Energy Master ({600-score} pts)</div>
          <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12,marginTop:12}}>
            <div style={{fontSize:11,fontWeight:700,color:C.text2,marginBottom:8}}>HOW TO EARN MORE</div>
            {[["🌙 Off-Peak usage","+20"],["💰 Save ₹500 total","+50"],["📉 Reduce 10%","+100"],["✅ Accept suggestion","+15"]].map(([a,p],i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:12}}>
                <span style={{color:C.text2}}>{a}</span>
                <span style={{...chip("green"),fontSize:10}}>{p} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={card()}>
        <div style={{fontWeight:700,marginBottom:12}}>🥇 Delhi Leaderboard</div>
        {LEADERBOARD.map(p=>(
          <div key={p.rank} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:10,background:p.you?"rgba(255,140,0,0.07)":C.bg3,border:`1px solid ${p.you?"rgba(255,140,0,0.28)":C.border}`,marginBottom:7}}>
            <div style={{fontWeight:800,fontSize:16,width:28,color:p.rank<=3?"#FFD600":C.text3}}>{p.rank<=3?["🥇","🥈","🥉"][p.rank-1]:p.rank}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600}}>{p.name}{p.you&&<span style={{...chip("blue"),fontSize:9,marginLeft:6}}>YOU</span>}</div>
              <div style={{fontSize:10,color:C.text2}}>{p.city}</div>
            </div>
            <div style={{fontWeight:800,fontSize:16,color:C.saffron}}>{p.score}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ─ Alerts ─
  const Alerts=()=>{
    const notifs=[
      {t:"warning",i:"⚡",m:`AC running during ${tariff.name} (₹${tariff.rate}/unit). Shift to Off-Peak to save ₹${((tariff.rate-3.5)*1.5*4*30).toFixed(0)}/month.`,time:"2 min ago"},
      {t:"tip",i:"🌙",m:"Off-Peak hours begin at 10:00 PM (₹3.50/unit). Schedule Washing Machine & Geyser now for max savings!",time:"15 min ago"},
      {t:"warning",i:"📈",m:`Bill projected ${fINR(projBill)} — ${(((projBill-lastBill)/lastBill)*100).toFixed(0)}% higher than last month.`,time:"1 hr ago"},
      {t:"achievement",i:"🏆",m:`🎉 You earned "Peak Avoider" badge! 20+ Off-Peak sessions. +50 pts!`,time:"3 hrs ago"},
      {t:"tip",i:"💡",m:"Geyser tip: Heat at 5AM (Off-Peak) not 7AM (Peak). Saves ₹150/month. Formula: (₹8.50−₹3.50)×2kW×0.5hr×30=₹150",time:"Yesterday"},
      {t:"info",i:"📊",m:`Daily avg: 18.4 kWh. Delhi city avg: 15 kWh. Small AC schedule tweaks can bring you below average!`,time:"Yesterday"},
      {t:"achievement",i:"⚡",m:"Milestone: You've saved ₹1,240 in total since joining Bijli Sathi! 🎊",time:"3 days ago"},
    ];
    const bc={warning:C.red,tip:C.green,achievement:"#FFD600",info:C.electric};
    const bg={warning:"rgba(255,68,68,0.06)",tip:"rgba(34,197,94,0.06)",achievement:"rgba(255,214,0,0.06)",info:"rgba(0,212,255,0.06)"};
    return <div>
      <div style={{fontSize:20,fontWeight:800,marginBottom:4}}>🔔 Smart Alerts</div>
      <div style={{fontSize:12,color:C.text2,marginBottom:16}}>Real-time notifications from your optimization engine</div>
      {notifs.map((n,i)=>(
        <div key={i} style={{background:bg[n.t],borderLeft:`3px solid ${bc[n.t]}`,borderRadius:10,padding:"12px 14px",marginBottom:10,display:"flex",gap:10}}>
          <span style={{fontSize:18,flexShrink:0,paddingTop:2}}>{n.i}</span>
          <div>
            <div style={{fontSize:13,color:C.text,lineHeight:1.55}}>{n.m}</div>
            <div style={{fontSize:10,color:C.text3,marginTop:3}}>{n.time}</div>
          </div>
        </div>
      ))}
    </div>;
  };

  const screens={dashboard:<Dashboard/>,optimizer:<Optimizer/>,plugs:<Plugs/>,assistant:<Assistant/>,bills:<Bills/>,carbon:<Carbon/>,rewards:<Rewards/>,alerts:<Alerts/>};

  return(
    <div style={{display:"flex",height:"100vh",background:C.bg,color:C.text,fontFamily:"system-ui,sans-serif",overflow:"hidden"}}>
      {/* Sidebar */}
      <aside style={{width:210,background:C.bg2,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"18px 16px 12px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:18,fontWeight:800,color:C.saffron,display:"flex",alignItems:"center",gap:6}}>⚡ Bijli Sathi</div>
          <div style={{fontSize:9,color:C.text3,letterSpacing:1.5,textTransform:"uppercase",marginTop:2}}>AI Energy Assistant</div>
        </div>
        <nav style={{padding:"6px 0",flex:1,overflowY:"auto"}}>
          {TABS.map(t=>(
            <div key={t.id} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 16px",cursor:"pointer",
              color:tab===t.id?C.saffron:C.text2,background:tab===t.id?"rgba(255,140,0,0.08)":"transparent",
              borderLeft:tab===t.id?`3px solid ${C.saffron}`:"3px solid transparent",fontSize:13,fontWeight:500,userSelect:"none"}}
              onClick={()=>setTab(t.id)}>
              <span style={{fontSize:14,width:18,textAlign:"center"}}>{t.icon}</span> {t.label}
              {t.id==="alerts"&&<span style={{marginLeft:"auto",background:C.red,color:"#fff",fontSize:8,fontWeight:700,padding:"2px 5px",borderRadius:10}}>7</span>}
            </div>
          ))}
        </nav>
        <div style={{margin:"0 10px 12px",padding:"10px 12px",background:C.bg3,borderRadius:12,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:30,height:30,background:"linear-gradient(135deg,#FF8C00,#FF5722)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>RS</div>
          <div>
            <div style={{fontSize:12,fontWeight:700}}>Rahul Sharma</div>
            <div style={{fontSize:11,color:C.saffron,fontWeight:600}}>⚡ {score} pts</div>
          </div>
        </div>
      </aside>
      {/* Main */}
      <main style={{flex:1,overflowY:"auto",padding:"18px 22px"}}>
        {screens[tab]}
      </main>
    </div>
  );
}