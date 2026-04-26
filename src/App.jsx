import { useEffect, useMemo, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  FileText,
  Home,
  Lock,
  Menu,
  Package,
  Plus,
  Printer,
  Trash2,
  Unlock,
  X,
  Wrench,
} from "lucide-react";
import "./App.css";

const LINE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 24, 25, 26, 27, 28, 29, 30, 31];
const SHIFT_OPTIONS = ["A", "B", "C"];
const ENTRY_TABS = [
  { id: "schedule", label: "Schedule", icon: ClipboardList },
  { id: "materials", label: "Materials", icon: Package },
  { id: "issues", label: "Issues", icon: Wrench },
];
const REPORT_TABS = [
  { id: "line", label: "Line report", icon: FileText },
  { id: "schedule", label: "Daily schedule", icon: ClipboardList },
  { id: "materials", label: "Daily materials", icon: Package },
  { id: "issues", label: "Issues", icon: Wrench },
];
const LINE_GROUPS = [
  { name: "Flex", lines: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  { name: "Custom", lines: [10, 11, 12, 13, 14, 15, 16, 17, 18] },
  { name: "Fence", lines: [24, 25, 26, 27, 28, 29, 30, 31] },
];

const makeId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const todayString = () => new Date().toISOString().slice(0, 10);
const hasText = (value) => String(value || "").trim().length > 0;
const sanitizeFilename = (value) => String(value || "report").replace(/[^a-z0-9-_]+/gi, "_");

const formatDisplayDate = (iso) => {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${Number(month)}/${Number(day)}/${year}`;
};

const createCoex = (number = "02") => ({ id: makeId(), number, natural: "", color: "", regrind: "", additive: "" });
const createMaterial = () => ({ id: makeId(), batch: "", die: "", natural: "", color: "", regrind: "", additive: "", coexes: [] });
const createNote = (seed = {}) => ({
  id: seed.id || makeId(),
  die: seed.die || "",
  note: seed.note || seed.issue || "",
  action: seed.action || "",
  result: seed.result || "",
});
const createBatch = () => ({
  id: makeId(),
  batch: "",
  die: "",
  description: "",
  quantity: "",
  locked: false,
  materials: [],
  notes: [],
});
const createLineData = () => ({
  operator: "",
  batches: [createBatch()],
  materials: [createMaterial()],
  notes: [],
});
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

const normalizeNotes = (notes) => {
  if (!Array.isArray(notes)) return [];
  return notes.map((note) => createNote(note));
};

const normalizeBatches = (lineData) => {
  if (!Array.isArray(lineData?.batches) || lineData.batches.length === 0) return [createBatch()];

  return lineData.batches.map((batch) => ({
    id: batch?.id || makeId(),
    batch: batch?.batch || "",
    die: batch?.die || "",
    description: batch?.description || "",
    quantity: batch?.quantity || "",
    locked: Boolean(batch?.locked),
    materials: normalizeMaterials(batch?.materials).filter((material) => material.batch || material.die || material.natural || material.color || material.regrind || material.additive || material.coexes.length),
    notes: normalizeNotes(batch?.notes),
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

const loadDataForDate = (date) => {
  if (typeof localStorage === "undefined") return createAllLineData();

  const saved = localStorage.getItem(`work-notes-${date}`);
  if (!saved) return createAllLineData();

  try {
    return normalizeSavedData(JSON.parse(saved));
  } catch (error) {
    console.error("Could not load saved work notes:", error);
    return createAllLineData();
  }
};

const isFilledBatch = (batch) => [batch.batch, batch.die, batch.description, batch.quantity].some(hasText);
const isFilledMaterial = (material) => [material.batch, material.die, material.natural, material.color, material.regrind, material.additive].some(hasText) || material.coexes?.some((coex) => [coex.natural, coex.color, coex.regrind, coex.additive].some(hasText));
const isFilledNote = (note) => [note.die, note.note, note.action, note.result].some(hasText);

const getLineSummary = (lineData) => {
  const batches = lineData.batches.filter(isFilledBatch).length;
  const materials = [
    ...lineData.materials.filter(isFilledMaterial),
    ...lineData.batches.flatMap((batch) => batch.materials || []).filter(isFilledMaterial),
  ].length;
  const issues = [...lineData.notes, ...lineData.batches.flatMap((batch) => batch.notes || [])].filter(isFilledNote).length;
  const firstBatch = lineData.batches.find(isFilledBatch);

  return {
    batches,
    materials,
    issues,
    firstBatch,
    hasContent: hasText(lineData.operator) || batches > 0 || materials > 0 || issues > 0,
  };
};

const getScheduleRows = (line, lineData) => {
  const batches = lineData.batches.filter(isFilledBatch);
  if (!batches.length && !hasText(lineData.operator)) return [];
  const rows = batches.length ? batches : [createBatch()];

  return rows.map((batch, index) => ({
    id: `${line}-${batch.id}-${index}`,
    line,
    operator: index === 0 ? lineData.operator : "",
    batch: batch.batch,
    die: batch.die,
    description: batch.description,
    quantity: batch.quantity,
  }));
};

const getMaterialRows = (line, lineData) => {
  const rows = [];
  const fallbackDie = lineData.batches.find((batch) => hasText(batch.die))?.die || "";

  lineData.materials.forEach((material, materialIndex) => {
    if (!isFilledMaterial(material)) return;
    rows.push({
      id: `${line}-line-material-${material.id}`,
      line,
      label: materialIndex === 0 ? `Line ${line}` : "",
      die: material.die || fallbackDie,
      batch: material.batch,
      natural: material.natural,
      color: material.color,
      regrind: material.regrind,
      additive: material.additive,
    });

    material.coexes.forEach((coex) => {
      rows.push({
        id: `${line}-coex-${coex.id}`,
        line,
        label: `Coex ${String(coex.number).padStart(2, "0")}`,
        die: "",
        batch: "",
        natural: coex.natural,
        color: coex.color,
        regrind: coex.regrind,
        additive: coex.additive,
      });
    });
  });

  lineData.batches.forEach((batch) => {
    (batch.materials || []).forEach((material) => {
      if (!isFilledMaterial(material)) return;
      rows.push({
        id: `${line}-batch-material-${material.id}`,
        line,
        label: batch.batch ? `Batch ${batch.batch}` : `Line ${line}`,
        die: material.die || batch.die,
        batch: material.batch || batch.batch,
        natural: material.natural,
        color: material.color,
        regrind: material.regrind,
        additive: material.additive,
      });
    });
  });

  return rows;
};

const getIssueRows = (line, lineData) => {
  const rows = [];

  lineData.notes.forEach((note) => {
    if (!isFilledNote(note)) return;
    rows.push({
      id: `${line}-line-note-${note.id}`,
      line,
      die: note.die,
      batch: "",
      issue: note.note,
      action: note.action,
      result: note.result,
    });
  });

  lineData.batches.forEach((batch) => {
    (batch.notes || []).forEach((note) => {
      if (!isFilledNote(note)) return;
      rows.push({
        id: `${line}-batch-note-${note.id}`,
        line,
        die: note.die || batch.die,
        batch: batch.batch,
        issue: note.note,
        action: note.action,
        result: note.result,
      });
    });
  });

  return rows;
};

function IconButton({ icon: Icon, label, active = false, quiet = false, small = false, className = "", children, ...props }) {
  return (
    <button
      type="button"
      className={`button ${active ? "button-primary" : ""} ${quiet ? "button-quiet" : ""} ${small ? "button-small" : ""} ${className}`}
      {...props}
    >
      {Icon && <Icon size={small ? 15 : 17} strokeWidth={2.2} aria-hidden="true" />}
      {children || <span>{label}</span>}
    </button>
  );
}

function Field({ label, value, onChange, textarea = false, type = "text", placeholder = "" }) {
  const Input = textarea ? "textarea" : "input";
  return (
    <label className="field">
      <span>{label}</span>
      <Input
        type={textarea ? undefined : type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="empty-state">
      <FileText size={22} aria-hidden="true" />
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

function AppHeader({ date, shift, screen, onDateChange, onShiftChange, onScreenChange, menuOpen, setMenuOpen }) {
  return (
    <header className="app-header">
      <div className="header-main">
        <IconButton icon={Menu} label="Menu" quiet className="mobile-only" onClick={() => setMenuOpen(!menuOpen)} />
        <div>
          <h1>Work Notes</h1>
          <p>{formatDisplayDate(date)} · Shift {shift}</p>
        </div>
      </div>

      <div className="header-controls">
        <label className="date-control">
          <CalendarDays size={16} aria-hidden="true" />
          <input type="date" value={date} onChange={(event) => onDateChange(event.target.value)} />
        </label>

        <div className="segmented compact" aria-label="Shift">
          {SHIFT_OPTIONS.map((option) => (
            <button key={option} type="button" className={shift === option ? "active" : ""} onClick={() => onShiftChange(option)}>
              {option}
            </button>
          ))}
        </div>
      </div>

      <nav className="screen-tabs" aria-label="Main navigation">
        <IconButton icon={Home} label="Lines" active={screen === "lines"} onClick={() => onScreenChange("lines")} />
        <IconButton icon={ClipboardList} label="Entry" active={screen === "entry"} onClick={() => onScreenChange("entry")} />
        <IconButton icon={FileText} label="Reports" active={screen === "reports"} onClick={() => onScreenChange("reports")} />
      </nav>
    </header>
  );
}

function MobileDrawer({ open, onClose, screen, onScreenChange, reportTab, onReportTabChange }) {
  return (
    <>
      <button type="button" className={`drawer-scrim ${open ? "open" : ""}`} aria-label="Close menu" onClick={onClose} />
      <aside className={`drawer ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="drawer-head">
          <strong>Menu</strong>
          <IconButton icon={X} label="Close" quiet small onClick={onClose} />
        </div>
        <div className="drawer-list">
          <IconButton icon={Home} label="Lines" active={screen === "lines"} onClick={() => { onScreenChange("lines"); onClose(); }} />
          <IconButton icon={ClipboardList} label="Entry" active={screen === "entry"} onClick={() => { onScreenChange("entry"); onClose(); }} />
          {REPORT_TABS.map(({ id, label, icon }) => (
            <IconButton
              key={id}
              icon={icon}
              label={label}
              active={screen === "reports" && reportTab === id}
              onClick={() => {
                onReportTabChange(id);
                onScreenChange("reports");
                onClose();
              }}
            />
          ))}
        </div>
      </aside>
    </>
  );
}

