import React, { useEffect, useMemo, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const lineNumbers = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
  24, 25, 26, 27, 28, 29, 30, 31,
];

const shiftOptions = ["A", "B", "C"];

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f1f5f9",
    color: "#0f172a",
    padding: 10,
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box",
  },
  container: {
    width: "100%",
    maxWidth: 430,
    margin: "0 auto",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  cardBody: {
    padding: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 10,
  },
  label: {
    display: "block",
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 6,
  },
  input: {
    width: "100%",
    color: "#0f172a",
    boxSizing: "border-box",
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    fontSize: 14,
    background: "#fff",
  },
  textarea: {
    width: "100%",
    color: "#0f172a",
    boxSizing: "border-box",
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    fontSize: 14,
    minHeight: 74,
    resize: "vertical",
    background: "#fff",
  },
  button: {
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    borderRadius: 14,
    padding: "10px 12px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 42,
  },
  smallButton: {
    padding: "7px 9px",
    fontSize: 12,
    minHeight: 36,
  },
  buttonPrimary: {
    background: "#0f172a",
    color: "#fff",
    border: "1px solid #0f172a",
  },
  lineGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
  },
  lineButton: {
    minHeight: 54,
    fontSize: 18,
  },
  shiftGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
  },
  batchRow: {
    display: "grid",
    gridTemplateColumns: "30% 1fr",
    gap: 10,
    alignItems: "end",
  },
  noteGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 10,
  },
  materialRow: {
    display: "grid",
    gridTemplateColumns: "1fr 74px 58px",
    gap: 8,
    alignItems: "end",
  },
  reportShell: {
    width: "100%",
    overflowX: "hidden",
  },
  reportHeader: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 6,
    borderBottom: "1px solid #cbd5e1",
  },
  reportBlock: {
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: 6,
    marginBottom: 8,
  },
  reportGrid: {
    display: "grid",
    gridTemplateColumns: "24px 50px 52px 30px 68px minmax(0, 1fr)",
    columnGap: 2,
  },
  reportHeadRow: {
    fontSize: 10,
    fontWeight: 700,
    borderBottom: "1px solid #cbd5e1",
    paddingBottom: 3,
    marginBottom: 5,
    lineHeight: "12px",
  },
  reportRow: {
    fontSize: 10,
    lineHeight: "12px",
    alignItems: "start",
    wordBreak: "break-word",
  },
  reportPair: {
    fontSize: 10,
    lineHeight: "12px",
    marginTop: 2,
    wordBreak: "break-word",
  },
  muted: {
    fontSize: 13,
    color: "#64748b",
  },
  bottomNav: {
    position: "sticky",
    bottom: 0,
    background: "#f1f5f9",
    paddingTop: 8,
    marginTop: 10,
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
  },
};

const makeId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const todayString = () => new Date().toISOString().slice(0, 10);

