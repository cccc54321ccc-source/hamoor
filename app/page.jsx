"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { ARTICLES, ARTICLE_CATEGORIES } from "./articles";
import { signUp, signIn, signOut, getCurrentUser, onAuthChange, saveAnalysisCloud, updateAnalysisCloud, getAnalysesCloud, deleteAnalysisCloud, getProfile, updateName, activateWithCode, cancelSubscription, getUsage, incrementUsage, getPremiumUsage, incrementPremiumUsage, addFinanceEntry, getFinanceEntries, getAdvisorMessages, saveAdvisorMessage, getDoneTasks, toggleTask, getMetrics, addMetric, addMetricEntry, deleteMetric, getDocuments, addDocument, updateDocumentStatus, deleteDocument, updateFinanceEntry, deleteFinanceEntry, deleteMetricEntry, getPlanItems, addPlanItem, togglePlanItem, deletePlanItem, deletePlan, updateMetricChart, getTeamMembers, addTeamMember, updateTeamMember, deleteTeamMember } from "./authStore";
import {
  Home, BarChart2, Grid, BookOpen, ChevronDown, TrendingUp, Users, DollarSign,
  AlertTriangle, MapPin, Coffee, ShoppingBag, Building2, Utensils, Wifi, Car,
  Search, CheckCircle, XCircle, Clock, Lightbulb, Zap, Shield, Sparkles, X,
  Target, Award, TrendingDown, Calendar, PieChart, Activity, Briefcase, Star,
  Scissors, GraduationCap, Dumbbell, Smartphone, Cake, Pizza, Shirt, Sparkle,
  ChevronRight, Share2, Trash2, Archive, FileText, Eye, ArrowRight, Flame, Layers, Info, Moon, Sun,
  LogOut, Mail, Lock, User, Crown, Settings, Check, KeyRound, Download, Plus
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const CATEGORY_ICONS = { Utensils, ShoppingBag, Sparkle, GraduationCap, Dumbbell, Briefcase, Activity, PieChart, BookOpen };

const LIGHT = {
  bg:"#F2F2F7", surface:"#FFFFFF", L1:"#1C1C1E", L2:"rgba(60,60,67,0.78)",
  L3:"rgba(60,60,67,0.54)", L4:"rgba(60,60,67,0.26)",
  blue:"#007AFF", green:"#34C759", red:"#FF3B30", orange:"#FF9500", purple:"#AF52DE",
  teal:"#32ADE6", indigo:"#5856D6", pink:"#FF2D92", yellow:"#FFCC00",
  F3:"rgba(120,120,128,0.12)", F4:"rgba(120,120,128,0.08)", F5:"rgba(120,120,128,0.04)",
  sep:"rgba(60,60,67,0.29)", sepL:"rgba(60,60,67,0.10)",
  hdrBlue:"linear-gradient(168deg,#1D6EF5 0%,#007AFF 55%,#0063DB 100%)",
  hdrGreen:"linear-gradient(160deg,#2DD36F,#34C759,#1E9E40)",
  hdrRed:"linear-gradient(160deg,#FF4747,#FF3B30,#D42820)",
};

const DARK = {
  bg:"#0E1726", surface:"#172033", L1:"#F4F6FB", L2:"rgba(228,233,242,0.80)",
  L3:"rgba(228,233,242,0.55)", L4:"rgba(228,233,242,0.32)",
  blue:"#3B6FD4", green:"#32D74B", red:"#FF5A4E", orange:"#FF9F0A", purple:"#A98AE6",
  teal:"#5BC8E8", indigo:"#6E7BE0", pink:"#E8628A", yellow:"#FFD60A",
  F3:"rgba(120,135,170,0.26)", F4:"rgba(120,135,170,0.18)", F5:"rgba(120,135,170,0.10)",
  sep:"rgba(120,135,170,0.45)", sepL:"rgba(120,135,170,0.22)",
  hdrBlue:"linear-gradient(168deg,#0F1F4D,#0A1430)",
  hdrGreen:"linear-gradient(160deg,#16432A,#0E2E1C)",
  hdrRed:"linear-gradient(160deg,#5C1418,#3D0D10)",
};

let $ = LIGHT;

// خط النظام: على أجهزة ابل يطلع خط ابل نفسه، وعلى غيرها الخط العادي للجهاز
const APP_FONT = "-apple-system,BlinkMacSystemFont,system-ui,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";

const SH = {
  card:"0 1px 0 rgba(0,0,0,0.05),0 2px 12px rgba(0,0,0,0.05),0 4px 24px rgba(0,0,0,0.04)",
  lift:"0 2px 4px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.08),0 16px 48px rgba(0,0,0,0.06)",
  blue:"0 2px 8px rgba(0,122,255,0.22),0 8px 32px rgba(0,122,255,0.28)",
};
const sp = {1:4,2:8,3:12,4:16,5:20,6:24,7:28,8:32,10:40,12:48,14:56,16:64};

const FREE_ANALYSES = 2;
const FREE_ARTICLE_IDS = [1, 2, 3, 22, 23];
const FREE_ARTICLES = FREE_ARTICLE_IDS.length;
const PREMIUM_ANALYSES = 10; // المشترك يحصل على 10 تحليلات لكل فترة اشتراك (لا تتجدد بالوقت، تصفّر مع كل اشتراك جديد)

function useScreenSize() {
  const [size, setSize] = useState({ width: 0, isMobile: true, isTablet: false, isDesktop: false });
  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      setSize({ width: w, isMobile: w < 768, isTablet: w >= 768 && w < 1024, isDesktop: w >= 1024 });
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return size;
}

const THEME_KEY = "hamour_theme";

function formatDate(isoString) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    const diff = (new Date() - d) / (1000 * 60);
    if (diff < 1) return "الآن";
    if (diff < 60) return `قبل ${Math.floor(diff)} دقيقة`;
    if (diff < 1440) return `قبل ${Math.floor(diff/60)} ساعة`;
    if (diff < 10080) return `قبل ${Math.floor(diff/1440)} يوم`;
    // تنسيق تاريخ يدوي آمن على iPad Safari (toLocaleDateString يكسره)
    const months = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch(e) { return ""; }
}

async function apiCall(endpoint, body) {
  const res = await fetch(`/api/${endpoint}`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "خطأ في الخادم");
  return data;
}

const fmt = n => numWithCommas(n);
function numWithCommas(n){
  try{
    const s = String(Math.round(n||0));
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }catch(e){ return String(n||0); }
}
const AR_MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
function gregorianDate(d){
  try{ return d.getDate()+" "+AR_MONTHS[d.getMonth()]+" "+d.getFullYear(); }
  catch(e){ return ""; }
}

const CITY_MARKET_SCORE = {
  "الرياض":100,"جدة":92,"الدمام":80,"الخبر":76,"مكة المكرمة":85,
  "المدينة المنورة":78,"الطائف":62,"تبوك":60,"أبها":58,"الباحة":48,
  "القصيم":70,"حائل":54,"نجران":46,"جازان":64,"ينبع":52,"الجوف":44,"عرعر":42
};

const SECTOR_CITY_FIT = {
  1:{"الرياض":90,"جدة":92,"الخبر":88,"أبها":85,"الباحة":80,"الطائف":82,def:75},
  2:{"الرياض":88,"جدة":90,"مكة المكرمة":92,"المدينة المنورة":90,"الخبر":85,def:78},
  3:{"الرياض":82,"جدة":84,"مكة المكرمة":86,"القصيم":80,def:74},
  4:{"الرياض":85,"جدة":85,"مكة المكرمة":88,"تبوك":80,def:75},
  5:{"الرياض":85,"جدة":83,"الدمام":82,def:72},
  6:{"الرياض":88,"جدة":90,"الخبر":82,def:70},
  7:{"الرياض":84,"جدة":82,"تبوك":78,def:68},
  8:{"الرياض":86,"جدة":88,"أبها":78,def:74},
  9:{"الرياض":78,"القصيم":84,"المدينة المنورة":82,def:76},
  10:{"الرياض":90,"جدة":86,"القصيم":82,def:76},
  11:{"الرياض":88,"الخبر":85,"تبوك":80,def:70},
  12:{"الرياض":95,"جدة":88,"تبوك":82,def:68}
};

function cityScore(s, c) {
  if (c === "all") return s.score;
  const sr = 100 - (parseInt(String(s.failure_rate).replace(/\D/g,"")) || 50);
  const m = CITY_MARKET_SCORE[c] || 55;
  const ft = SECTOR_CITY_FIT[s.id] || {};
  const f = ft[c] || ft.def || 70;
  return Math.min(99, Math.max(20, Math.round(sr*0.4 + m*0.3 + f*0.3)));
}

function scoreColor(v) {
  return v>=75 ? $.green : v>=60 ? $.orange : $.red;
}

function Spinner({sz=20, clr="#fff"}) {
  return <div style={{width:sz,height:sz,flexShrink:0,border:`2.5px solid ${clr}28`,borderTop:`2.5px solid ${clr}`,borderRadius:"50%",animation:"_spin .72s linear infinite"}}/>;
}

function ScoreRing({value, size=120, track=10, color=$.blue, noAnim=false}) {
  const [v, setV] = useState(noAnim ? value : 0);
  const raf = useRef();
  useEffect(() => {
    if (noAnim) { setV(value); return; }
    let t0;
    function tick(ts) {
      if (!t0) t0 = ts;
      const p = Math.min((ts-t0)/1100, 1);
      setV(Math.round(value*(1-Math.pow(1-p,4))));
      if (p<1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, noAnim]);
  const r=((size-track)/2), cx=size/2, circ=2*Math.PI*r, dash=(v/100)*circ;
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)",display:"block"}}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={`${color}1A`} strokeWidth={track}/>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={track} strokeLinecap="round" strokeDasharray={`${dash} ${circ-dash}`}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:size*.246,fontWeight:800,color:$.L1,letterSpacing:"-2px",lineHeight:1}}>{v}</span>
        <span style={{fontSize:size*.097,fontWeight:500,color:$.L3,marginTop:2}}>/ 100</span>
      </div>
    </div>
  );
}

function Bar({pct, color=$.blue, h=6}) {
  return <div style={{background:$.F3,borderRadius:99,height:h,overflow:"hidden"}}><div style={{width:`${Math.min(pct,100)}%`,height:"100%",background:color,borderRadius:99,transition:"width .9s"}}/></div>;
}

function Chip({text, color=$.L3, bg=$.F4, size=11}) {
  return <span style={{display:"inline-flex",alignItems:"center",background:bg,color,borderRadius:99,padding:`${size>11?5:3}px ${size>11?14:10}px`,fontSize:size,fontWeight:600,lineHeight:1.2}}>{text}</span>;
}