function LinesScreen({ data, selectedLine, onSelectLine, onOpenLineReport }) {
  return (
    <section className="panel">
      <div className="panel-title">
        <div>
          <h2>Lines</h2>
          <p>Pick a line to enter work notes or open its report.</p>
        </div>
      </div>

      <div className="line-groups">
        {LINE_GROUPS.map((group) => (
          <div className="line-group" key={group.name}>
            <h3>{group.name}</h3>
            <div className="line-list">
              {group.lines.map((line) => {
                const lineKey = String(line);
                const lineData = data[lineKey];
                const summary = getLineSummary(lineData);

                return (
                  <article key={line} className={`line-card ${selectedLine === lineKey ? "selected" : ""}`}>
                    <button type="button" className="line-main" onClick={() => onSelectLine(lineKey)}>
                      <span className="line-number">{line}</span>
                      <span className="line-meta">
                        {summary.firstBatch?.die ? `Die ${summary.firstBatch.die}` : summary.hasContent ? "Notes started" : "No entries"}
                      </span>
                      <span className={`status-dot ${summary.hasContent ? "filled" : ""}`} aria-hidden="true" />
                    </button>
                    <button type="button" className="line-report-button" onClick={() => onOpenLineReport(lineKey)}>
                      <FileText size={16} aria-hidden="true" />
                      <span>Report</span>
                    </button>
                    <div className="line-counts" aria-label={`Line ${line} summary`}>
                      <span>{summary.batches} batch</span>
                      <span>{summary.materials} mat</span>
                      <span>{summary.issues} issue</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EntryScreen({
  selectedLine,
  selected,
  entryTab,
  onEntryTabChange,
  onMoveLine,
  onOpenLineReport,
  updateOperator,
  addBatch,
  updateBatch,
  removeBatch,
  addBatchMaterial,
  updateBatchMaterial,
  removeBatchMaterial,
  addBatchNote,
  updateNote,
  deleteNote,
  addMaterial,
  updateMaterial,
  removeMaterial,
  newCoexNumber,
  setNewCoexNumber,
  addCoex,
  updateCoex,
  removeCoex,
  draftNote,
  setDraftNote,
  draftAction,
  setDraftAction,
  draftDie,
  setDraftDie,
  draftResult,
  setDraftResult,
  addLineNote,
}) {
  return (
    <section className="panel">
      <div className="entry-header">
        <IconButton icon={ChevronLeft} label="Previous line" quiet onClick={() => onMoveLine(-1)} />
        <div>
          <span className="eyebrow">Selected line</span>
          <h2>Line {selectedLine}</h2>
        </div>
        <IconButton icon={ChevronRight} label="Next line" quiet onClick={() => onMoveLine(1)} />
      </div>

      <div className="toolbar-row">
        <div className="segmented grow">
          {ENTRY_TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className={entryTab === id ? "active" : ""} onClick={() => onEntryTabChange(id)}>
              <Icon size={16} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <IconButton icon={FileText} label="Line report" onClick={() => onOpenLineReport(selectedLine)} />
      </div>

      {entryTab === "schedule" && (
        <ScheduleEntry
          selected={selected}
          updateOperator={updateOperator}
          addBatch={addBatch}
          updateBatch={updateBatch}
          removeBatch={removeBatch}
          addBatchMaterial={addBatchMaterial}
          updateBatchMaterial={updateBatchMaterial}
          removeBatchMaterial={removeBatchMaterial}
          addBatchNote={addBatchNote}
          updateNote={updateNote}
          deleteNote={deleteNote}
        />
      )}

      {entryTab === "materials" && (
        <MaterialsEntry
          selected={selected}
          addMaterial={addMaterial}
          updateMaterial={updateMaterial}
          removeMaterial={removeMaterial}
          newCoexNumber={newCoexNumber}
          setNewCoexNumber={setNewCoexNumber}
          addCoex={addCoex}
          updateCoex={updateCoex}
          removeCoex={removeCoex}
        />
      )}

      {entryTab === "issues" && (
        <IssuesEntry
          selected={selected}
          draftNote={draftNote}
          setDraftNote={setDraftNote}
          draftAction={draftAction}
          setDraftAction={setDraftAction}
          draftDie={draftDie}
          setDraftDie={setDraftDie}
          draftResult={draftResult}
          setDraftResult={setDraftResult}
          addLineNote={addLineNote}
          updateNote={updateNote}
          deleteNote={deleteNote}
        />
      )}
    </section>
  );
}

function ScheduleEntry({
  selected,
  updateOperator,
  addBatch,
  updateBatch,
  removeBatch,
  addBatchMaterial,
  updateBatchMaterial,
  removeBatchMaterial,
  addBatchNote,
  updateNote,
  deleteNote,
}) {
  return (
    <div className="stack">
      <Field label="Operator" value={selected.operator} onChange={updateOperator} placeholder="Name" />

      <div className="section-head">
        <div>
          <h3>Schedule</h3>
          <p>Batches, dies, quantities, and any batch-specific notes.</p>
        </div>
        <IconButton icon={Plus} label="Batch" active onClick={addBatch} />
      </div>

      <div className="card-list">
        {selected.batches.map((batch, batchIndex) => (
          <article className={`work-card ${batch.locked ? "locked" : ""}`} key={batch.id}>
            <div className="card-head">
              <div>
                <span className="eyebrow">Batch {batchIndex + 1}</span>
                <strong>{batch.batch || batch.die || "New batch"}</strong>
              </div>
              <div className="icon-actions">
                <IconButton
                  icon={batch.locked ? Unlock : Lock}
                  label={batch.locked ? "Unlock" : "Lock"}
                  quiet
                  small
                  onClick={() => updateBatch(batch.id, "locked", !batch.locked)}
                />
                <IconButton icon={Trash2} label="Delete" quiet small onClick={() => removeBatch(batch.id)} />
              </div>
            </div>

            {batch.locked ? (
              <div className="locked-summary">
                <span>{batch.batch || "No batch"}</span>
                <span>Die {batch.die || "-"}</span>
                <span>{batch.quantity || "No quantity"}</span>
              </div>
            ) : (
              <div className="field-grid">
                <Field label="Batch" value={batch.batch} onChange={(value) => updateBatch(batch.id, "batch", value)} />
                <Field label="Die" value={batch.die} onChange={(value) => updateBatch(batch.id, "die", value)} />
                <Field label="Description" value={batch.description} onChange={(value) => updateBatch(batch.id, "description", value)} />
                <Field label="Quantity" value={batch.quantity} onChange={(value) => updateBatch(batch.id, "quantity", value)} />
              </div>
            )}

            <div className="sub-actions">
              <IconButton icon={Package} label="Material" small onClick={() => addBatchMaterial(batch.id)} />
              <IconButton icon={Wrench} label="Issue" small onClick={() => addBatchNote(batch.id)} />
            </div>

            {(batch.materials || []).map((material) => (
              <div className="sub-card" key={material.id}>
                <div className="sub-card-head">
                  <strong>Batch material</strong>
                  <IconButton icon={Trash2} label="Delete" quiet small onClick={() => removeBatchMaterial(material.id)} />
                </div>
                <div className="field-grid">
                  <Field label="Natural" value={material.natural || ""} onChange={(value) => updateBatchMaterial(material.id, "natural", value)} />
                  <Field label="Color" value={material.color || ""} onChange={(value) => updateBatchMaterial(material.id, "color", value)} />
                  <Field label="Regrind" value={material.regrind || ""} onChange={(value) => updateBatchMaterial(material.id, "regrind", value)} />
                  <Field label="Additive" value={material.additive || ""} onChange={(value) => updateBatchMaterial(material.id, "additive", value)} />
                </div>
              </div>
            ))}

            {(batch.notes || []).map((note) => (
              <NoteEditor key={note.id} note={note} title="Batch issue" updateNote={updateNote} deleteNote={deleteNote} />
            ))}
          </article>
        ))}
      </div>
    </div>
  );
}

function MaterialsEntry({ selected, addMaterial, updateMaterial, removeMaterial, newCoexNumber, setNewCoexNumber, addCoex, updateCoex, removeCoex }) {
  return (
    <div className="stack">
      <div className="section-head">
        <div>
          <h3>Materials</h3>
          <p>Line-level material details and coex rows.</p>
        </div>
        <IconButton icon={Plus} label="Material" active onClick={addMaterial} />
      </div>

      <div className="card-list">
        {selected.materials.map((material, index) => (
          <article className="work-card" key={material.id}>
            <div className="card-head">
              <div>
                <span className="eyebrow">Material {index + 1}</span>
                <strong>{material.batch || material.die || "Line material"}</strong>
              </div>
              <IconButton icon={Trash2} label="Delete" quiet small onClick={() => removeMaterial(material.id)} />
            </div>

            <div className="field-grid">
              <Field label="Batch" value={material.batch} onChange={(value) => updateMaterial(material.id, "batch", value)} />
              <Field label="Die" value={material.die} onChange={(value) => updateMaterial(material.id, "die", value)} />
              <Field label="Natural" value={material.natural} onChange={(value) => updateMaterial(material.id, "natural", value)} />
              <Field label="Color" value={material.color} onChange={(value) => updateMaterial(material.id, "color", value)} />
              <Field label="Regrind" value={material.regrind} onChange={(value) => updateMaterial(material.id, "regrind", value)} />
              <Field label="Additive" value={material.additive} onChange={(value) => updateMaterial(material.id, "additive", value)} />
            </div>

            <div className="coex-add">
              <Field label="Coex #" value={newCoexNumber} onChange={setNewCoexNumber} />
              <IconButton icon={Plus} label="Add coex" onClick={() => addCoex(material.id)} />
            </div>

            {material.coexes.length > 0 && (
              <div className="sub-stack">
                {material.coexes.map((coex) => (
                  <div className="sub-card" key={coex.id}>
                    <div className="sub-card-head">
                      <strong>Coex {String(coex.number).padStart(2, "0")}</strong>
                      <IconButton icon={Trash2} label="Delete" quiet small onClick={() => removeCoex(material.id, coex.id)} />
                    </div>
                    <div className="field-grid">
                      <Field label="Natural" value={coex.natural} onChange={(value) => updateCoex(material.id, coex.id, "natural", value)} />
                      <Field label="Color" value={coex.color} onChange={(value) => updateCoex(material.id, coex.id, "color", value)} />
                      <Field label="Regrind" value={coex.regrind} onChange={(value) => updateCoex(material.id, coex.id, "regrind", value)} />
                      <Field label="Additive" value={coex.additive} onChange={(value) => updateCoex(material.id, coex.id, "additive", value)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function IssuesEntry({ selected, draftNote, setDraftNote, draftAction, setDraftAction, draftDie, setDraftDie, draftResult, setDraftResult, addLineNote, updateNote, deleteNote }) {
  const notes = selected.notes.filter(isFilledNote);

  return (
    <div className="stack">
      <div className="section-head">
        <div>
          <h3>Issues</h3>
          <p>Line-level troubleshooting notes and results.</p>
        </div>
      </div>

      <article className="work-card">
        <div className="field-grid">
          <Field label="Die" value={draftDie} onChange={setDraftDie} />
          <Field label="Issue" value={draftNote} onChange={setDraftNote} textarea />
          <Field label="Action" value={draftAction} onChange={setDraftAction} textarea />
          <Field label="Result" value={draftResult} onChange={setDraftResult} textarea />
        </div>
        <div className="form-footer">
          <IconButton icon={Plus} label="Add issue" active onClick={addLineNote} />
        </div>
      </article>

      {notes.length ? (
        <div className="card-list">
          {notes.map((note) => (
            <NoteEditor key={note.id} note={note} title="Line issue" updateNote={updateNote} deleteNote={deleteNote} />
          ))}
        </div>
      ) : (
        <EmptyState title="No line issues" text="Batch-specific issues still appear in reports." />
      )}
    </div>
  );
}

function NoteEditor({ note, title, updateNote, deleteNote }) {
  return (
    <div className="sub-card note-editor">
      <div className="sub-card-head">
        <strong>{title}</strong>
        <IconButton icon={Trash2} label="Delete" quiet small onClick={() => deleteNote(note.id)} />
      </div>
      <div className="field-grid">
        <Field label="Die" value={note.die || ""} onChange={(value) => updateNote(note.id, "die", value)} />
        <Field label="Issue" value={note.note || ""} onChange={(value) => updateNote(note.id, "note", value)} textarea />
        <Field label="Action" value={note.action || ""} onChange={(value) => updateNote(note.id, "action", value)} textarea />
        <Field label="Result" value={note.result || ""} onChange={(value) => updateNote(note.id, "result", value)} textarea />
      </div>
    </div>
  );
}

function ReportsScreen({ data, date, shift, selectedLine, setSelectedLine, reportTab, setReportTab, onExportPdf, onPrint, isExporting }) {
  const selectedLineData = data[selectedLine] || createLineData();

  return (
    <section className="panel reports-panel">
      <div className="panel-title">
        <div>
          <h2>Reports</h2>
          <p>Display, save as PDF, or print the current report.</p>
        </div>
      </div>

      <div className="toolbar-row">
        <div className="segmented report-tabs grow">
          {REPORT_TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className={reportTab === id ? "active" : ""} onClick={() => setReportTab(id)}>
              <Icon size={16} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {reportTab === "line" && (
          <label className="select-control">
            <span>Line</span>
            <select value={selectedLine} onChange={(event) => setSelectedLine(event.target.value)}>
              {LINE_NUMBERS.map((line) => (
                <option value={String(line)} key={line}>
                  {line}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="report-actions">
        <IconButton icon={Download} label={isExporting ? "Creating PDF" : "PDF"} active onClick={onExportPdf} disabled={isExporting} />
        <IconButton icon={Printer} label="Print" onClick={onPrint} />
      </div>

      <div id="print-area" className="print-area">
        {reportTab === "line" && <LineReport line={selectedLine} lineData={selectedLineData} date={date} shift={shift} />}
        {reportTab === "schedule" && <ScheduleReport data={data} date={date} shift={shift} />}
        {reportTab === "materials" && <MaterialsReport data={data} date={date} shift={shift} />}
        {reportTab === "issues" && <IssuesReport data={data} date={date} shift={shift} />}
      </div>
    </section>
  );
}

function ReportHeader({ title, date, shift, subtitle }) {
  return (
    <div className="report-header">
      <div>
        <span className="report-kicker">Work Notes</span>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="report-meta">
        <span>{formatDisplayDate(date)}</span>
        <span>Shift {shift}</span>
      </div>
    </div>
  );
}

function ReportSection({ title, children }) {
  return (
    <section className="report-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function LineReport({ line, lineData, date, shift }) {
  const scheduleRows = getScheduleRows(line, lineData);
  const materialRows = getMaterialRows(line, lineData);
  const issueRows = getIssueRows(line, lineData);

  return (
    <article className="report-page">
      <ReportHeader title={`Line ${line} Report`} subtitle={lineData.operator ? `Operator: ${lineData.operator}` : "Operator not entered"} date={date} shift={shift} />

      <ReportSection title="Schedule">
        {scheduleRows.length ? <ScheduleTable rows={scheduleRows} showLine={false} /> : <ReportEmpty>No schedule entries for this line.</ReportEmpty>}
      </ReportSection>

      <ReportSection title="Materials">
        {materialRows.length ? <MaterialsTable rows={materialRows} showLine={false} /> : <ReportEmpty>No material entries for this line.</ReportEmpty>}
      </ReportSection>

      <ReportSection title="Issues">
        {issueRows.length ? <IssuesTable rows={issueRows} showLine={false} /> : <ReportEmpty>No issue entries for this line.</ReportEmpty>}
      </ReportSection>
    </article>
  );
}

function ScheduleReport({ data, date, shift }) {
  const rows = Object.entries(data).flatMap(([line, lineData]) => getScheduleRows(line, lineData));

  return (
    <article className="report-page">
      <ReportHeader title="Daily Schedule" date={date} shift={shift} />
      {rows.length ? <ScheduleTable rows={rows} /> : <ReportEmpty>No schedule entries for this date.</ReportEmpty>}
    </article>
  );
}

function MaterialsReport({ data, date, shift }) {
  const rows = Object.entries(data).flatMap(([line, lineData]) => getMaterialRows(line, lineData));

  return (
    <article className="report-page">
      <ReportHeader title="Daily Materials" date={date} shift={shift} />
      {rows.length ? <MaterialsTable rows={rows} /> : <ReportEmpty>No material entries for this date.</ReportEmpty>}
    </article>
  );
}

function IssuesReport({ data, date, shift }) {
  const rows = Object.entries(data).flatMap(([line, lineData]) => getIssueRows(line, lineData));

  return (
    <article className="report-page">
      <ReportHeader title="Issue Report" date={date} shift={shift} />
      {rows.length ? <IssuesTable rows={rows} /> : <ReportEmpty>No issue entries for this date.</ReportEmpty>}
    </article>
  );
}

function ReportEmpty({ children }) {
  return <div className="report-empty">{children}</div>;
}

function ScheduleTable({ rows, showLine = true }) {
  return (
    <div className="report-table schedule-table">
      <div className="report-row report-row-head">
        {showLine && <span>Line</span>}
        <span>Operator</span>
        <span>Batch</span>
        <span>Die</span>
        <span>Description</span>
        <span>Quantity</span>
      </div>
      {rows.map((row) => (
        <div className="report-row" key={row.id}>
          {showLine && <span>{row.line}</span>}
          <span>{row.operator || "-"}</span>
          <span>{row.batch || "-"}</span>
          <span>{row.die || "-"}</span>
          <span>{row.description || "-"}</span>
          <span>{row.quantity || "-"}</span>
        </div>
      ))}
    </div>
  );
}

function MaterialsTable({ rows, showLine = true }) {
  return (
    <div className="report-table materials-table">
      <div className="report-row report-row-head">
        {showLine && <span>Line</span>}
        <span>Item</span>
        <span>Die</span>
        <span>Batch</span>
        <span>Natural</span>
        <span>Color</span>
        <span>Regrind</span>
        <span>Additive</span>
      </div>
      {rows.map((row) => (
        <div className="report-row" key={row.id}>
          {showLine && <span>{row.line}</span>}
          <span>{row.label || "-"}</span>
          <span>{row.die || "-"}</span>
          <span>{row.batch || "-"}</span>
          <span>{row.natural || "-"}</span>
          <span>{row.color || "-"}</span>
          <span>{row.regrind || "-"}</span>
          <span>{row.additive || "-"}</span>
        </div>
      ))}
    </div>
  );
}

function IssuesTable({ rows, showLine = true }) {
  return (
    <div className="report-table issues-table">
      <div className="report-row report-row-head">
        {showLine && <span>Line</span>}
        <span>Die</span>
        <span>Batch</span>
        <span>Issue</span>
        <span>Action</span>
        <span>Result</span>
      </div>
      {rows.map((row) => (
        <div className="report-row" key={row.id}>
          {showLine && <span>{row.line}</span>}
          <span>{row.die || "-"}</span>
          <span>{row.batch || "-"}</span>
          <span>{row.issue || "-"}</span>
          <span>{row.action || "-"}</span>
          <span>{row.result || "-"}</span>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [date, setDate] = useState(todayString());
  const [shift, setShift] = useState("A");
  const [data, setData] = useState(() => loadDataForDate(date));
  const [selectedLine, setSelectedLine] = useState("1");
  const [screen, setScreen] = useState("lines");
  const [entryTab, setEntryTab] = useState("schedule");
  const [reportTab, setReportTab] = useState("line");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [newCoexNumber, setNewCoexNumber] = useState("02");
  const [draftNote, setDraftNote] = useState("");
  const [draftAction, setDraftAction] = useState("");
  const [draftResult, setDraftResult] = useState("");
  const [draftDie, setDraftDie] = useState("");

  useEffect(() => {
    localStorage.setItem(`work-notes-${date}`, JSON.stringify(data));
  }, [data, date]);

  const selected = useMemo(() => data[selectedLine] || createLineData(), [data, selectedLine]);

  const changeDate = (value) => {
    setDate(value);
    setData(loadDataForDate(value));
  };

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

  const addBatchMaterial = (batchId) => {
    updateSelectedLine((lineData) => ({
      ...lineData,
      batches: lineData.batches.map((batch) => {
        if (batch.id !== batchId) return batch;
        return {
          ...batch,
          materials: [
            ...(batch.materials || []),
            {
              ...createMaterial(),
              batch: batch.batch,
              die: batch.die,
            },
          ],
        };
      }),
    }));
  };

  const updateBatchMaterial = (id, field, value) => {
    updateSelectedLine((lineData) => ({
      ...lineData,
      batches: lineData.batches.map((batch) => ({
        ...batch,
        materials: (batch.materials || []).map((material) => (material.id === id ? { ...material, [field]: value } : material)),
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

  const addBatchNote = (batchId) => {
    updateSelectedLine((lineData) => ({
      ...lineData,
      batches: lineData.batches.map((batch) => {
        if (batch.id !== batchId) return batch;
        return {
          ...batch,
          notes: [...(batch.notes || []), createNote({ die: batch.die })],
        };
      }),
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

  const addCoex = (materialId) => {
    const cleanNumber = String(newCoexNumber || "").trim().replace(/^Coex/i, "");
    if (!cleanNumber) return;

    updateSelectedLine((lineData) => ({
      ...lineData,
      materials: lineData.materials.map((material) => (
        material.id === materialId ? { ...material, coexes: [...material.coexes, createCoex(cleanNumber)] } : material
      )),
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
      materials: lineData.materials.map((material) => (
        material.id === materialId ? { ...material, coexes: material.coexes.filter((coex) => coex.id !== coexId) } : material
      )),
    }));
  };

  const addLineNote = () => {
    if (![draftDie, draftNote, draftAction, draftResult].some(hasText)) return;

    updateSelectedLine((lineData) => ({
      ...lineData,
      notes: [
        ...lineData.notes,
        createNote({
          die: draftDie.trim(),
          note: draftNote.trim(),
          action: draftAction.trim(),
          result: draftResult.trim(),
        }),
      ],
    }));

    setDraftDie("");
    setDraftNote("");
    setDraftAction("");
    setDraftResult("");
  };

  const updateNote = (id, field, value) => {
    updateSelectedLine((lineData) => ({
      ...lineData,
      notes: lineData.notes.map((note) => (note.id === id ? { ...note, [field]: value } : note)),
      batches: lineData.batches.map((batch) => ({
        ...batch,
        notes: (batch.notes || []).map((note) => (note.id === id ? { ...note, [field]: value } : note)),
      })),
    }));
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

  const selectLine = (line) => {
    setSelectedLine(String(line));
    setScreen("entry");
  };

  const openLineReport = (line) => {
    setSelectedLine(String(line));
    setReportTab("line");
    setScreen("reports");
  };

  const moveLine = (direction) => {
    const currentIndex = LINE_NUMBERS.indexOf(Number(selectedLine));
    const nextLine = LINE_NUMBERS[currentIndex + direction];
    if (nextLine) setSelectedLine(String(nextLine));
  };

  const exportReportPdf = async () => {
    const reportElement = document.getElementById("print-area");
    if (!reportElement || isExporting) return;

    try {
      setIsExporting(true);
      const canvas = await html2canvas(reportElement, { scale: 2.4, backgroundColor: "#ffffff", useCORS: true });
      const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "letter" });
      const margin = 24;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;
      const imageHeight = (canvas.height * usableWidth) / canvas.width;
      const imageData = canvas.toDataURL("image/png");

      let heightLeft = imageHeight;
      let position = margin;
      pdf.addImage(imageData, "PNG", margin, position, usableWidth, imageHeight);
      heightLeft -= usableHeight;

      while (heightLeft > 0) {
        pdf.addPage();
        position = margin - (imageHeight - heightLeft);
        pdf.addImage(imageData, "PNG", margin, position, usableWidth, imageHeight);
        heightLeft -= usableHeight;
      }

      const linePart = reportTab === "line" ? `_line_${selectedLine}` : "";
      pdf.save(`${reportTab}${linePart}_${sanitizeFilename(date)}_shift_${shift}.pdf`);
    } catch (error) {
      console.error(error);
      window.alert("Could not create the PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="app-shell">
      <AppHeader
        date={date}
        shift={shift}
        screen={screen}
        onDateChange={changeDate}
        onShiftChange={setShift}
        onScreenChange={setScreen}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      <MobileDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        screen={screen}
        onScreenChange={setScreen}
        reportTab={reportTab}
        onReportTabChange={setReportTab}
      />

      <main className="app-main">
        {screen === "lines" && (
          <LinesScreen
            data={data}
            selectedLine={selectedLine}
            onSelectLine={selectLine}
            onOpenLineReport={openLineReport}
          />
        )}

        {screen === "entry" && (
          <EntryScreen
            selectedLine={selectedLine}
            selected={selected}
            entryTab={entryTab}
            onEntryTabChange={setEntryTab}
            onMoveLine={moveLine}
            onOpenLineReport={openLineReport}
            updateOperator={updateOperator}
            addBatch={addBatch}
            updateBatch={updateBatch}
            removeBatch={removeBatch}
            addBatchMaterial={addBatchMaterial}
            updateBatchMaterial={updateBatchMaterial}
            removeBatchMaterial={removeBatchMaterial}
            addBatchNote={addBatchNote}
            updateNote={updateNote}
            deleteNote={deleteNote}
            addMaterial={addMaterial}
            updateMaterial={updateMaterial}
            removeMaterial={removeMaterial}
            newCoexNumber={newCoexNumber}
            setNewCoexNumber={setNewCoexNumber}
            addCoex={addCoex}
            updateCoex={updateCoex}
            removeCoex={removeCoex}
            draftNote={draftNote}
            setDraftNote={setDraftNote}
            draftAction={draftAction}
            setDraftAction={setDraftAction}
            draftDie={draftDie}
            setDraftDie={setDraftDie}
            draftResult={draftResult}
            setDraftResult={setDraftResult}
            addLineNote={addLineNote}
          />
        )}

        {screen === "reports" && (
          <ReportsScreen
            data={data}
            date={date}
            shift={shift}
            selectedLine={selectedLine}
            setSelectedLine={setSelectedLine}
            reportTab={reportTab}
            setReportTab={setReportTab}
            onExportPdf={exportReportPdf}
            onPrint={() => window.print()}
            isExporting={isExporting}
          />
        )}
      </main>
    </div>
  );
}
