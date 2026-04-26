import React, { useEffect, useMemo, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const LINE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 24, 25, 26, 27, 28, 29, 30, 31];
const SHIFT_OPTIONS = ["A", "B", "C"];
const TABS = ["schedule", "materials"];
const SCREENS = ["lines", "entry", "report"];

const LINE_GROUPS = [
  { name: "Flex", lines: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  { name: "Custom", lines: [10, 11, 12, 13, 14, 15, 16, 17, 18] },
  { name: "Fence", lines: [24, 25, 26, 27, 28, 29, 30, 31] },
];

const styles = {
  page: { minHeight: "100vh", background: "#f1f5f9", color: "#0f172a", padding: 10, fontFamily: "Arial, sans-serif", boxSizing: "border-box" },
  container: { width: "100%", maxWidth: 430, margin: "0 auto" },
  card: { background: "#fff", border: "1px solid #cbd5e1", borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,.08)" },
  cardBody: { padding: 12 },
  label: { display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 },
  input: { width: "100%", color: "#0f172a", boxSizing: "border-box", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 12, fontSize: 14, background: "#fff" },
  textarea: { width: "100%", color: "#0f172a", boxSizing: "border-box", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 12, fontSize: 14, minHeight: 74, resize: "vertical", background: "#fff" },
  button: { border: "1px solid #cbd5e1", background: "#fff", color: "#0f172a", borderRadius: 14, padding: "10px 12px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 42 },
  smallButton: { padding: "7px 9px", fontSize: 12, minHeight: 36 },
  buttonPrimary: { background: "#0f172a", color: "#fff", border: "1px solid #0f172a" },
  tabGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 10, position: "sticky", top: 0, zIndex: 20, background: "#fff", paddingBottom: 8, borderBottom: "1px solid #e2e8f0" },
  tabButton: { padding: "7px 3px", fontSize: 11, minHeight: 38 },
  lineGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 },
  lineColumn: { display: "flex", flexDirection: "column", gap: 6 },
  lineGroupTitle: { fontWeight: 800, textAlign: "left", fontSize: 14, marginBottom: 2 },
  lineButton: { minHeight: 48, fontSize: 18 },
  shiftGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 },
  twoColumnGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  batchRow: { display: "grid", gridTemplateColumns: "30% 1fr", gap: 10, alignItems: "end" },
  noteGrid: { display: "grid", gridTemplateColumns: "1fr", gap: 10 },
  reportShell: { width: "100%", overflowX: "hidden" },
  reportHeader: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", alignItems: "center", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #cbd5e1" },
  reportBlock: { border: "1px solid #cbd5e1", borderRadius: 10, padding: 6, marginBottom: 8 },
  reportHeadRow: { fontSize: 10, fontWeight: 700, borderBottom: "1px solid #cbd5e1", paddingBottom: 3, marginBottom: 5, lineHeight: "12px" },
  reportRow: { fontSize: 10, lineHeight: "12px", alignItems: "start", wordBreak: "break-word" },
  muted: { fontSize: 13, color: "#64748b" },
  bottomNav: { position: "sticky", bottom: 0, background: "#f1f5f9", paddingTop: 8, marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 },
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
const tabLabel = (tab) => (tab === "troubleshoot" ? "Troubleshoot" : tab[0].toUpperCase() + tab.slice(1));

const createCoex = (number = "02") => ({ id: makeId(), number, natural: "", color: "", regrind: "", additive: "" });
const createMaterial = () => ({ id: makeId(), batch: "", die: "", natural: "", color: "", regrind: "", additive: "", coexes: [] });
const createBatch = () => ({
  id: makeId(),
  batch: "",
  die: "",
  description: "",
  quantity: "",
  materials: [],
  notes: []
});
const createLineData = () => ({ operator: "", batches: [createBatch()], materials: [createMaterial()], notes: [] });
const createAllLineData = () => Object.fromEntries(LINE_NUMBERS.map((line) => [String(line), createLineData()]));