function IconBadge({Icon, color, size=36}) {
  return <div style={{width:size,height:size,borderRadius:size*.27,background:`${color}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon size={size*.48} color={color} strokeWidth={1.9}/></div>;
}

function Card({children, style, onClick}) {
  return <div onClick={onClick} style={{background:$.surface,borderRadius:20,boxShadow:SH.card,overflow:"hidden",...style}}>{children}</div>;
}

function SectionLabel({children, action}) {
  return <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:sp[3]}}><div style={{fontSize:14,fontWeight:700,color:$.L1}}>{children}</div>{action}</div>;
}

function Section({title, Icon, color=$.blue, children, subtitle}) {
  return <Card style={{marginBottom:sp[3]}}>
    <div style={{display:"flex",alignItems:"center",gap:sp[3],padding:`${sp[4]}px ${sp[5]}px ${sp[3]}px`,borderBottom:`0.5px solid ${$.sepL}`}}>
      <IconBadge Icon={Icon} color={color} size={32}/>
      <div style={{flex:1}}>
        <div style={{fontSize:15,fontWeight:700,color:$.L1}}>{title}</div>
        {subtitle && <div style={{fontSize:11,color:$.L3,marginTop:1}}>{subtitle}</div>}
      </div>
    </div>
    <div style={{padding:`${sp[4]}px ${sp[5]}px`}}>{children}</div>
  </Card>;
}

function MoneyRow({label, value, valueColor=$.L1, bold=false, big=false, note=null}) {
  return <div style={{padding:`${sp[2]}px 0`,borderBottom:`0.5px solid ${$.sepL}`}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span style={{fontSize:13,color:$.L2}}>{label}</span>
      <span style={{fontSize:big?17:(bold?15:14),fontWeight:bold?800:600,color:valueColor,display:"inline-flex",alignItems:"center",gap:5,direction:"ltr"}}>
        <span>{fmt(value)}</span>
        <span style={{fontFamily:APP_FONT,fontWeight:700}}>﷼</span>
      </span>
    </div>
    {note && <div style={{fontSize:11,color:$.L4,marginTop:3,lineHeight:1.4}}>{note}</div>}
  </div>;
}

function Row({label, value, valueColor=$.L1, bold=false, note=null}) {
  return <div style={{padding:`${sp[2]}px 0`,borderBottom:`0.5px solid ${$.sepL}`}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span style={{fontSize:13,color:$.L2}}>{label}</span>
      <span style={{fontSize:bold?15:14,fontWeight:bold?800:600,color:valueColor,textAlign:"left"}}>{value}</span>
    </div>
    {note && <div style={{fontSize:11,color:$.L4,marginTop:3,lineHeight:1.4}}>{note}</div>}
  </div>;
}

const iStyle = () => ({width:"100%",boxSizing:"border-box",background:$.F5,border:"1.5px solid transparent",borderRadius:12,padding:`${sp[3]}px ${sp[4]}px`,fontSize:15,color:$.L1,fontFamily:"inherit",outline:"none",appearance:"none",WebkitAppearance:"none"});

function FormField({label, icon, children}) {
  return <div style={{marginBottom:sp[4]}}><div style={{display:"flex",alignItems:"center",gap:5,marginBottom:7}}>{icon}<label style={{fontSize:12,fontWeight:600,color:$.L3}}>{label}</label></div>{children}</div>;
}

function Sheet({open, onClose, children}) {
  const screen = useScreenSize();
  if (!open) return null;
  return (
    <div style={{position:"fixed",top:0,bottom:0,left:0,right:screen.isDesktop?260:0,zIndex:2000,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.40)",backdropFilter:"blur(4px)"}}/>
      <div style={{position:"relative",background:$.surface,borderRadius:"24px 24px 0 0",maxHeight:"92vh",maxHeight:"92dvh",maxWidth:720,margin:"0 auto",width:"100%",overflowY:"auto",paddingBottom:"env(safe-area-inset-bottom)"}}>
        <div style={{display:"flex",justifyContent:"center",padding:`${sp[3]}px 0`,position:"sticky",top:0,background:$.surface,zIndex:10}}><div style={{width:36,height:4,borderRadius:99,background:$.F3}}/></div>
        <button onClick={onClose} style={{position:"sticky",top:sp[3],left:sp[4],background:$.F3,border:"none",borderRadius:99,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginLeft:sp[4],zIndex:11}}><X size={16} color={$.L3}/></button>
        {children}
      </div>
    </div>
  );
}

// نمط الشباك - خلفية زخرفية
const MESH_PATHS = [{d:"M-30,-35.0 Q-30,-35.0 -14,-32.5 Q3,-30.1 19,-31.4 Q36,-32.7 52,-36.7 Q69,-40.6 85,-43.7 Q101,-46.7 118,-48.8 Q134,-50.9 151,-55.3 Q167,-59.6 184,-67.3 Q200,-75.0 216,-82.2 Q233,-89.4 249,-92.5 Q266,-95.6 282,-95.8 Q299,-96.0 315,-97.1 Q331,-98.2 348,-100.6 Q364,-103.0 381,-103.5 Q397,-104.0 414,-101.7",o:0.62},{d:"M-30,7.8 Q-30,7.8 -14,7.5 Q3,7.1 19,3.0 Q36,-1.1 52,-5.4 Q69,-9.8 85,-12.5 Q101,-15.1 118,-18.7 Q134,-22.3 151,-29.1 Q167,-35.9 184,-43.5 Q200,-51.1 216,-55.1 Q233,-59.1 249,-59.1 Q266,-59.1 282,-59.0 Q299,-58.9 315,-60.7 Q331,-62.5 348,-63.9 Q364,-65.2 381,-63.8 Q397,-62.5 414,-60.7",o:0.59},{d:"M-30,46.3 Q-30,46.3 -14,42.5 Q3,38.7 19,33.3 Q36,27.9 52,24.3 Q69,20.6 85,17.4 Q101,14.3 118,8.5 Q134,2.8 151,-4.7 Q167,-12.1 184,-17.0 Q200,-21.9 216,-22.2 Q233,-22.6 249,-21.5 Q266,-20.3 282,-21.2 Q299,-22.1 315,-23.9 Q331,-25.7 348,-25.5 Q364,-25.2 381,-23.6 Q397,-22.0 414,-23.2",o:0.56},{d:"M-30,78.4 Q-30,78.4 -14,72.4 Q3,66.4 19,61.5 Q36,56.6 52,53.4 Q69,50.2 85,45.6 Q101,41.0 118,34.1 Q134,27.2 151,21.6 Q167,16.0 184,15.0 Q200,14.0 216,15.8 Q233,17.5 249,17.8 Q266,18.1 282,16.3 Q299,14.4 315,13.5 Q331,12.6 348,13.5 Q364,14.5 381,14.0 Q397,13.5 414,8.4",o:0.53},{d:"M-30,105.4 Q-30,105.4 -14,99.3 Q3,93.2 19,89.5 Q36,85.8 52,82.1 Q69,78.4 85,72.5 Q101,66.6 118,60.7 Q134,54.8 151,52.9 Q167,51.0 184,52.9 Q200,54.8 216,56.2 Q233,57.7 249,56.3 Q266,54.9 282,53.0 Q299,51.1 315,51.1 Q331,51.0 348,50.8 Q364,50.6 381,46.4 Q397,42.3 414,34.6",o:0.5},{d:"M-30,130.6 Q-30,130.6 -14,126.0 Q3,121.4 19,118.3 Q36,115.1 52,110.4 Q69,105.7 85,99.9 Q101,94.2 118,91.4 Q134,88.6 151,90.1 Q167,91.7 184,94.1 Q200,96.4 216,95.9 Q233,95.4 249,92.9 Q266,90.4 282,89.1 Q299,87.8 315,87.5 Q331,87.1 348,83.8 Q364,80.6 381,73.3 Q397,65.9 414,58.3",o:0.47},{d:"M-30,157.3 Q-30,157.3 -14,154.3 Q3,151.2 19,147.7 Q36,144.2 52,139.1 Q69,134.0 85,130.5 Q101,127.0 118,127.8 Q134,128.7 151,131.6 Q167,134.5 184,135.0 Q200,135.5 216,132.8 Q233,130.2 249,127.7 Q266,125.2 282,124.2 Q299,123.1 315,120.6 Q331,118.1 348,111.6 Q364,105.0 381,96.8 Q397,88.7 414,83.4",o:0.45},{d:"M-30,187.0 Q-30,187.0 -14,184.5 Q3,182.0 19,177.9 Q36,173.9 52,170.0 Q69,166.2 85,166.1 Q101,166.0 118,168.9 Q134,171.9 151,173.4 Q167,175.0 184,172.7 Q200,170.4 216,166.8 Q233,163.3 249,161.2 Q266,159.2 282,157.0 Q299,154.8 315,149.3 Q331,143.7 348,135.6 Q364,127.4 381,121.2 Q397,114.9 414,112.9",o:0.42},{d:"M-30,219.1 Q-30,219.1 -14,216.2 Q3,213.4 19,209.7 Q36,206.0 52,205.0 Q69,203.9 85,206.4 Q101,209.0 118,211.3 Q134,213.7 151,212.1 Q167,210.5 184,206.3 Q200,202.1 216,198.8 Q233,195.5 249,193.2 Q266,190.9 282,186.4 Q299,181.9 315,174.2 Q331,166.5 348,159.5 Q364,152.5 381,149.7 Q397,147.0 414,147.0",o:0.39},{d:"M-30,252.4 Q-30,252.4 -14,249.4 Q3,246.3 19,244.4 Q36,242.6 52,244.3 Q69,246.0 85,248.8 Q101,251.6 118,250.9 Q134,250.3 151,245.9 Q167,241.5 184,236.9 Q200,232.4 216,229.5 Q233,226.6 249,222.9 Q266,219.2 282,212.4 Q299,205.6 315,198.2 Q331,190.8 348,187.2 Q364,183.5 381,183.8 Q397,184.0 414,184.3",o:0.36},{d:"M-30,286.6 Q-30,286.6 -14,284.3 Q3,282.1 19,282.7 Q36,283.4 52,286.1 Q69,288.8 85,289.2 Q101,289.5 118,285.3 Q134,281.2 151,275.6 Q167,270.0 184,266.2 Q200,262.3 216,259.1 Q233,255.8 249,250.1 Q266,244.4 282,237.1 Q299,229.8 315,225.2 Q331,220.7 348,220.7 Q364,220.6 381,222.0 Q397,223.3 414,222.5",o:0.33},];
function MeshBg({mode="color", opacity=0.5, animated=true}) {
  const palette = ["#7C3AED","#1D4ED8","#00C27A","#5B8DEF"];
  return (
    <div style={{position:"absolute",inset:0,zIndex:0,overflow:"hidden",pointerEvents:"none"}}>
      <svg viewBox="0 0 400 220" preserveAspectRatio="none" style={{width:"100%",height:"100%",opacity}}>
        {MESH_PATHS.map((p,i)=>(
          <path key={i} d={p.d} fill="none" strokeLinecap="round" strokeWidth={1.4}
            stroke={mode==="white"?"#ffffff":palette[i%palette.length]} opacity={p.o}/>
        ))}
      </svg>
      {animated && mode!=="white" && (<>
        <div style={{position:"absolute",width:7,height:7,borderRadius:"50%",background:"#00C27A",boxShadow:"0 0 14px 4px #00C27A",animation:"_mesh1 7s ease-in-out infinite"}}/>
        <div style={{position:"absolute",width:6,height:6,borderRadius:"50%",background:"#7C3AED",boxShadow:"0 0 14px 4px #7C3AED",animation:"_mesh2 9s ease-in-out infinite"}}/>
      </>)}
      {animated && mode==="white" && (
        <div style={{position:"absolute",width:6,height:6,borderRadius:"50%",background:"#fff",boxShadow:"0 0 14px 4px rgba(255,255,255,0.8)",animation:"_mesh1 7s ease-in-out infinite"}}/>
      )}
    </div>
  );
}

const CITIES = [
  "الرياض","جدة","الدمام","مكة المكرمة","المدينة المنورة","الخبر","الطائف",
  "تبوك","أبها","الباحة","القصيم","حائل","نجران","جازان","ينبع","الجوف","عرعر"
];

const FEATURED_SECTORS = [
  {id:"tech", name:"خدمات تقنية", Icon:Wifi, color:$.indigo, score:85, growth:"+25%"},
  {id:"edu", name:"تعليم وتدريب", Icon:GraduationCap, color:$.blue, score:82, growth:"+22%"},
  {id:"fit", name:"لياقة ورياضة", Icon:Dumbbell, color:$.green, score:78, growth:"+20%"},
  {id:"sweets", name:"حلويات", Icon:Cake, color:$.pink, score:72, growth:"+18%"}
];
function AuthScreen({onSuccess}) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const canGo = email.trim() && password.trim() && !busy;

  async function go() {
    if (!canGo) return;
    setBusy(true); setErr(null);
    try {
      if (mode === "signup") {
        await signUp(email.trim(), password);
      } else {
        await signIn(email.trim(), password);
      }
      const user = await getCurrentUser();
      if (user) onSuccess(user);
      else setErr("تعذّر تسجيل الدخول، حاول مرة أخرى");
    } catch(e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div style={{minHeight:"100vh",background:$.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:`${sp[6]}px ${sp[5]}px`}}>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:sp[8]}}>
          <div style={{width:72,height:72,borderRadius:22,background:"linear-gradient(145deg,#1D6EF5,#0055D4)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto",marginBottom:sp[4],boxShadow:SH.blue,overflow:"hidden"}}>
            <img src="/logo.png" alt="هامور" style={{width:54,height:54,objectFit:"contain"}}/>
          </div>
          <h1 style={{fontSize:32,fontWeight:800,color:$.L1,letterSpacing:"-1px",marginBottom:6}}>هامور</h1>
          <p style={{fontSize:14,color:$.L3,lineHeight:1.6}}>دراسة جدوى ذكية للسوق السعودي</p>
        </div>

        <Card style={{padding:`${sp[6]}px ${sp[5]}px`}}>
          <div style={{display:"flex",background:$.F3,borderRadius:12,padding:3,marginBottom:sp[5]}}>
            <button onClick={()=>{setMode("login");setErr(null);}} style={{flex:1,padding:`${sp[2]}px`,borderRadius:10,border:"none",cursor:"pointer",fontFamily:"inherit",background:mode==="login"?$.surface:"transparent",color:mode==="login"?$.blue:$.L3,fontSize:14,fontWeight:mode==="login"?700:500,boxShadow:mode==="login"?SH.card:"none"}}>تسجيل الدخول</button>
            <button onClick={()=>{setMode("signup");setErr(null);}} style={{flex:1,padding:`${sp[2]}px`,borderRadius:10,border:"none",cursor:"pointer",fontFamily:"inherit",background:mode==="signup"?$.surface:"transparent",color:mode==="signup"?$.blue:$.L3,fontSize:14,fontWeight:mode==="signup"?700:500,boxShadow:mode==="signup"?SH.card:"none"}}>حساب جديد</button>
          </div>

          <FormField label="البريد الإلكتروني" icon={<Mail size={14} color={$.L4}/>}>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="example@email.com" inputMode="email" autoCapitalize="none" style={{...iStyle(),direction:"ltr",textAlign:"left"}}/>
          </FormField>
          <FormField label="كلمة المرور" icon={<Lock size={14} color={$.L4}/>}>
            <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="••••••••" style={{...iStyle(),direction:"ltr",textAlign:"left"}}/>
          </FormField>

          {mode==="signup" && <p style={{fontSize:11,color:$.L4,marginTop:-sp[2],marginBottom:sp[3],lineHeight:1.5}}>استخدم 6 أحرف على الأقل لكلمة المرور</p>}

          {err && <div style={{marginBottom:sp[3],background:`${$.red}09`,border:`1px solid ${$.red}25`,borderRadius:12,padding:`${sp[3]}px ${sp[4]}px`,fontSize:13,color:$.red,lineHeight:1.6}}>{err}</div>}

          <button onClick={go} disabled={!canGo} style={{width:"100%",background:canGo?"linear-gradient(150deg,#1A7AFF,#007AFF,#005FCC)":$.F3,color:canGo?"#fff":$.L4,border:"none",borderRadius:14,padding:`${sp[4]}px`,fontSize:16,fontWeight:700,cursor:canGo?"pointer":"not-allowed",fontFamily:"inherit",boxShadow:canGo?SH.blue:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:sp[2]}}>
            {busy?<><Spinner sz={17}/>لحظة…</>:<>{mode==="signup"?"إنشاء الحساب":"دخول"}</>}
          </button>
        </Card>

        <p style={{fontSize:11,color:$.L4,textAlign:"center",marginTop:sp[5],lineHeight:1.6}}>تحليلاتك تُحفظ في حسابك وتظهر على أي جهاز تسجّل دخوله</p>
      </div>
    </div>
  );
}

function UpgradeSheet({open, onClose, user, onActivated}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(false);
  const [plan, setPlan] = useState("yearly");
  const [payBusy, setPayBusy] = useState(false);
  const [payErr, setPayErr] = useState(null);
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  async function startPayment() {
    if (payBusy) return;
    if (!user) { setPayErr("يجب تسجيل الدخول أولاً"); return; }
    setPayBusy(true); setPayErr(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, userId: user.id, email: user.email })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "GATEWAY_NOT_CONFIGURED") {
          setPayErr("الدفع الإلكتروني قيد التفعيل. استخدم كود التفعيل أدناه أو راسلنا على hamoorservice@gmail.com");
        } else {
          setPayErr(data.error || "تعذّر بدء عملية الدفع");
        }
        setPayBusy(false);
        return;
      }
      if (data.redirectUrl) { window.location.href = data.redirectUrl; return; }
      setPayErr("تعذّر فتح صفحة الدفع، حاول مرة أخرى");
      setPayBusy(false);
    } catch(e) {
      setPayErr("تعذّر الاتصال، تحقق من الإنترنت وحاول مرة أخرى");
      setPayBusy(false);
    }
  }

  async function activate() {
    if (!code.trim() || busy) return;
    setBusy(true); setErr(null);
    try {
      await activateWithCode(user.id, code);
      setDone(true);
      setTimeout(() => { onActivated(); onClose(); }, 1400);
    } catch(e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  const FEATURES = [
    "حتى 10 تحليلات لكل فترة اشتراك",
    "كل المقالات مفتوحة",
    "قسم اقتراحات المشاريع",
    "تحليل عميق بالذكاء الاصطناعي"
  ];
  const MORE_FEATURES = [
    "تحليل المخاطر والتحديات بالتفصيل",
    "الخطة التنفيذية والتسعير الكاملة",
    "تعديل معطيات تحليلك وإعادة الحساب",
    "مستشار ذكي يتابع مشروعك خطوة بخطوة",
    "تتبع إيرادك ومصروفك الفعلي عبر الزمن",
    "إدارة فريق العمل بالكامل",
    "مقارنة أداءك الفعلي بتوقعات تحليلك",
    "متابعة مستنداتك الرسمية وحالتها"
  ];

  return (
    <Sheet open={open} onClose={onClose}>
      <div style={{padding:`0 ${sp[5]}px ${sp[8]}px`}}>
        <div style={{textAlign:"center",marginBottom:sp[5]}}>
          <div style={{width:72,height:72,borderRadius:22,background:"linear-gradient(145deg,#FFB800,#FF9500)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto",marginBottom:sp[4]}}>
            <Crown size={34} color="#fff" strokeWidth={2.2}/>
          </div>
          <h2 style={{fontSize:22,fontWeight:800,color:$.L1,marginBottom:sp[2]}}>اشترك في هامور</h2>
          <p style={{fontSize:14,color:$.L3,lineHeight:1.7}}>افتح كل مزايا التطبيق واحصل على حتى 10 تحليلات لكل فترة اشتراك</p>
        </div>

        <div style={{background:$.F5,borderRadius:16,padding:sp[4],marginBottom:sp[5]}}>
          <div style={{fontSize:13,fontWeight:700,color:$.L1,marginBottom:sp[3]}}>مزايا المشترك</div>
          {FEATURES.map((f,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:sp[2]}}>
              <div style={{width:18,height:18,borderRadius:"50%",background:`${$.green}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Check size={11} color={$.green} strokeWidth={3}/>
              </div>
              <span style={{fontSize:13,color:$.L1,fontWeight:600}}>{f}</span>
            </div>
          ))}
          {showAllFeatures && MORE_FEATURES.map((f,i)=>(
            <div key={"more-"+i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:i<MORE_FEATURES.length-1?sp[2]:0}}>
              <div style={{width:18,height:18,borderRadius:"50%",background:`${$.green}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Check size={11} color={$.green} strokeWidth={3}/>
              </div>
              <span style={{fontSize:13,color:$.L1,fontWeight:600}}>{f}</span>
            </div>
          ))}
          <button onClick={()=>setShowAllFeatures(v=>!v)} style={{background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,color:$.blue,padding:0,marginTop:sp[3],display:"flex",alignItems:"center",gap:4}}>
            {showAllFeatures ? "عرض أقل" : "عرض كل المزايا"}
            <ChevronDown size={13} style={{transform:showAllFeatures?"rotate(180deg)":"none",transition:".2s"}}/>
          </button>
        </div>

        <div style={{fontSize:13,fontWeight:700,color:$.L1,marginBottom:sp[3]}}>اختر خطتك</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:sp[3],marginBottom:sp[5]}}>
          <button onClick={()=>setPlan("monthly")} style={{position:"relative",textAlign:"right",padding:sp[4],borderRadius:16,border:`2px solid ${plan==="monthly"?$.orange:$.sepL}`,background:plan==="monthly"?`${$.orange}08`:$.surface,cursor:"pointer",fontFamily:"inherit"}}>
            <div style={{fontSize:13,fontWeight:700,color:$.L2,marginBottom:sp[2]}}>شهري</div>
            <div style={{display:"flex",alignItems:"baseline",gap:4}}>
              <span style={{fontSize:24,fontWeight:800,color:$.L1}}>19.99</span>
              <span style={{fontSize:12,color:$.L3,fontWeight:600}}>ريال</span>
            </div>
            <div style={{fontSize:11,color:$.L4,marginTop:2}}>شهرياً</div>
          </button>
          <button onClick={()=>setPlan("yearly")} style={{position:"relative",textAlign:"right",padding:sp[4],borderRadius:16,border:`2px solid ${plan==="yearly"?$.orange:$.sepL}`,background:plan==="yearly"?`${$.orange}08`:$.surface,cursor:"pointer",fontFamily:"inherit"}}>
            <div style={{position:"absolute",top:-10,left:sp[3],background:$.green,color:"#fff",fontSize:10,fontWeight:800,padding:"3px 8px",borderRadius:8}}>وفّر شهرين</div>
            <div style={{fontSize:13,fontWeight:700,color:$.L2,marginBottom:sp[2]}}>سنوي</div>
            <div style={{display:"flex",alignItems:"baseline",gap:4}}>
              <span style={{fontSize:24,fontWeight:800,color:$.L1}}>199.99</span>
              <span style={{fontSize:12,color:$.L3,fontWeight:600}}>ريال</span>
            </div>
            <div style={{fontSize:11,color:$.L4,marginTop:2}}>≈ 16.66 ريال/شهر</div>
          </button>
        </div>

        <button onClick={startPayment} disabled={payBusy}
          style={{width:"100%",background:payBusy?$.F3:$.blue,color:payBusy?$.L4:"#fff",border:"none",borderRadius:14,padding:`${sp[4]}px`,fontSize:15,fontWeight:800,fontFamily:"inherit",marginBottom:sp[3],cursor:payBusy?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:sp[2],boxShadow:payBusy?"none":`0 6px 20px ${$.blue}44`}}>
          {payBusy ? <><Spinner sz={16}/>جاري التحويل للدفع…</> : <><Crown size={16}/>اشترك الآن — {plan==="monthly"?"19.99":"199.99"} ريال</>}
        </button>

        {payErr && (
          <div style={{background:`${$.orange}12`,border:`1px solid ${$.orange}33`,borderRadius:12,padding:`${sp[3]}px ${sp[4]}px`,marginBottom:sp[3]}}>
            <div style={{fontSize:13,color:$.orange,lineHeight:1.8}}>{payErr}</div>
          </div>
        )}

        <p style={{fontSize:11,color:$.L4,textAlign:"center",marginBottom:sp[3],lineHeight:1.6}}>الدفع بمدى والبطاقات و Apple Pay — آمن ومشفّر</p>
        <p style={{fontSize:11,color:$.L4,textAlign:"center",marginBottom:sp[5],lineHeight:1.7}}>
          بالاشتراك أنت توافق على <a href="/legal" target="_blank" rel="noopener noreferrer" style={{color:$.blue,textDecoration:"none",fontWeight:700}}>الشروط وسياسة الاسترجاع</a>
        </p>

        <div style={{borderTop:`0.5px solid ${$.sepL}`,paddingTop:sp[5]}}>
          {done ? (
            <div style={{textAlign:"center",padding:`${sp[4]}px`}}>
              <div style={{width:56,height:56,borderRadius:"50%",background:`${$.green}18`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto",marginBottom:sp[3]}}>
                <Check size={28} color={$.green}/>
              </div>
              <div style={{fontSize:16,fontWeight:800,color:$.green}}>تم تفعيل اشتراكك!</div>
            </div>
          ) : (
            <>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:sp[3]}}>
                <KeyRound size={15} color={$.blue}/>
                <span style={{fontSize:13,fontWeight:700,color:$.L1}}>عندك كود تفعيل؟</span>
              </div>
              <input value={code} onChange={e=>setCode(e.target.value)} placeholder="أدخل كود التفعيل" autoCapitalize="characters" style={{...iStyle(),direction:"ltr",textAlign:"center",letterSpacing:"1px",fontWeight:700,marginBottom:sp[3]}}/>
              {err && <div style={{marginBottom:sp[3],background:`${$.red}09`,border:`1px solid ${$.red}25`,borderRadius:12,padding:`${sp[3]}px ${sp[4]}px`,fontSize:13,color:$.red}}>{err}</div>}
              <button onClick={activate} disabled={!code.trim()||busy} style={{width:"100%",background:code.trim()&&!busy?$.blue:$.F3,color:code.trim()&&!busy?"#fff":$.L4,border:"none",borderRadius:14,padding:`${sp[4]}px`,fontSize:15,fontWeight:700,cursor:code.trim()&&!busy?"pointer":"not-allowed",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:sp[2]}}>
                {busy?<><Spinner sz={16}/>جاري التفعيل…</>:<>تفعيل الاشتراك</>}
              </button>
            </>
          )}
        </div>
      </div>
    </Sheet>
  );
}

const SECTOR_OPTIONS = [
  "مقاهي","مطاعم","وجبات سريعة","حلويات",
  "تجزئة","أزياء","إلكترونيات","صالونات",
  "خياطة","تعليم","لياقة","تقنية"
];

function AnalyzeForm({onAnalyze, onClose, user, analysesCount, isPremium, onNeedUpgrade}) {
  const [idea,setIdea]=useState("");
  const [details,setDetails]=useState("");
  const [sector,setSector]=useState("");
  const [city,setCity]=useState("الرياض");
  const [neighborhood,setNeighborhood]=useState("");
  const [budget,setBudget]=useState("");
  const [area,setArea]=useState("");
  const [actualRent,setActualRent]=useState("");
  const [staffCount,setStaffCount]=useState("");
  const [shopState,setShopState]=useState("");
  const [experience,setExperience]=useState("");
  const [busy,setBusy]=useState(false);
  const [progress,setProgress]=useState(0);
  const [progressStage,setProgressStage]=useState("");
  const [err,setErr]=useState(null);

  const limit = isPremium ? PREMIUM_ANALYSES : FREE_ANALYSES;
  const reachedLimit = analysesCount >= limit;
  const canGo = idea.trim()&&sector&&budget.trim()&&staffCount&&shopState&&experience&&!busy&&!reachedLimit;

  function handleBudgetChange(e) {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw === "") { setBudget(""); return; }
    setBudget(numWithCommas(parseInt(raw)));
  }

  function handleRentChange(e) {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw === "") { setActualRent(""); return; }
    setActualRent(numWithCommas(parseInt(raw)));
  }

  async function go() {
    if (reachedLimit) { if (!isPremium) { if (onClose) onClose(); onNeedUpgrade(); } return; }
    if (!canGo) return;
    setBusy(true); setErr(null);
    setProgress(0); setProgressStage("جاري البدء…");

    // مراحل التقدم الواقعية - مبنية على وقت الخادم الفعلي
    const stages = [
      { at: 800, p: 8, msg: "تجهيز أسئلة البحث الذكية…" },
      { at: 3000, p: 22, msg: "البحث في السوق السعودي…" },
      { at: 8000, p: 42, msg: "جمع بيانات المنافسين الحقيقيين…" },
      { at: 13000, p: 58, msg: "تحليل التكاليف والأسعار الفعلية…" },
      { at: 18000, p: 72, msg: "بناء التحليل المالي…" },
      { at: 23000, p: 85, msg: "صياغة التوصيات الاستراتيجية…" },
      { at: 28000, p: 93, msg: "اللمسات الأخيرة…" }
    ];
    const timers = stages.map(s => setTimeout(() => {
      setProgress(s.p);
      setProgressStage(s.msg);
    }, s.at));

    try {
      const cleanBudget = budget.replace(/,/g, "");
      const cleanRent = actualRent.replace(/,/g, "");
      const extras = {
        area: area.trim() || null,
        actual_rent: cleanRent || null,
        staff_count: staffCount,
        shop_state: shopState,
        experience: experience
      };
      const fullIdea = details.trim() ? `${idea} - تفاصيل: ${details}` : idea;
      const fullLocation = neighborhood.trim() ? `${city} - حي ${neighborhood}` : city;
      const r = await apiCall("analyze", { idea:fullIdea, sector:sector, city:fullLocation, budget:cleanBudget, extras });
      setProgress(100); setProgressStage("اكتمل التحليل!");
      const analysis = {...r, idea:fullIdea, sector:sector, city:fullLocation, budget:cleanBudget};
      let saved = analysis;
      try {
        if (user) saved = await saveAnalysisCloud(analysis, user.id);
      } catch(e) {}
      onAnalyze(saved);
      if (onClose) onClose();
    } catch(e) { setErr(e.message); }
    finally {
      timers.forEach(t => clearTimeout(t));
      setBusy(false);
      setProgress(0);
      setProgressStage("");
    }
  }

  return (
    <div style={{padding:`${sp[3]}px ${sp[5]}px ${sp[6]}px`}}>
      <div style={{display:"flex",alignItems:"center",gap:sp[3],marginBottom:sp[5]}}>
        <div style={{width:42,height:42,borderRadius:14,background:"linear-gradient(145deg,#007AFF,#0055D4)",display:"flex",alignItems:"center",justifyContent:"center"}}><Sparkles size={20} color="#fff" strokeWidth={2}/></div>
        <div>
          <div style={{fontSize:18,fontWeight:800,color:$.L1}}>حلّل مشروعك</div>
          <div style={{fontSize:12,color:$.L3,marginTop:2}}>تحليل عميق ومفصّل بالذكاء الاصطناعي</div>
        </div>
      </div>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:reachedLimit?`${$.orange}10`:$.F5,borderRadius:12,padding:`${sp[3]}px ${sp[4]}px`,marginBottom:sp[4]}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          {isPremium ? <Crown size={14} color={$.orange}/> : <BarChart2 size={14} color={$.L3}/>}
          <span style={{fontSize:12,fontWeight:600,color:$.L2}}>{isPremium?"اشتراك مفعّل":"الباقة المجانية"}</span>
        </div>
        <span style={{fontSize:12,fontWeight:700,color:isPremium?$.orange:$.L3}}>{analysesCount} من {limit} تحليلات</span>
      </div>

      {reachedLimit && (
        <div style={{background:`${$.orange}10`,border:`1.5px solid ${$.orange}30`,borderRadius:14,padding:`${sp[4]}px`,marginBottom:sp[4],textAlign:"center"}}>
          <Crown size={24} color={$.orange} style={{marginBottom:sp[2]}}/>
          {isPremium ? (
            <>
              <div style={{fontSize:14,fontWeight:700,color:$.L1,marginBottom:sp[1]}}>استخدمت العشر تحليلات المتاحة ضمن اشتراكك الحالي</div>
              <p style={{fontSize:12,color:$.L3,lineHeight:1.6}}>تتجدد مع اشتراكك القادم. تحتاج تحليلات إضافية الآن؟ راسلنا على hamoorservice@gmail.com</p>
            </>
          ) : (
            <>
              <div style={{fontSize:14,fontWeight:700,color:$.L1,marginBottom:sp[1]}}>وصلت للحد المسموح</div>
              <p style={{fontSize:12,color:$.L3,lineHeight:1.6}}>اشترك واحصل على حتى 10 تحليلات لكل فترة اشتراك</p>
            </>
          )}
        </div>
      )}

      <FormField label="فكرة المشروع" icon={<Lightbulb size={14} color={$.L4}/>}>
        <input value={idea} onChange={e=>setIdea(e.target.value)} placeholder="مثال: كوفي مختص" style={iStyle()}/>
      </FormField>
      <FormField label="تفاصيل المشروع (اختياري)" icon={<Sparkles size={14} color={$.L4}/>}>
        <textarea value={details} onChange={e=>setDetails(e.target.value)} placeholder="مثال: كوفي بأجواء يابانية، يقدم قهوة مختصة وحلويات أسيوية" rows={3} style={{...iStyle(),resize:"none",lineHeight:1.5}}/>
      </FormField>
      <FormField label="نوع القطاع" icon={<Layers size={14} color={$.L4}/>}>
        <div style={{position:"relative"}}>
          <select value={sector} onChange={e=>setSector(e.target.value)} style={{...iStyle(),paddingLeft:sp[8],cursor:"pointer",color:sector?$.L1:$.L4}}>
            <option value="" disabled>اختر القطاع المناسب لمشروعك</option>
            {SECTOR_OPTIONS.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={13} color={$.L4} style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
        </div>
      </FormField>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:sp[3]}}>
        <FormField label="المدينة" icon={<MapPin size={14} color={$.L4}/>}>
          <div style={{position:"relative"}}>
            <select value={city} onChange={e=>setCity(e.target.value)} style={{...iStyle(),paddingLeft:sp[8],cursor:"pointer"}}>{CITIES.map(c=><option key={c}>{c}</option>)}</select>
            <ChevronDown size={13} color={$.L4} style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
          </div>
        </FormField>
        <FormField label="الحي (اختياري)" icon={<MapPin size={14} color={$.L4}/>}>
          <input value={neighborhood} onChange={e=>setNeighborhood(e.target.value)} placeholder="مثال: العليا" style={iStyle()}/>
        </FormField>
      </div>
      <FormField label="الميزانية بالريال السعودي" icon={<Briefcase size={14} color={$.L4}/>}>
        <div style={{position:"relative"}}>
          <input value={budget} onChange={handleBudgetChange} placeholder="150,000" inputMode="numeric" style={{...iStyle(),paddingLeft:sp[10],fontSize:17,fontWeight:600,direction:"ltr",textAlign:"right"}}/>
          <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",fontSize:18,fontWeight:700,color:$.L3}}>﷼</div>
        </div>
      </FormField>

      <div style={{height:1,background:$.sepL,margin:`${sp[4]}px 0`}}/>
      <div style={{fontSize:12,fontWeight:700,color:$.L3,marginBottom:sp[3]}}>معلومات تزيد دقّة التحليل</div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:sp[3]}}>
        <FormField label="مساحة المحل (م²) — اختياري" icon={<Layers size={14} color={$.L4}/>}>
          <input value={area} onChange={e=>setArea(e.target.value.replace(/\D/g,""))} placeholder="مثال: 80" inputMode="numeric" style={iStyle()}/>
        </FormField>
        <FormField label="الإيجار السنوي الفعلي — اختياري" icon={<Briefcase size={14} color={$.L4}/>}>
          <input value={actualRent} onChange={handleRentChange} placeholder="مثال: 90,000" inputMode="numeric" style={{...iStyle(),direction:"ltr",textAlign:"right"}}/>
        </FormField>
      </div>

      <FormField label="عدد الموظفين المتوقع" icon={<Users size={14} color={$.L4}/>}>
        <div style={{position:"relative"}}>
          <select value={staffCount} onChange={e=>setStaffCount(e.target.value)} style={{...iStyle(),paddingLeft:sp[8],cursor:"pointer",color:staffCount?$.L1:$.L4}}>
            <option value="" disabled>اختر العدد</option>
            <option value="1-2">1-2 موظفين</option>
            <option value="3-5">3-5 موظفين</option>
            <option value="6-10">6-10 موظفين</option>
            <option value="أكثر من 10">أكثر من 10</option>
          </select>
          <ChevronDown size={13} color={$.L4} style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
        </div>
      </FormField>

      <FormField label="حالة المحل" icon={<Building2 size={14} color={$.L4}/>}>
        <div style={{position:"relative"}}>
          <select value={shopState} onChange={e=>setShopState(e.target.value)} style={{...iStyle(),paddingLeft:sp[8],cursor:"pointer",color:shopState?$.L1:$.L4}}>
            <option value="" disabled>اختر حالة المحل</option>
            <option value="جاهز ومجهّز بالكامل">جاهز ومجهّز بالكامل</option>
            <option value="يحتاج تجهيز بسيط">يحتاج تجهيز بسيط</option>
            <option value="يحتاج تشطيب وتجهيز كامل">يحتاج تشطيب وتجهيز كامل</option>
            <option value="لم أحدد المحل بعد">لم أحدد المحل بعد</option>
          </select>
          <ChevronDown size={13} color={$.L4} style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
        </div>
      </FormField>

      <FormField label="خبرتك في هذا المجال" icon={<Award size={14} color={$.L4}/>}>
        <div style={{position:"relative"}}>
          <select value={experience} onChange={e=>setExperience(e.target.value)} style={{...iStyle(),paddingLeft:sp[8],cursor:"pointer",color:experience?$.L1:$.L4}}>
            <option value="" disabled>اختر مستوى خبرتك</option>
            <option value="بدون خبرة سابقة">بدون خبرة سابقة</option>
            <option value="خبرة بسيطة">خبرة بسيطة (أقل من سنتين)</option>
            <option value="خبرة متوسطة">خبرة متوسطة (2-5 سنوات)</option>
            <option value="خبرة كبيرة">خبرة كبيرة (أكثر من 5 سنوات)</option>
          </select>
          <ChevronDown size={13} color={$.L4} style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
        </div>
      </FormField>
      {err && <div style={{marginTop:sp[3],background:`${$.red}09`,border:`1px solid ${$.red}25`,borderRadius:12,padding:`${sp[3]}px ${sp[4]}px`,fontSize:13,color:$.red,lineHeight:1.6}}>{err}</div>}
      {busy && (
        <div style={{marginTop:sp[5],borderRadius:20,padding:`${sp[6]}px ${sp[5]}px ${sp[5]}px`,background:$.surface,border:`1px solid ${$.sepL}`,boxShadow:SH.card}}>
          <div style={{display:"flex",alignItems:"center",gap:sp[3],marginBottom:sp[5]}}>
            <div style={{width:42,height:42,borderRadius:12,background:`${$.blue}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Spinner sz={20} clr={$.blue}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:16,fontWeight:800,color:$.L1,fontFamily:"inherit"}}>جاري تحليل مشروعك</div>
              <div style={{fontSize:12.5,color:$.L3,marginTop:2,minHeight:18,fontFamily:"inherit"}}>{progressStage || "جاري البدء…"}</div>
            </div>
            <div style={{fontSize:28,fontWeight:800,color:$.blue,letterSpacing:"-0.5px",fontFamily:"inherit"}}>{progress}%</div>
          </div>

          <div style={{position:"relative",height:12,borderRadius:6,overflow:"hidden",background:$.F3}}>
            <div style={{position:"absolute",top:0,right:0,bottom:0,width:`${progress}%`,borderRadius:6,background:`linear-gradient(90deg, ${$.blue}, ${$.teal})`,transition:"width 1s cubic-bezier(0.4, 0, 0.2, 1)",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%)",backgroundSize:"200% 100%",animation:"hamourShimmer 2.5s linear infinite"}}/>
            </div>
          </div>

          <div style={{textAlign:"center",fontSize:11.5,color:$.L3,marginTop:sp[4],fontFamily:"inherit"}}>
            بحث حقيقي · تحليل ذكي · بيانات حية
          </div>

          <style>{`
            @keyframes hamourShimmer {
              from { background-position: 200% 0; }
              to { background-position: -100% 0; }
            }
          `}</style>
        </div>
      )}
      <button onClick={go} disabled={busy||(reachedLimit&&isPremium)||(!reachedLimit&&!canGo)} style={{marginTop:sp[5],width:"100%",background:reachedLimit?(isPremium?$.F3:"linear-gradient(150deg,#FFB800,#FF9500)"):(canGo?"linear-gradient(150deg,#1A7AFF,#007AFF,#005FCC)":$.F3),color:(reachedLimit&&isPremium)?$.L4:((reachedLimit||canGo)?"#fff":$.L4),border:"none",borderRadius:14,padding:`${sp[4]}px`,fontSize:16,fontWeight:700,cursor:(busy||(reachedLimit&&isPremium)||(!reachedLimit&&!canGo))?"not-allowed":"pointer",fontFamily:"inherit",boxShadow:(reachedLimit&&!isPremium||canGo)?SH.blue:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:sp[2]}}>
        {busy?<><Spinner sz={17}/>جاري التحليل العميق…</>:reachedLimit?(isPremium?<>استخدمت حد اشتراكك</>:<><Crown size={16} strokeWidth={2.2}/>اشترك للمتابعة</>):<><Zap size={16} strokeWidth={2.2}/>حلّل المشروع</>}
      </button>
      <div style={{height:sp[8]}}/>
    </div>
  );
}
function HomeScreen({onAnalyze, onViewLast, onViewSaved, onGoSectors, onGoLearning, onGoSuggestions, user, analyses, usageCount, premiumUsageCount, isPremium, onNeedUpgrade}) {
  const screen = useScreenSize();
  const [showForm, setShowForm] = useState(false);

  const totalAnalyses = analyses.length;
  const positiveCount = analyses.filter(a => a.decision_type === "positive").length;
  const successRate = totalAnalyses > 0 ? Math.round((positiveCount / totalAnalyses) * 100) : 0;
  const featuredArticles = ARTICLES.slice(0, 3);
  const limit = isPremium ? PREMIUM_ANALYSES : FREE_ANALYSES;

  function getCategoryInfo(catId) {
    return ARTICLE_CATEGORIES.find(c => c.id === catId) || {name:"عام", color:$.blue, gradient:"linear-gradient(145deg,#007AFF,#0050C0)", iconName:"BookOpen"};
  }

  const containerStyle = screen.isDesktop ? {maxWidth:1200, margin:"0 auto"} : screen.isTablet ? {maxWidth:900, margin:"0 auto"} : {};

  return (
    <div>
      <div style={{position:"relative",overflow:"hidden",background:$.hdrBlue,padding:screen.isDesktop?`${sp[14]}px ${sp[10]}px ${sp[12]}px`:`${sp[14]}px ${sp[5]}px ${sp[10]}px`,borderRadius:"0 0 36px 36px"}}>
        <MeshBg mode="white" opacity={0.42}/>
        <div style={{...containerStyle,position:"relative"}}>
          <div style={{position:"absolute",top:-120,left:-120,width:340,height:340,borderRadius:"50%",background:"rgba(255,255,255,0.06)"}}/>
          <div style={{position:"relative"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:sp[3]}}>
              <div style={{display:"flex",alignItems:"center",gap:sp[2]}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:$.green,boxShadow:`0 0 12px ${$.green}`}}/>
                <span style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.85)"}}>جاهز للتحليل</span>
              </div>
              {isPremium && <div style={{display:"flex",alignItems:"center",gap:5,background:"rgba(255,184,0,0.22)",borderRadius:99,padding:"4px 10px"}}>
                <Crown size={12} color="#FFD60A"/>
                <span style={{fontSize:11,fontWeight:700,color:"#FFD60A"}}>مشترك</span>
              </div>}
            </div>
            <h1 style={{fontSize:screen.isDesktop?52:screen.isTablet?44:38,fontWeight:800,color:"#fff",letterSpacing:"-1.4px",lineHeight:1.08,marginBottom:sp[2]}}>هامور</h1>
            <p style={{fontSize:screen.isDesktop?17:14,color:"rgba(255,255,255,0.75)",lineHeight:1.6,maxWidth:screen.isDesktop?480:280,marginBottom:sp[5]}}>دراسة جدوى ذكية ومفصّلة للسوق السعودي مدعومة بالذكاء الاصطناعي</p>
            <div style={{display:"flex",gap:sp[2],flexWrap:"wrap"}}>
              <div style={{background:"rgba(255,255,255,0.15)",borderRadius:99,padding:`${sp[2]}px ${sp[3]}px`,display:"flex",alignItems:"center",gap:5}}>
                <BarChart2 size={12} color="#fff"/><span style={{fontSize:11,fontWeight:700,color:"#fff"}}>{totalAnalyses} تحليل</span>
              </div>
              <div style={{background:"rgba(255,255,255,0.15)",borderRadius:99,padding:`${sp[2]}px ${sp[3]}px`,display:"flex",alignItems:"center",gap:5}}>
                <Layers size={12} color="#fff"/><span style={{fontSize:11,fontWeight:700,color:"#fff"}}>12 قطاع</span>
              </div>
              <div style={{background:"rgba(255,255,255,0.15)",borderRadius:99,padding:`${sp[2]}px ${sp[3]}px`,display:"flex",alignItems:"center",gap:5}}>
                <MapPin size={12} color="#fff"/><span style={{fontSize:11,fontWeight:700,color:"#fff"}}>{CITIES.length} مدينة</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{padding:screen.isDesktop?`${sp[6]}px ${sp[10]}px ${sp[16]}px`:`${sp[4]}px ${sp[5]}px ${sp[10]}px`,marginTop:-sp[5]}}>
        <div style={containerStyle}>
          <Card onClick={()=>setShowForm(true)} style={{cursor:"pointer",boxShadow:SH.lift,marginBottom:sp[5],border:`1.5px solid ${$.blue}15`}}>
            <div style={{padding:screen.isDesktop?`${sp[6]}px ${sp[7]}px`:`${sp[5]}px`,display:"flex",alignItems:"center",gap:sp[4]}}>
              <div style={{width:screen.isDesktop?72:56,height:screen.isDesktop?72:56,borderRadius:18,background:"linear-gradient(145deg,#007AFF,#0050C0)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:SH.blue,flexShrink:0}}>
                <Sparkles size={screen.isDesktop?32:26} color="#fff" strokeWidth={2}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:screen.isDesktop?22:18,fontWeight:800,color:$.L1,letterSpacing:"-0.4px",marginBottom:4}}>حلّل مشروعك الآن</div>
                <p style={{fontSize:screen.isDesktop?14:12,color:$.L3,lineHeight:1.5}}>تحليل مفصّل بالذكاء الاصطناعي في 30 ثانية</p>
              </div>
              <div style={{width:44,height:44,borderRadius:14,background:$.blue,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:SH.blue}}>
                <ArrowRight size={20} color="#fff" strokeWidth={2.5} style={{transform:"scaleX(-1)"}}/>
              </div>
            </div>
          </Card>

          {totalAnalyses > 0 && (
            <div style={{display:"grid",gridTemplateColumns:screen.isMobile?"1fr 1fr":"1fr 1fr 1fr 1fr",gap:sp[3],marginBottom:sp[6]}}>
              <Card style={{padding:sp[4]}}>
                <IconBadge Icon={Archive} color={$.purple} size={36}/>
                <div style={{fontSize:24,fontWeight:800,color:$.L1,marginTop:sp[2]}}>{totalAnalyses}</div>
                <div style={{fontSize:11,color:$.L3,marginTop:2,fontWeight:600}}>تحليل محفوظ</div>
              </Card>
              <Card style={{padding:sp[4]}}>
                <IconBadge Icon={CheckCircle} color={$.green} size={36}/>
                <div style={{fontSize:24,fontWeight:800,color:$.green,marginTop:sp[2]}}>{successRate}%</div>
                <div style={{fontSize:11,color:$.L3,marginTop:2,fontWeight:600}}>معدل النجاح</div>
              </Card>
              <Card style={{padding:sp[4]}}>
                <IconBadge Icon={Flame} color={$.orange} size={36}/>
                <div style={{fontSize:24,fontWeight:800,color:$.orange,marginTop:sp[2]}}>{positiveCount}</div>
                <div style={{fontSize:11,color:$.L3,marginTop:2,fontWeight:600}}>مشروع واعد</div>
              </Card>
              <Card style={{padding:sp[4]}}>
                <IconBadge Icon={Clock} color={$.blue} size={36}/>
                <div style={{fontSize:13,fontWeight:800,color:$.L1,marginTop:sp[2],lineHeight:1.3}}>{analyses[0] ? formatDate(analyses[0].savedAt) : "-"}</div>
                <div style={{fontSize:11,color:$.L3,marginTop:2,fontWeight:600}}>آخر تحليل</div>
              </Card>
            </div>
          )}

          {!isPremium && (
            <Card onClick={onNeedUpgrade} style={{cursor:"pointer",marginBottom:sp[6],background:"linear-gradient(135deg,#FFB800,#FF9500)",border:"none"}}>
              <div style={{padding:`${sp[4]}px ${sp[5]}px`,display:"flex",alignItems:"center",gap:sp[3]}}>
                <div style={{width:44,height:44,borderRadius:14,background:"rgba(255,255,255,0.25)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <Crown size={22} color="#fff"/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:15,fontWeight:800,color:"#fff",marginBottom:2}}>اشترك في هامور</div>
                  <p style={{fontSize:12,color:"rgba(255,255,255,0.9)"}}>حتى 10 تحليلات + كل المقالات مفتوحة</p>
                </div>
                <ChevronRight size={20} color="#fff" style={{transform:"scaleX(-1)"}}/>
              </div>
            </Card>
          )}

          {analyses.length > 0 && (
            <div style={{marginBottom:sp[6]}}>
              <SectionLabel action={<button onClick={onViewSaved} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,fontWeight:600,color:$.blue,fontFamily:"inherit",display:"flex",alignItems:"center",gap:3}}><span>عرض الكل</span><ChevronRight size={14}/></button>}>آخر تحليلاتك</SectionLabel>
              <div style={{display:"flex",gap:sp[3],overflowX:"auto",paddingBottom:sp[2]}}>
                {analyses.slice(0,5).map(a => {
                  const pos = a.decision_type === "positive";
                  const color = pos ? $.green : $.red;
                  return (
                    <Card key={a.id} onClick={()=>onViewLast(a)} style={{flex:"none",width:260,padding:sp[4],cursor:"pointer"}}>
                      <div style={{display:"flex",alignItems:"center",gap:sp[3],marginBottom:sp[3]}}>
                        <ScoreRing value={a.score} size={52} track={5} color={color} noAnim/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:14,fontWeight:700,color:$.L1,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.idea}</div>
                          <div style={{fontSize:11,color:$.L3,display:"flex",alignItems:"center",gap:3}}><MapPin size={10}/><span>{a.city}</span></div>
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:sp[2],borderTop:`0.5px solid ${$.sepL}`}}>
                        <Chip text={pos?"واعد":"متعثر"} color={color} bg={`${color}15`} size={10}/>
                        <div style={{fontSize:10,color:$.L4,display:"flex",alignItems:"center",gap:3}}><Clock size={9}/>{formatDate(a.savedAt)}</div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{marginBottom:sp[6]}}>
            <SectionLabel action={<button onClick={onGoSectors} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,fontWeight:600,color:$.blue,fontFamily:"inherit",display:"flex",alignItems:"center",gap:3}}><span>عرض الكل</span><ChevronRight size={14}/></button>}>قطاعات مميزة</SectionLabel>
            <div style={{display:"grid",gridTemplateColumns:screen.isDesktop?"1fr 1fr 1fr 1fr":screen.isTablet?"1fr 1fr 1fr 1fr":"1fr 1fr",gap:sp[3]}}>
              {FEATURED_SECTORS.map(s => (
                <Card key={s.id} onClick={onGoSectors} style={{padding:sp[4],cursor:"pointer"}}>
                  <IconBadge Icon={s.Icon} color={s.color} size={44}/>
                  <div style={{fontSize:13,fontWeight:700,color:$.L1,marginTop:sp[3],marginBottom:6,lineHeight:1.3}}>{s.name}</div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <Chip text={s.growth} color={$.green} bg={`${$.green}15`} size={10}/>
                    <div style={{fontSize:15,fontWeight:800,color:s.color}}>{s.score}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div style={{marginBottom:sp[6]}}>
            <Card onClick={onGoSuggestions} style={{padding:sp[5],cursor:"pointer",background:"linear-gradient(135deg,#AF52DE,#7830B0)",border:"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:sp[4]}}>
                <div style={{width:52,height:52,borderRadius:16,background:"rgba(255,255,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <Lightbulb size={26} color="#fff" strokeWidth={2.2}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                    <span style={{fontSize:16,fontWeight:800,color:"#fff"}}>محتار وش تستثمر؟</span>
                    <Crown size={14} color="#FFD60A"/>
                  </div>
                  <p style={{fontSize:12.5,color:"rgba(255,255,255,0.85)",lineHeight:1.6}}>أدخل ميزانيتك واحصل على مشاريع واقعية تناسبك مدروسة حسب السوق السعودي</p>
                </div>
                <ChevronRight size={20} color="rgba(255,255,255,0.7)" style={{flexShrink:0}}/>
              </div>
            </Card>
          </div>

          <div style={{marginBottom:sp[5]}}>
            <SectionLabel action={<button onClick={onGoLearning} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,fontWeight:600,color:$.blue,fontFamily:"inherit",display:"flex",alignItems:"center",gap:3}}><span>عرض الكل</span><ChevronRight size={14}/></button>}>مقالات مختارة</SectionLabel>
            <div style={{display:"grid",gridTemplateColumns:screen.isDesktop?"1fr 1fr 1fr":screen.isTablet?"1fr 1fr":"1fr",gap:sp[3]}}>
              {featuredArticles.map(article => {
                const catInfo = getCategoryInfo(article.category);
                const CatIcon = CATEGORY_ICONS[catInfo.iconName] || BookOpen;
                return (
                  <Card key={article.id} onClick={onGoLearning} style={{padding:sp[4],cursor:"pointer"}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:sp[3]}}>
                      <div style={{width:54,height:54,borderRadius:14,background:catInfo.gradient,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:`0 4px 12px ${catInfo.color}33`}}>
                        <CatIcon size={26} color="#ffffff" strokeWidth={2.4} absoluteStrokeWidth/>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:700,color:$.L1,lineHeight:1.4,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{article.title}</div>
                        <Chip text={catInfo.name} color={catInfo.color} bg={`${catInfo.color}15`} size={10}/>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Sheet open={showForm} onClose={()=>setShowForm(false)}>
        <AnalyzeForm onAnalyze={onAnalyze} onClose={()=>setShowForm(false)} user={user} analysesCount={isPremium?premiumUsageCount:usageCount} isPremium={isPremium} onNeedUpgrade={onNeedUpgrade}/>
      </Sheet>
    </div>
  );
}

const TABS=["نظرة عامة","تحليل السوق","التحليل المالي","المخاطر والتحديات","الخطة والتسعير"];
const LOCKED_TABS = [3,4]; // المخاطر والتحديات، الخطة والتسعير — للمشتركين فقط

function LockedTabCard({title, onNeedUpgrade, screen}) {
  return (
    <div style={{gridColumn:screen?.isDesktop?"span 2":"auto", padding:`${sp[10]}px ${sp[5]}px`, textAlign:"center", background:$.F5, borderRadius:20}}>
      <Crown size={28} color={$.orange} style={{marginBottom:sp[3]}}/>
      <div style={{fontSize:15,fontWeight:800,color:$.L1,marginBottom:sp[2]}}>{title} متاح للمشتركين</div>
      <p style={{fontSize:13,color:$.L3,lineHeight:1.7,marginBottom:sp[4],maxWidth:340,margin:"0 auto"}}>اشترك لتشوف التفاصيل الكاملة وتحصل على خطة تنفيذية جاهزة لمشروعك</p>
      <button onClick={onNeedUpgrade} style={{background:"linear-gradient(150deg,#FFB800,#FF9500)",color:"#fff",border:"none",borderRadius:12,padding:`${sp[3]}px ${sp[6]}px`,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:sp[3]}}>اشترك الآن</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// المستشار — مرآة تعكس وضع العميل من بياناته هو، ويديرها هو بالكامل
// ═══════════════════════════════════════════════════════════

const numFont = {fontFamily:APP_FONT, fontVariantNumeric:"tabular-nums"};
const AD_SHADOW_SM = "0 1px 2px rgba(11,19,32,0.04), 0 6px 14px -6px rgba(11,19,32,0.08)";
const AD_SHADOW = "0 1px 2px rgba(11,19,32,0.04), 0 14px 32px -14px rgba(11,19,32,0.12)";

const ADVISOR_SECTIONS = [
  {id:"overview", name:"نظرة عامة", Icon:Grid},
  {id:"finance", name:"المالية", Icon:TrendingUp},
  {id:"progress", name:"خططي", Icon:CheckCircle},
  {id:"team", name:"الفريق", Icon:Users},
  {id:"metrics", name:"مؤشراتي", Icon:Target},
  {id:"compare", name:"المقارنات", Icon:BarChart2},
  {id:"docs", name:"المستندات", Icon:FileText},
  {id:"chat", name:"المستشار", Icon:Sparkles},
  {id:"log", name:"السجل", Icon:Clock}
];

function AdvisorHeader({result, healthScore}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:sp[3],marginBottom:sp[4],flexWrap:"wrap"}}>
      <div style={{display:"flex",alignItems:"center",gap:sp[2],flex:1,minWidth:0}}>
        <div style={{width:28,height:28,borderRadius:9,border:`1.3px solid ${$.blue}55`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <Sparkles size={13} color={$.blue}/>
        </div>
        <div style={{minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,color:$.L1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{result?.idea || "مشروعك"}</div>
          <div style={{fontSize:9.5,color:$.L4,fontWeight:300}}>{result?.city || ""}</div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:99,background:$.surface,boxShadow:AD_SHADOW_SM,fontSize:10.5,color:$.L3,flexShrink:0}}>
        <span style={{width:5,height:5,borderRadius:"50%",background:$.green,animation:"advPulse 2.4s infinite"}}/>
        وضعك العام <b style={{...numFont,color:$.blue,fontWeight:600}}>{healthScore}</b>
      </div>
      <style>{`@keyframes advPulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}

function AdvisorIsland({active, onChange}) {
  return (
    <div style={{display:"flex",justifyContent:"center",marginBottom:sp[4]}}>
      <div style={{display:"flex",gap:2,background:$.surface,borderRadius:99,padding:4,boxShadow:AD_SHADOW_SM,overflowX:"auto",maxWidth:"100%"}}>
        {ADVISOR_SECTIONS.map(s => {
          const on = active === s.id;
          return (
            <button key={s.id} onClick={()=>onChange(s.id)} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 15px",borderRadius:99,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:11.5,fontWeight:on?600:400,whiteSpace:"nowrap",flexShrink:0,background:on?$.blue:"transparent",color:on?"#fff":$.L4,transition:".2s"}}>
              <s.Icon size={13.5} strokeWidth={1.8} style={{opacity:on?1:0.75}}/>{s.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function fmtDate(d) { try { return new Date(d).toISOString().split("T")[0]; } catch(e) { return d; } }
function todayStr() { return new Date().toISOString().split("T")[0]; }

// تنبيه صغير عابر — يؤكد إن الحفظ صار فعلاً (يخفف إحساس الضياع)
function useSavedFlash() {
  const [flash, setFlash] = useState(false);
  const fire = () => { setFlash(true); setTimeout(()=>setFlash(false), 1600); };
  return [flash, fire];
}
function SavedBadge({show}) {
  if (!show) return null;
  return <span style={{fontSize:10.5,color:$.green,fontWeight:600,display:"inline-flex",alignItems:"center",gap:4}}><Check size={12}/>تم الحفظ</span>;
}

function daysAgoISO(n) { const d = new Date(Date.now() - n*24*60*60*1000); return d.toISOString().split("T")[0]; }

// ═══════════ مشروع تجريبي — بيانات وهمية للتعليم قبل الاشتراك ═══════════
const DEMO_RESULT = {
  id: "demo",
  idea: "كوفي مختص - حي الشاطئ",
  city: "جدة",
  budget: "180000",
  score: 78,
  decision: "فرصة واعدة بمخاطر متوسطة",
  decision_type: "positive",
  savedAt: new Date(Date.now() - 75*24*60*60*1000).toISOString(),
  financial_analysis: {
    setup_costs: { total: 150000, rent_deposit:30000, renovation:35000, equipment:50000, licenses:8000, initial_inventory:12000, marketing_launch:10000, working_capital:5000 },
    monthly_costs: { total: 42000, rent:10000, salaries:20000, utilities:3000, materials:6000, marketing:2000, maintenance:1000, other:0 },
    revenue_projection: { month_1: 18000, month_3: 32000, month_6: 45000, month_12: 58000, year_2_monthly: 68000, year_3_monthly: 75000 },
    break_even_months: "9",
    salary_breakdown: [ {role:"باريستا", count:2, monthly_each:5500}, {role:"مشرف مناوبة", count:1, monthly_each:6000} ]
  },
  action_plan: [
    {phase:"المرحلة 1", title:"التأسيس", tasks:["استخراج السجل التجاري","توقيع عقد الإيجار","تصميم الديكور الداخلي"]},
    {phase:"المرحلة 2", title:"التجهيز", tasks:["شراء المعدات","توظيف الباريستا","تجربة قائمة المشروبات"]},
    {phase:"المرحلة 3", title:"الإطلاق", tasks:["حملة تسويق الافتتاح","تفعيل التوصيل","جمع أول تقييمات العملاء"]}
  ],
  risk_analysis: [
    {risk:"منافسة مقاهي مجاورة", probability:"عالي", impact:"متوسط", mitigation:"تميّز في نوع القهوة والتجربة الداخلية"},
    {risk:"تقلب تكلفة حبوب القهوة", probability:"متوسط", impact:"متوسط", mitigation:"عقد توريد سنوي بسعر ثابت"}
  ]
};
const DEMO_FINANCE_ENTRIES = [
  {id:"demo-f1", revenue:14000, expenses:9000, profit:5000, cash_balance:35000, note:"الشهر الأول", entry_date: daysAgoISO(70)},
  {id:"demo-f2", revenue:19500, expenses:11000, profit:8500, cash_balance:43000, note:"", entry_date: daysAgoISO(45)},
  {id:"demo-f3", revenue:26000, expenses:13500, profit:12500, cash_balance:56000, note:"عرض رمضان", entry_date: daysAgoISO(20)},
  {id:"demo-f4", revenue:29500, expenses:14000, profit:15500, cash_balance:71500, note:"", entry_date: daysAgoISO(3)}
];
const DEMO_METRICS = [
  { id:"demo-m1", name:"عدد الزبائن اليومي", unit:"زبون", show_chart:true, entries:[
    {id:"demo-m1-e1", value:35, entry_date:daysAgoISO(60)},
    {id:"demo-m1-e2", value:52, entry_date:daysAgoISO(30)},
    {id:"demo-m1-e3", value:68, entry_date:daysAgoISO(5)}
  ]},
  { id:"demo-m2", name:"متابعين انستقرام", unit:"متابع", show_chart:false, entries:[
    {id:"demo-m2-e1", value:800, entry_date:daysAgoISO(60)},
    {id:"demo-m2-e2", value:2100, entry_date:daysAgoISO(5)}
  ]}
];
const DEMO_DOCS = [
  {id:"demo-d1", name:"السجل التجاري", status:"uploaded", created_at:daysAgoISO(70)},
  {id:"demo-d2", name:"رخصة البلدية", status:"pending", created_at:daysAgoISO(50)},
  {id:"demo-d3", name:"عقد الإيجار", status:"required", created_at:daysAgoISO(70)}
];
const DEMO_PLAN_ITEMS = [
  {id:"demo-p1", plan_name:"خطة التسويق", task_text:"تصوير محتوى لإنستقرام", done:true},
  {id:"demo-p2", plan_name:"خطة التسويق", task_text:"التعاون مع مؤثر محلي", done:false}
];
const DEMO_DONE_TASKS = [ {phase_index:0, task_index:0}, {phase_index:0, task_index:1} ];
const DEMO_TEAM = [
  {id:"demo-t1", name:"سعود العتيبي", role:"باريستا", phone:"0501234567", monthly_pay:5500, start_date:daysAgoISO(60), notes:"دوام كامل"},
  {id:"demo-t2", name:"فهد القحطاني", role:"مشرف مناوبة", phone:"0559876543", monthly_pay:6000, start_date:daysAgoISO(40), notes:""}
];

const TOUR_STEPS = [
  {section:"overview", title:"نظرة عامة", text:"هذي لوحتك الرئيسية — تشوف فيها وضعك المالي والتقدم والمخاطر بنظرة واحدة، وأرقامك الحقيقية تنعكس هنا تلقائياً."},
  {section:"finance", title:"المالية", text:"سجّل هنا إيرادك ومصروفك الفعلي كل ما تحصل رقم جديد. عدّل أو احذف أي إدخال في أي وقت."},
  {section:"progress", title:"خططي", text:"تابع خطة التنفيذ اللي طلعها تحليلك، أو أنشئ خططك الخاصة وأضف مهامك عليها."},
  {section:"team", title:"الفريق", text:"سجّل من يشتغل معك — الاسم، الدور، الراتب، وتاريخ الانضمام."},
  {section:"metrics", title:"مؤشراتي", text:"أضف أي مؤشر يهمك (زيارات، طلبات، عملاء جدد) وتابعه عبر الزمن، واختر تظهره كرسم في نظرتك العامة."},
  {section:"compare", title:"المقارنات", text:"شوف كيف أداءك الفعلي يقارن بتوقعات تحليلك الأصلي — هل أنت متقدم أو متأخر عن الخطة."},
  {section:"docs", title:"المستندات", text:"تابع حالة أوراقك الرسمية — من مطلوب لسا لين المكتمل."},
  {section:"chat", title:"المستشار", text:"اسأل المستشار أي سؤال عن أرقامك أو خطوتك القادمة، ويرد عليك بناءً على بياناتك الفعلية."}
];

function AdvisorTour({onNavigate, onFinish}) {
  const [step, setStep] = useState(0);
  const s = TOUR_STEPS[step];
  useEffect(()=>{ onNavigate(s.section); }, [step]);
  return (
    <div style={{position:"fixed", inset:0, zIndex:3000, display:"flex", alignItems:"flex-end", justifyContent:"center", pointerEvents:"none"}}>
      <div onClick={onFinish} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.35)",pointerEvents:"auto"}}/>
      <div style={{position:"relative",pointerEvents:"auto", background:$.surface, borderRadius:"20px 20px 0 0", maxWidth:520, width:"100%", padding:`${sp[5]}px ${sp[5]}px ${sp[7]}px`, boxShadow:"0 -8px 32px rgba(0,0,0,0.25)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:sp[3]}}>
          <Chip text={`${step+1} / ${TOUR_STEPS.length}`} color={$.blue} bg={`${$.blue}15`}/>
          <button onClick={onFinish} style={{background:"none",border:"none",color:$.L4,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>تخطي</button>
        </div>
        <div style={{fontSize:16,fontWeight:800,color:$.L1,marginBottom:sp[2]}}>{s.title}</div>
        <p style={{fontSize:13,color:$.L2,lineHeight:1.8,marginBottom:sp[5]}}>{s.text}</p>
        <div style={{display:"flex",gap:sp[2]}}>
          {step>0 && <button onClick={()=>setStep(st=>st-1)} style={{flex:1,background:$.F4,color:$.L2,border:"none",borderRadius:12,padding:sp[3],fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>السابق</button>}
          <button onClick={()=> step<TOUR_STEPS.length-1 ? setStep(st=>st+1) : onFinish()} style={{flex:2,background:$.blue,color:"#fff",border:"none",borderRadius:12,padding:sp[3],fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{step<TOUR_STEPS.length-1?"التالي":"ابدأ الاستكشاف"}</button>
        </div>
      </div>
    </div>
  );
}

function AdvisorDashboard({result, user, isDemo, onNeedUpgrade}) {
  const [section, setSection] = useState("overview");
  const [entries, setEntries] = useState(isDemo ? DEMO_FINANCE_ENTRIES : []);
  const [doneTasks, setDoneTasks] = useState(isDemo ? DEMO_DONE_TASKS : []);
  const [metrics, setMetrics] = useState(isDemo ? DEMO_METRICS : []);
  const [documents, setDocuments] = useState(isDemo ? DEMO_DOCS : []);
  const [planItems, setPlanItems] = useState(isDemo ? DEMO_PLAN_ITEMS : []);
  const [messages, setMessages] = useState([]);
  const [team, setTeam] = useState(isDemo ? DEMO_TEAM : []);
  const [loading, setLoading] = useState(!isDemo);
  const [showTour, setShowTour] = useState(!!isDemo);

  const analysisId = result?.id;
  const fa = result?.financial_analysis || {};
  const setupTotal = fa.setup_costs?.total || 0;
  const monthlyTotal = fa.monthly_costs?.total || 0;
  const budget = parseFloat(result?.budget) || 0;

  useEffect(() => {
    if (isDemo) { setLoading(false); return; }
    if (!analysisId) { setLoading(false); return; }
    (async () => {
      try {
        const [e, t, m, d, p, msg, tm] = await Promise.all([
          getFinanceEntries(analysisId), getDoneTasks(analysisId), getMetrics(analysisId),
          getDocuments(analysisId), getPlanItems(analysisId), getAdvisorMessages(analysisId),
          getTeamMembers(analysisId)
        ]);
        setEntries(e); setDoneTasks(t); setMetrics(m); setDocuments(d); setPlanItems(p); setMessages(msg); setTeam(tm);
      } catch(err) {} finally { setLoading(false); }
    })();
  }, [analysisId, isDemo]);

  const sortedEntries = [...entries].sort((a,b)=>new Date(a.entry_date)-new Date(b.entry_date));
  const latest = sortedEntries[sortedEntries.length-1];
  const prevEntry = sortedEntries[sortedEntries.length-2];
  const totalSpent = entries.reduce((s,e)=>s+(e.expenses||0),0);
  const totalRevenue = entries.reduce((s,e)=>s+(e.revenue||0),0);
  const totalProfit = entries.reduce((s,e)=>s+(e.profit||0),0);
  const budgetRemaining = budget - totalSpent;
  const budgetUsedPct = budget>0 ? Math.min(100, Math.round((totalSpent/budget)*100)) : 0;

  const doneSet = new Set(doneTasks.map(t=>`${t.phase_index}-${t.task_index}`));
  const actionPlan = result?.action_plan || [];
  const aiTotalTasks = actionPlan.reduce((s,p)=>s+(p.tasks?.length||0),0);
  const aiDoneCount = doneTasks.length;
  const customTotal = planItems.length;
  const customDone = planItems.filter(p=>p.done).length;
  const totalAllTasks = aiTotalTasks + customTotal;
  const totalAllDone = aiDoneCount + customDone;
  const progressPct = totalAllTasks>0 ? Math.round((totalAllDone/totalAllTasks)*100) : 0;

  // أول مهمة غير منجزة — تُستخدم لربط "الخطوة الجاية" بين الأقسام
  let nextTask = null;
  for (let pi=0; pi<actionPlan.length; pi++) {
    const tasks = actionPlan[pi].tasks || [];
    for (let ti=0; ti<tasks.length; ti++) {
      if (!doneSet.has(`${pi}-${ti}`)) { nextTask = {text:tasks[ti], phase:actionPlan[pi].title||actionPlan[pi].phase}; break; }
    }
    if (nextTask) break;
  }
  if (!nextTask) { const p = planItems.find(x=>!x.done); if (p) nextTask = {text:p.task_text, phase:p.plan_name}; }

  const risks = result?.risk_analysis || [];
  const riskScoreMap = {"منخفض":1,"طفيف":1,"متوسط":2,"عالي":3,"شديد":3};
  const riskAvg = risks.length>0
    ? risks.reduce((s,r)=>s+((riskScoreMap[r.probability]||2)+(riskScoreMap[r.impact]||2))/2,0)/risks.length
    : 2;
  const riskPct = Math.round((riskAvg/3)*100);
  const liquidityPct = budget>0 ? Math.max(0,Math.min(100,Math.round((budgetRemaining/budget)*100))) : 50;
  const healthScore = Math.round((liquidityPct*0.35) + (progressPct*0.35) + ((100-riskPct)*0.3));

  if (!user) return <div style={{padding:sp[8],textAlign:"center",fontSize:13,color:$.L3}}>سجّل الدخول لمتابعة مشروعك</div>;
  if (loading) return <div style={{padding:sp[8],textAlign:"center"}}><Spinner sz={20}/></div>;

  const go = (id) => setSection(id);
  function blockDemoAdd() {
    alert("هذا مشروع تجريبي للتعليم فقط. اشترك لإضافة بياناتك الحقيقية ومتابعة مشروعك الفعلي.");
    if (onNeedUpgrade) onNeedUpgrade();
  }

  return (
    <div>
      {isDemo && (
        <div style={{display:"flex",alignItems:"center",gap:6,background:`${$.blue}12`,border:`1px solid ${$.blue}30`,borderRadius:12,padding:`${sp[2]}px ${sp[3]}px`,marginBottom:sp[3]}}>
          <Sparkles size={13} color={$.blue}/>
          <span style={{fontSize:11,fontWeight:600,color:$.blue}}>مشروع تجريبي — تصفّح بحرية، بس الإضافة الفعلية تحتاج اشتراك</span>
        </div>
      )}
      <AdvisorHeader result={result} healthScore={healthScore}/>
      <AdvisorIsland active={section} onChange={setSection}/>

      {section === "overview" && (
        <OverviewSection entries={sortedEntries} latest={latest} prevEntry={prevEntry} setupTotal={setupTotal}
          budget={budget} budgetRemaining={budgetRemaining} progressPct={progressPct} totalProfit={totalProfit} totalRevenue={totalRevenue}
          totalSpent={totalSpent} liquidityPct={liquidityPct} riskPct={riskPct} fa={fa} nextTask={nextTask} go={go} metrics={metrics}/>
      )}
      {section === "finance" && (
        <FinanceSection entries={sortedEntries} user={user} analysisId={analysisId} isDemo={isDemo} onNeedUpgrade={blockDemoAdd}
          onAdd={(e)=>setEntries(prev=>[...prev,e])}
          onUpdate={(e)=>setEntries(prev=>prev.map(x=>x.id===e.id?e:x))}
          onDelete={(id)=>setEntries(prev=>prev.filter(x=>x.id!==id))}
          budget={budget} totalSpent={totalSpent} budgetRemaining={budgetRemaining} budgetUsedPct={budgetUsedPct} monthlyTotal={monthlyTotal}/>
      )}
      {section === "progress" && (
        <ProgressSection actionPlan={actionPlan} doneSet={doneSet} analysisId={analysisId} user={user} planItems={planItems}
          onToggle={async (pi,ti,text,val)=>{
            if (!isDemo) await toggleTask(analysisId,user.id,pi,ti,text,val);
            setDoneTasks(prev => val ? [...prev,{phase_index:pi,task_index:ti}] : prev.filter(t=>!(t.phase_index===pi&&t.task_index===ti)));
          }}
          onAddPlanItem={async (planName,taskText)=>{
            if (isDemo) { blockDemoAdd(); return; }
            const it = await addPlanItem(analysisId,user.id,planName,taskText);
            setPlanItems(prev=>[...prev,it]);
          }}
          onTogglePlanItem={async (id,done)=>{ if (!isDemo) await togglePlanItem(id,done); setPlanItems(prev=>prev.map(p=>p.id===id?{...p,done}:p)); }}
          onDeletePlanItem={async (id)=>{ if (!isDemo) await deletePlanItem(id); setPlanItems(prev=>prev.filter(p=>p.id!==id)); }}
          onDeletePlan={async (planName)=>{ if (!isDemo) await deletePlan(analysisId,planName); setPlanItems(prev=>prev.filter(p=>p.plan_name!==planName)); }}/>
      )}
      {section === "team" && (
        <TeamSection team={team} salaryBreakdown={result?.financial_analysis?.salary_breakdown}
          onAdd={async (payload)=>{
            if (isDemo) { blockDemoAdd(); return; }
            const t = await addTeamMember(analysisId,user.id,payload);
            setTeam(prev=>[...prev,t]);
          }}
          onUpdate={async (id,payload)=>{
            const t = isDemo ? {id, name:payload.name, role:payload.role, phone:payload.phone, monthly_pay:payload.monthlyPay, start_date:payload.startDate, notes:payload.notes} : await updateTeamMember(id,payload);
            setTeam(prev=>prev.map(x=>x.id===id?t:x));
          }}
          onDelete={async (id)=>{ if (!isDemo) await deleteTeamMember(id); setTeam(prev=>prev.filter(x=>x.id!==id)); }}/>
      )}
      {section === "metrics" && (
        <MetricsSection metrics={metrics} analysisId={analysisId} user={user}
          onAdd={async (name,unit,showChart)=>{
            if (isDemo) { blockDemoAdd(); return; }
            const m = await addMetric(analysisId,user.id,name,unit,showChart);
            setMetrics(prev=>[...prev,m]);
          }}
          onAddEntry={async (metricId,value)=>{
            if (isDemo) { blockDemoAdd(); return; }
            const e = await addMetricEntry(metricId,user.id,value);
            setMetrics(prev=>prev.map(m=>m.id===metricId?{...m,entries:[...m.entries,e]}:m));
          }}
          onDeleteEntry={async (metricId,entryId)=>{ if (!isDemo) await deleteMetricEntry(entryId); setMetrics(prev=>prev.map(m=>m.id===metricId?{...m,entries:m.entries.filter(e=>e.id!==entryId)}:m)); }}
          onDelete={async (metricId)=>{ if (!isDemo) await deleteMetric(metricId); setMetrics(prev=>prev.filter(m=>m.id!==metricId)); }}
          onToggleChart={async (metricId,showChart)=>{ if (!isDemo) await updateMetricChart(metricId,showChart); setMetrics(prev=>prev.map(m=>m.id===metricId?{...m,show_chart:showChart}:m)); }}/>
      )}
      {section === "compare" && (
        <CompareSection entries={sortedEntries} latest={latest} prevEntry={prevEntry} setupTotal={setupTotal} totalSpent={totalSpent}
          totalProfit={totalProfit} fa={fa} savedAt={result?.savedAt}/>
      )}
      {section === "docs" && (
        <DocsSection documents={documents} analysisId={analysisId} user={user}
          onAdd={async (name)=>{
            if (isDemo) { blockDemoAdd(); return; }
            const d = await addDocument(analysisId,user.id,name);
            setDocuments(prev=>[...prev,d]);
          }}
          onStatusChange={async (docId,status)=>{ if (!isDemo) await updateDocumentStatus(docId,status); setDocuments(prev=>prev.map(d=>d.id===docId?{...d,status}:d)); }}
          onDelete={async (docId)=>{ if (!isDemo) await deleteDocument(docId); setDocuments(prev=>prev.filter(d=>d.id!==docId)); }}/>
      )}
      {section === "chat" && (
        <ChatSection result={result} entries={entries} messages={messages} setMessages={setMessages} user={user} analysisId={analysisId} nextTask={nextTask} isDemo={isDemo}/>
      )}
      {section === "log" && (
        <LogSection entries={entries} messages={messages} documents={documents} metrics={metrics} team={team}/>
      )}

      {isDemo && showTour && <AdvisorTour onNavigate={setSection} onFinish={()=>setShowTour(false)}/>}
    </div>
  );
}

// ═══════════════ نظرة عامة — المرآة الرئيسية ═══════════════
function OverviewSection({entries, latest, prevEntry, setupTotal, budget, budgetRemaining, progressPct, totalProfit, totalRevenue, totalSpent, liquidityPct, riskPct, fa, nextTask, go, metrics}) {
  const delta = latest && prevEntry ? (latest.profit||0) - (prevEntry.profit||0) : null;
  const hasData = entries.length > 0;
  const chartMetrics = (metrics||[]).filter(m=>m.show_chart).slice(0,3);

  const sc = fa.setup_costs || {};
  const donutItems = [
    {label:"معدات وتجهيز", value:sc.equipment||0, color:$.blue},
    {label:"رأس مال تشغيلي", value:sc.working_capital||0, color:$.green},
    {label:"تسويق الإطلاق", value:sc.marketing_launch||0, color:$.purple},
    {label:"ضمان الإيجار", value:sc.rent_deposit||0, color:$.orange},
    {label:"أخرى", value:(sc.licenses||0)+(sc.initial_inventory||0)+(sc.renovation||0), color:$.L4}
  ].filter(d=>d.value>0);
  const donutTotal = donutItems.reduce((s,d)=>s+d.value,0);

  // ملاحظات مبنية على أرقامه هو فقط (مرآة، مو توصيات إدارية)
  const notes = [];
  if (hasData) {
    if (delta !== null) notes.push({type: delta>=0?"good":"watch", text: delta>=0
      ? `ربحك تحسّن ${numWithCommas(Math.abs(delta))} ريال عن آخر إدخال.`
      : `ربحك انخفض ${numWithCommas(Math.abs(delta))} ريال عن آخر إدخال — قد يستحق مراجعة.`});
    const usedPct = budget>0 ? (totalSpent/budget)*100 : 0;
    if (usedPct > 80) notes.push({type:"watch", text:`أنت عند ${Math.round(usedPct)}% من ميزانيتك.`});
  }
  if (riskPct >= 60) notes.push({type:"watch", text:"مستوى المخاطر في تحليلك الأصلي مرتفع نسبياً."});

  return (
    <div>
      {nextTask && (
        <div onClick={()=>go("progress")} style={{display:"flex",alignItems:"center",gap:sp[3],background:`${$.blue}0F`,border:`1px solid ${$.blue}30`,borderRadius:14,padding:`${sp[3]}px ${sp[4]}px`,marginBottom:sp[3],cursor:"pointer"}}>
          <div style={{width:32,height:32,borderRadius:10,background:`${$.blue}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <CheckCircle size={15} color={$.blue}/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:9.5,color:$.L4,fontWeight:400}}>خطوتك القادمة · {nextTask.phase}</div>
            <div style={{fontSize:12,fontWeight:500,color:$.L1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{nextTask.text}</div>
          </div>
          <ChevronRight size={16} color={$.blue} style={{transform:"scaleX(-1)",flexShrink:0}}/>
        </div>
      )}

      {!hasData && (
        <div onClick={()=>go("finance")} style={{display:"flex",alignItems:"center",gap:sp[3],background:$.F4,borderRadius:14,padding:`${sp[3]}px ${sp[4]}px`,marginBottom:sp[3],cursor:"pointer"}}>
          <TrendingUp size={15} color={$.L3} style={{flexShrink:0}}/>
          <div style={{flex:1,fontSize:11.5,color:$.L2}}>سجّل أول رقم فعلي في "المالية" لتبدأ هذه اللوحة تعكس وضعك</div>
          <ChevronRight size={16} color={$.L4} style={{transform:"scaleX(-1)",flexShrink:0}}/>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:sp[3],marginBottom:sp[3]}}>
        <div onClick={()=>go("finance")}><StatCard label="آخر ربح مسجّل" value={hasData?`${numWithCommas(latest?.profit||0)}`:"٠"} unit="ريال" sub={hasData?fmtDate(latest.entry_date):"بانتظار أول إدخال"} delta={delta} deltaGoodUp empty={!hasData} clickable/></div>
        <div onClick={()=>go("finance")}><StatCard label="إجمالي الإيراد" value={hasData?`${numWithCommas(totalRevenue)}`:"٠"} unit="ريال" sub={hasData?`${entries.length} إدخال`:"بانتظار أول إدخال"} empty={!hasData} clickable/></div>
        <div onClick={()=>go("finance")}><StatCard label="الميزانية المتبقية" value={numWithCommas(budgetRemaining)} unit="ريال" sub={`من ${numWithCommas(budget)}`} clickable/></div>
        <div onClick={()=>go("progress")}><StatCard label="إنجاز خططك" value={`${progressPct}`} unit="%" sub="اضغط للمتابعة" empty={progressPct===0} clickable/></div>
      </div>

      <Card style={{padding:sp[5],marginBottom:sp[3],boxShadow:AD_SHADOW}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:sp[3]}}>
          <div style={{fontSize:13,fontWeight:600,color:$.L1}}>أداؤك المالي عبر الزمن</div>
          <span onClick={()=>go("finance")} style={{fontSize:10.5,color:$.blue,cursor:"pointer",fontWeight:500}}>التفاصيل ←</span>
        </div>
        <MultiLineChart entries={entries}/>
      </Card>

      {chartMetrics.length > 0 && (
        <div style={{marginBottom:sp[3]}}>
          <div style={{fontSize:11,color:$.L4,marginBottom:sp[2],fontWeight:500,paddingRight:2}}>مؤشراتك المخصصة</div>
          <div style={{display:"grid",gridTemplateColumns:chartMetrics.length===1?"1fr":"1fr 1fr",gap:sp[3]}}>
            {chartMetrics.map(m=><MiniMetricChart key={m.id} metric={m} go={go}/>)}
          </div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1.3fr 1fr",gap:sp[3],marginBottom:sp[3]}}>
        <Card style={{padding:sp[5],boxShadow:AD_SHADOW}}>
          <div style={{fontSize:13,fontWeight:600,color:$.L1,marginBottom:sp[3]}}>أين تذهب ميزانيتك</div>
          {donutTotal===0 ? (
            <div style={{fontSize:11,color:$.L4,textAlign:"center",padding:`${sp[6]}px 0`}}>بيانات التأسيس غير متوفرة في هذا التحليل</div>
          ) : <BudgetDonut items={donutItems} total={donutTotal}/>}
        </Card>

        <Card style={{padding:sp[5],boxShadow:AD_SHADOW}}>
          <div style={{fontSize:13,fontWeight:600,color:$.L1,marginBottom:sp[3]}}>وضعك الآن</div>
          <HealthRow icon={<TrendingUp size={14}/>} label="السيولة المالية" pct={liquidityPct} good={liquidityPct>=50}/>
          <HealthRow icon={<CheckCircle size={14}/>} label="التزامك بخططك" pct={progressPct} good={progressPct>=40}/>
          <HealthRow icon={<AlertTriangle size={14}/>} label="مخاطر مشروعك" pct={100-riskPct} good={riskPct<50}/>
        </Card>
      </div>

      <Card style={{padding:sp[5],boxShadow:AD_SHADOW}}>
        <div style={{fontSize:13,fontWeight:600,color:$.L1,marginBottom:sp[3]}}>ملاحظات على وضعك</div>
        {notes.length===0 ? (
          <div style={{fontSize:11,color:$.L4,textAlign:"center",padding:`${sp[5]}px 0`}}>تظهر ملاحظات هنا بمجرد ما تسجّل أرقامك</div>
        ) : notes.map((n,i)=>(
          <div key={i} style={{display:"flex",gap:sp[3],padding:`${sp[2]}px 0`,borderTop:i>0?`1px solid ${$.sepL}`:"none"}}>
            <span style={{fontSize:9,fontWeight:600,padding:"3px 9px",borderRadius:20,background:n.type==="good"?`${$.green}14`:`${$.orange}14`,color:n.type==="good"?$.green:$.orange,flexShrink:0,height:"fit-content"}}>{n.type==="good"?"إيجابي":"انتبه"}</span>
            <span style={{fontSize:11.5,color:$.L2,lineHeight:1.75,fontWeight:300}}>{n.text}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

function StatCard({label, value, unit, sub, delta, deltaGoodUp=true, empty=false, clickable=false}) {
  return (
    <Card style={{padding:`${sp[4]}px ${sp[4]}px`,opacity:empty?0.55:1,boxShadow:AD_SHADOW_SM,cursor:clickable?"pointer":"default"}}>
      <div style={{fontSize:10,color:$.L3,marginBottom:sp[2],fontWeight:400}}>{label}</div>
      <div style={{...numFont,fontSize:19,fontWeight:500,color:empty?$.L4:$.L1,letterSpacing:"-.2px"}}>
        {value}{unit && <span style={{fontSize:11,fontWeight:400,color:$.L4}}> {unit}</span>}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:sp[2]}}>
        <div style={{fontSize:9,color:$.L4,fontWeight:300}}>{sub}</div>
        {delta !== null && delta !== undefined && (
          <div style={{...numFont,fontSize:9.5,fontWeight:600,color:(delta>=0)===deltaGoodUp?$.green:$.red}}>{delta>=0?"↑":"↓"} {numWithCommas(Math.abs(delta))}</div>
        )}
      </div>
    </Card>
  );
}

function HealthRow({icon, label, pct, good}) {
  const color = good ? $.green : $.red;
  return (
    <div style={{display:"flex",alignItems:"center",gap:sp[3],padding:`${sp[2]}px 0`}}>
      <div style={{width:30,height:30,borderRadius:9,background:good?`${$.green}14`:`${$.red}14`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color}}>{icon}</div>
      <div style={{flex:1}}>
        <div style={{fontSize:11,fontWeight:400,color:$.L1,marginBottom:4}}>{label}</div>
        <div style={{height:5,background:$.F3,borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.max(4,pct)}%`,background:color,borderRadius:99,transition:".3s"}}/></div>
      </div>
      <div style={{...numFont,fontSize:10,fontWeight:600,color,flexShrink:0}}>{good?"جيد":"راجعها"}</div>
    </div>
  );
}

function BudgetDonut({items, total}) {
  let cum = 0;
  const stops = items.map(it => { const pct=(it.value/total)*100; const s=`${it.color} ${cum}% ${cum+pct}%`; cum+=pct; return s; }).join(", ");
  return (
    <div style={{display:"flex",alignItems:"center",gap:sp[4]}}>
      <div style={{width:96,height:96,borderRadius:"50%",flexShrink:0,background:`conic-gradient(${stops})`,position:"relative"}}>
        <div style={{position:"absolute",inset:16,background:$.surface,borderRadius:"50%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <b style={{...numFont,fontSize:13,fontWeight:600,color:$.L1}}>{total>=1000?`${Math.round(total/1000)}K`:total}</b><span style={{fontSize:8,color:$.L4}}>ريال</span>
        </div>
      </div>
      <div style={{flex:1}}>
        {items.map((it,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:7,padding:"4px 0",fontSize:10.5}}>
            <span style={{width:7,height:7,borderRadius:3,background:it.color,flexShrink:0}}/>
            <span style={{flex:1,color:$.L2,fontWeight:300,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.label}</span>
            <span style={{...numFont,fontWeight:600,color:$.L1}}>{Math.round((it.value/total)*100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════ الرسم البياني الرئيسي — خطوط قابلة للتحكم + محاور + تحكم بالفترة الزمنية ═══════════════
const CHART_SERIES = [
  {key:"revenue", color:$.green, label:"الإيراد"},
  {key:"expenses", color:$.orange, label:"المصروفات"},
  {key:"profit", color:$.blue, label:"الربح"}
];

const CHART_GRANULARITIES = [
  {id:"day", label:"أيام"},
  {id:"month", label:"أشهر"},
  {id:"year", label:"سنوات"}
];

function bucketKey(dateStr, granularity) {
  const d = new Date(dateStr);
  if (granularity === "year") return String(d.getFullYear());
  if (granularity === "month") return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
  return dateStr;
}

function bucketLabel(key, granularity) {
  if (granularity === "year") return key;
  if (granularity === "month") {
    const [y,m] = key.split("-");
    return `${AR_MONTHS[parseInt(m)-1]} ${y}`;
  }
  try {
    const d = new Date(key);
    return `${d.getDate()} ${AR_MONTHS[d.getMonth()]}`;
  } catch(e) { return key; }
}

function aggregateForChart(entries, granularity) {
  const buckets = {};
  entries.forEach(e => {
    const k = bucketKey(e.entry_date, granularity);
    if (!buckets[k]) buckets[k] = { key:k, revenue:0, expenses:0, profit:0 };
    buckets[k].revenue += e.revenue||0;
    buckets[k].expenses += e.expenses||0;
    buckets[k].profit += e.profit||0;
  });
  return Object.values(buckets).sort((a,b)=>a.key.localeCompare(b.key));
}

function MultiLineChart({entries}) {
  const [granularity, setGranularity] = useState("day");
  const [active, setActive] = useState(["revenue","expenses","profit"]);

  function toggle(key) {
    setActive(prev => prev.includes(key) ? prev.filter(k=>k!==key) : [...prev,key]);
  }

  if (entries.length < 2) {
    return (
      <div style={{height:200,display:"flex",alignItems:"center",justifyContent:"center",background:$.F5,borderRadius:12}}>
        <div style={{fontSize:11,color:$.L4,fontWeight:300}}>{entries.length===0?"يظهر بعد أول إدخالين":"أضف إدخالاً آخر ليظهر الاتجاه"}</div>
      </div>
    );
  }

  const data = aggregateForChart(entries, granularity);
  const visibleSeries = CHART_SERIES.filter(s=>active.includes(s.key));

  return (
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:4,marginBottom:sp[3]}}>
        {CHART_GRANULARITIES.map(g=>(
          <button key={g.id} onClick={()=>setGranularity(g.id)} style={{fontSize:10,fontWeight:600,padding:"4px 11px",borderRadius:99,border:"none",cursor:"pointer",fontFamily:"inherit",background:granularity===g.id?$.blue:$.F4,color:granularity===g.id?"#fff":$.L3}}>{g.label}</button>
        ))}
      </div>

      <div style={{display:"flex",gap:14,marginBottom:sp[3],flexWrap:"wrap"}}>
        {CHART_SERIES.map(s=>{
          const on = active.includes(s.key);
          return (
            <div key={s.key} onClick={()=>toggle(s.key)} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:on?$.L3:$.L4,fontWeight:on?500:400,cursor:"pointer",opacity:on?1:0.4,userSelect:"none"}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:s.color}}/>{s.label}
            </div>
          );
        })}
      </div>

      {visibleSeries.length===0 ? (
        <div style={{fontSize:11,color:$.L4,textAlign:"center",padding:`${sp[6]}px 0`}}>اختر مؤشراً واحداً على الأقل لعرضه</div>
      ) : (
        <div style={{width:"100%",height:240,direction:"ltr"}}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{top:8,right:8,left:0,bottom:4}}>
              <CartesianGrid stroke={$.sepL} strokeDasharray="3 3" vertical={false}/>
              <XAxis dataKey="key" tickFormatter={k=>bucketLabel(k,granularity)} tick={{fontSize:10, fill:$.L4}} axisLine={{stroke:$.sepL}} tickLine={false} minTickGap={24}/>
              <YAxis tickFormatter={v=>numWithCommas(v)} tick={{fontSize:9.5, fill:$.L4}} axisLine={false} tickLine={false} width={58}/>
              <Tooltip
                contentStyle={{background:$.surface, border:`1px solid ${$.sepL}`, borderRadius:10, fontSize:11, direction:"rtl", fontFamily:"inherit"}}
                labelFormatter={k=>bucketLabel(k,granularity)}
                formatter={(value, name)=>{
                  const s = CHART_SERIES.find(x=>x.key===name);
                  return [`${numWithCommas(value)} ريال`, s?s.label:name];
                }}
              />
              {visibleSeries.map(s=>(
                <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2.2} dot={data.length<=12} activeDot={{r:4}} isAnimationActive={false}/>
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{marginTop:sp[3],borderTop:`1px solid ${$.sepL}`,paddingTop:sp[2]}}>
        {[...entries].reverse().slice(0,5).map((e,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:10,padding:"4px 0",color:$.L3}}>
            <span style={{fontWeight:300}}>{fmtDate(e.entry_date)}</span>
            <span style={{...numFont}}><span style={{color:$.green}}>{numWithCommas(e.revenue||0)}</span> · <span style={{color:$.orange}}>{numWithCommas(e.expenses||0)}</span> · <span style={{color:$.blue,fontWeight:600}}>{numWithCommas(e.profit||0)}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

// مؤشر مخصّص كرسم بياني رسمي (محاور + تلميحات) — يظهر في النظرة العامة إذا فعّله الشخص
function MiniMetricChart({metric, go}) {
  const sorted = [...metric.entries].sort((a,b)=>new Date(a.entry_date)-new Date(b.entry_date));
  if (sorted.length < 2) {
    return (
      <Card onClick={()=>go&&go("metrics")} style={{padding:sp[4],boxShadow:AD_SHADOW_SM,cursor:go?"pointer":"default"}}>
        <div style={{fontSize:11,fontWeight:600,color:$.L1,marginBottom:sp[2],overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{metric.name}</div>
        <div style={{fontSize:9.5,color:$.L4,textAlign:"center",padding:`${sp[3]}px 0`,fontWeight:300}}>يحتاج قيمتين على الأقل ليظهر الاتجاه</div>
      </Card>
    );
  }
  const data = sorted.map(e=>({date:e.entry_date, value:e.value}));
  const last = sorted[sorted.length-1].value, first = sorted[0].value;
  const trendColor = last>=first ? $.green : $.red;
  return (
    <Card onClick={()=>go&&go("metrics")} style={{padding:sp[4],boxShadow:AD_SHADOW_SM,cursor:go?"pointer":"default"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:sp[2]}}>
        <span style={{fontSize:11,fontWeight:600,color:$.L1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{metric.name}</span>
        <span style={{...numFont,fontSize:13,fontWeight:700,color:$.L1,flexShrink:0}}>{numWithCommas(last)}{metric.unit?` ${metric.unit}`:""}</span>
      </div>
      <div style={{width:"100%",height:130,direction:"ltr"}}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{top:4,right:6,left:0,bottom:0}}>
            <CartesianGrid stroke={$.sepL} strokeDasharray="3 3" vertical={false}/>
            <XAxis dataKey="date" tickFormatter={d=>bucketLabel(d,"day")} tick={{fontSize:8.5, fill:$.L4}} axisLine={{stroke:$.sepL}} tickLine={false} minTickGap={18}/>
            <YAxis tickFormatter={v=>numWithCommas(v)} tick={{fontSize:8, fill:$.L4}} axisLine={false} tickLine={false} width={42}/>
            <Tooltip
              contentStyle={{background:$.surface, border:`1px solid ${$.sepL}`, borderRadius:10, fontSize:10, direction:"rtl", fontFamily:"inherit"}}
              labelFormatter={d=>fmtDate(d)}
              formatter={(value)=>[`${numWithCommas(value)}${metric.unit?` ${metric.unit}`:""}`, metric.name]}
            />
            <Line type="monotone" dataKey="value" stroke={trendColor} strokeWidth={2} dot={data.length<=15} activeDot={{r:4}} isAnimationActive={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ═══════════════ المالية — إدارة كاملة (إضافة/تعديل/حذف) ═══════════════
function FinanceSection({entries, user, analysisId, onAdd, onUpdate, onDelete, budget, totalSpent, budgetRemaining, budgetUsedPct, monthlyTotal, isDemo, onNeedUpgrade}) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [revenue, setRevenue] = useState(""); const [expenses, setExpenses] = useState("");
  const [profit, setProfit] = useState(""); const [cashBalance, setCashBalance] = useState("");
  const [note, setNote] = useState(""); const [date, setDate] = useState(todayStr());
  const [saving, setSaving] = useState(false);
  const [savedFlash, fireSaved] = useSavedFlash();

  function num(v, setter) { setter(v.replace(/[^\d-]/g,"")); }
  function resetForm() { setRevenue("");setExpenses("");setProfit("");setCashBalance("");setNote("");setDate(todayStr());setEditId(null);setShowForm(false); }

  function startEdit(e) {
    setEditId(e.id); setRevenue(String(e.revenue||"")); setExpenses(String(e.expenses||""));
    setProfit(String(e.profit||"")); setCashBalance(String(e.cash_balance||"")); setNote(e.note||""); setDate(e.entry_date||todayStr());
    setShowForm(true);
  }

  async function save() {
    if (!revenue.trim() && !expenses.trim() && !profit.trim() && !cashBalance.trim()) return;
    setSaving(true);
    try {
      const payload = { revenue: parseFloat(revenue)||0, expenses: parseFloat(expenses)||0,
        profit: parseFloat(profit) || (parseFloat(revenue)||0)-(parseFloat(expenses)||0),
        cashBalance: parseFloat(cashBalance)||0, note: note.trim(), date };
      if (isDemo) {
        if (!editId) { setSaving(false); if (onNeedUpgrade) onNeedUpgrade(); return; }
        const demoEntry = { id: editId, revenue:payload.revenue, expenses:payload.expenses, profit:payload.profit, cash_balance:payload.cashBalance, note:payload.note, entry_date:payload.date };
        onUpdate(demoEntry);
      } else if (editId) { const updated = await updateFinanceEntry(editId, payload); onUpdate(updated); }
      else { const e = await addFinanceEntry(analysisId, user.id, payload); onAdd(e); }
      fireSaved(); resetForm();
    } catch(err){} finally { setSaving(false); }
  }

  async function remove(id) { if (!confirm("حذف هذا الإدخال؟")) return; if (!isDemo) await deleteFinanceEntry(id); onDelete(id); }

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:sp[3],marginBottom:sp[3]}}>
        <Card style={{padding:sp[4],display:"flex",alignItems:"center",gap:14,boxShadow:AD_SHADOW_SM}}>
          <div style={{width:64,height:64,borderRadius:"50%",flexShrink:0,background:`conic-gradient(${$.blue} 0% ${budgetUsedPct}%, ${$.F3} ${budgetUsedPct}% 100%)`,position:"relative"}}>
            <div style={{position:"absolute",inset:9,background:$.surface,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}><b style={{...numFont,fontSize:12,fontWeight:600,color:$.L1}}>{budgetUsedPct}%</b></div>
          </div>
          <div><div style={{fontSize:10,color:$.L4}}>الميزانية المتبقية</div><div style={{...numFont,fontSize:15,fontWeight:500,color:$.L1,marginTop:2}}>{numWithCommas(budgetRemaining)}</div></div>
        </Card>
        <Card style={{padding:sp[4],boxShadow:AD_SHADOW_SM}}>
          <div style={{fontSize:10,color:$.L4,marginBottom:6}}>معدّل الحرق الشهري المقدّر</div>
          <div style={{...numFont,fontSize:16,fontWeight:500,color:$.L1}}>{numWithCommas(monthlyTotal)} <span style={{fontSize:10,color:$.L4,fontWeight:400}}>ريال/شهر</span></div>
        </Card>
      </div>

      <Card style={{padding:sp[5],marginBottom:sp[3],boxShadow:AD_SHADOW}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:sp[3]}}>
          <div style={{fontSize:13,fontWeight:600,color:$.L1}}>{editId?"تعديل الإدخال":"إدخال جديد"}</div>
          <div style={{display:"flex",alignItems:"center",gap:sp[2]}}>
            <SavedBadge show={savedFlash}/>
            <button onClick={()=>showForm?resetForm():setShowForm(true)} style={{background:$.F4,border:"none",borderRadius:99,width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Plus size={15} color={$.blue} style={{transform:showForm?"rotate(45deg)":"none",transition:".2s"}}/>
            </button>
          </div>
        </div>
        {showForm && (
          <div>
            <div style={{marginBottom:sp[3]}}>
              <div style={{fontSize:10.5,color:$.L4,marginBottom:sp[1]}}>التاريخ</div>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{width:"100%",background:$.F4,border:`1px solid ${$.sepL}`,borderRadius:10,padding:sp[3],color:$.L1,fontSize:13,fontFamily:"inherit",outline:"none"}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:sp[3],marginBottom:sp[3]}}>
              {[["الإيراد",revenue,setRevenue],["المصروفات",expenses,setExpenses],["الربح (اختياري)",profit,setProfit],["الرصيد النقدي",cashBalance,setCashBalance]].map(([lbl,val,setter],i)=>(
                <div key={i}>
                  <div style={{fontSize:10.5,color:$.L4,marginBottom:sp[1]}}>{lbl}</div>
                  <input value={val} onChange={e=>num(e.target.value,setter)} inputMode="numeric" placeholder="0" style={{width:"100%",background:$.F4,border:`1px solid ${$.sepL}`,borderRadius:10,padding:sp[3],color:$.L1,fontSize:14,fontFamily:"inherit",outline:"none"}}/>
                </div>
              ))}
            </div>
            <input value={note} onChange={e=>setNote(e.target.value.substring(0,150))} placeholder="ملاحظة (اختياري)" style={{width:"100%",background:$.F4,border:`1px solid ${$.sepL}`,borderRadius:10,padding:sp[3],color:$.L1,fontSize:13,fontFamily:"inherit",outline:"none",marginBottom:sp[3]}}/>
            <div style={{display:"flex",gap:sp[2]}}>
              <button onClick={save} disabled={saving} style={{flex:1,background:$.blue,color:"#fff",border:"none",borderRadius:12,padding:sp[3],fontSize:14,fontWeight:600,fontFamily:"inherit",cursor:"pointer"}}>{saving?<Spinner sz={14}/>:(editId?"حفظ التعديل":"حفظ")}</button>
              {editId && <button onClick={resetForm} style={{flex:1,background:$.F4,color:$.L3,border:"none",borderRadius:12,padding:sp[3],fontSize:14,fontWeight:500,fontFamily:"inherit",cursor:"pointer"}}>إلغاء</button>}
            </div>
          </div>
        )}
      </Card>

      <Card style={{padding:0,overflow:"hidden",boxShadow:AD_SHADOW}}>
        <div style={{padding:`${sp[3]}px ${sp[5]}px`,fontSize:12,fontWeight:600,color:$.L1,borderBottom:`1px solid ${$.sepL}`}}>سجل الإدخالات</div>
        {entries.length===0 ? (
          <div style={{padding:`${sp[6]}px ${sp[5]}px`,textAlign:"center"}}>
            <TrendingUp size={22} color={$.L4} style={{marginBottom:sp[2]}}/>
            <div style={{fontSize:12,color:$.L3}}>لسا ما أضفت أي إدخال</div>
            <div style={{fontSize:10.5,color:$.L4,marginTop:2,fontWeight:300}}>استخدم النموذج فوق لتسجيل أول رقم فعلي</div>
          </div>
        ) : [...entries].reverse().map(e=>(
          <div key={e.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:`${sp[3]}px ${sp[5]}px`,borderBottom:`1px solid ${$.sepL}`}}>
            <div onClick={()=>startEdit(e)} style={{flex:1,cursor:"pointer"}}>
              <div style={{fontSize:11,color:$.L4,fontWeight:300}}>{fmtDate(e.entry_date)}{e.note?` · ${e.note}`:""}</div>
              <div style={{...numFont,fontSize:13,fontWeight:600,color:(e.profit||0)>=0?$.green:$.red,marginTop:2}}>{(e.profit||0)>=0?"+":""}{numWithCommas(e.profit||0)}</div>
            </div>
            <button onClick={()=>remove(e.id)} style={{background:"none",border:"none",cursor:"pointer",padding:6,flexShrink:0}}><Trash2 size={14} color={$.L4}/></button>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ═══════════════ خططي — الافتراضية + خططه الخاصة (إدارة كاملة) ═══════════════
function ProgressSection({actionPlan, doneSet, onToggle, planItems, onAddPlanItem, onTogglePlanItem, onDeletePlanItem, onDeletePlan}) {
  const [newPlanName, setNewPlanName] = useState("");
  const [addingPlan, setAddingPlan] = useState(false);
  const [taskInputs, setTaskInputs] = useState({});

  const customPlans = {};
  planItems.forEach(p => { (customPlans[p.plan_name] = customPlans[p.plan_name]||[]).push(p); });

  async function createPlan() {
    if (!newPlanName.trim()) return;
    // ننشئ الخطة بإضافة أول مهمة فارغة placeholder؟ لا — ننتظر أول مهمة فعلية من المستخدم
    setAddingPlan(false);
    setTaskInputs(prev=>({...prev, [`__new__${newPlanName.trim()}`]: ""}));
    // نضيف اسم الخطة مباشرة كمجموعة فاضية بالعرض حتى يضيف أول مهمة
    if (!customPlans[newPlanName.trim()]) customPlans[newPlanName.trim()] = [];
    setPendingPlanNames(prev=>[...prev, newPlanName.trim()]);
    setNewPlanName("");
  }
  const [pendingPlanNames, setPendingPlanNames] = useState([]);

  async function addTask(planName) {
    const text = taskInputs[planName];
    if (!text || !text.trim()) return;
    await onAddPlanItem(planName, text.trim());
    setTaskInputs(prev=>({...prev,[planName]:""}));
    setPendingPlanNames(prev=>prev.filter(p=>p!==planName));
  }

  const allPlanNames = [...new Set([...Object.keys(customPlans), ...pendingPlanNames])];

  return (
    <div>
      {(!actionPlan || actionPlan.length===0) ? null : (
        <Card style={{padding:sp[5],marginBottom:sp[3],boxShadow:AD_SHADOW}}>
          <div style={{fontSize:11,color:$.L4,marginBottom:sp[3],fontWeight:500}}>الخطة المقترحة من تحليلك</div>
          {actionPlan.map((phase, pi) => {
            const tasks = phase.tasks || [];
            const doneInPhase = tasks.filter((_,ti)=>doneSet.has(`${pi}-${ti}`)).length;
            const allDone = doneInPhase === tasks.length && tasks.length>0;
            return (
              <div key={pi} style={{marginBottom:sp[4],paddingBottom:sp[4],borderBottom:pi<actionPlan.length-1?`1px solid ${$.sepL}`:"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:sp[2]}}>
                  <div style={{width:22,height:22,borderRadius:7,background:allDone?$.green:`${$.blue}14`,color:allDone?"#fff":$.blue,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:600,flexShrink:0}}>{allDone?<Check size={12}/>:pi+1}</div>
                  <div style={{fontSize:12.5,fontWeight:600,color:$.L1,flex:1}}>{phase.title || phase.phase}</div>
                  <div style={{...numFont,fontSize:9.5,color:$.L4}}>{doneInPhase}/{tasks.length}</div>
                </div>
                {tasks.map((task,ti)=>{
                  const done = doneSet.has(`${pi}-${ti}`);
                  return (
                    <div key={ti} onClick={()=>onToggle(pi,ti,task,!done)} style={{display:"flex",alignItems:"center",gap:sp[2],padding:`${sp[2]}px 0 ${sp[2]}px 30px`,fontSize:12,cursor:"pointer"}}>
                      <div style={{width:16,height:16,borderRadius:5,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:done?$.green:"transparent",border:done?"none":`1.3px solid ${$.sepL}`}}>{done && <Check size={10} color="#fff"/>}</div>
                      <span style={{color:done?$.L4:$.L2,textDecoration:done?"line-through":"none",fontWeight:300}}>{task}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </Card>
      )}

      <div style={{fontSize:11,color:$.L4,marginBottom:sp[2],fontWeight:500,paddingRight:2}}>خططك الخاصة</div>

      {allPlanNames.map(planName => {
        const items = customPlans[planName] || [];
        const doneCount = items.filter(p=>p.done).length;
        return (
          <Card key={planName} style={{padding:sp[4],marginBottom:sp[3],boxShadow:AD_SHADOW_SM}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:sp[2]}}>
              <div style={{fontSize:12.5,fontWeight:600,color:$.L1}}>{planName}</div>
              <div style={{display:"flex",alignItems:"center",gap:sp[2]}}>
                {items.length>0 && <span style={{...numFont,fontSize:9.5,color:$.L4}}>{doneCount}/{items.length}</span>}
                {items.length>0 && <button onClick={()=>onDeletePlan(planName)} style={{background:"none",border:"none",cursor:"pointer",padding:2}}><Trash2 size={13} color={$.L4}/></button>}
              </div>
            </div>
            {items.map(item => (
              <div key={item.id} style={{display:"flex",alignItems:"center",gap:sp[2],padding:`${sp[2]}px 0`}}>
                <div onClick={()=>onTogglePlanItem(item.id,!item.done)} style={{width:16,height:16,borderRadius:5,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",background:item.done?$.green:"transparent",border:item.done?"none":`1.3px solid ${$.sepL}`}}>{item.done && <Check size={10} color="#fff"/>}</div>
                <span style={{flex:1,fontSize:12,color:item.done?$.L4:$.L2,textDecoration:item.done?"line-through":"none",fontWeight:300}}>{item.task_text}</span>
                <button onClick={()=>onDeletePlanItem(item.id)} style={{background:"none",border:"none",cursor:"pointer",padding:2}}><X size={13} color={$.L4}/></button>
              </div>
            ))}
            <div style={{display:"flex",gap:sp[2],marginTop:sp[2]}}>
              <input value={taskInputs[planName]||""} onChange={e=>setTaskInputs(prev=>({...prev,[planName]:e.target.value.substring(0,150)}))} onKeyDown={e=>e.key==="Enter"&&addTask(planName)} placeholder="أضف مهمة…" style={{flex:1,background:$.F4,border:`1px solid ${$.sepL}`,borderRadius:9,padding:`${sp[2]}px ${sp[3]}px`,color:$.L1,fontSize:12,fontFamily:"inherit",outline:"none"}}/>
              <button onClick={()=>addTask(planName)} style={{background:$.blue,color:"#fff",border:"none",borderRadius:9,padding:`0 ${sp[3]}px`,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>إضافة</button>
            </div>
          </Card>
        );
      })}

      {addingPlan ? (
        <Card style={{padding:sp[4],boxShadow:AD_SHADOW_SM}}>
          <input value={newPlanName} onChange={e=>setNewPlanName(e.target.value.substring(0,60))} onKeyDown={e=>e.key==="Enter"&&createPlan()} placeholder="اسم الخطة (مثال: خطة التسويق)" style={{width:"100%",background:$.F4,border:`1px solid ${$.sepL}`,borderRadius:10,padding:sp[3],color:$.L1,fontSize:13,fontFamily:"inherit",outline:"none",marginBottom:sp[3]}}/>
          <div style={{display:"flex",gap:sp[2]}}>
            <button onClick={createPlan} style={{flex:1,background:$.blue,color:"#fff",border:"none",borderRadius:10,padding:sp[3],fontSize:13,fontWeight:600,fontFamily:"inherit",cursor:"pointer"}}>إنشاء</button>
            <button onClick={()=>setAddingPlan(false)} style={{flex:1,background:$.F4,color:$.L3,border:"none",borderRadius:10,padding:sp[3],fontSize:13,fontWeight:500,fontFamily:"inherit",cursor:"pointer"}}>إلغاء</button>
          </div>
        </Card>
      ) : (
        <div onClick={()=>setAddingPlan(true)} style={{border:`1.3px dashed ${$.sepL}`,borderRadius:15,display:"flex",alignItems:"center",justifyContent:"center",gap:sp[2],padding:sp[6],color:$.L4,fontSize:12,cursor:"pointer"}}>
          <Plus size={16}/>إنشاء خطة جديدة باسمك
        </div>
      )}
    </div>
  );
}

// ═══════════════ مؤشراتي — إدارة كاملة مع سجل القيم + خيار عرضه كرسم في النظرة العامة ═══════════════
function MetricsSection({metrics, onAdd, onAddEntry, onDeleteEntry, onDelete, onToggleChart}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState(""); const [unit, setUnit] = useState("");
  const [showChart, setShowChart] = useState(false);
  const [entryInputs, setEntryInputs] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  const chartCount = metrics.filter(m=>m.show_chart).length;

  async function submitAdd() { if (!name.trim()) return; await onAdd(name.trim(), unit.trim(), showChart); setName(""); setUnit(""); setShowChart(false); setAdding(false); }
  async function submitEntry(metricId) { const v = entryInputs[metricId]; if (!v || !v.trim()) return; await onAddEntry(metricId, parseFloat(v)); setEntryInputs(prev=>({...prev,[metricId]:""})); }

  return (
    <div>
      {metrics.map(m => {
        const sorted = [...m.entries].sort((a,b)=>new Date(b.entry_date)-new Date(a.entry_date));
        const last = sorted[0]; const prev = sorted[1];
        const delta = last && prev ? last.value - prev.value : null;
        const expanded = expandedId === m.id;
        const chartOn = !!m.show_chart;
        const chartDisabled = !chartOn && chartCount>=3;
        return (
          <Card key={m.id} style={{padding:sp[4],marginBottom:sp[3],boxShadow:AD_SHADOW_SM}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:sp[2]}}>
              <div><div style={{fontSize:12.5,fontWeight:600,color:$.L1}}>{m.name}</div><div style={{fontSize:9.5,color:$.L4,marginTop:2,fontWeight:300}}>مؤشر مخصّص{m.unit?` · ${m.unit}`:""}</div></div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <button onClick={()=>!chartDisabled && onToggleChart(m.id, !chartOn)} title={chartOn?"إخفاء من النظرة العامة":"أظهر كرسم بياني في النظرة العامة"} style={{background:chartOn?`${$.blue}14`:"none",border:"none",borderRadius:8,cursor:chartDisabled?"default":"pointer",padding:5,opacity:chartDisabled?0.35:1}}>
                  <BarChart2 size={13} color={chartOn?$.blue:$.L4}/>
                </button>
                <button onClick={()=>onDelete(m.id)} style={{background:"none",border:"none",cursor:"pointer",padding:2}}><Trash2 size={14} color={$.L4}/></button>
              </div>
            </div>
            <div onClick={()=>setExpandedId(expanded?null:m.id)} style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:sp[3],cursor:m.entries.length>0?"pointer":"default"}}>
              <div style={{...numFont,fontSize:19,fontWeight:500,color:$.L1}}>{last?numWithCommas(last.value):"—"}</div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                {delta!==null && <div style={{...numFont,fontSize:10,fontWeight:600,color:delta>=0?$.green:$.red}}>{delta>=0?"↑":"↓"} {numWithCommas(Math.abs(delta))}</div>}
                {m.entries.length>0 && <ChevronDown size={13} color={$.L4} style={{transform:expanded?"rotate(180deg)":"none",transition:".2s"}}/>}
              </div>
            </div>
            {chartOn && (
              <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:sp[2],fontSize:9.5,color:$.blue,fontWeight:600}}>
                <BarChart2 size={11}/>يظهر كرسم بياني في النظرة العامة
              </div>
            )}
            {expanded && (
              <div style={{marginBottom:sp[3],borderTop:`1px solid ${$.sepL}`,paddingTop:sp[2]}}>
                {sorted.map(e=>(
                  <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0"}}>
                    <span style={{fontSize:10,color:$.L4,fontWeight:300}}>{fmtDate(e.entry_date)}</span>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{...numFont,fontSize:11,color:$.L2}}>{numWithCommas(e.value)}</span>
                      <button onClick={()=>onDeleteEntry(m.id,e.id)} style={{background:"none",border:"none",cursor:"pointer",padding:2}}><X size={11} color={$.L4}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{display:"flex",gap:sp[2]}}>
              <input value={entryInputs[m.id]||""} onChange={e=>setEntryInputs(prev=>({...prev,[m.id]:e.target.value.replace(/[^\d.-]/g,"")}))} placeholder="قيمة جديدة" inputMode="decimal" style={{flex:1,background:$.F4,border:`1px solid ${$.sepL}`,borderRadius:10,padding:`${sp[2]}px ${sp[3]}px`,color:$.L1,fontSize:13,fontFamily:"inherit",outline:"none"}}/>
              <button onClick={()=>submitEntry(m.id)} style={{background:$.blue,color:"#fff",border:"none",borderRadius:10,padding:`0 ${sp[3]}px`,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>إضافة</button>
            </div>
          </Card>
        );
      })}

      {adding ? (
        <Card style={{padding:sp[4],boxShadow:AD_SHADOW_SM}}>
          <input value={name} onChange={e=>setName(e.target.value.substring(0,60))} placeholder="اسم المؤشر (مثال: زيارات أسبوعية)" style={{width:"100%",background:$.F4,border:`1px solid ${$.sepL}`,borderRadius:10,padding:sp[3],color:$.L1,fontSize:13,fontFamily:"inherit",outline:"none",marginBottom:sp[2]}}/>
          <input value={unit} onChange={e=>setUnit(e.target.value.substring(0,20))} placeholder="الوحدة (اختياري)" style={{width:"100%",background:$.F4,border:`1px solid ${$.sepL}`,borderRadius:10,padding:sp[3],color:$.L1,fontSize:13,fontFamily:"inherit",outline:"none",marginBottom:sp[3]}}/>
          <label style={{display:"flex",alignItems:"center",gap:8,marginBottom:sp[3],cursor:chartCount>=3&&!showChart?"default":"pointer"}}>
            <input type="checkbox" checked={showChart} disabled={chartCount>=3 && !showChart} onChange={e=>setShowChart(e.target.checked)} style={{width:16,height:16}}/>
            <span style={{fontSize:11.5,color:$.L2}}>أظهره كرسم بياني في النظرة العامة{chartCount>=3?" (وصلت الحد الأقصى 3)":""}</span>
          </label>
          <div style={{display:"flex",gap:sp[2]}}>
            <button onClick={submitAdd} style={{flex:1,background:$.blue,color:"#fff",border:"none",borderRadius:10,padding:sp[3],fontSize:13,fontWeight:600,fontFamily:"inherit",cursor:"pointer"}}>حفظ</button>
            <button onClick={()=>{setAdding(false);setShowChart(false);}} style={{flex:1,background:$.F4,color:$.L3,border:"none",borderRadius:10,padding:sp[3],fontSize:13,fontWeight:500,fontFamily:"inherit",cursor:"pointer"}}>إلغاء</button>
          </div>
        </Card>
      ) : (
        <div onClick={()=>setAdding(true)} style={{border:`1.3px dashed ${$.sepL}`,borderRadius:15,display:"flex",alignItems:"center",justifyContent:"center",gap:sp[2],padding:sp[6],color:$.L4,fontSize:12,cursor:"pointer"}}><Plus size={16}/>إضافة مؤشر جديد للمتابعة</div>
      )}
    </div>
  );
}

// ═══════════════ المقارنات ═══════════════
function CompareSection({entries, latest, prevEntry, setupTotal, totalSpent, totalProfit, fa, savedAt}) {
  const hasComparison = latest && prevEntry;
  const needMore = 2 - entries.length;

  const rp = fa?.revenue_projection || {};
  const predictedBE = parseFloat(String(fa?.break_even_months||"").replace(/[^\d.]/g,"")) || null;
  const monthsSinceAnalysis = savedAt ? Math.max(0, (Date.now() - new Date(savedAt).getTime()) / (1000*60*60*24*30)) : null;

  let beStatus = null;
  if (setupTotal>0 && predictedBE && monthsSinceAnalysis!==null) {
    const actualRatio = Math.max(0, totalProfit / setupTotal);
    const expectedRatio = Math.min(2, monthsSinceAnalysis / predictedBE);
    let label, color;
    if (actualRatio >= expectedRatio*1.1) { label="متقدم عن الخطة"; color=$.green; }
    else if (actualRatio >= expectedRatio*0.85) { label="قريب من المسار المتوقع"; color=$.blue; }
    else { label="متأخر عن الخطة"; color=$.orange; }
    beStatus = {actualRatio, label, color};
  }

  const milestone = (() => {
    if (monthsSinceAnalysis===null) return null;
    const points = [
      {m:1, v:rp.month_1, label:"الشهر الأول"},
      {m:3, v:rp.month_3, label:"الشهر الثالث"},
      {m:6, v:rp.month_6, label:"الشهر السادس"},
      {m:12, v:rp.month_12, label:"الشهر الـ12"}
    ].filter(p=>p.v!==undefined && p.v!==null && p.v!=="" && !isNaN(parseFloat(p.v)));
    if (points.length===0) return null;
    let best=points[0], bestDiff=Math.abs(points[0].m-monthsSinceAnalysis);
    points.forEach(p=>{ const d=Math.abs(p.m-monthsSinceAnalysis); if(d<bestDiff){best=p;bestDiff=d;} });
    return {...best, v: parseFloat(best.v)};
  })();

  return (
    <div>
      <Card style={{padding:sp[5],marginBottom:sp[3],boxShadow:AD_SHADOW}}>
        <div style={{fontSize:13,fontWeight:600,color:$.L1,marginBottom:sp[3]}}>الفعلي مقابل المتوقع في تحليلك الأصلي</div>
        {beStatus ? (
          <div style={{marginBottom:sp[4]}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:sp[2]}}>
              <span style={{fontSize:12,color:$.L2}}>نقطة التعادل</span>
              <Chip text={beStatus.label} color={beStatus.color} bg={`${beStatus.color}15`} size={11}/>
            </div>
            <div style={{height:8,background:$.F3,borderRadius:99,overflow:"hidden",marginBottom:sp[2]}}>
              <div style={{height:"100%",width:`${Math.min(100,beStatus.actualRatio*100)}%`,background:beStatus.color,borderRadius:99,transition:".3s"}}/>
            </div>
            <div style={{fontSize:10.5,color:$.L4,fontWeight:300,lineHeight:1.6}}>
              استرجعت {Math.round(beStatus.actualRatio*100)}% من رأس مالك الأولي · توقّع تحليلك الأصلي كان التعادل خلال {predictedBE} شهر، وأنت الآن تقريباً في الشهر {Math.round(monthsSinceAnalysis)} منذ التحليل
            </div>
          </div>
        ) : (
          <div style={{fontSize:11,color:$.L4,marginBottom:sp[4],fontWeight:300}}>يحتاج بيانات تأسيس ونقطة تعادل من تحليلك الأصلي لعرض هذه المقارنة</div>
        )}

        {milestone && latest ? (
          <div style={{borderTop:`1px solid ${$.sepL}`,paddingTop:sp[3]}}>
            <div style={{fontSize:12,color:$.L2,marginBottom:sp[2]}}>آخر إيراد مسجّل مقابل توقّع {milestone.label}</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{...numFont,fontSize:15,fontWeight:700,color:$.L1}}>{numWithCommas(latest.revenue||0)}</div><div style={{fontSize:9.5,color:$.L4}}>فعلي</div></div>
              <div style={{textAlign:"left"}}><div style={{...numFont,fontSize:15,fontWeight:700,color:$.blue}}>{numWithCommas(milestone.v)}</div><div style={{fontSize:9.5,color:$.L4}}>متوقع</div></div>
            </div>
          </div>
        ) : (
          <div style={{fontSize:11,color:$.L4,fontWeight:300,borderTop:`1px solid ${$.sepL}`,paddingTop:sp[3]}}>سجّل إيرادك في "المالية" لتشوف هذه المقارنة</div>
        )}
      </Card>

      <Card style={{padding:sp[5],marginBottom:sp[3],boxShadow:AD_SHADOW}}>
        <div style={{fontSize:13,fontWeight:600,color:$.L1,marginBottom:sp[1]}}>هذا الإدخال مقابل السابق</div>
        {!hasComparison && <div style={{fontSize:10.5,color:$.blue,marginBottom:sp[3],fontWeight:300}}>{needMore>0?`يحتاج ${needMore} إدخال${needMore>1?"ات":""} إضافي${needMore>1?"ة":""} من "المالية"`:"جاهز — سيظهر بعد الإدخال التالي"}</div>}
        {["الإيراد","المصروفات","الربح"].map((lbl,i)=>{
          const key = ["revenue","expenses","profit"][i];
          const cur = hasComparison?(latest[key]||0):0, old = hasComparison?(prevEntry[key]||0):0, diff = cur-old;
          const pct = hasComparison && old!==0 ? Math.round((diff/Math.abs(old))*100) : null;
          return (
            <div key={key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:`${sp[2]}px 0`,borderBottom:`1px solid ${$.sepL}`,opacity:hasComparison?1:0.45}}>
              <div style={{fontSize:12,color:$.L2,fontWeight:400}}>{lbl}</div>
              <div style={{display:"flex",alignItems:"center",gap:sp[2]}}>
                <span style={{...numFont,fontSize:11,color:$.L4}}>{hasComparison?`${numWithCommas(old)} ← ${numWithCommas(cur)}`:"— ← —"}</span>
                {pct!==null && <span style={{...numFont,fontSize:10,fontWeight:600,color:diff>=0?$.green:$.red}}>{diff>=0?"+":""}{pct}%</span>}
              </div>
            </div>
          );
        })}
      </Card>
      <Card style={{padding:sp[5],boxShadow:AD_SHADOW}}>
        <div style={{fontSize:13,fontWeight:600,color:$.L1,marginBottom:sp[3]}}>الإنفاق مقابل التأسيس المقدّر</div>
        <div style={{height:8,background:$.F3,borderRadius:99,overflow:"hidden",marginBottom:sp[2]}}><div style={{height:"100%",width:`${setupTotal>0?Math.min(100,(totalSpent/setupTotal)*100):0}%`,background:totalSpent>setupTotal?$.red:$.blue,borderRadius:99,transition:".3s"}}/></div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10.5,color:$.L4,fontWeight:300}}><span>أنفقت: <b style={numFont}>{numWithCommas(totalSpent)}</b></span><span>التقدير: <b style={numFont}>{numWithCommas(setupTotal)}</b></span></div>
      </Card>
    </div>
  );
}

// ═══════════════ الفريق — من يشتغل معك (إدارة كاملة) ═══════════════
function TeamSection({team, salaryBreakdown, onAdd, onUpdate, onDelete}) {
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState(""); const [role, setRole] = useState("");
  const [phone, setPhone] = useState(""); const [monthlyPay, setMonthlyPay] = useState("");
  const [startDate, setStartDate] = useState(""); const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const totalMonthlyPay = team.reduce((s,t)=>s+(parseFloat(t.monthly_pay)||0),0);

  function resetForm() { setName("");setRole("");setPhone("");setMonthlyPay("");setStartDate("");setNotes("");setEditId(null);setAdding(false); }

  function startEdit(t) {
    setEditId(t.id); setName(t.name||""); setRole(t.role||""); setPhone(t.phone||"");
    setMonthlyPay(t.monthly_pay?String(t.monthly_pay):""); setStartDate(t.start_date||""); setNotes(t.notes||"");
    setAdding(true);
  }

  async function save() {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const payload = { name:name.trim(), role:role.trim(), phone:phone.trim(), monthlyPay:parseFloat(monthlyPay)||null, startDate:startDate||null, notes:notes.trim() };
      if (editId) { await onUpdate(editId, payload); } else { await onAdd(payload); }
      resetForm();
    } catch(e){} finally { setSaving(false); }
  }

  async function remove(id) { if (!confirm("حذف هذا العضو من الفريق؟")) return; await onDelete(id); }

  return (
    <div>
      {salaryBreakdown && salaryBreakdown.length>0 && (
        <Card style={{padding:sp[4],marginBottom:sp[3],boxShadow:AD_SHADOW_SM}}>
          <div style={{fontSize:11,color:$.L4,marginBottom:sp[2],fontWeight:500}}>الخطة الأصلية اقترحت</div>
          {salaryBreakdown.map((s,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:11.5,color:$.L2}}>
              <span>{s.role} × {s.count}</span>
              <span style={numFont}>{numWithCommas(s.monthly_each)} ريال/شهر</span>
            </div>
          ))}
        </Card>
      )}

      {team.length>0 && (
        <Card style={{padding:sp[4],marginBottom:sp[3],boxShadow:AD_SHADOW_SM,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontSize:10,color:$.L4}}>عدد أعضاء فريقك</div><div style={{...numFont,fontSize:19,fontWeight:600,color:$.L1,marginTop:2}}>{team.length}</div></div>
          <div style={{textAlign:"left"}}><div style={{fontSize:10,color:$.L4}}>إجمالي الرواتب الشهرية</div><div style={{...numFont,fontSize:16,fontWeight:600,color:$.L1,marginTop:2}}>{numWithCommas(totalMonthlyPay)}</div></div>
        </Card>
      )}

      <div style={{fontSize:11,color:$.L4,marginBottom:sp[2],fontWeight:500,paddingRight:2}}>فريقك الفعلي</div>

      {team.length===0 && !adding && (
        <div style={{padding:`${sp[5]}px`,textAlign:"center",marginBottom:sp[3]}}>
          <Users size={22} color={$.L4} style={{marginBottom:sp[2]}}/>
          <div style={{fontSize:12,color:$.L3}}>ما سجّلت أي عضو في فريقك بعد</div>
        </div>
      )}

      {team.map(t=>(
        <Card key={t.id} style={{padding:sp[4],marginBottom:sp[3],boxShadow:AD_SHADOW_SM}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:$.L1}}>{t.name}</div>
              {t.role && <div style={{fontSize:10.5,color:$.L3,marginTop:2}}>{t.role}</div>}
              <div style={{display:"flex",gap:sp[3],marginTop:sp[2],flexWrap:"wrap"}}>
                {t.phone && <span style={{fontSize:10.5,color:$.L4,direction:"ltr"}}>{t.phone}</span>}
                {t.monthly_pay && <span style={{...numFont,fontSize:10.5,color:$.L4}}>{numWithCommas(t.monthly_pay)} ريال/شهر</span>}
                {t.start_date && <span style={{fontSize:10.5,color:$.L4}}>منذ {fmtDate(t.start_date)}</span>}
              </div>
              {t.notes && <div style={{fontSize:10.5,color:$.L3,marginTop:sp[2],fontWeight:300,lineHeight:1.5}}>{t.notes}</div>}
            </div>
            <div style={{display:"flex",gap:4,flexShrink:0}}>
              <button onClick={()=>startEdit(t)} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Settings size={13} color={$.L4}/></button>
              <button onClick={()=>remove(t.id)} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Trash2 size={13} color={$.L4}/></button>
            </div>
          </div>
        </Card>
      ))}

      {adding ? (
        <Card style={{padding:sp[4],boxShadow:AD_SHADOW_SM}}>
          <div style={{fontSize:13,fontWeight:600,color:$.L1,marginBottom:sp[3]}}>{editId?"تعديل عضو الفريق":"عضو جديد"}</div>
          <input value={name} onChange={e=>setName(e.target.value.substring(0,60))} placeholder="الاسم" style={{width:"100%",background:$.F4,border:`1px solid ${$.sepL}`,borderRadius:10,padding:sp[3],color:$.L1,fontSize:13,fontFamily:"inherit",outline:"none",marginBottom:sp[2]}}/>
          <input value={role} onChange={e=>setRole(e.target.value.substring(0,60))} placeholder="الدور (مثال: باريستا)" style={{width:"100%",background:$.F4,border:`1px solid ${$.sepL}`,borderRadius:10,padding:sp[3],color:$.L1,fontSize:13,fontFamily:"inherit",outline:"none",marginBottom:sp[2]}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:sp[2],marginBottom:sp[2]}}>
            <input value={phone} onChange={e=>setPhone(e.target.value.substring(0,20))} placeholder="رقم التواصل" inputMode="tel" style={{width:"100%",background:$.F4,border:`1px solid ${$.sepL}`,borderRadius:10,padding:sp[3],color:$.L1,fontSize:13,fontFamily:"inherit",outline:"none",direction:"ltr",textAlign:"right"}}/>
            <input value={monthlyPay} onChange={e=>setMonthlyPay(e.target.value.replace(/[^\d.]/g,""))} placeholder="الراتب الشهري" inputMode="decimal" style={{width:"100%",background:$.F4,border:`1px solid ${$.sepL}`,borderRadius:10,padding:sp[3],color:$.L1,fontSize:13,fontFamily:"inherit",outline:"none"}}/>
          </div>
          <div style={{marginBottom:sp[2]}}>
            <div style={{fontSize:10.5,color:$.L4,marginBottom:sp[1]}}>تاريخ الانضمام (اختياري)</div>
            <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{width:"100%",background:$.F4,border:`1px solid ${$.sepL}`,borderRadius:10,padding:sp[3],color:$.L1,fontSize:13,fontFamily:"inherit",outline:"none"}}/>
          </div>
          <input value={notes} onChange={e=>setNotes(e.target.value.substring(0,150))} placeholder="ملاحظة (اختياري)" style={{width:"100%",background:$.F4,border:`1px solid ${$.sepL}`,borderRadius:10,padding:sp[3],color:$.L1,fontSize:13,fontFamily:"inherit",outline:"none",marginBottom:sp[3]}}/>
          <div style={{display:"flex",gap:sp[2]}}>
            <button onClick={save} disabled={!name.trim()||saving} style={{flex:1,background:$.blue,color:"#fff",border:"none",borderRadius:10,padding:sp[3],fontSize:13,fontWeight:600,fontFamily:"inherit",cursor:"pointer"}}>{saving?<Spinner sz={14}/>:(editId?"حفظ التعديل":"إضافة")}</button>
            <button onClick={resetForm} style={{flex:1,background:$.F4,color:$.L3,border:"none",borderRadius:10,padding:sp[3],fontSize:13,fontWeight:500,fontFamily:"inherit",cursor:"pointer"}}>إلغاء</button>
          </div>
        </Card>
      ) : (
        <div onClick={()=>setAdding(true)} style={{border:`1.3px dashed ${$.sepL}`,borderRadius:15,display:"flex",alignItems:"center",justifyContent:"center",gap:sp[2],padding:sp[6],color:$.L4,fontSize:12,cursor:"pointer"}}><Plus size={16}/>إضافة عضو للفريق</div>
      )}
    </div>
  );
}

// ═══════════════ المستندات — إدارة كاملة ═══════════════
function DocsSection({documents, onAdd, onStatusChange, onDelete}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const STATUS = {required:{label:"مطلوب",color:$.red},pending:{label:"قيد المراجعة",color:$.orange},uploaded:{label:"مكتمل",color:$.green}};
  async function submit() { if (!name.trim()) return; await onAdd(name.trim()); setName(""); setAdding(false); }
  return (
    <div>
      <Card style={{padding:0,overflow:"hidden",marginBottom:sp[3],boxShadow:AD_SHADOW}}>
        {documents.length===0 ? (
          <div style={{padding:`${sp[6]}px ${sp[5]}px`,textAlign:"center"}}><FileText size={22} color={$.L4} style={{marginBottom:sp[2]}}/><div style={{fontSize:12,color:$.L3,marginBottom:sp[1]}}>لا توجد مستندات بعد</div><div style={{fontSize:10.5,color:$.L4,fontWeight:300}}>مثال: عقد الإيجار، السجل التجاري، الرخصة البلدية</div></div>
        ) : documents.map(d=>(
          <div key={d.id} style={{display:"flex",alignItems:"center",gap:sp[3],padding:`${sp[3]}px ${sp[5]}px`,borderBottom:`1px solid ${$.sepL}`}}>
            <FileText size={16} color={$.L4}/>
            <div style={{flex:1,fontSize:12.5,color:$.L1,fontWeight:400}}>{d.name}</div>
            <select value={d.status} onChange={e=>onStatusChange(d.id,e.target.value)} style={{fontSize:10.5,fontWeight:600,color:STATUS[d.status].color,background:`${STATUS[d.status].color}14`,border:"none",borderRadius:20,padding:"5px 10px",fontFamily:"inherit"}}>
              {Object.entries(STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
            <button onClick={()=>onDelete(d.id)} style={{background:"none",border:"none",cursor:"pointer",padding:2}}><Trash2 size={13} color={$.L4}/></button>
          </div>
        ))}
      </Card>
      {adding ? (
        <Card style={{padding:sp[4],boxShadow:AD_SHADOW_SM}}>
          <input value={name} onChange={e=>setName(e.target.value.substring(0,80))} placeholder="اسم المستند (مثال: عقد الإيجار)" style={{width:"100%",background:$.F4,border:`1px solid ${$.sepL}`,borderRadius:10,padding:sp[3],color:$.L1,fontSize:13,fontFamily:"inherit",outline:"none",marginBottom:sp[3]}}/>
          <div style={{display:"flex",gap:sp[2]}}>
            <button onClick={submit} style={{flex:1,background:$.blue,color:"#fff",border:"none",borderRadius:10,padding:sp[3],fontSize:13,fontWeight:600,fontFamily:"inherit",cursor:"pointer"}}>حفظ</button>
            <button onClick={()=>setAdding(false)} style={{flex:1,background:$.F4,color:$.L3,border:"none",borderRadius:10,padding:sp[3],fontSize:13,fontWeight:500,fontFamily:"inherit",cursor:"pointer"}}>إلغاء</button>
          </div>
        </Card>
      ) : (
        <div onClick={()=>setAdding(true)} style={{border:`1.3px dashed ${$.sepL}`,borderRadius:15,display:"flex",alignItems:"center",justifyContent:"center",gap:sp[2],padding:sp[5],color:$.L4,fontSize:12,cursor:"pointer"}}><Plus size={16}/>إضافة مستند</div>
      )}
    </div>
  );
}

// ═══════════════ المستشار — رفيق يمشي معه خطوة بخطوة ═══════════════
function ChatSection({result, entries, messages, setMessages, user, analysisId, nextTask, isDemo}) {
  const [input, setInput] = useState(""); const [sending, setSending] = useState(false);
  const [err, setErr] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  async function send(overrideText) {
    const text = (overrideText !== undefined ? overrideText : input).trim();
    if (!text || sending) return;
    setInput(""); setErr(null); setSending(true);
    setMessages(prev => [...prev, { role:"user", content:text, id:"tmp-"+Date.now() }]);
    try {
      const res = await fetch("/api/advisor", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ analysis: result, financeEntries: entries, history: messages.map(m=>({role:m.role,content:m.content})), message: text })
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "تعذّر الوصول للمستشار"); return; }
      setMessages(prev => [...prev, { role:"advisor", content:data.reply, id:"tmp-a-"+Date.now() }]);
      if (!isDemo && analysisId) { saveAdvisorMessage(analysisId,user.id,"user",text); saveAdvisorMessage(analysisId,user.id,"advisor",data.reply); }
    } catch(e) { setErr("تعذّر الاتصال، تحقق من الإنترنت"); } finally { setSending(false); }
  }

  return (
    <Card style={{padding:0,overflow:"hidden",boxShadow:AD_SHADOW}}>
      <div ref={scrollRef} style={{height:360,overflowY:"auto",padding:`${sp[4]}px ${sp[5]}px`}}>
        {messages.length===0 && <div style={{fontSize:12,color:$.L4,textAlign:"center",padding:`${sp[7]}px 0`,fontWeight:300}}>اسأل المستشار عن أرقامك أو مشروعك</div>}
        {messages.map((m,i)=>(
          <div key={m.id||i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:sp[3]}}>
            <div style={{maxWidth:"80%",padding:`${sp[3]}px ${sp[4]}px`,borderRadius:14,fontSize:12.5,lineHeight:1.8,fontWeight:300,background:m.role==="user"?$.F4:`${$.blue}0F`,border:m.role==="advisor"?`1px solid ${$.blue}22`:"none",color:$.L1}}>{m.content}</div>
          </div>
        ))}
        {sending && <div style={{display:"flex"}}><div style={{padding:`${sp[3]}px ${sp[4]}px`,borderRadius:14,background:`${$.blue}0F`}}><Spinner sz={14}/></div></div>}
      </div>
      {err && <div style={{padding:`${sp[2]}px ${sp[5]}px`,fontSize:11,color:$.orange}}>{err}</div>}
      {nextTask && messages.length===0 && (
        <div onClick={()=>send(`أبي أناقش الخطوة الجاية: ${nextTask.text}`)} style={{margin:`0 ${sp[4]}px ${sp[2]}px`,padding:`${sp[2]}px ${sp[3]}px`,background:`${$.blue}0F`,border:`1px solid ${$.blue}25`,borderRadius:10,fontSize:11,color:$.blue,cursor:"pointer"}}>
          ناقش معي: {nextTask.text}
        </div>
      )}
      <div style={{display:"flex",gap:sp[2],padding:`${sp[3]}px ${sp[4]}px`,borderTop:`1px solid ${$.sepL}`}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="اكتب سؤالك…" style={{flex:1,background:$.F4,border:"none",borderRadius:12,padding:`${sp[3]}px ${sp[4]}px`,color:$.L1,fontSize:13,fontFamily:"inherit",outline:"none"}}/>
        <button onClick={()=>send()} disabled={!input.trim()||sending} style={{width:38,height:38,borderRadius:11,background:input.trim()?$.blue:$.F3,border:"none",cursor:input.trim()?"pointer":"default",flexShrink:0}}><ArrowRight size={16} color={input.trim()?"#fff":$.L4} style={{transform:"rotate(180deg)"}}/></button>
      </div>
    </Card>
  );
}

// ═══════════════ السجل ═══════════════
function LogSection({entries, messages, documents, metrics, team}) {
  const events = [
    ...entries.map(e=>({date:e.created_at||e.entry_date, text:`إدخال مالي جديد — ربح ${numWithCommas(e.profit||0)} ريال`, color:$.blue})),
    ...documents.filter(d=>d.status==="uploaded").map(d=>({date:d.created_at, text:`اكتمل مستند: ${d.name}`, color:$.green})),
    ...metrics.flatMap(m=>m.entries.map(e=>({date:e.created_at, text:`${m.name}: ${numWithCommas(e.value)}`, color:$.purple}))),
    ...(team||[]).map(t=>({date:t.created_at, text:`انضم للفريق: ${t.name}${t.role?` — ${t.role}`:""}`, color:$.teal}))
  ].filter(e=>e.date).sort((a,b)=>new Date(b.date)-new Date(a.date));

  if (events.length===0) return <Card style={{padding:sp[7],textAlign:"center",boxShadow:AD_SHADOW}}><Clock size={22} color={$.L4} style={{marginBottom:sp[2]}}/><div style={{fontSize:12,color:$.L3}}>لا يوجد نشاط مسجّل بعد</div><div style={{fontSize:10.5,color:$.L4,marginTop:2,fontWeight:300}}>كل إدخال أو مستند أو مؤشر يظهر هنا تلقائياً بالترتيب الزمني</div></Card>;

  return (
    <Card style={{padding:sp[5],boxShadow:AD_SHADOW}}>
      {events.slice(0,30).map((e,i)=>(
        <div key={i} style={{display:"flex",gap:sp[3],padding:`${sp[2]}px 0`,borderBottom:i<events.length-1?`1px solid ${$.sepL}`:"none"}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:e.color,marginTop:6,flexShrink:0}}/>
          <div><div style={{...numFont,fontSize:9.5,color:$.L4}}>{fmtDate(e.date)}</div><div style={{fontSize:11.5,color:$.L2,marginTop:2,fontWeight:300}}>{e.text}</div></div>
        </div>
      ))}
    </Card>
  );
}
const MAX_EDITS = 3;

function EditPanel({result, onUpdated, isPremium, onNeedUpgrade}) {
  const [open,setOpen]=useState(false);
  const [rent,setRent]=useState("");
  const [budget,setBudget]=useState("");
  const [staff,setStaff]=useState("");
  const [equip,setEquip]=useState("");
  const [note,setNote]=useState("");
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState(null);
  const [done,setDone]=useState(null);

  const f = result.financial_analysis || {};
  const mc = f.monthly_costs || {};
  const sc = f.setup_costs || {};
  const currentRentYearly = (mc.rent || 0) * 12;
  const currentEquip = sc.equipment || 0;
  const currentBudget = parseInt(result.budget) || 0;
  const editCount = result.edit_count || 0;
  const editsLeft = Math.max(0, MAX_EDITS - editCount);
  const limitReached = editsLeft <= 0;

  function fmtInput(v, setter) {
    const raw = v.replace(/\D/g, "");
    if (raw === "") { setter(""); return; }
    setter(numWithCommas(parseInt(raw)));
  }

  const hasChanges = rent.trim() || budget.trim() || staff || equip.trim() || note.trim();

  async function recalc() {
    if (!hasChanges || busy || limitReached) return;
    setBusy(true); setErr(null); setDone(null);
    try {
      const edits = {};
      if (rent.trim()) edits.rent = rent.replace(/,/g,"");
      if (budget.trim()) edits.budget = budget.replace(/,/g,"");
      if (staff) edits.staff_count = staff;
      if (equip.trim()) edits.equipment = equip.replace(/,/g,"");
      if (note.trim()) edits.note = note.trim();

      const updated = await apiCall("recalc", { original: result, edits });
      updated.edit_count = editCount + 1;
      setDone(updated._edit_note || "تم تحديث التحليل");
      onUpdated(updated);
      setRent(""); setBudget(""); setStaff(""); setEquip(""); setNote("");
      setTimeout(()=>{ setOpen(false); setDone(null); }, 2200);
    } catch(e) {
      setErr(e.message || "تعذّر إعادة الحساب");
    } finally {
      setBusy(false);
    }
  }

  if (!isPremium) {
    return (
      <div className="no-print" style={{marginBottom:sp[4]}}>
        <button onClick={onNeedUpgrade} style={{width:"100%",background:$.surface,color:$.L3,border:`1px solid ${$.sepL}`,borderRadius:14,padding:`${sp[4]}px`,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <Lock size={14} color={$.L4}/>
          عدّل معطياتي وأعد الحساب — للمشتركين
        </button>
      </div>
    );
  }

  return (
    <div className="no-print" style={{marginBottom:sp[4]}}>
      <button onClick={()=>setOpen(!open)} style={{width:"100%",background:$.surface,color:$.L1,border:`1px solid ${open?$.blue+"66":$.sepL}`,borderRadius:14,padding:`${sp[4]}px`,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all .25s"}}>
        <Settings size={16} strokeWidth={2.2} color={$.blue}/>
        {open ? "إخفاء التعديل" : "عدّل معطياتي وأعد الحساب"}
      </button>

      {open && (
        <Card style={{marginTop:sp[3],padding:0,overflow:"hidden"}}>
          <div style={{padding:`${sp[5]}px ${sp[5]}px ${sp[2]}px`}}>
            <div style={{fontSize:16,fontWeight:800,color:$.L1,marginBottom:sp[2]}}>عدّل الأرقام الفعلية</div>
            <div style={{fontSize:12,color:$.L3,lineHeight:1.7}}>لقيت محل بسعر مختلف؟ تغيّرت ميزانيتك؟ حدّث ما تعرفه فعلياً — والباقي يبقى كما هو.</div>
            <div style={{fontSize:11,color:limitReached?$.orange:$.L4,marginTop:sp[2],fontWeight:600}}>{limitReached ? "وصلت الحد الأقصى للتعديلات على هذا التحليل" : `تبقى لك ${editsLeft} من ${MAX_EDITS} تعديلات على هذا التحليل`}</div>
          </div>

          {limitReached ? (
            <div style={{padding:`${sp[4]}px ${sp[5]}px ${sp[6]}px`}}>
              <div style={{background:`${$.orange}10`,border:`1px solid ${$.orange}30`,borderRadius:12,padding:`${sp[4]}px`,fontSize:13,color:$.L2,lineHeight:1.7}}>
                استخدمت الحد الأقصى ({MAX_EDITS}) من التعديلات على هذا التحليل. لتجربة سيناريو مختلف تماماً (فكرة أو مدينة أخرى)، ابدأ تحليلاً جديداً من الرئيسية.
              </div>
            </div>
          ) : (
          <div style={{padding:`${sp[4]}px ${sp[5]}px ${sp[5]}px`,display:"flex",flexDirection:"column",gap:sp[4]}}>
            <FormField label="الإيجار السنوي الفعلي">
              <input value={rent} onChange={e=>fmtInput(e.target.value,setRent)} inputMode="numeric" placeholder={currentRentYearly ? numWithCommas(currentRentYearly) : "90,000"}
                style={{width:"100%",background:$.F4,border:`1px solid ${$.sepL}`,borderRadius:12,padding:`${sp[3]}px ${sp[4]}px`,color:$.L1,fontSize:15,fontFamily:"inherit",outline:"none"}}/>
              {currentRentYearly>0 && <div style={{fontSize:11,color:$.L4,marginTop:sp[2]}}>التقدير الحالي: {numWithCommas(currentRentYearly)} ريال سنوياً</div>}
            </FormField>

            <FormField label="الميزانية الفعلية">
              <input value={budget} onChange={e=>fmtInput(e.target.value,setBudget)} inputMode="numeric" placeholder={currentBudget ? numWithCommas(currentBudget) : "500,000"}
                style={{width:"100%",background:$.F4,border:`1px solid ${$.sepL}`,borderRadius:12,padding:`${sp[3]}px ${sp[4]}px`,color:$.L1,fontSize:15,fontFamily:"inherit",outline:"none"}}/>
            </FormField>

            <FormField label="عدد الموظفين">
              <select value={staff} onChange={e=>setStaff(e.target.value)}
                style={{width:"100%",background:$.F4,border:`1px solid ${$.sepL}`,borderRadius:12,padding:`${sp[3]}px ${sp[4]}px`,color:staff?$.L1:$.L4,fontSize:15,fontFamily:"inherit",outline:"none",appearance:"none"}}>
                <option value="">بدون تغيير</option>
                <option value="1-3">1-3</option>
                <option value="4-5">4-5</option>
                <option value="6-10">6-10</option>
                <option value="أكثر من 10">أكثر من 10</option>
              </select>
            </FormField>

            <FormField label="تكلفة المعدات الفعلية">
              <input value={equip} onChange={e=>fmtInput(e.target.value,setEquip)} inputMode="numeric" placeholder={currentEquip ? numWithCommas(currentEquip) : "50,000"}
                style={{width:"100%",background:$.F4,border:`1px solid ${$.sepL}`,borderRadius:12,padding:`${sp[3]}px ${sp[4]}px`,color:$.L1,fontSize:15,fontFamily:"inherit",outline:"none"}}/>
              {currentEquip>0 && <div style={{fontSize:11,color:$.L4,marginTop:sp[2]}}>التقدير الحالي: {numWithCommas(currentEquip)} ريال</div>}
            </FormField>

            <FormField label="ملاحظة واحدة (اختياري)">
              <input value={note} onChange={e=>setNote(e.target.value.substring(0,150))} maxLength={150} placeholder="مثال: المحل جاهز ولا يحتاج ديكور"
                style={{width:"100%",background:$.F4,border:`1px solid ${$.sepL}`,borderRadius:12,padding:`${sp[3]}px ${sp[4]}px`,color:$.L1,fontSize:14,fontFamily:"inherit",outline:"none"}}/>
              <div style={{fontSize:10,color:$.L4,textAlign:"left",marginTop:sp[2]}}>{note.length}/150</div>
            </FormField>

            {err && <div style={{background:`${$.red}12`,border:`1px solid ${$.red}33`,borderRadius:12,padding:`${sp[3]}px ${sp[4]}px`,color:$.red,fontSize:13}}>{err}</div>}

            {done && (
              <div style={{background:`${$.green}12`,border:`1px solid ${$.green}33`,borderRadius:12,padding:`${sp[3]}px ${sp[4]}px`,display:"flex",alignItems:"flex-start",gap:8}}>
                <CheckCircle size={16} color={$.green} strokeWidth={2.2} style={{flexShrink:0,marginTop:2}}/>
                <div style={{color:$.green,fontSize:13,lineHeight:1.7}}>{done}</div>
              </div>
            )}

            <button onClick={recalc} disabled={!hasChanges||busy}
              style={{width:"100%",background:hasChanges&&!busy?$.blue:$.F4,color:hasChanges&&!busy?"#fff":$.L4,border:"none",borderRadius:14,padding:`${sp[4]}px`,fontSize:15,fontWeight:800,cursor:hasChanges&&!busy?"pointer":"default",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:hasChanges&&!busy?`0 6px 20px ${$.blue}44`:"none",transition:"all .25s"}}>
              {busy ? <><Spinner sz={16}/>جاري إعادة الحساب…</> : "أعد الحساب بهذه الأرقام"}
            </button>
          </div>
          )}
        </Card>
      )}
    </div>
  );
}

function splitSummary(text) {
  if (!text) return [];
  return String(text)
    .split(/(?:\.|؛|؟|\?|!)\s+/)
    .map(s => s.trim().replace(/[.؛]+$/, ""))
    .filter(s => s.length > 3);
}

function summaryMeta(s) {
  if (/(ميزانيتك|الميزانية)/.test(s) && /(تكفي|كافية|فائض)/.test(s)) return { label:"الميزانية", Icon:DollarSign, color:$.blue };
  if (/(تحتاج|ينقص|إضافية|عجز|الحد الأدنى)/.test(s)) return { label:"المبلغ المطلوب", Icon:TrendingUp, color:$.orange };
  if (/(يقلقني|قلق|مخاطر|صعوب|تحدي|خطر|المنافسة|حتى لو)/.test(s)) return { label:"ما يقلقني", Icon:AlertTriangle, color:$.red };
  if (/(نجاح|يحدد|أهم ما)/.test(s)) return { label:"مفتاح النجاح", Icon:Target, color:$.green };
  return { label:"ملاحظة", Icon:Info, color:$.indigo };
}

function AnalysisScreen({result, onUpdate, user, isPremium, onNeedUpgrade}) {
  const screen = useScreenSize();
  const [tab,setTab]=useState(0);
  const [printMode,setPrintMode]=useState(false);
  if (!result) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:`${sp[16]}px ${sp[5]}px`,gap:sp[3],color:$.L3,minHeight:"60vh"}}>
      <BarChart2 size={48} strokeWidth={1.3}/>
      <p style={{fontSize:17,fontWeight:600,color:$.L2}}>لا يوجد تحليل بعد</p>
      <p style={{fontSize:14,textAlign:"center"}}>ادخل للرئيسية وحلّل فكرتك أولاً</p>
    </div>
  );
  const pos=result.decision_type==="positive";
  const hGrad=pos?$.hdrGreen:$.hdrRed;
  const m = result.market_analysis || {};
  const f = result.financial_analysis || {};
  const sc = f.setup_costs || {};
  const mc = f.monthly_costs || {};
  const rp = f.revenue_projection || {};
  const sw = result.swot || {};
  const loc = result.locations || {};
  const containerStyle = screen.isDesktop ? {maxWidth:1100, margin:"0 auto"} : screen.isTablet ? {maxWidth:720, margin:"0 auto"} : {};

  return (
    <div className="analysis-print">
      <div className="print-only" style={{display:"none"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"2px solid #1D4ED8",paddingBottom:12,marginBottom:18}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <img src="/logo.png" alt="هامور" style={{width:44,height:44,objectFit:"contain"}}/>
            <div>
              <div style={{fontSize:20,fontWeight:800,color:"#0B1320"}}>هامور</div>
              <div style={{fontSize:10,color:"#6B7280"}}>دراسة جدوى ذكية للسوق السعودي</div>
            </div>
          </div>
          <div style={{textAlign:"left"}}>
            <div style={{fontSize:12,fontWeight:700,color:"#0B1320"}}>تقرير تحليل مشروع</div>
            <div style={{fontSize:10,color:"#6B7280"}}>{gregorianDate(new Date())}</div>
          </div>
        </div>
        <div style={{fontSize:15,fontWeight:800,color:"#0B1320",marginBottom:4}}>القرار: {result.decision}</div>
        <div style={{fontSize:12,color:"#374151",marginBottom:16,lineHeight:1.7}}>{result.summary}</div>
      </div>
      <div style={{background:hGrad,position:"relative",overflow:"hidden",padding:screen.isDesktop?`${sp[14]}px ${sp[10]}px ${sp[12]}px`:`${sp[14]}px ${sp[5]}px ${sp[10]}px`,borderRadius:"0 0 36px 36px"}} className="no-print">
        <MeshBg mode="white" opacity={0.4}/>
        <div style={{...containerStyle,position:"relative",display:"flex",alignItems:"center",justifyContent:"space-between",gap:sp[4]}}>
          <div style={{flex:1}}>
            <Chip text="نتيجة التحليل" color="rgba(255,255,255,0.88)" bg="rgba(255,255,255,0.20)"/>
            <div style={{fontSize:screen.isDesktop?34:26,fontWeight:800,color:"#fff",letterSpacing:"-0.6px",margin:`${sp[3]}px 0 ${sp[2]}px`}}>{result.decision}</div>
            {(() => {
              const parts = splitSummary(result.summary);
              const short = parts.length > 2 ? parts.slice(0,2).join("؛ ") + "." : result.summary;
              return (<>
                <p style={{fontSize:screen.isDesktop?15:13,color:"rgba(255,255,255,0.88)",lineHeight:1.7,maxWidth:screen.isDesktop?500:280}}>{short}</p>
                {parts.length > 2 && <div style={{fontSize:11.5,color:"rgba(255,255,255,0.7)",marginTop:6}}>التفاصيل الكاملة مقسّمة بالأسفل ↓</div>}
              </>);
            })()}
          </div>
          <ScoreRing value={result.score} size={screen.isDesktop?140:104} track={screen.isDesktop?11:9} color="rgba(255,255,255,0.95)"/>
        </div>
      </div>

      <div style={{padding:screen.isDesktop?`${sp[5]}px ${sp[10]}px ${sp[16]}px`:`${sp[4]}px ${sp[5]}px ${sp[10]}px`,marginTop:-sp[3]}}>
        <div style={containerStyle}>
          <div style={{display:"grid",gridTemplateColumns:screen.isMobile?"1fr 1fr":"1fr 1fr 1fr 1fr",gap:sp[3],marginBottom:sp[4]}}>
            {[{Icon:TrendingUp,label:"طلب السوق",val:result.market_demand,color:$.blue},{Icon:Users,label:"المنافسة",val:result.competition,color:$.orange},{Icon:Briefcase,label:"التكلفة",val:result.cost_level,color:$.purple},{Icon:Shield,label:"المخاطر",val:result.risk_level,color:$.red}].map(({Icon,label,val,color})=>(
              <Card key={label} style={{padding:`${sp[4]}px`}}>
                <IconBadge Icon={Icon} color={color} size={34}/>
                <div style={{fontSize:11,color:$.L3,marginTop:sp[2],marginBottom:3}}>{label}</div>
                <div style={{fontSize:16,fontWeight:700,color:$.L1}}>{val}</div>
              </Card>
            ))}
          </div>

          {/* زر تصدير PDF مخفي مؤقتاً - يُعاد تفعيله لاحقاً. لإعادة التفعيل: احذف التعليق وأرجع الزر */}
          {false && <button onClick={()=>{
            if(typeof window==="undefined") return;
            setPrintMode(true);
            setTimeout(()=>{ window.print(); setPrintMode(false); }, 300);
          }} className="no-print" style={{width:"100%",background:$.surface,color:$.L2,border:`1px solid ${$.sepL}`,borderRadius:12,padding:`${sp[3]}px`,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:sp[4]}}>
            <Download size={15}/>تصدير التحليل PDF
          </button>}

          {onUpdate && <EditPanel result={result} onUpdated={onUpdate} isPremium={isPremium} onNeedUpgrade={onNeedUpgrade}/>}

          <div className="no-print" style={{background:$.F3,borderRadius:12,padding:3,display:"flex",gap:2,marginBottom:sp[4],overflowX:"auto"}}>
            {TABS.map((t,i)=>{
              const locked = !isPremium && LOCKED_TABS.includes(i);
              return (
                <button key={t} onClick={()=> locked ? onNeedUpgrade() : setTab(i)} style={{flex:"none",minWidth:screen.isMobile?"23%":"auto",padding:`${sp[2]}px ${sp[3]}px`,borderRadius:10,border:"none",cursor:"pointer",fontFamily:"inherit",background:tab===i&&!locked?$.surface:"transparent",color:tab===i&&!locked?$.blue:(locked?$.L4:$.L3),fontSize:12,fontWeight:tab===i&&!locked?700:500,boxShadow:tab===i&&!locked?SH.card:"none",whiteSpace:"nowrap",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                  {locked && <Lock size={10}/>}{t}
                </button>
              );
            })}
          </div>

          <div style={{display:"grid",gridTemplateColumns:screen.isDesktop?"1fr 1fr":"1fr",gap:sp[4]}}>
            {(tab===0||printMode) && (<>
              {splitSummary(result.summary).length > 2 && (
                <div style={{gridColumn:"1 / -1"}}>
                  <Section title="ملخص التحليل بالتفصيل" Icon={FileText} color={$.blue} subtitle="الملخص مقسّم لنقاط واضحة">
                    {splitSummary(result.summary).map((s,i)=>{
                      const {label,Icon,color} = summaryMeta(s);
                      return (
                        <div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3],padding:`${sp[3]}px`,background:`${color}0D`,borderRadius:10,borderRight:`3px solid ${color}`}}>
                          <IconBadge Icon={Icon} color={color} size={30}/>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:12,fontWeight:700,color:color,marginBottom:3}}>{label}</div>
                            <div style={{fontSize:14,color:$.L2,lineHeight:1.7}}>{s}</div>
                          </div>
                        </div>
                      );
                    })}
                  </Section>
                </div>
              )}
              {sw.strengths?.length>0 && <Section title="نقاط القوة" Icon={CheckCircle} color={$.green} subtitle={`${sw.strengths.length} نقاط قوة تدعم المشروع`}>
                {sw.strengths.map((s,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3],padding:`${sp[3]}px`,background:`${$.green}06`,borderRadius:10,borderRight:`3px solid ${$.green}`}}>
                    <div style={{width:24,height:24,borderRadius:"50%",background:$.green,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{i+1}</div>
                    <span style={{fontSize:14,color:$.L2,lineHeight:1.7}}>{s}</span>
                  </div>
                ))}
              </Section>}
              {sw.weaknesses?.length>0 && <Section title="نقاط الضعف" Icon={TrendingDown} color={$.orange} subtitle="نقاط تحتاج معالجة">
                {sw.weaknesses.map((s,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3],padding:`${sp[3]}px`,background:`${$.orange}06`,borderRadius:10,borderRight:`3px solid ${$.orange}`}}>
                    <div style={{width:24,height:24,borderRadius:"50%",background:$.orange,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>!</div>
                    <span style={{fontSize:14,color:$.L2,lineHeight:1.7}}>{s}</span>
                  </div>
                ))}
              </Section>}
              {sw.opportunities?.length>0 && <Section title="الفرص المتاحة" Icon={Target} color={$.blue} subtitle="فرص يمكن استغلالها">
                {sw.opportunities.map((s,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3],padding:`${sp[3]}px`,background:`${$.blue}06`,borderRadius:10,borderRight:`3px solid ${$.blue}`}}>
                    <Sparkles size={16} color={$.blue} style={{marginTop:2,flexShrink:0}}/>
                    <span style={{fontSize:14,color:$.L2,lineHeight:1.7}}>{s}</span>
                  </div>
                ))}
              </Section>}
              {sw.threats?.length>0 && <Section title="التهديدات" Icon={AlertTriangle} color={$.red} subtitle="مخاطر خارجية محتملة">
                {sw.threats.map((s,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3],padding:`${sp[3]}px`,background:`${$.red}06`,borderRadius:10,borderRight:`3px solid ${$.red}`}}>
                    <AlertTriangle size={16} color={$.red} style={{marginTop:2,flexShrink:0}}/>
                    <span style={{fontSize:14,color:$.L2,lineHeight:1.7}}>{s}</span>
                  </div>
                ))}
              </Section>}
              <div style={{gridColumn:screen.isDesktop?"span 2":"auto"}}>
                {result.recommendations?.length>0 && <Section title="التوصيات الاستراتيجية" Icon={Lightbulb} color={$.purple} subtitle="خطوات عملية للنجاح">
                  {result.recommendations.map((s,i)=>{
                    const isObj = s && typeof s === "object";
                    const title = isObj ? s.title : s;
                    const detail = isObj ? s.detail : null;
                    const priority = isObj ? s.priority : null;
                    return (
                      <div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3],background:`${$.purple}06`,padding:`${sp[4]}px`,borderRadius:12}}>
                        <div style={{width:28,height:28,borderRadius:"50%",background:$.purple,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0}}>{i+1}</div>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:detail?4:0,flexWrap:"wrap"}}>
                            <span style={{fontSize:14,fontWeight:700,color:$.L1,lineHeight:1.6}}>{title}</span>
                            {priority && <span style={{fontSize:10,fontWeight:700,color:priority==="عالية"?$.red:$.L4,background:priority==="عالية"?`${$.red}12`:$.F3,padding:"2px 8px",borderRadius:6}}>{priority}</span>}
                          </div>
                          {detail && <p style={{fontSize:13,color:$.L2,lineHeight:1.7}}>{detail}</p>}
                        </div>
                      </div>
                    );
                  })}
                </Section>}
                {result.kpis?.length>0 && <Section title="مؤشرات الأداء الرئيسية" Icon={Activity} color={$.teal} subtitle="KPIs لمتابعة نجاح المشروع">
                  {result.kpis.map((k,i)=>(
                    <div key={i} style={{padding:`${sp[3]}px 0`,borderBottom:i<result.kpis.length-1?`0.5px solid ${$.sepL}`:"none"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:k.description?6:0}}>
                        <span style={{fontSize:14,fontWeight:600,color:$.L1}}>{k.name}</span>
                        <span style={{fontSize:15,fontWeight:800,color:$.teal}}>{k.target}</span>
                      </div>
                      {k.description && <p style={{fontSize:12,color:$.L3,lineHeight:1.6}}>{k.description}</p>}
                    </div>
                  ))}
                </Section>}
              </div>
            </>)}

            {(tab===1||printMode) && (<>
              <Section title="حجم السوق والجمهور" Icon={Users} color={$.blue}>
                <Row label="حجم السوق الإجمالي" value={m.market_size||"-"} note="القيمة السوقية الكاملة للقطاع"/>
                <Row label="الفئة المستهدفة" value={m.target_audience||"-"}/>
                <Row label="أنماط الشراء" value={m.buying_patterns||"-"}/>
                <Row label="الموسمية" value={m.seasonality||"-"} note="فترات الذروة والتراجع"/>
                <Row label="الحصة المتوقعة" value={m.expected_market_share||"-"} valueColor={$.blue} bold note="نسبة استحواذك من السوق"/>
                <Row label="إمكانيات النمو" value={m.growth_potential||"-"}/>
              </Section>
              {(m.demand_drivers?.length>0 || m.market_gaps?.length>0) && <Section title="عوامل الطلب وفرص السوق" Icon={TrendingUp} color={$.green}>
                {m.demand_drivers?.length>0 && <div style={{marginBottom:m.market_gaps?.length>0?sp[4]:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:$.L1,marginBottom:sp[2]}}>عوامل ترفع الطلب</div>
                  {m.demand_drivers.map((d,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[2],marginBottom:sp[2]}}>
                      <TrendingUp size={14} color={$.green} style={{flexShrink:0,marginTop:3}}/>
                      <span style={{fontSize:13,color:$.L2,lineHeight:1.6}}>{d}</span>
                    </div>
                  ))}
                </div>}
                {m.market_gaps?.length>0 && <div>
                  <div style={{fontSize:13,fontWeight:700,color:$.L1,marginBottom:sp[2]}}>فجوات تقدر تستغلها</div>
                  {m.market_gaps.map((g,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[2],marginBottom:sp[2],background:`${$.green}06`,padding:`${sp[3]}px`,borderRadius:10}}>
                      <Lightbulb size={14} color={$.green} style={{flexShrink:0,marginTop:3}}/>
                      <span style={{fontSize:13,color:$.L2,lineHeight:1.6}}>{g}</span>
                    </div>
                  ))}
                </div>}
              </Section>}
              {/* قسم المنافسين مخفي. لإعادة التفعيل: احذف false && */}
              {false && m.competitors?.length>0 && <Section title="المنافسون الرئيسيون" Icon={Briefcase} color={$.orange} subtitle={`${m.competitors.length} منافسين حقيقيين من البحث الحديث`}>
                {m.competitors.map((c,i)=>(
                  <div key={i} style={{padding:`${sp[4]}px`,borderBottom:i<m.competitors.length-1?`0.5px solid ${$.sepL}`:"none",background:`${$.orange}04`,borderRadius:10,marginBottom:sp[2]}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:sp[2],flexWrap:"wrap",gap:sp[2]}}>
                      <div style={{display:"flex",alignItems:"center",gap:sp[2]}}>
                        <Star size={15} color={$.orange} fill={$.orange}/>
                        <span style={{fontSize:15,fontWeight:700,color:$.L1}}>{c.name}</span>
                      </div>
                      <div style={{display:"flex",gap:sp[2]}}>
                        {c.market_position && <span style={{fontSize:10,fontWeight:700,color:$.orange,background:`${$.orange}12`,padding:"2px 8px",borderRadius:6}}>{c.market_position}</span>}
                        {c.price_range && <span style={{fontSize:10,fontWeight:700,color:$.L4,background:$.F3,padding:"2px 8px",borderRadius:6}}>{c.price_range}</span>}
                      </div>
                    </div>
                    {c.strength && <div style={{marginBottom:sp[2]}}>
                      <div style={{fontSize:11,fontWeight:700,color:$.L3,marginBottom:2}}>قوّتهم</div>
                      <p style={{fontSize:13,color:$.L2,lineHeight:1.6}}>{c.strength}</p>
                    </div>}
                    {c.weakness && <div style={{padding:`${sp[2]}px ${sp[3]}px`,background:`${$.green}08`,borderRadius:8,borderRight:`2px solid ${$.green}`}}>
                      <div style={{fontSize:11,fontWeight:700,color:$.green,marginBottom:2}}>الثغرة — فرصتك</div>
                      <p style={{fontSize:12,color:$.L2,lineHeight:1.5}}>{c.weakness}</p>
                    </div>}
                  </div>
                ))}
              </Section>}
              {result.is_physical_location !== false && (loc.best || loc.worst) && <div style={{gridColumn:screen.isDesktop?"span 2":"auto"}}>
                <Section title="تحليل المواقع" Icon={MapPin} color={$.green} subtitle="الموقع الأفضل والأسوأ للمشروع">
                  <div style={{display:"grid",gridTemplateColumns:screen.isDesktop||screen.isTablet?"1fr 1fr":"1fr",gap:sp[3]}}>
                    {[{type:"الموقع الأفضل",color:$.green,d:loc.best,icon:CheckCircle},{type:"الموقع الأسوأ",color:$.red,d:loc.worst,icon:XCircle}].map(({type,color,d,icon:Icon})=>d && (
                      <div key={type} style={{background:`${color}06`,border:`1.5px solid ${color}25`,borderRadius:14,padding:`${sp[4]}px`}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:sp[3]}}>
                          <div>
                            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                              <Icon size={16} color={color}/>
                              <Chip text={type} color={color} bg={`${color}16`}/>
                            </div>
                            <div style={{fontSize:16,fontWeight:700,color:$.L1}}>{d.name}</div>
                          </div>
                          <div style={{fontSize:28,fontWeight:800,color}}>{d.score}<span style={{fontSize:14,color:$.L4}}>%</span></div>
                        </div>
                        <Bar pct={d.score||0} color={color}/>
                        {d.reason && <p style={{fontSize:13,color:$.L2,lineHeight:1.7,marginTop:sp[3]}}>{d.reason}</p>}
                      </div>
                    ))}
                  </div>
                </Section>
              </div>}
            </>)}

            {(tab===2||printMode) && (<>
              <Section title="تكلفة التأسيس" Icon={Briefcase} color={$.purple} subtitle="استثمار لمرة واحدة - التكاليف الأولية">
                <MoneyRow label="ضمان الإيجار" value={sc.rent_deposit} note="عادة 3-6 أشهر إيجار"/>
                <MoneyRow label="التجهيز والديكور" value={sc.renovation}/>
                <MoneyRow label="المعدات والأثاث" value={sc.equipment}/>
                {result.equipment_breakdown?.length>0 && <div style={{margin:`${sp[1]}px 0 ${sp[2]}px`,padding:`${sp[2]}px ${sp[3]}px`,background:`${$.purple}05`,borderRadius:8,borderRight:`2px solid ${$.purple}30`}}>
                  {result.equipment_breakdown.map((e,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"3px 0"}}>
                      <span style={{fontSize:12,color:$.L3}}>{e.item}</span>
                      <span style={{fontSize:12,fontWeight:600,color:$.L2,direction:"ltr"}}>{fmt(e.cost)} ﷼</span>
                    </div>
                  ))}
                </div>}
                <MoneyRow label="التراخيص والتسجيل" value={sc.licenses} note="السجل التجاري + الرخص البلدية"/>
                <MoneyRow label="المخزون الأولي" value={sc.initial_inventory}/>
                <MoneyRow label="تسويق الإطلاق" value={sc.marketing_launch}/>
                <MoneyRow label="رأس مال تشغيلي" value={sc.working_capital} note="لتغطية أول 3-6 أشهر"/>
                <div style={{marginTop:sp[3],paddingTop:sp[3],borderTop:`2px solid ${$.purple}30`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:15,fontWeight:700,color:$.L1}}>إجمالي تكلفة التأسيس</span>
                  <span style={{fontSize:22,fontWeight:800,color:$.purple,display:"inline-flex",alignItems:"center",gap:6,direction:"ltr"}}>
                    <span>{fmt(sc.total)}</span><span style={{fontWeight:700}}>﷼</span>
                  </span>
                </div>
                {f.setup_costs_notes && <div style={{marginTop:sp[3],background:`${$.purple}07`,borderRadius:10,padding:`${sp[3]}px`,fontSize:12,color:$.L2,lineHeight:1.7}}>{f.setup_costs_notes}</div>}
              </Section>
              <Section title="التكاليف الشهرية" Icon={Calendar} color={$.orange} subtitle="المصاريف الشهرية المتكررة">
                <MoneyRow label="الإيجار الشهري" value={mc.rent}/>
                <MoneyRow label="الرواتب والأجور" value={mc.salaries} note="رواتب الموظفين والتأمينات"/>
                <MoneyRow label="فواتير الخدمات" value={mc.utilities} note="كهرباء، ماء، إنترنت"/>
                <MoneyRow label="المواد الخام" value={mc.materials}/>
                <MoneyRow label="التسويق" value={mc.marketing}/>
                <MoneyRow label="الصيانة" value={mc.maintenance}/>
                <MoneyRow label="مصاريف أخرى" value={mc.other}/>
                <div style={{marginTop:sp[3],paddingTop:sp[3],borderTop:`2px solid ${$.orange}30`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:15,fontWeight:700,color:$.L1}}>الإجمالي الشهري</span>
                  <span style={{fontSize:22,fontWeight:800,color:$.orange,display:"inline-flex",alignItems:"center",gap:6,direction:"ltr"}}>
                    <span>{fmt(mc.total)}</span><span style={{fontWeight:700}}>﷼</span>
                  </span>
                </div>
                {f.monthly_costs_notes && <div style={{marginTop:sp[3],background:`${$.orange}07`,borderRadius:10,padding:`${sp[3]}px`,fontSize:12,color:$.L2,lineHeight:1.7}}>{f.monthly_costs_notes}</div>}
              </Section>
              {f.salary_breakdown?.length>0 && <Section title="تفصيل الرواتب" Icon={Users} color={$.indigo} subtitle="توزيع الرواتب على الموظفين">
                {f.salary_breakdown.map((s,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:`${sp[3]}px 0`,borderBottom:i<f.salary_breakdown.length-1?`0.5px solid ${$.sepL}`:"none"}}>
                    <div>
                      <div style={{fontSize:14,fontWeight:600,color:$.L1}}>{s.role}</div>
                      <div style={{fontSize:11,color:$.L4,marginTop:2}}>{s.count} موظف × {fmt(s.monthly_each)} ﷼</div>
                    </div>
                    <span style={{fontSize:15,fontWeight:800,color:$.indigo,direction:"ltr"}}>{fmt((s.count||0)*(s.monthly_each||0))} ﷼</span>
                  </div>
                ))}
              </Section>}
              <Section title="توقع الإيرادات" Icon={TrendingUp} color={$.green} subtitle="نمو متوقع على 3 سنوات">
                <MoneyRow label="الشهر الأول" value={rp.month_1} note="مرحلة الإطلاق"/>
                <MoneyRow label="الشهر الثالث" value={rp.month_3} note="استقرار العمليات"/>
                <MoneyRow label="الشهر السادس" value={rp.month_6}/>
                <MoneyRow label="الشهر الـ12" value={rp.month_12} valueColor={$.green} bold note="نهاية السنة الأولى"/>
                <MoneyRow label="السنة الثانية (شهرياً)" value={rp.year_2_monthly}/>
                <MoneyRow label="السنة الثالثة (شهرياً)" value={rp.year_3_monthly} valueColor={$.green} bold note="مرحلة النضج"/>
                {f.revenue_notes && <div style={{marginTop:sp[3],background:`${$.green}07`,borderRadius:10,padding:`${sp[3]}px`,fontSize:12,color:$.L2,lineHeight:1.7}}>{f.revenue_notes}</div>}
              </Section>
              {f.daily_target && (f.daily_target.customers_per_day || f.daily_target.average_ticket) && <Section title="الهدف اليومي" Icon={Target} color={$.teal} subtitle="ما تحتاج تحققه يومياً للوصول للربح">
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:sp[3]}}>
                  <div style={{background:`${$.teal}08`,borderRadius:14,padding:`${sp[4]}px`,textAlign:"center"}}>
                    <div style={{fontSize:28,fontWeight:800,color:$.teal}}>{f.daily_target.customers_per_day||"-"}</div>
                    <div style={{fontSize:12,color:$.L3,marginTop:4}}>عميل يومياً</div>
                  </div>
                  <div style={{background:`${$.teal}08`,borderRadius:14,padding:`${sp[4]}px`,textAlign:"center"}}>
                    <div style={{fontSize:28,fontWeight:800,color:$.teal,direction:"ltr"}}>{fmt(f.daily_target.average_ticket)}</div>
                    <div style={{fontSize:12,color:$.L3,marginTop:4}}>متوسط فاتورة العميل (﷼)</div>
                  </div>
                </div>
              </Section>}
              <Section title="مؤشرات الربحية" Icon={PieChart} color={$.blue} subtitle="مقاييس النجاح المالي">
                <Row label="نقطة التعادل" value={(f.break_even_months||"-")+" شهر"} valueColor={$.blue} bold note="الشهر الذي تغطي فيه التكاليف"/>
                <Row label="العائد على الاستثمار (ROI)" value={(f.roi_percentage||"-")+"%"} valueColor={$.green} bold note="نسبة الربح من رأس المال"/>
                <MoneyRow label="صافي الربح السنوي - السنة 1" value={f.annual_profit_year1}/>
                <MoneyRow label="صافي الربح السنوي - السنة 3" value={f.annual_profit_year3} valueColor={$.green} bold/>
              </Section>
            </>)}

            {(tab===3||printMode) && (
              !isPremium ? (
                <LockedTabCard title="المخاطر والتحديات" onNeedUpgrade={onNeedUpgrade} screen={screen}/>
              ) : (
              <div style={{gridColumn:screen.isDesktop?"span 2":"auto"}}>
                <Section title="تحليل المخاطر التفصيلي" Icon={AlertTriangle} color={$.red} subtitle={`${(result.risk_analysis||[]).length} مخاطر مصنّفة مع خطط التخفيف`}>
                  <div style={{display:"grid",gridTemplateColumns:screen.isDesktop?"1fr 1fr":"1fr",gap:sp[3]}}>
                    {(result.risk_analysis||[]).map((r,i)=>{
                      const probColor = r.probability==="عالي"?$.red:r.probability==="متوسط"?$.orange:$.green;
                      const impColor = r.impact==="شديد"?$.red:r.impact==="متوسط"?$.orange:$.green;
                      return (
                        <div key={i} style={{background:$.F5,borderRadius:14,padding:`${sp[4]}px`}}>
                          <div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:sp[3]}}>
                            <div style={{width:28,height:28,borderRadius:"50%",background:$.red,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0}}>{i+1}</div>
                            <span style={{fontSize:15,fontWeight:700,color:$.L1,flex:1,lineHeight:1.4}}>{r.risk}</span>
                          </div>
                          {r.description && <p style={{fontSize:13,color:$.L2,lineHeight:1.7,marginBottom:sp[3],paddingRight:sp[5]}}>{r.description}</p>}
                          <div style={{display:"flex",gap:sp[2],marginBottom:sp[3],flexWrap:"wrap"}}>
                            <Chip text={"احتمالية: "+r.probability} color={probColor} bg={`${probColor}15`} size={12}/>
                            <Chip text={"التأثير: "+r.impact} color={impColor} bg={`${impColor}15`} size={12}/>
                          </div>
                          <div style={{background:`${$.green}07`,borderRight:`3px solid ${$.green}`,padding:`${sp[3]}px ${sp[4]}px`,borderRadius:8}}>
                            <div style={{fontSize:12,fontWeight:700,color:$.green,marginBottom:6,display:"flex",alignItems:"center",gap:5}}>
                              <Shield size={13}/>
                              <span>خطة التخفيف</span>
                            </div>
                            <p style={{fontSize:13,color:$.L2,lineHeight:1.7}}>{r.mitigation}</p>
                          </div>
                          {r.warning_signs && <div style={{background:`${$.orange}08`,borderRight:`3px solid ${$.orange}`,padding:`${sp[3]}px ${sp[4]}px`,borderRadius:8,marginTop:sp[2]}}>
                            <div style={{fontSize:12,fontWeight:700,color:$.orange,marginBottom:6,display:"flex",alignItems:"center",gap:5}}>
                              <AlertTriangle size={13}/>
                              <span>علامات إنذار مبكرة</span>
                            </div>
                            <p style={{fontSize:13,color:$.L2,lineHeight:1.7}}>{r.warning_signs}</p>
                          </div>}
                        </div>
                      );
                    })}
                  </div>
                </Section>
              </div>
              )
            )}

            {(tab===4||printMode) && (
              !isPremium ? (
                <LockedTabCard title="الخطة والتسعير" onNeedUpgrade={onNeedUpgrade} screen={screen}/>
              ) : (<>
              {result.action_plan?.length>0 && (
                <div style={{gridColumn:screen.isDesktop?"span 2":"auto"}}>
                  <Section title="الخطة التنفيذية - أول 90 يوم" Icon={Calendar} color={$.blue} subtitle="خطوات عملية مرتبة من التأسيس حتى الانطلاق">
                    {result.action_plan.map((ph,i)=>(
                      <div key={i} style={{marginBottom:i<result.action_plan.length-1?sp[4]:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:sp[3]}}>
                          <div style={{background:$.blue,color:"#fff",fontSize:11,fontWeight:800,padding:"4px 10px",borderRadius:8}}>{ph.phase}</div>
                          <span style={{fontSize:14,fontWeight:700,color:$.L1}}>{ph.title}</span>
                        </div>
                        {(ph.tasks||[]).map((t,j)=>(
                          <div key={j} style={{display:"flex",alignItems:"flex-start",gap:sp[2],marginBottom:sp[2],padding:`${sp[2]}px ${sp[3]}px`,background:`${$.blue}06`,borderRadius:8}}>
                            <div style={{width:18,height:18,borderRadius:"50%",background:`${$.blue}20`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
                              <span style={{fontSize:10,fontWeight:800,color:$.blue}}>{j+1}</span>
                            </div>
                            <span style={{fontSize:13,color:$.L2,lineHeight:1.6}}>{t}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </Section>
                </div>
              )}
              {result.pricing?.items?.length>0 && (
                <Section title="تحليل التسعير" Icon={Briefcase} color={$.green} subtitle="أسعار مقترحة وهوامش الربح">
                  {result.pricing.items.map((it,i)=>(
                    <div key={i} style={{padding:`${sp[3]}px`,background:`${$.green}05`,borderRadius:10,marginBottom:sp[2]}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:sp[2]}}>
                        <span style={{fontSize:14,fontWeight:700,color:$.L1}}>{it.name}</span>
                        <span style={{fontSize:15,fontWeight:800,color:$.green}}>{it.price}</span>
                      </div>
                      <div style={{display:"flex",gap:sp[2],flexWrap:"wrap"}}>
                        <Chip text={`التكلفة: ${it.cost}`} color={$.L3} bg={$.F4} size={11}/>
                        <Chip text={`هامش: ${it.margin}`} color={$.green} bg={`${$.green}15`} size={11}/>
                      </div>
                    </div>
                  ))}
                  {result.pricing.note && <p style={{fontSize:13,color:$.L2,lineHeight:1.7,marginTop:sp[3],padding:`${sp[3]}px`,background:$.F5,borderRadius:10}}>{result.pricing.note}</p>}
                </Section>
              )}
              {result.break_even_detail && (
                <Section title="نقطة التعادل" Icon={TrendingUp} color={$.purple} subtitle="متى يبدأ مشروعك يربح">
                  <div style={{textAlign:"center",padding:`${sp[4]}px`,background:`${$.purple}06`,borderRadius:14,marginBottom:sp[3]}}>
                    <div style={{fontSize:36,fontWeight:800,color:$.purple}}>{result.break_even_detail.months}</div>
                    <div style={{fontSize:13,color:$.L3,fontWeight:600}}>شهر حتى تغطية التكاليف</div>
                  </div>
                  {result.break_even_detail.explanation && <p style={{fontSize:13,color:$.L2,lineHeight:1.8}}>{result.break_even_detail.explanation}</p>}
                </Section>
              )}
              {result.ideal_customer && (
                <Section title="ملف العميل المثالي" Icon={Users} color={$.teal} subtitle="من هو عميلك وكيف توصل له">
                  <div style={{display:"flex",flexDirection:"column",gap:sp[2]}}>
                    {[{icon:Users,label:"الفئة العمرية",val:result.ideal_customer.age_group},{icon:Briefcase,label:"مستوى الدخل",val:result.ideal_customer.income_level},{icon:Activity,label:"نمط الحياة والسلوك",val:result.ideal_customer.behavior},{icon:MapPin,label:"أين تجده وكيف توصل له",val:result.ideal_customer.where_to_reach}].map(({icon:Icon,label,val},i)=>val && (
                      <div key={i} style={{padding:`${sp[3]}px`,background:`${$.teal}06`,borderRadius:10}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                          <Icon size={13} color={$.teal}/>
                          <span style={{fontSize:12,fontWeight:700,color:$.teal}}>{label}</span>
                        </div>
                        <p style={{fontSize:13,color:$.L2,lineHeight:1.6}}>{val}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
              {result.licenses_needed?.length>0 && (
                <Section title="التراخيص المطلوبة" Icon={Shield} color={$.orange} subtitle="التصاريح اللازمة وجهات إصدارها">
                  {result.licenses_needed.map((lic,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],padding:`${sp[3]}px`,background:`${$.orange}06`,borderRadius:10,marginBottom:sp[2]}}>
                      <div style={{width:24,height:24,borderRadius:7,background:`${$.orange}20`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <CheckCircle size={13} color={$.orange}/>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700,color:$.L1,marginBottom:2}}>{lic.name}</div>
                        {lic.issuer && <div style={{fontSize:12,color:$.L3}}>جهة الإصدار: {lic.issuer}</div>}
                      </div>
                    </div>
                  ))}
                </Section>
              )}
              {result.differentiation?.length>0 && (
                <div style={{gridColumn:screen.isDesktop?"span 2":"auto"}}>
                  <Section title="كيف تتميّز عن المنافسين" Icon={Sparkles} color={$.blue} subtitle="أفكار عملية تجعل مشروعك مختلفاً">
                    {result.differentiation.map((d,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[2],background:`${$.blue}06`,padding:`${sp[3]}px`,borderRadius:10}}>
                        <div style={{width:26,height:26,borderRadius:"50%",background:$.blue,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0}}>{i+1}</div>
                        <span style={{fontSize:13,color:$.L2,lineHeight:1.7,flex:1}}>{d}</span>
                      </div>
                    ))}
                  </Section>
                </div>
              )}
            </>)
            )}
          </div>

          <div style={{marginTop:sp[5],padding:`${sp[4]}px`,background:$.F5,borderRadius:14,display:"flex",gap:sp[3],alignItems:"flex-start"}}>
            <Info size={16} color={$.L4} style={{flexShrink:0,marginTop:2}}/>
            <p style={{fontSize:12,color:$.L3,lineHeight:1.8}}>
              هذا التحليل أداة استرشادية مبنية على متوسطات السوق والذكاء الاصطناعي، الغرض منه مساعدتك على التفكير واتخاذ قرار مبدئي. الأرقام تقديرية وقد تختلف عن الواقع، ولا يُغني هذا التحليل عن دراسة جدوى ميدانية متخصصة قبل أي قرار استثماري. هامور غير مسؤول عن أي قرارات تُتخذ بناءً عليه.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
function AdvisorHubScreen({analyses, user, selectedId, onSelect, onBack, isPremium, onNeedUpgrade}) {
  const screen = useScreenSize();
  const containerStyle = screen.isDesktop ? {maxWidth:1100, margin:"0 auto"} : {};
  const isDemoSelected = selectedId === "__demo__";
  const selected = (!isDemoSelected && selectedId) ? analyses.find(a => a.id === selectedId) : null;

  if (!user) {
    return (
      <div style={{padding:`${sp[14]}px ${sp[5]}px`,textAlign:"center"}}>
        <div style={containerStyle}>
          <h1 style={{fontSize:30,fontWeight:800,color:$.L1,marginBottom:sp[8]}}>المستشار</h1>
          <div style={{width:80,height:80,borderRadius:24,background:`${$.blue}15`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto",marginBottom:sp[5]}}>
            <Sparkles size={36} color={$.blue} strokeWidth={1.5}/>
          </div>
          <h3 style={{fontSize:18,fontWeight:700,color:$.L1,marginBottom:sp[2]}}>سجّل الدخول أولاً</h3>
          <p style={{fontSize:14,color:$.L3,lineHeight:1.6,maxWidth:320,margin:"0 auto"}}>المستشار يتابع مشاريعك المحفوظة ويحتاج حسابك ليحفظ محادثتك وأرقامك</p>
        </div>
      </div>
    );
  }

  // عرض المشروع التجريبي — متاح للجميع، بيانات وهمية لا تُحفظ
  if (isDemoSelected) {
    return (
      <div style={{padding:`${sp[6]}px ${sp[5]}px ${sp[10]}px`}}>
        <div style={containerStyle}>
          <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:5,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,color:$.blue,marginBottom:sp[5],padding:0}}>
            <ArrowRight size={16}/><span>كل المشاريع</span>
          </button>
          <div style={{display:"flex",alignItems:"center",gap:sp[3],marginBottom:sp[5]}}>
            <div style={{width:44,height:44,borderRadius:13,background:`linear-gradient(135deg,${$.blue},${$.purple})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Sparkles size={20} color="#fff"/>
            </div>
            <div style={{minWidth:0}}>
              <div style={{fontSize:17,fontWeight:800,color:$.L1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{DEMO_RESULT.idea}</div>
              <div style={{fontSize:12,color:$.L3,display:"flex",alignItems:"center",gap:3}}><MapPin size={11}/><span>{DEMO_RESULT.city}</span></div>
            </div>
          </div>
          <AdvisorDashboard result={DEMO_RESULT} user={user} isDemo onNeedUpgrade={onNeedUpgrade}/>
        </div>
      </div>
    );
  }

  // عرض المستشار لمشروع حقيقي مختار — يتطلب اشتراك
  if (selected) {
    if (!isPremium) {
      return (
        <div style={{padding:`${sp[14]}px ${sp[5]}px`,textAlign:"center"}}>
          <div style={containerStyle}>
            <div style={{width:80,height:80,borderRadius:24,background:`${$.orange}15`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto",marginBottom:sp[5]}}>
              <Crown size={36} color={$.orange} strokeWidth={1.5}/>
            </div>
            <h3 style={{fontSize:18,fontWeight:700,color:$.L1,marginBottom:sp[2]}}>المستشار لمشاريعك الحقيقية للمشتركين</h3>
            <p style={{fontSize:14,color:$.L3,lineHeight:1.6,maxWidth:320,margin:"0 auto",marginBottom:sp[5]}}>اشترك ليتابع معك المستشار مشروعك بأرقامك الفعلية، أو جرّبه أولاً بالمشروع التجريبي</p>
            <button onClick={onNeedUpgrade} style={{background:"linear-gradient(150deg,#FFB800,#FF9500)",color:"#fff",border:"none",borderRadius:12,padding:`${sp[3]}px ${sp[6]}px`,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>اشترك الآن</button>
          </div>
        </div>
      );
    }
    return (
      <div style={{padding:`${sp[6]}px ${sp[5]}px ${sp[10]}px`}}>
        <div style={containerStyle}>
          <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:5,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,color:$.blue,marginBottom:sp[5],padding:0}}>
            <ArrowRight size={16}/><span>كل المشاريع</span>
          </button>
          <div style={{display:"flex",alignItems:"center",gap:sp[3],marginBottom:sp[5]}}>
            <div style={{width:44,height:44,borderRadius:13,background:`linear-gradient(135deg,${$.blue},${$.green})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Sparkles size={20} color="#fff"/>
            </div>
            <div style={{minWidth:0}}>
              <div style={{fontSize:17,fontWeight:800,color:$.L1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{selected.idea}</div>
              <div style={{fontSize:12,color:$.L3,display:"flex",alignItems:"center",gap:3}}><MapPin size={11}/><span>{selected.city}</span></div>
            </div>
          </div>
          <AdvisorDashboard result={selected} user={user}/>
        </div>
      </div>
    );
  }

  // قائمة المشاريع + بطاقة المشروع التجريبي (دائماً ظاهرة)
  return (
    <div style={{padding:`${sp[14]}px ${sp[5]}px ${sp[10]}px`}}>
      <div style={containerStyle}>
        <h1 style={{fontSize:30,fontWeight:800,color:$.L1,marginBottom:4}}>المستشار</h1>
        <p style={{fontSize:14,color:$.L3,marginBottom:sp[5]}}>اختر مشروعاً لمتابعته مع المستشار</p>

        <Card onClick={()=>onSelect("__demo__")} style={{padding:`${sp[4]}px ${sp[5]}px`,cursor:"pointer",marginBottom:sp[4],border:`1.5px dashed ${$.blue}50`,background:`${$.blue}06`}}>
          <div style={{display:"flex",alignItems:"center",gap:sp[4]}}>
            <div style={{width:52,height:52,borderRadius:16,background:`linear-gradient(135deg,${$.blue},${$.purple})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Sparkles size={24} color="#fff"/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2,flexWrap:"wrap"}}>
                <span style={{fontSize:15,fontWeight:700,color:$.L1}}>جرّب المستشار — مشروع تجريبي</span>
                <Chip text="تعليمي" color={$.blue} bg={`${$.blue}15`} size={10}/>
              </div>
              <div style={{fontSize:12,color:$.L3}}>بيانات وهمية، تجوّل بحرية وشوف كل الأقسام قبل الاشتراك</div>
            </div>
            <ChevronRight size={18} color={$.L4} style={{transform:"scaleX(-1)",flexShrink:0}}/>
          </div>
        </Card>

        {!isPremium && (
          <Card onClick={onNeedUpgrade} style={{padding:`${sp[4]}px ${sp[5]}px`,cursor:"pointer",marginBottom:sp[5],background:"linear-gradient(135deg,#FFB800,#FF9500)",border:"none"}}>
            <div style={{display:"flex",alignItems:"center",gap:sp[3]}}>
              <Crown size={22} color="#fff"/>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>المستشار لمشاريعك الحقيقية يحتاج اشتراك</div>
                <div style={{fontSize:11.5,color:"rgba(255,255,255,0.9)"}}>اشترك ليتابع معك أي مشروع حللته فعلياً</div>
              </div>
            </div>
          </Card>
        )}

        {analyses.length === 0 ? (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:`${sp[10]}px`,textAlign:"center"}}>
            <div style={{fontSize:13,color:$.L3}}>حلّل مشروعك من الرئيسية عشان يظهر هنا وتقدر تتابعه</div>
          </div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:screen.isDesktop?"1fr 1fr":"1fr",gap:sp[3]}}>
            {analyses.map(a => {
              const pos = a.decision_type === "positive";
              const color = pos ? $.green : $.red;
              return (
                <Card key={a.id} onClick={()=> isPremium ? onSelect(a.id) : onNeedUpgrade()} style={{padding:`${sp[4]}px ${sp[5]}px`,cursor:"pointer",opacity:isPremium?1:0.6,position:"relative"}}>
                  {!isPremium && <div style={{position:"absolute",top:sp[3],left:sp[3]}}><Lock size={14} color={$.L4}/></div>}
                  <div style={{display:"flex",alignItems:"center",gap:sp[4]}}>
                    <ScoreRing value={a.score} size={52} track={5} color={color} noAnim/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:15,fontWeight:700,color:$.L1,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.idea}</div>
                      <div style={{fontSize:12,color:$.L3,display:"flex",alignItems:"center",gap:3}}><MapPin size={11}/><span>{a.city}</span></div>
                    </div>
                    <ChevronRight size={18} color={$.L4} style={{transform:"scaleX(-1)",flexShrink:0}}/>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SavedAnalysesScreen({onViewAnalysis, analyses, onRefresh}) {
  const screen = useScreenSize();
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleDelete(id) {
    setBusy(true);
    try {
      await deleteAnalysisCloud(id);
      await onRefresh();
    } catch(e) {}
    setBusy(false);
    setConfirmDelete(null);
  }

  const positiveCount = analyses.filter(a => a.decision_type === "positive").length;
  const negativeCount = analyses.filter(a => a.decision_type === "negative").length;
  const containerStyle = screen.isDesktop ? {maxWidth:1100, margin:"0 auto"} : {};

  if (analyses.length === 0) {
    return (
      <div style={{padding:`${sp[14]}px ${sp[5]}px`}}>
        <div style={containerStyle}>
          <h1 style={{fontSize:30,fontWeight:800,color:$.L1,marginBottom:sp[8]}}>تحليلاتي</h1>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:`${sp[12]}px`,textAlign:"center"}}>
            <div style={{width:80,height:80,borderRadius:24,background:`${$.purple}15`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:sp[5]}}>
              <Archive size={36} color={$.purple} strokeWidth={1.5}/>
            </div>
            <h3 style={{fontSize:18,fontWeight:700,color:$.L1,marginBottom:sp[2]}}>لا توجد تحليلات بعد</h3>
            <p style={{fontSize:14,color:$.L3,lineHeight:1.6,maxWidth:320}}>عند تحليل أي مشروع، سيتم حفظه تلقائياً في حسابك</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{padding:`${sp[14]}px ${sp[5]}px ${sp[10]}px`}}>
      <div style={containerStyle}>
        <h1 style={{fontSize:30,fontWeight:800,color:$.L1,marginBottom:4}}>تحليلاتي</h1>
        <p style={{fontSize:14,color:$.L3,marginBottom:sp[5]}}>{analyses.length} تحليلات محفوظة في حسابك</p>
        
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:sp[3],marginBottom:sp[5]}}>
          <Card style={{padding:sp[4]}}>
            <IconBadge Icon={Archive} color={$.blue} size={32}/>
            <div style={{fontSize:24,fontWeight:800,color:$.L1,marginTop:sp[2]}}>{analyses.length}</div>
            <div style={{fontSize:11,color:$.L3}}>المجموع</div>
          </Card>
          <Card style={{padding:sp[4]}}>
            <IconBadge Icon={CheckCircle} color={$.green} size={32}/>
            <div style={{fontSize:24,fontWeight:800,color:$.green,marginTop:sp[2]}}>{positiveCount}</div>
            <div style={{fontSize:11,color:$.L3}}>إيجابي</div>
          </Card>
          <Card style={{padding:sp[4]}}>
            <IconBadge Icon={XCircle} color={$.red} size={32}/>
            <div style={{fontSize:24,fontWeight:800,color:$.red,marginTop:sp[2]}}>{negativeCount}</div>
            <div style={{fontSize:11,color:$.L3}}>سلبي</div>
          </Card>
        </div>

        <div style={{display:"grid",gridTemplateColumns:screen.isDesktop?"1fr 1fr":"1fr",gap:sp[3]}}>
          {analyses.map(a => {
            const pos = a.decision_type === "positive";
            const color = pos ? $.green : $.red;
            return (
              <Card key={a.id} style={{padding:0,overflow:"hidden"}}>
                <div onClick={()=>onViewAnalysis(a)} style={{padding:`${sp[4]}px ${sp[5]}px`,cursor:"pointer"}}>
                  <div style={{display:"flex",alignItems:"center",gap:sp[4],marginBottom:sp[3]}}>
                    <ScoreRing value={a.score} size={56} track={5} color={color} noAnim/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:15,fontWeight:700,color:$.L1,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.idea}</div>
                      <div style={{fontSize:12,color:$.L3,display:"flex",alignItems:"center",gap:3}}><MapPin size={11}/><span>{a.city}</span></div>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:sp[2],flexWrap:"wrap"}}>
                    <Chip text={a.decision} color={color} bg={`${color}15`} size={11}/>
                    <div style={{display:"flex",alignItems:"center",gap:3,color:$.L4,fontSize:11}}><Clock size={10}/><span>{formatDate(a.savedAt)}</span></div>
                  </div>
                </div>
                <div style={{display:"flex",borderTop:`0.5px solid ${$.sepL}`}}>
                  <button onClick={()=>onViewAnalysis(a)} style={{flex:1,padding:sp[3],background:"transparent",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,color:$.blue,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                    <Eye size={14}/><span>عرض التحليل</span>
                  </button>
                  <button onClick={()=>setConfirmDelete(a.id)} style={{flex:"none",padding:`${sp[3]}px ${sp[5]}px`,background:"transparent",border:"none",cursor:"pointer",color:$.red}}>
                    <Trash2 size={14}/>
                  </button>
                </div>
              </Card>
            );
          })}
        </div>

        <Sheet open={!!confirmDelete} onClose={()=>setConfirmDelete(null)}>
          <div style={{padding:`${sp[5]}px ${sp[5]}px ${sp[8]}px`,textAlign:"center"}}>
            <div style={{width:64,height:64,borderRadius:20,background:`${$.red}15`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto",marginBottom:sp[5]}}>
              <AlertTriangle size={30} color={$.red}/>
            </div>
            <h3 style={{fontSize:20,fontWeight:800,color:$.L1,marginBottom:sp[2]}}>حذف التحليل؟</h3>
            <p style={{fontSize:14,color:$.L3,marginBottom:sp[6]}}>سيتم حذف هذا التحليل نهائياً ولا يمكن استرجاعه</p>
            <div style={{display:"flex",gap:sp[3]}}>
              <button onClick={()=>setConfirmDelete(null)} style={{flex:1,background:$.F3,color:$.L1,border:"none",borderRadius:12,padding:sp[3],fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>إلغاء</button>
              <button onClick={()=>handleDelete(confirmDelete)} disabled={busy} style={{flex:1,background:$.red,color:"#fff",border:"none",borderRadius:12,padding:sp[3],fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>{busy?<Spinner sz={15}/>:"حذف"}</button>
            </div>
          </div>
        </Sheet>
      </div>
    </div>
  );
}

const CATEGORIES = [
  {id:"all", name:"الكل", color:$.blue},
  {id:"food", name:"أطعمة", color:$.orange},
  {id:"retail", name:"تجزئة", color:$.purple},
  {id:"services", name:"خدمات", color:$.teal},
  {id:"professional", name:"احترافية", color:$.indigo}
];

const SECTORS_DATA = [
  {id:1, category:"food", name:"مقاهي ومشروبات", Icon:Coffee, color:$.orange, score:68, growth:"+12%", failure_rate:"60%", investment:"150,000 - 400,000", payback:"18-24 شهر", margin:"15-25%", competition:"عالية جداً", audience:"شباب 18-35، طلاب جامعات، عمال شركات، عائلات في عطلات نهاية الأسبوع", top_cities:["الرياض","جدة","الخبر","الدمام","المدينة المنورة"], success_tips:["موقع استراتيجي قرب الجامعات أو المكاتب","تميّز في القهوة - حبوب مختصة وتجربة فريدة","تصميم داخلي جذاب للسوشيال ميديا","خدمة توصيل سريعة عبر التطبيقات","برامج ولاء وعروض ذكية","تدريب الباريستا باستمرار"], failure_reasons:["إشباع السوق ومنافسة شرسة","موقع ضعيف بدون حركة","ضعف التمييز","تكاليف إيجار وديكور عالية","عدم الاستمرارية في الجودة"], competitors:["ستاربكس","% عربيكا","دنكن","كوفي بين","مذاق","بريد"], sub_ideas:["كوفي قهوة كورية","عربة قهوة متنقلة","كوفي بطابع تراثي"], city_notes:{"الباحة":"السياحة الجبلية فرصة ممتازة صيفاً","الرياض":"منافسة عالية، تحتاج تميّز قوي","تبوك":"نمو سياحي مع نيوم - فرصة ذهبية","أبها":"المصيف والطلاب يخلون السوق نشط"}, last_updated:"يناير 2026"},
  {id:2, category:"food", name:"مطاعم وأكل", Icon:Utensils, color:$.red, score:65, growth:"+8%", failure_rate:"70%", investment:"200,000 - 800,000", payback:"24-36 شهر", margin:"10-18%", competition:"عالية", audience:"عائلات، عمال، موظفون، شباب في الخروجات الأسبوعية", top_cities:["الرياض","جدة","الدمام","الخبر","مكة المكرمة"], success_tips:["تخصص واضح في مأكولات محددة","اتساق في الجودة","خدمة توصيل قوية","تسعير منافس وعروض موسمية","موقع في مجمعات أو شوارع مزدحمة","نظافة المطبخ والخدمة"], failure_reasons:["قائمة طعام كبيرة جداً","ضعف الإدارة المالية والمخزون","منافسة السلاسل الكبيرة","موسمية صعبة","صعوبة إيجاد طباخين ماهرين"], competitors:["البيك","كودو","هرفي","ماكدونالدز","ماجستيك","الطازج"], sub_ideas:["مطعم متخصص في الكبسة","مطعم آسيوي شعبي","فطور صباحي راقي"], city_notes:{"الباحة":"المطاعم العائلية والشعبية الأنجح","مكة المكرمة":"موسم الحج يضاعف الطلب","المدينة المنورة":"السياحة الدينية تخلق طلب مستمر","الطائف":"المصيف يفتح فرصة موسمية"}, last_updated:"يناير 2026"},
  {id:3, category:"food", name:"حلويات ومخبوزات", Icon:Cake, color:$.pink, score:72, growth:"+18%", failure_rate:"45%", investment:"120,000 - 500,000", payback:"12-18 شهر", margin:"25-40%", competition:"متوسطة", audience:"نساء، عائلات، مناسبات، مكاتب", top_cities:["الرياض","جدة","الدمام","القصيم","المدينة المنورة"], success_tips:["تصوير احترافي للمنتجات","تغليف فاخر للهدايا","توصيل سريع مع جودة محفوظة","تخصص في نوع معين","ابتكار طعمات جديدة","حسابات قوية في إنستقرام"], failure_reasons:["تقليد المنافسين بدل الابتكار","ضعف التغليف","عدم اتساق الجودة","تسعير غير صحيح","إهمال الموسمية"], competitors:["صابا","عبدالصمد القرشي","ميلانو","لافيت","تشيز كيك فاكتوري"], sub_ideas:["حلويات صحية بدون سكر","تخصص في الكنافة الفاخرة","كيكات تخرج وأعراس"], city_notes:{"القصيم":"معروفة بالحلويات - فرصة للابتكار العصري","الباحة":"سوق صغير لكن أقل منافسة"}, last_updated:"يناير 2026"},
  {id:4, category:"food", name:"وجبات سريعة", Icon:Pizza, color:$.yellow, score:64, growth:"+10%", failure_rate:"55%", investment:"100,000 - 350,000", payback:"15-24 شهر", margin:"20-30%", competition:"عالية", audience:"شباب، طلاب، عمال، موظفون", top_cities:["الرياض","جدة","الدمام","تبوك","الخبر"], success_tips:["سرعة التحضير أقل من 5 دقائق","تسعير منافس","موقع قريب من الجامعات","توصيل فعّال","بساطة القائمة","نظافة عالية"], failure_reasons:["منافسة السلاسل العالمية","ضعف جودة المواد الخام","ارتفاع تكاليف اللحوم","صعوبة الجودة في الذروة","اعتماد كامل على التوصيل"], competitors:["ماكدونالدز","برجر كنق","KFC","البيك","شوكسي"], sub_ideas:["برجر سعودي بنكهات محلية","شاورما مختصة","ساندوتشات صحية"], city_notes:{"تبوك":"نمو نيوم يجلب طلب عالي"}, last_updated:"يناير 2026"},
  {id:5, category:"retail", name:"تجزئة عامة", Icon:ShoppingBag, color:$.purple, score:55, growth:"+5%", failure_rate:"55%", investment:"100,000 - 500,000", payback:"24-36 شهر", margin:"15-30%", competition:"عالية جداً", audience:"عام حسب نوع البضاعة", top_cities:["الرياض","جدة","الدمام","مكة المكرمة","الخبر"], success_tips:["تخصص واضح","موقع في مجمع تجاري","إدارة مخزون ذكية","حضور أونلاين قوي","خدمة عملاء مميزة","عروض موسمية"], failure_reasons:["منافسة التجارة الإلكترونية","بضاعة راكدة","موقع ضعيف","تسعير مرتفع","إهمال التسويق الرقمي"], competitors:["نون","أمازون","إكسترا","ساكو","جرير"], sub_ideas:["متجر منتجات أطفال","متجر مستلزمات حيوانات","متجر هدايا فاخرة"], city_notes:{"الباحة":"ركّز على ما يحتاجه السكان فعلاً"}, last_updated:"يناير 2026"},
  {id:6, category:"retail", name:"أزياء وعبايات", Icon:Shirt, color:$.indigo, score:75, growth:"+15%", failure_rate:"40%", investment:"80,000 - 300,000", payback:"12-18 شهر", margin:"25-40%", competition:"متوسطة", audience:"نساء 20-60 سنة، مناسبات", top_cities:["الرياض","جدة","الخبر","الدمام","المدينة المنورة"], success_tips:["تصاميم حصرية وفريدة","خياطة عالية الجودة","إنستقرام احترافي","خدمة VIP للعملاء","موقع راقي","تنوع المقاسات"], failure_reasons:["تشابه التصاميم","تسعير ضعيف","موقع غير ملائم","ضعف التسويق الرقمي","عدم متابعة الموضة"], competitors:["مزون","نهى","أنوار","نسك"], sub_ideas:["عبايات شبابية عصرية","فساتين سهرة مستوردة","عبايات صلاة فاخرة"], city_notes:{"الباحة":"الأعراس الموسمية تخلق طلب","القصيم":"السوق يفضّل العبايات التقليدية"}, last_updated:"يناير 2026"},
  {id:7, category:"retail", name:"إلكترونيات", Icon:Smartphone, color:$.teal, score:60, growth:"+7%", failure_rate:"50%", investment:"200,000 - 1,000,000", payback:"30-48 شهر", margin:"8-18%", competition:"عالية جداً", audience:"شباب، موظفون، طلاب، عائلات", top_cities:["الرياض","جدة","الدمام","الخبر","تبوك"], success_tips:["أسعار منافسة","ضمان موثوق","تشكيلة متنوعة","صيانة في المحل","حسابات سوشيال قوية","تعاون مع شركات الأقساط"], failure_reasons:["هامش ربح ضعيف","منافسة المتاجر الإلكترونية","تزييف المنتجات","تخزين بضاعة قديمة","صعوبة الوكالات الحصرية"], competitors:["إكسترا","جرير","نون","أمازون","السيف غاليري"], sub_ideas:["إكسسوارات الجوالات","صيانة متخصصة","قطع غيار كمبيوترات"], city_notes:{"تبوك":"العمال في نيوم يحتاجون إلكترونيات"}, last_updated:"يناير 2026"},
  {id:8, category:"services", name:"صالونات وتجميل", Icon:Sparkle, color:$.pink, score:70, growth:"+14%", failure_rate:"50%", investment:"100,000 - 400,000", payback:"18-24 شهر", margin:"25-40%", competition:"متوسطة", audience:"نساء 18-55، رجال 18-50، مناسبات", top_cities:["الرياض","جدة","الخبر","الدمام","أبها"], success_tips:["مصففين موهوبين","تجربة فاخرة","نظام حجز إلكتروني","تخصص في خدمات معينة","نظافة وتعقيم عالي","تنظيم الوقت"], failure_reasons:["دوران الموظفين السريع","عدم النظافة الكافية","تسعير غير واضح","ضعف التسويق","إهمال خدمة الزبون"], competitors:["روزا","إكسير","توني آند جاي","رويال"], sub_ideas:["صالون رجالي راقي","صالون أعراس متخصص","عيادة جلدية تجميلية"], city_notes:{"الباحة":"السياحة الصيفية فرصة موسمية","أبها":"الجو الجميل يجذب سياحة العرائس"}, last_updated:"يناير 2026"},
  {id:9, category:"services", name:"خياطة وتفصيل", Icon:Scissors, color:$.purple, score:62, growth:"+6%", failure_rate:"30%", investment:"40,000 - 150,000", payback:"12-18 شهر", margin:"30-50%", competition:"متوسطة", audience:"رجال، نساء، مناسبات", top_cities:["الرياض","القصيم","المدينة المنورة","جدة","الدمام"], success_tips:["خياطين ماهرين","الالتزام بالمواعيد","تخصص في نوع معين","أقمشة فاخرة","موقع قريب من الأحياء","خدمة قياس بالمنزل"], failure_reasons:["تأخر التسليم","ضعف جودة الخياطة","نقص الخياطين المهرة","تسعير غير منافس","عدم مواكبة الموضة"], competitors:["محلات خياطة محلية","الطلال","الفيصلية"], sub_ideas:["خياطة فساتين سهرة","خياطة بشوت ملوكية","تفصيل عبايات خاصة"], city_notes:{"القصيم":"السوق يحب الخياطة الفاخرة","الباحة":"الأعراس الموسمية تفتح طلب كبير"}, last_updated:"يناير 2026"},
  {id:10, category:"professional", name:"تعليم وتدريب", Icon:GraduationCap, color:$.blue, score:82, growth:"+22%", failure_rate:"35%", investment:"80,000 - 350,000", payback:"12-20 شهر", margin:"35-55%", competition:"متوسطة", audience:"طلاب مدارس وجامعات، موظفون", top_cities:["الرياض","جدة","الدمام","الخبر","المدينة المنورة"], success_tips:["مدرّبين ذوي خبرة","محتوى مميز","شهادات معتمدة","تسويق رقمي قوي","دورات مكثفة","أسعار تنافسية"], failure_reasons:["ضعف جودة المدربين","تسعير مرتفع","موقع غير ملائم","عدم وجود تخصص","إهمال متابعة الطلاب"], competitors:["دروب","رواق","عبر مدرسة","تمكين"], sub_ideas:["تعليم البرمجة للأطفال","تطوير الذات والقيادة","دورات لغات متخصصة"], city_notes:{"الباحة":"فرصة قليلة المنافسة"}, last_updated:"يناير 2026"},
  {id:11, category:"professional", name:"لياقة ورياضة", Icon:Dumbbell, color:$.green, score:78, growth:"+20%", failure_rate:"40%", investment:"150,000 - 600,000", payback:"18-30 شهر", margin:"30-45%", competition:"متوسطة", audience:"شباب وشابات 18-45، رياضيون", top_cities:["الرياض","جدة","الخبر","الدمام","تبوك"], success_tips:["أجهزة حديثة","مدربين معتمدين","تنوع البرامج","نظافة وتعقيم","اشتراكات مرنة","تطبيق للحجز"], failure_reasons:["أجهزة قديمة","اشتراكات مرتفعة","صعوبة الاحتفاظ بالعملاء","موقع غير ملائم","ضعف الخدمة"], competitors:["فتنس تايم","بادي ماستر","بود فيتنس","نقاء"], sub_ideas:["نادي نسائي متخصص","مركز كروسفت","ستوديو يوغا وبيلاتس"], city_notes:{"تبوك":"نيوم تجلب طلب عالي"}, last_updated:"يناير 2026"},
  {id:12, category:"professional", name:"خدمات تقنية", Icon:Wifi, color:$.indigo, score:85, growth:"+25%", failure_rate:"30%", investment:"50,000 - 300,000", payback:"12-18 شهر", margin:"40-60%", competition:"منخفضة", audience:"شركات، رواد أعمال، متاجر، أفراد", top_cities:["الرياض","جدة","الدمام","الخبر","تبوك"], success_tips:["تخصص في خدمة محددة","محفظة أعمال قوية","أسعار باقات واضحة","دعم فني سريع","حضور قوي على لينكدإن","شراكات مع شركات كبرى"], failure_reasons:["عدم وجود تخصص","ضعف التسعير","صعوبة إيجاد عملاء مستمرين","ضعف الدعم","تقادم التقنيات"], competitors:["شركات تقنية محلية","stc Pay","موضوع","حسوب"], sub_ideas:["تسويق رقمي للمحلات","تصميم تطبيقات","إدارة سوشيال ميديا"], city_notes:{"الرياض":"السوق الأكبر للخدمات التقنية","تبوك":"نيوم تحتاج خدمات تقنية - فرصة ذهبية"}, last_updated:"يناير 2026"}
];

function SectorsScreen() {
  const screen = useScreenSize();
  const [q,setQ]=useState("");
  const [cat,setCat]=useState("all");
  const [cityFilter,setCityFilter]=useState("all");
  const [active,setActive]=useState(null);
  
  const list = SECTORS_DATA.filter(s => {
    if (cat !== "all" && s.category !== cat) return false;
    if (q && !s.name.includes(q)) return false;
    return true;
  }).map(s => ({...s, dynScore: cityScore(s, cityFilter)})).sort((a,b) => b.dynScore - a.dynScore);

  const containerStyle = screen.isDesktop ? {maxWidth:1200, margin:"0 auto"} : screen.isTablet ? {maxWidth:900, margin:"0 auto"} : {};
  const cityNote = active && cityFilter !== "all" ? active.city_notes?.[cityFilter] : null;
  const activeDynScore = active ? cityScore(active, cityFilter) : 0;

  return (
    <div style={{padding:`${sp[14]}px ${sp[5]}px ${sp[10]}px`}}>
      <div style={containerStyle}>
        <h1 style={{fontSize:screen.isDesktop?42:30,fontWeight:800,color:$.L1,letterSpacing:"-0.8px",marginBottom:4}}>القطاعات</h1>
        <p style={{fontSize:14,color:$.L3,marginBottom:sp[5]}}>تحليلات مفصّلة للسوق السعودي · {SECTORS_DATA.length} قطاعات</p>

        <div style={{position:"relative",marginBottom:sp[4]}}>
          <Search size={15} color={$.L4} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)"}}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="ابحث عن قطاع…" style={{...iStyle(),paddingRight:40,background:$.surface,boxShadow:SH.card}}/>
        </div>

        <div style={{display:"flex",gap:sp[2],marginBottom:sp[3],overflowX:"auto",paddingBottom:4}}>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={()=>setCat(c.id)} style={{flex:"none",padding:`${sp[2]}px ${sp[4]}px`,borderRadius:99,border:"none",cursor:"pointer",fontFamily:"inherit",background:cat===c.id?c.color:$.F4,color:cat===c.id?"#fff":$.L2,fontSize:13,fontWeight:600,whiteSpace:"nowrap"}}>{c.name}</button>
          ))}
        </div>

        <div style={{marginBottom:sp[5],background:$.surface,borderRadius:12,padding:sp[3],boxShadow:SH.card}}>
          <div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:sp[2]}}>
            <MapPin size={14} color={$.blue}/>
            <span style={{fontSize:12,fontWeight:700,color:$.L2}}>اختر المدينة - الأرقام تتغير حسب كل مدينة</span>
          </div>
          <div style={{position:"relative"}}>
            <select value={cityFilter} onChange={e=>setCityFilter(e.target.value)} style={{...iStyle(),paddingLeft:sp[8],cursor:"pointer",fontSize:13}}>
              <option value="all">كل المدن (عام)</option>
              {CITIES.map(c=><option key={c}>{c}</option>)}
            </select>
            <ChevronDown size={13} color={$.L4} style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:screen.isDesktop?"1fr 1fr 1fr":screen.isTablet?"1fr 1fr":"1fr",gap:sp[3]}}>
          {list.length === 0 && <div style={{gridColumn:"1/-1",padding:`${sp[8]}px`,textAlign:"center",color:$.L3,fontSize:14}}>لا توجد قطاعات مطابقة</div>}
          {list.map(s => {
            const hasNote = cityFilter !== "all" && s.city_notes?.[cityFilter];
            return (
              <Card key={s.id} onClick={()=>setActive(s)} style={{padding:sp[4],cursor:"pointer",border:hasNote?`1.5px solid ${$.blue}40`:"none",position:"relative"}}>
                <MeshBg mode="color" opacity={0.13} animated={false}/>
                <div style={{position:"relative",zIndex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:sp[4]}}>
                  <IconBadge Icon={s.Icon} color={s.color} size={48}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:sp[2]}}>
                      <span style={{fontSize:16,fontWeight:700,color:$.L1}}>{s.name}</span>
                      <span style={{fontSize:20,fontWeight:800,color:scoreColor(s.dynScore)}}>{s.dynScore}<span style={{fontSize:12,fontWeight:600,color:$.L4}}>/100</span></span>
                    </div>
                    <Bar pct={s.dynScore} color={scoreColor(s.dynScore)}/>
                    <div style={{display:"flex",gap:sp[2],marginTop:sp[3],flexWrap:"wrap"}}>
                      <Chip text={"نمو "+s.growth} color={$.green} bg={`${$.green}15`}/>
                      <Chip text={"فشل "+s.failure_rate} color={$.red} bg={`${$.red}15`}/>
                    </div>
                  </div>
                </div>
                {hasNote && (
                  <div style={{marginTop:sp[3],padding:`${sp[2]}px ${sp[3]}px`,background:`${$.blue}08`,borderRadius:10,borderRight:`3px solid ${$.blue}`}}>
                    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
                      <Info size={12} color={$.blue}/>
                      <span style={{fontSize:11,fontWeight:700,color:$.blue}}>ملاحظة لـ {cityFilter}</span>
                    </div>
                    <p style={{fontSize:12,color:$.L2,lineHeight:1.5}}>{s.city_notes[cityFilter]}</p>
                  </div>
                )}
                </div>
              </Card>
            );
          })}
        </div>

        <Sheet open={!!active} onClose={()=>setActive(null)}>
          {active && (
            <div style={{padding:`0 ${sp[5]}px ${sp[8]}px`}}>
              <div style={{position:"relative",overflow:"hidden",borderRadius:18,background:$.hdrBlue,padding:`${sp[5]}px ${sp[4]}px`,marginBottom:sp[4]}}>
                <MeshBg mode="white" opacity={0.4}/>
                <div style={{position:"relative",zIndex:1,display:"flex",alignItems:"center",gap:sp[3]}}>
                  <div style={{width:48,height:48,borderRadius:14,background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <active.Icon size={26} color="#fff"/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:20,fontWeight:800,color:"#fff"}}>{active.name}</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",marginTop:2}}>{cityFilter==="all"?"تقييم عام":"تقييم خاص بـ "+cityFilter}</div>
                  </div>
                  <div style={{fontSize:32,fontWeight:800,color:"#fff"}}>{activeDynScore}</div>
                </div>
              </div>

              {cityNote && (
                <div style={{background:`${$.blue}08`,border:`1.5px solid ${$.blue}25`,borderRadius:14,padding:`${sp[4]}px`,marginBottom:sp[4]}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:sp[2]}}>
                    <Info size={15} color={$.blue}/>
                    <span style={{fontSize:13,fontWeight:700,color:$.blue}}>ملاحظة خاصة لـ {cityFilter}</span>
                  </div>
                  <p style={{fontSize:14,color:$.L2,lineHeight:1.7}}>{cityNote}</p>
                </div>
              )}

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:sp[3],marginBottom:sp[4]}}>
                <Card style={{padding:sp[4]}}>
                  <div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:6}}><TrendingUp size={14} color={$.green}/><span style={{fontSize:10,fontWeight:600,color:$.L3}}>النمو السنوي</span></div>
                  <div style={{fontSize:18,fontWeight:800,color:$.green}}>{active.growth}</div>
                </Card>
                <Card style={{padding:sp[4]}}>
                  <div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:6}}><AlertTriangle size={14} color={$.red}/><span style={{fontSize:10,fontWeight:600,color:$.L3}}>معدل الفشل</span></div>
                  <div style={{fontSize:18,fontWeight:800,color:$.red}}>{active.failure_rate}</div>
                </Card>
                <Card style={{padding:sp[4]}}>
                  <div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:6}}><Briefcase size={14} color={$.purple}/><span style={{fontSize:10,fontWeight:600,color:$.L3}}>متوسط الاستثمار</span></div>
                  <div style={{fontSize:12,fontWeight:700,color:$.L1,direction:"ltr",textAlign:"right"}}>{active.investment}</div>
                  <div style={{fontSize:10,color:$.L4,marginTop:2}}>﷼ سعودي</div>
                </Card>
                <Card style={{padding:sp[4]}}>
                  <div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:6}}><Clock size={14} color={$.orange}/><span style={{fontSize:10,fontWeight:600,color:$.L3}}>فترة الاسترداد</span></div>
                  <div style={{fontSize:14,fontWeight:700,color:$.L1}}>{active.payback}</div>
                </Card>
                <Card style={{padding:sp[4]}}>
                  <div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:6}}><PieChart size={14} color={$.blue}/><span style={{fontSize:10,fontWeight:600,color:$.L3}}>هامش الربح</span></div>
                  <div style={{fontSize:14,fontWeight:700,color:$.L1}}>{active.margin}</div>
                </Card>
                <Card style={{padding:sp[4]}}>
                  <div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:6}}><Users size={14} color={$.teal}/><span style={{fontSize:10,fontWeight:600,color:$.L3}}>المنافسة</span></div>
                  <div style={{fontSize:14,fontWeight:700,color:$.L1}}>{active.competition}</div>
                </Card>
              </div>

              <Section title="الجمهور المستهدف" Icon={Users} color={$.blue}>
                <p style={{fontSize:14,color:$.L2,lineHeight:1.8}}>{active.audience}</p>
              </Section>

              <Section title="أفضل المدن" Icon={MapPin} color={$.green}>
                <div style={{display:"flex",gap:sp[2],flexWrap:"wrap"}}>
                  {active.top_cities.map((c,i)=>(<Chip key={c} text={`${i+1}. ${c}`} color={$.green} bg={`${$.green}15`} size={13}/>))}
                </div>
              </Section>

              <Section title="عوامل النجاح" Icon={CheckCircle} color={$.green} subtitle={`${active.success_tips.length} نصائح عملية للنجاح`}>
                {active.success_tips.map((t,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3],padding:`${sp[3]}px`,background:`${$.green}06`,borderRadius:10}}>
                    <div style={{width:24,height:24,borderRadius:"50%",background:$.green,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{i+1}</div>
                    <span style={{fontSize:14,color:$.L2,lineHeight:1.7}}>{t}</span>
                  </div>
                ))}
              </Section>

              <Section title="أسباب الفشل الشائعة" Icon={XCircle} color={$.red} subtitle="تحذيرات مهمة قبل البدء">
                {active.failure_reasons.map((t,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3],padding:`${sp[3]}px`,background:`${$.red}06`,borderRadius:10}}>
                    <div style={{width:24,height:24,borderRadius:"50%",background:$.red,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0}}>×</div>
                    <span style={{fontSize:14,color:$.L2,lineHeight:1.7}}>{t}</span>
                  </div>
                ))}
              </Section>

              <Section title="المنافسون المعروفون" Icon={Briefcase} color={$.orange}>
                <div style={{display:"flex",gap:sp[2],flexWrap:"wrap"}}>
                  {active.competitors.map(c=>(<Chip key={c} text={c} color={$.orange} bg={`${$.orange}15`} size={12}/>))}
                </div>
              </Section>

              <Section title="أفكار فرعية مقترحة" Icon={Lightbulb} color={$.purple} subtitle="فرص داخل القطاع">
                {active.sub_ideas.map((idea,i)=>(
                  <div key={i} style={{background:`${$.purple}07`,padding:`${sp[3]}px ${sp[4]}px`,borderRadius:10,marginBottom:sp[2]}}>
                    <div style={{display:"flex",alignItems:"center",gap:sp[2]}}>
                      <Sparkles size={14} color={$.purple}/>
                      <span style={{fontSize:14,fontWeight:600,color:$.L1}}>{idea}</span>
                    </div>
                  </div>
                ))}
              </Section>
            </div>
          )}
        </Sheet>
      </div>
    </div>
  );
}

