import { useEffect, useMemo, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { FileText, Home, Menu, X } from "lucide-react";

const LINE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 24, 25, 26, 27, 28, 29, 30, 31];
const SHIFT_OPTIONS = ["A", "B", "C"];
const TABS = ["schedule", "troubleshoot", "materials"];
const SCREENS = ["lines", "entry", "report"];

const LINE_GROUPS = [
  { name: "Flex", lines: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  { name: "Custom", lines: [10, 11, 12, 13, 14, 15, 16, 17, 18] },
  { name: "Fence", lines: [24, 25, 26, 27, 28, 29, 30, 31] },
];

const styles = {
  page: { minHeight: "100svh", background: "#cbd5e1", color: "#0f172a", fontFamily: "Arial, sans-serif", boxSizing: "border-box" },
  appFrame: { width: "100%", maxWidth: 430, minHeight: "100svh", margin: "0 auto", position: "relative", overflow: "visible", background: "#f1f5f9" },
  homeHeader: { display: "flex", alignItems: "center", marginBottom: 10 },
  menuButton: { minHeight: 42, border: "1px solid #0f172a", background: "#0f172a", color: "#fff", borderRadius: 14, padding: "8px 10px", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 },
  menuScrim: { position: "absolute", top: 62, right: 0, bottom: 0, left: 0, zIndex: 30, border: 0, padding: 0, background: "rgba(15, 23, 42, .24)", cursor: "pointer" },
  sidePanel: { position: "absolute", top: 62, bottom: 0, left: 0, width: 210, zIndex: 35, background: "#0f172a", color: "#fff", padding: 10, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 8, borderRight: "1px solid #334155", boxShadow: "8px 0 22px rgba(15, 23, 42, .2)" },
  sideHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  sideTitle: { fontSize: 15, fontWeight: 900 },
  sideSection: { display: "grid", gap: 8, paddingBottom: 8, marginBottom: 2, borderBottom: "1px solid rgba(255,255,255,.16)" },
  sideCloseButton: { width: 36, height: 36, border: "1px solid rgba(255,255,255,.2)", borderRadius: 10, background: "rgba(255,255,255,.08)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  sideButton: { width: "100%", minHeight: 48, border: "1px solid rgba(255,255,255,.16)", background: "rgba(255,255,255,.08)", color: "#fff", borderRadius: 12, padding: "8px 10px", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 8 },
  sideButtonActive: { background: "#fff", color: "#0f172a", borderColor: "#fff" },
  reportScrim: { position: "absolute", top: 62, right: 0, bottom: 0, left: 0, zIndex: 40, border: 0, padding: 0, background: "rgba(15, 23, 42, .24)", cursor: "pointer" },
  secondaryPanel: { position: "absolute", top: 62, bottom: 0, left: 0, width: 210, zIndex: 45, background: "#fff", borderRight: "1px solid #cbd5e1", boxShadow: "8px 0 22px rgba(15, 23, 42, .2)", padding: 10, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 8 },
  secondaryHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  secondaryTitle: { fontSize: 15, fontWeight: 900 },
  closeButton: { width: 36, height: 36, border: "1px solid #cbd5e1", borderRadius: 10, background: "#fff", color: "#0f172a", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  container: { width: "100%", minWidth: 0, padding: 10, boxSizing: "border-box" },
  card: { background: "#fff", border: "1px solid #cbd5e1", borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,.08)" },
  cardBody: { padding: 12 },
  label: { display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 },
  input: { width: "100%", color: "#0f172a", boxSizing: "border-box", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 12, fontSize: 14, background: "#fff" },
  textarea: { width: "100%", color: "#0f172a", boxSizing: "border-box", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 12, fontSize: 14, minHeight: 74, resize: "vertical", background: "#fff" },
  button: { border: "1px solid #cbd5e1", background: "#fff", color: "#0f172a", borderRadius: 14, padding: "10px 12px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 42 },
  smallButton: { padding: "7px 9px", fontSize: 12, minHeight: 36 },
  buttonPrimary: { background: "#0f172a", color: "#fff", border: "1px solid #0f172a" },
  tabGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 10, position: "sticky", top: 0, zIndex: 20, background: "#fff", paddingBottom: 8, borderBottom: "1px solid #e2e8f0" },
  tabButton: { padding: "7px 3px", fontSize: 11, minHeight: 38 },
  lineGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 },
  lineColumn: { display: "flex", flexDirection: "column", gap: 6 },
  lineGroupTitle: { fontWeight: 800, textAlign: "left", fontSize: 14, marginBottom: 2 },
  lineButton: { minHeight: 48, fontSize: 18 },
  shiftGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 },
  twoColumnGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  batchRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, alignItems: "end" },
  noteGrid: { display: "grid", gridTemplateColumns: "1fr", gap: 10 },
  reportShell: { width: "100%", overflowX: "hidden" },
  reportHeader: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", alignItems: "center", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #cbd5e1" },
  reportBlock: { border: "1px solid #cbd5e1", borderRadius: 10, padding: 6, marginBottom: 8 },
  reportHeadRow: { fontSize: 10, fontWeight: 700, borderBottom: "1px solid #cbd5e1", paddingBottom: 3, marginBottom: 5, lineHeight: "12px" },
  reportRow: { fontSize: 10, lineHeight: "12px", alignItems: "start", wordBreak: "break-word" },
  muted: { fontSize: 13, color: "#64748b" },
};