const formatDisplayDate = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${parseInt(m, 10)}-${parseInt(d, 10)}-${y}`;
};

const newMaterial = () => ({ id: makeId(), material: "", percent: "" });
const newBatch = () => ({ id: makeId(), batch: "", die: "", description: "" });

const buildData = () =>
  Object.fromEntries(
    lineNumbers.map((line) => [String(line), { operator: "", batches: [newBatch()], materials: [newMaterial()], notes: [] }])
  );

const normalizeMaterials = (materials) => {
  if (Array.isArray(materials) && materials.length) {
    return materials.map((m) => ({ id: m?.id || makeId(), material: m?.material || "", percent: m?.percent || "" }));
  }
  return [newMaterial()];
};

const normalizeBatches = (item) => {
  if (Array.isArray(item?.batches) && item.batches.length) {
    return item.batches.map((b) => ({ id: b?.id || makeId(), batch: b?.batch || "", die: b?.die || "", description: b?.description || "" }));
  }
  return [newBatch()];
};

const normalizeNotes = (notes) => {
  if (Array.isArray(notes)) {
    return notes.map((n) => ({ id: n?.id || makeId(), note: n?.note || n?.issue || "", action: n?.action || "" }));
  }
  return [];
};

const formatMaterials = (materials) =>
  materials
    .filter((m) => (m.material || "").trim() || (m.percent || "").trim())
    .slice(0, 4)
    .map((m) => {
      const material = (m.material || "").trim() || "-";
      const percent = (m.percent || "").trim();
      return percent ? `${material} ${percent}` : material;
    })
    .join(" | ") || "";

const sanitizeFilename = (value) => value.replace(/[^a-z0-9-_]+/gi, "_");

export default function App() {
  const [isExporting, setIsExporting] = useState(false);
  const [shift, setShift] = useState("A");
  const [date, setDate] = useState(todayString());
  const [data, setData] = useState(buildData());
  const [selectedLine, setSelectedLine] = useState("1");
  const [screen, setScreen] = useState("lines");
  const [newNote, setNewNote] = useState("");
  const [newAction, setNewAction] = useState("");
  const [touchStartX, setTouchStartX] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(`work-notes-${date}`);
    if (!saved) {
      setData(buildData());
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      const base = buildData();
      Object.keys(parsed || {}).forEach((line) => {
        if (!base[line]) return;
        const item = parsed[line] || {};
        base[line] = {
          operator: item.operator || "",
          batches: normalizeBatches(item),
          materials: normalizeMaterials(item.materials),
          notes: normalizeNotes(item.notes),
        };
      });
      setData(base);
    } catch {
      setData(buildData());
    }
  }, [date]);

  useEffect(() => {
    localStorage.setItem(`work-notes-${date}`, JSON.stringify(data));
  }, [data, date]);

  const selected = useMemo(() => data[selectedLine], [data, selectedLine]);

  const updateOperator = (value) => {
    setData((prev) => ({ ...prev, [selectedLine]: { ...prev[selectedLine], operator: value } }));
  };

  const updateBatch = (id, field, value) => {
    setData((prev) => ({
      ...prev,
      [selectedLine]: {
        ...prev[selectedLine],
        batches: prev[selectedLine].batches.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
      },
    }));
  };

  const addBatch = () => {
    setData((prev) => ({ ...prev, [selectedLine]: { ...prev[selectedLine], batches: [...prev[selectedLine].batches, newBatch()] } }));
  };

  const removeBatch = (id) => {
    setData((prev) => {
      const filtered = prev[selectedLine].batches.filter((b) => b.id !== id);
      return { ...prev, [selectedLine]: { ...prev[selectedLine], batches: filtered.length ? filtered : [newBatch()] } };
    });
  };

  const updateMaterial = (id, field, value) => {
    setData((prev) => ({
      ...prev,
      [selectedLine]: {
        ...prev[selectedLine],
        materials: prev[selectedLine].materials.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
      },
    }));
  };

  const addMaterial = () => {
    setData((prev) => ({ ...prev, [selectedLine]: { ...prev[selectedLine], materials: [...prev[selectedLine].materials, newMaterial()] } }));
  };

  const removeMaterial = (id) => {
    setData((prev) => {
      const filtered = prev[selectedLine].materials.filter((m) => m.id !== id);
      return { ...prev, [selectedLine]: { ...prev[selectedLine], materials: filtered.length ? filtered : [newMaterial()] } };
    });
  };

  const addNotePair = () => {
    if (!newNote.trim() && !newAction.trim()) return;
    setData((prev) => ({
      ...prev,
      [selectedLine]: {
        ...prev[selectedLine],
        notes: [...prev[selectedLine].notes, { id: makeId(), note: newNote.trim(), action: newAction.trim() }],
      },
    }));
    setNewNote("");
    setNewAction("");
  };

  const deleteNotePair = (id) => {
    setData((prev) => ({ ...prev, [selectedLine]: { ...prev[selectedLine], notes: prev[selectedLine].notes.filter((n) => n.id !== id) } }));
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
      const imgHeight = (canvas.height * usableWidth) / canvas.width;
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", margin, margin, usableWidth, imgHeight);
      pdf.save(`daily_report_${sanitizeFilename(date)}_shift_${shift}.pdf`);
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

  const goNext = () => {
    if (screen === "lines") setScreen("entry");
    else if (screen === "entry") setScreen("report");
  };

  const goBack = () => {
    if (screen === "report") setScreen("entry");
    else if (screen === "entry") setScreen("lines");
  };

  const handleTouchEnd = (e) => {
    if (touchStartX == null) return;
    const delta = touchStartX - e.changedTouches[0].clientX;
    if (delta > 60) goNext();
    if (delta < -60) goBack();
    setTouchStartX(null);
  };

  return (
    <div
      style={styles.page}
      onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
      onTouchEnd={handleTouchEnd}
    >
      <div style={styles.container}>
        {screen === "lines" && (
          <div style={styles.card}>
            <div style={styles.cardBody}>
              <div style={styles.title}>Daily Report</div>
              <label style={styles.label}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={styles.input} />

              <div style={{ marginTop: 14 }}>
                <label style={styles.label}>Shift</label>
                <div style={styles.shiftGrid}>
                  {shiftOptions.map((s) => (
                    <button key={s} onClick={() => setShift(s)} style={{ ...styles.button, ...(shift === s ? styles.buttonPrimary : {}) }}>{s}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <label style={styles.label}>Line</label>
                <div style={styles.lineGrid}>
                  {lineNumbers.map((l) => (
                    <button key={l} onClick={() => selectLine(l)} style={{ ...styles.button, ...styles.lineButton, ...(selectedLine === String(l) ? styles.buttonPrimary : {}) }}>{l}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {screen === "entry" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={styles.card}>
              <div style={styles.cardBody}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <button onClick={() => setScreen("lines")} style={styles.button}>Back</button>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>Line {selectedLine}</div>
                  <button onClick={() => setScreen("report")} style={styles.button}>Report</button>
                </div>

                <label style={styles.label}>Operator</label>
                <input value={selected.operator} onChange={(e) => updateOperator(e.target.value)} style={styles.input} />

                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <label style={styles.label}>Batches</label>
                    <button onClick={addBatch} style={{ ...styles.button, ...styles.smallButton }}>+ Add Batch</button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {selected.batches.map((b, index) => (
                      <div key={b.id} style={{ ...styles.card, boxShadow: "none" }}>
                        <div style={styles.cardBody}>
                          <div style={{ ...styles.muted, fontWeight: 700, marginBottom: 8 }}>Batch {index + 1}</div>
                          <div style={styles.batchRow}>
                            <div>
                              <label style={styles.label}>Batch</label>
                              <input value={b.batch} onChange={(e) => updateBatch(b.id, "batch", e.target.value)} style={styles.input} />
                            </div>
                            <div>
                              <label style={styles.label}>Die</label>
                              <input value={b.die} onChange={(e) => updateBatch(b.id, "die", e.target.value)} style={styles.input} />
                            </div>
                          </div>
                          <div style={{ marginTop: 10 }}>
                            <label style={styles.label}>Description</label>
                            <input value={b.description} onChange={(e) => updateBatch(b.id, "description", e.target.value)} style={styles.input} />
                          </div>
                          <div style={{ marginTop: 8 }}>
                            <button onClick={() => removeBatch(b.id)} style={{ ...styles.button, ...styles.smallButton }}>Delete</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={styles.noteGrid}>
                    <div>
                      <label style={styles.label}>Notes</label>
                      <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} style={styles.textarea} />
                    </div>
                    <div>
                      <label style={styles.label}>Troubleshooting Steps Taken</label>
                      <textarea value={newAction} onChange={(e) => setNewAction(e.target.value)} style={styles.textarea} />
                    </div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <button onClick={addNotePair} style={{ ...styles.button, ...styles.buttonPrimary }}>+ Add Note / Troubleshooting</button>
                  </div>
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                    {selected.notes.length > 0 ? selected.notes.map((n, index) => (
                      <div key={n.id} style={{ ...styles.card, boxShadow: "none" }}>
                        <div style={styles.cardBody}>
                          <div style={{ ...styles.muted, fontWeight: 700 }}>Pair {index + 1}</div>
                          <div style={{ fontSize: 14, marginTop: 6 }}><strong>Notes:</strong> {n.note}</div>
                          <div style={{ fontSize: 14, marginTop: 4 }}><strong>Troubleshooting Steps Taken:</strong> {n.action}</div>
                          <div style={{ marginTop: 8 }}><button onClick={() => deleteNotePair(n.id)} style={{ ...styles.button, ...styles.smallButton }}>Delete</button></div>
                        </div>
                      </div>
                    )) : <div style={styles.muted}>No note / troubleshooting pairs for this line yet.</div>}
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <label style={styles.label}>Materials</label>
                    <button onClick={addMaterial} style={{ ...styles.button, ...styles.smallButton }}>+ Add Material</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {selected.materials.map((m, index) => (
                      <div key={m.id} style={styles.materialRow}>
                        <div>
                          <label style={styles.label}>{index === 0 ? "Material" : `Material ${index + 1}`}</label>
                          <input value={m.material} onChange={(e) => updateMaterial(m.id, "material", e.target.value)} style={styles.input} />
                        </div>
                        <div>
                          <label style={styles.label}>%</label>
                          <input value={m.percent} onChange={(e) => updateMaterial(m.id, "percent", e.target.value)} style={styles.input} />
                        </div>
                        <div><button onClick={() => removeMaterial(m.id)} style={{ ...styles.button, ...styles.smallButton }}>Delete</button></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {screen === "report" && (
          <div style={styles.card}>
            <div style={styles.cardBody}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <button onClick={() => setScreen("entry")} style={styles.button}>Back</button>
                <div style={styles.subtitle}>Report</div>
                <button onClick={exportReportPdf} disabled={isExporting} style={{ ...styles.button, ...styles.smallButton, ...(isExporting ? { opacity: 0.7 } : {}) }}>{isExporting ? "PDF..." : "PDF"}</button>
              </div>

              <div id="print-area" style={styles.reportShell}>
                <div style={styles.reportHeader}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Daily Report</div>
                  <div style={{ fontSize: 13, fontWeight: 700, textAlign: "center" }}>{formatDisplayDate(date)}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, textAlign: "right" }}>Shift {shift}</div>
                </div>

                <div style={styles.reportBlock}>
                  <div style={{ ...styles.reportGrid, ...styles.reportHeadRow }}>
                    <div>Line</div><div>Oper.</div><div>Batch</div><div>Die</div><div>Desc.</div><div>Material %</div>
                  </div>

                  {Object.entries(data).map(([line, item]) => {
                    const hasMaterials = item.materials.some((m) => (m.material || "").trim() || (m.percent || "").trim());
                    const filledBatches = item.batches.filter((b) => (b.batch || "").trim() || (b.die || "").trim() || (b.description || "").trim());
                    const hasContent = (item.operator || "").trim() || filledBatches.length || hasMaterials || item.notes.length;
                    if (!hasContent) return null;
                    const rowsToPrint = filledBatches.length ? filledBatches : [newBatch()];

                    return (
                      <div key={line} style={{ marginBottom: 4 }}>
                        {rowsToPrint.map((b, index) => (
                          <div key={b.id} style={{ ...styles.reportGrid, ...styles.reportRow, marginBottom: index === rowsToPrint.length - 1 ? 0 : 2 }}>
                            <div>{index === 0 ? line : ""}</div>
                            <div>{index === 0 ? item.operator || "-" : ""}</div>
                            <div>{b.batch || "-"}</div>
                            <div>{b.die || ""}</div>
                            <div>{b.description || ""}</div>
                            <div>{index === 0 ? formatMaterials(item.materials) : ""}</div>
                          </div>
                        ))}
                        {item.notes.map((n) => (
                          <div key={n.id} style={{ ...styles.reportGrid, ...styles.reportPair }}>
                            <div style={{ gridColumn: "1 / 6", marginLeft: 20 }}>Note: {n.note || ""}</div>
                            <div style={{ gridColumn: "6 / 7" }}>{n.action || ""}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={styles.bottomNav}>
          <button onClick={() => setScreen("lines")} style={{ ...styles.button, ...styles.smallButton, ...(screen === "lines" ? styles.buttonPrimary : {}) }}>Lines</button>
          <button onClick={() => setScreen("entry")} style={{ ...styles.button, ...styles.smallButton, ...(screen === "entry" ? styles.buttonPrimary : {}) }}>Entry</button>
          <button onClick={() => setScreen("report")} style={{ ...styles.button, ...styles.smallButton, ...(screen === "report" ? styles.buttonPrimary : {}) }}>Report</button>
        </div>
      </div>
    </div>
  );
}
