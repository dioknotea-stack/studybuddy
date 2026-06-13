import { useState, useEffect, useRef, useCallback } from "react";

const COLORS = {
  purple: "#7C3AED", purpleLight: "#EDE9FE", purpleMid: "#A78BFA",
  teal: "#0D9488", tealLight: "#CCFBF1",
  amber: "#D97706", amberLight: "#FEF3C7",
  coral: "#E85D4A", coralLight: "#FEE2E2",
  green: "#16A34A", greenLight: "#DCFCE7",
  blue: "#2563EB", blueLight: "#DBEAFE",
  gray: "#6B7280", grayLight: "#F3F4F6",
  dark: "#1E1B4B",
};

const REWARDS = [
  { id: 1, name: "Snack break 🍪", cost: 50, icon: "ti-cookie" },
  { id: 2, name: "15 min social media", cost: 75, icon: "ti-brand-instagram" },
  { id: 3, name: "30 min gaming", cost: 150, icon: "ti-device-gamepad" },
  { id: 4, name: "Movie night", cost: 300, icon: "ti-movie" },
  { id: 5, name: "Boba tea ☕", cost: 100, icon: "ti-cup" },
  { id: 6, name: "Friend hangout", cost: 200, icon: "ti-users" },
];

const STORAGE_KEY = "studybuddy_v1";

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}
function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

const defaultState = {
  classes: [],
  assignments: [],
  notes: [],
  xp: 0,
  streak: 0,
  lastStudyDate: null,
  redeemedRewards: [],
  tab: "dashboard",
};

export default function App() {
  const [s, setS] = useState(() => ({ ...defaultState, ...load() }));
  const update = (patch) => setS(prev => {
    const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
    save(next);
    return next;
  });

  const addXP = (amount, reason) => {
    update(prev => {
      const today = new Date().toDateString();
      const newStreak = prev.lastStudyDate === new Date(Date.now() - 86400000).toDateString()
        ? prev.streak + 1 : prev.lastStudyDate === today ? prev.streak : 1;
      return { ...prev, xp: prev.xp + amount, streak: newStreak, lastStudyDate: today };
    });
  };

  const Tab = ({ id, icon, label }) => (
    <button onClick={() => update({ tab: id })}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        padding: "10px 14px", border: "none", background: "none", cursor: "pointer",
        color: s.tab === id ? COLORS.purple : COLORS.gray,
        borderBottom: s.tab === id ? `2px solid ${COLORS.purple}` : "2px solid transparent",
        fontSize: 11, fontWeight: s.tab === id ? 600 : 400, transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}>
      <i className={`ti ${icon}`} style={{ fontSize: 20 }} />
      {label}
    </button>
  );

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh", background: "#FAFAF9", color: "#1a1a2e" }}>
      <h2 className="sr-only">StudyBuddy — Your personal academic assistant</h2>

      {/* Header */}
      <div style={{ background: COLORS.dark, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: COLORS.purple, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="ti ti-brain" style={{ fontSize: 20, color: "#fff" }} />
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 16, lineHeight: 1.1 }}>StudyBuddy</div>
            <div style={{ color: COLORS.purpleMid, fontSize: 12 }}>Your ADHD-friendly study system</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: COLORS.amber, fontWeight: 700, fontSize: 18, lineHeight: 1 }}>{s.xp}</div>
            <div style={{ color: "#aaa", fontSize: 11 }}>XP</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: COLORS.coral, fontWeight: 700, fontSize: 18, lineHeight: 1 }}>🔥 {s.streak}</div>
            <div style={{ color: "#aaa", fontSize: 11 }}>streak</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", overflowX: "auto", paddingLeft: 4 }}>
        <Tab id="dashboard" icon="ti-layout-dashboard" label="Dashboard" />
        <Tab id="classes" icon="ti-school" label="Classes" />
        <Tab id="assignments" icon="ti-clipboard-list" label="Assignments" />
        <Tab id="grades" icon="ti-chart-bar" label="Grades" />
        <Tab id="study" icon="ti-books" label="Study" />
        <Tab id="rewards" icon="ti-gift" label="Rewards" />
      </div>

      {/* Content */}
      <div style={{ padding: "20px 16px", maxWidth: 780, margin: "0 auto" }}>
        {s.tab === "dashboard" && <Dashboard s={s} update={update} addXP={addXP} />}
        {s.tab === "classes" && <Classes s={s} update={update} />}
        {s.tab === "assignments" && <Assignments s={s} update={update} addXP={addXP} />}
        {s.tab === "grades" && <Grades s={s} update={update} />}
        {s.tab === "study" && <Study s={s} update={update} addXP={addXP} />}
        {s.tab === "rewards" && <Rewards s={s} update={update} />}
      </div>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────