const normalizeCoexes = (coexes) => {
  if (!Array.isArray(coexes)) return [];
  return coexes.map((coex, index) => ({
    id: coex?.id || makeId(),
    number: coex?.number || index + 1,
    natural: coex?.natural || "",
    color: coex?.color || "",
    regrind: coex?.regrind || "",
    additive: coex?.additive || "",
  }));
};

const normalizeMaterials = (materials) => {
  if (!Array.isArray(materials) || materials.length === 0) return [createMaterial()];

  return materials.map((material) => {
    if (material?.isCoex) {
      return {
        ...createMaterial(),
        id: material.id || makeId(),
        coexes: [
          {
            id: material.id || makeId(),
            number: material.coexNumber || 1,
            natural: material.natural || "",
            color: material.color || "",
            regrind: material.regrind || "",
            additive: material.additive || "",
          },
        ],
      };
    }

    return {
      id: material?.id || makeId(),
      batch: material?.batch || "",
      die: material?.die || "",
      natural: material?.natural || "",
      color: material?.color || material?.material || "",
      regrind: material?.regrind || "",
      additive: material?.additive || "",
      coexes: normalizeCoexes(material?.coexes),
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
    materials: Array.isArray(batch?.materials) ? batch.materials : [],
    notes: Array.isArray(batch?.notes) ? batch.notes : [],
  }));
};