function LearningScreen({isPremium, onNeedUpgrade}) {
  const screen = useScreenSize();
  const [q,setQ]=useState("");
  const [activeCat,setActiveCat]=useState("all");
  const [accessFilter,setAccessFilter]=useState("all");
  const [activeArticle,setActiveArticle]=useState(null);

  const allCategories = [{id:"all", name:"الكل", iconName:"BookOpen", color:$.blue, gradient:"linear-gradient(145deg,#007AFF,#0050C0)"}, ...ARTICLE_CATEGORIES];
  
  const filteredArticles = ARTICLES.filter(a => {
    if (activeCat !== "all" && a.category !== activeCat) return false;
    if (q && !a.title.includes(q) && !a.excerpt.includes(q)) return false;
    const isFree = FREE_ARTICLE_IDS.includes(a.id);
    if (accessFilter === "free" && !isFree) return false;
    if (accessFilter === "premium" && isFree) return false;
    return true;
  });

  function getLevelColor(level) {
    if (level === "مبتدئ") return $.green;
    if (level === "متوسط") return $.orange;
    return $.red;
  }

  function getCategoryInfo(catId) {
    return ARTICLE_CATEGORIES.find(c => c.id === catId) || {name:"عام", color:$.blue, gradient:"linear-gradient(145deg,#007AFF,#0050C0)", iconName:"BookOpen"};
  }

  function handleArticleClick(article, index) {
    if (!isPremium && !FREE_ARTICLE_IDS.includes(article.id)) { onNeedUpgrade(); return; }
    setActiveArticle(article);
  }

  const containerStyle = screen.isDesktop ? {maxWidth:1200, margin:"0 auto"} : screen.isTablet ? {maxWidth:900, margin:"0 auto"} : {};

  return (
    <div style={{padding:`${sp[14]}px ${sp[5]}px ${sp[10]}px`}}>
      <div style={containerStyle}>
        <h1 style={{fontSize:screen.isDesktop?42:30,fontWeight:800,color:$.L1,letterSpacing:"-0.8px",marginBottom:4}}>مكتبة التعلم</h1>
        <p style={{fontSize:14,color:$.L3,marginBottom:sp[5]}}>{ARTICLES.length} مقالة احترافية{!isPremium && ` · ${FREE_ARTICLES} مجانية`}</p>

        <div style={{position:"relative",marginBottom:sp[5]}}>
          <Search size={15} color={$.L4} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)"}}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="ابحث في المقالات…" style={{...iStyle(),paddingRight:40,background:$.surface,boxShadow:SH.card}}/>
        </div>

        <div style={{display:"flex",gap:sp[2],marginBottom:sp[4],overflowX:"auto",paddingBottom:4}}>
          {allCategories.map(c => {
            const CatIcon = CATEGORY_ICONS[c.iconName] || BookOpen;
            return (
              <button key={c.id} onClick={()=>setActiveCat(c.id)} style={{flex:"none",padding:`${sp[2]}px ${sp[4]}px`,borderRadius:99,border:"none",cursor:"pointer",fontFamily:"inherit",background:activeCat===c.id?c.color:$.F4,color:activeCat===c.id?"#fff":$.L2,fontSize:13,fontWeight:600,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:6}}>
                <CatIcon size={14} strokeWidth={2.2}/>
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>

        <div style={{display:"flex",gap:sp[2],marginBottom:sp[4]}}>
          {[{id:"all",name:"الكل"},{id:"free",name:"المجانية"},{id:"premium",name:"للمشتركين"}].map(f => {
            const on = accessFilter===f.id;
            const fc = f.id==="free" ? $.green : f.id==="premium" ? $.orange : $.blue;
            return (
              <button key={f.id} onClick={()=>setAccessFilter(f.id)} style={{flex:1,padding:`${sp[2]}px ${sp[3]}px`,borderRadius:10,border:`1.5px solid ${on?fc:$.sepL}`,cursor:"pointer",fontFamily:"inherit",background:on?fc:"transparent",color:on?"#fff":$.L2,fontSize:12.5,fontWeight:on?700:600,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                {f.id==="free" && <Check size={13}/>}
                {f.id==="premium" && <Crown size={13}/>}
                <span>{f.name}</span>
              </button>
            );
          })}
        </div>

        <div style={{display:"grid",gridTemplateColumns:screen.isDesktop?"1fr 1fr 1fr":screen.isTablet?"1fr 1fr":"1fr",gap:sp[3]}}>
          {filteredArticles.length === 0 && (
            <p style={{fontSize:13,color:$.L4,textAlign:"center",padding:`${sp[6]}px 0`,gridColumn:"1/-1"}}>لا توجد مقالات مطابقة لهذا الفلتر</p>
          )}
          {filteredArticles.map((article, idx) => {
            const catInfo = getCategoryInfo(article.category);
            const CatIcon = CATEGORY_ICONS[catInfo.iconName] || BookOpen;
            const isFree = FREE_ARTICLE_IDS.includes(article.id);
            const locked = !isPremium && !isFree;
            return (
              <Card key={article.id} onClick={()=>handleArticleClick(article, idx)} style={{padding:sp[4],cursor:"pointer",position:"relative"}}>
                {locked && (
                  <div style={{position:"absolute",top:sp[3],left:sp[3],width:26,height:26,borderRadius:8,background:`${$.orange}18`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <Lock size={13} color={$.orange}/>
                  </div>
                )}
                <div style={{display:"flex",alignItems:"flex-start",gap:sp[4],opacity:locked?0.6:1}}>
                  <div style={{width:60,height:60,borderRadius:16,background:catInfo.gradient,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:`0 4px 12px ${catInfo.color}33`}}>
                    <CatIcon size={30} color="#ffffff" strokeWidth={2.4} absoluteStrokeWidth/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:15,fontWeight:700,color:$.L1,lineHeight:1.4,marginBottom:4}}>{article.title}</div>
                    <p style={{fontSize:12,color:$.L3,lineHeight:1.5,marginBottom:sp[2],overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{article.excerpt}</p>
                    <div style={{display:"flex",alignItems:"center",gap:sp[2],flexWrap:"wrap"}}>
                      <Chip text={catInfo.name} color={catInfo.color} bg={`${catInfo.color}15`} size={11}/>
                      <Chip text={article.level} color={getLevelColor(article.level)} bg={`${getLevelColor(article.level)}15`} size={11}/>
                      {isFree && <Chip text="مجاني" color={$.green} bg={`${$.green}15`} size={11}/>}
                      {locked && <Chip text="للمشتركين" color={$.orange} bg={`${$.orange}15`} size={11}/>}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Sheet open={!!activeArticle} onClose={()=>setActiveArticle(null)}>
          {activeArticle && (
            <div style={{padding:`0 ${sp[5]}px ${sp[8]}px`}}>
              {(() => {
                const catInfo = getCategoryInfo(activeArticle.category);
                const CatIcon = CATEGORY_ICONS[catInfo.iconName] || BookOpen;
                return (
                  <>
                    <div style={{background:catInfo.gradient,borderRadius:20,padding:`${sp[6]}px ${sp[5]}px`,marginBottom:sp[5]}}>
                      <div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:sp[3]}}>
                        <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(255,255,255,0.22)",borderRadius:99,padding:"5px 12px"}}>
                          <CatIcon size={13} color="#fff" strokeWidth={2.2}/>
                          <span style={{fontSize:11,fontWeight:600,color:"#fff"}}>{catInfo.name}</span>
                        </div>
                        <Chip text={activeArticle.level} color="rgba(255,255,255,0.95)" bg="rgba(255,255,255,0.22)"/>
                      </div>
                      <h2 style={{fontSize:22,fontWeight:800,color:"#fff",lineHeight:1.3}}>{activeArticle.title}</h2>
                    </div>
                    <div style={{fontSize:15,color:$.L2,lineHeight:1.9}}>
                      {activeArticle.content.split("\n\n").filter(p=>p.trim()).map((paragraph,i) => {
                        const trimmed = paragraph.trim();
                        if (trimmed.startsWith("═══")) {
                          const headerText = trimmed.replace(/═/g,"").trim();
                          return <h3 key={i} style={{fontSize:18,fontWeight:800,color:$.L1,marginTop:sp[6],marginBottom:sp[3]}}>{headerText}</h3>;
                        }
                        return <p key={i} style={{marginBottom:sp[3]}}>{trimmed}</p>;
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </Sheet>
      </div>
    </div>
  );
}
function SuggestionsScreen({isPremium, onNeedUpgrade}) {
  const screen = useScreenSize();
  const [budget,setBudget]=useState("");
  const [city,setCity]=useState("");
  const [sector,setSector]=useState("");
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState(null);
  const [result,setResult]=useState(null);

  function handleBudgetChange(e) {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw === "") { setBudget(""); return; }
    setBudget(numWithCommas(parseInt(raw)));
  }

  async function go() {
    if (!isPremium) { onNeedUpgrade(); return; }
    if (!budget.trim() || busy) return;
    setBusy(true); setErr(null); setResult(null);
    try {
      const cleanBudget = budget.replace(/,/g, "");
      const r = await apiCall("suggest", { budget:cleanBudget, city:city||null, sector:sector||null });
      setResult(r);
    } catch(e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  function typeColor(t) {
    if (t==="آمن") return $.green;
    if (t==="نمو") return $.blue;
    if (t==="مبتكر") return $.purple;
    return $.L3;
  }
  function riskColor(r) {
    if (r==="منخفض") return $.green;
    if (r==="متوسط") return $.orange;
    return $.red;
  }

  const containerStyle = screen.isDesktop ? {maxWidth:1100, margin:"0 auto"} : screen.isTablet ? {maxWidth:850, margin:"0 auto"} : {};

  return (
    <div style={{padding:`${sp[14]}px ${sp[5]}px ${sp[10]}px`}}>
      <div style={containerStyle}>
        <div style={{display:"flex",alignItems:"center",gap:sp[3],marginBottom:sp[2]}}>
          <div style={{width:46,height:46,borderRadius:14,background:"linear-gradient(145deg,#AF52DE,#7830B0)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Lightbulb size={22} color="#fff" strokeWidth={2}/>
          </div>
          <h1 style={{fontSize:screen.isDesktop?38:28,fontWeight:800,color:$.L1,letterSpacing:"-0.6px"}}>اقتراحات المشاريع</h1>
        </div>
        <p style={{fontSize:14,color:$.L3,marginBottom:sp[6],lineHeight:1.7}}>أدخل ميزانيتك واحصل على مشاريع واقعية تناسب قدرتك المالية، مدروسة حسب السوق السعودي</p>

        {!isPremium && (
          <Card style={{padding:sp[5],border:`1.5px solid ${$.orange}30`,background:`${$.orange}08`,marginBottom:sp[5],textAlign:"center"}}>
            <Crown size={28} color={$.orange} style={{marginBottom:sp[2]}}/>
            <div style={{fontSize:15,fontWeight:800,color:$.L1,marginBottom:sp[1]}}>قسم خاص بالمشتركين</div>
            <p style={{fontSize:13,color:$.L3,lineHeight:1.7,marginBottom:sp[4]}}>اشترك للحصول على اقتراحات مشاريع مخصصة لميزانيتك ومدينتك</p>
            <button onClick={onNeedUpgrade} style={{background:$.orange,color:"#fff",border:"none",borderRadius:12,padding:`${sp[3]}px ${sp[6]}px`,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>اشترك الآن</button>
          </Card>
        )}

        <Card style={{padding:sp[5],marginBottom:sp[5],opacity:isPremium?1:0.55,pointerEvents:isPremium?"auto":"none"}}>
          <FormField label="الميزانية المتاحة بالريال" icon={<Briefcase size={14} color={$.L4}/>}>
            <div style={{position:"relative"}}>
              <input value={budget} onChange={handleBudgetChange} placeholder="150,000" inputMode="numeric" style={{...iStyle(),paddingLeft:sp[10],fontSize:17,fontWeight:600,direction:"ltr",textAlign:"right"}}/>
              <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",fontSize:18,fontWeight:700,color:$.L3}}>﷼</div>
            </div>
          </FormField>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:sp[3]}}>
            <FormField label="المدينة (اختياري)" icon={<MapPin size={14} color={$.L4}/>}>
              <div style={{position:"relative"}}>
                <select value={city} onChange={e=>setCity(e.target.value)} style={{...iStyle(),paddingLeft:sp[8],cursor:"pointer",color:city?$.L1:$.L4}}>
                  <option value="">كل المدن</option>
                  {CITIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={13} color={$.L4} style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
              </div>
            </FormField>
            <FormField label="القطاع (اختياري)" icon={<Layers size={14} color={$.L4}/>}>
              <div style={{position:"relative"}}>
                <select value={sector} onChange={e=>setSector(e.target.value)} style={{...iStyle(),paddingLeft:sp[8],cursor:"pointer",color:sector?$.L1:$.L4}}>
                  <option value="">كل القطاعات</option>
                  {SECTOR_OPTIONS.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={13} color={$.L4} style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
              </div>
            </FormField>
          </div>
          {err && <div style={{marginTop:sp[3],background:`${$.red}09`,border:`1px solid ${$.red}25`,borderRadius:12,padding:`${sp[3]}px ${sp[4]}px`,fontSize:13,color:$.red,lineHeight:1.6}}>{err}</div>}
          <button onClick={go} disabled={!budget.trim()||busy} style={{width:"100%",marginTop:sp[4],background:budget.trim()&&!busy?"linear-gradient(145deg,#AF52DE,#7830B0)":$.F3,color:budget.trim()&&!busy?"#fff":$.L4,border:"none",borderRadius:14,padding:`${sp[4]}px`,fontSize:15,fontWeight:700,cursor:budget.trim()&&!busy?"pointer":"not-allowed",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:sp[2]}}>
            {busy?<><Spinner sz={16}/>جاري إعداد الاقتراحات…</>:<><Sparkles size={16}/>اقترح لي مشاريع</>}
          </button>
        </Card>

        {result && (
          <>
            {result.budget_assessment && (
              <Card style={{padding:sp[5],marginBottom:sp[4],border:`1.5px solid ${$.purple}25`,background:`${$.purple}06`}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:sp[2]}}>
                  <Info size={15} color={$.purple}/>
                  <span style={{fontSize:13,fontWeight:800,color:$.purple}}>تقييم ميزانيتك</span>
                </div>
                <p style={{fontSize:14,color:$.L1,lineHeight:1.8}}>{result.budget_assessment}</p>
              </Card>
            )}
            <div style={{display:"grid",gridTemplateColumns:screen.isDesktop?"1fr 1fr":"1fr",gap:sp[3]}}>
              {(result.suggestions||[]).map((s,i)=>(
                <Card key={i} style={{padding:sp[5]}}>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:sp[3],marginBottom:sp[3]}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:16,fontWeight:800,color:$.L1,lineHeight:1.4,marginBottom:sp[2]}}>{s.name}</div>
                      <div style={{display:"flex",gap:sp[2],flexWrap:"wrap"}}>
                        {s.sector && <Chip text={s.sector} color={$.L3} bg={$.F4}/>}
                        {s.type && <Chip text={s.type} color={typeColor(s.type)} bg={`${typeColor(s.type)}15`}/>}
                        {s.risk_level && <Chip text={`مخاطرة ${s.risk_level}`} color={riskColor(s.risk_level)} bg={`${riskColor(s.risk_level)}15`}/>}
                      </div>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:sp[2],marginBottom:sp[3]}}>
                    <div style={{background:$.F5,borderRadius:10,padding:`${sp[3]}px ${sp[2]}px`,textAlign:"center"}}>
                      <div style={{fontSize:10,color:$.L4,marginBottom:2}}>التأسيس</div>
                      <div style={{fontSize:12,fontWeight:700,color:$.L1}}>{s.setup_cost}</div>
                    </div>
                    <div style={{background:$.F5,borderRadius:10,padding:`${sp[3]}px ${sp[2]}px`,textAlign:"center"}}>
                      <div style={{fontSize:10,color:$.L4,marginBottom:2}}>ربح شهري</div>
                      <div style={{fontSize:12,fontWeight:700,color:$.green}}>{s.monthly_profit_estimate}</div>
                    </div>
                    <div style={{background:$.F5,borderRadius:10,padding:`${sp[3]}px ${sp[2]}px`,textAlign:"center"}}>
                      <div style={{fontSize:10,color:$.L4,marginBottom:2}}>التعادل</div>
                      <div style={{fontSize:12,fontWeight:700,color:$.L1}}>{s.break_even}</div>
                    </div>
                  </div>
                  {s.why_fits && (
                    <div style={{marginBottom:sp[2],display:"flex",gap:6}}>
                      <CheckCircle size={14} color={$.green} style={{flexShrink:0,marginTop:2}}/>
                      <span style={{fontSize:13,color:$.L2,lineHeight:1.6}}>{s.why_fits}</span>
                    </div>
                  )}
                  {s.main_challenge && (
                    <div style={{marginBottom:sp[2],display:"flex",gap:6}}>
                      <AlertTriangle size={14} color={$.orange} style={{flexShrink:0,marginTop:2}}/>
                      <span style={{fontSize:13,color:$.L2,lineHeight:1.6}}>{s.main_challenge}</span>
                    </div>
                  )}
                  {s.success_tip && (
                    <div style={{display:"flex",gap:6,background:`${$.blue}08`,borderRadius:10,padding:`${sp[2]}px ${sp[3]}px`,marginTop:sp[3]}}>
                      <Lightbulb size={14} color={$.blue} style={{flexShrink:0,marginTop:2}}/>
                      <span style={{fontSize:12.5,color:$.L2,lineHeight:1.6}}>{s.success_tip}</span>
                    </div>
                  )}
                </Card>
              ))}
            </div>
            <p style={{fontSize:11,color:$.L4,textAlign:"center",marginTop:sp[5],lineHeight:1.7}}>الأرقام تقديرية مبنية على متوسطات السوق. ننصح بدراسة جدوى تفصيلية قبل أي قرار استثماري.</p>
          </>
        )}
      </div>
    </div>
  );
}

const NAV = [
  {id:"home", name:"الرئيسية", Icon:Home},
  {id:"advisor", name:"المستشار", Icon:Sparkles},
  {id:"suggestions", name:"اقتراحات", Icon:Lightbulb},
  {id:"saved", name:"تحليلاتي", Icon:Archive},
  {id:"sectors", name:"القطاعات", Icon:Grid},
  {id:"learning", name:"التعلم", Icon:BookOpen},
  {id:"settings", name:"حسابي", Icon:Settings}
];

function HamburgerNav({active, onChange, user, isPremium, dark, onToggleDark}) {
  const [open, setOpen] = useState(false);
  const current = NAV.find(n => n.id === active);

  const ICON_BG = {
    home: $.blue, advisor: $.green, suggestions: $.purple,
    saved: $.orange, sectors: $.red, learning: $.blue, settings: $.L4
  };

  function go(id) {
    onChange(id);
    setTimeout(() => setOpen(false), 180);
  }

  return (
    <>
      {/* الشريط العلوي الثابت */}
      <div className="no-print" style={{position:"fixed",top:0,left:0,right:0,zIndex:90,background:$.surface,borderBottom:`0.5px solid ${$.sep}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:`max(${sp[3]}px,env(safe-area-inset-top)) ${sp[4]}px ${sp[3]}px`}}>
        <button onClick={()=>setOpen(true)} aria-label="القائمة" style={{width:38,height:38,borderRadius:11,background:$.F4,border:"none",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,cursor:"pointer"}}>
          <span style={{width:17,height:2,background:$.L1,borderRadius:2}}/>
          <span style={{width:17,height:2,background:$.L1,borderRadius:2}}/>
          <span style={{width:17,height:2,background:$.L1,borderRadius:2}}/>
        </button>
        <div style={{fontSize:15,fontWeight:800,color:$.L1}}>{current?.name || "هامور"}</div>
        {isPremium ? (
          <div style={{width:34,height:34,borderRadius:"50%",background:`${$.orange}18`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Crown size={16} color={$.orange}/>
          </div>
        ) : (
          <button onClick={()=>go("settings")} style={{width:34,height:34,borderRadius:"50%",background:`linear-gradient(135deg,${$.blue},${$.purple})`,border:"none",cursor:"pointer"}}/>
        )}
      </div>

      {/* الخلفية المعتمة */}
      <div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,background:"rgba(11,19,32,0.45)",opacity:open?1:0,pointerEvents:open?"auto":"none",transition:".3s",zIndex:98}}/>

      {/* الشريط الجانبي */}
      <div className="no-print" style={{position:"fixed",top:0,bottom:0,right:0,width:"78%",maxWidth:290,background:$.surface,zIndex:99,transform:open?"translateX(0)":"translateX(100%)",transition:".35s cubic-bezier(.32,.72,0,1)",boxShadow:"-8px 0 24px rgba(0,0,0,0.12)",display:"flex",flexDirection:"column",paddingTop:"env(safe-area-inset-top)",paddingBottom:"env(safe-area-inset-bottom)"}}>

        <div style={{padding:`${sp[5]}px ${sp[5]}px ${sp[4]}px`,borderBottom:`0.5px solid ${$.sepL}`,display:"flex",alignItems:"center",gap:sp[3]}}>
          <div style={{width:46,height:46,borderRadius:14,background:`linear-gradient(135deg,${$.blue},${$.purple})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:17,fontWeight:800,flexShrink:0}}>
            {(user?.email?.[0] || "ه").toUpperCase()}
          </div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:14,fontWeight:700,color:$.L1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.email || "زائر"}</div>
            <div style={{fontSize:11,color:isPremium?$.orange:$.L4,display:"flex",alignItems:"center",gap:4,marginTop:2}}>
              {isPremium && <Crown size={11}/>}
              <span>{isPremium ? "مشترك · حسابك نشط" : "الباقة المجانية"}</span>
            </div>
          </div>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:`${sp[3]}px`}}>
          {NAV.map(n => {
            const on = active === n.id;
            return (
              <button key={n.id} onClick={()=>go(n.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:sp[3],padding:`${sp[3]}px ${sp[3]}px`,borderRadius:13,border:"none",cursor:"pointer",fontFamily:"inherit",background:on?`${$.blue}14`:"transparent",marginBottom:2}}>
                <div style={{width:34,height:34,borderRadius:10,background:`${ICON_BG[n.id]}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <n.Icon size={16} color={ICON_BG[n.id]} strokeWidth={2.2}/>
                </div>
                <span style={{fontSize:14,fontWeight:on?700:500,color:on?$.blue:$.L1}}>{n.name}</span>
              </button>
            );
          })}
        </div>

        <div style={{padding:`${sp[3]}px ${sp[4]}px`,borderTop:`0.5px solid ${$.sepL}`,display:"flex",flexDirection:"column",gap:sp[1]}}>
          <button onClick={onToggleDark} style={{display:"flex",alignItems:"center",gap:sp[3],padding:`${sp[2]}px ${sp[3]}px`,borderRadius:11,border:"none",cursor:"pointer",fontFamily:"inherit",background:"transparent"}}>
            {dark ? <Sun size={16} color={$.L3}/> : <Moon size={16} color={$.L3}/>}
            <span style={{fontSize:12.5,fontWeight:500,color:$.L2}}>{dark?"الوضع النهاري":"الوضع الليلي"}</span>
          </button>
          <button onClick={()=>setOpen(false)} style={{width:"100%",padding:`${sp[2]}px`,background:$.F4,border:"none",borderRadius:11,fontFamily:"inherit",fontSize:12,fontWeight:600,color:$.L3,cursor:"pointer"}}>إغلاق</button>
        </div>
      </div>
    </>
  );
}

function SideNav({active, onChange, user, dark, onToggleDark, isPremium}) {
  return (
    <div className="no-print" style={{position:"fixed",top:0,right:0,bottom:0,width:260,zIndex:100,background:$.surface,borderLeft:`0.5px solid ${$.sep}`,display:"flex",flexDirection:"column",padding:`${sp[6]}px ${sp[4]}px`}}>
      <div style={{display:"flex",alignItems:"center",gap:sp[3],padding:`0 ${sp[3]}px`,marginBottom:sp[8]}}>
        <div style={{width:44,height:44,borderRadius:14,background:"linear-gradient(145deg,#1D6EF5,#0055D4)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
          <img src="/logo.png" alt="هامور" style={{width:32,height:32,objectFit:"contain"}}/>
        </div>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:$.L1}}>هامور</div>
          <div style={{fontSize:11,color:$.L3}}>دراسة جدوى ذكية</div>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:sp[1],flex:1}}>
        {NAV.map(n => {
          const on = active === n.id;
          return (
            <button key={n.id} onClick={()=>onChange(n.id)} style={{display:"flex",alignItems:"center",gap:sp[3],padding:`${sp[3]}px ${sp[3]}px`,borderRadius:12,border:"none",cursor:"pointer",fontFamily:"inherit",background:on?$.blue:"transparent",width:"100%"}}>
              <n.Icon size={20} color={on?"#fff":$.L3} strokeWidth={on?2.4:2}/>
              <span style={{fontSize:14,fontWeight:on?700:500,color:on?"#fff":$.L2}}>{n.name}</span>
            </button>
          );
        })}
      </div>
      <div style={{borderTop:`0.5px solid ${$.sepL}`,paddingTop:sp[3],marginTop:sp[3]}}>
        {isPremium && (
          <div style={{display:"flex",alignItems:"center",gap:6,padding:`${sp[2]}px ${sp[3]}px`,marginBottom:sp[2]}}>
            <Crown size={14} color={$.orange}/>
            <span style={{fontSize:12,fontWeight:700,color:$.orange}}>اشتراك مفعّل</span>
          </div>
        )}
        <button onClick={onToggleDark} style={{display:"flex",alignItems:"center",gap:sp[3],padding:`${sp[3]}px`,borderRadius:12,border:"none",cursor:"pointer",fontFamily:"inherit",background:"transparent",width:"100%"}}>
          {dark ? <Sun size={18} color={$.L3}/> : <Moon size={18} color={$.L3}/>}
          <span style={{fontSize:13,fontWeight:500,color:$.L2}}>{dark?"الوضع النهاري":"الوضع الليلي"}</span>
        </button>
        {user && (
          <div style={{padding:`${sp[3]}px`,fontSize:11,color:$.L4,overflow:"hidden",textOverflow:"ellipsis"}}>{user.email}</div>
        )}
      </div>
    </div>
  );
}

function LegalSheet({open, onClose}) {
  return (
    <Sheet open={open} onClose={onClose}>
      <div style={{padding:`0 ${sp[5]}px ${sp[8]}px`,maxHeight:"75vh",overflowY:"auto"}}>
        <h2 style={{fontSize:20,fontWeight:800,color:$.L1,marginBottom:sp[2]}}>الشروط والسياسات</h2>
        <p style={{fontSize:11,color:$.L4,marginBottom:sp[4]}}>آخر تحديث: 2 يوليو 2026</p>

        <div style={{marginBottom:sp[5]}}>
          <h3 style={{fontSize:15,fontWeight:700,color:$.L1,marginBottom:sp[2]}}>طبيعة الخدمة</h3>
          <p style={{fontSize:13,color:$.L2,lineHeight:1.9}}>
            هامور أداة استرشادية لتحليل المشاريع تعتمد على الذكاء الاصطناعي ونتائج بحث من مصادر عامة. التحليلات والأرقام تقديرية بطبيعتها وقد تختلف عن الواقع، ولا تُعدّ دراسة جدوى ميدانية معتمدة ولا نصيحة استثمارية أو قانونية. أنت وحدك مسؤول عن أي قرار تتخذه بناءً عليها، ونوصي بالرجوع لمختص قبل أي استثمار.
          </p>
        </div>

        <div style={{marginBottom:sp[5]}}>
          <h3 style={{fontSize:15,fontWeight:700,color:$.L1,marginBottom:sp[2]}}>الباقات والأسعار</h3>
          <p style={{fontSize:13,color:$.L2,lineHeight:1.9}}>
            الباقة المجانية: تحليلان اثنان مع وصول محدود للمقالات. الاشتراك الشهري: 19.99 ريال لمدة 30 يوماً. الاشتراك السنوي: 199.99 ريال لمدة 365 يوماً. الاشتراك يتيح حتى 10 تحليلات لكل فترة اشتراك (لا تتجدد إلا مع اشتراك جديد) وفتح كامل المقالات وقسم الاقتراحات. الأسعار شاملة ضريبة القيمة المضافة.
          </p>
        </div>

        <div style={{marginBottom:sp[5]}}>
          <h3 style={{fontSize:15,fontWeight:700,color:$.L1,marginBottom:sp[2]}}>الاسترجاع والإلغاء</h3>
          <p style={{fontSize:13,color:$.L2,lineHeight:1.9}}>
            الاشتراك لا يُجدَّد تلقائياً، وينتهي بانتهاء مدته دون خصم إضافي. يمكنك طلب استرداد كامل المبلغ خلال 24 ساعة من الاشتراك بشرط ألا تكون قد أجريت تحليلاً جديداً بعد التفعيل. بعد استخدام الخدمة لا يمكن الاسترداد لأن التحليل خدمة رقمية تُستهلك فور تنفيذها. لطلب الاسترجاع راسلنا من بريدك المسجّل.
          </p>
        </div>

        <div style={{marginBottom:sp[5]}}>
          <h3 style={{fontSize:15,fontWeight:700,color:$.L1,marginBottom:sp[2]}}>الخصوصية</h3>
          <p style={{fontSize:13,color:$.L2,lineHeight:1.9}}>
            نجمع الحد الأدنى من البيانات: بريدك واسمك لإنشاء حسابك، والتحليلات التي تنشئها لحفظها. لا نجمع بيانات بطاقتك البنكية إطلاقاً — الدفع يتم عبر بوابة مرخّصة من البنك المركزي السعودي ولا تمرّ بياناتك المالية عبر خوادمنا. لا نبيع بياناتك ولا نشاركها لأغراض تسويقية. يمكنك حذف تحليلاتك أو طلب حذف حسابك في أي وقت.
          </p>
        </div>

        <a href="/legal" target="_blank" rel="noopener noreferrer"
          style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,width:"100%",background:$.F3,color:$.blue,borderRadius:12,padding:`${sp[3]}px`,fontSize:13,fontWeight:700,textDecoration:"none",marginBottom:sp[4]}}>
          <FileText size={15}/>عرض النسخة الكاملة
        </a>

        <div style={{background:$.F3,borderRadius:12,padding:`${sp[4]}px`,display:"flex",alignItems:"center",gap:10}}>
          <Mail size={16} color={$.blue} style={{flexShrink:0}}/>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:$.L1,marginBottom:2}}>للتواصل والدعم</div>
            <a href="mailto:hamoorservice@gmail.com" style={{fontSize:12,color:$.blue,textDecoration:"none"}}>hamoorservice@gmail.com</a>
          </div>
        </div>

        <p style={{fontSize:11,color:$.L4,marginTop:sp[5],lineHeight:1.7,textAlign:"center"}}>
          باستخدامك تطبيق هامور فإنك توافق على هذه الشروط. قد نحدّثها من وقت لآخر.
        </p>
      </div>
    </Sheet>
  );
}

function SettingsScreen({user, profile, isPremium, dark, onToggleDark, onNeedUpgrade, onLogout, onNameUpdated, onSubscriptionChange}) {
  const screen = useScreenSize();
  const [name, setName] = useState(profile?.name || "");
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelErr, setCancelErr] = useState(null);
  const [showLegal, setShowLegal] = useState(false);

  async function doCancel() {
    if (cancelling) return;
    setCancelling(true); setCancelErr(null);
    try {
      await cancelSubscription(user.id);
      setConfirmCancel(false);
      if (onSubscriptionChange) await onSubscriptionChange();
    } catch(e) {
      setCancelErr(e.message);
    }
    setCancelling(false);
  }

  async function saveName() {
    if (savingName) return;
    setSavingName(true); setNameMsg(null);
    try {
      await updateName(user.id, name);
      setNameMsg({type:"ok", text:"تم حفظ الاسم"});
      onNameUpdated(name.trim());
    } catch(e) {
      setNameMsg({type:"err", text:e.message});
    }
    setSavingName(false);
  }

  const joinDate = user?.created_at ? gregorianDate(new Date(user.created_at)) : "-";
  const containerStyle = screen.isDesktop ? {maxWidth:680, margin:"0 auto"} : {};

  return (
    <div style={{padding:`${sp[14]}px ${sp[5]}px ${sp[10]}px`}}>
      <div style={containerStyle}>
        <h1 style={{fontSize:30,fontWeight:800,color:$.L1,marginBottom:4}}>حسابي</h1>
        <p style={{fontSize:14,color:$.L3,marginBottom:sp[6]}}>إدارة حسابك وإعدادات التطبيق</p>

        <Card style={{marginBottom:sp[4]}}>
          <div style={{padding:`${sp[5]}px`,display:"flex",alignItems:"center",gap:sp[4],borderBottom:`0.5px solid ${$.sepL}`}}>
            <div style={{width:64,height:64,borderRadius:20,background:"linear-gradient(145deg,#1D6EF5,#0055D4)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <User size={30} color="#fff" strokeWidth={2}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:17,fontWeight:800,color:$.L1,marginBottom:2}}>{profile?.name || "مستخدم هامور"}</div>
              <div style={{fontSize:12,color:$.L3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.email}</div>
            </div>
            {isPremium && (
              <div style={{display:"flex",alignItems:"center",gap:5,background:`${$.orange}15`,borderRadius:99,padding:"5px 12px",flexShrink:0}}>
                <Crown size={13} color={$.orange}/>
                <span style={{fontSize:11,fontWeight:700,color:$.orange}}>مشترك</span>
              </div>
            )}
          </div>
        </Card>

        <Card style={{marginBottom:sp[4],padding:`${sp[5]}px`}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:sp[4]}}>
            <User size={16} color={$.blue}/>
            <span style={{fontSize:15,fontWeight:700,color:$.L1}}>الاسم</span>
          </div>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="أدخل اسمك" style={{...iStyle(),marginBottom:sp[3]}}/>
          {nameMsg && (
            <div style={{marginBottom:sp[3],fontSize:13,fontWeight:600,color:nameMsg.type==="ok"?$.green:$.red}}>{nameMsg.text}</div>
          )}
          <button onClick={saveName} disabled={savingName||!name.trim()} style={{width:"100%",background:name.trim()&&!savingName?$.blue:$.F3,color:name.trim()&&!savingName?"#fff":$.L4,border:"none",borderRadius:12,padding:`${sp[3]}px`,fontSize:14,fontWeight:700,cursor:name.trim()&&!savingName?"pointer":"not-allowed",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            {savingName?<><Spinner sz={15}/>جاري الحفظ…</>:<>حفظ الاسم</>}
          </button>
        </Card>

        <Card style={{marginBottom:sp[4],padding:`${sp[5]}px`}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:sp[4]}}>
            <Crown size={16} color={$.orange}/>
            <span style={{fontSize:15,fontWeight:700,color:$.L1}}>الاشتراك</span>
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:`${sp[3]}px ${sp[4]}px`,background:isPremium?`${$.orange}10`:$.F5,borderRadius:12,marginBottom:isPremium?0:sp[3]}}>
            <span style={{fontSize:13,color:$.L2,fontWeight:600}}>الحالة الحالية</span>
            <span style={{fontSize:13,fontWeight:800,color:isPremium?$.orange:$.L3}}>{isPremium?"مشترك":"مجاني"}</span>
          </div>
          {!isPremium && (
            <button onClick={onNeedUpgrade} style={{width:"100%",background:"linear-gradient(150deg,#FFB800,#FF9500)",color:"#fff",border:"none",borderRadius:12,padding:`${sp[3]}px`,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              <Crown size={15}/>اشترك الآن
            </button>
          )}
          {isPremium && (
            <>
              <p style={{fontSize:12,color:$.L3,marginTop:sp[3],marginBottom:sp[3],lineHeight:1.6}}>اشتراكك مفعّل — كل المزايا مفتوحة لك</p>
              {cancelErr && <div style={{marginBottom:sp[3],background:`${$.red}09`,border:`1px solid ${$.red}25`,borderRadius:12,padding:`${sp[3]}px ${sp[4]}px`,fontSize:13,color:$.red}}>{cancelErr}</div>}
              <button onClick={()=>setConfirmCancel(true)} style={{width:"100%",background:"transparent",color:$.red,border:`1.5px solid ${$.red}25`,borderRadius:12,padding:`${sp[3]}px`,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>إلغاء الاشتراك</button>
            </>
          )}
        </Card>

        <Card style={{marginBottom:sp[4],padding:`${sp[5]}px`}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:sp[4]}}>
            {dark ? <Moon size={16} color={$.indigo}/> : <Sun size={16} color={$.orange}/>}
            <span style={{fontSize:15,fontWeight:700,color:$.L1}}>وضع التطبيق</span>
          </div>
          <button onClick={onToggleDark} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:$.F5,border:"none",borderRadius:12,padding:`${sp[3]}px ${sp[4]}px`,cursor:"pointer",fontFamily:"inherit"}}>
            <span style={{fontSize:14,fontWeight:600,color:$.L1}}>{dark?"الوضع الليلي":"الوضع النهاري"}</span>
            <div style={{width:48,height:28,borderRadius:99,background:dark?$.indigo:$.F3,position:"relative",transition:"background .2s"}}>
              <div style={{position:"absolute",top:3,right:dark?3:23,width:22,height:22,borderRadius:"50%",background:"#fff",transition:"right .2s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}/>
            </div>
          </button>
        </Card>

        <Card style={{marginBottom:sp[4],padding:`${sp[5]}px`}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:sp[4]}}>
            <Info size={16} color={$.teal}/>
            <span style={{fontSize:15,fontWeight:700,color:$.L1}}>معلومات الحساب</span>
          </div>
          <Row label="البريد الإلكتروني" value={user?.email||"-"}/>
          <Row label="تاريخ الانضمام" value={joinDate}/>
          <div style={{padding:`${sp[2]}px 0`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:13,color:$.L2}}>نوع الباقة</span>
              <span style={{fontSize:14,fontWeight:700,color:isPremium?$.orange:$.L1}}>{isPremium?"مشترك":"مجاني"}</span>
            </div>
          </div>
        </Card>

        <button onClick={()=>setShowLegal(true)} style={{width:"100%",background:$.surface,color:$.L2,border:`1px solid ${$.sepL}`,borderRadius:14,padding:`${sp[4]}px`,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:sp[3]}}>
          <Shield size={16}/>الخصوصية والشروط
        </button>

        <button onClick={()=>setConfirmLogout(true)} style={{width:"100%",background:$.surface,color:$.red,border:`1.5px solid ${$.red}25`,borderRadius:14,padding:`${sp[4]}px`,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:SH.card}}>
          <LogOut size={17}/>تسجيل الخروج
        </button>

        <p style={{fontSize:11,color:$.L4,textAlign:"center",marginTop:sp[6]}}>هامور · الإصدار 1.1</p>
      </div>

      <LegalSheet open={showLegal} onClose={()=>setShowLegal(false)}/>

      <Sheet open={confirmLogout} onClose={()=>setConfirmLogout(false)}>
        <div style={{padding:`${sp[5]}px ${sp[5]}px ${sp[8]}px`,textAlign:"center"}}>
          <div style={{width:64,height:64,borderRadius:20,background:`${$.red}15`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto",marginBottom:sp[5]}}>
            <LogOut size={28} color={$.red}/>
          </div>
          <h3 style={{fontSize:20,fontWeight:800,color:$.L1,marginBottom:sp[2]}}>تسجيل الخروج؟</h3>
          <p style={{fontSize:14,color:$.L3,marginBottom:sp[6]}}>ستحتاج لتسجيل الدخول مرة أخرى للوصول لحسابك</p>
          <div style={{display:"flex",gap:sp[3]}}>
            <button onClick={()=>setConfirmLogout(false)} style={{flex:1,background:$.F3,color:$.L1,border:"none",borderRadius:12,padding:sp[3],fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>إلغاء</button>
            <button onClick={onLogout} style={{flex:1,background:$.red,color:"#fff",border:"none",borderRadius:12,padding:sp[3],fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>خروج</button>
          </div>
        </div>
      </Sheet>

      <Sheet open={confirmCancel} onClose={()=>!cancelling&&setConfirmCancel(false)}>
        <div style={{padding:`${sp[5]}px ${sp[5]}px ${sp[8]}px`,textAlign:"center"}}>
          <div style={{width:64,height:64,borderRadius:20,background:`${$.red}15`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto",marginBottom:sp[5]}}>
            <Crown size={28} color={$.red}/>
          </div>
          <h3 style={{fontSize:20,fontWeight:800,color:$.L1,marginBottom:sp[2]}}>إلغاء الاشتراك؟</h3>
          <p style={{fontSize:14,color:$.L3,marginBottom:sp[6],lineHeight:1.7}}>سيعود حسابك للباقة المجانية، وستفقد الوصول للمزايا المدفوعة مثل قسم الاقتراحات والتحليلات الكاملة</p>
          {cancelErr && <div style={{marginBottom:sp[4],background:`${$.red}09`,border:`1px solid ${$.red}25`,borderRadius:12,padding:`${sp[3]}px ${sp[4]}px`,fontSize:13,color:$.red}}>{cancelErr}</div>}
          <div style={{display:"flex",gap:sp[3]}}>
            <button onClick={()=>setConfirmCancel(false)} disabled={cancelling} style={{flex:1,background:$.F3,color:$.L1,border:"none",borderRadius:12,padding:sp[3],fontSize:14,fontWeight:700,cursor:cancelling?"not-allowed":"pointer",fontFamily:"inherit"}}>تراجع</button>
            <button onClick={doCancel} disabled={cancelling} style={{flex:1,background:$.red,color:"#fff",border:"none",borderRadius:12,padding:sp[3],fontSize:14,fontWeight:700,cursor:cancelling?"not-allowed":"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              {cancelling?<><Spinner sz={14}/>جاري الإلغاء…</>:<>تأكيد الإلغاء</>}
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

export default function HamourApp() {
  const screen = useScreenSize();
  const [tab, setTab] = useState("home");
  const [advisorSelectedId, setAdvisorSelectedId] = useState(null);
  const [result, setResult] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [analyses, setAnalyses] = useState([]);
  const [usageCount, setUsageCount] = useState(0);
  const [premiumUsageCount, setPremiumUsageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "dark") { setDark(true); $ = DARK; }
    } catch(e) {}
  }, []);

  function toggleDark() {
    setDark(d => {
      const next = !d;
      $ = next ? DARK : LIGHT;
      try { localStorage.setItem(THEME_KEY, next?"dark":"light"); } catch(e) {}
      return next;
    });
  }

  const loadProfile = useCallback(async (uid) => {
    const p = await getProfile(uid);
    setProfile(p);
    setIsPremium(!!p.is_premium);
    const used = await getUsage(uid);
    setUsageCount(used);
    const premiumUsed = await getPremiumUsage(uid);
    setPremiumUsageCount(premiumUsed);
  }, []);

  const refreshAnalyses = useCallback(async () => {
    const u = await getCurrentUser();
    if (!u) return;
    const list = await getAnalysesCloud(u.id);
    setAnalyses(list);
  }, []);

  useEffect(() => {
    let sub;
    (async () => {
      const u = await getCurrentUser();
      setUser(u);
      if (u) {
        await loadProfile(u.id);
        const list = await getAnalysesCloud(u.id);
        setAnalyses(list);
      }
      setLoading(false);
      sub = onAuthChange(async (newUser) => {
        setUser(newUser);
        if (newUser) {
          await loadProfile(newUser.id);
          const list = await getAnalysesCloud(newUser.id);
          setAnalyses(list);
        } else {
          setAnalyses([]);
          setProfile(null);
          setIsPremium(false);
          setResult(null);
        }
      });
    })();
    return () => { if (sub) sub.unsubscribe(); };
  }, [loadProfile]);

  async function handleLogin(u) {
    setUser(u);
    await loadProfile(u.id);
    const list = await getAnalysesCloud(u.id);
    setAnalyses(list);
  }

  async function handleLogout() {
    await signOut();
    setUser(null);
    setAnalyses([]);
    setProfile(null);
    setIsPremium(false);
    setResult(null);
    setTab("home");
  }

  function handleAnalyze(analysis) {
    const normalized = analysis.data ? {...analysis.data, id:analysis.id, savedAt:analysis.created_at} : analysis;
    setResult(normalized);
    setAnalyses(prev => [normalized, ...prev.filter(a => a.id !== normalized.id)]);
    setTab("analysis");
    // زيادة العدّاد المخفي (لا ينقص عند الحذف) — عدّاد منفصل للمشترك وللمجاني
    if (user) {
      if (isPremium) {
        setPremiumUsageCount(c => c + 1);
        incrementPremiumUsage(user.id);
      } else {
        setUsageCount(c => c + 1);
        incrementUsage(user.id);
      }
    }
  }

  function handleViewAnalysis(analysis) {
    setResult(analysis);
    setTab("analysis");
  }

  function handleUpdateResult(updated) {
    const merged = {...updated, id: result?.id, savedAt: result?.savedAt};
    setResult(merged);
    setAnalyses(prev => prev.map(a => a.id === merged.id ? merged : a));
    if (user && merged.id) {
      updateAnalysisCloud(merged).catch(()=>{});
    }
  }

  async function handleActivated() {
    if (user) await loadProfile(user.id);
  }

  function handleNameUpdated(newName) {
    setProfile(p => ({...(p||{}), name:newName}));
  }

  if (loading) {
    return (
      <div key={dark?"d":"l"} style={{minHeight:"100vh",background:$.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Spinner sz={32} clr={$.blue}/>
      </div>
    );
  }

  if (!user) {
    return (
      <div key={dark?"d":"l"} style={{fontFamily:APP_FONT}}>
        <style>{`@keyframes _spin{to{transform:rotate(360deg)}}*{-webkit-tap-highlight-color:transparent}body{margin:0}`}</style>
        <AuthScreen onSuccess={handleLogin}/>
      </div>
    );
  }

  return (
    <div key={dark?"d":"l"} style={{minHeight:"100vh",background:$.bg,fontFamily:APP_FONT,direction:"rtl"}}>
      <style>{`
        @keyframes _spin{to{transform:rotate(360deg)}}
        @keyframes _float1{0%,100%{transform:translate(0,0);opacity:.25}50%{transform:translate(18px,-22px);opacity:.75}}
        @keyframes _float2{0%,100%{transform:translate(0,0);opacity:.3}50%{transform:translate(-20px,16px);opacity:.65}}
        @keyframes _float3{0%,100%{transform:translate(0,0);opacity:.2}50%{transform:translate(14px,18px);opacity:.6}}
        @keyframes _mesh1{0%,100%{transform:translate(12%,18%);opacity:0}50%{transform:translate(58%,62%);opacity:1}}
        @keyframes _mesh2{0%,100%{transform:translate(78%,22%);opacity:0}50%{transform:translate(34%,72%);opacity:1}}
        @media print {
          @page { margin: 1.5cm; }
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          ._dotsbg, ._spark { display: none !important; }
          .analysis-print { padding: 0 !important; }
          .analysis-print * { color: #1a1a1a !important; box-shadow: none !important; }
          .pdf-card { border: 1px solid #d1d5db !important; background: #fff !important; page-break-inside: avoid; margin-bottom: 10px !important; }
          .print-only * { color: inherit !important; }
        }
        *{-webkit-tap-highlight-color:transparent;box-sizing:border-box}
        body{margin:0}
        ::-webkit-scrollbar{width:0;height:0}
        select option{background:${$.surface};color:${$.L1}}
        ._dotsbg{position:fixed;inset:0;z-index:0;pointer-events:none;
          background-image:radial-gradient(circle,${$.blue} 1px,transparent 1px);
          background-size:30px 30px;opacity:${dark?0.16:0.14}}
        ._spark{position:fixed;border-radius:50%;z-index:0;pointer-events:none;
          background:${$.blue};${dark?`box-shadow:0 0 10px 2px ${$.blue}`:"opacity:.25"}}
      `}</style>

      <div className="_dotsbg"/>
      <div className="_spark" style={{width:5,height:5,top:"14%",left:"18%",animation:"_float1 8s infinite"}}/>
      <div className="_spark" style={{width:4,height:4,top:"34%",left:"76%",animation:"_float2 10s infinite"}}/>
      <div className="_spark" style={{width:6,height:6,top:"58%",left:"28%",animation:"_float3 9s infinite"}}/>
      <div className="_spark" style={{width:4,height:4,top:"78%",left:"80%",animation:"_float1 11s infinite"}}/>
      <div className="_spark" style={{width:5,height:5,top:"48%",left:"55%",animation:"_float2 8.5s infinite"}}/>

      <div style={{position:"relative",zIndex:1,paddingRight:screen.isDesktop?260:0, paddingTop:screen.isDesktop?0:`calc(52px + env(safe-area-inset-top))`}}>
        {tab==="home" && <HomeScreen onAnalyze={handleAnalyze} onViewLast={handleViewAnalysis} onViewSaved={()=>setTab("saved")} onGoSectors={()=>setTab("sectors")} onGoLearning={()=>setTab("learning")} onGoSuggestions={()=>setTab("suggestions")} user={user} analyses={analyses} usageCount={usageCount} premiumUsageCount={premiumUsageCount} isPremium={isPremium} onNeedUpgrade={()=>setShowUpgrade(true)}/>}
        {tab==="analysis" && <AnalysisScreen result={result} onUpdate={handleUpdateResult} user={user} isPremium={isPremium} onNeedUpgrade={()=>setShowUpgrade(true)}/>}
        {tab==="suggestions" && <SuggestionsScreen isPremium={isPremium} onNeedUpgrade={()=>setShowUpgrade(true)}/>}
        {tab==="advisor" && <AdvisorHubScreen analyses={analyses} user={user} selectedId={advisorSelectedId} onSelect={setAdvisorSelectedId} onBack={()=>setAdvisorSelectedId(null)} isPremium={isPremium} onNeedUpgrade={()=>setShowUpgrade(true)}/>}
        {tab==="saved" && <SavedAnalysesScreen onViewAnalysis={handleViewAnalysis} analyses={analyses} onRefresh={refreshAnalyses}/>}
        {tab==="sectors" && <SectorsScreen/>}
        {tab==="learning" && <LearningScreen isPremium={isPremium} onNeedUpgrade={()=>setShowUpgrade(true)}/>}
        {tab==="settings" && <SettingsScreen user={user} profile={profile} isPremium={isPremium} dark={dark} onToggleDark={toggleDark} onNeedUpgrade={()=>setShowUpgrade(true)} onLogout={handleLogout} onNameUpdated={handleNameUpdated} onSubscriptionChange={handleActivated}/>}
      </div>

      {screen.isDesktop
        ? <SideNav active={tab} onChange={setTab} user={user} dark={dark} onToggleDark={toggleDark} isPremium={isPremium}/>
        : <HamburgerNav active={tab} onChange={setTab} user={user} isPremium={isPremium} dark={dark} onToggleDark={toggleDark}/>}

      <UpgradeSheet open={showUpgrade} onClose={()=>setShowUpgrade(false)} user={user} onActivated={handleActivated}/>
    </div>
  );
}
