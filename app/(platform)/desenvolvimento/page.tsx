
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type PlanStatus   = "ACTIVE" | "COMPLETED" | "CANCELLED";
type ActionStatus = "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
type ActionType   = "COURSE" | "MENTORING" | "PROJECT" | "READING" | "LECTURE" | "FEEDBACK" | "OTHER";
type Priority     = "HIGH" | "MEDIUM" | "LOW";

interface SmartGoal {
  specific:    string;
  measurable:  string;
  achievable:  string;
  relevant:    string;
  timeBound:   string;
}

interface ActionItem {
  id:           string;
  title:        string;
  type:         ActionType;
  status:       ActionStatus;
  priority:     Priority;
  startDate:    string;
  endDate:      string;
  hours:        number;
  competencies: string[];
  courseId?:    number;
  mentorName?:  string;
  evidenceUrl?: string;
  comments:     CheckinEntry[];
  createdBy:    "SELF" | "MANAGER";
  approvedBy?:  string;
  progress:     number; // 0-100
}

interface CheckinEntry {
  id:        string;
  author:    string;
  role:      "SELF" | "MANAGER";
  text:      string;
  date:      string;
  progress?: number;
}

interface Milestone {
  id:    string;
  title: string;
  date:  string;
  done:  boolean;
  notes: string;
}

interface PlanData {
  // SMART
  smart:         SmartGoal;
  // Actions (Kanban)
  actions:       ActionItem[];
  // Cycle
  cycleName:     string;
  startDate:     string;
  endDate:       string;
  // People
  managerId?:    number;
  managerName?:  string;
  mentorName?:   string;
  // Settings
  isPublic:      boolean;
  checkinDays:   number; // 15 or 30
  // Milestones
  milestones:    Milestone[];
  // Validation
  managerValidated: boolean;
  selfAccepted:     boolean;
  // Checkins log
  checkins:      CheckinEntry[];
}

interface DevelopmentPlan {
  id:        number;
  userId:    number;
  goal:      string; // JSON serialized PlanData
  status:    PlanStatus;
  createdAt: string;
  user?:     { id: number; fullName: string; email: string };
  certificates?: { id: number; validationCode: string; fileUrl: string }[];
}

interface MyStats {
  total:          number;
  active:         number;
  completed:      number;
  completionRate: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_STATUS_CFG: Record<PlanStatus, { label: string; color: string; bg: string; icon: string }> = {
  ACTIVE:    { label: "Em Andamento",       color: "#0891b2", bg: "#ecfeff", icon: "🔵" },
  COMPLETED: { label: "Concluído",          color: "#16a34a", bg: "#f0fdf4", icon: "✅" },
  CANCELLED: { label: "Cancelado",          color: "#dc2626", bg: "#fef2f2", icon: "❌" },
};

const ACTION_STATUS_CFG: Record<ActionStatus, { label: string; color: string; bg: string; icon: string }> = {
  TODO:        { label: "A Fazer",    color: "#64748b", bg: "#f1f5f9", icon: "📋" },
  IN_PROGRESS: { label: "Em Curso",   color: "#d97706", bg: "#fffbeb", icon: "🏃" },
  DONE:        { label: "Concluído",  color: "#16a34a", bg: "#f0fdf4", icon: "✅" },
  CANCELLED:   { label: "Cancelado",  color: "#dc2626", bg: "#fef2f2", icon: "❌" },
};

const ACTION_TYPE_CFG: Record<ActionType, { label: string; icon: string; color: string }> = {
  COURSE:    { label: "Curso",         icon: "🎓", color: "#7c3aed" },
  MENTORING: { label: "Mentoria",      icon: "🤝", color: "#0891b2" },
  PROJECT:   { label: "Projecto",      icon: "🚀", color: "#0369a1" },
  READING:   { label: "Leitura",       icon: "📚", color: "#16a34a" },
  LECTURE:   { label: "Palestra",      icon: "🎤", color: "#d97706" },
  FEEDBACK:  { label: "Feedback 360°", icon: "💬", color: "#db2777" },
  OTHER:     { label: "Outro",         icon: "⚡", color: "#64748b" },
};

const PRIORITY_CFG: Record<Priority, { label: string; color: string; bg: string }> = {
  HIGH:   { label: "Alta",  color: "#dc2626", bg: "#fef2f2" },
  MEDIUM: { label: "Média", color: "#d97706", bg: "#fffbeb" },
  LOW:    { label: "Baixa", color: "#16a34a", bg: "#f0fdf4" },
};

const TEMPLATES: { name: string; icon: string; goal: SmartGoal; actions: Partial<ActionItem>[] }[] = [
  {
    name: "Novo Gestor",
    icon: "👑",
    goal: {
      specific:   "Desenvolver competências de liderança situacional para gerir uma equipa de 5 a 10 pessoas.",
      measurable: "Reduzir a rotatividade da equipa em 20% e aumentar o NPS interno para 8/10.",
      achievable: "Com formação, mentoria e prática diária de feedback estruturado.",
      relevant:   "Alinhado com a estratégia de crescimento e promoção interna da Innova.",
      timeBound:  "Concluir até 31/12/2025.",
    },
    actions: [
      { title: "Curso de Liderança Situacional", type: "COURSE",    priority: "HIGH",   hours: 20 },
      { title: "Mentoria com Director de Área",   type: "MENTORING", priority: "HIGH",   hours: 8  },
      { title: "Liderar projecto piloto",          type: "PROJECT",   priority: "MEDIUM", hours: 40 },
      { title: "Leitura: O Gestor Minuto",         type: "READING",   priority: "LOW",    hours: 5  },
    ],
  },
  {
    name: "Analista → Sénior",
    icon: "📈",
    goal: {
      specific:   "Elevar nível técnico em análise de dados de nível 2 para nível 4.",
      measurable: "Entregar 3 dashboards de impacto e obter certificação reconhecida.",
      achievable: "Disponibilidade de 5h/semana para estudo e prática.",
      relevant:   "Requisito para progressão de carreira no roadmap definido pela gestão.",
      timeBound:  "6 meses a partir do início do plano.",
    },
    actions: [
      { title: "Certificação Power BI / Tableau", type: "COURSE",   priority: "HIGH",   hours: 30 },
      { title: "Dashboard de KPIs do departamento", type: "PROJECT", priority: "HIGH",   hours: 20 },
      { title: "Feedback 360° de pares técnicos",  type: "FEEDBACK", priority: "MEDIUM", hours: 2  },
    ],
  },
];

const EMPTY_PLAN_DATA = (): PlanData => ({
  smart:            { specific:"", measurable:"", achievable:"", relevant:"", timeBound:"" },
  actions:          [],
  cycleName:        "",
  startDate:        new Date().toISOString().slice(0, 10),
  endDate:          new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
  managerId:        undefined,
  managerName:      "",
  mentorName:       "",
  isPublic:         false,
  checkinDays:      30,
  milestones:       [],
  managerValidated: false,
  selfAccepted:     false,
  checkins:         [],
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePlan(raw: string): PlanData {
  try {
    const p = JSON.parse(raw);
    return { ...EMPTY_PLAN_DATA(), ...p };
  } catch { return EMPTY_PLAN_DATA(); }
}

function serializePlan(d: PlanData): string { return JSON.stringify(d); }

function uid(): string { return Math.random().toString(36).slice(2, 10); }

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });

function getDaysLeft(end: string): number {
  return Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / 86_400_000));
}

function getPlanProgress(data: PlanData): number {
  const a = data.actions;
  if (!a.length) return 0;
  const done = a.filter(x => x.status === "DONE").length;
  return Math.round((done / a.length) * 100);
}