const makeId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const todayString = () => new Date().toISOString().slice(0, 10);

const formatDisplayDate = (iso) => {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${Number(month)}-${Number(day)}-${year}`;
};

const sanitizeFilename = (value) => String(value || "report").replace(/[^a-z0-9-_]+/gi, "_");
const hasText = (value) => String(value || "").trim().length > 0;
const hasMaterialContent = (material) =>
  [
    material.batch,
    material.die,
    material.natural,
    material.naturalPercent,
    material.color,
    material.colorPercent,
    material.regrind,
    material.regrindPercent,
    material.additive,
    material.additivePercent,
  ].some(hasText) || material.coexes?.length > 0;
const withPercent = (value, percent) => {
  if (!hasText(percent)) return value;
  const cleanPercent = String(percent).trim();
  const displayPercent = cleanPercent.endsWith("%") ? cleanPercent : `${cleanPercent}%`;
  return hasText(value) ? `${value} (${displayPercent})` : displayPercent;
};
const tabLabel = (tab) => (tab === "troubleshoot" ? "Troubleshoot" : tab[0].toUpperCase() + tab.slice(1));

const createCoex = (number = "02") => ({
  id: makeId(),
  number,
  natural: "",
  naturalPercent: "",
  color: "",
  colorPercent: "",
  regrind: "",
  regrindPercent: "",
  additive: "",
  additivePercent: "",
});
const createMaterial = (batchId = "", batch = "", die = "") => ({
  id: makeId(),
  batchId,
  batch,
  die,
  natural: "",
  naturalPercent: "",
  color: "",
  colorPercent: "",
  regrind: "",
  regrindPercent: "",
  additive: "",
  additivePercent: "",
  coexes: [],
  confirmed: false,
});
const createBatch = () => ({ id: makeId(), batch: "", die: "", description: "", quantity: "", confirmed: false });
const createNote = (batchId = "", die = "") => ({ id: makeId(), batchId, note: "", action: "", result: "", die, confirmed: false });
const createLineData = () => ({ operator: "", batches: [createBatch()], materials: [], notes: [] });
const createAllLineData = () => Object.fromEntries(LINE_NUMBERS.map((line) => [String(line), createLineData()]));

const normalizeCoexes = (coexes) => {
  if (!Array.isArray(coexes)) return [];
  return coexes.map((coex, index) => ({
    id: coex?.id || makeId(),
    number: coex?.number || index + 1,
    natural: coex?.natural || "",
    naturalPercent: coex?.naturalPercent || "",
    color: coex?.color || "",
    colorPercent: coex?.colorPercent || "",
    regrind: coex?.regrind || "",
    regrindPercent: coex?.regrindPercent || "",
    additive: coex?.additive || "",
    additivePercent: coex?.additivePercent || "",
  }));
};

const normalizeMaterials = (materials) => {
  if (!Array.isArray(materials) || materials.length === 0) return [];

  return materials.map((material) => {
    if (material?.isCoex) {
      return {
        ...createMaterial(),
        id: material.id || makeId(),
        batchId: material.batchId || "",
        confirmed: Boolean(material.confirmed),
        coexes: [
          {
            id: material.id || makeId(),
            number: material.coexNumber || 1,
            natural: material.natural || "",
            naturalPercent: material.naturalPercent || "",
            color: material.color || "",
            colorPercent: material.colorPercent || "",
            regrind: material.regrind || "",
            regrindPercent: material.regrindPercent || "",
            additive: material.additive || "",
            additivePercent: material.additivePercent || "",
          },
        ],
      };
    }

    return {
      id: material?.id || makeId(),
      batchId: material?.batchId || "",
      batch: material?.batch || "",
      die: material?.die || "",
      natural: material?.natural || "",
      naturalPercent: material?.naturalPercent || "",
      color: material?.color || material?.material || "",
      colorPercent: material?.colorPercent || "",
      regrind: material?.regrind || "",
      regrindPercent: material?.regrindPercent || "",
      additive: material?.additive || "",
      additivePercent: material?.additivePercent || "",
      coexes: normalizeCoexes(material?.coexes),
      confirmed: Boolean(material?.confirmed),
    };
  });
};

const normalizeBatches = (lineData) => {
  if (!Array.isArray(lineData?.batches) || lineData.batches.length === 0) return [createBatch()];

  return lineData.batches.map((batch) => ({
    id: batch?.id || makeId(),
    batch: batch?.batch || "",
    die: batch?.die || "",
    description: batch?.description || "",
    quantity: batch?.quantity || "",
    confirmed: Boolean(batch?.confirmed),
  }));
};

const normalizeNotes = (notes) => {
  if (!Array.isArray(notes)) return [];

  return notes.map((note) => ({
    id: note?.id || makeId(),
    batchId: note?.batchId || "",
    note: note?.note || note?.issue || "",
    action: note?.action || "",
    result: note?.result || "",
    die: note?.die || "",
    confirmed: Boolean(note?.confirmed),
  }));
};

const normalizeSavedData = (savedData) => {
  const base = createAllLineData();

  Object.entries(savedData || {}).forEach(([line, lineData]) => {
    if (!base[line]) return;
    base[line] = {
      operator: lineData?.operator || "",
      batches: normalizeBatches(lineData),
      materials: normalizeMaterials(lineData?.materials),
      notes: normalizeNotes(lineData?.notes),
    };
  });

  return base;
};

const loadSavedData = (workDate) => {
  if (typeof localStorage === "undefined") return createAllLineData();

  const saved = localStorage.getItem(`work-notes-${workDate}`);
  if (!saved) return createAllLineData();

  try {
    return normalizeSavedData(JSON.parse(saved));
  } catch (error) {
    console.error("Could not load saved work notes:", error);
    return createAllLineData();
  }
};

const getFilledBatches = (lineData) => lineData.batches.filter((batch) => hasText(batch.batch) || hasText(batch.die) || hasText(batch.description) || hasText(batch.quantity));

const getMaterialRowsForReport = (line, lineData) => {
  const rows = [];
  const fallbackDie = lineData.batches?.[0]?.die || "";
  const batchesById = new Map((lineData.batches || []).map((batch) => [batch.id, batch]));

  lineData.materials.forEach((material, materialIndex) => {
    const hasMainMaterial = [material.batch, material.die, material.natural, material.color, material.regrind, material.additive].some(hasText) || material.coexes?.length > 0;
    if (!hasMainMaterial) return;
    const linkedBatch = batchesById.get(material.batchId);

    rows.push({
      label: materialIndex === 0 ? line : "",
      die: material.die || linkedBatch?.die || (materialIndex === 0 ? fallbackDie : ""),
      batch: material.batch || linkedBatch?.batch || "",
      natural: withPercent(material.natural, material.naturalPercent),
      color: withPercent(material.color, material.colorPercent),
      regrind: withPercent(material.regrind, material.regrindPercent),
      additive: withPercent(material.additive, material.additivePercent),
    });

    material.coexes.forEach((coex) => {
      rows.push({
        label: `Coex${String(coex.number).padStart(2, "0")}`,
        die: "",
        batch: "",
        natural: withPercent(coex.natural, coex.naturalPercent),
        color: withPercent(coex.color, coex.colorPercent),
        regrind: withPercent(coex.regrind, coex.regrindPercent),
        additive: withPercent(coex.additive, coex.additivePercent),
      });
    });
  });

  return rows;
};

function Button({ children, active = false, small = false, style, ...props }) {
  return (
    <button
      type="button"
      style={{ ...styles.button, ...(small ? styles.smallButton : {}), ...(active ? styles.buttonPrimary : {}), ...style }}
      {...props}
    >
      {children}
    </button>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ ...styles.card, ...style }}>
      <div style={styles.cardBody}>{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, textarea = false }) {
  const Input = textarea ? "textarea" : "input";
  return (
    <div>
      <label style={styles.label}>{label}</label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} style={textarea ? styles.textarea : styles.input} />
    </div>
  );
}

function DisplayValue({ label, value, wide = false }) {
  return (
    <div style={{ gridColumn: wide ? "1 / -1" : "auto" }}>
      <div style={{ ...styles.muted, fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{hasText(value) ? value : "-"}</div>
    </div>
  );
}

function DisplayGrid({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{children}</div>;
}

function MaterialMixFields({ material, updateMaterial }) {
  const compactGrid = { display: "grid", gridTemplateColumns: "minmax(0, 1fr) 54px minmax(0, 1fr) 54px", gap: 6, alignItems: "end" };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={compactGrid}>
        <Field label="Natural" value={material.natural} onChange={(value) => updateMaterial(material.id, "natural", value)} />
        <Field label="%" value={material.naturalPercent} onChange={(value) => updateMaterial(material.id, "naturalPercent", value)} />
        <Field label="Color" value={material.color} onChange={(value) => updateMaterial(material.id, "color", value)} />
        <Field label="%" value={material.colorPercent} onChange={(value) => updateMaterial(material.id, "colorPercent", value)} />
      </div>

      <div style={compactGrid}>
        <Field label="Regrind" value={material.regrind} onChange={(value) => updateMaterial(material.id, "regrind", value)} />
        <Field label="%" value={material.regrindPercent} onChange={(value) => updateMaterial(material.id, "regrindPercent", value)} />
        <Field label="Additive" value={material.additive} onChange={(value) => updateMaterial(material.id, "additive", value)} />
        <Field label="%" value={material.additivePercent} onChange={(value) => updateMaterial(material.id, "additivePercent", value)} />
      </div>
    </div>
  );
}

function MaterialMixDisplay({ material }) {
  return (
    <DisplayGrid>
      <DisplayValue label="Natural" value={withPercent(material.natural, material.naturalPercent)} />
      <DisplayValue label="Color" value={withPercent(material.color, material.colorPercent)} />
      <DisplayValue label="Regrind" value={withPercent(material.regrind, material.regrindPercent)} />
      <DisplayValue label="Additive" value={withPercent(material.additive, material.additivePercent)} />
    </DisplayGrid>
  );
}

function CoexMixFields({ coex, onChange }) {
  const compactGrid = { display: "grid", gridTemplateColumns: "minmax(0, 1fr) 54px minmax(0, 1fr) 54px", gap: 6, alignItems: "end" };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={compactGrid}>
        <Field label="Natural" value={coex.natural} onChange={(value) => onChange("natural", value)} />
        <Field label="%" value={coex.naturalPercent} onChange={(value) => onChange("naturalPercent", value)} />
        <Field label="Color" value={coex.color} onChange={(value) => onChange("color", value)} />
        <Field label="%" value={coex.colorPercent} onChange={(value) => onChange("colorPercent", value)} />
      </div>

      <div style={compactGrid}>
        <Field label="Regrind" value={coex.regrind} onChange={(value) => onChange("regrind", value)} />
        <Field label="%" value={coex.regrindPercent} onChange={(value) => onChange("regrindPercent", value)} />
        <Field label="Additive" value={coex.additive} onChange={(value) => onChange("additive", value)} />
        <Field label="%" value={coex.additivePercent} onChange={(value) => onChange("additivePercent", value)} />
      </div>
    </div>
  );
}

function HomeHeader({ menuOpen, onMenuClick }) {
  return (
    <div style={styles.homeHeader}>
      <button type="button" style={styles.menuButton} onClick={onMenuClick}>
        {menuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
        <span>Menu</span>
      </button>
    </div>
  );
}

function SidePanel({ screen, reportPanelOpen, date, shift, onDateChange, onShiftChange, onHomeClick, onReportsClick, onClose }) {
  const reportActive = screen === "report" || reportPanelOpen;

  return (
    <nav style={styles.sidePanel} aria-label="Main">
      <div style={styles.sideHeader}>
        <div style={styles.sideTitle}>Menu</div>
        <button type="button" aria-label="Close menu" style={styles.sideCloseButton} onClick={onClose}>
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <div style={styles.sideSection}>
        <div>
          <label style={styles.label}>Date</label>
          <input type="date" value={date} onChange={(event) => onDateChange(event.target.value)} style={styles.input} />
        </div>

        <div>
          <label style={styles.label}>Shift</label>
          <div style={styles.shiftGrid}>
            {SHIFT_OPTIONS.map((option) => (
              <Button key={option} active={shift === option} onClick={() => onShiftChange(option)}>
                {option}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <button type="button" style={{ ...styles.sideButton, ...(screen === "lines" ? styles.sideButtonActive : {}) }} onClick={onHomeClick}>
        <Home size={18} aria-hidden="true" />
        <span>Home</span>
      </button>

      <button type="button" style={{ ...styles.sideButton, ...(reportActive ? styles.sideButtonActive : {}) }} onClick={onReportsClick}>
        <FileText size={18} aria-hidden="true" />
        <span>Reports</span>
      </button>
    </nav>
  );
}

function ReportSidePanel({ reportTab, onSelectReport, onClose }) {
  return (
    <>
      <button type="button" aria-label="Close reports" style={styles.reportScrim} onClick={onClose} />
      <aside style={styles.secondaryPanel} aria-label="Reports">
        <div style={styles.secondaryHeader}>
          <div style={styles.secondaryTitle}>Reports</div>
          <button type="button" aria-label="Close reports" style={styles.closeButton} onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {TABS.map((tab) => (
          <Button key={tab} active={reportTab === tab} onClick={() => onSelectReport(tab)} style={{ justifyContent: "flex-start" }}>
            {tabLabel(tab)}
          </Button>
        ))}
      </aside>
    </>
  );
}

function ReportHeader({ title, date, shift }) {
  return (
    <div style={styles.reportHeader}>
      <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 13, fontWeight: 700, textAlign: "left" }}>{formatDisplayDate(date)}</div>
      <div style={{ fontSize: 13, fontWeight: 700, textAlign: "right" }}>Shift {shift}</div>
    </div>
  );
}

function PdfButton({ onClick, isExporting }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 10 }}>
      <Button small onClick={onClick} disabled={isExporting} style={isExporting ? { opacity: 0.7 } : {}}>
        {isExporting ? "PDF..." : "PDF"}
      </Button>
    </div>
  );
}

function LinesScreen({ data, selectedLine, onSelectLine }) {
  return (
    <Card>
      <div style={styles.lineGrid}>
        {LINE_GROUPS.map((group) => (
          <div key={group.name} style={styles.lineColumn}>
            <div style={styles.lineGroupTitle}>{group.name}</div>
            {group.lines.map((line) => {
              const lineKey = String(line);
              const firstDie = data[lineKey]?.batches?.[0]?.die;

              return (
                <Button
                  key={line}
                  active={selectedLine === lineKey}
                  style={{ ...styles.lineButton, justifyContent: "space-between" }}
                  onClick={() => onSelectLine(line)}
                >
                  <span>{line}</span>
                  <span style={{ fontSize: 14, opacity: 0.8 }}>{firstDie || ""}</span>
                </Button>
              );
            })}
          </div>
        ))}
      </div>
    </Card>
  );
}

function MaterialFields({ material, canAddCoex, newCoexNumber, setNewCoexNumber, removeMaterial, updateMaterial, addCoex, updateCoex, removeCoex }) {
  const isEditing = !material.confirmed;

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 10 }}>
      {isEditing ? (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <Button small onClick={() => removeMaterial(material.id)}>Delete</Button>
              <Button small active onClick={() => updateMaterial(material.id, "confirmed", true)}>Confirm</Button>
            </div>
          </div>

          <MaterialMixFields material={material} updateMaterial={updateMaterial} />

          <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "end", flexWrap: "wrap" }}>
            {canAddCoex && (
              <>
                <div style={{ width: 80 }}>
                  <Field label="Coex #" value={newCoexNumber} onChange={setNewCoexNumber} />
                </div>
                <Button small onClick={() => addCoex(material.id)}>+ Add Coex</Button>
              </>
            )}
          </div>

          {material.coexes.map((coex) => (
            <div key={coex.id} style={{ borderLeft: "3px solid #94a3b8", paddingLeft: 8, marginTop: 10 }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Coex{String(coex.number).padStart(2, "0")}</div>
              <CoexMixFields coex={coex} onChange={(field, value) => updateCoex(material.id, coex.id, field, value)} />
              <div style={{ marginTop: 8 }}>
                <Button small onClick={() => removeCoex(material.id, coex.id)}>Delete Coex</Button>
              </div>
            </div>
          ))}
        </>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 8, alignItems: "start" }}>
          <div>
            <MaterialMixDisplay material={material} />

            {material.coexes.map((coex) => (
              <div key={coex.id} style={{ borderLeft: "3px solid #94a3b8", paddingLeft: 8, marginTop: 10 }}>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Coex{String(coex.number).padStart(2, "0")}</div>
                <MaterialMixDisplay material={coex} />
              </div>
            ))}
          </div>
          <Button small onClick={() => updateMaterial(material.id, "confirmed", false)}>Edit</Button>
        </div>
      )}
    </div>
  );
}

function TroubleshootFields({ note, updateNote, deleteNote }) {
  const isEditing = !note.confirmed;

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 10 }}>
      {isEditing ? (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <Button small onClick={() => deleteNote(note.id)}>Delete</Button>
              <Button small active onClick={() => updateNote(note.id, "confirmed", true)}>Confirm</Button>
            </div>
          </div>

          <div style={styles.noteGrid}>
            <Field label="Issue" value={note.note} onChange={(value) => updateNote(note.id, "note", value)} textarea />
            <Field label="Troubleshooting Action" value={note.action} onChange={(value) => updateNote(note.id, "action", value)} textarea />
            <Field label="Result" value={note.result} onChange={(value) => updateNote(note.id, "result", value)} textarea />
          </div>
        </>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 8, alignItems: "start" }}>
          <DisplayGrid>
            <DisplayValue label="Issue" value={note.note} wide />
            <DisplayValue label="Troubleshooting Action" value={note.action} wide />
            <DisplayValue label="Result" value={note.result} wide />
          </DisplayGrid>
          <Button small onClick={() => updateNote(note.id, "confirmed", false)}>Edit</Button>
        </div>
      )}
    </div>
  );
}

function MaterialDisplay({ material }) {
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 10 }}>
      <MaterialMixDisplay material={material} />

      {material.coexes.map((coex) => (
        <div key={coex.id} style={{ borderLeft: "3px solid #94a3b8", paddingLeft: 8, marginTop: 10 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Coex{String(coex.number).padStart(2, "0")}</div>
          <MaterialMixDisplay material={coex} />
        </div>
      ))}
    </div>
  );
}

function TroubleshootDisplay({ note }) {
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 10 }}>
      <DisplayGrid>
        <DisplayValue label="Issue" value={note.note} wide />
        <DisplayValue label="Troubleshooting Action" value={note.action} wide />
        <DisplayValue label="Result" value={note.result} wide />
      </DisplayGrid>
    </div>
  );
}

function EntryScreen(props) {
  const {
    selectedLine,
    selected,
    goHome,
    updateOperator,
    addBatch,
    updateBatch,
    removeBatch,
    addMaterial,
    removeMaterial,
    updateMaterial,
    addCoex,
    updateCoex,
    removeCoex,
    newCoexNumber,
    setNewCoexNumber,
    addNote,
    updateNote,
    deleteNote,
  } = props;
  const hasAnyCoex = selected.materials.some((material) => material.coexes.length > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Card style={{ position: "sticky", top: 0, zIndex: 60 }}>
        <div style={{ display: "grid", gridTemplateColumns: "92px minmax(0, 1fr) 92px", gap: 8, alignItems: "center" }}>
          <Button small onClick={goHome} aria-label="Home" style={{ width: 42, justifySelf: "start" }}>
            <Home size={16} aria-hidden="true" />
          </Button>

          <div style={{ fontWeight: 800, fontSize: 18, textAlign: "center" }}>Line {selectedLine}</div>

          <Button small onClick={addBatch} style={{ justifySelf: "stretch" }}>Add Batch</Button>
        </div>
      </Card>

      <Card>
        <Field label="Operator" value={selected.operator} onChange={updateOperator} />
      </Card>

      {selected.batches.map((batch, index) => {
        const batchMaterials = selected.materials.filter((material) => material.batchId === batch.id || (!material.batchId && index === 0 && hasMaterialContent(material)));
        const batchNotes = selected.notes.filter((note) => note.batchId === batch.id || (!note.batchId && index === 0 && [note.note, note.action, note.result, note.die].some(hasText)));
        const isEditing = !batch.confirmed;

        return (
          <Card key={batch.id}>
            {isEditing && (
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <Button small onClick={() => removeBatch(batch.id)}>Delete</Button>
                  <Button small active onClick={() => updateBatch(batch.id, "confirmed", true)}>Confirm</Button>
                </div>
              </div>
            )}

            {isEditing ? (
              <>
                <div style={styles.batchRow}>
                  <Field label="Batch" value={batch.batch} onChange={(value) => updateBatch(batch.id, "batch", value)} />
                  <Field label="Die" value={batch.die} onChange={(value) => updateBatch(batch.id, "die", value)} />
                </div>

                <div style={{ ...styles.twoColumnGrid, marginTop: 10 }}>
                  <Field label="Description" value={batch.description} onChange={(value) => updateBatch(batch.id, "description", value)} />
                  <Field label="Quantity" value={batch.quantity} onChange={(value) => updateBatch(batch.id, "quantity", value)} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                  <Button small onClick={() => addMaterial(batch.id, batch)}>+ Add Materials</Button>
                  <Button small onClick={() => addNote(batch.id, batch)}>+ Add Troubleshoot</Button>
                </div>

                {batchMaterials.length > 0 && (
                  <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                    {batchMaterials.map((material) => (
                      <MaterialFields
                        key={material.id}
                        material={material}
                        canAddCoex={!hasAnyCoex}
                        newCoexNumber={newCoexNumber}
                        setNewCoexNumber={setNewCoexNumber}
                        removeMaterial={removeMaterial}
                        updateMaterial={updateMaterial}
                        addCoex={addCoex}
                        updateCoex={updateCoex}
                        removeCoex={removeCoex}
                      />
                    ))}
                  </div>
                )}

                {batchNotes.length > 0 && (
                  <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                    {batchNotes.map((note) => (
                      <TroubleshootFields key={note.id} note={note} updateNote={updateNote} deleteNote={deleteNote} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 8, alignItems: "start" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, alignItems: "start" }}>
                    <div style={{ display: "grid", gap: 10 }}>
                      <DisplayValue label="Batch" value={batch.batch} />
                      <DisplayValue label="Die" value={batch.die} />
                    </div>
                    <div style={{ display: "grid", gap: 10 }}>
                      <DisplayValue label="Description" value={batch.description} />
                      <DisplayValue label="Quantity" value={batch.quantity} />
                    </div>
                  </div>
                  <Button small onClick={() => updateBatch(batch.id, "confirmed", false)}>Edit</Button>
                </div>

                {batchMaterials.length > 0 && (
                  <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                    {batchMaterials.map((material) => (
                      <MaterialDisplay key={material.id} material={material} />
                    ))}
                  </div>
                )}

                {batchNotes.length > 0 && (
                  <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                    {batchNotes.map((note) => (
                      <TroubleshootDisplay key={note.id} note={note} />
                    ))}
                  </div>
                )}
              </>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function ScheduleReport({ data, date, shift, exportReportPdf, isExporting }) {
  const grid = { display: "grid", gridTemplateColumns: "28px 50px 52px 30px 1fr 60px", columnGap: 2, textAlign: "left" };

  return (
    <div>
      <PdfButton onClick={exportReportPdf} isExporting={isExporting} />
      <div id="print-area" style={styles.reportShell}>
        <ReportHeader title="Schedule" date={date} shift={shift} />
        <div style={styles.reportBlock}>
          <div style={{ ...grid, ...styles.reportHeadRow }}>
            <div>Line</div><div>Operator</div><div>Batch</div><div>Die</div><div>Description</div><div>Quantity</div>
          </div>
          {Object.entries(data).map(([line, lineData]) => {
            const filledBatches = getFilledBatches(lineData);
            const hasContent = hasText(lineData.operator) || filledBatches.length > 0;
            if (!hasContent) return null;

            const rowsToPrint = filledBatches.length ? filledBatches : [createBatch()];

            return (
              <div key={line} style={{ marginBottom: 4 }}>
                {rowsToPrint.map((batch, index) => (
                  <div key={batch.id} style={{ ...grid, ...styles.reportRow, marginBottom: index === rowsToPrint.length - 1 ? 0 : 2 }}>
                    <div>{index === 0 ? line : ""}</div>
                    <div>{index === 0 ? lineData.operator || "-" : ""}</div>
                    <div>{batch.batch || "-"}</div>
                    <div>{batch.die || ""}</div>
                    <div>{batch.description || ""}</div>
                    <div>{batch.quantity || ""}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TroubleshootReport({ data, date, shift, exportReportPdf, isExporting }) {
  const grid = { display: "grid", gridTemplateColumns: "28px 42px 1fr 1fr 1fr", columnGap: 2 };

  return (
    <div>
      <PdfButton onClick={exportReportPdf} isExporting={isExporting} />
      <div id="print-area" style={styles.reportShell}>
        <ReportHeader title="Troubleshoot" date={date} shift={shift} />
        <div style={styles.reportBlock}>
          <div style={{ ...grid, ...styles.reportHeadRow }}>
            <div>Line</div><div>Die</div><div>Issue</div><div>Troubleshooting Action</div><div>Result</div>
          </div>
          {Object.entries(data).map(([line, lineData]) => {
            if (!lineData.notes.length) return null;
            const firstDie = lineData.batches?.[0]?.die || "";
            const batchesById = new Map((lineData.batches || []).map((batch) => [batch.id, batch]));

            return lineData.notes.map((note, index) => {
              const linkedBatch = batchesById.get(note.batchId);

              return (
                <div key={note.id} style={{ ...grid, ...styles.reportRow, marginBottom: 4 }}>
                  <div>{index === 0 ? line : ""}</div>
                  <div>{linkedBatch?.die || note.die || (index === 0 ? firstDie : "")}</div>
                  <div>{note.note || ""}</div>
                  <div>{note.action || ""}</div>
                  <div>{note.result || ""}</div>
                </div>
              );
            });
          })}
        </div>
      </div>
    </div>
  );
}

function MaterialsReport({ data, date, shift, exportReportPdf, isExporting }) {
  const grid = { display: "grid", gridTemplateColumns: "28px 45px 45px 1fr 1fr 1fr 1fr" };

  return (
    <div>
      <PdfButton onClick={exportReportPdf} isExporting={isExporting} />
      <div id="print-area" style={styles.reportShell}>
        <ReportHeader title="Materials" date={date} shift={shift} />
        <div style={styles.reportBlock}>
          <div style={{ ...grid, ...styles.reportHeadRow }}>
            <div>Line</div><div>Die</div><div>Batch</div><div>Natural</div><div>Color</div><div>Regrind</div><div>Additive</div>
          </div>
          {Object.entries(data).map(([line, lineData]) => {
            const rows = getMaterialRowsForReport(line, lineData);
            if (!rows.length) return null;

            return rows.map((row, index) => (
              <div key={`${line}-${index}-${row.label}`} style={{ ...grid, ...styles.reportRow, marginBottom: 2 }}>
                <div style={{ textAlign: "left", whiteSpace: "nowrap" }}>{row.label}</div>
                <div style={{ textAlign: "left" }}>{row.die}</div>
                <div style={{ textAlign: "left" }}>{row.batch}</div>
                <div style={{ textAlign: "left" }}>{row.natural}</div>
                <div style={{ textAlign: "left" }}>{row.color}</div>
                <div style={{ textAlign: "left" }}>{row.regrind}</div>
                <div style={{ textAlign: "left" }}>{row.additive}</div>
              </div>
            ));
          })}
        </div>
      </div>
    </div>
  );
}

function ReportScreen({ reportTab, ...props }) {
  return (
    <Card>
      {reportTab === "schedule" && <ScheduleReport {...props} />}
      {reportTab === "troubleshoot" && <TroubleshootReport {...props} />}
      {reportTab === "materials" && <MaterialsReport {...props} />}
    </Card>
  );
}

export default function App() {
  const [isExporting, setIsExporting] = useState(false);
  const [shift, setShift] = useState("A");
  const [date, setDate] = useState(todayString());
  const [data, setData] = useState(() => loadSavedData(todayString()));
  const [selectedLine, setSelectedLine] = useState("1");
  const [screen, setScreen] = useState("lines");
  const [reportTab, setReportTab] = useState("schedule");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReportPanelOpen, setIsReportPanelOpen] = useState(false);
  const [newCoexNumber, setNewCoexNumber] = useState("02");
  const [touchStartX, setTouchStartX] = useState(null);

  useEffect(() => {
    localStorage.setItem(`work-notes-${date}`, JSON.stringify(data));
  }, [data, date]);

  const selected = useMemo(() => data[selectedLine] || createLineData(), [data, selectedLine]);

  const updateSelectedLine = (lineUpdater) => {
    setData((previousData) => ({
      ...previousData,
      [selectedLine]: lineUpdater(previousData[selectedLine] || createLineData()),
    }));
  };

  const updateOperator = (value) => updateSelectedLine((lineData) => ({ ...lineData, operator: value }));

  const addBatch = () => updateSelectedLine((lineData) => ({ ...lineData, batches: [...lineData.batches, createBatch()] }));

  const updateBatch = (id, field, value) => {
    updateSelectedLine((lineData) => ({
      ...lineData,
      batches: lineData.batches.map((batch) => (batch.id === id ? { ...batch, [field]: value } : batch)),
      materials: field === "batch" || field === "die" ? lineData.materials.map((material) => (material.batchId === id ? { ...material, [field]: value } : material)) : lineData.materials,
      notes: field === "die" ? lineData.notes.map((note) => (note.batchId === id ? { ...note, die: value } : note)) : lineData.notes,
    }));
  };

  const removeBatch = (id) => {
    updateSelectedLine((lineData) => {
      const batches = lineData.batches.filter((batch) => batch.id !== id);
      return {
        ...lineData,
        batches: batches.length ? batches : [createBatch()],
        materials: lineData.materials.filter((material) => material.batchId !== id),
        notes: lineData.notes.filter((note) => note.batchId !== id),
      };
    });
  };

  const addMaterial = (batchId, batch) => updateSelectedLine((lineData) => ({ ...lineData, materials: [...lineData.materials, createMaterial(batchId, batch.batch, batch.die)] }));

  const updateMaterial = (id, field, value) => {
    updateSelectedLine((lineData) => ({
      ...lineData,
      materials: lineData.materials.map((material) => (material.id === id ? { ...material, [field]: value } : material)),
    }));
  };

  const removeMaterial = (id) => {
    updateSelectedLine((lineData) => {
      const materials = lineData.materials.filter((material) => material.id !== id);
      return { ...lineData, materials };
    });
  };

  const addCoex = (materialId) => {
    const cleanNumber = String(newCoexNumber || "").trim().replace(/^Coex/i, "");
    if (!cleanNumber) return;

    updateSelectedLine((lineData) => ({
      ...lineData,
      materials: lineData.materials.map((material) => (material.id === materialId ? { ...material, coexes: [createCoex(cleanNumber)] } : material)),
    }));
  };

  const updateCoex = (materialId, coexId, field, value) => {
    updateSelectedLine((lineData) => ({
      ...lineData,
      materials: lineData.materials.map((material) => {
        if (material.id !== materialId) return material;
        return {
          ...material,
          coexes: material.coexes.map((coex) => (coex.id === coexId ? { ...coex, [field]: value } : coex)),
        };
      }),
    }));
  };

  const removeCoex = (materialId, coexId) => {
    updateSelectedLine((lineData) => ({
      ...lineData,
      materials: lineData.materials.map((material) => (material.id === materialId ? { ...material, coexes: material.coexes.filter((coex) => coex.id !== coexId) } : material)),
    }));
  };

  const addNote = (batchId, batch) => {
    updateSelectedLine((lineData) => ({
      ...lineData,
      notes: [...lineData.notes, createNote(batchId, batch.die)],
    }));
  };

  const updateNote = (id, field, value) => {
    updateSelectedLine((lineData) => ({
      ...lineData,
      notes: lineData.notes.map((note) => (note.id === id ? { ...note, [field]: value } : note)),
    }));
  };

  const deleteNote = (id) => updateSelectedLine((lineData) => ({ ...lineData, notes: lineData.notes.filter((note) => note.id !== id) }));

  const exportReportPdf = async () => {
    const reportElement = document.getElementById("print-area");
    if (!reportElement || isExporting) return;

    try {
      setIsExporting(true);
      const canvas = await html2canvas(reportElement, { scale: 3, backgroundColor: "#ffffff", useCORS: true });
      const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "letter" });
      const margin = 24;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const usableWidth = pageWidth - margin * 2;
      const imageHeight = (canvas.height * usableWidth) / canvas.width;

      pdf.addImage(canvas.toDataURL("image/png"), "PNG", margin, margin, usableWidth, imageHeight);
      pdf.save(`${reportTab}_${sanitizeFilename(date)}_shift_${shift}.pdf`);
    } catch (error) {
      console.error(error);
      window.alert("Could not create the PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const changeDate = (nextDate) => {
    setDate(nextDate);
    setData(loadSavedData(nextDate));
  };

  const selectLine = (line) => {
    setSelectedLine(String(line));
    setScreen("entry");
    setIsMenuOpen(false);
    setIsReportPanelOpen(false);
  };

  const moveLine = (direction) => {
    const currentIndex = LINE_NUMBERS.indexOf(Number(selectedLine));
    if (currentIndex < 0) return;

    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= LINE_NUMBERS.length) return;

    setSelectedLine(String(LINE_NUMBERS[nextIndex]));
  };

  const moveScreen = (direction) => {
    const currentIndex = SCREENS.indexOf(screen);
    const nextScreen = SCREENS[currentIndex + direction];
    if (nextScreen) {
      setScreen(nextScreen);
      setIsMenuOpen(false);
      setIsReportPanelOpen(false);
    }
  };

  const goHome = () => {
    setScreen("lines");
    setIsMenuOpen(false);
    setIsReportPanelOpen(false);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsReportPanelOpen(false);
  };

  const toggleMenu = () => {
    if (isMenuOpen) setIsReportPanelOpen(false);
    setIsMenuOpen((isOpen) => !isOpen);
  };

  const openReportPanel = () => {
    setIsReportPanelOpen(true);
  };

  const selectReport = (tab) => {
    setReportTab(tab);
    setScreen("report");
    setIsMenuOpen(false);
    setIsReportPanelOpen(false);
  };

  const handleTouchEnd = (event) => {
    if (touchStartX == null) return;
    if (isMenuOpen || isReportPanelOpen) {
      setTouchStartX(null);
      return;
    }

    const endX = event.changedTouches[0].clientX;
    const deltaX = touchStartX - endX;

    if (Math.abs(deltaX) > 60) {
      if (screen === "entry") {
        if (deltaX > 0) moveLine(1);
        if (deltaX < 0) moveLine(-1);
      } else {
        if (deltaX > 0) moveScreen(1);
        if (deltaX < 0) moveScreen(-1);
      }
    }

    setTouchStartX(null);
  };

  const sharedEntryProps = {
    selectedLine,
    selected,
    goHome,
    updateOperator,
    addBatch,
    updateBatch,
    removeBatch,
    addNote,
    updateNote,
    deleteNote,
    newCoexNumber,
    setNewCoexNumber,
    addMaterial,
    removeMaterial,
    updateMaterial,
    addCoex,
    updateCoex,
    removeCoex,
  };

  const sharedReportProps = {
    data,
    date,
    shift,
    exportReportPdf,
    isExporting,
  };

  return (
    <div style={styles.page} onTouchStart={(event) => setTouchStartX(event.touches[0].clientX)} onTouchEnd={handleTouchEnd}>
      <div style={styles.appFrame}>
        {isMenuOpen && <button type="button" aria-label="Close menu" style={styles.menuScrim} onClick={closeMenu} />}
        {isMenuOpen && (
          <SidePanel
            screen={screen}
            reportPanelOpen={isReportPanelOpen}
            date={date}
            shift={shift}
            onDateChange={changeDate}
            onShiftChange={setShift}
            onHomeClick={goHome}
            onReportsClick={openReportPanel}
            onClose={closeMenu}
          />
        )}
        {isReportPanelOpen && <ReportSidePanel reportTab={reportTab} onSelectReport={selectReport} onClose={() => setIsReportPanelOpen(false)} />}

        <div style={styles.container}>
          {screen === "lines" && (
            <>
              <HomeHeader
                menuOpen={isMenuOpen}
                onMenuClick={toggleMenu}
              />
              <LinesScreen data={data} selectedLine={selectedLine} onSelectLine={selectLine} />
            </>
          )}

          {screen === "entry" && <EntryScreen {...sharedEntryProps} />}

          {screen === "report" && <ReportScreen reportTab={reportTab} {...sharedReportProps} />}
        </div>
      </div>
    </div>
  );
}
