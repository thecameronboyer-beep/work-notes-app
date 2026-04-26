import { useEffect, useMemo, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { FileText, Home, Menu, Settings, X } from "lucide-react";

const LINE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 24, 25, 26, 27, 28, 29, 30, 31];
const SHIFT_OPTIONS = ["A", "B", "C"];
const TABS = ["schedule", "troubleshoot", "materials"];
const SCREENS = ["lines", "entry", "report"];

const LINE_GROUPS = [
  { name: "Flex", lines: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  { name: "Custom", lines: [10, 11, 12, 13, 14, 15, 16, 17, 18] },
  { name: "Fence", lines: [24, 25, 26, 27, 28, 29, 30, 31] },
];

const TEMPERATURE_FIELDS = [
  ["zone1", "Zone 1"],
  ["zone2", "Zone 2"],
  ["zone3", "Zone 3"],
  ["zone4", "Zone 4"],
  ["zone5", "Zone 5"],
  ["clamp", "Clamp"],
  ["head", "Head"],
  ["die", "Die"],
];

const PROCESS_SETTING_GROUPS = [
  [
    ["vacuum", "Vacuum"],
    ["cooling", "Cooling"],
  ],
  [
    ["puller", "Puller"],
    ["lineSpeed", "Line Speed"],
    ["cutLength", "Cut Length"],
    ["perContainer", "Per Container"],
  ],
  [
    ["cutter", "Cutter"],
    ["offline", "Offline"],
    ["packing", "Packing"],
  ],
];

const PRODUCTION_SETTING_FIELDS = [
  ["gramWeight", "Gram Weight"],
  ["unitsProduced", "Units Produced"],
  ["containersProduced", "Containers Produced"],
];

const TIME_SETTING_FIELDS = [
  ["setupTime", "Set Up Time"],
  ["startupTime", "Start Up Time"],
  ["savingTime", "Saving Time"],
];

const ALL_SETTING_FIELDS = [
  ...TEMPERATURE_FIELDS,
  ["cooling", "Cooling"],
  ["vacuum", "Vacuum"],
  ["puller", "Puller"],
  ["lineSpeed", "Line Speed"],
  ["cutLength", "Cut Length"],
  ["perContainer", "Per Container"],
  ["cutter", "Cutter"],
  ["offline", "Offline"],
  ["packing", "Packing"],
  ...PRODUCTION_SETTING_FIELDS,
  ...TIME_SETTING_FIELDS,
];

const fantasyPanel = "linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,0) 28%), linear-gradient(180deg, #1a2528 0%, #10181c 100%)";
const fantasyButton = "linear-gradient(180deg, #29343a 0%, #151d21 100%)";
const fantasyInsetShadow = "inset 0 1px 0 rgba(255,255,255,.08), inset 0 -1px 0 rgba(0,0,0,.55)";

const styles = {
  page: {
    minHeight: "100svh",
    background: "#0a0f12",
    backgroundImage: "linear-gradient(90deg, #050708 0%, #101b21 50%, #050708 100%)",
    color: "#f1dfb6",
    fontFamily: "Georgia, 'Times New Roman', serif",
    boxSizing: "border-box",
  },
  appFrame: {
    width: "100%",
    maxWidth: 430,
    minHeight: "100svh",
    margin: "0 auto",
    position: "relative",
    overflow: "visible",
    background: "#111a1f",
    backgroundImage:
      "linear-gradient(180deg, rgba(234,196,116,.08), transparent 120px), linear-gradient(135deg, rgba(255,255,255,.025) 0 25%, transparent 25% 50%, rgba(0,0,0,.12) 50% 75%, transparent 75% 100%)",
    backgroundSize: "auto, 18px 18px",
    borderLeft: "1px solid #2b241b",
    borderRight: "1px solid #2b241b",
    boxShadow: "0 0 0 1px #050708, 0 22px 80px rgba(0,0,0,.52)",
  },
  homeHeader: { display: "flex", alignItems: "center", marginBottom: 10 },
  menuButton: {
    minHeight: 42,
    border: "1px solid #8d6b3c",
    background: fantasyButton,
    color: "#f6e4b7",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    boxShadow: `${fantasyInsetShadow}, 0 2px 0 #050708`,
  },
  menuScrim: { position: "absolute", top: 62, right: 0, bottom: 0, left: 0, zIndex: 30, border: 0, padding: 0, background: "rgba(0, 0, 0, .48)", cursor: "pointer" },
  sidePanel: {
    position: "absolute",
    top: 62,
    bottom: 0,
    left: 0,
    width: 210,
    zIndex: 35,
    background: "#0f171b",
    backgroundImage: "linear-gradient(180deg, rgba(212,166,92,.08), transparent 160px), linear-gradient(90deg, rgba(255,255,255,.035), transparent 38%)",
    color: "#f4e5bd",
    padding: 10,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    borderRight: "1px solid #8d6b3c",
    boxShadow: "10px 0 28px rgba(0,0,0,.42), inset -1px 0 0 rgba(255,255,255,.08)",
  },
  sideHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  sideTitle: { fontSize: 15, fontWeight: 900, color: "#e2bd73", textShadow: "0 1px 0 #000" },
  sideSection: { display: "grid", gap: 8, paddingBottom: 8, marginBottom: 2, borderBottom: "1px solid rgba(202,165,107,.34)" },
  sideCloseButton: {
    width: 36,
    height: 36,
    border: "1px solid #7b6038",
    borderRadius: 8,
    background: fantasyButton,
    color: "#f6e4b7",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: fantasyInsetShadow,
  },
  sideButton: {
    width: "100%",
    minHeight: 48,
    border: "1px solid #5f4a2c",
    background: "linear-gradient(180deg, rgba(44,57,63,.9), rgba(17,25,29,.95))",
    color: "#f4e5bd",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
    boxShadow: fantasyInsetShadow,
  },
  sideButtonActive: { background: "linear-gradient(180deg, #1d4c49, #122c2f)", color: "#ffe7ae", borderColor: "#d0a661" },
  reportScrim: { position: "absolute", top: 62, right: 0, bottom: 0, left: 0, zIndex: 40, border: 0, padding: 0, background: "rgba(0,0,0,.5)", cursor: "pointer" },
  secondaryPanel: {
    position: "absolute",
    top: 62,
    bottom: 0,
    left: 0,
    width: 210,
    zIndex: 45,
    background: "#11191d",
    color: "#f4e5bd",
    borderRight: "1px solid #8d6b3c",
    boxShadow: "10px 0 28px rgba(0,0,0,.42), inset -1px 0 0 rgba(255,255,255,.08)",
    padding: 10,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  secondaryHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  secondaryTitle: { fontSize: 15, fontWeight: 900, color: "#e2bd73", textShadow: "0 1px 0 #000" },
  closeButton: {
    width: 36,
    height: 36,
    border: "1px solid #7b6038",
    borderRadius: 8,
    background: fantasyButton,
    color: "#f6e4b7",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: fantasyInsetShadow,
  },
  container: { width: "100%", minWidth: 0, padding: 10, boxSizing: "border-box" },
  card: {
    background: fantasyPanel,
    border: "1px solid #6c5230",
    borderRadius: 8,
    color: "#f1dfb6",
    boxShadow: `${fantasyInsetShadow}, 0 2px 0 #050708, 0 10px 24px rgba(0,0,0,.28)`,
  },
  reportCard: {
    background: fantasyPanel,
    border: "1px solid #6c5230",
    borderRadius: 8,
    color: "#f1dfb6",
    boxShadow: `${fantasyInsetShadow}, 0 2px 0 #050708, 0 10px 24px rgba(0,0,0,.28)`,
    fontFamily: "Georgia, 'Times New Roman', serif",
  },
  printableReportCard: { background: "#fff", border: "1px solid #000", borderRadius: 0, color: "#000", boxShadow: "none", fontFamily: "Arial, sans-serif" },
  cardBody: { padding: 12 },
  label: { display: "block", fontSize: 14, fontWeight: 700, marginBottom: 6, color: "#d7c497" },
  input: {
    width: "100%",
    color: "#f8e9c4",
    boxSizing: "border-box",
    padding: "10px 12px",
    border: "1px solid #5f4a2c",
    borderRadius: 7,
    fontSize: 14,
    background: "#0d1417",
    outline: 0,
    colorScheme: "dark",
    boxShadow: "inset 0 1px 3px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.04)",
  },
  textarea: {
    width: "100%",
    color: "#f8e9c4",
    boxSizing: "border-box",
    padding: "10px 12px",
    border: "1px solid #5f4a2c",
    borderRadius: 7,
    fontSize: 14,
    minHeight: 74,
    resize: "vertical",
    background: "#0d1417",
    outline: 0,
    boxShadow: "inset 0 1px 3px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.04)",
  },
  button: {
    border: "1px solid #8d6b3c",
    background: fantasyButton,
    color: "#f3dfad",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 42,
    boxShadow: `${fantasyInsetShadow}, 0 2px 0 #050708`,
  },
  smallButton: { padding: "7px 9px", fontSize: 12, minHeight: 36 },
  buttonPrimary: {
    background: "linear-gradient(180deg, #1d5a4f 0%, #123134 100%)",
    color: "#ffe9b4",
    border: "1px solid #d0a661",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.12), inset 0 -1px 0 rgba(0,0,0,.62), 0 0 0 1px rgba(4,7,8,.7)",
  },
  reportButton: { border: "1px solid #8d6b3c", background: fantasyButton, color: "#f3dfad", borderRadius: 8, boxShadow: `${fantasyInsetShadow}, 0 2px 0 #050708`, fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 800 },
  printableReportButton: { border: "1px solid #000", background: "#fff", color: "#000", borderRadius: 3, boxShadow: "none", fontFamily: "Arial, sans-serif", fontWeight: 700 },
  printableReportButtonActive: { border: "1px solid #000", background: "#000", color: "#fff", borderRadius: 3, boxShadow: "none", fontFamily: "Arial, sans-serif", fontWeight: 700 },
  tabGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 10, position: "sticky", top: 0, zIndex: 20, background: "#11191d", paddingBottom: 8, borderBottom: "1px solid #6c5230" },
  tabButton: { padding: "7px 3px", fontSize: 11, minHeight: 38 },
  lineGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 },
  panelLineGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5, marginTop: 4 },
  lineColumn: { display: "flex", flexDirection: "column", gap: 6 },
  lineGroupTitle: { fontWeight: 900, textAlign: "left", fontSize: 14, marginBottom: 2, color: "#e2bd73", textShadow: "0 1px 0 #000" },
  panelLineGroupTitle: { fontWeight: 900, textAlign: "left", fontSize: 10, marginBottom: 2, color: "#caa56b" },
  lineButton: { minHeight: 48, fontSize: 18 },
  panelLineButton: { minHeight: 36, padding: "5px 3px", fontSize: 13, borderRadius: 8 },
  shiftGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 },
  twoColumnGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  temperatureGrid: { display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 6, direction: "rtl" },
  settingsGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 },
  settingsGridFour: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6 },
  settingsGridThree: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 },
  otherTimeGrid: { display: "grid", gridTemplateColumns: "80px minmax(0, 1fr) auto", gap: 6, alignItems: "end" },
  temperatureLabel: { display: "block", fontSize: 11, fontWeight: 800, marginBottom: 4, color: "#d7c497" },
  temperatureInput: {
    width: "100%",
    color: "#f8e9c4",
    boxSizing: "border-box",
    padding: "7px 5px",
    border: "1px solid #5f4a2c",
    borderRadius: 6,
    fontSize: 13,
    background: "#0d1417",
    outline: 0,
    colorScheme: "dark",
    boxShadow: "inset 0 1px 3px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.04)",
  },
  calculatedSetting: { marginTop: 8, border: "1px solid #6c5230", borderRadius: 7, padding: "8px 10px", background: "rgba(8,12,14,.72)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.05)" },
  calculatedValue: { fontSize: 18, fontWeight: 900, marginTop: 2, color: "#80d68a" },
  batchRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, alignItems: "end" },
  noteGrid: { display: "grid", gridTemplateColumns: "1fr", gap: 10 },
  subCard: { border: "1px solid #5f4a2c", borderRadius: 8, padding: 10, background: "rgba(7,12,14,.34)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.04)" },
  coexInset: { borderLeft: "3px solid #8d6b3c", paddingLeft: 8, marginTop: 10 },
  reportShell: { width: "100%", overflowX: "hidden", background: "#10181c", color: "#f1dfb6", fontFamily: "Georgia, 'Times New Roman', serif" },
  reportHeader: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", alignItems: "center", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #8d6b3c", color: "#e2bd73", textShadow: "0 1px 0 #000" },
  reportBlock: { border: "1px solid #6c5230", borderRadius: 8, padding: 6, marginBottom: 8, background: "rgba(7,12,14,.34)", color: "#f1dfb6", boxShadow: "inset 0 1px 0 rgba(255,255,255,.04)" },
  reportHeadRow: { fontSize: 10, fontWeight: 800, borderBottom: "1px solid rgba(202,165,107,.5)", paddingBottom: 3, marginBottom: 5, lineHeight: "12px", color: "#e2bd73" },
  reportRow: { fontSize: 10, lineHeight: "12px", alignItems: "start", wordBreak: "break-word", color: "#f1dfb6" },
  printableReportShell: { width: "100%", overflowX: "hidden", background: "#fff", color: "#000", fontFamily: "Arial, sans-serif" },
  printableReportHeader: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", alignItems: "center", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #000", color: "#000", textShadow: "none" },
  printableReportBlock: { border: "1px solid #000", borderRadius: 0, padding: 6, marginBottom: 8, background: "#fff", color: "#000", boxShadow: "none" },
  printableReportHeadRow: { fontSize: 10, fontWeight: 700, borderBottom: "1px solid #000", paddingBottom: 3, marginBottom: 5, lineHeight: "12px", color: "#000" },
  printableReportRow: { fontSize: 10, lineHeight: "12px", alignItems: "start", wordBreak: "break-word", color: "#000" },
  muted: { fontSize: 13, color: "#b5a88a" },
};