const normalizeNotes = (notes) => {
  if (!Array.isArray(notes)) return [];

  return notes.map((note) => ({
    id: note?.id || makeId(),
    note: note?.note || note?.issue || "",
    action: note?.action || "",
    die: note?.die || "",
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

const getFilledBatches = (lineData) => lineData.batches.filter((batch) => hasText(batch.batch) || hasText(batch.die) || hasText(batch.description) || hasText(batch.quantity));

const getMaterialRowsForReport = (line, lineData) => {
  const rows = [];
  const fallbackDie = lineData.batches?.[0]?.die || "";

  lineData.materials.forEach((material, materialIndex) => {
    const hasMainMaterial = [material.batch, material.die, material.natural, material.color, material.regrind, material.additive].some(hasText) || material.coexes?.length > 0;
    if (!hasMainMaterial) return;

    rows.push({
      label: materialIndex === 0 ? line : "",
      die: material.die || (materialIndex === 0 ? fallbackDie : ""),
      batch: material.batch,
      natural: material.natural,
      color: material.color,
      regrind: material.regrind,
      additive: material.additive,
    });

    material.coexes.forEach((coex) => {
      rows.push({
        label: `Coex${String(coex.number).padStart(2, "0")}`,
        die: "",
        batch: "",
        natural: coex.natural,
        color: coex.color,
        regrind: coex.regrind,
        additive: coex.additive,
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

function TabButtons({ activeTab, onChange }) {
  return (
    <div style={styles.tabGrid}>
      {TABS.map((tab) => (
        <Button key={tab} active={activeTab === tab} small style={styles.tabButton} onClick={() => onChange(tab)}>
          {tabLabel(tab)}
        </Button>
      ))}
    </div>
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

function LinesScreen({ date, shift, data, selectedLine, onDateChange, onShiftChange, onSelectLine }) {
  return (
    <Card>
      <div style={{ marginTop: 14 }}>
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
      </div>
    </Card>
  );
}
function ScheduleEntry({
  selected,
  updateOperator,
  updateBatch,
  handleDeleteBatch,
  confirmDeleteBatchId,
  addBatchTroubleshoot,
  addBatchMaterial,
  updateBatchMaterial,
  updateTroubleshootNote,
  updateMaterial,
  removeBatchMaterial,
  deleteNote
}) {
  const [batchesOpen, setBatchesOpen] = useState(true);
  const [batchMenuOpenId, setBatchMenuOpenId] = useState(null);

  return (
    <div>
      <Field label="Operator" value={selected.operator} onChange={updateOperator} />

      <div style={{ marginTop: 12 }}>
        <div style={{ marginBottom: 8 }}>
          <button
            type="button"
            onClick={() => setBatchesOpen(!batchesOpen)}
            style={{
              ...styles.button,
              ...styles.smallButton,
              justifyContent: "space-between",
              width: "100%"
            }}
          >
            <span>Batches</span>
            <span>{batchesOpen ? "▲" : "▼"}</span>
          </button>
        </div>

        {batchesOpen && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {selected.batches.map((batch) => (
              <Card key={batch.id} style={{ boxShadow: "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Button
                    small
                    onClick={() => handleDeleteBatch(batch.id)}
                    style={{
                      background: confirmDeleteBatchId === batch.id ? "#dc2626" : "#fff",
                      color: confirmDeleteBatchId === batch.id ? "#fff" : "#0f172a",
                      border: confirmDeleteBatchId === batch.id ? "1px solid #dc2626" : "1px solid #cbd5e1"
                    }}
                  >
                    {confirmDeleteBatchId === batch.id ? "Confirm" : "Delete"}
                  </Button>

                  <div style={{ position: "relative" }}>
                    <Button
                      small
                      onClick={() => setBatchMenuOpenId(batchMenuOpenId === batch.id ? null : batch.id)}
                      style={{ borderRadius: 999, width: 32, height: 32, padding: 0 }}
                    >
                      +
                    </Button>

                    {batchMenuOpenId === batch.id && (
                      <div
                        style={{
                          position: "absolute",
                          top: 36,
                          right: 0,
                          background: "#fff",
                          border: "1px solid #cbd5e1",
                          borderRadius: 10,
                          boxShadow: "0 4px 10px rgba(0,0,0,.1)",
                          zIndex: 10,
                          minWidth: 140
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            addBatchTroubleshoot(batch.id);
                            setBatchMenuOpenId(null);
                          }}
                          style={{
                            ...styles.button,
                            ...styles.smallButton,
                            width: "100%",
                            justifyContent: "flex-start",
                            background: "#fff"
                          }}
                        >
                          Troubleshoot
                        </button>
                        <button
  type="button"
  onClick={() => {
    addBatchMaterial(batch.id);
    setBatchMenuOpenId(null);
  }}
  style={{
    ...styles.button,
    ...styles.smallButton,
    width: "100%",
    justifyContent: "flex-start",
    background: "#fff"
  }}
>
  Materials
</button>
                      </div>
                    )}
                  </div>
                </div>

                <div style={styles.batchRow}>
                  <Field label="Batch" value={batch.batch} onChange={(value) => updateBatch(batch.id, "batch", value)} />
                  <Field label="Die" value={batch.die} onChange={(value) => updateBatch(batch.id, "die", value)} />
                </div>

                <div style={{ marginTop: 10 }}>
                  <Field label="Description" value={batch.description} onChange={(value) => updateBatch(batch.id, "description", value)} />
                </div>

                <div style={{ marginTop: 10 }}>
                  <Field label="Quantity" value={batch.quantity} onChange={(value) => updateBatch(batch.id, "quantity", value)} />
                </div>
{(batch.materials || []).map((material) => (
  <div key={material.id} style={{ marginTop: 10, padding: 10, border: "1px solid #cbd5e1", borderRadius: 12, background: "#f8fafc" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
      <Button small onClick={() => removeBatchMaterial(material.id)}>Delete</Button>
      <div style={{ fontWeight: 700, fontSize: 13 }}>Materials</div>
    </div>


    <div style={{ marginTop: 8 }}>
      <Field label="Natural" value={material.natural || ""} onChange={(value) => updateBatchMaterial(material.id, "natural", value)} />
    </div>

    <div style={{ ...styles.twoColumnGrid, marginTop: 8 }}>
      <Field label="Color" value={material.color || ""} onChange={(value) => updateBatchMaterial(material.id, "color", value)} />
      <Field label="Regrind" value={material.regrind || ""} onChange={(value) => updateBatchMaterial(material.id, "regrind", value)} />
    </div>

    <div style={{ marginTop: 8 }}>
      <Field label="Additive" value={material.additive || ""} onChange={(value) => updateBatchMaterial(material.id, "additive", value)} />
    </div>
  </div>
))}
{(batch.notes || []).map((note) => (
                    <div key={note.id} style={{ marginTop: 10, padding: 10, border: "1px solid #cbd5e1", borderRadius: 12, background: "#f8fafc" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
  <Button small onClick={() => deleteNote(note.id)}>Delete</Button>
  <div style={{ fontWeight: 700, fontSize: 13 }}>Troubleshoot</div>
</div>

                      <Field label="Issue" value={note.note} onChange={(value) => updateTroubleshootNote(note.id, "note", value)} textarea />

                      <div style={{ marginTop: 8 }}>
                        <Field label="Troubleshooting Action" value={note.action} onChange={(value) => updateTroubleshootNote(note.id, "action", value)} textarea />
                      </div>

                      <div style={{ marginTop: 8 }}>
                        <Field label="Result" value={note.result || ""} onChange={(value) => updateTroubleshootNote(note.id, "result", value)} textarea />
                      </div>
                    </div>
                  ))}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
function TroubleshootEntry({ selected, draftNote, setDraftNote, draftAction, setDraftAction, draftDie, setDraftDie, addNote, deleteNote }) {
  return (
    <div>
      <div style={styles.noteGrid}>
        <Field label="Die" value={draftDie} onChange={setDraftDie} />
        <Field label="Notes" value={draftNote} onChange={setDraftNote} textarea />
        <Field label="Troubleshooting Steps Taken" value={draftAction} onChange={setDraftAction} textarea />
      </div>

      <div style={{ marginTop: 10 }}>
        <Button active onClick={addNote}>+ Add Note / Troubleshooting</Button>
      </div>

      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
        {selected.notes.length > 0 ? (
          selected.notes.map((note, index) => (
            <Card key={note.id} style={{ boxShadow: "none" }}>
              <div style={{ ...styles.muted, fontWeight: 700 }}>Pair {index + 1}</div>
              <div style={{ fontSize: 14, marginTop: 6 }}><strong>Die:</strong> {note.die}</div>
              <div style={{ fontSize: 14, marginTop: 6 }}><strong>Notes:</strong> {note.note}</div>
              <div style={{ fontSize: 14, marginTop: 4 }}><strong>Troubleshooting Steps Taken:</strong> {note.action}</div>
              <div style={{ marginTop: 8 }}>
                <Button small onClick={() => deleteNote(note.id)}>Delete</Button>
              </div>
            </Card>
          ))
        ) : (
          <div style={styles.muted}>No troubleshooting entries yet.</div>
        )}
      </div>
    </div>
  );
}

function MaterialsEntry({ selected, newCoexNumber, setNewCoexNumber, addMaterial, removeMaterial, updateMaterial, addCoex, updateCoex, removeCoex }) {
  const hasAnyCoex = selected.materials.some((material) => material.coexes.length > 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 8 }}>
        <Button small onClick={addMaterial}>+ Add</Button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {selected.materials.filter((material) => !material.batchId).map((material, index) => (
          <Card key={material.id} style={{ boxShadow: "none" }}>
            <div style={{ ...styles.muted, fontWeight: 700, marginBottom: 6 }}>Material Row {index + 1}</div>

            <div style={styles.twoColumnGrid}>
              <Field label="Batch" value={material.batch} onChange={(value) => updateMaterial(material.id, "batch", value)} />
              <Field label="Die" value={material.die} onChange={(value) => updateMaterial(material.id, "die", value)} />
            </div>

            <div style={{ marginTop: 8 }}>
              <Field label="Natural" value={material.natural} onChange={(value) => updateMaterial(material.id, "natural", value)} />
            </div>

            <div style={{ ...styles.twoColumnGrid, marginTop: 8 }}>
              <Field label="Color" value={material.color} onChange={(value) => updateBatchMaterial(material.id, "color", value)} />
              <Field label="Regrind" value={material.regrind} onChange={(value) => updateBatchMaterial(material.id, "regrind", value)} />
            </div>

            <div style={{ marginTop: 8 }}>
              <Field label="Additive" value={material.additive} onChange={(value) => updateBatchMaterial(material.id, "additive", value)} />
            </div>

            <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "end" }}>
              {!hasAnyCoex && (
                <>
                  <div style={{ width: 80 }}>
                    <Field label="Coex #" value={newCoexNumber} onChange={setNewCoexNumber} />
                  </div>
                  <Button small onClick={() => addCoex(material.id)}>+ Add Coex</Button>
                </>
              )}
              <Button small onClick={() => removeMaterial(material.id)}>Delete</Button>
            </div>

            {material.coexes.map((coex) => (
              <div key={coex.id} style={{ borderLeft: "3px solid #94a3b8", paddingLeft: 8, marginTop: 10 }}>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Coex{String(coex.number).padStart(2, "0")}</div>
                <div style={{ marginTop: 8 }}>
                  <Field label="Natural" value={coex.natural} onChange={(value) => updateCoex(material.id, coex.id, "natural", value)} />
                </div>
                <div style={{ ...styles.twoColumnGrid, marginTop: 8 }}>
                  <Field label="Color" value={coex.color} onChange={(value) => updateCoex(material.id, coex.id, "color", value)} />
                  <Field label="Regrind" value={coex.regrind} onChange={(value) => updateCoex(material.id, coex.id, "regrind", value)} />
                </div>
                <div style={{ marginTop: 8 }}>
                  <Field label="Additive" value={coex.additive} onChange={(value) => updateCoex(material.id, coex.id, "additive", value)} />
                </div>
                <div style={{ marginTop: 8 }}>
                  <Button small onClick={() => removeCoex(material.id, coex.id)}>Delete Coex</Button>
                </div>
              </div>
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}

function EntryScreen(props) {
  const { selectedLine, selected, entryTab, setEntryTab, moveLine, addBatch } = props;
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const currentIndex = LINE_NUMBERS.indexOf(Number(selectedLine));
  const prevLine = LINE_NUMBERS[currentIndex - 1];
  const nextLine = LINE_NUMBERS[currentIndex + 1];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Card>
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 30,
            background: "#fff",
            paddingBottom: 8,
            display: "grid",
            gridTemplateColumns: "1fr 42px",
            gap: 6,
            alignItems: "start"
          }}
        >

</div>
        <div style={{ position: "relative", marginBottom: 10, minHeight: 32 }}>
  
  {/* Line title - LEFT */}
  <div style={{ position: "absolute", left: 0, top: 0, fontWeight: 800, fontSize: 18 }}>
    Line {selectedLine}
  </div>

  {/* + button - RIGHT */}
  <Button
    small
    onClick={() => setAddMenuOpen(!addMenuOpen)}
    style={{
      position: "absolute",
      right: 0,
      top: 0,
      borderRadius: 999,
      width: 32,
      height: 32,
      padding: 0
    }}
  >
    +
  </Button>
  {addMenuOpen && (
  <div
    style={{
      position: "absolute",
      top: 36,
      right: 0,
      background: "#fff",
      border: "1px solid #cbd5e1",
      borderRadius: 12,
      boxShadow: "0 4px 12px rgba(0,0,0,.15)",
      padding: 6,
      minWidth: 150,
      zIndex: 100
    }}
  >
    <button
      type="button"
      onClick={() => {
        addBatch();
        setAddMenuOpen(false);
      }}
      style={{
        ...styles.button,
        ...styles.smallButton,
        width: "100%",
        justifyContent: "flex-start",
        background: "#fff",
        color: "#0f172a"
      }}
    >
      Add Batch
    </button>
  </div>
)}

</div>

        {entryTab === "schedule" && <ScheduleEntry selected={selected} {...props} />}
        {entryTab === "troubleshoot" && <TroubleshootEntry selected={selected} {...props} />}
        {entryTab === "materials" && <MaterialsEntry selected={selected} {...props} />}
      </Card>
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
  const topGrid = {
  display: "grid",
  gridTemplateColumns: "auto auto auto",
  columnGap: 12,
  justifyContent: "start"
};

  const detailGrid = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    columnGap: 6
  };

  return (
    <div>
      <PdfButton onClick={exportReportPdf} isExporting={isExporting} />

      <div id="print-area" style={styles.reportShell}>
        <ReportHeader title="Troubleshoot" date={date} shift={shift} />

        <div style={styles.reportBlock}>
          <div style={{ ...detailGrid, ...styles.reportHeadRow }}>
            <div>Issue</div>
            <div>Troubleshooting Action</div>
            <div>Result</div>
          </div>

          {Object.entries(data).map(([line, lineData]) => {
            if (!lineData.notes.length) return null;

            const firstDie = lineData.batches?.[0]?.die || "";
            const firstBatch = lineData.batches?.[0]?.batch || "";

            return lineData.notes.map((note, index) => (
  <div key={note.id} style={{ marginBottom: 6 }}>
    {index === 0 && (
      <div style={{ ...topGrid, ...styles.reportRow, fontWeight: 700 }}>
        <div>Line {line}</div>
        <div>Die {note.die || firstDie}</div>
        <div>Batch {firstBatch}</div>
      </div>
    )}

    <div style={{ ...detailGrid, ...styles.reportRow, marginTop: index === 0 ? 2 : 0 }}>
      <div>{note.note || ""}</div>
      <div>{note.action || ""}</div>
<div>{note.result || ""}</div>
    </div>
  </div>
));
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

function ReportScreen({ reportTab, setReportTab, ...props }) {
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
  const [data, setData] = useState(createAllLineData());
  const [selectedLine, setSelectedLine] = useState("1");
  const [screen, setScreen] = useState("lines");
  const [entryTab, setEntryTab] = useState("schedule");
  const [reportTab, setReportTab] = useState("schedule");
  const [draftNote, setDraftNote] = useState("");
  const [draftAction, setDraftAction] = useState("");
  const [draftDie, setDraftDie] = useState("");
  const [newCoexNumber, setNewCoexNumber] = useState("02");
  const [touchStartX, setTouchStartX] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuMode, setMenuMode] = useState("main");
  const [confirmDeleteBatchId, setConfirmDeleteBatchId] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(`work-notes-${date}`);
    if (!saved) {
      setData(createAllLineData());
      return;
    }

    try {
      setData(normalizeSavedData(JSON.parse(saved)));
    } catch (error) {
      console.error("Could not load saved work notes:", error);
      setData(createAllLineData());
    }
  }, [date]);

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
    }));
  };

  const removeBatch = (id) => {
  updateSelectedLine((lineData) => {
    const batches = lineData.batches.filter((batch) => batch.id !== id);
    return { ...lineData, batches: batches.length ? batches : [createBatch()] };
  });
};

const handleDeleteBatch = (id) => {
  if (confirmDeleteBatchId !== id) {
    setConfirmDeleteBatchId(id);
    return;
  }

  removeBatch(id);
  setConfirmDeleteBatchId(null);
};

const addBatchTroubleshoot = (batchId) => {
  updateSelectedLine((lineData) => {
    return {
      ...lineData,
      batches: lineData.batches.map((batch) => {
        if (batch.id !== batchId) return batch;

        return {
          ...batch,
          notes: [
            ...batch.notes,
            {
              id: makeId(),
              note: "",
              action: "",
              result: "",
              die: batch.die || ""
            }
          ]
        };
      })
    };
  });
};
const addBatchMaterial = (batchId) => {
  updateSelectedLine((lineData) => {
    return {
      ...lineData,
      batches: lineData.batches.map((batch) => {
        if (batch.id !== batchId) return batch;

        return {
          ...batch,
          materials: [
            ...batch.materials,
            {
              id: makeId(),
              batch: batch.batch || "",
              die: batch.die || "",
              natural: "",
              color: "",
              regrind: "",
              additive: ""
            }
          ]
        };
      })
    };
  });
};
const updateTroubleshootNote = (id, field, value) => {
  updateSelectedLine((lineData) => ({
    ...lineData,
    notes: lineData.notes.map((note) =>
      note.id === id ? { ...note, [field]: value } : note
    )
  }));
};

  const addMaterial = () => updateSelectedLine((lineData) => ({ ...lineData, materials: [...lineData.materials, createMaterial()] }));

  const updateMaterial = (id, field, value) => {
    updateSelectedLine((lineData) => ({
      ...lineData,
      materials: lineData.materials.map((material) => (material.id === id ? { ...material, [field]: value } : material)),
    }));
  };

  const removeMaterial = (id) => {
    updateSelectedLine((lineData) => {
      const materials = lineData.materials.filter((material) => material.id !== id);
      return { ...lineData, materials: materials.length ? materials : [createMaterial()] };
    });
  };
  const updateBatchMaterial = (id, field, value) => {
  updateSelectedLine((lineData) => ({
    ...lineData,
    batches: lineData.batches.map((batch) => ({
      ...batch,
      materials: (batch.materials || []).map((material) =>
        material.id === id ? { ...material, [field]: value } : material
      ),
    })),
  }));
};
const removeBatchMaterial = (id) => {
  updateSelectedLine((lineData) => ({
    ...lineData,
    batches: lineData.batches.map((batch) => ({
      ...batch,
      materials: (batch.materials || []).filter((material) => material.id !== id),
    })),
  }));
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

  const addNote = () => {
    if (!hasText(draftNote) && !hasText(draftAction) && !hasText(draftDie)) return;

    updateSelectedLine((lineData) => ({
      ...lineData,
      notes: [
        ...lineData.notes,
        {
          id: makeId(),
          note: draftNote.trim(),
          action: draftAction.trim(),
          die: draftDie.trim(),
        },
      ],
    }));

    setDraftNote("");
    setDraftAction("");
    setDraftDie("");
  };

  const deleteNote = (id) => {
  updateSelectedLine((lineData) => ({
    ...lineData,
    notes: lineData.notes.filter((note) => note.id !== id),
    batches: lineData.batches.map((batch) => ({
      ...batch,
      notes: (batch.notes || []).filter((note) => note.id !== id),
    })),
  }));
};

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

  const selectLine = (line) => {
    setSelectedLine(String(line));
    setScreen("entry");
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
    if (nextScreen) setScreen(nextScreen);
  };

  const handleTouchEnd = (event) => {
    if (touchStartX == null) return;

    const endX = event.changedTouches[0].clientX;
    const deltaX = touchStartX - endX;

    if (Math.abs(deltaX) > 60) {
      if (deltaX > 0) moveScreen(1);
      if (deltaX < 0) moveScreen(-1);
    }

    setTouchStartX(null);
  };

  const sharedEntryProps = {
    selectedLine,
    selected,
    entryTab,
    setEntryTab,
    moveLine,
    updateOperator,
    addBatch,
    updateBatch,
    removeBatch,
    handleDeleteBatch,
    confirmDeleteBatchId,
    draftNote,
    setDraftNote,
    draftAction,
    setDraftAction,
    draftDie,
    setDraftDie,
    addNote,
    deleteNote,
    addBatchTroubleshoot,
    addBatchMaterial,
    updateTroubleshootNote,
    updateMaterial,
    updateBatchMaterial,
    removeBatchMaterial,
    deleteNote,
    newCoexNumber,
    setNewCoexNumber,
    addMaterial,
    removeMaterial,
    removeBatchMaterial,
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
     <div style={{ ...styles.container, position: "relative", paddingTop: 50 }}>
      <div
  style={{
    position: "absolute",
    top: 10,
    right: 10,
    width: "auto",
    justifyContent: "flex-end",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    zIndex: 55
  }}
>
  <button
    onClick={() => setScreen("lines")}
  style={{
    ...styles.button,
    ...styles.smallButton,
    position: "absolute",
    top: -1,
    right: 0,
    zIndex: 55
  }}
>
  Home
  </button>
</div>
      {/* Menu Button */}
<button
  onClick={() => setMenuOpen(!menuOpen)}
  style={{
    ...styles.button,
    ...styles.smallButton,
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 60
  }}
>
  ☰
</button>
        {screen === "lines" && (
          <LinesScreen
            date={date}
            shift={shift}
            data={data}
            selectedLine={selectedLine}
            onDateChange={setDate}
            onShiftChange={setShift}
            onSelectLine={selectLine}
          />
        )}

        {screen === "entry" && <EntryScreen {...sharedEntryProps} />}

        {screen === "report" && <ReportScreen reportTab={reportTab} setReportTab={setReportTab} {...sharedReportProps} />}

</div>
      {/* Overlay + Slide Panel */}
<>
  <div
    onClick={() => setMenuOpen(false)}
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.3)",
      zIndex: 40,
      display: menuOpen ? "block" : "none"
    }}
  />

  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      height: "100%",
      width: 260,
      background: "#fff",
      padding: 15,
      zIndex: 50,
      boxShadow: "2px 0 10px rgba(0,0,0,.2)",
      transform: menuOpen ? "translateX(0)" : "translateX(-100%)",
      transition: "transform 0.25s ease"
    }}
  >
{menuMode === "main" && (
  <>
    <label style={styles.label}>Date</label>
    <input
      type="date"
      value={date}
      onChange={(e) => setDate(e.target.value)}
      style={styles.input}
    />

    <label style={{ ...styles.label, marginTop: 12 }}>Shift</label>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
      {SHIFT_OPTIONS.map((s) => (
        <button
          key={s}
          onClick={() => setShift(s)}
          style={{
            ...styles.button,
            ...(shift === s ? styles.buttonPrimary : {}),
            fontSize: 12,
            minHeight: 32
          }}
        >
          {s}
        </button>
      ))}
    </div>
<div style={{ marginTop: 20 }}>
  <button
    onClick={() => setMenuMode("entry")}
    style={{
      ...styles.button,
      width: "100%",
      justifyContent: "center"
    }}
  >
    Entry
  </button>
</div>
    <div style={{ marginTop: 20 }}>
      <button
        onClick={() => setMenuMode("reports")}
        style={{
          ...styles.button,
          width: "100%",
          justifyContent: "center"
        }}
      >
        Reports
      </button>
    </div>
  </>
)}
{menuMode === "entry" && (
  <>
    <div style={{ marginBottom: 12 }}>
      <button
        onClick={() => setMenuMode("main")}
        style={{ ...styles.button, ...styles.smallButton }}
      >
        ← Back
      </button>
    </div>

    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <button
        onClick={() => {
          setEntryTab("schedule");
          setScreen("entry");
          setMenuOpen(false);
        }}
        style={styles.button}
      >
        Schedule
      </button>

      <button
        onClick={() => {
          setEntryTab("materials");
          setScreen("entry");
          setMenuOpen(false);
        }}
        style={styles.button}
      >
        Materials
      </button>
    </div>
  </>
)}
{menuMode === "reports" && (
  <>
    <div style={{ marginBottom: 12 }}>
      <button
        onClick={() => setMenuMode("main")}
        style={{ ...styles.button, ...styles.smallButton }}
      >
        ← Back
      </button>
    </div>

    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <button
        onClick={() => {
          setReportTab("schedule");
          setScreen("report");
          setMenuOpen(false);
        }}
        style={styles.button}
      >
        Schedule
      </button>

      <button
        onClick={() => {
          setReportTab("materials");
          setScreen("report");
          setMenuOpen(false);
        }}
        style={styles.button}
      >
        Materials
      </button>

      <button
        onClick={() => {
          setReportTab("troubleshoot");
          setScreen("report");
          setMenuOpen(false);
        }}
        style={styles.button}
      >
        Troubleshoot
      </button>
    </div>
  </>
)}
</div>
</>
    </div>
  );
}