function Dashboard({ s, update, addXP }) {
  const today = new Date();
  const upcoming = s.assignments.filter(a => !a.done && a.dueDate).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5);
  const overdue = upcoming.filter(a => new Date(a.dueDate) < today);
  const totalDone = s.assignments.filter(a => a.done).length;
  const total = s.assignments.length;
  const level = Math.floor(s.xp / 100) + 1;
  const xpInLevel = s.xp % 100;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: COLORS.dark }}>
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}! 👋
        </h2>
        <p style={{ margin: 0, color: COLORS.gray, fontSize: 14 }}>{today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
      </div>

      {/* XP Bar */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Level {level} Scholar</span>
          <span style={{ fontSize: 13, color: COLORS.purple, fontWeight: 600 }}>{xpInLevel}/100 XP</span>
        </div>
        <div style={{ background: "#f3f4f6", borderRadius: 99, height: 10, overflow: "hidden" }}>
          <div style={{ width: `${xpInLevel}%`, height: "100%", background: `linear-gradient(90deg, ${COLORS.purple}, ${COLORS.purpleMid})`, borderRadius: 99, transition: "width 0.4s" }} />
        </div>
        <div style={{ fontSize: 12, color: COLORS.gray, marginTop: 6 }}>{100 - xpInLevel} XP to next level</div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Classes", value: s.classes.length, color: COLORS.blue, icon: "ti-school" },
          { label: "Done", value: `${totalDone}/${total}`, color: COLORS.green, icon: "ti-check" },
          { label: "Overdue", value: overdue.length, color: overdue.length ? COLORS.coral : COLORS.green, icon: "ti-alert-circle" },
        ].map(st => (
          <div key={st.label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
            <i className={`ti ${st.icon}`} style={{ fontSize: 22, color: st.color }} />
            <div style={{ fontWeight: 700, fontSize: 20, color: st.color, marginTop: 4 }}>{st.value}</div>
            <div style={{ fontSize: 12, color: COLORS.gray }}>{st.label}</div>
          </div>
        ))}
      </div>

      {/* Upcoming */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          <i className="ti ti-calendar-due" style={{ color: COLORS.amber }} /> Upcoming assignments
        </h3>
        {upcoming.length === 0 ? (
          <p style={{ margin: 0, color: COLORS.gray, fontSize: 14 }}>No upcoming assignments. You're all caught up! 🎉</p>
        ) : upcoming.map(a => {
          const cls = s.classes.find(c => c.id === a.classId);
          const due = new Date(a.dueDate);
          const daysLeft = Math.ceil((due - today) / 86400000);
          const isOverdue = daysLeft < 0;
          return (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{a.name}</div>
                <div style={{ fontSize: 12, color: COLORS.gray }}>{cls?.name || "Unknown class"}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: isOverdue ? COLORS.coral : daysLeft <= 2 ? COLORS.amber : COLORS.green }}>
                  {isOverdue ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? "Due today!" : `${daysLeft}d left`}
                </div>
                <div style={{ fontSize: 11, color: COLORS.gray }}>{due.toLocaleDateString()}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick study prompt */}
      <div style={{ background: COLORS.purpleLight, border: `1px solid ${COLORS.purpleMid}`, borderRadius: 12, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.dark }}>Ready to study? 📚</div>
          <div style={{ fontSize: 13, color: COLORS.gray, marginTop: 2 }}>Earn XP by completing assignments and study sessions.</div>
        </div>
        <button onClick={() => update({ tab: "study" })} style={{ background: COLORS.purple, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
          Study now →
        </button>
      </div>
    </div>
  );
}

// ─── CLASSES ─────────────────────────────────────────────────
function Classes({ s, update }) {
  const [form, setForm] = useState({ name: "", teacher: "", gradeComponents: [{ name: "Assignments", weight: 40 }, { name: "Exams", weight: 40 }, { name: "Participation", weight: 20 }] });
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);

  const addClass = () => {
    if (!form.name.trim()) return;
    const totalWeight = form.gradeComponents.reduce((s, c) => s + Number(c.weight), 0);
    if (totalWeight !== 100) { alert("Grade component weights must sum to 100%"); return; }
    if (editId) {
      update(prev => ({ ...prev, classes: prev.classes.map(c => c.id === editId ? { ...c, ...form } : c) }));
      setEditId(null);
    } else {
      update(prev => ({ ...prev, classes: [...prev.classes, { id: Date.now(), ...form }] }));
    }
    setForm({ name: "", teacher: "", gradeComponents: [{ name: "Assignments", weight: 40 }, { name: "Exams", weight: 40 }, { name: "Participation", weight: 20 }] });
    setAdding(false);
  };

  const deleteClass = (id) => {
    if (!confirm("Delete this class and all its assignments?")) return;
    update(prev => ({ ...prev, classes: prev.classes.filter(c => c.id !== id), assignments: prev.assignments.filter(a => a.classId !== id) }));
  };

  const updateComponent = (i, field, val) => {
    const comps = [...form.gradeComponents];
    comps[i] = { ...comps[i], [field]: field === "weight" ? Number(val) : val };
    setForm({ ...form, gradeComponents: comps });
  };

  const totalWeight = form.gradeComponents.reduce((s, c) => s + Number(c.weight), 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>My Classes</h2>
        <button onClick={() => setAdding(true)} style={{ background: COLORS.purple, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <i className="ti ti-plus" /> Add class
        </button>
      </div>

      {(adding || editId) && (
        <div style={{ background: "#fff", border: `2px solid ${COLORS.purple}`, borderRadius: 12, padding: 18, marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15 }}>{editId ? "Edit class" : "New class"}</h3>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Class name (e.g. MATH 101)" style={{ width: "100%", marginBottom: 10, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
          <input value={form.teacher} onChange={e => setForm({ ...form, teacher: e.target.value })} placeholder="Professor name (optional)" style={{ width: "100%", marginBottom: 14, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />

          <div style={{ marginBottom: 10, fontWeight: 600, fontSize: 13 }}>Grade components <span style={{ color: totalWeight === 100 ? COLORS.green : COLORS.coral, marginLeft: 8 }}>{totalWeight}% total</span></div>
          {form.gradeComponents.map((comp, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input value={comp.name} onChange={e => updateComponent(i, "name", e.target.value)} placeholder="Component name" style={{ flex: 1, padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13 }} />
              <input type="number" value={comp.weight} onChange={e => updateComponent(i, "weight", e.target.value)} placeholder="%" style={{ width: 60, padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13 }} />
              <button onClick={() => setForm({ ...form, gradeComponents: form.gradeComponents.filter((_, j) => j !== i) })} style={{ background: "none", border: "1px solid #fca5a5", borderRadius: 8, padding: "0 10px", cursor: "pointer", color: COLORS.coral }}>×</button>
            </div>
          ))}
          <button onClick={() => setForm({ ...form, gradeComponents: [...form.gradeComponents, { name: "", weight: 0 }] })} style={{ fontSize: 13, color: COLORS.purple, background: "none", border: `1px dashed ${COLORS.purple}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", marginBottom: 14 }}>+ Add component</button>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={addClass} style={{ background: COLORS.purple, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontWeight: 600 }}>Save class</button>
            <button onClick={() => { setAdding(false); setEditId(null); setForm({ name: "", teacher: "", gradeComponents: [{ name: "Assignments", weight: 40 }, { name: "Exams", weight: 40 }, { name: "Participation", weight: 20 }] }); }} style={{ background: "#f3f4f6", color: COLORS.gray, border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {s.classes.length === 0 && !adding ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: COLORS.gray }}>
          <i className="ti ti-school" style={{ fontSize: 48, opacity: 0.3 }} />
          <p>No classes yet. Add your first class to get started!</p>
        </div>
      ) : s.classes.map(cls => {
        const clsAssignments = s.assignments.filter(a => a.classId === cls.id);
        const graded = clsAssignments.filter(a => a.grade !== undefined && a.grade !== "");
        return (
          <div key={cls.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{cls.name}</div>
                {cls.teacher && <div style={{ fontSize: 13, color: COLORS.gray }}>Prof. {cls.teacher}</div>}
                <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {cls.gradeComponents.map(gc => (
                    <span key={gc.name} style={{ background: COLORS.purpleLight, color: COLORS.purple, fontSize: 11, padding: "3px 8px", borderRadius: 99, fontWeight: 500 }}>{gc.name} {gc.weight}%</span>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setForm({ name: cls.name, teacher: cls.teacher || "", gradeComponents: cls.gradeComponents }); setEditId(cls.id); setAdding(false); }} style={{ background: "none", border: "1px solid #d1d5db", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 13 }}>
                  <i className="ti ti-edit" />
                </button>
                <button onClick={() => deleteClass(cls.id)} style={{ background: "none", border: "1px solid #fca5a5", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: COLORS.coral, fontSize: 13 }}>
                  <i className="ti ti-trash" />
                </button>
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 13, color: COLORS.gray }}>{clsAssignments.length} assignments · {graded.length} graded</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── ASSIGNMENTS ─────────────────────────────────────────────
function Assignments({ s, update, addXP }) {
  const [form, setForm] = useState({ name: "", classId: "", dueDate: "", type: "Assignment", notes: "" });
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState("all");
  const [gradingId, setGradingId] = useState(null);
  const [gradeInput, setGradeInput] = useState({ score: "", total: "", component: "" });

  const addAssignment = () => {
    if (!form.name.trim() || !form.classId) return;
    update(prev => ({ ...prev, assignments: [...prev.assignments, { id: Date.now(), done: false, ...form }] }));
    setForm({ name: "", classId: "", dueDate: "", type: "Assignment", notes: "" });
    setAdding(false);
  };

  const toggleDone = (id) => {
    const a = s.assignments.find(x => x.id === id);
    if (!a.done) addXP(20, "Completed assignment");
    update(prev => ({ ...prev, assignments: prev.assignments.map(a => a.id === id ? { ...a, done: !a.done } : a) }));
  };

  const saveGrade = (id) => {
    const { score, total, component } = gradeInput;
    if (!score || !total) return;
    const grade = (Number(score) / Number(total) * 100).toFixed(1);
    update(prev => ({ ...prev, assignments: prev.assignments.map(a => a.id === id ? { ...a, grade: Number(grade), gradeScore: score, gradeTotal: total, gradeComponent: component, graded: true } : a) }));
    addXP(10, "Grade entered");
    setGradingId(null);
    setGradeInput({ score: "", total: "", component: "" });
  };

  const filtered = s.assignments.filter(a => {
    if (filter === "pending") return !a.done;
    if (filter === "done") return a.done;
    if (filter === "graded") return a.graded;
    return true;
  }).sort((a, b) => {
    if (!a.dueDate) return 1; if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Assignments</h2>
        <button onClick={() => setAdding(true)} style={{ background: COLORS.purple, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <i className="ti ti-plus" /> Add
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["all", "pending", "done", "graded"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 14px", borderRadius: 99, border: "1px solid", fontSize: 13, cursor: "pointer", fontWeight: filter === f ? 600 : 400, background: filter === f ? COLORS.purple : "#fff", color: filter === f ? "#fff" : COLORS.gray, borderColor: filter === f ? COLORS.purple : "#d1d5db" }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {adding && (
        <div style={{ background: "#fff", border: `2px solid ${COLORS.purple}`, borderRadius: 12, padding: 18, marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15 }}>New assignment</h3>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Assignment name" style={{ width: "100%", marginBottom: 10, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
          <select value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })} style={{ width: "100%", marginBottom: 10, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, background: "#fff" }}>
            <option value="">Select class…</option>
            {s.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ flex: 1, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, background: "#fff" }}>
              {["Assignment", "Quiz", "Exam", "Project", "Lab", "Essay", "Participation"].map(t => <option key={t}>{t}</option>)}
            </select>
            <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} style={{ flex: 1, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 }} />
          </div>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notes (optional)" rows={2} style={{ width: "100%", marginBottom: 14, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, resize: "vertical", boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={addAssignment} style={{ background: COLORS.purple, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontWeight: 600 }}>Save</button>
            <button onClick={() => setAdding(false)} style={{ background: "#f3f4f6", color: COLORS.gray, border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: COLORS.gray }}>
          <i className="ti ti-clipboard-list" style={{ fontSize: 48, opacity: 0.3 }} />
          <p>No assignments here yet.</p>
        </div>
      ) : filtered.map(a => {
        const cls = s.classes.find(c => c.id === a.classId);
        const due = a.dueDate ? new Date(a.dueDate) : null;
        const today = new Date();
        const daysLeft = due ? Math.ceil((due - today) / 86400000) : null;
        const isOverdue = daysLeft !== null && daysLeft < 0 && !a.done;
        return (
          <div key={a.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, marginBottom: 10, opacity: a.done ? 0.7 : 1 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <button onClick={() => toggleDone(a.id)} style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${a.done ? COLORS.green : "#d1d5db"}`, background: a.done ? COLORS.green : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                {a.done && <i className="ti ti-check" style={{ fontSize: 14, color: "#fff" }} />}
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 14, textDecoration: a.done ? "line-through" : "none" }}>{a.name}</span>
                    <span style={{ marginLeft: 8, background: COLORS.grayLight, color: COLORS.gray, fontSize: 11, padding: "2px 7px", borderRadius: 99 }}>{a.type}</span>
                  </div>
                  {a.graded && <span style={{ background: a.grade >= 90 ? COLORS.greenLight : a.grade >= 75 ? COLORS.amberLight : COLORS.coralLight, color: a.grade >= 90 ? COLORS.green : a.grade >= 75 ? COLORS.amber : COLORS.coral, fontWeight: 700, fontSize: 14, padding: "2px 10px", borderRadius: 99 }}>{a.grade}%</span>}
                </div>
                <div style={{ fontSize: 13, color: COLORS.gray, marginTop: 3 }}>
                  {cls?.name} {due && <span style={{ marginLeft: 6, color: isOverdue ? COLORS.coral : daysLeft <= 2 ? COLORS.amber : COLORS.gray }}>· {isOverdue ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? "Due today!" : `Due ${due.toLocaleDateString()}`}</span>}
                </div>
                {a.notes && <div style={{ fontSize: 12, color: COLORS.gray, marginTop: 4, background: "#f9fafb", padding: "4px 8px", borderRadius: 6 }}>{a.notes}</div>}
              </div>
            </div>

            {gradingId === a.id ? (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <input type="number" value={gradeInput.score} onChange={e => setGradeInput({ ...gradeInput, score: e.target.value })} placeholder="Score" style={{ width: 70, padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 }} />
                  <span style={{ color: COLORS.gray }}>/</span>
                  <input type="number" value={gradeInput.total} onChange={e => setGradeInput({ ...gradeInput, total: e.target.value })} placeholder="Total" style={{ width: 70, padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 }} />
                  {cls && <select value={gradeInput.component} onChange={e => setGradeInput({ ...gradeInput, component: e.target.value })} style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, background: "#fff" }}>
                    <option value="">Category…</option>
                    {cls.gradeComponents.map(gc => <option key={gc.name} value={gc.name}>{gc.name}</option>)}
                  </select>}
                  <button onClick={() => saveGrade(a.id)} style={{ background: COLORS.green, color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Save grade</button>
                  <button onClick={() => setGradingId(null)} style={{ background: "#f3f4f6", color: COLORS.gray, border: "none", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 13 }}>Cancel</button>
                </div>
              </div>
            ) : !a.graded && (
              <div style={{ marginTop: 10 }}>
                <button onClick={() => { setGradingId(a.id); setGradeInput({ score: "", total: "", component: "" }); }} style={{ fontSize: 12, color: COLORS.blue, background: "none", border: `1px solid ${COLORS.blue}`, borderRadius: 8, padding: "4px 10px", cursor: "pointer" }}>
                  + Enter grade
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── GRADES ──────────────────────────────────────────────────
function Grades({ s, update }) {
  const [selectedClass, setSelectedClass] = useState(s.classes[0]?.id || "");

  const calcGrade = (classId) => {
    const cls = s.classes.find(c => c.id === classId);
    if (!cls) return null;
    const assignments = s.assignments.filter(a => a.classId === classId && a.graded);
    const byComponent = {};
    cls.gradeComponents.forEach(gc => { byComponent[gc.name] = []; });
    assignments.forEach(a => { if (a.gradeComponent && byComponent[a.gradeComponent]) byComponent[a.gradeComponent].push(a.grade); });
    let weightedSum = 0, weightedTotal = 0;
    cls.gradeComponents.forEach(gc => {
      const grades = byComponent[gc.name] || [];
      if (grades.length > 0) {
        const avg = grades.reduce((s, g) => s + g, 0) / grades.length;
        weightedSum += avg * gc.weight;
        weightedTotal += gc.weight;
      }
    });
    return weightedTotal > 0 ? (weightedSum / weightedTotal).toFixed(1) : null;
  };

  const letterGrade = (pct) => {
    if (!pct) return "N/A";
    pct = Number(pct);
    if (pct >= 93) return "A";
    if (pct >= 90) return "A-";
    if (pct >= 87) return "B+";
    if (pct >= 83) return "B";
    if (pct >= 80) return "B-";
    if (pct >= 77) return "C+";
    if (pct >= 73) return "C";
    if (pct >= 70) return "C-";
    if (pct >= 67) return "D+";
    if (pct >= 60) return "D";
    return "F";
  };

  const gradeColor = (pct) => {
    if (!pct) return COLORS.gray;
    pct = Number(pct);
    if (pct >= 90) return COLORS.green;
    if (pct >= 80) return COLORS.blue;
    if (pct >= 70) return COLORS.amber;
    return COLORS.coral;
  };

  const cls = s.classes.find(c => c.id === selectedClass);
  const overall = calcGrade(selectedClass);

  // What-if calculator
  const [whatIf, setWhatIf] = useState({});

  return (
    <div>
      <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 700 }}>Grade Calculator</h2>

      {s.classes.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: COLORS.gray }}>
          <p>Add classes first to track grades.</p>
        </div>
      ) : (
        <>
          {/* Class selector */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {s.classes.map(c => {
              const g = calcGrade(c.id);
              return (
                <button key={c.id} onClick={() => setSelectedClass(c.id)} style={{ padding: "8px 16px", borderRadius: 10, border: `2px solid ${selectedClass === c.id ? COLORS.purple : "#e5e7eb"}`, background: selectedClass === c.id ? COLORS.purpleLight : "#fff", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: selectedClass === c.id ? COLORS.purple : COLORS.dark }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: g ? gradeColor(g) : COLORS.gray, fontWeight: g ? 700 : 400 }}>{g ? `${g}% · ${letterGrade(g)}` : "No grades yet"}</div>
                </button>
              );
            })}
          </div>

          {cls && (
            <>
              {/* Overall grade card */}
              <div style={{ background: overall ? `${gradeColor(overall)}15` : "#f9fafb", border: `2px solid ${overall ? gradeColor(overall) : "#e5e7eb"}`, borderRadius: 14, padding: 20, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, color: COLORS.gray, fontWeight: 500 }}>Current grade in {cls.name}</div>
                  <div style={{ fontSize: 13, color: COLORS.gray, marginTop: 4 }}>Based on graded assignments only</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 42, fontWeight: 800, color: gradeColor(overall), lineHeight: 1 }}>{overall ? `${overall}%` : "—"}</div>
                  <div style={{ fontSize: 20, color: gradeColor(overall), fontWeight: 700 }}>{letterGrade(overall)}</div>
                </div>
              </div>

              {/* By component */}
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 600 }}>Grade by component</h3>
                {cls.gradeComponents.map(gc => {
                  const grades = s.assignments.filter(a => a.classId === cls.id && a.graded && a.gradeComponent === gc.name).map(a => a.grade);
                  const avg = grades.length ? (grades.reduce((s, g) => s + g, 0) / grades.length).toFixed(1) : null;
                  return (
                    <div key={gc.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{gc.name}</div>
                        <div style={{ fontSize: 12, color: COLORS.gray }}>{gc.weight}% of grade · {grades.length} graded</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        {avg ? (
                          <span style={{ fontWeight: 700, fontSize: 16, color: gradeColor(avg) }}>{avg}%</span>
                        ) : <span style={{ color: COLORS.gray, fontSize: 13 }}>No grades</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* What-if calculator */}
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
                <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 600 }}>What-if calculator 🎯</h3>
                <p style={{ margin: "0 0 14px", fontSize: 13, color: COLORS.gray }}>Enter hypothetical scores to see your projected grade.</p>
                {cls.gradeComponents.map(gc => (
                  <div key={gc.name} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{gc.name} ({gc.weight}%)</span>
                    <input type="number" min="0" max="100" placeholder="%" value={whatIf[gc.name] || ""} onChange={e => setWhatIf({ ...whatIf, [gc.name]: e.target.value })} style={{ width: 70, padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 }} />
                  </div>
                ))}
                {Object.keys(whatIf).length > 0 && (() => {
                  let sum = 0, total = 0;
                  cls.gradeComponents.forEach(gc => {
                    if (whatIf[gc.name]) { sum += Number(whatIf[gc.name]) * gc.weight; total += gc.weight; }
                  });
                  const projected = total > 0 ? (sum / total).toFixed(1) : null;
                  return projected && (
                    <div style={{ marginTop: 14, padding: 12, background: `${gradeColor(projected)}15`, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>Projected grade</span>
                      <span style={{ fontSize: 20, fontWeight: 800, color: gradeColor(projected) }}>{projected}% · {letterGrade(projected)}</span>
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── STUDY ───────────────────────────────────────────────────
function Study({ s, update, addXP }) {
  const [mode, setMode] = useState("home"); // home, flashcards, quiz, input
  const [sourceText, setSourceText] = useState("");
  const [sourceClass, setSourceClass] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [cards, setCards] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [studyMethod, setStudyMethod] = useState("flashcards");

  const callClaude = async (prompt) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await res.json();
    return data.content?.map(b => b.text || "").join("") || "";
  };

  const generateFlashcards = async () => {
    if (!sourceText.trim()) { setError("Please enter some study material."); return; }
    setLoading(true); setError("");
    try {
      const raw = await callClaude(`From this study material, extract 8-12 key terms and their definitions. Return ONLY a JSON array like: [{"term": "...", "definition": "..."}, ...]. No markdown, no preamble.\n\nMaterial:\n${sourceText.slice(0, 3000)}`);
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setCards(parsed);
      setCardIdx(0); setFlipped(false);
      saveNote();
      setMode("flashcards");
      addXP(15, "Started flashcards");
    } catch (e) { setError("Couldn't generate flashcards. Try simplifying your input."); }
    setLoading(false);
  };

  const generateQuiz = async () => {
    if (!sourceText.trim()) { setError("Please enter some study material."); return; }
    setLoading(true); setError("");
    try {
      const raw = await callClaude(`Create a 6-question quiz from this material. Mix 4 multiple choice and 2 open-ended questions. Return ONLY JSON array: [{"type":"mc","question":"...","options":["A)...","B)...","C)...","D)..."],"answer":"A"},{"type":"open","question":"...","sampleAnswer":"..."},...]. No markdown.\n\nMaterial:\n${sourceText.slice(0, 3000)}`);
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setQuestions(parsed);
      setQuizAnswers({}); setQuizSubmitted(false);
      saveNote();
      setMode("quiz");
      addXP(15, "Started quiz");
    } catch (e) { setError("Couldn't generate quiz. Try simplifying your input."); }
    setLoading(false);
  };

  const saveNote = () => {
    if (!sourceText.trim()) return;
    update(prev => ({
      ...prev, notes: [...prev.notes.filter(n => n.name !== sourceName || n.classId !== sourceClass), { id: Date.now(), name: sourceName || "Untitled notes", classId: sourceClass, text: sourceText, date: new Date().toISOString() }]
    }));
  };

  const quizScore = () => {
    const mc = questions.filter(q => q.type === "mc");
    const correct = mc.filter(q => quizAnswers[q.question]?.startsWith(q.answer)).length;
    return { correct, total: mc.length };
  };

  const loadNote = (note) => {
    setSourceText(note.text);
    setSourceClass(note.classId);
    setSourceName(note.name);
  };

  if (mode === "flashcards" && cards.length > 0) {
    const card = cards[cardIdx];
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <button onClick={() => setMode("home")} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.purple, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            <i className="ti ti-arrow-left" /> Back
          </button>
          <span style={{ fontSize: 14, color: COLORS.gray }}>{cardIdx + 1} / {cards.length}</span>
        </div>

        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: COLORS.gray, marginBottom: 4 }}>Click card to flip</div>
          <div onClick={() => setFlipped(!flipped)} style={{
            background: flipped ? COLORS.purpleLight : "#fff",
            border: `2px solid ${flipped ? COLORS.purple : "#e5e7eb"}`,
            borderRadius: 16, padding: "40px 24px", cursor: "pointer", minHeight: 180,
            display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
            transition: "all 0.2s",
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: flipped ? COLORS.purple : COLORS.gray, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>{flipped ? "Definition" : "Term"}</div>
              <div style={{ fontSize: flipped ? 16 : 22, fontWeight: flipped ? 400 : 700, color: COLORS.dark, lineHeight: 1.5 }}>{flipped ? card.definition : card.term}</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={() => { if (cardIdx > 0) { setCardIdx(cardIdx - 1); setFlipped(false); } }} disabled={cardIdx === 0} style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #d1d5db", background: "#fff", cursor: cardIdx === 0 ? "not-allowed" : "pointer", opacity: cardIdx === 0 ? 0.4 : 1, fontSize: 14 }}>← Prev</button>
          <button onClick={() => setFlipped(!flipped)} style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontSize: 14 }}>Flip</button>
          {cardIdx < cards.length - 1 ? (
            <button onClick={() => { setCardIdx(cardIdx + 1); setFlipped(false); }} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: COLORS.purple, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>Next →</button>
          ) : (
            <button onClick={() => { addXP(30, "Finished flashcards"); setMode("home"); }} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: COLORS.green, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>Done! +30 XP</button>
          )}
        </div>

        {/* All cards mini list */}
        <div style={{ marginTop: 20, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {cards.map((_, i) => (
            <button key={i} onClick={() => { setCardIdx(i); setFlipped(false); }} style={{ width: 32, height: 32, borderRadius: 8, border: `2px solid ${i === cardIdx ? COLORS.purple : "#e5e7eb"}`, background: i === cardIdx ? COLORS.purpleLight : "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: i === cardIdx ? COLORS.purple : COLORS.gray }}>{i + 1}</button>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "quiz" && questions.length > 0) {
    const { correct, total } = quizSubmitted ? quizScore() : {};
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <button onClick={() => setMode("home")} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.purple, fontSize: 14, fontWeight: 600 }}>← Back</button>
          {!quizSubmitted && <span style={{ fontSize: 13, color: COLORS.gray }}>{Object.keys(quizAnswers).length}/{questions.length} answered</span>}
        </div>

        {quizSubmitted && (
          <div style={{ background: correct / total >= 0.8 ? COLORS.greenLight : COLORS.amberLight, border: `1px solid ${correct / total >= 0.8 ? COLORS.green : COLORS.amber}`, borderRadius: 12, padding: 16, marginBottom: 20, textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: correct / total >= 0.8 ? COLORS.green : COLORS.amber }}>{correct}/{total} correct</div>
            <div style={{ fontSize: 14, color: COLORS.gray }}>{Math.round(correct / total * 100)}% — {correct / total >= 0.8 ? "Great job! 🎉" : "Keep studying! 💪"}</div>
            <button onClick={() => { addXP(correct * 10, "Quiz completed"); setMode("home"); }} style={{ marginTop: 12, background: COLORS.purple, color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontWeight: 600 }}>+{correct * 10} XP — Done!</button>
          </div>
        )}

        {questions.map((q, qi) => (
          <div key={qi} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Q{qi + 1}. {q.question}</div>
            {q.type === "mc" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {q.options.map(opt => {
                  const selected = quizAnswers[q.question] === opt;
                  const isCorrect = quizSubmitted && opt.startsWith(q.answer);
                  const isWrong = quizSubmitted && selected && !isCorrect;
                  return (
                    <button key={opt} onClick={() => !quizSubmitted && setQuizAnswers({ ...quizAnswers, [q.question]: opt })} style={{
                      padding: "10px 14px", borderRadius: 10, textAlign: "left", fontSize: 14, cursor: quizSubmitted ? "default" : "pointer",
                      border: `2px solid ${isCorrect ? COLORS.green : isWrong ? COLORS.coral : selected ? COLORS.purple : "#e5e7eb"}`,
                      background: isCorrect ? COLORS.greenLight : isWrong ? COLORS.coralLight : selected ? COLORS.purpleLight : "#fff",
                      color: isCorrect ? COLORS.green : isWrong ? COLORS.coral : selected ? COLORS.purple : COLORS.dark,
                    }}>{opt}</button>
                  );
                })}
              </div>
            ) : (
              <div>
                <textarea value={quizAnswers[q.question] || ""} onChange={e => !quizSubmitted && setQuizAnswers({ ...quizAnswers, [q.question]: e.target.value })} placeholder="Type your answer here…" rows={3} style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, resize: "vertical", boxSizing: "border-box" }} readOnly={quizSubmitted} />
                {quizSubmitted && <div style={{ marginTop: 8, padding: 10, background: COLORS.blueLight, borderRadius: 8, fontSize: 13 }}><strong>Sample answer:</strong> {q.sampleAnswer}</div>}
              </div>
            )}
          </div>
        ))}

        {!quizSubmitted && (
          <button onClick={() => setQuizSubmitted(true)} style={{ width: "100%", background: COLORS.purple, color: "#fff", border: "none", borderRadius: 10, padding: "12px", cursor: "pointer", fontWeight: 700, fontSize: 15 }}>Submit quiz</button>
        )}
      </div>
    );
  }

  // Home / input mode
  return (
    <div>
      <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 700 }}>Study Tools</h2>

      {/* Saved notes */}
      {s.notes.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Saved notes</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {s.notes.map(n => {
              const cls = s.classes.find(c => c.id === n.classId);
              return (
                <button key={n.id} onClick={() => loadNote(n)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer", fontSize: 13, textAlign: "left" }}>
                  <div style={{ fontWeight: 500 }}>{n.name}</div>
                  {cls && <div style={{ fontSize: 11, color: COLORS.gray }}>{cls.name}</div>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Source input */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Study material</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <input value={sourceName} onChange={e => setSourceName(e.target.value)} placeholder="Notes name (e.g. Chapter 3)" style={{ flex: 1, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 }} />
          <select value={sourceClass} onChange={e => setSourceClass(e.target.value)} style={{ flex: 1, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, background: "#fff" }}>
            <option value="">Select class…</option>
            {s.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <textarea value={sourceText} onChange={e => setSourceText(e.target.value)} placeholder="Paste your notes, textbook excerpts, lecture slides content, or any study material here…" rows={7} style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }} />

        {/* PDF tip */}
        <div style={{ marginTop: 8, padding: "8px 12px", background: COLORS.amberLight, borderRadius: 8, fontSize: 13, color: "#92400e", display: "flex", gap: 8, alignItems: "flex-start" }}>
          <i className="ti ti-file-info" style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }} />
          <span>For PDFs: open the PDF, select all text (Ctrl+A), copy, and paste above. Works great for text-based PDFs!</span>
        </div>
      </div>

      {error && <div style={{ background: COLORS.coralLight, color: COLORS.coral, padding: "10px 14px", borderRadius: 8, marginBottom: 12, fontSize: 14 }}>{error}</div>}

      {/* Method selector */}
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Choose study method</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[
          { id: "flashcards", icon: "ti-cards", label: "Flashcards", desc: "Term ↔ Definition flip cards", action: generateFlashcards },
          { id: "quiz", icon: "ti-help-circle", label: "Mock test", desc: "MC + open-ended questions", action: generateQuiz },
        ].map(m => (
          <button key={m.id} onClick={m.action} disabled={loading} style={{
            padding: 16, borderRadius: 12, border: `2px solid ${COLORS.purple}`, background: COLORS.purpleLight,
            cursor: loading ? "not-allowed" : "pointer", textAlign: "left", opacity: loading ? 0.6 : 1,
          }}>
            <i className={`ti ${m.icon}`} style={{ fontSize: 24, color: COLORS.purple }} />
            <div style={{ fontWeight: 700, fontSize: 14, marginTop: 8, color: COLORS.dark }}>{m.label}</div>
            <div style={{ fontSize: 12, color: COLORS.gray, marginTop: 2 }}>{m.desc}</div>
            {loading && <div style={{ fontSize: 11, color: COLORS.purple, marginTop: 4 }}>Generating with AI…</div>}
          </button>
        ))}
      </div>

      <div style={{ padding: 12, background: "#f9fafb", borderRadius: 10, fontSize: 13, color: COLORS.gray, display: "flex", gap: 8 }}>
        <i className="ti ti-sparkles" style={{ color: COLORS.amber, fontSize: 16, flexShrink: 0 }} />
        Both study methods use AI to generate content from your notes. The more detailed your notes, the better the output!
      </div>
    </div>
  );
}

// ─── REWARDS ─────────────────────────────────────────────────
function Rewards({ s, update }) {
  const redeem = (reward) => {
    if (s.xp < reward.cost) { alert("Not enough XP yet! Keep studying to earn more."); return; }
    if (!confirm(`Redeem "${reward.name}" for ${reward.cost} XP?`)) return;
    update(prev => ({ ...prev, xp: prev.xp - reward.cost, redeemedRewards: [...prev.redeemedRewards, { ...reward, date: new Date().toISOString() }] }));
  };

  const level = Math.floor(s.xp / 100) + 1;

  return (
    <div>
      <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>Rewards Shop</h2>
      <p style={{ margin: "0 0 20px", color: COLORS.gray, fontSize: 14 }}>Spend your hard-earned XP on treats! You deserve it. 🎉</p>

      <div style={{ background: COLORS.amberLight, border: `1px solid ${COLORS.amber}`, borderRadius: 12, padding: 16, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#92400e" }}>Level {level} Scholar</div>
          <div style={{ fontSize: 13, color: COLORS.amber }}>🔥 {s.streak} day streak</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: COLORS.amber }}>{s.xp}</div>
          <div style={{ fontSize: 13, color: "#92400e" }}>XP available</div>
        </div>
      </div>

      {/* How to earn XP */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, marginBottom: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>How to earn XP</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[["Complete assignment", "+20 XP"], ["Enter a grade", "+10 XP"], ["Start a study session", "+15 XP"], ["Finish flashcard set", "+30 XP"], ["Finish a quiz", "+10–60 XP"], ["Daily streak", "+streak XP"]].map(([act, xp]) => (
            <div key={act} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: "#f9fafb", borderRadius: 8 }}>
              <span style={{ fontSize: 13 }}>{act}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.purple }}>{xp}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rewards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        {REWARDS.map(r => {
          const canAfford = s.xp >= r.cost;
          return (
            <div key={r.id} style={{ background: "#fff", border: `1px solid ${canAfford ? "#e5e7eb" : "#f3f4f6"}`, borderRadius: 12, padding: 16, textAlign: "center", opacity: canAfford ? 1 : 0.5 }}>
              <i className={`ti ${r.icon}`} style={{ fontSize: 32, color: canAfford ? COLORS.amber : COLORS.gray }} />
              <div style={{ fontWeight: 600, fontSize: 14, marginTop: 8, marginBottom: 4 }}>{r.name}</div>
              <div style={{ fontSize: 13, color: COLORS.amber, fontWeight: 700, marginBottom: 10 }}>{r.cost} XP</div>
              <button onClick={() => redeem(r)} disabled={!canAfford} style={{ width: "100%", background: canAfford ? COLORS.amber : "#d1d5db", color: canAfford ? "#fff" : COLORS.gray, border: "none", borderRadius: 8, padding: "8px", cursor: canAfford ? "pointer" : "not-allowed", fontWeight: 600, fontSize: 13 }}>
                {canAfford ? "Redeem" : `Need ${r.cost - s.xp} more XP`}
              </button>
            </div>
          );
        })}
      </div>

      {/* History */}
      {s.redeemedRewards.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Rewards history</div>
          {s.redeemedRewards.slice().reverse().slice(0, 10).map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13 }}>
              <span>{r.name}</span>
              <span style={{ color: COLORS.gray }}>{new Date(r.date).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