const getReportTheme = (printable) => ({
  card: printable ? styles.printableReportCard : styles.reportCard,
  shell: printable ? styles.printableReportShell : styles.reportShell,
  header: printable ? styles.printableReportHeader : styles.reportHeader,
  block: printable ? styles.printableReportBlock : styles.reportBlock,
  headRow: printable ? styles.printableReportHeadRow : styles.reportHeadRow,
  row: printable ? styles.printableReportRow : styles.reportRow,
  button: printable ? styles.printableReportButton : styles.reportButton,
  activeButton: printable ? styles.printableReportButtonActive : styles.buttonPrimary,
  settingCell: printable
    ? { border: "1px solid #000", borderRadius: 0, padding: 5, minWidth: 0, background: "#fff", color: "#000" }
    : { border: "1px solid #6c5230", borderRadius: 6, padding: 5, minWidth: 0, background: "rgba(8,12,14,.72)", color: "#f1dfb6", boxShadow: "inset 0 1px 0 rgba(255,255,255,.04)" },
  settingLabel: printable ? { fontSize: 9, fontWeight: 800, color: "#000", lineHeight: "11px" } : { fontSize: 9, fontWeight: 800, color: "#e2bd73", lineHeight: "11px" },
});

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
const parseSettingNumber = (value) => {
  const parsed = Number.parseFloat(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};
const calculateMinutesPerContainer = (temperatures) => {
  const lineSpeed = parseSettingNumber(temperatures?.lineSpeed);
  const cutLength = parseSettingNumber(temperatures?.cutLength);
  const perContainer = parseSettingNumber(temperatures?.perContainer);
  if (lineSpeed <= 0 || cutLength <= 0 || perContainer <= 0) return "";
  return ((cutLength * perContainer) / (lineSpeed * 12)).toFixed(1);
};
const calculateTotalTime = (temperatures, otherTimes = []) => {
  const standardTime = TIME_SETTING_FIELDS.reduce((total, [key]) => total + parseSettingNumber(temperatures?.[key]), 0);
  const extraTime = otherTimes.reduce((total, otherTime) => total + parseSettingNumber(otherTime?.time), 0);
  const total = standardTime + extraTime;
  return total > 0 ? total.toFixed(2).replace(/\.?0+$/, "") : "";
};
const tabLabel = (tab) => (tab === "troubleshoot" ? "Troubleshoot" : tab[0].toUpperCase() + tab.slice(1));
const reportTitle = (reportTab, selectedLine) => (reportTab === "line" ? `Line ${selectedLine}` : tabLabel(reportTab));

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
const createBatch = () => ({ id: makeId(), batch: "", die: "", itemNumber: "", description: "", quantity: "", confirmed: false });
const createNote = (batchId = "", die = "") => ({ id: makeId(), batchId, note: "", action: "", result: "", die, confirmed: false });
const createTemperatures = () => Object.fromEntries(ALL_SETTING_FIELDS.map(([key]) => [key, ""]));
const createOtherTime = () => ({ id: makeId(), time: "", description: "" });
const createLineData = () => ({ operator: "", temperatures: createTemperatures(), otherTimes: [], batches: [createBatch()], materials: [], notes: [] });
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
    itemNumber: batch?.itemNumber || "",
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

const normalizeTemperatures = (temperatures) => ({
  ...createTemperatures(),
  ...Object.fromEntries(ALL_SETTING_FIELDS.map(([key]) => [key, temperatures?.[key] || ""])),
  lineSpeed: temperatures?.lineSpeed || temperatures?.likespeed || "",
});
const normalizeOtherTimes = (otherTimes) => {
  if (!Array.isArray(otherTimes)) return [];
  return otherTimes.map((otherTime) => ({
    id: otherTime?.id || makeId(),
    time: otherTime?.time || "",
    description: otherTime?.description || "",
  }));
};

const normalizeSavedData = (savedData) => {
  const base = createAllLineData();

  Object.entries(savedData || {}).forEach(([line, lineData]) => {
    if (!base[line]) return;
    base[line] = {
      operator: lineData?.operator || "",
      temperatures: normalizeTemperatures(lineData?.temperatures),
      otherTimes: normalizeOtherTimes(lineData?.otherTimes),
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

const getFilledBatches = (lineData) => lineData.batches.filter((batch) => hasText(batch.batch) || hasText(batch.die) || hasText(batch.itemNumber) || hasText(batch.description) || hasText(batch.quantity));

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

function Field({ label, value, onChange, textarea = false, type = "text" }) {
  const Input = textarea ? "textarea" : "input";
  return (
    <div>
      <label style={styles.label}>{label}</label>
      <Input type={textarea ? undefined : type} value={value} onChange={(event) => onChange(event.target.value)} style={textarea ? styles.textarea : styles.input} />
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

function ReportSidePanel({ reportTab, selectedLine, onSelectReport, onSelectLine, onClose }) {
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

        <ReportPanelLineGrid selectedLine={selectedLine} onSelectLine={onSelectLine} />
      </aside>
    </>
  );
}

function ReportHeader({ title, date, shift, printable }) {
  const reportTheme = getReportTheme(printable);

  return (
    <div style={reportTheme.header}>
      <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 13, fontWeight: 700, textAlign: "left" }}>{formatDisplayDate(date)}</div>
      <div style={{ fontSize: 13, fontWeight: 700, textAlign: "right" }}>Shift {shift}</div>
    </div>
  );
}

function PdfButton({ onClick, isExporting, printable }) {
  const reportTheme = getReportTheme(printable);

  return (
    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 10 }}>
      <Button small onClick={onClick} disabled={isExporting} style={{ ...reportTheme.button, ...(isExporting ? { opacity: 0.7 } : {}) }}>
        {isExporting ? "PDF..." : "PDF"}
      </Button>
    </div>
  );
}

function LinesScreen({ data, selectedLine, onSelectLine }) {
  return (
    <Card>
      <LineButtonGrid data={data} selectedLine={selectedLine} onSelectLine={onSelectLine} />
    </Card>
  );
}

function LineButtonGrid({ data, selectedLine, onSelectLine }) {
  return (
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
  );
}

function ReportPanelLineGrid({ selectedLine, onSelectLine }) {
  return (
    <div style={styles.panelLineGrid}>
      {LINE_GROUPS.map((group) => (
        <div key={group.name} style={styles.lineColumn}>
          <div style={styles.panelLineGroupTitle}>{group.name}</div>
          {group.lines.map((line) => {
            return (
              <Button
                key={line}
                active={selectedLine === String(line)}
                small
                style={styles.panelLineButton}
                onClick={() => onSelectLine(line)}
              >
                {line}
              </Button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function MaterialFields({ material, canAddCoex, newCoexNumber, setNewCoexNumber, removeMaterial, updateMaterial, addCoex, updateCoex, removeCoex }) {
  const isEditing = !material.confirmed;

  return (
    <div style={styles.subCard}>
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
            <div key={coex.id} style={styles.coexInset}>
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
              <div key={coex.id} style={styles.coexInset}>
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
    <div style={styles.subCard}>
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
    <div style={styles.subCard}>
      <MaterialMixDisplay material={material} />

      {material.coexes.map((coex) => (
        <div key={coex.id} style={styles.coexInset}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Coex{String(coex.number).padStart(2, "0")}</div>
          <MaterialMixDisplay material={coex} />
        </div>
      ))}
    </div>
  );
}

function TroubleshootDisplay({ note }) {
  return (
    <div style={styles.subCard}>
      <DisplayGrid>
        <DisplayValue label="Issue" value={note.note} wide />
        <DisplayValue label="Troubleshooting Action" value={note.action} wide />
        <DisplayValue label="Result" value={note.result} wide />
      </DisplayGrid>
    </div>
  );
}

function TemperatureSettings({ temperatures, otherTimes, onChange, addOtherTime, updateOtherTime, removeOtherTime }) {
  const minutesPerContainer = calculateMinutesPerContainer(temperatures);
  const totalTime = calculateTotalTime(temperatures, otherTimes);
  const renderInput = ([key, label]) => (
    <div key={key} style={{ direction: "ltr" }}>
      <label style={styles.temperatureLabel}>{label}</label>
      <input
        inputMode="numeric"
        value={temperatures?.[key] || ""}
        onChange={(event) => onChange(key, event.target.value)}
        style={styles.temperatureInput}
      />
    </div>
  );

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <Card>
        <div style={styles.temperatureGrid}>{TEMPERATURE_FIELDS.map(renderInput)}</div>
      </Card>

      <Card>
        <div style={styles.settingsGrid}>{PROCESS_SETTING_GROUPS[0].map(renderInput)}</div>
      </Card>

      <Card>
        <div style={styles.settingsGridFour}>{PROCESS_SETTING_GROUPS[1].map(renderInput)}</div>
        <div style={styles.calculatedSetting}>
          <div style={styles.temperatureLabel}>Minutes Per Container</div>
          <div style={styles.calculatedValue}>{minutesPerContainer || "-"}</div>
        </div>
      </Card>

      <Card>
        <div style={styles.settingsGridThree}>{PROCESS_SETTING_GROUPS[2].map(renderInput)}</div>
      </Card>

      <Card>
        <div style={styles.settingsGridThree}>{PRODUCTION_SETTING_FIELDS.map(renderInput)}</div>
      </Card>

      <Card>
        <div style={styles.settingsGridThree}>{TIME_SETTING_FIELDS.map(renderInput)}</div>
        <div style={styles.calculatedSetting}>
          <div style={styles.temperatureLabel}>Total Time (must total 8)</div>
          <div style={styles.calculatedValue}>{totalTime || "-"}</div>
        </div>
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          {otherTimes.map((otherTime) => (
            <div key={otherTime.id} style={styles.otherTimeGrid}>
              <div>
                <label style={styles.temperatureLabel}>Time</label>
                <input
                  inputMode="numeric"
                  value={otherTime.time}
                  onChange={(event) => updateOtherTime(otherTime.id, "time", event.target.value)}
                  style={styles.temperatureInput}
                />
              </div>
              <div>
                <label style={styles.temperatureLabel}>Description</label>
                <input
                  value={otherTime.description}
                  onChange={(event) => updateOtherTime(otherTime.id, "description", event.target.value)}
                  style={styles.temperatureInput}
                />
              </div>
              <Button small onClick={() => removeOtherTime(otherTime.id)}>Delete</Button>
            </div>
          ))}
          <Button small onClick={addOtherTime}>Other Time</Button>
        </div>
      </Card>
    </div>
  );
}

function EntryScreen(props) {
  const {
    selectedLine,
    selected,
    goHome,
    goLineReport,
    showSettings,
    toggleSettings,
    updateOperator,
    updateTemperature,
    addOtherTime,
    updateOtherTime,
    removeOtherTime,
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
        <div style={{ display: "grid", gridTemplateColumns: "142px minmax(0, 1fr) 92px", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6, justifySelf: "start" }}>
            <Button small onClick={goHome} aria-label="Home" style={{ width: 42 }}>
              <Home size={16} aria-hidden="true" />
            </Button>
            <Button small active={showSettings} onClick={toggleSettings} aria-label="Line settings" style={{ width: 42 }}>
              <Settings size={16} aria-hidden="true" />
            </Button>
            <Button small onClick={goLineReport}>Report</Button>
          </div>

          <div style={{ fontWeight: 800, fontSize: 18, textAlign: "center" }}>Line {selectedLine}</div>

          {showSettings ? <div /> : <Button small onClick={addBatch} style={{ justifySelf: "stretch" }}>Add Batch</Button>}
        </div>
      </Card>

      {showSettings ? (
        <TemperatureSettings
          temperatures={selected.temperatures}
          otherTimes={selected.otherTimes || []}
          onChange={updateTemperature}
          addOtherTime={addOtherTime}
          updateOtherTime={updateOtherTime}
          removeOtherTime={removeOtherTime}
        />
      ) : (
        <>
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

                    <div style={{ marginTop: 10 }}>
                      <Field label="Item Number" value={batch.itemNumber} onChange={(value) => updateBatch(batch.id, "itemNumber", value)} />
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
                          <DisplayValue label="Item Number" value={batch.itemNumber} />
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
        </>
      )}
    </div>
  );
}

function ScheduleReport({ data, date, shift, exportReportPdf, isExporting, isPrintableReport }) {
  const grid = { display: "grid", gridTemplateColumns: "28px 48px 45px 30px 45px 1fr 48px", columnGap: 2, textAlign: "left" };
  const reportTheme = getReportTheme(isPrintableReport);

  return (
    <div>
      <PdfButton onClick={exportReportPdf} isExporting={isExporting} printable={isPrintableReport} />
      <div id="print-area" style={reportTheme.shell}>
        <ReportHeader title="Schedule" date={date} shift={shift} printable={isPrintableReport} />
        <div style={reportTheme.block}>
          <div style={{ ...grid, ...reportTheme.headRow }}>
            <div>Line</div><div>Operator</div><div>Batch</div><div>Die</div><div>Item #</div><div>Description</div><div>Qty</div>
          </div>
          {Object.entries(data).map(([line, lineData]) => {
            const filledBatches = getFilledBatches(lineData);
            const hasContent = hasText(lineData.operator) || filledBatches.length > 0;
            if (!hasContent) return null;

            const rowsToPrint = filledBatches.length ? filledBatches : [createBatch()];

            return (
              <div key={line} style={{ marginBottom: 4 }}>
                {rowsToPrint.map((batch, index) => (
                  <div key={batch.id} style={{ ...grid, ...reportTheme.row, marginBottom: index === rowsToPrint.length - 1 ? 0 : 2 }}>
                    <div>{index === 0 ? line : ""}</div>
                    <div>{index === 0 ? lineData.operator || "-" : ""}</div>
                    <div>{batch.batch || "-"}</div>
                    <div>{batch.die || ""}</div>
                    <div>{batch.itemNumber || ""}</div>
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

function TroubleshootReport({ data, date, shift, exportReportPdf, isExporting, isPrintableReport }) {
  const grid = { display: "grid", gridTemplateColumns: "28px 42px 1fr 1fr 1fr", columnGap: 2 };
  const reportTheme = getReportTheme(isPrintableReport);

  return (
    <div>
      <PdfButton onClick={exportReportPdf} isExporting={isExporting} printable={isPrintableReport} />
      <div id="print-area" style={reportTheme.shell}>
        <ReportHeader title="Troubleshoot" date={date} shift={shift} printable={isPrintableReport} />
        <div style={reportTheme.block}>
          <div style={{ ...grid, ...reportTheme.headRow }}>
            <div>Line</div><div>Die</div><div>Issue</div><div>Troubleshooting Action</div><div>Result</div>
          </div>
          {Object.entries(data).map(([line, lineData]) => {
            if (!lineData.notes.length) return null;
            const firstDie = lineData.batches?.[0]?.die || "";
            const batchesById = new Map((lineData.batches || []).map((batch) => [batch.id, batch]));

            return lineData.notes.map((note, index) => {
              const linkedBatch = batchesById.get(note.batchId);

              return (
                <div key={note.id} style={{ ...grid, ...reportTheme.row, marginBottom: 4 }}>
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

function MaterialsReport({ data, date, shift, exportReportPdf, isExporting, isPrintableReport }) {
  const grid = { display: "grid", gridTemplateColumns: "28px 45px 45px 1fr 1fr 1fr 1fr" };
  const reportTheme = getReportTheme(isPrintableReport);

  return (
    <div>
      <PdfButton onClick={exportReportPdf} isExporting={isExporting} printable={isPrintableReport} />
      <div id="print-area" style={reportTheme.shell}>
        <ReportHeader title="Materials" date={date} shift={shift} printable={isPrintableReport} />
        <div style={reportTheme.block}>
          <div style={{ ...grid, ...reportTheme.headRow }}>
            <div>Line</div><div>Die</div><div>Batch</div><div>Natural</div><div>Color</div><div>Regrind</div><div>Additive</div>
          </div>
          {Object.entries(data).map(([line, lineData]) => {
            const rows = getMaterialRowsForReport(line, lineData);
            if (!rows.length) return null;

            return rows.map((row, index) => (
              <div key={`${line}-${index}-${row.label}`} style={{ ...grid, ...reportTheme.row, marginBottom: 2 }}>
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

function LineReport({ selectedLine, data, date, shift, exportReportPdf, isExporting, isPrintableReport }) {
  const lineData = data[selectedLine] || createLineData();
  const batchGrid = { display: "grid", gridTemplateColumns: "42px 38px 45px 1fr 42px", columnGap: 3 };
  const materialGrid = { display: "grid", gridTemplateColumns: "38px 42px 42px 1fr 1fr 1fr 1fr", columnGap: 3 };
  const troubleGrid = { display: "grid", gridTemplateColumns: "42px 1fr 1fr 1fr", columnGap: 3 };
  const reportTheme = getReportTheme(isPrintableReport);
  const settingCell = reportTheme.settingCell;
  const settingLabel = reportTheme.settingLabel;
  const settingValue = { fontSize: 12, fontWeight: 800, marginTop: 2, minHeight: 14, wordBreak: "break-word" };
  const settingGrid = { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 5 };
  const materialRows = getMaterialRowsForReport(selectedLine, lineData);
  const filledBatches = getFilledBatches(lineData);
  const batchesToPrint = filledBatches.length ? filledBatches : lineData.batches;
  const minutesPerContainer = calculateMinutesPerContainer(lineData.temperatures);
  const totalTime = calculateTotalTime(lineData.temperatures, lineData.otherTimes);
  const processFields = [
    ["vacuum", "Vacuum"],
    ["cooling", "Cooling"],
    ["puller", "Puller"],
    ["lineSpeed", "Line Speed"],
    ["cutLength", "Cut Length"],
    ["perContainer", "Per Container"],
    ["minutesPerContainer", "Min/Container", minutesPerContainer],
    ["cutter", "Cutter"],
    ["offline", "Offline"],
    ["packing", "Packing"],
    ...PRODUCTION_SETTING_FIELDS,
    ...TIME_SETTING_FIELDS,
    ["totalTime", "Total Time (must total 8)", totalTime],
  ];
  const renderSetting = ([key, label, calculatedValue]) => (
    <div key={key} style={settingCell}>
      <div style={settingLabel}>{label}</div>
      <div style={settingValue}>{hasText(calculatedValue) ? calculatedValue : lineData.temperatures?.[key] || "-"}</div>
    </div>
  );

  return (
    <div>
      <PdfButton onClick={exportReportPdf} isExporting={isExporting} printable={isPrintableReport} />
      <div id="print-area" style={reportTheme.shell}>
        <ReportHeader title={`Line ${selectedLine} Report`} date={date} shift={shift} printable={isPrintableReport} />

        <div style={reportTheme.block}>
          <div style={{ ...reportTheme.headRow, borderBottom: 0, marginBottom: 4 }}>Line Information</div>
          <div style={settingGrid}>
            {[
              ["line", "Line", selectedLine],
              ["operator", "Operator", lineData.operator || "-"],
              ["date", "Date", formatDisplayDate(date)],
              ["shift", "Shift", shift],
            ].map(renderSetting)}
          </div>
        </div>

        <div style={reportTheme.block}>
          <div style={{ ...reportTheme.headRow, borderBottom: 0, marginBottom: 4 }}>Temperatures</div>
          <div style={settingGrid}>{TEMPERATURE_FIELDS.map(renderSetting)}</div>
        </div>

        <div style={reportTheme.block}>
          <div style={{ ...reportTheme.headRow, borderBottom: 0, marginBottom: 4 }}>Process</div>
          <div style={settingGrid}>{processFields.map(renderSetting)}</div>
        </div>

        {lineData.otherTimes?.length > 0 && (
          <div style={reportTheme.block}>
            <div style={{ ...troubleGrid, ...reportTheme.headRow }}>
              <div>Time</div><div>Description</div><div></div><div></div>
            </div>
            {lineData.otherTimes.map((otherTime) => (
              <div key={otherTime.id} style={{ ...troubleGrid, ...reportTheme.row, marginBottom: 4 }}>
                <div>{otherTime.time || ""}</div>
                <div>{otherTime.description || ""}</div>
                <div></div>
                <div></div>
              </div>
            ))}
          </div>
        )}

        <div style={reportTheme.block}>
          <div style={{ ...batchGrid, ...reportTheme.headRow }}>
            <div>Batch</div><div>Die</div><div>Item #</div><div>Description</div><div>Qty</div>
          </div>
          {batchesToPrint.map((batch) => (
            <div key={batch.id} style={{ ...batchGrid, ...reportTheme.row, marginBottom: 3 }}>
              <div>{batch.batch || "-"}</div>
              <div>{batch.die || ""}</div>
              <div>{batch.itemNumber || ""}</div>
              <div>{batch.description || ""}</div>
              <div>{batch.quantity || ""}</div>
            </div>
          ))}
        </div>

        {materialRows.length > 0 && (
          <div style={reportTheme.block}>
            <div style={{ ...materialGrid, ...reportTheme.headRow }}>
              <div>Item</div><div>Die</div><div>Batch</div><div>Natural</div><div>Color</div><div>Regrind</div><div>Additive</div>
            </div>
            {materialRows.map((row, index) => (
              <div key={`${row.batch}-${index}`} style={{ ...materialGrid, ...reportTheme.row, marginBottom: 3 }}>
                <div>{row.label || ""}</div>
                <div>{row.die}</div>
                <div>{row.batch}</div>
                <div>{row.natural}</div>
                <div>{row.color}</div>
                <div>{row.regrind}</div>
                <div>{row.additive}</div>
              </div>
            ))}
          </div>
        )}

        {lineData.notes.length > 0 && (
          <div style={reportTheme.block}>
            <div style={{ ...troubleGrid, ...reportTheme.headRow }}>
              <div>Die</div><div>Issue</div><div>Action</div><div>Result</div>
            </div>
            {lineData.notes.map((note) => {
              const linkedBatch = lineData.batches.find((batch) => batch.id === note.batchId);
              return (
                <div key={note.id} style={{ ...troubleGrid, ...reportTheme.row, marginBottom: 4 }}>
                  <div>{linkedBatch?.die || note.die || ""}</div>
                  <div>{note.note || ""}</div>
                  <div>{note.action || ""}</div>
                  <div>{note.result || ""}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ReportScreen({ reportTab, selectedLine, onOpenReportPanel, goHome, goLineView, data, isPrintableReport, togglePrintableReport, ...props }) {
  const reportTheme = getReportTheme(isPrintableReport);
  const printableButtonStyle = isPrintableReport ? reportTheme.activeButton : reportTheme.button;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Card style={{ ...reportTheme.card, position: "sticky", top: 0, zIndex: 60 }}>
        <div style={{ display: "grid", gridTemplateColumns: "92px minmax(0, 1fr) 142px", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6, justifySelf: "start" }}>
            <Button small onClick={goHome} aria-label="Home" style={{ ...reportTheme.button, width: 42 }}>
              <Home size={16} aria-hidden="true" />
            </Button>
            <Button small onClick={goLineView} style={reportTheme.button}>Line</Button>
          </div>

          <div style={{ fontWeight: 800, fontSize: isPrintableReport ? 16 : 18, textAlign: "center", whiteSpace: "nowrap", minWidth: 0 }}>
            {reportTitle(reportTab, selectedLine)}
          </div>

          <div style={{ display: "flex", gap: 6, justifySelf: "stretch" }}>
            <Button small onClick={togglePrintableReport} style={{ ...printableButtonStyle, flex: "1 1 0", padding: "7px 5px", fontSize: 11 }}>Printable</Button>
            <Button small onClick={onOpenReportPanel} style={{ ...reportTheme.button, flex: "1 1 0", padding: "7px 5px", fontSize: 11 }}>Reports</Button>
          </div>
        </div>
      </Card>

      <Card style={reportTheme.card}>
        {reportTab === "schedule" && <ScheduleReport data={data} isPrintableReport={isPrintableReport} {...props} />}
        {reportTab === "troubleshoot" && <TroubleshootReport data={data} isPrintableReport={isPrintableReport} {...props} />}
        {reportTab === "materials" && <MaterialsReport data={data} isPrintableReport={isPrintableReport} {...props} />}
        {reportTab === "line" && <LineReport selectedLine={selectedLine} data={data} isPrintableReport={isPrintableReport} {...props} />}
      </Card>
    </div>
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
  const [isPrintableReport, setIsPrintableReport] = useState(false);
  const [showLineSettings, setShowLineSettings] = useState(false);
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
  const addOtherTime = () => updateSelectedLine((lineData) => ({ ...lineData, otherTimes: [...(lineData.otherTimes || []), createOtherTime()] }));
  const updateOtherTime = (id, field, value) => {
    updateSelectedLine((lineData) => ({
      ...lineData,
      otherTimes: (lineData.otherTimes || []).map((otherTime) => (otherTime.id === id ? { ...otherTime, [field]: value } : otherTime)),
    }));
  };
  const removeOtherTime = (id) => updateSelectedLine((lineData) => ({ ...lineData, otherTimes: (lineData.otherTimes || []).filter((otherTime) => otherTime.id !== id) }));

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
      const canvas = await html2canvas(reportElement, { scale: 3, backgroundColor: isPrintableReport ? "#ffffff" : "#10181c", useCORS: true });
      const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "letter" });
      const margin = 24;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const usableWidth = pageWidth - margin * 2;
      const imageHeight = (canvas.height * usableWidth) / canvas.width;

      const reportName = reportTab === "line" ? `line_${selectedLine}` : reportTab;
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", margin, margin, usableWidth, imageHeight);
      pdf.save(`${reportName}_${sanitizeFilename(date)}_shift_${shift}.pdf`);
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
    setShowLineSettings(false);
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
    setShowLineSettings(false);
    setIsMenuOpen(false);
    setIsReportPanelOpen(false);
  };

  const goLineView = () => {
    setScreen("entry");
    setShowLineSettings(false);
    setIsMenuOpen(false);
    setIsReportPanelOpen(false);
  };

  const goLineReport = () => {
    setReportTab("line");
    setScreen("report");
    setShowLineSettings(false);
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
    setIsMenuOpen(true);
    setIsReportPanelOpen(true);
  };

  const selectReport = (tab) => {
    setReportTab(tab);
    setScreen("report");
    setShowLineSettings(false);
    setIsMenuOpen(false);
    setIsReportPanelOpen(false);
  };

  const selectReportLine = (line) => {
    setSelectedLine(String(line));
    setReportTab("line");
    setScreen("report");
    setShowLineSettings(false);
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
    goLineReport,
    showSettings: showLineSettings,
    toggleSettings: () => setShowLineSettings((isOpen) => !isOpen),
    updateOperator,
    updateTemperature: (field, value) => updateSelectedLine((lineData) => ({ ...lineData, temperatures: { ...createTemperatures(), ...lineData.temperatures, [field]: value } })),
    addOtherTime,
    updateOtherTime,
    removeOtherTime,
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
    goHome,
    goLineView,
    selectedLine,
    onOpenReportPanel: openReportPanel,
    isPrintableReport,
    togglePrintableReport: () => setIsPrintableReport((isPrintable) => !isPrintable),
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
        {isReportPanelOpen && (
          <ReportSidePanel
            reportTab={reportTab}
            selectedLine={selectedLine}
            onSelectReport={selectReport}
            onSelectLine={selectReportLine}
            onClose={() => setIsReportPanelOpen(false)}
          />
        )}

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