function getPlanHealth(data: PlanData): "green" | "amber" | "red" {
  if (!data.endDate) return "green";
  const daysLeft = getDaysLeft(data.endDate);
  const totalDays = Math.max(1, (new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / 86_400_000);
  const timeUsed  = ((totalDays - daysLeft) / totalDays) * 100;
  const progress  = getPlanProgress(data);
  const gap       = timeUsed - progress;
  if (gap > 20) return "red";
  if (gap > 10) return "amber";
  return "green";
}

const HEALTH_CFG = {
  green: { label: "Saudável",      color: "#16a34a", bg: "#f0fdf4" },
  amber: { label: "Atenção",       color: "#d97706", bg: "#fffbeb" },
  red:   { label: "Em Risco",      color: "#dc2626", bg: "#fef2f2" },
};

// ─── Primitives ───────────────────────────────────────────────────────────────

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const p = ["#7c3aed","#0891b2","#16a34a","#d97706","#dc2626","#db2777"];
  const c = p[name.charCodeAt(0) % p.length];
  return (
    <div style={{ width:size,height:size,borderRadius:"50%",flexShrink:0,background:c+"18",border:`2px solid ${c}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.34,fontWeight:700,color:c }}>
      {name.split(" ").slice(0,2).map(n=>n[0]).join("").toUpperCase()}
    </div>
  );
}

function ProgressRing({ pct, size=60, color="#7c3aed" }: { pct:number; size?:number; color?:string }) {
  const r=size/2-5; const circ=2*Math.PI*r; const dash=(pct/100)*circ;
  return (
    <div style={{ position:"relative",width:size,height:size,flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={5}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{transition:"stroke-dasharray 0.8s ease"}}/>
      </svg>
      <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
        <span style={{ fontSize:size*0.22,fontWeight:800,color,lineHeight:1 }}>{pct}%</span>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:12,padding:"52px 0" }}>
      <div style={{ width:28,height:28,border:"3px solid #e2e8f0",borderTopColor:"#7c3aed",borderRadius:"50%",animation:"dp-spin 0.7s linear infinite" }}/>
      <p style={{ margin:0,fontSize:13,color:"#94a3b8" }}>A carregar planos...</p>
    </div>
  );
}

function Toast({ msg, type, onClose }: { msg:string;type:"success"|"error"|"info";onClose:()=>void }) {
  useEffect(()=>{ const t=setTimeout(onClose,3800); return ()=>clearTimeout(t); },[]);
  const c={success:{bg:"#f0fdf4",bd:"#bbf7d0",cl:"#16a34a"},error:{bg:"#fef2f2",bd:"#fecaca",cl:"#dc2626"},info:{bg:"#eff6ff",bd:"#bfdbfe",cl:"#2563eb"}}[type];
  return (
    <div style={{ position:"fixed",bottom:24,right:24,zIndex:9999,background:c.bg,border:`1px solid ${c.bd}`,borderRadius:12,padding:"12px 18px",maxWidth:340,boxShadow:"0 8px 24px rgba(0,0,0,0.1)",display:"flex",alignItems:"center",gap:10,animation:"dp-in 0.2s ease",fontSize:13,color:c.cl,fontWeight:500 }}>
      {msg}
      <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:c.cl,marginLeft:"auto",fontSize:16 }}>×</button>
    </div>
  );
}

function useToast() {
  const [t,setT]=useState<{msg:string;type:"success"|"error"|"info";k:number}|null>(null);
  const show=useCallback((msg:string,type:"success"|"error"|"info"="info")=>setT({msg,type,k:Date.now()}),[]);
  return { showToast:show, toastNode: t ? <Toast key={t.k} msg={t.msg} type={t.type} onClose={()=>setT(null)}/> : null };
}

const CARD: React.CSSProperties = { background:"#fff", borderRadius:14, border:"1px solid #e2e8f0" };
const INP:  React.CSSProperties = { width:"100%",padding:"9px 12px",borderRadius:10,border:"1px solid #e2e8f0",fontSize:13.5,color:"#1e293b",background:"#f8fafc",fontFamily:"inherit",outline:"none",boxSizing:"border-box" };
const LBL:  React.CSSProperties = { display:"block",fontSize:10,fontWeight:700,letterSpacing:0.8,textTransform:"uppercase",color:"#64748b",marginBottom:5 };
const AREA: React.CSSProperties = { ...INP, resize:"vertical" as const, lineHeight:1.6, fontFamily:"inherit" } as React.CSSProperties;

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div style={{ textAlign:"center",padding:"60px 24px",maxWidth:500,margin:"0 auto" }}>
      <div style={{ fontSize:64,marginBottom:16 }}>🌱</div>
      <h2 style={{ fontSize:22,fontWeight:800,color:"#1e293b",margin:"0 0 10px" }}>Vamos planear o seu próximo passo?</h2>
      <p style={{ fontSize:14.5,color:"#64748b",lineHeight:1.7,margin:"0 0 28px" }}>
        Um Plano de Desenvolvimento Individual (PDI) bem estruturado pode acelerar a sua carreira. Defina metas claras, acções concretas e acompanhe o seu crescimento semana a semana.
      </p>
      <div style={{ display:"flex",flexDirection:"column",gap:12,marginBottom:28,textAlign:"left" }}>
        {["🎯 Metas SMART validadas pelo gestor","📋 Acções ligadas a cursos da plataforma","📊 Acompanhamento visual do progresso","🏆 Certificado ao concluir o plano"].map(t=>(
          <div key={t} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#f8fafc",borderRadius:10,fontSize:13,color:"#1e293b",fontWeight:500 }}>
            {t}
          </div>
        ))}
      </div>
      <button onClick={onCreate} style={{ padding:"14px 32px",background:"linear-gradient(135deg,#7c3aed,#a78bfa)",color:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:800,cursor:"pointer",boxShadow:"0 8px 20px rgba(124,58,237,0.35)" }}>
        ✨ Criar o Meu PDI
      </button>
    </div>
  );
}

// ─── SMART Form ───────────────────────────────────────────────────────────────

function SmartForm({ value, onChange }: { value: SmartGoal; onChange: (v: SmartGoal) => void }) {
  const fields: { key: keyof SmartGoal; letter: string; label: string; hint: string; color: string }[] = [
    { key:"specific",   letter:"S", label:"Específico",   hint:'O quê, exactamente? "Melhorar liderança" → "Conduzir 1:1s semanais com toda a equipa."', color:"#7c3aed" },
    { key:"measurable", letter:"M", label:"Mensurável",   hint:'Como vou medir? Ex: "Reduzir erros em 30%" ou "Obter certificação X."',                   color:"#0891b2" },
    { key:"achievable", letter:"A", label:"Atingível",    hint:'Recursos e capacidade disponíveis para atingir este objetivo.',                            color:"#16a34a" },
    { key:"relevant",   letter:"R", label:"Relevante",    hint:'Porquê este objectivo importa agora? Alinhamento com estratégia e carreira.',              color:"#d97706" },
    { key:"timeBound",  letter:"T", label:"Temporal",     hint:'Prazo concreto: "Até 30/06/2025" ou "em 3 meses".',                                       color:"#dc2626" },
  ];
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
      {fields.map(f=>(
        <div key={f.key}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
            <div style={{ width:24,height:24,borderRadius:8,background:f.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff",flexShrink:0 }}>{f.letter}</div>
            <span style={{ fontSize:12,fontWeight:700,color:"#1e293b" }}>{f.label}</span>
            <span style={{ fontSize:11,color:"#94a3b8",flex:1 }}>— {f.hint}</span>
          </div>
          <textarea value={value[f.key]} onChange={e=>onChange({...value,[f.key]:e.target.value})} style={{ ...AREA,height:56 }} placeholder={`Descreve o aspecto "${f.label.toLowerCase()}"...`}/>
        </div>
      ))}
    </div>
  );
}

// ─── Action Card (Kanban) ─────────────────────────────────────────────────────

function ActionCard({ action, onStatusChange, onOpen }: {
  action: ActionItem;
  onStatusChange: (id:string, status:ActionStatus) => void;
  onOpen: () => void;
}) {
  const typeCfg = ACTION_TYPE_CFG[action.type];
  const priCfg  = PRIORITY_CFG[action.priority];
  const daysLeft = action.endDate ? getDaysLeft(action.endDate) : null;

  return (
    <div onClick={onOpen} style={{ background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:"12px 14px",cursor:"pointer",display:"flex",flexDirection:"column",gap:8,borderLeft:`3px solid ${typeCfg.color}`,transition:"all 0.15s" }}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.08)"; e.currentTarget.style.borderColor=typeCfg.color;}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor="#e2e8f0";}}>

      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8 }}>
        <div style={{ display:"flex",gap:6,alignItems:"center",flex:1,minWidth:0 }}>
          <span style={{ fontSize:16 }}>{typeCfg.icon}</span>
          <p style={{ margin:0,fontSize:13,fontWeight:700,color:"#1e293b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{action.title}</p>
        </div>
        <span style={{ padding:"1px 7px",borderRadius:20,fontSize:10,fontWeight:700,background:priCfg.bg,color:priCfg.color,flexShrink:0 }}>{priCfg.label}</span>
      </div>

      {/* Progress bar */}
      {action.status === "IN_PROGRESS" && (
        <div>
          <div style={{ height:4,background:"#e2e8f0",borderRadius:2,overflow:"hidden" }}>
            <div style={{ height:"100%",width:`${action.progress}%`,background:typeCfg.color,borderRadius:2,transition:"width 0.5s" }}/>
          </div>
          <p style={{ margin:"3px 0 0",fontSize:10,color:"#64748b" }}>{action.progress}% concluído</p>
        </div>
      )}

      {/* Meta */}
      <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
        <span style={{ padding:"1px 7px",borderRadius:20,fontSize:10,background:typeCfg.color+"15",color:typeCfg.color,fontWeight:600 }}>{typeCfg.label}</span>
        {action.hours > 0 && <span style={{ fontSize:10,color:"#94a3b8" }}>⏱️ {action.hours}h</span>}
        {daysLeft !== null && action.status !== "DONE" && daysLeft <= 7 && (
          <span style={{ fontSize:10,fontWeight:700,color:daysLeft === 0 ? "#dc2626" : "#d97706" }}>⚠️ {daysLeft === 0 ? "Hoje!" : `${daysLeft}d`}</span>
        )}
        {action.comments.length > 0 && <span style={{ fontSize:10,color:"#94a3b8" }}>💬 {action.comments.length}</span>}
        {action.mentorName && <span style={{ fontSize:10,color:"#0891b2" }}>🤝 {action.mentorName}</span>}
      </div>
    </div>
  );
}

// ─── Kanban Board ─────────────────────────────────────────────────────────────

function KanbanBoard({ plan, data, onUpdate, showToast }: {
  plan: DevelopmentPlan;
  data: PlanData;
  onUpdate: (newData: PlanData) => Promise<void>;
  showToast: (m:string,t:"success"|"error"|"info") => void;
}) {
  const [openAction, setOpenAction] = useState<ActionItem | null>(null);
  const [dragging, setDragging]     = useState<string | null>(null);

  const COLS: { status: ActionStatus; label: string; color: string; bg: string }[] = [
    { status:"TODO",        label:"📋 A Fazer",       color:"#64748b", bg:"#f8fafc" },
    { status:"IN_PROGRESS", label:"🏃 Em Curso",       color:"#d97706", bg:"#fffbeb" },
    { status:"DONE",        label:"✅ Concluído",       color:"#16a34a", bg:"#f0fdf4" },
    { status:"CANCELLED",   label:"❌ Cancelado",       color:"#dc2626", bg:"#fef2f2" },
  ];

  function moveAction(id: string, status: ActionStatus) {
    const newActions = data.actions.map(a => a.id === id ? { ...a, status, progress: status === "DONE" ? 100 : a.progress } : a);
    onUpdate({ ...data, actions: newActions });
  }

  async function onDrop(status: ActionStatus) {
    if (!dragging) return;
    moveAction(dragging, status);
    setDragging(null);
  }

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, overflowX:"auto" }}>
        {COLS.map(col => {
          const colActions = data.actions.filter(a => a.status === col.status);
          return (
            <div key={col.status}
              onDragOver={e=>e.preventDefault()}
              onDrop={()=>onDrop(col.status)}
              style={{ background:col.bg, borderRadius:12, padding:12, minHeight:200, border:`1px solid ${col.color}22` }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10 }}>
                <span style={{ fontSize:12.5,fontWeight:700,color:col.color }}>{col.label}</span>
                <span style={{ width:22,height:22,borderRadius:"50%",background:col.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:col.color }}>{colActions.length}</span>
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {colActions.map(action=>(
                  <div key={action.id} draggable onDragStart={()=>setDragging(action.id)} style={{ opacity: dragging===action.id ? 0.5 : 1 }}>
                    <ActionCard action={action} onStatusChange={moveAction} onOpen={()=>setOpenAction(action)}/>
                  </div>
                ))}
                {colActions.length === 0 && (
                  <div style={{ padding:"16px 0",textAlign:"center",color:"#94a3b8",fontSize:12 }}>Sem acções</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Detail Modal */}
      {openAction && (
        <ActionDetailModal
          action={openAction}
          onClose={()=>setOpenAction(null)}
          onSave={updatedAction => {
            const newActions = data.actions.map(a => a.id === updatedAction.id ? updatedAction : a);
            onUpdate({...data,actions:newActions});
            setOpenAction(null);
            showToast("Acção actualizada!","success");
          }}
          onDelete={id => {
            onUpdate({...data,actions:data.actions.filter(a=>a.id!==id)});
            setOpenAction(null);
          }}
        />
      )}
    </div>
  );
}

// ─── Action Detail Modal ──────────────────────────────────────────────────────

function ActionDetailModal({ action, onClose, onSave, onDelete }: {
  action: ActionItem;
  onClose: () => void;
  onSave: (a: ActionItem) => void;
  onDelete: (id: string) => void;
}) {
  const [form, setForm]     = useState<ActionItem>({ ...action });
  const [newComment, setNewComment] = useState("");

  const set = (k: keyof ActionItem, v: any) => setForm(f => ({ ...f, [k]: v }));

  function addComment() {
    if (!newComment.trim()) return;
    const entry: CheckinEntry = {
      id:     uid(),
      author: "Eu",
      role:   "SELF",
      text:   newComment.trim(),
      date:   new Date().toISOString(),
    };
    set("comments", [...form.comments, entry]);
    setNewComment("");
  }

  const typeCfg = ACTION_TYPE_CFG[form.type];
  const priCfg  = PRIORITY_CFG[form.priority];

  return (
    <div style={{ position:"fixed",inset:0,zIndex:600,background:"rgba(15,23,42,0.5)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:16,overflowY:"auto" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:"#fff",borderRadius:20,width:"100%",maxWidth:600,boxShadow:"0 24px 60px rgba(0,0,0,0.2)",animation:"dp-up 0.2s ease",marginTop:24 }}>

        {/* Header */}
        <div style={{ padding:"18px 24px 16px",borderBottom:"1px solid #f1f5f9",display:"flex",gap:12,alignItems:"flex-start" }}>
          <div style={{ width:40,height:40,borderRadius:11,background:typeCfg.color+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>{typeCfg.icon}</div>
          <div style={{ flex:1 }}>
            <input value={form.title} onChange={e=>set("title",e.target.value)} style={{ ...INP,fontSize:15,fontWeight:700,border:"none",background:"transparent",padding:"0",outline:"none" }} />
            <div style={{ display:"flex",gap:6,marginTop:4,flexWrap:"wrap" }}>
              <span style={{ padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,background:typeCfg.color+"15",color:typeCfg.color }}>{typeCfg.label}</span>
              <span style={{ padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,background:priCfg.bg,color:priCfg.color }}>{priCfg.label}</span>
              <span style={{ padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,background:ACTION_STATUS_CFG[form.status].bg,color:ACTION_STATUS_CFG[form.status].color }}>
                {ACTION_STATUS_CFG[form.status].icon} {ACTION_STATUS_CFG[form.status].label}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#94a3b8" }}>×</button>
        </div>

        <div style={{ padding:"18px 24px",display:"flex",flexDirection:"column",gap:14,maxHeight:"70vh",overflowY:"auto" }}>
          {/* Type + Priority + Status */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10 }}>
            <div>
              <span style={LBL}>Tipo</span>
              <select value={form.type} onChange={e=>set("type",e.target.value)} style={INP}>
                {Object.entries(ACTION_TYPE_CFG).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </div>
            <div>
              <span style={LBL}>Prioridade</span>
              <select value={form.priority} onChange={e=>set("priority",e.target.value)} style={INP}>
                {Object.entries(PRIORITY_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <span style={LBL}>Estado</span>
              <select value={form.status} onChange={e=>set("status",e.target.value)} style={INP}>
                {Object.entries(ACTION_STATUS_CFG).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </div>
          </div>

          {/* Dates + Hours */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10 }}>
            <div><span style={LBL}>Início</span><input type="date" value={form.startDate} onChange={e=>set("startDate",e.target.value)} style={INP}/></div>
            <div><span style={LBL}>Fim</span><input type="date" value={form.endDate} onChange={e=>set("endDate",e.target.value)} style={INP}/></div>
            <div><span style={LBL}>Horas</span><input type="number" value={form.hours} onChange={e=>set("hours",+e.target.value)} style={INP} min={0}/></div>
          </div>

          {/* Progress */}
          {form.status === "IN_PROGRESS" && (
            <div>
              <span style={LBL}>Progresso — {form.progress}%</span>
              <input type="range" min={0} max={100} value={form.progress} onChange={e=>set("progress",+e.target.value)} style={{ width:"100%",accentColor:"#7c3aed" }}/>
            </div>
          )}

          {/* Mentor */}
          <div>
            <span style={LBL}>Mentor (opcional)</span>
            <input value={form.mentorName ?? ""} onChange={e=>set("mentorName",e.target.value)} style={INP} placeholder="Nome do mentor interno..."/>
          </div>

          {/* Competencies */}
          <div>
            <span style={LBL}>Competências</span>
            <input value={form.competencies.join(", ")} onChange={e=>set("competencies",e.target.value.split(",").map(s=>s.trim()).filter(Boolean))} style={INP} placeholder="Liderança, Comunicação, Excel..."/>
          </div>

          {/* Evidence */}
          <div>
            <span style={LBL}>Link de Evidência</span>
            <input value={form.evidenceUrl ?? ""} onChange={e=>set("evidenceUrl",e.target.value)} style={INP} placeholder="https://certificado.com/..."/>
          </div>

          {/* Comments timeline */}
          <div>
            <span style={LBL}>Comentários ({form.comments.length})</span>
            <div style={{ display:"flex",flexDirection:"column",gap:8,maxHeight:180,overflowY:"auto",marginBottom:8 }}>
              {form.comments.map(c=>(
                <div key={c.id} style={{ display:"flex",gap:8,alignItems:"flex-start" }}>
                  <Avatar name={c.author} size={28}/>
                  <div style={{ flex:1,background:"#f8fafc",borderRadius:10,padding:"8px 12px" }}>
                    <div style={{ display:"flex",gap:6,marginBottom:3 }}>
                      <span style={{ fontSize:12,fontWeight:700,color:"#1e293b" }}>{c.author}</span>
                      <span style={{ fontSize:10,color:"#94a3b8" }}>{fmtDate(c.date)}</span>
                    </div>
                    <p style={{ margin:0,fontSize:13,color:"#475569",lineHeight:1.55 }}>{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display:"flex",gap:8 }}>
              <input value={newComment} onChange={e=>setNewComment(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addComment()} style={{ ...INP,flex:1 }} placeholder="Adicionar comentário..."/>
              <button onClick={addComment} style={{ padding:"9px 16px",borderRadius:10,background:"#7c3aed",border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer" }}>Enviar</button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:"14px 24px",borderTop:"1px solid #f1f5f9",display:"flex",gap:10,justifyContent:"space-between" }}>
          <button onClick={()=>onDelete(form.id)} style={{ padding:"9px 16px",borderRadius:10,border:"1px solid #fecaca",background:"#fef2f2",cursor:"pointer",fontSize:13,color:"#dc2626",fontWeight:600 }}>🗑️ Remover</button>
          <div style={{ display:"flex",gap:10 }}>
            <button onClick={onClose} style={{ padding:"9px 20px",borderRadius:10,border:"1px solid #e2e8f0",background:"transparent",cursor:"pointer",fontSize:13,color:"#64748b" }}>Cancelar</button>
            <button onClick={()=>onSave(form)} style={{ padding:"9px 22px",borderRadius:10,background:"#7c3aed",border:"none",cursor:"pointer",fontSize:13,fontWeight:700,color:"#fff" }}>Guardar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Plan Health Indicator ────────────────────────────────────────────────────

function HealthIndicator({ data }: { data: PlanData }) {
  const health   = getPlanHealth(data);
  const progress = getPlanProgress(data);
  const daysLeft = getDaysLeft(data.endDate);
  const totalDays= Math.max(1,(new Date(data.endDate).getTime()-new Date(data.startDate).getTime())/86_400_000);
  const timeUsed = Math.min(100,Math.round(((totalDays-daysLeft)/totalDays)*100));
  const cfg      = HEALTH_CFG[health];

  return (
    <div style={{ ...CARD,padding:"16px 20px",borderLeft:`4px solid ${cfg.color}` }}>
      <div style={{ display:"flex",alignItems:"center",gap:14,flexWrap:"wrap" }}>
        <ProgressRing pct={progress} size={64} color={cfg.color}/>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}>
            <p style={{ margin:0,fontSize:14,fontWeight:700,color:"#1e293b" }}>Saúde do PDI</p>
            <span style={{ padding:"2px 9px",borderRadius:20,fontSize:11,fontWeight:700,background:cfg.bg,color:cfg.color }}>{cfg.label}</span>
          </div>
          <p style={{ margin:0,fontSize:12.5,color:"#64748b" }}>
            {progress}% das acções concluídas · {daysLeft} dias restantes · {timeUsed}% do período decorrido
          </p>
          {/* Time vs Progress bar comparison */}
          <div style={{ marginTop:8,display:"flex",flexDirection:"column",gap:4 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
              <span style={{ fontSize:10,color:"#94a3b8",width:60 }}>Tempo</span>
              <div style={{ flex:1,height:6,background:"#e2e8f0",borderRadius:3,overflow:"hidden" }}>
                <div style={{ height:"100%",width:`${timeUsed}%`,background:"#94a3b8",borderRadius:3 }}/>
              </div>
              <span style={{ fontSize:10,color:"#94a3b8",width:30 }}>{timeUsed}%</span>
            </div>
            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
              <span style={{ fontSize:10,color:cfg.color,width:60,fontWeight:700 }}>Progresso</span>
              <div style={{ flex:1,height:6,background:"#e2e8f0",borderRadius:3,overflow:"hidden" }}>
                <div style={{ height:"100%",width:`${progress}%`,background:cfg.color,borderRadius:3,transition:"width 0.8s" }}/>
              </div>
              <span style={{ fontSize:10,color:cfg.color,width:30,fontWeight:700 }}>{progress}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Gantt-style Timeline ─────────────────────────────────────────────────────

function GanttView({ data }: { data: PlanData }) {
  const start = new Date(data.startDate);
  const end   = new Date(data.endDate);
  const totalMs = end.getTime() - start.getTime() || 1;

  function pct(dateStr: string) {
    const d = new Date(dateStr);
    return Math.min(100, Math.max(0, Math.round(((d.getTime() - start.getTime()) / totalMs) * 100)));
  }
  function width(s: string, e: string) {
    return Math.max(4, Math.round(((new Date(e).getTime() - new Date(s).getTime()) / totalMs) * 100));
  }

  return (
    <div style={{ ...CARD, padding:"16px 20px", overflowX:"auto" }}>
      <p style={{ margin:"0 0 14px", fontSize:13, fontWeight:700, color:"#1e293b" }}>📅 Linha do Tempo ({fmtDate(data.startDate)} → {fmtDate(data.endDate)})</p>

      {/* Header timeline */}
      <div style={{ position:"relative",height:20,marginBottom:16,borderRadius:4,overflow:"hidden" }}>
        <div style={{ position:"absolute",inset:0,background:"#f1f5f9",borderRadius:4 }}/>
        {/* Today marker */}
        {(() => {
          const todayPct = pct(new Date().toISOString());
          return todayPct > 0 && todayPct < 100 ? (
            <div style={{ position:"absolute",left:`${todayPct}%`,top:0,bottom:0,width:2,background:"#dc2626",zIndex:2 }}>
              <span style={{ position:"absolute",top:-18,left:-12,fontSize:9,fontWeight:700,color:"#dc2626",whiteSpace:"nowrap" }}>Hoje</span>
            </div>
          ) : null;
        })()}
      </div>

      {/* Actions */}
      <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
        {data.actions.map(a=>{
          const typeCfg = ACTION_TYPE_CFG[a.type];
          const x = pct(a.startDate || data.startDate);
          const w = a.endDate ? width(a.startDate || data.startDate, a.endDate) : 20;
          return (
            <div key={a.id} style={{ display:"flex",alignItems:"center",gap:10 }}>
              <span style={{ fontSize:12,color:"#64748b",width:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flexShrink:0 }}>{typeCfg.icon} {a.title}</span>
              <div style={{ flex:1,position:"relative",height:22,background:"#f8fafc",borderRadius:4 }}>
                <div style={{ position:"absolute",left:`${x}%`,width:`${w}%`,height:"100%",background:a.status==="DONE"?"#16a34a":typeCfg.color,borderRadius:4,opacity:a.status==="CANCELLED"?0.3:0.75,minWidth:8 }}/>
              </div>
              <span style={{ fontSize:10,color:ACTION_STATUS_CFG[a.status].color,fontWeight:700,width:70,flexShrink:0 }}>{ACTION_STATUS_CFG[a.status].icon} {ACTION_STATUS_CFG[a.status].label}</span>
            </div>
          );
        })}
        {data.actions.length === 0 && <p style={{ color:"#94a3b8",fontSize:13,textAlign:"center",padding:16 }}>Sem acções definidas.</p>}
      </div>
    </div>
  );
}

// ─── Check-in Modal ───────────────────────────────────────────────────────────

function CheckinModal({ plan, data, onClose, onSave }: {
  plan: DevelopmentPlan;
  data: PlanData;
  onClose: () => void;
  onSave: (newData: PlanData) => void;
}) {
  const [done,setDone]       = useState("");
  const [blocker,setBlocker] = useState("");
  const [progress,setProgress] = useState(getPlanProgress(data));

  function submit() {
    if (!done.trim()) return;
    const entry: CheckinEntry = {
      id:       uid(),
      author:   "Eu",
      role:     "SELF",
      text:     `✅ Feito: ${done}${blocker ? `\n⚠️ Impedimento: ${blocker}` : ""}`,
      date:     new Date().toISOString(),
      progress,
    };
    onSave({ ...data, checkins: [...data.checkins, entry] });
    onClose();
  }

  return (
    <div style={{ position:"fixed",inset:0,zIndex:700,background:"rgba(15,23,42,0.5)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:"#fff",borderRadius:20,padding:28,width:"100%",maxWidth:440,boxShadow:"0 24px 60px rgba(0,0,0,0.2)",animation:"dp-up 0.2s ease" }}>
        <h2 style={{ margin:"0 0 6px",fontSize:17,fontWeight:800,color:"#1e293b" }}>⚡ Check-in Semanal</h2>
        <p style={{ margin:"0 0 20px",fontSize:13,color:"#64748b" }}>Regista o teu progresso desta semana.</p>

        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div>
            <span style={LBL}>O que fizeste esta semana? *</span>
            <textarea value={done} onChange={e=>setDone(e.target.value)} style={{ ...AREA,height:72 }} placeholder="Ex: Completei o módulo 3 do curso de liderança..."/>
          </div>
          <div>
            <span style={LBL}>Houve algum impedimento?</span>
            <textarea value={blocker} onChange={e=>setBlocker(e.target.value)} style={{ ...AREA,height:56 }} placeholder="Ex: Sem tempo esta semana por reuniões..."/>
          </div>
          <div>
            <span style={LBL}>Progresso geral do plano — {progress}%</span>
            <input type="range" min={0} max={100} value={progress} onChange={e=>setProgress(+e.target.value)} style={{ width:"100%",accentColor:"#7c3aed" }}/>
          </div>
        </div>

        <div style={{ display:"flex",gap:10,justifyContent:"flex-end",marginTop:20 }}>
          <button onClick={onClose} style={{ padding:"9px 20px",borderRadius:10,border:"1px solid #e2e8f0",background:"transparent",cursor:"pointer",fontSize:13,color:"#64748b" }}>Cancelar</button>
          <button onClick={submit} disabled={!done.trim()} style={{ padding:"9px 22px",borderRadius:10,background:"#7c3aed",border:"none",cursor:"pointer",fontSize:13,fontWeight:700,color:"#fff",opacity:!done.trim()?0.5:1 }}>
            ✅ Submeter Check-in
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create / Edit Plan Modal ─────────────────────────────────────────────────

function PlanModal({ initial, onClose, onSaved }: {
  initial?: DevelopmentPlan;
  onClose: () => void;
  onSaved: (plan: DevelopmentPlan) => void;
}) {
  const initData = initial ? parsePlan(initial.goal) : EMPTY_PLAN_DATA();
  const [step, setStep]     = useState<"meta"|"smart"|"actions"|"settings">("meta");
  const [data, setData]     = useState<PlanData>(initData);
  const [userId, setUserId] = useState(initial?.userId?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");
  const [template, setTemplate] = useState<number | null>(null);

  function applyTemplate(idx: number) {
    const t = TEMPLATES[idx];
    setData(d => ({
      ...d,
      smart: t.goal,
      actions: t.actions.map((a, i) => ({
        id:           uid(),
        title:        a.title!,
        type:         a.type ?? "COURSE",
        status:       "TODO",
        priority:     a.priority ?? "MEDIUM",
        startDate:    d.startDate,
        endDate:      d.endDate,
        hours:        a.hours ?? 0,
        competencies: [],
        comments:     [],
        createdBy:    "MANAGER",
        progress:     0,
      })),
    }));
    setTemplate(idx);
  }

  function addAction() {
    const newAction: ActionItem = {
      id:           uid(),
      title:        "Nova acção",
      type:         "COURSE",
      status:       "TODO",
      priority:     "MEDIUM",
      startDate:    data.startDate,
      endDate:      data.endDate,
      hours:        0,
      competencies: [],
      comments:     [],
      createdBy:    "SELF",
      progress:     0,
    };
    setData(d => ({ ...d, actions: [...d.actions, newAction] }));
  }

  async function save() {
    if (!userId) { setErr("ID do colaborador obrigatório."); return; }
    if (!data.smart.specific) { setErr("Completa pelo menos o campo Específico da meta SMART."); return; }
    setSaving(true); setErr("");
    try {
      const goal = serializePlan(data);
      const result = initial
        ? await api.put<DevelopmentPlan>(`/development-plans/${initial.id}`, { goal, status: initial.status })
        : await api.post<DevelopmentPlan>("/development-plans", { userId: +userId, goal });
      onSaved(result);
      onClose();
    } catch (e: any) { setErr(e.message ?? "Erro ao guardar"); }
    finally { setSaving(false); }
  }

  const STEPS = [
    { key:"meta",     label:"1. Informações", icon:"📋" },
    { key:"smart",    label:"2. Meta SMART",  icon:"🎯" },
    { key:"actions",  label:"3. Acções",      icon:"⚡" },
    { key:"settings", label:"4. Definições",  icon:"⚙️" },
  ] as const;

  return (
    <div style={{ position:"fixed",inset:0,zIndex:500,background:"rgba(15,23,42,0.5)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:16,overflowY:"auto" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:"#fff",borderRadius:20,width:"100%",maxWidth:660,boxShadow:"0 24px 60px rgba(0,0,0,0.2)",animation:"dp-up 0.2s ease",marginTop:20,marginBottom:20 }}>

        {/* Header */}
        <div style={{ padding:"20px 24px 0" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
            <h2 style={{ margin:0,fontSize:17,fontWeight:700,color:"#1e293b" }}>{initial ? "✏️ Editar PDI" : "✨ Novo Plano de Desenvolvimento"}</h2>
            <button onClick={onClose} style={{ background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#94a3b8" }}>×</button>
          </div>
          {/* Step nav */}
          <div style={{ display:"flex",gap:4,background:"#f1f5f9",borderRadius:10,padding:4 }}>
            {STEPS.map(s=>(
              <button key={s.key} onClick={()=>setStep(s.key)} style={{ flex:1,padding:"7px 0",border:"none",cursor:"pointer",fontSize:11.5,fontWeight:step===s.key?700:400,borderRadius:8,background:step===s.key?"#7c3aed":"transparent",color:step===s.key?"#fff":"#64748b",transition:"all 0.15s" }}>
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding:"20px 24px",maxHeight:"60vh",overflowY:"auto" }}>

          {/* STEP 1: Meta */}
          {step === "meta" && (
            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              {/* Templates */}
              <div>
                <span style={LBL}>Partir de Template</span>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                  {TEMPLATES.map((t,i)=>(
                    <div key={i} onClick={()=>applyTemplate(i)}
                      style={{ padding:"12px",borderRadius:11,border:`2px solid ${template===i?"#7c3aed":"#e2e8f0"}`,cursor:"pointer",background:template===i?"#f5f3ff":"#fff",transition:"all 0.15s" }}>
                      <span style={{ fontSize:20 }}>{t.icon}</span>
                      <p style={{ margin:"4px 0 2px",fontSize:12.5,fontWeight:700,color:template===i?"#7c3aed":"#1e293b" }}>{t.name}</p>
                      <p style={{ margin:0,fontSize:11,color:"#64748b" }}>{t.actions.length} acções pré-definidas</p>
                    </div>
                  ))}
                </div>
              </div>

              {!initial && (
                <div><span style={LBL}>ID do Colaborador *</span><input value={userId} onChange={e=>setUserId(e.target.value)} style={INP} type="number" placeholder="ex: 42"/></div>
              )}

              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                <div><span style={LBL}>Nome do Ciclo</span><input value={data.cycleName} onChange={e=>setData(d=>({...d,cycleName:e.target.value}))} style={INP} placeholder="Ex: PDI 2025/1"/></div>
                <div><span style={LBL}>Mentor</span><input value={data.mentorName??""} onChange={e=>setData(d=>({...d,mentorName:e.target.value}))} style={INP} placeholder="Nome do mentor"/></div>
                <div><span style={LBL}>Início *</span><input type="date" value={data.startDate} onChange={e=>setData(d=>({...d,startDate:e.target.value}))} style={INP}/></div>
                <div><span style={LBL}>Fim *</span><input type="date" value={data.endDate} onChange={e=>setData(d=>({...d,endDate:e.target.value}))} style={INP}/></div>
              </div>
            </div>
          )}

          {/* STEP 2: SMART */}
          {step === "smart" && (
            <div>
              <div style={{ padding:"10px 14px",background:"#f5f3ff",border:"1px solid #e9d5ff",borderRadius:10,marginBottom:14 }}>
                <p style={{ margin:0,fontSize:12.5,color:"#7c3aed",fontWeight:600 }}>
                  💡 A metodologia SMART guia-te a escrever metas claras, mensuráveis e com prazo definido. Preenche cada campo com atenção.
                </p>
              </div>
              <SmartForm value={data.smart} onChange={smart=>setData(d=>({...d,smart}))}/>
            </div>
          )}

          {/* STEP 3: Actions */}
          {step === "actions" && (
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <p style={{ margin:0,fontSize:13,color:"#64748b" }}>{data.actions.length} acções definidas</p>
                <button onClick={addAction} style={{ padding:"6px 14px",borderRadius:9,background:"#7c3aed",border:"none",color:"#fff",fontSize:12.5,fontWeight:700,cursor:"pointer" }}>+ Adicionar Acção</button>
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:8,maxHeight:360,overflowY:"auto" }}>
                {data.actions.map((action,idx)=>(
                  <div key={action.id} style={{ padding:"12px",background:"#f8fafc",borderRadius:11,border:"1px solid #e2e8f0",display:"flex",flexDirection:"column",gap:8 }}>
                    <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                      <select value={action.type} onChange={e=>{
                        const newActions=[...data.actions]; newActions[idx]={...action,type:e.target.value as ActionType};
                        setData(d=>({...d,actions:newActions}));
                      }} style={{ ...INP,width:160,flexShrink:0 }}>
                        {Object.entries(ACTION_TYPE_CFG).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
                      </select>
                      <input value={action.title} onChange={e=>{
                        const newActions=[...data.actions]; newActions[idx]={...action,title:e.target.value};
                        setData(d=>({...d,actions:newActions}));
                      }} style={{ ...INP,flex:1 }} placeholder="Título da acção"/>
                      <button onClick={()=>setData(d=>({...d,actions:d.actions.filter(a=>a.id!==action.id)}))} style={{ background:"none",border:"none",cursor:"pointer",color:"#dc2626",fontSize:18,flexShrink:0 }}>×</button>
                    </div>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
                      <select value={action.priority} onChange={e=>{
                        const newActions=[...data.actions]; newActions[idx]={...action,priority:e.target.value as Priority};
                        setData(d=>({...d,actions:newActions}));
                      }} style={INP}>
                        {Object.entries(PRIORITY_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                      </select>
                      <input type="number" value={action.hours} onChange={e=>{
                        const newActions=[...data.actions]; newActions[idx]={...action,hours:+e.target.value};
                        setData(d=>({...d,actions:newActions}));
                      }} style={INP} placeholder="Horas" min={0}/>
                      <input type="date" value={action.endDate} onChange={e=>{
                        const newActions=[...data.actions]; newActions[idx]={...action,endDate:e.target.value};
                        setData(d=>({...d,actions:newActions}));
                      }} style={INP}/>
                    </div>
                  </div>
                ))}
                {data.actions.length === 0 && (
                  <div style={{ padding:"28px",textAlign:"center",color:"#94a3b8" }}>
                    <p style={{ fontSize:28,margin:"0 0 8px" }}>⚡</p>
                    <p style={{ fontSize:13 }}>Adiciona acções para o teu plano de desenvolvimento.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Settings */}
          {step === "settings" && (
            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              <div>
                <span style={LBL}>Visibilidade</span>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                  {[
                    { val:false, icon:"🔒", label:"Privado", desc:"Apenas colaborador e gestor" },
                    { val:true,  icon:"🌍", label:"Público",  desc:"Equipa pode ver" },
                  ].map(opt=>(
                    <div key={String(opt.val)} onClick={()=>setData(d=>({...d,isPublic:opt.val}))}
                      style={{ padding:"12px",borderRadius:11,border:`2px solid ${data.isPublic===opt.val?"#7c3aed":"#e2e8f0"}`,cursor:"pointer",background:data.isPublic===opt.val?"#f5f3ff":"#fff",transition:"all 0.15s",textAlign:"center" }}>
                      <div style={{ fontSize:22 }}>{opt.icon}</div>
                      <p style={{ margin:"4px 0 2px",fontSize:13,fontWeight:700,color:data.isPublic===opt.val?"#7c3aed":"#1e293b" }}>{opt.label}</p>
                      <p style={{ margin:0,fontSize:11,color:"#64748b" }}>{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <span style={LBL}>Check-ins automáticos</span>
                <div style={{ display:"flex",gap:10 }}>
                  {[15,30].map(d=>(
                    <button key={d} onClick={()=>setData(pd=>({...pd,checkinDays:d}))}
                      style={{ flex:1,padding:"10px",borderRadius:10,border:`2px solid ${data.checkinDays===d?"#7c3aed":"#e2e8f0"}`,background:data.checkinDays===d?"#f5f3ff":"#fff",cursor:"pointer",fontSize:13,fontWeight:data.checkinDays===d?700:400,color:data.checkinDays===d?"#7c3aed":"#64748b" }}>
                      A cada {d} dias
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span style={LBL}>Marcos / Checkpoints</span>
                <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                  {data.milestones.map((m,i)=>(
                    <div key={m.id} style={{ display:"flex",gap:8 }}>
                      <input value={m.title} onChange={e=>{const ms=[...data.milestones];ms[i]={...m,title:e.target.value};setData(d=>({...d,milestones:ms}));}} style={{ ...INP,flex:1 }} placeholder="Ex: Revisão de 30 dias"/>
                      <input type="date" value={m.date} onChange={e=>{const ms=[...data.milestones];ms[i]={...m,date:e.target.value};setData(d=>({...d,milestones:ms}));}} style={{ ...INP,width:140 }}/>
                      <button onClick={()=>setData(d=>({...d,milestones:d.milestones.filter((_,idx)=>idx!==i)}))} style={{ background:"none",border:"none",cursor:"pointer",color:"#dc2626",fontSize:18 }}>×</button>
                    </div>
                  ))}
                  <button onClick={()=>setData(d=>({...d,milestones:[...d.milestones,{id:uid(),title:"",date:"",done:false,notes:""}]}))}
                    style={{ padding:"7px",borderRadius:9,border:"1px dashed #e2e8f0",background:"transparent",cursor:"pointer",fontSize:12.5,color:"#7c3aed",fontWeight:600 }}>+ Marco</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:"14px 24px",borderTop:"1px solid #f1f5f9",display:"flex",gap:10,justifyContent:"space-between",alignItems:"center" }}>
          {err && <p style={{ margin:0,fontSize:12.5,color:"#dc2626",flex:1 }}>{err}</p>}
          <div style={{ display:"flex",gap:10,marginLeft:"auto" }}>
            {step !== "meta" && (
              <button onClick={()=>setStep(STEPS[STEPS.findIndex(s=>s.key===step)-1].key)} style={{ padding:"9px 18px",borderRadius:10,border:"1px solid #e2e8f0",background:"transparent",cursor:"pointer",fontSize:13,color:"#64748b" }}>← Anterior</button>
            )}
            {step !== "settings" ? (
              <button onClick={()=>setStep(STEPS[STEPS.findIndex(s=>s.key===step)+1].key)} style={{ padding:"9px 22px",borderRadius:10,background:"#7c3aed",border:"none",cursor:"pointer",fontSize:13,fontWeight:700,color:"#fff" }}>Seguinte →</button>
            ) : (
              <button onClick={save} disabled={saving} style={{ padding:"9px 22px",borderRadius:10,background:saving?"#a78bfa":"#7c3aed",border:"none",cursor:saving?"not-allowed":"pointer",fontSize:13,fontWeight:700,color:"#fff",display:"flex",alignItems:"center",gap:8 }}>
                {saving && <div style={{ width:13,height:13,border:"2px solid rgba(255,255,255,0.4)",borderTopColor:"#fff",borderRadius:"50%",animation:"dp-spin 0.7s linear infinite" }}/>}
                {saving ? "A guardar..." : initial ? "Actualizar PDI" : "Criar PDI"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({ plan, onOpen, onComplete, onCancel }: {
  plan: DevelopmentPlan;
  onOpen: () => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const data       = parsePlan(plan.goal);
  const progress   = getPlanProgress(data);
  const health     = getPlanHealth(data);
  const daysLeft   = data.endDate ? getDaysLeft(data.endDate) : null;
  const statusCfg  = PLAN_STATUS_CFG[plan.status];
  const healthCfg  = HEALTH_CFG[health];
  const [hov, setHov] = useState(false);

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ ...CARD,padding:"18px 20px",display:"flex",flexDirection:"column",gap:12,cursor:"pointer",transition:"all 0.18s",transform:hov?"translateY(-2px)":"none",boxShadow:hov?"0 8px 24px rgba(124,58,237,0.12)":"none",borderLeft:"4px solid #7c3aed" }}>

      {/* Top */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12 }}>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:"flex",gap:7,alignItems:"center",marginBottom:5,flexWrap:"wrap" }}>
            <span style={{ padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,background:statusCfg.bg,color:statusCfg.color }}>{statusCfg.icon} {statusCfg.label}</span>
            <span style={{ padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,background:healthCfg.bg,color:healthCfg.color }}>{healthCfg.label}</span>
            {data.isPublic && <span style={{ fontSize:10,color:"#64748b" }}>🌍 Público</span>}
          </div>
          <p style={{ margin:"0 0 4px",fontSize:14.5,fontWeight:700,color:"#1e293b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
            {data.cycleName || `PDI — ${plan.user?.fullName ?? `#${plan.userId}`}`}
          </p>
          <p style={{ margin:"0 0 2px",fontSize:12.5,color:"#64748b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
            🎯 {data.smart.specific || "Meta não definida"}
          </p>
          {data.startDate && data.endDate && (
            <p style={{ margin:0,fontSize:11.5,color:"#94a3b8" }}>📅 {fmtDate(data.startDate)} → {fmtDate(data.endDate)}{daysLeft !== null ? ` · ${daysLeft}d restantes` : ""}</p>
          )}
        </div>
        <ProgressRing pct={progress} size={58} color={healthCfg.color}/>
      </div>

      {/* Actions summary */}
      <div style={{ display:"flex",gap:8 }}>
        {Object.entries(ACTION_STATUS_CFG).map(([k,v])=>{
          const cnt = data.actions.filter(a=>a.status===k).length;
          if (!cnt) return null;
          return <span key={k} style={{ padding:"2px 8px",borderRadius:20,fontSize:10.5,fontWeight:700,background:v.bg,color:v.color }}>{v.icon} {cnt}</span>;
        })}
        {data.actions.length === 0 && <span style={{ fontSize:11.5,color:"#94a3b8" }}>Sem acções definidas</span>}
      </div>

      {/* Certificate */}
      {plan.certificates && plan.certificates.length > 0 && (
        <div style={{ padding:"8px 12px",background:"#fffbeb",border:"1px solid #fde68a",borderRadius:9,display:"flex",alignItems:"center",gap:8 }}>
          <span style={{ fontSize:18 }}>🎓</span>
          <div>
            <p style={{ margin:0,fontSize:12,fontWeight:700,color:"#1e293b" }}>Certificado Emitido</p>
            <p style={{ margin:0,fontSize:10.5,color:"#94a3b8" }}>Código: {plan.certificates[0].validationCode}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display:"flex",gap:8,paddingTop:4,borderTop:"1px solid #f1f5f9" }}>
        <button onClick={onOpen} style={{ flex:2,padding:"8px",borderRadius:8,border:"none",background:"#7c3aed",color:"#fff",fontSize:12.5,fontWeight:700,cursor:"pointer" }}>Abrir PDI</button>
        {plan.status === "ACTIVE" && (
          <>
            <button onClick={e=>{e.stopPropagation();onComplete();}} style={{ flex:1,padding:"8px",borderRadius:8,border:"1px solid #bbf7d0",background:"#f0fdf4",color:"#16a34a",fontSize:12,fontWeight:700,cursor:"pointer" }}>✅ Concluir</button>
            <button onClick={e=>{e.stopPropagation();onCancel();}} style={{ padding:"8px 10px",borderRadius:8,border:"1px solid #fecaca",background:"#fef2f2",fontSize:12,cursor:"pointer",color:"#dc2626" }}>✕</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Plan Detail View ─────────────────────────────────────────────────────────

type DetailTab = "kanban" | "timeline" | "smart" | "checkins";

function PlanDetail({ plan, onBack, onRefresh, showToast }: {
  plan: DevelopmentPlan;
  onBack: () => void;
  onRefresh: () => void;
  showToast: (m:string,t:"success"|"error"|"info") => void;
}) {
  const [data, setData]       = useState<PlanData>(parsePlan(plan.goal));
  const [detailTab, setDetailTab] = useState<DetailTab>("kanban");
  const [showCheckin, setShowCheckin] = useState(false);
  const [showEdit, setShowEdit]       = useState(false);
  const [saving, setSaving]           = useState(false);

  const progress = getPlanProgress(data);

  async function save(newData: PlanData) {
    setSaving(true);
    try {
      await api.put(`/development-plans/${plan.id}`, { goal: serializePlan(newData) });
      setData(newData);
      showToast("PDI actualizado!","success");
    } catch (e: any) { showToast(e.message,"error"); }
    finally { setSaving(false); }
  }

  async function handleCheckin(newData: PlanData) {
    await save(newData);
    showToast("Check-in registado! O gestor foi notificado.","success");
  }

  const statusCfg = PLAN_STATUS_CFG[plan.status];
  const health    = getPlanHealth(data);
  const healthCfg = HEALTH_CFG[health];

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding:"7px 16px",border:"none",cursor:"pointer",fontSize:12.5,
    fontWeight:active?700:500,borderRadius:9,
    background:active?"#7c3aed":"transparent",
    color:active?"#fff":"#64748b",transition:"all 0.15s",
  });

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
      {/* Header */}
      <div style={{ ...CARD,padding:"20px 24px" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,flexWrap:"wrap",gap:12 }}>
          <div>
            <button onClick={onBack} style={{ background:"none",border:"none",cursor:"pointer",color:"#64748b",fontSize:13,fontWeight:600,padding:0,marginBottom:8,display:"flex",alignItems:"center",gap:6 }}>
              ← Voltar
            </button>
            <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:6 }}>
              <span style={{ padding:"2px 8px",borderRadius:20,fontSize:10.5,fontWeight:700,background:statusCfg.bg,color:statusCfg.color }}>{statusCfg.icon} {statusCfg.label}</span>
              <span style={{ padding:"2px 8px",borderRadius:20,fontSize:10.5,fontWeight:700,background:healthCfg.bg,color:healthCfg.color }}>Saúde: {healthCfg.label}</span>
              {data.isPublic ? <span style={{ fontSize:10.5,color:"#64748b" }}>🌍 Público</span> : <span style={{ fontSize:10.5,color:"#64748b" }}>🔒 Privado</span>}
            </div>
            <h2 style={{ margin:"0 0 4px",fontSize:18,fontWeight:800,color:"#1e293b" }}>
              {data.cycleName || `PDI — ${plan.user?.fullName ?? `#${plan.userId}`}`}
            </h2>
            <p style={{ margin:0,fontSize:13,color:"#64748b" }}>📅 {fmtDate(data.startDate)} → {fmtDate(data.endDate)}</p>
            {data.mentorName && <p style={{ margin:"2px 0 0",fontSize:12.5,color:"#0891b2" }}>🤝 Mentor: {data.mentorName}</p>}
          </div>
          <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
            <button onClick={()=>setShowCheckin(true)} style={{ padding:"8px 16px",borderRadius:9,background:"#ecfeff",border:"1px solid #a5f3fc",color:"#0891b2",fontSize:12.5,fontWeight:700,cursor:"pointer" }}>
              ⚡ Check-in
            </button>
            <button onClick={()=>setShowEdit(true)} style={{ padding:"8px 16px",borderRadius:9,background:"#f5f3ff",border:"1px solid #e9d5ff",color:"#7c3aed",fontSize:12.5,fontWeight:700,cursor:"pointer" }}>
              ✏️ Editar
            </button>
            {/* Co-creation validation */}
            {!data.selfAccepted && (
              <button onClick={()=>{const nd={...data,selfAccepted:true};save(nd);}} style={{ padding:"8px 16px",borderRadius:9,background:"#16a34a",border:"none",color:"#fff",fontSize:12.5,fontWeight:700,cursor:"pointer" }}>
                ✅ Aceitar Plano
              </button>
            )}
            {!data.managerValidated && (
              <button onClick={()=>{const nd={...data,managerValidated:true};save(nd);}} style={{ padding:"8px 16px",borderRadius:9,background:"#0891b2",border:"none",color:"#fff",fontSize:12.5,fontWeight:700,cursor:"pointer" }}>
                📋 Validar (Gestor)
              </button>
            )}
          </div>
        </div>

        {/* Validation status */}
        <div style={{ display:"flex",gap:10,marginBottom:14,flexWrap:"wrap" }}>
          <div style={{ padding:"6px 14px",borderRadius:20,fontSize:11.5,fontWeight:700,background:data.selfAccepted?"#f0fdf4":"#f8fafc",color:data.selfAccepted?"#16a34a":"#94a3b8",border:`1px solid ${data.selfAccepted?"#bbf7d0":"#e2e8f0"}` }}>
            {data.selfAccepted ? "✓ Aceite pelo Colaborador" : "⏳ Aguarda Aceitação"}
          </div>
          <div style={{ padding:"6px 14px",borderRadius:20,fontSize:11.5,fontWeight:700,background:data.managerValidated?"#ecfeff":"#f8fafc",color:data.managerValidated?"#0891b2":"#94a3b8",border:`1px solid ${data.managerValidated?"#a5f3fc":"#e2e8f0"}` }}>
            {data.managerValidated ? "✓ Validado pelo Gestor" : "⏳ Aguarda Validação"}
          </div>
        </div>

        {/* Health indicator */}
        <HealthIndicator data={data}/>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex",gap:4,background:"#f1f5f9",borderRadius:11,padding:4,width:"fit-content" }}>
        <button onClick={()=>setDetailTab("kanban")}   style={tabBtn(detailTab==="kanban")}>📋 Kanban</button>
        <button onClick={()=>setDetailTab("timeline")} style={tabBtn(detailTab==="timeline")}>📅 Timeline</button>
        <button onClick={()=>setDetailTab("smart")}    style={tabBtn(detailTab==="smart")}>🎯 SMART</button>
        <button onClick={()=>setDetailTab("checkins")} style={tabBtn(detailTab==="checkins")}>💬 Check-ins ({data.checkins.length})</button>
      </div>

      {/* Kanban */}
      {detailTab === "kanban" && (
        <div>
          <div style={{ display:"flex",justifyContent:"flex-end",marginBottom:12 }}>
            <button onClick={async()=>{
              const newAction: ActionItem = {id:uid(),title:"Nova acção",type:"COURSE",status:"TODO",priority:"MEDIUM",startDate:data.startDate,endDate:data.endDate,hours:0,competencies:[],comments:[],createdBy:"SELF",progress:0};
              await save({...data,actions:[...data.actions,newAction]});
            }} style={{ padding:"7px 16px",borderRadius:9,background:"#7c3aed",border:"none",color:"#fff",fontSize:12.5,fontWeight:700,cursor:"pointer" }}>
              + Acção
            </button>
          </div>
          <KanbanBoard plan={plan} data={data} onUpdate={save} showToast={showToast}/>
        </div>
      )}

      {/* Timeline */}
      {detailTab === "timeline" && <GanttView data={data}/>}

      {/* SMART */}
      {detailTab === "smart" && (
        <div style={{ ...CARD,padding:"20px 24px" }}>
          <h3 style={{ margin:"0 0 16px",fontSize:15,fontWeight:700,color:"#1e293b" }}>🎯 Meta SMART</h3>
          {Object.entries({
            specific:"S — Específico",measurable:"M — Mensurável",achievable:"A — Atingível",relevant:"R — Relevante",timeBound:"T — Temporal",
          }).map(([k,label])=>(
            <div key={k} style={{ marginBottom:14 }}>
              <p style={{ margin:"0 0 4px",fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:0.7 }}>{label}</p>
              <p style={{ margin:0,fontSize:14,color:"#1e293b",lineHeight:1.65,background:"#f8fafc",padding:"10px 14px",borderRadius:10 }}>
                {(data.smart as any)[k] || <span style={{ color:"#94a3b8",fontStyle:"italic" }}>Não preenchido</span>}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Checkins */}
      {detailTab === "checkins" && (
        <div style={{ ...CARD,padding:"20px 24px",display:"flex",flexDirection:"column",gap:14 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <h3 style={{ margin:0,fontSize:15,fontWeight:700,color:"#1e293b" }}>💬 Histórico de Check-ins</h3>
            <button onClick={()=>setShowCheckin(true)} style={{ padding:"7px 16px",borderRadius:9,background:"#7c3aed",border:"none",color:"#fff",fontSize:12.5,fontWeight:700,cursor:"pointer" }}>+ Check-in</button>
          </div>
          {data.checkins.length === 0 ? (
            <div style={{ textAlign:"center",padding:"32px 0",color:"#94a3b8" }}>
              <p style={{ fontSize:28,margin:"0 0 8px" }}>📭</p>
              <p style={{ fontSize:13 }}>Sem check-ins registados.</p>
            </div>
          ) : (
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {data.checkins.map(c=>(
                <div key={c.id} style={{ display:"flex",gap:10,alignItems:"flex-start" }}>
                  <Avatar name={c.author} size={34}/>
                  <div style={{ flex:1,background:"#f8fafc",borderRadius:12,padding:"10px 14px" }}>
                    <div style={{ display:"flex",gap:8,marginBottom:5 }}>
                      <span style={{ fontSize:13,fontWeight:700,color:"#1e293b" }}>{c.author}</span>
                      <span style={{ fontSize:11,color:"#94a3b8" }}>{fmtDate(c.date)}</span>
                      {c.progress !== undefined && <span style={{ fontSize:11,fontWeight:700,color:"#7c3aed" }}>📊 {c.progress}%</span>}
                    </div>
                    <p style={{ margin:0,fontSize:13,color:"#475569",lineHeight:1.6,whiteSpace:"pre-wrap" }}>{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showCheckin && <CheckinModal plan={plan} data={data} onClose={()=>setShowCheckin(false)} onSave={handleCheckin}/>}
      {showEdit && <PlanModal initial={{...plan,goal:serializePlan(data)}} onClose={()=>setShowEdit(false)} onSaved={updatedPlan=>{setData(parsePlan(updatedPlan.goal));setShowEdit(false);showToast("PDI actualizado!","success");}}/>}
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

function AdminDashboard({ showToast }: { showToast:(m:string,t:"success"|"error"|"info")=>void }) {
  const [plans, setPlans]   = useState<DevelopmentPlan[]>([]);
  const [total, setTotal]   = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async (p=1) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({page:String(p),limit:"20"});
      if (filterStatus) q.set("status",filterStatus);
      const res = await api.get<any>(`/development-plans?${q}`);
      setPlans(res.data??[]); setTotal(res.total??0); setTotalPages(res.totalPages??1); setPage(p);
    } catch(e:any){showToast(e.message,"error");}
    finally{setLoading(false);}
  },[filterStatus]);

  useEffect(()=>{load(1);},[filterStatus]);

  const filtered = search ? plans.filter(p=>p.user?.fullName?.toLowerCase().includes(search.toLowerCase())) : plans;
  const active   = plans.filter(p=>p.status==="ACTIVE").length;
  const completed= plans.filter(p=>p.status==="COMPLETED").length;
  const adherence= total ? Math.round((active+completed)/total*100) : 0;
  const avgProg  = plans.length ? Math.round(plans.reduce((s,p)=>{const d=parsePlan(p.goal);return s+getPlanProgress(d);},0)/plans.length) : 0;

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
      {/* Stats */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12 }}>
        {[
          {label:"Total PDIs",       value:total,      icon:"📋",color:"#7c3aed",bg:"#f5f3ff"},
          {label:"Activos",          value:active,     icon:"🔵",color:"#0891b2",bg:"#ecfeff"},
          {label:"Concluídos",       value:completed,  icon:"✅",color:"#16a34a",bg:"#f0fdf4"},
          {label:"Aderência",        value:`${adherence}%`,icon:"📊",color:"#d97706",bg:"#fffbeb"},
          {label:"Progresso Médio",  value:`${avgProg}%`, icon:"🎯",color:"#7c3aed",bg:"#f5f3ff"},
        ].map(s=>(
          <div key={s.label} style={{ ...CARD,padding:"14px 16px",display:"flex",alignItems:"center",gap:12 }}>
            <div style={{ width:40,height:40,borderRadius:10,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>{s.icon}</div>
            <div>
              <p style={{ margin:0,fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:0.7 }}>{s.label}</p>
              <p style={{ margin:0,fontSize:20,fontWeight:800,color:s.color }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex",gap:12,flexWrap:"wrap",alignItems:"center" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Pesquisar colaborador..." style={{ ...INP,maxWidth:280 }}/>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{ ...INP,maxWidth:180 }}>
          <option value="">Todos os estados</option>
          {Object.entries(PLAN_STATUS_CFG).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
        {(filterStatus||search) && <button onClick={()=>{setFilterStatus("");setSearch("");}} style={{ padding:"9px 14px",borderRadius:9,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",fontSize:12.5,color:"#64748b" }}>✕</button>}
        <span style={{ fontSize:12.5,color:"#94a3b8" }}>{total} planos</span>
      </div>

      {/* Table */}
      {loading ? <Spinner/> : (
        <div style={{ ...CARD,overflow:"hidden" }}>
          {filtered.length === 0 ? (
            <div style={{ padding:"48px 24px",textAlign:"center",color:"#94a3b8" }}>
              <p style={{ fontSize:28,margin:"0 0 8px" }}>📭</p>
              <p style={{ fontSize:14 }}>Nenhum PDI encontrado.</p>
            </div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%",borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"#f8fafc",borderBottom:"1px solid #e2e8f0" }}>
                    {["Colaborador","Ciclo","Estado","Progresso","Acções","Saúde"].map(h=>(
                      <th key={h} style={{ padding:"10px 14px",textAlign:"left",fontSize:10.5,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:0.6,whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(plan=>{
                    const data    = parsePlan(plan.goal);
                    const progress= getPlanProgress(data);
                    const health  = getPlanHealth(data);
                    const hCfg    = HEALTH_CFG[health];
                    const sCfg    = PLAN_STATUS_CFG[plan.status];
                    return (
                      <tr key={plan.id} style={{ borderBottom:"1px solid #f1f5f9" }}
                        onMouseEnter={e=>(e.currentTarget.style.background="#fafafa")}
                        onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                        <td style={{ padding:"12px 14px" }}>
                          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                            <Avatar name={plan.user?.fullName??"?"} size={30}/>
                            <div>
                              <p style={{ margin:0,fontSize:13,fontWeight:600,color:"#1e293b" }}>{plan.user?.fullName??"—"}</p>
                              <p style={{ margin:0,fontSize:11,color:"#94a3b8" }}>{plan.user?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:"12px 14px",fontSize:12.5,color:"#64748b" }}>{data.cycleName||`#${plan.id}`}</td>
                        <td style={{ padding:"12px 14px" }}><span style={{ padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,background:sCfg.bg,color:sCfg.color }}>{sCfg.icon} {sCfg.label}</span></td>
                        <td style={{ padding:"12px 14px",minWidth:120 }}>
                          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                            <div style={{ flex:1,height:5,background:"#e2e8f0",borderRadius:3,overflow:"hidden" }}>
                              <div style={{ height:"100%",width:`${progress}%`,background:"#7c3aed",borderRadius:3 }}/>
                            </div>
                            <span style={{ fontSize:11,fontWeight:700,color:"#7c3aed" }}>{progress}%</span>
                          </div>
                        </td>
                        <td style={{ padding:"12px 14px",fontSize:12.5,color:"#64748b" }}>{data.actions.length} acções</td>
                        <td style={{ padding:"12px 14px" }}><span style={{ padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,background:hCfg.bg,color:hCfg.color }}>{hCfg.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",borderTop:"1px solid #f1f5f9" }}>
              <span style={{ fontSize:12.5,color:"#64748b" }}>Página {page} de {totalPages}</span>
              <div style={{ display:"flex",gap:8 }}>
                <button onClick={()=>load(page-1)} disabled={page===1} style={{ padding:"7px 14px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",fontSize:12.5,opacity:page===1?0.4:1 }}>← Anterior</button>
                <button onClick={()=>load(page+1)} disabled={page===totalPages} style={{ padding:"7px 14px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",fontSize:12.5,opacity:page===totalPages?0.4:1 }}>Seguinte →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type MainTab = "my" | "admin";

export default function DevelopmentPlansPage() {
  const { showToast, toastNode } = useToast();

  const [mainTab, setMainTab]   = useState<MainTab>("my");
  const [myPlans, setMyPlans]   = useState<DevelopmentPlan[]>([]);
  const [myStats, setMyStats]   = useState<MyStats | null>(null);
  const [loading, setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [openPlan, setOpenPlan] = useState<DevelopmentPlan | null>(null);

  const loadMy = useCallback(async () => {
    setLoading(true);
    try {
      const [plans, stats] = await Promise.all([
        api.get<DevelopmentPlan[]>("/development-plans/my"),
        api.get<MyStats>("/development-plans/my/stats"),
      ]);
      setMyPlans(Array.isArray(plans) ? plans : []);
      setMyStats(stats);
    } catch(e:any){ showToast(e.message,"error"); }
    finally { setLoading(false); }
  },[]);

  useEffect(()=>{ if(mainTab==="my") loadMy(); },[mainTab]);

  async function completePlan(id:number) {
    if (!confirm("Concluir este PDI? Será emitido um certificado e 200 pontos atribuídos.")) return;
    try {
      await api.patch(`/development-plans/${id}/complete`,{});
      showToast("PDI concluído! 🎓 Certificado emitido.","success");
      loadMy();
    } catch(e:any){ showToast(e.message,"error"); }
  }

  async function cancelPlan(id:number) {
    if (!confirm("Cancelar este PDI?")) return;
    try {
      await api.patch(`/development-plans/${id}/cancel`,{});
      showToast("PDI cancelado.","info");
      loadMy();
    } catch(e:any){ showToast(e.message,"error"); }
  }

  const tabBtn=(active:boolean):React.CSSProperties=>({
    padding:"9px 22px",border:"none",cursor:"pointer",fontSize:13,
    fontWeight:active?700:500,borderRadius:9,
    background:active?"#7c3aed":"transparent",
    color:active?"#fff":"#64748b",transition:"all 0.15s",
  });

  // If plan is open, show detail view
  if (openPlan) {
    return (
      <>
        <style>{`@keyframes dp-spin{to{transform:rotate(360deg)}}@keyframes dp-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}@keyframes dp-in{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:none}}`}</style>
        <PlanDetail plan={openPlan} onBack={()=>{setOpenPlan(null);loadMy();}} onRefresh={loadMy} showToast={showToast}/>
        {toastNode}
      </>
    );
  }

  return (
    <>
      <style>{`@keyframes dp-spin{to{transform:rotate(360deg)}}@keyframes dp-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}@keyframes dp-in{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:none}}`}</style>

      <div>
        {/* Header */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:12 }}>
          <div>
            <h1 style={{ margin:0,fontSize:24,fontWeight:700,color:"#1e293b" }}>🎯 Planos de Desenvolvimento</h1>
            <p style={{ margin:"4px 0 0",fontSize:14,color:"#64748b" }}>PDI — Crescimento profissional guiado por metas SMART e acções concretas</p>
          </div>
          <button onClick={()=>setShowCreate(true)} style={{ padding:"10px 22px",background:"linear-gradient(135deg,#7c3aed,#a78bfa)",color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 14px rgba(124,58,237,0.3)" }}>
            ✨ Novo PDI
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex",gap:4,background:"#f1f5f9",borderRadius:11,padding:4,marginBottom:24,width:"fit-content" }}>
          <button onClick={()=>setMainTab("my")}    style={tabBtn(mainTab==="my")}>🙋 Os Meus Planos</button>
          <button onClick={()=>setMainTab("admin")} style={tabBtn(mainTab==="admin")}>📊 Dashboard (Admin)</button>
        </div>

        {/* MY PLANS */}
        {mainTab === "my" && (
          <>
            {/* My stats */}
            {myStats && (
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12,marginBottom:24 }}>
                {[
                  {label:"Total PDIs",     value:myStats.total,          icon:"📋",color:"#7c3aed",bg:"#f5f3ff"},
                  {label:"Activos",        value:myStats.active,         icon:"🔵",color:"#0891b2",bg:"#ecfeff"},
                  {label:"Concluídos",     value:myStats.completed,      icon:"✅",color:"#16a34a",bg:"#f0fdf4"},
                  {label:"Taxa Conclusão", value:`${myStats.completionRate}%`,icon:"🏆",color:"#d97706",bg:"#fffbeb"},
                ].map(s=>(
                  <div key={s.label} style={{ ...CARD,padding:"14px 16px",display:"flex",alignItems:"center",gap:12 }}>
                    <div style={{ width:40,height:40,borderRadius:10,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>{s.icon}</div>
                    <div>
                      <p style={{ margin:0,fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:0.7 }}>{s.label}</p>
                      <p style={{ margin:0,fontSize:20,fontWeight:800,color:s.color }}>{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {loading ? <Spinner/> : myPlans.length === 0 ? (
              <EmptyState onCreate={()=>setShowCreate(true)}/>
            ) : (
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:16 }}>
                {myPlans.map(plan=>(
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onOpen={()=>setOpenPlan(plan)}
                    onComplete={()=>completePlan(plan.id)}
                    onCancel={()=>cancelPlan(plan.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ADMIN */}
        {mainTab === "admin" && <AdminDashboard showToast={showToast}/>}
      </div>

      {/* Floating Action Button */}
      <button onClick={()=>setShowCreate(true)}
        style={{ position:"fixed",bottom:28,right:28,width:56,height:56,borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#a78bfa)",border:"none",color:"#fff",fontSize:26,cursor:"pointer",boxShadow:"0 8px 24px rgba(124,58,237,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,transition:"transform 0.2s" }}
        onMouseEnter={e=>(e.currentTarget.style.transform="scale(1.1)")}
        onMouseLeave={e=>(e.currentTarget.style.transform="scale(1)")}>
        +
      </button>

      {/* Modals */}
      {showCreate && (
        <PlanModal
          onClose={()=>setShowCreate(false)}
          onSaved={plan=>{ showToast("PDI criado com sucesso!","success"); loadMy(); setShowCreate(false); setOpenPlan(plan); }}
        />
      )}

      {toastNode}
    </>
  );
}
