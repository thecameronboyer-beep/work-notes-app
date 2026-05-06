import { useEffect, useMemo, useState } from "react";
import { Clock, Home, Menu, Minus, Pencil, Plus, Settings, Sparkles, X } from "lucide-react";

const LINE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 24, 25, 26, 27, 28, 29, 30, 31];
const SHIFT_OPTIONS = ["A", "B", "C"];
const REPORT_TABS = ["schedule", "materials", "troubleshoot", "full", "weekly"];
const FIVE_S_STEPS = [
  {
    title: "Sort",
    description: "Remove items that are not needed.",
    descriptionParts: [{ text: "Remove", highlight: true }, { text: " items that are not needed." }],
    listTitle: "Questions:",
    items: ["Do we use this?", "How often?", "Does it belong here?"],
    goal: "The goal is to eliminate clutter and free up space.",
  },
  {
    title: "Set in Order",
    description: "Organize everything so it has a specific place.",
    descriptionParts: [{ text: "Organize", highlight: true }, { text: " everything so it has a specific place." }],
    listTitle: "People should be able to:",
    items: ["find tools quickly", "return items easily", "immediately notice when something is missing"],
    goal: "The goal is to reduce wasted time and frustration.",
  },
  {
    title: "Shine",
    description: "Cleaned and inspected regularly.",
    descriptionParts: [{ text: "Cleaned", highlight: true }, { text: " and inspected regularly." }],
    listTitle: "Cleaning is also a way to notice:",
    items: ["damage", "wear", "leaks", "safety issues", "equipment problems"],
    goal: "The goal is to prevent issues before they become larger problems.",
  },
  {
    title: "Standardize",
    description: "Consistent methods and expectations.",
    descriptionParts: [
      { text: "Consistent", highlight: true },
      { text: " methods and " },
      { text: "expectations", highlight: true },
      { text: "." },
    ],
    listTitle: "Examples:",
    items: ["standard layouts", "checklists", "labels", "procedures", "routines"],
    goal: "The goal is consistency so work is done the same way regardless of who performs it.",
  },
  {
    title: "Sustain",
    description: "Maintain the system over time.",
    descriptionParts: [{ text: "Maintain", highlight: true }, { text: " the system over time." }],
    listTitle: "This step focuses on:",
    items: ["habits", "accountability", "training", "regular review"],
    goal: "Without sustain, organization slowly breaks down and old habits return.\n\nThe goal is long-term discipline and consistency.",
  },
];
const FIVE_S_IMPROVEMENTS = ["efficiency", "cleanliness", "consistency", "safety", "workflow"];
const FIVE_S_REDUCES = ["wasted motion", "lost items", "clutter", "downtime", "confusion", "inconsistent work", "preventable mistakes"];
const FIVE_S_SYSTEM_GOALS = ["people can work more efficiently", "problems are easier to spot", "workflows are easier to maintain", "standards are clear"];
const ACTIVE_DATE_STORAGE_KEY = "work-notes-active-date";
const ACTIVE_SHIFT_STORAGE_KEY = "work-notes-active-shift";
const LINE_VISIBILITY_STORAGE_KEY = "work-notes-line-visibility";
const UI_COLLAPSE_STORAGE_KEY = "work-notes-ui-collapse";
const DIE_SETTINGS_STORAGE_KEY = "work-notes-die-settings";
const FIVE_S_NOTES_STORAGE_PREFIX = "work-notes-five-s";
const THEME_STORAGE_KEY = "work-notes-theme";
const THEME_DEFAULT = "default";
const THEME_PINK = "pink";
const THEME_OPTIONS = [
  [THEME_DEFAULT, "Default"],
  [THEME_PINK, "Pink"],
];
const PDF_MARGIN = 24;
const PDF_CANVAS_SCALE = 3;
const PDF_CARD_SPLIT_BLANK_THRESHOLD = 0.2;
const ACTION_TYPE_TEMP_ADJUSTMENT = "tempAdjustment";
const ACTION_TYPE_OTHER = "other";
const ACTION_TYPE_OPTIONS = [
  [ACTION_TYPE_TEMP_ADJUSTMENT, "Temp Adjustment"],
  [ACTION_TYPE_OTHER, "Other"],
];
const ACTION_TYPE_MENU_OPTIONS = [[ACTION_TYPE_TEMP_ADJUSTMENT, "Temp Adjustment"]];
const CALCULATOR_GRAM_RPM = "gramRpm";
const CALCULATOR_GRAM_LINE_SPEED = "gramLineSpeed";
const CALCULATOR_CUT_TIMER = "cutTimer";
const CALCULATOR_OPTIONS = [
  [CALCULATOR_GRAM_RPM, "Gram Weight VIA RPMS"],
  [CALCULATOR_GRAM_LINE_SPEED, "Gram Weight VIA Line Speed"],
  [CALCULATOR_CUT_TIMER, "Cut Length VIA Timer"],
];
const CALCULATOR_FIELDS = {
  [CALCULATOR_GRAM_RPM]: [
    ["currentGramPerFoot", "Current Gram/ft"],
    ["targetGramPerFoot", "Target Gram/ft"],
    ["currentRpm", "Current RPM"],
  ],
  [CALCULATOR_GRAM_LINE_SPEED]: [
    ["currentGramPerFoot", "Current Gram/ft"],
    ["targetGramPerFoot", "Target Gram/ft"],
    ["currentLineSpeed", "Current Line Speed"],
  ],
  [CALCULATOR_CUT_TIMER]: [
    ["currentCutLength", "Current Cut Length"],
    ["currentCutTime", "Current Cut Time"],
    ["targetCutLength", "Target Cut Length"],
  ],
};
const CALCULATOR_RESULTS = {
  [CALCULATOR_GRAM_RPM]: "New RPM",
  [CALCULATOR_GRAM_LINE_SPEED]: "New Line Speed",
  [CALCULATOR_CUT_TIMER]: "New Timer Result",
};

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

const AUX_TEMPERATURE_FIELDS = [
  ["temperatureN", "N"],
  ["temperatureS", "S"],
  ["temperatureT", "T"],
  ["temperatureB", "B"],
];

const DIE_NUMBER_FIELD = ["dieNumber", "Die #"];

const PROCESS_SETTING_FIELDS = [
  ["vacuum", "Vacuum"],
  ["cooling", "Cooling"],
  ["puller", "Puller"],
  ["cutter", "Cutter"],
  ["offline", "Offline"],
  ["packing", "Packing"],
];

const PRODUCTION_SETTING_FIELDS = [
  ["gramWeight", "Gram Weight"],
  ["settingsLineSpeed", "Line Speed"],
  ["rpms", "RPM's"],
];

const DIE_SETTING_FIELDS = [
  DIE_NUMBER_FIELD,
  ...TEMPERATURE_FIELDS,
  ...AUX_TEMPERATURE_FIELDS,
  ...PROCESS_SETTING_FIELDS,
  ...PRODUCTION_SETTING_FIELDS,
];

const LINE_RATE_FIELDS = [
  ["lineSpeed", "Line Speed"],
  ["cutLength", "Cut Length"],
  ["perContainer", "Per Container"],
  ["currentContainer", "Current Container"],
  ["totalContainers", "Total Containers"],
];

const ALL_SETTING_FIELDS = [
  DIE_NUMBER_FIELD,
  ...TEMPERATURE_FIELDS,
  ...AUX_TEMPERATURE_FIELDS,
  ["cooling", "Cooling"],
  ["vacuum", "Vacuum"],
  ["puller", "Puller"],
  ...LINE_RATE_FIELDS,
  ["cutter", "Cutter"],
  ["offline", "Offline"],
  ["packing", "Packing"],
  ...PRODUCTION_SETTING_FIELDS,
];

const darkPanel = "linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,0) 28%), linear-gradient(180deg, #1a2528 0%, #10181c 100%)";
const darkButton = "linear-gradient(180deg, #29343a 0%, #151d21 100%)";
const insetShadow = "inset 0 1px 0 rgba(255,255,255,.08), inset 0 -1px 0 rgba(0,0,0,.55)";
const appFont = "Georgia, 'Times New Roman', serif";
const titleGold = "#e2bd73";
const defaultThemeVariables = {
  "--wn-page-bg": "#0a0f12",
  "--wn-page-bg-image": "linear-gradient(90deg, #050708 0%, #101b21 50%, #050708 100%), repeating-linear-gradient(135deg, rgba(255,255,255,.035) 0 10px, transparent 10px 22px)",
  "--wn-app-bg": "#111a1f",
  "--wn-app-bg-image": "linear-gradient(180deg, rgba(234,196,116,.08), transparent 120px), linear-gradient(135deg, rgba(255,255,255,.025) 0 25%, transparent 25% 50%, rgba(0,0,0,.12) 50% 75%, transparent 75% 100%)",
  "--wn-app-border": "#2b241b",
  "--wn-app-shadow": "0 0 0 1px #050708, 0 22px 80px rgba(0,0,0,.52)",
  "--wn-text": "#f1dfb6",
  "--wn-muted": "#b5a88a",
  "--wn-title": titleGold,
  "--wn-title-shadow": "0 1px 0 #000",
  "--wn-font": appFont,
  "--wn-card-bg": darkPanel,
  "--wn-card-border": "#6c5230",
  "--wn-card-radius": "8px",
  "--wn-card-shadow": `${insetShadow}, 0 2px 0 #050708, 0 10px 24px rgba(0,0,0,.28)`,
  "--wn-button-bg": darkButton,
  "--wn-button-text": "#f3dfad",
  "--wn-button-border": "#8d6b3c",
  "--wn-button-radius": "8px",
  "--wn-button-shadow": `${insetShadow}, 0 2px 0 #050708`,
  "--wn-button-primary-shadow": "inset 0 1px 0 rgba(255,255,255,.12), inset 0 -1px 0 rgba(0,0,0,.62), 0 0 0 1px rgba(4,7,8,.7)",
  "--wn-button-primary-bg": "linear-gradient(180deg, #1d5a4f 0%, #123134 100%)",
  "--wn-button-primary-text": "#ffe9b4",
  "--wn-button-primary-border": "#d0a661",
  "--wn-input-bg": "#0d1417",
  "--wn-input-text": "#f8e9c4",
  "--wn-input-border": "#5f4a2c",
  "--wn-input-radius": "7px",
  "--wn-input-shadow": "inset 0 1px 3px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.04)",
  "--wn-focus-glow": "transparent",
  "--wn-color-scheme": "dark",
  "--wn-label": "#d7c497",
  "--wn-side-bg": "#0f171b",
  "--wn-side-bg-image": "linear-gradient(180deg, rgba(212,166,92,.08), transparent 160px), linear-gradient(90deg, rgba(255,255,255,.035), transparent 38%)",
  "--wn-side-border": "#8d6b3c",
  "--wn-side-button-bg": "linear-gradient(180deg, rgba(44,57,63,.9), rgba(17,25,29,.95))",
  "--wn-side-button-active-bg": "linear-gradient(180deg, #1d4c49, #122c2f)",
  "--wn-side-button-active-text": "#ffe7ae",
  "--wn-subcard-bg": "rgba(7,12,14,.34)",
  "--wn-success": "#80d68a",
  "--wn-report-bg": "#10181c",
  "--wn-topbar-bg": darkPanel,
  "--wn-topbar-shadow": `${insetShadow}, 0 2px 0 #050708, 0 10px 24px rgba(0,0,0,.28)`,
  "--wn-line-toggle-bg": "linear-gradient(180deg, rgba(35,43,47,.72), rgba(13,18,20,.82))",
  "--wn-line-toggle-text": "#a39370",
  "--wn-line-toggle-border": "#4f3d25",
};
const pinkThemeVariables = {
  ...defaultThemeVariables,
  "--wn-page-bg": "#fff1f5",
  "--wn-page-bg-image": "linear-gradient(180deg, rgba(249,168,212,.48), rgba(255,241,245,.75) 190px, #fff1f5 420px)",
  "--wn-app-bg": "#fff7fb",
  "--wn-app-bg-image": "linear-gradient(135deg, rgba(236,72,153,.18), rgba(249,168,212,.18) 42%, rgba(255,255,255,.9))",
  "--wn-app-border": "#fbcfe8",
  "--wn-app-shadow": "0 20px 55px rgba(236,72,153,.13)",
  "--wn-text": "#374151",
  "--wn-muted": "#6b7280",
  "--wn-title": "#ec4899",
  "--wn-title-shadow": "none",
  "--wn-font": "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  "--wn-card-bg": "#ffffff",
  "--wn-card-border": "#fbcfe8",
  "--wn-card-radius": "22px",
  "--wn-card-shadow": "0 16px 34px rgba(236,72,153,.15)",
  "--wn-button-bg": "linear-gradient(180deg, #ffffff 0%, #fff5fa 100%)",
  "--wn-button-text": "#ec4899",
  "--wn-button-border": "#f9a8d4",
  "--wn-button-radius": "999px",
  "--wn-button-shadow": "0 9px 18px rgba(236,72,153,.12)",
  "--wn-button-primary-shadow": "0 10px 20px rgba(236,72,153,.22)",
  "--wn-button-primary-bg": "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
  "--wn-button-primary-text": "#ffffff",
  "--wn-button-primary-border": "#ec4899",
  "--wn-input-bg": "#ffffff",
  "--wn-input-text": "#374151",
  "--wn-input-border": "#fbcfe8",
  "--wn-input-radius": "18px",
  "--wn-input-shadow": "0 3px 12px rgba(236,72,153,.07)",
  "--wn-focus-glow": "rgba(236,72,153,.18)",
  "--wn-color-scheme": "light",
  "--wn-label": "#9d174d",
  "--wn-side-bg": "#ffffff",
  "--wn-side-bg-image": "linear-gradient(180deg, rgba(249,168,212,.26), transparent 190px)",
  "--wn-side-border": "#f9a8d4",
  "--wn-side-button-bg": "linear-gradient(180deg, #ffffff 0%, #fff5fa 100%)",
  "--wn-side-button-active-bg": "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
  "--wn-side-button-active-text": "#ffffff",
  "--wn-subcard-bg": "#fff7fb",
  "--wn-success": "#ec4899",
  "--wn-report-bg": "#fff7fb",
  "--wn-topbar-bg": "linear-gradient(135deg, #ffffff 0%, #ffe4f0 48%, #fbcfe8 100%)",
  "--wn-topbar-shadow": "0 14px 28px rgba(236,72,153,.15)",
  "--wn-line-toggle-bg": "linear-gradient(180deg, #fff5fa, #ffe4f0)",
  "--wn-line-toggle-text": "#9d174d",
  "--wn-line-toggle-border": "#fbcfe8",
};
const getThemeVariables = (theme) => (theme === THEME_PINK ? pinkThemeVariables : defaultThemeVariables);

const styles = {
  page: {
    minHeight: "100svh",
    background: "var(--wn-page-bg, #0a0f12)",
    backgroundImage:
      "var(--wn-page-bg-image, linear-gradient(90deg, #050708 0%, #101b21 50%, #050708 100%), repeating-linear-gradient(135deg, rgba(255,255,255,.035) 0 10px, transparent 10px 22px))",
    color: "var(--wn-text, #f1dfb6)",
    fontFamily: "var(--wn-font, Georgia, 'Times New Roman', serif)",
    boxSizing: "border-box",
  },
  appFrame: {
    width: "100%",
    maxWidth: 430,
    minHeight: "100svh",
    margin: "0 auto",
    position: "relative",
    overflow: "visible",
    background: "var(--wn-app-bg, #111a1f)",
    backgroundImage:
      "var(--wn-app-bg-image, linear-gradient(180deg, rgba(234,196,116,.08), transparent 120px), linear-gradient(135deg, rgba(255,255,255,.025) 0 25%, transparent 25% 50%, rgba(0,0,0,.12) 50% 75%, transparent 75% 100%))",
    backgroundSize: "auto, 18px 18px",
    borderLeft: "1px solid var(--wn-app-border, #2b241b)",
    borderRight: "1px solid var(--wn-app-border, #2b241b)",
    boxShadow: "var(--wn-app-shadow, 0 0 0 1px #050708, 0 22px 80px rgba(0,0,0,.52))",
  },
  homeHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 },
  screenTitle: { fontWeight: 800, fontSize: 18, textAlign: "center", color: "var(--wn-title, #e2bd73)", textShadow: "var(--wn-title-shadow, 0 1px 0 #000)" },
  menuButton: {
    minHeight: 42,
    border: "1px solid var(--wn-button-border, #8d6b3c)",
    background: "var(--wn-button-bg, linear-gradient(180deg, #29343a 0%, #151d21 100%))",
    color: "var(--wn-button-text, #f6e4b7)",
    borderRadius: "var(--wn-button-radius, 8px)",
    padding: "8px 10px",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    boxShadow: "var(--wn-button-shadow, inset 0 1px 0 rgba(255,255,255,.08), inset 0 -1px 0 rgba(0,0,0,.55), 0 2px 0 #050708)",
    transition: "transform .14s ease, box-shadow .16s ease, background .16s ease",
  },
  editIconButton: {
    width: 42,
    minHeight: 42,
    border: "1px solid var(--wn-button-border, #8d6b3c)",
    background: "var(--wn-button-bg, linear-gradient(180deg, #29343a 0%, #151d21 100%))",
    color: "var(--wn-button-text, #f6e4b7)",
    borderRadius: "var(--wn-button-radius, 8px)",
    padding: 0,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "var(--wn-button-shadow, inset 0 1px 0 rgba(255,255,255,.08), inset 0 -1px 0 rgba(0,0,0,.55), 0 2px 0 #050708)",
    transition: "transform .14s ease, box-shadow .16s ease, background .16s ease",
  },
  menuScrim: { position: "absolute", top: 62, right: 0, bottom: 0, left: 0, zIndex: 30, border: 0, padding: 0, background: "rgba(0, 0, 0, .48)", cursor: "pointer" },
  sidePanel: {
    position: "absolute",
    top: 62,
    bottom: 0,
    left: 0,
    width: 210,
    zIndex: 35,
    background: "var(--wn-side-bg, #0f171b)",
    backgroundImage: "var(--wn-side-bg-image, linear-gradient(180deg, rgba(212,166,92,.08), transparent 160px), linear-gradient(90deg, rgba(255,255,255,.035), transparent 38%))",
    color: "var(--wn-text, #f4e5bd)",
    padding: 10,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    borderRight: "1px solid var(--wn-side-border, #8d6b3c)",
    boxShadow: "var(--wn-card-shadow, 10px 0 28px rgba(0,0,0,.42), inset -1px 0 0 rgba(255,255,255,.08))",
  },
  sideSection: { display: "grid", gap: 8, paddingBottom: 8, marginBottom: 2, borderBottom: "1px solid var(--wn-card-border, rgba(202,165,107,.34))" },
  sideButton: {
    width: "100%",
    minHeight: 48,
    border: "1px solid var(--wn-button-border, #5f4a2c)",
    background: "var(--wn-side-button-bg, linear-gradient(180deg, rgba(44,57,63,.9), rgba(17,25,29,.95)))",
    color: "var(--wn-text, #f4e5bd)",
    borderRadius: "var(--wn-button-radius, 8px)",
    padding: "8px 10px",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
    boxShadow: "var(--wn-button-shadow, inset 0 1px 0 rgba(255,255,255,.08), inset 0 -1px 0 rgba(0,0,0,.55))",
    transition: "transform .14s ease, box-shadow .16s ease, background .16s ease",
  },
  sideButtonActive: { background: "var(--wn-side-button-active-bg, linear-gradient(180deg, #1d4c49, #122c2f))", color: "var(--wn-side-button-active-text, #ffe7ae)", borderColor: "var(--wn-button-primary-border, #d0a661)" },
  sideFooter: { marginTop: "auto", paddingTop: 10, borderTop: "1px solid var(--wn-card-border, rgba(202,165,107,.34))" },
  reportScrim: { position: "absolute", top: 62, right: 0, bottom: 0, left: 0, zIndex: 40, border: 0, padding: 0, background: "rgba(0,0,0,.5)", cursor: "pointer" },
  secondaryPanel: {
    position: "absolute",
    top: 62,
    bottom: 0,
    left: 0,
    width: 210,
    zIndex: 45,
    background: "var(--wn-side-bg, #11191d)",
    color: "var(--wn-text, #f4e5bd)",
    borderRight: "1px solid var(--wn-side-border, #8d6b3c)",
    boxShadow: "var(--wn-card-shadow, 10px 0 28px rgba(0,0,0,.42), inset -1px 0 0 rgba(255,255,255,.08))",
    padding: 10,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  secondaryHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  secondaryTitle: { fontSize: 15, fontWeight: 900, color: "var(--wn-title, #e2bd73)", textShadow: "var(--wn-title-shadow, 0 1px 0 #000)" },
  closeButton: {
    width: 36,
    height: 36,
    border: "1px solid var(--wn-button-border, #7b6038)",
    borderRadius: "var(--wn-button-radius, 8px)",
    background: "var(--wn-button-bg, linear-gradient(180deg, #29343a 0%, #151d21 100%))",
    color: "var(--wn-button-text, #f6e4b7)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "var(--wn-button-shadow, inset 0 1px 0 rgba(255,255,255,.08), inset 0 -1px 0 rgba(0,0,0,.55))",
  },
  topBarCard: {
    background: "var(--wn-topbar-bg, var(--wn-card-bg, linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,0) 28%), linear-gradient(180deg, #1a2528 0%, #10181c 100%)))",
    boxShadow: "var(--wn-topbar-shadow, var(--wn-card-shadow, inset 0 1px 0 rgba(255,255,255,.08), inset 0 -1px 0 rgba(0,0,0,.55), 0 2px 0 #050708, 0 10px 24px rgba(0,0,0,.28)))",
  },
  container: { width: "100%", minWidth: 0, padding: 10, boxSizing: "border-box" },
  card: {
    background: "var(--wn-card-bg, linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,0) 28%), linear-gradient(180deg, #1a2528 0%, #10181c 100%))",
    border: "1px solid var(--wn-card-border, #6c5230)",
    borderRadius: "var(--wn-card-radius, 8px)",
    color: "var(--wn-text, #f1dfb6)",
    boxShadow: "var(--wn-card-shadow, inset 0 1px 0 rgba(255,255,255,.08), inset 0 -1px 0 rgba(0,0,0,.55), 0 2px 0 #050708, 0 10px 24px rgba(0,0,0,.28))",
  },
  reportCard: {
    background: "var(--wn-card-bg, linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,0) 28%), linear-gradient(180deg, #1a2528 0%, #10181c 100%))",
    border: "1px solid var(--wn-card-border, #6c5230)",
    borderRadius: "var(--wn-card-radius, 8px)",
    color: "var(--wn-text, #f1dfb6)",
    boxShadow: "var(--wn-card-shadow, inset 0 1px 0 rgba(255,255,255,.08), inset 0 -1px 0 rgba(0,0,0,.55), 0 2px 0 #050708, 0 10px 24px rgba(0,0,0,.28))",
    fontFamily: "var(--wn-font, Georgia, 'Times New Roman', serif)",
  },
  printableReportCard: { background: "#fff", border: "1px solid #000", borderRadius: 0, color: "#000", boxShadow: "none", fontFamily: "Arial, sans-serif" },
  cardBody: { padding: 12 },
  label: { display: "block", fontSize: 14, fontWeight: 700, marginBottom: 6, color: "var(--wn-label, #d7c497)" },
  input: {
    width: "100%",
    color: "var(--wn-input-text, #f8e9c4)",
    boxSizing: "border-box",
    padding: "10px 12px",
    border: "1px solid var(--wn-input-border, #5f4a2c)",
    borderRadius: "var(--wn-input-radius, 7px)",
    fontSize: 14,
    background: "var(--wn-input-bg, #0d1417)",
    outline: 0,
    colorScheme: "var(--wn-color-scheme, dark)",
    boxShadow: "var(--wn-input-shadow, inset 0 1px 3px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.04))",
  },
  textarea: {
    width: "100%",
    color: "var(--wn-input-text, #f8e9c4)",
    boxSizing: "border-box",
    padding: "10px 12px",
    border: "1px solid var(--wn-input-border, #5f4a2c)",
    borderRadius: "var(--wn-input-radius, 7px)",
    fontSize: 14,
    minHeight: 74,
    resize: "vertical",
    background: "var(--wn-input-bg, #0d1417)",
    outline: 0,
    boxShadow: "var(--wn-input-shadow, inset 0 1px 3px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.04))",
  },
  button: {
    border: "1px solid var(--wn-button-border, #8d6b3c)",
    background: "var(--wn-button-bg, linear-gradient(180deg, #29343a 0%, #151d21 100%))",
    color: "var(--wn-button-text, #f3dfad)",
    borderRadius: "var(--wn-button-radius, 8px)",
    padding: "10px 12px",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 42,
    boxShadow: "var(--wn-button-shadow, inset 0 1px 0 rgba(255,255,255,.08), inset 0 -1px 0 rgba(0,0,0,.55), 0 2px 0 #050708)",
    transition: "transform .14s ease, box-shadow .16s ease, background .16s ease",
  },
  smallButton: { padding: "7px 9px", fontSize: 12, minHeight: 36 },
  buttonPrimary: {
    background: "var(--wn-button-primary-bg, linear-gradient(180deg, #1d5a4f 0%, #123134 100%))",
    color: "var(--wn-button-primary-text, #ffe9b4)",
    border: "1px solid var(--wn-button-primary-border, #d0a661)",
    boxShadow: "var(--wn-button-primary-shadow, inset 0 1px 0 rgba(255,255,255,.12), inset 0 -1px 0 rgba(0,0,0,.62), 0 0 0 1px rgba(4,7,8,.7))",
  },
  reportButton: { border: "1px solid var(--wn-button-border, #8d6b3c)", background: "var(--wn-button-bg, linear-gradient(180deg, #29343a 0%, #151d21 100%))", color: "var(--wn-button-text, #f3dfad)", borderRadius: "var(--wn-button-radius, 8px)", boxShadow: "var(--wn-button-shadow, inset 0 1px 0 rgba(255,255,255,.08), inset 0 -1px 0 rgba(0,0,0,.55), 0 2px 0 #050708)", fontFamily: "var(--wn-font, Georgia, 'Times New Roman', serif)", fontWeight: 800 },
  printableReportButton: { border: "1px solid #000", background: "#fff", color: "#000", borderRadius: 3, boxShadow: "none", fontFamily: "Arial, sans-serif", fontWeight: 700 },
  printableReportButtonActive: { border: "1px solid #000", background: "#000", color: "#fff", borderRadius: 3, boxShadow: "none", fontFamily: "Arial, sans-serif", fontWeight: 700 },
  tabGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 10, position: "sticky", top: 0, zIndex: 20, background: "var(--wn-app-bg, #11191d)", paddingBottom: 8, borderBottom: "1px solid var(--wn-card-border, #6c5230)" },
  tabButton: { padding: "7px 3px", fontSize: 11, minHeight: 38 },
  lineGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 },
  panelLineGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5, marginTop: 4 },
  lineColumn: { display: "flex", flexDirection: "column", gap: 6 },
  lineGroupTitle: { fontWeight: 900, textAlign: "left", fontSize: 14, marginBottom: 2, color: "var(--wn-title, #e2bd73)", textShadow: "var(--wn-title-shadow, 0 1px 0 #000)" },
  lineGroupButton: { width: "100%", minHeight: 34, padding: "6px 7px", fontSize: 13, justifyContent: "flex-start" },
  panelLineGroupTitle: { fontWeight: 900, textAlign: "left", fontSize: 10, marginBottom: 2, color: "var(--wn-title, #caa56b)" },
  lineButton: { minHeight: 48, fontSize: 18 },
  lineToggleOff: { opacity: 0.45, borderColor: "var(--wn-line-toggle-border, #4f3d25)", color: "var(--wn-line-toggle-text, #a39370)", background: "var(--wn-line-toggle-bg, linear-gradient(180deg, rgba(35,43,47,.72), rgba(13,18,20,.82)))" },
  panelLineButton: { minHeight: 36, padding: "5px 3px", fontSize: 13, borderRadius: 8 },
  shiftGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 },
  twoColumnGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  temperatureGrid: { display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 6, direction: "rtl" },
  settingsGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 },
  settingsGridFour: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6 },
  settingsGridThree: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 },
  otherTimeGrid: { display: "grid", gridTemplateColumns: "80px minmax(0, 1fr) auto", gap: 6, alignItems: "end" },
  temperatureLabel: { display: "block", fontSize: 11, fontWeight: 800, marginBottom: 4, color: "var(--wn-label, #d7c497)" },
  temperatureInput: {
    width: "100%",
    color: "var(--wn-input-text, #f8e9c4)",
    boxSizing: "border-box",
    padding: "7px 5px",
    border: "1px solid var(--wn-input-border, #5f4a2c)",
    borderRadius: "var(--wn-input-radius, 6px)",
    fontSize: 13,
    background: "var(--wn-input-bg, #0d1417)",
    outline: 0,
    colorScheme: "var(--wn-color-scheme, dark)",
    boxShadow: "var(--wn-input-shadow, inset 0 1px 3px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.04))",
  },
  calculatedSetting: { marginTop: 8, border: "1px solid var(--wn-card-border, #6c5230)", borderRadius: "var(--wn-input-radius, 7px)", padding: "8px 10px", background: "var(--wn-subcard-bg, rgba(8,12,14,.72))", boxShadow: "inset 0 1px 0 rgba(255,255,255,.05)" },
  calculatedValue: { fontSize: 18, fontWeight: 900, marginTop: 2, color: "var(--wn-success, #80d68a)" },
  batchRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, alignItems: "end" },
  noteGrid: { display: "grid", gridTemplateColumns: "1fr", gap: 10 },
  subCard: { border: "1px solid var(--wn-input-border, #5f4a2c)", borderRadius: "var(--wn-card-radius, 8px)", padding: 10, background: "var(--wn-subcard-bg, rgba(7,12,14,.34))", boxShadow: "inset 0 1px 0 rgba(255,255,255,.04)" },
  coexInset: { borderLeft: "3px solid var(--wn-button-border, #8d6b3c)", paddingLeft: 8, marginTop: 10 },
  reportShell: { width: "100%", overflowX: "hidden", background: "var(--wn-report-bg, #10181c)", color: "var(--wn-text, #f1dfb6)", fontFamily: "var(--wn-font, Georgia, 'Times New Roman', serif)" },
  reportHeader: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", alignItems: "center", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid var(--wn-button-border, #8d6b3c)", color: "var(--wn-title, #e2bd73)", textShadow: "var(--wn-title-shadow, 0 1px 0 #000)" },
  reportBlock: { border: "1px solid var(--wn-card-border, #6c5230)", borderRadius: "var(--wn-card-radius, 8px)", padding: 6, marginBottom: 8, background: "var(--wn-subcard-bg, rgba(7,12,14,.34))", color: "var(--wn-text, #f1dfb6)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.04)" },
  reportHeadRow: { fontSize: 10, fontWeight: 800, borderBottom: "1px solid var(--wn-card-border, rgba(202,165,107,.5))", paddingBottom: 3, marginBottom: 5, lineHeight: "12px", color: "var(--wn-title, #e2bd73)" },
  reportRow: { fontSize: 10, lineHeight: "12px", alignItems: "start", wordBreak: "break-word", whiteSpace: "pre-line", color: "var(--wn-text, #f1dfb6)" },
  printableReportShell: { width: "100%", overflowX: "hidden", background: "#fff", color: "#000", fontFamily: "Arial, sans-serif" },
  printableReportHeader: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", alignItems: "center", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #000", color: "#000", textShadow: "none" },
  printableReportBlock: { border: "1px solid #000", borderRadius: 0, padding: 6, marginBottom: 8, background: "#fff", color: "#000", boxShadow: "none" },
  printableReportHeadRow: { fontSize: 10, fontWeight: 700, borderBottom: "1px solid #000", paddingBottom: 3, marginBottom: 5, lineHeight: "12px", color: "#000" },
  printableReportRow: { fontSize: 10, lineHeight: "12px", alignItems: "start", wordBreak: "break-word", whiteSpace: "pre-line", color: "#000" },
  muted: { fontSize: 13, color: "var(--wn-muted, #b5a88a)" },
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
    : { border: "1px solid var(--wn-card-border, #6c5230)", borderRadius: "var(--wn-input-radius, 6px)", padding: 5, minWidth: 0, background: "var(--wn-subcard-bg, rgba(8,12,14,.72))", color: "var(--wn-text, #f1dfb6)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.04)" },
  settingLabel: printable ? { fontSize: 9, fontWeight: 800, color: "#000", lineHeight: "11px" } : { fontSize: 9, fontWeight: 800, color: "var(--wn-title, #e2bd73)", lineHeight: "11px" },
});

const makeId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const todayString = () => new Date().toISOString().slice(0, 10);
const currentTimeString = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
};
const formatTimestamp24 = (value) => {
  const cleanValue = String(value || "").trim();
  if (!cleanValue) return "";

  const match = cleanValue.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*([ap]\.?m\.?)?$/i);
  if (!match) return cleanValue;

  let hours = Number(match[1]);
  const minutes = match[2] || "00";
  const meridiem = match[3]?.toLowerCase().replace(/\./g, "");

  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  if (!Number.isFinite(hours) || hours < 0 || hours > 23) return cleanValue;

  return `${String(hours).padStart(2, "0")}:${minutes}`;
};
const isDateInputValue = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
const parseWorkDate = (value) => {
  if (!isDateInputValue(value)) return new Date();
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};
const toDateInputValue = (dateValue) => {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const addDays = (dateValue, days) => {
  const nextDate = new Date(dateValue);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};
const getWeekDateValues = (workDate) => {
  const selectedDate = parseWorkDate(workDate);
  const sunday = addDays(selectedDate, -selectedDate.getDay());
  return Array.from({ length: 7 }, (_, index) => toDateInputValue(addDays(sunday, index)));
};
const formatWeekRange = (workDate) => {
  const weekDates = getWeekDateValues(workDate);
  return `${formatDisplayDate(weekDates[0])} - ${formatDisplayDate(weekDates[6])}`;
};
const getInitialDate = () => {
  if (typeof localStorage === "undefined") return todayString();
  const savedDate = localStorage.getItem(ACTIVE_DATE_STORAGE_KEY);
  return isDateInputValue(savedDate) ? savedDate : todayString();
};
const getInitialShift = () => {
  if (typeof localStorage === "undefined") return "A";
  const savedShift = localStorage.getItem(ACTIVE_SHIFT_STORAGE_KEY);
  return SHIFT_OPTIONS.includes(savedShift) ? savedShift : "A";
};
const savePreference = (key, value) => {
  if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
};
const normalizeTheme = (theme) => (THEME_OPTIONS.some(([value]) => value === theme) ? theme : THEME_DEFAULT);
const getInitialTheme = () => {
  if (typeof localStorage === "undefined") return THEME_DEFAULT;
  return normalizeTheme(localStorage.getItem(THEME_STORAGE_KEY));
};

const SORT_PRIMARY_CARD_ID = "sort-primary";
const createFiveSCardEntry = () => ({ id: makeId(), goal: "", result: "", items: [], confirmed: false, deleted: false });
const normalizeFiveSCardEntry = (entry) => {
  const results = Array.isArray(entry?.results)
    ? entry.results.map((result) => String(result || "").trim()).filter(Boolean)
    : [];
  const result = String(entry?.result || "").trim() || results.join("\n\n");
  const items = Array.isArray(entry?.items)
    ? entry.items.map((item) => String(item || ""))
    : result
      ? [result]
      : [];

  return {
    id: entry?.id || makeId(),
    goal: entry?.goal || "",
    result,
    items,
    confirmed: Boolean(entry?.confirmed),
    deleted: Boolean(entry?.deleted),
  };
};
const createFiveSNoteEntry = () => ({ goal: "", result: "", items: [], confirmed: false, deleted: false, cards: [] });
const normalizeFiveSNoteEntry = (entry) => {
  if (typeof entry === "string") return { goal: entry, result: "", items: [], confirmed: false, deleted: false, cards: [] };

  const results = Array.isArray(entry?.results)
    ? entry.results.map((result) => String(result || "").trim()).filter(Boolean)
    : [];
  const result = String(entry?.result || "").trim() || results.join("\n\n");
  const items = Array.isArray(entry?.items)
    ? entry.items.map((item) => String(item || ""))
    : result
      ? [result]
      : [];
  const cards = Array.isArray(entry?.cards) ? entry.cards.map(normalizeFiveSCardEntry) : [];

  return { goal: entry?.goal || "", result, items, confirmed: Boolean(entry?.confirmed), deleted: Boolean(entry?.deleted), cards };
};
const getFiveSSortCards = (entry) => {
  const normalizedEntry = normalizeFiveSNoteEntry(entry);
  if (normalizedEntry.cards.length) return normalizedEntry.cards;
  if (normalizedEntry.deleted) return [];

  return [{
    id: SORT_PRIMARY_CARD_ID,
    goal: normalizedEntry.goal,
    result: normalizedEntry.result,
    items: normalizedEntry.items,
    confirmed: normalizedEntry.confirmed,
    deleted: false,
  }];
};
const createFiveSNotes = () => Object.fromEntries(FIVE_S_STEPS.map((_, index) => [String(index), createFiveSNoteEntry()]));
const normalizeFiveSNotes = (notes) =>
  Object.fromEntries(FIVE_S_STEPS.map((_, index) => {
    const key = String(index);
    return [key, normalizeFiveSNoteEntry(notes?.[key])];
  }));
const loadFiveSNotes = (workDate) => {
  if (typeof localStorage === "undefined") return createFiveSNotes();

  const saved = localStorage.getItem(`${FIVE_S_NOTES_STORAGE_PREFIX}-${workDate}`);
  if (!saved) return createFiveSNotes();

  try {
    return normalizeFiveSNotes(JSON.parse(saved));
  } catch (error) {
    console.error("Could not load 5S notes:", error);
    return createFiveSNotes();
  }
};

const createLineVisibility = () => Object.fromEntries(LINE_NUMBERS.map((line) => [String(line), true]));
const normalizeLineVisibility = (lineVisibility) =>
  Object.fromEntries(LINE_NUMBERS.map((line) => {
    const lineKey = String(line);
    return [lineKey, lineVisibility?.[lineKey] !== false];
  }));
const loadLineVisibility = () => {
  if (typeof localStorage === "undefined") return createLineVisibility();

  const saved = localStorage.getItem(LINE_VISIBILITY_STORAGE_KEY);
  if (!saved) return createLineVisibility();

  try {
    return normalizeLineVisibility(JSON.parse(saved));
  } catch (error) {
    console.error("Could not load line visibility:", error);
    return createLineVisibility();
  }
};
const isLineVisible = (lineVisibility, line) => lineVisibility[String(line)] !== false;
const isGroupVisible = (lineVisibility, group) => group.lines.some((line) => isLineVisible(lineVisibility, line));

const createCollapseState = () => ({ lineRate: {}, calculators: {}, notes: {}, troubleshoot: {} });
const normalizeCollapseGroup = (group) => (group && typeof group === "object" && !Array.isArray(group) ? group : {});
const normalizeCollapseState = (collapseState) => ({
  lineRate: normalizeCollapseGroup(collapseState?.lineRate),
  calculators: normalizeCollapseGroup(collapseState?.calculators),
  notes: normalizeCollapseGroup(collapseState?.notes),
  troubleshoot: normalizeCollapseGroup(collapseState?.troubleshoot),
});
const loadCollapseState = () => {
  if (typeof localStorage === "undefined") return createCollapseState();

  const saved = localStorage.getItem(UI_COLLAPSE_STORAGE_KEY);
  if (!saved) return createCollapseState();

  try {
    return normalizeCollapseState(JSON.parse(saved));
  } catch (error) {
    console.error("Could not load UI collapse state:", error);
    return createCollapseState();
  }
};

const formatDisplayDate = (iso) => {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${Number(month)}-${Number(day)}-${year}`;
};

const sanitizeFilename = (value) => String(value || "report").replace(/[^a-z0-9-_]+/gi, "_");
const hasText = (value) => String(value || "").trim().length > 0;
const getPdfCardBounds = (reportElement, canvas) => {
  const reportRect = reportElement.getBoundingClientRect();
  if (!reportRect.height) return [];

  const scaleY = canvas.height / reportRect.height;

  return Array.from(reportElement.querySelectorAll("[data-pdf-card='true'], [data-pdf-date-section='true']"))
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        top: Math.max(0, (rect.top - reportRect.top) * scaleY),
        bottom: Math.min(canvas.height, (rect.bottom - reportRect.top) * scaleY),
      };
    })
    .filter((bound) => bound.bottom > bound.top)
    .sort((first, second) => first.top - second.top);
};
const choosePdfPageBottom = (pageTop, idealBottom, pageHeight, contentHeight, cardBounds) => {
  if (idealBottom >= contentHeight) return contentHeight;

  const crossingBounds = cardBounds.filter((bound) => bound.top > pageTop + 1 && bound.top < idealBottom - 1 && bound.bottom > idealBottom + 1);
  const breakBound = crossingBounds
    .filter((bound) => (idealBottom - bound.top) / pageHeight < PDF_CARD_SPLIT_BLANK_THRESHOLD)
    .at(-1);

  return breakBound ? breakBound.top : idealBottom;
};
const getPdfPageSlices = (contentHeight, pageHeight, cardBounds) => {
  const slices = [];
  let pageTop = 0;

  while (pageTop < contentHeight - 1) {
    const idealBottom = Math.min(pageTop + pageHeight, contentHeight);
    let pageBottom = choosePdfPageBottom(pageTop, idealBottom, pageHeight, contentHeight, cardBounds);

    if (pageBottom <= pageTop + 1) {
      pageBottom = idealBottom;
    }

    slices.push({ top: pageTop, bottom: pageBottom });
    pageTop = pageBottom;
  }

  return slices.length ? slices : [{ top: 0, bottom: contentHeight }];
};
const createPdfSliceCanvas = (sourceCanvas, slice, backgroundColor) => {
  const top = Math.max(0, Math.floor(slice.top));
  const bottom = Math.min(sourceCanvas.height, Math.ceil(slice.bottom));
  const height = Math.max(1, bottom - top);
  const sliceCanvas = document.createElement("canvas");
  const context = sliceCanvas.getContext("2d");

  sliceCanvas.width = sourceCanvas.width;
  sliceCanvas.height = height;

  if (context) {
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    context.drawImage(sourceCanvas, 0, top, sourceCanvas.width, height, 0, 0, sourceCanvas.width, height);
  }

  return sliceCanvas;
};
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
const hasTroubleshootContent = (note) =>
  [note.note, note.die].some(hasText) || (note.actions || []).some((action) =>
    hasText(action.action) ||
    Object.values(action.temperatureAdjustments || {}).some(hasText) ||
    action.results?.some((result) => hasText(result.result))
  );
const parsePercentNumber = (value) => {
  const parsed = Number.parseFloat(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};
const formatCalculatedPercent = (value) => value.toFixed(2).replace(/\.?0+$/, "");
const calculateNaturalPercent = (material) => {
  const usedPercent = ["colorPercent", "regrindPercent", "additivePercent"].reduce((total, field) => total + parsePercentNumber(material?.[field]), 0);
  return formatCalculatedPercent(100 - usedPercent);
};
const getNaturalPercent = (material) => (hasText(material?.naturalPercent) ? material.naturalPercent : calculateNaturalPercent(material));
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
const formatCalculatorNumber = (value) => Number(value).toFixed(2).replace(/\.?0+$/, "");
const formatContainerTime = (minutes) => {
  if (minutes <= 60) {
    const displayMinutes = minutes.toFixed(1).replace(/\.0$/, "");
    return `${displayMinutes} ${displayMinutes === "1" ? "minute" : "minutes"}`;
  }

  const totalMinutes = Math.round(minutes);
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const hourLabel = hours === 1 ? "hour" : "hours";
  const minuteLabel = remainingMinutes === 1 ? "minute" : "minutes";
  return `${hours} ${hourLabel} and ${remainingMinutes} ${minuteLabel} - ${(minutes / 60).toFixed(2)} hr`;
};
const calculateTimePerContainerMinutes = (temperatures) => {
  const lineSpeed = parseSettingNumber(temperatures?.lineSpeed);
  const cutLength = parseSettingNumber(temperatures?.cutLength);
  const perContainer = parseSettingNumber(temperatures?.perContainer);
  if (lineSpeed <= 0 || cutLength <= 0 || perContainer <= 0) return "";
  return (cutLength * perContainer) / (lineSpeed * 12);
};
const calculateTimePerContainer = (temperatures) => {
  const minutes = calculateTimePerContainerMinutes(temperatures);
  return minutes ? formatContainerTime(minutes) : "";
};
const calculateTimeUntilDone = (temperatures) => {
  const minutesPerContainer = calculateTimePerContainerMinutes(temperatures);
  const totalContainers = parseSettingNumber(temperatures?.totalContainers);
  if (!minutesPerContainer || totalContainers <= 0) return "";

  const currentContainer = hasText(temperatures?.currentContainer) ? parseSettingNumber(temperatures.currentContainer) : 0;
  const remainingContainers = Math.max(totalContainers - currentContainer, 0);
  return formatContainerTime(minutesPerContainer * remainingContainers);
};
const getCalculatorTitle = (type) => CALCULATOR_OPTIONS.find(([value]) => value === type)?.[1] || "Calculator";
const getCalculatorFields = (type) => CALCULATOR_FIELDS[type] || [];
const getCalculatorResultLabel = (type) => CALCULATOR_RESULTS[type] || "Result";
const createCalculatorInputs = (type) => Object.fromEntries(getCalculatorFields(type).map(([field]) => [field, ""]));
const calculateLineCalculatorResult = (calculator) => {
  const inputs = calculator?.inputs || {};
  const currentGram = parseSettingNumber(inputs.currentGramPerFoot);
  const targetGram = parseSettingNumber(inputs.targetGramPerFoot);

  if (calculator?.type === CALCULATOR_GRAM_RPM) {
    const currentRpm = parseSettingNumber(inputs.currentRpm);
    if (currentGram <= 0 || targetGram <= 0 || currentRpm <= 0) return "";
    return `${formatCalculatorNumber((currentRpm * targetGram) / currentGram)} RPM`;
  }

  if (calculator?.type === CALCULATOR_GRAM_LINE_SPEED) {
    const currentLineSpeed = parseSettingNumber(inputs.currentLineSpeed);
    if (currentGram <= 0 || targetGram <= 0 || currentLineSpeed <= 0) return "";
    return formatCalculatorNumber((currentLineSpeed * currentGram) / targetGram);
  }

  if (calculator?.type === CALCULATOR_CUT_TIMER) {
    const currentCutLength = parseSettingNumber(inputs.currentCutLength);
    const currentCutTime = parseSettingNumber(inputs.currentCutTime);
    const targetCutLength = parseSettingNumber(inputs.targetCutLength);
    if (currentCutLength <= 0 || currentCutTime <= 0 || targetCutLength <= 0) return "";
    return formatCalculatorNumber((currentCutTime * targetCutLength) / currentCutLength);
  }

  return "";
};
const tabLabel = (tab) => {
  if (tab === "full") return "Daily Report";
  if (tab === "weekly") return "Weekly Report";
  if (tab === "troubleshoot") return "Troubleshoot";
  if (tab === "fiveS") return "5S Report";
  return tab[0].toUpperCase() + tab.slice(1);
};
const fiveSGoalLabel = (index) => (index === 0 ? "Target Area" : "Goal");
const fiveSResultLabel = (index) => (index === 0 ? "Items Removed" : "Result");
const reportTitle = (reportTab, selectedLine, fiveSReportIndex) => {
  if (reportTab === "line") return `Line ${selectedLine}`;
  if (reportTab === "fiveS" && typeof fiveSReportIndex === "number") return FIVE_S_STEPS[fiveSReportIndex]?.title || "5S";
  return tabLabel(reportTab);
};
const actionTypeLabel = (actionType) => ACTION_TYPE_OPTIONS.find(([value]) => value === actionType)?.[1] || "Other";

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
const createBatchWithMaterial = () => {
  const batch = createBatch();
  return { batch, material: createMaterial(batch.id, batch.batch, batch.die) };
};
const createOperator = (name = "") => ({ id: makeId(), name });
const createTemperatureAdjustments = () => Object.fromEntries(TEMPERATURE_FIELDS.map(([key]) => [key, ""]));
const createTroubleshootResult = (result = "", timestamp = "") => ({ id: makeId(), timestamp, result });
const createTroubleshootAction = (action = "", results = [], actionType = ACTION_TYPE_OTHER, temperatureAdjustments = createTemperatureAdjustments(), timestamp = "") => ({
  id: makeId(),
  timestamp,
  actionType,
  action,
  temperatureAdjustments,
  results,
});
const createNote = (batchId = "", die = "") => ({ id: makeId(), batchId, timestamp: "", note: "", actions: [], die, confirmed: false });
const createSettingsNote = (note = "") => ({ id: makeId(), note });
const createTemperatures = () => Object.fromEntries(ALL_SETTING_FIELDS.map(([key]) => [key, ""]));
const createLineCalculator = (type = CALCULATOR_GRAM_RPM) => ({ id: makeId(), type, inputs: createCalculatorInputs(type) });
const createLineData = () => {
  const { batch, material } = createBatchWithMaterial();
  return { operators: [createOperator()], temperatures: createTemperatures(), otherTimes: [], calculators: [], generalNotes: "", settingsNotes: [createSettingsNote()], batches: [batch], materials: [material], notes: [] };
};
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

const normalizeTroubleshootResults = (results) => {
  if (!Array.isArray(results)) return [];

  return results.map((result) => ({
    id: result?.id || makeId(),
    timestamp: formatTimestamp24(result?.timestamp),
    result: result?.result || "",
  }));
};

const normalizeOperators = (lineData) => {
  if (Array.isArray(lineData?.operators) && lineData.operators.length > 0) {
    return lineData.operators.map((operator) => ({
      id: operator?.id || makeId(),
      name: typeof operator === "string" ? operator : operator?.name || "",
    }));
  }

  if (hasText(lineData?.operator)) return [createOperator(lineData.operator)];
  return [createOperator()];
};

const normalizeTemperatureAdjustments = (temperatureAdjustments) => ({
  ...createTemperatureAdjustments(),
  ...Object.fromEntries(TEMPERATURE_FIELDS.map(([key]) => [key, temperatureAdjustments?.[key] || ""])),
});

const normalizeTroubleshootActions = (actions) => {
  if (!Array.isArray(actions)) return [];

  return actions.map((action) => ({
    id: action?.id || makeId(),
    timestamp: formatTimestamp24(action?.timestamp),
    actionType: action?.actionType || action?.type || ACTION_TYPE_OTHER,
    action: action?.action || "",
    temperatureAdjustments: normalizeTemperatureAdjustments(action?.temperatureAdjustments),
    results: normalizeTroubleshootResults(action?.results),
  }));
};

const normalizeNotes = (notes) => {
  if (!Array.isArray(notes)) return [];

  return notes.map((note) => {
    const actions = normalizeTroubleshootActions(note?.actions);
    const migratedActions = actions.length || (!hasText(note?.action) && !hasText(note?.result))
      ? actions
      : [createTroubleshootAction(note?.action || "", hasText(note?.result) ? [createTroubleshootResult(note.result)] : [], ACTION_TYPE_OTHER)];

    return {
      id: note?.id || makeId(),
      batchId: note?.batchId || "",
      timestamp: formatTimestamp24(note?.timestamp),
      note: note?.note || note?.issue || "",
      actions: migratedActions,
      die: note?.die || "",
      confirmed: Boolean(note?.confirmed),
    };
  });
};

const normalizeSettingsNotes = (settingsNotes) => {
  if (Array.isArray(settingsNotes)) {
    const notes = settingsNotes.map((note) => ({
      id: note?.id || makeId(),
      note: typeof note === "string" ? note : note?.note || "",
    }));
    return notes.length ? notes : [createSettingsNote()];
  }

  if (hasText(settingsNotes)) return [createSettingsNote(settingsNotes)];
  return [createSettingsNote()];
};

const normalizeTemperatures = (temperatures) => ({
  ...createTemperatures(),
  ...Object.fromEntries(ALL_SETTING_FIELDS.map(([key]) => [key, temperatures?.[key] || ""])),
  lineSpeed: temperatures?.lineSpeed || temperatures?.likespeed || "",
});
const normalizeDieSettingTemperatures = (temperatures) =>
  Object.fromEntries(DIE_SETTING_FIELDS.map(([key]) => [key, temperatures?.[key] || ""]));
const normalizeDieSetting = (setting) => {
  const temperatures = normalizeDieSettingTemperatures(setting?.temperatures || setting);
  const dieNumber = String(setting?.dieNumber || temperatures.dieNumber || "").trim();

  return {
    id: setting?.id || makeId(),
    dieNumber,
    temperatures: { ...temperatures, dieNumber },
    settingsNotes: normalizeSettingsNotes(setting?.settingsNotes || setting?.notes),
    savedAt: setting?.savedAt || "",
  };
};
const sortDieSettings = (settings) =>
  [...settings].sort((first, second) => {
    const dieSort = first.dieNumber.localeCompare(second.dieNumber, undefined, { numeric: true, sensitivity: "base" });
    if (dieSort !== 0) return dieSort;
    return String(second.savedAt || "").localeCompare(String(first.savedAt || ""));
  });
const normalizeDieSettings = (settings) => {
  if (!Array.isArray(settings)) return [];
  return sortDieSettings(settings.map(normalizeDieSetting).filter((setting) => hasText(setting.dieNumber)));
};
const loadDieSettings = () => {
  if (typeof localStorage === "undefined") return [];

  const saved = localStorage.getItem(DIE_SETTINGS_STORAGE_KEY);
  if (!saved) return [];

  try {
    return normalizeDieSettings(JSON.parse(saved));
  } catch (error) {
    console.error("Could not load die settings:", error);
    return [];
  }
};
const createDieSettingFromLineData = (lineData) => {
  const temperatures = normalizeDieSettingTemperatures(lineData?.temperatures);
  const dieNumber = String(temperatures.dieNumber || "").trim();

  return {
    id: makeId(),
    dieNumber,
    temperatures: { ...temperatures, dieNumber },
    settingsNotes: normalizeSettingsNotes(lineData?.settingsNotes),
    savedAt: new Date().toISOString(),
  };
};
const applyDieSettingToLineData = (lineData, setting) => {
  const normalizedSetting = normalizeDieSetting(setting);

  return {
    ...lineData,
    temperatures: { ...createTemperatures(), ...lineData.temperatures, ...normalizedSetting.temperatures },
    settingsNotes: normalizeSettingsNotes(normalizedSetting.settingsNotes),
  };
};
const formatSavedAt = (savedAt) => {
  if (!savedAt) return "";
  const savedDate = new Date(savedAt);
  if (Number.isNaN(savedDate.getTime())) return "";
  return `${savedDate.getMonth() + 1}-${savedDate.getDate()}-${savedDate.getFullYear()}`;
};
const normalizeOtherTimes = (otherTimes) => {
  if (!Array.isArray(otherTimes)) return [];
  return otherTimes.map((otherTime) => ({
    id: otherTime?.id || makeId(),
    time: otherTime?.time || "",
    description: otherTime?.description || "",
  }));
};
const normalizeLineCalculators = (calculators) => {
  if (!Array.isArray(calculators)) return [];

  return calculators
    .filter((calculator) => CALCULATOR_FIELDS[calculator?.type])
    .map((calculator) => ({
      id: calculator?.id || makeId(),
      type: calculator.type,
      inputs: {
        ...createCalculatorInputs(calculator.type),
        ...Object.fromEntries(getCalculatorFields(calculator.type).map(([field]) => [field, calculator?.inputs?.[field] || ""])),
      },
    }));
};

const isMaterialForBatch = (material, batch, index) => material.batchId === batch.id || (!material.batchId && index === 0 && hasMaterialContent(material));
const ensureMaterialsForBatches = (batches, materials) => {
  const ensuredMaterials = [...materials];

  batches.forEach((batch, index) => {
    const hasBatchMaterial = ensuredMaterials.some((material) => isMaterialForBatch(material, batch, index));
    if (!hasBatchMaterial) ensuredMaterials.push(createMaterial(batch.id, batch.batch, batch.die));
  });

  return ensuredMaterials;
};

const normalizeSavedData = (savedData) => {
  const base = createAllLineData();

  Object.entries(savedData || {}).forEach(([line, lineData]) => {
    if (!base[line]) return;
    const batches = normalizeBatches(lineData);
    const materials = ensureMaterialsForBatches(batches, normalizeMaterials(lineData?.materials));

    base[line] = {
      operators: normalizeOperators(lineData),
      temperatures: normalizeTemperatures(lineData?.temperatures),
      otherTimes: normalizeOtherTimes(lineData?.otherTimes),
      calculators: normalizeLineCalculators(lineData?.calculators),
      generalNotes: lineData?.generalNotes || "",
      settingsNotes: normalizeSettingsNotes(lineData?.settingsNotes),
      batches,
      materials,
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
const getOperatorText = (lineData) => normalizeOperators(lineData).map((operator) => operator.name).filter(hasText).join(", ");

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
      natural: withPercent(material.natural, getNaturalPercent(material)),
      color: withPercent(material.color, material.colorPercent),
      regrind: withPercent(material.regrind, material.regrindPercent),
      additive: withPercent(material.additive, material.additivePercent),
    });

    material.coexes.forEach((coex) => {
      rows.push({
        label: `Coex${String(coex.number).padStart(2, "0")}`,
        die: "",
        batch: "",
        natural: withPercent(coex.natural, getNaturalPercent(coex)),
        color: withPercent(coex.color, coex.colorPercent),
        regrind: withPercent(coex.regrind, coex.regrindPercent),
        additive: withPercent(coex.additive, coex.additivePercent),
      });
    });
  });

  return rows;
};

const formatTemperatureAdjustmentSummary = (action, temperatures = {}) =>
  TEMPERATURE_FIELDS.map(([key, label]) => {
    const change = action.temperatureAdjustments?.[key];
    if (!hasText(change)) return "";
    const current = temperatures?.[key];
    return hasText(current) ? `${label} ${current} to ${change}` : `${label} to ${change}`;
  }).filter(hasText).join("; ");

const formatTroubleshootAction = (action, temperatures = {}) => {
  if (action.actionType !== ACTION_TYPE_TEMP_ADJUSTMENT) return action.action || "";

  const parts = [actionTypeLabel(action.actionType), action.action, formatTemperatureAdjustmentSummary(action, temperatures)];
  return parts.filter(hasText).join(": ");
};
const valueWithTimestamp = (timestamp, value) => {
  const cleanTimestamp = formatTimestamp24(timestamp);
  const cleanValue = String(value || "");
  if (!hasText(cleanTimestamp)) return cleanValue;
  return hasText(cleanValue) ? `${cleanTimestamp} ${cleanValue}` : cleanTimestamp;
};
const bulletValue = (value, shouldBullet) => (shouldBullet && hasText(value) ? `• ${value}` : value);
const reportListValue = (values) => {
  const filledValues = values.filter(hasText);
  return filledValues.map((value) => bulletValue(value, filledValues.length > 1)).join("\n");
};

const getTroubleshootRowsForLine = (line, lineData) => {
  const rows = [];
  const firstDie = lineData.batches?.[0]?.die || "";
  const batchesById = new Map((lineData.batches || []).map((batch) => [batch.id, batch]));

  lineData.notes.forEach((note) => {
    if (!hasTroubleshootContent(note)) return;

    const linkedBatch = batchesById.get(note.batchId);
    const die = linkedBatch?.die || note.die || firstDie;
    const actions = note.actions || [];
    const issue = valueWithTimestamp(note.timestamp, note.note);

    if (!actions.length) {
      rows.push({ line, die, issue, action: "", result: "", id: note.id, noteId: note.id, issueStart: true });
      return;
    }

    const actionValues = actions.map((action) => valueWithTimestamp(action.timestamp, formatTroubleshootAction(action, lineData.temperatures)));
    const resultValues = actions.flatMap((action) => (action.results || []).map((result) => valueWithTimestamp(result.timestamp, result.result)));

    rows.push({
      line,
      die,
      issue,
      action: reportListValue(actionValues),
      result: reportListValue(resultValues),
      id: note.id,
      noteId: note.id,
      issueStart: true,
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

function Card({ children, style, className }) {
  return (
    <div className={className} style={{ ...styles.card, ...style }}>
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

function TimestampInput({ value, onChange, label }) {
  const [isEditing, setIsEditing] = useState(false);
  const [hasStamped, setHasStamped] = useState(() => hasText(value));

  const handleClick = () => {
    if (!hasStamped) {
      onChange(currentTimeString());
      setHasStamped(true);
      return;
    }

    setIsEditing(true);
  };

  if (isEditing) {
    return (
      <input
        type="time"
        aria-label={label}
        value={formatTimestamp24(value)}
        autoFocus
        onBlur={() => setIsEditing(false)}
        onChange={(event) => onChange(event.target.value)}
        style={{ ...styles.button, ...styles.smallButton, width: 96, padding: "7px 8px", colorScheme: "dark", textAlign: "center" }}
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      title={value ? `${label}: ${value}` : label}
      onClick={handleClick}
      style={{ ...styles.button, ...styles.smallButton, width: 42, padding: 0 }}
    >
      <Clock size={16} aria-hidden="true" />
    </button>
  );
}

const labelWithTimestamp = (label, timestamp) => {
  const cleanTimestamp = formatTimestamp24(timestamp);
  return hasText(cleanTimestamp) ? `${label} ${cleanTimestamp}` : label;
};

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

function OperatorCard({ operators, addOperator, updateOperator, removeOperator }) {
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <label style={styles.label}>Operator</label>
        <Button small onClick={addOperator} aria-label="Add operator" style={{ width: 36, minHeight: 34, padding: 0 }}>
          <Plus size={16} aria-hidden="true" />
        </Button>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {operators.map((operator, index) => (
          <div key={operator.id} style={{ display: "grid", gridTemplateColumns: index === 0 ? "minmax(0, 1fr)" : "minmax(0, 1fr) auto", gap: 6, alignItems: "center" }}>
            <input
              aria-label={`Operator ${index + 1}`}
              value={operator.name}
              onChange={(event) => updateOperator(operator.id, event.target.value)}
              style={styles.input}
            />
            {index > 0 && <Button small onClick={() => removeOperator(operator.id)}>Delete</Button>}
          </div>
        ))}
      </div>
    </Card>
  );
}

function MaterialMixFields({ material, updateMaterial }) {
  const compactGrid = { display: "grid", gridTemplateColumns: "minmax(0, 1fr) 54px minmax(0, 1fr) 54px", gap: 6, alignItems: "end" };
  const naturalPercentValue = getNaturalPercent(material);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={compactGrid}>
        <Field label="Natural" value={material.natural} onChange={(value) => updateMaterial(material.id, "natural", value)} />
        <Field label="%" value={naturalPercentValue} onChange={(value) => updateMaterial(material.id, "naturalPercent", value)} />
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
      <DisplayValue label="Natural" value={withPercent(material.natural, getNaturalPercent(material))} />
      <DisplayValue label="Color" value={withPercent(material.color, material.colorPercent)} />
      <DisplayValue label="Regrind" value={withPercent(material.regrind, material.regrindPercent)} />
      <DisplayValue label="Additive" value={withPercent(material.additive, material.additivePercent)} />
    </DisplayGrid>
  );
}

function CoexMixFields({ coex, onChange }) {
  const compactGrid = { display: "grid", gridTemplateColumns: "minmax(0, 1fr) 54px minmax(0, 1fr) 54px", gap: 6, alignItems: "end" };
  const naturalPercentValue = getNaturalPercent(coex);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={compactGrid}>
        <Field label="Natural" value={coex.natural} onChange={(value) => onChange("natural", value)} />
        <Field label="%" value={naturalPercentValue} onChange={(value) => onChange("naturalPercent", value)} />
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

function HomeHeader({ menuOpen, onMenuClick, isEditingLines, onEditClick, onSettingsClick }) {
  return (
    <div style={styles.homeHeader}>
      <button type="button" style={styles.menuButton} onClick={onMenuClick}>
        {menuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
        <span>Menu</span>
      </button>
      {menuOpen ? (
        <button
          type="button"
          aria-label="Settings"
          style={styles.editIconButton}
          onClick={onSettingsClick}
        >
          <Settings size={18} aria-hidden="true" />
        </button>
      ) : (
        <button
          type="button"
          aria-label={isEditingLines ? "Done editing lines" : "Edit lines"}
          style={{ ...styles.editIconButton, ...(isEditingLines ? styles.buttonPrimary : {}) }}
          onClick={onEditClick}
        >
          <Pencil size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function SidePanel({ screen, reportTab, date, theme, isDieNumberActive, isFiveSActive, onDateChange, onSelectReport, onSelectDieNumber, onSelectFiveS }) {
  return (
    <nav style={styles.sidePanel} aria-label="Main">
      {REPORT_TABS.map((tab) => (
        <button key={tab} type="button" style={{ ...styles.sideButton, ...(screen === "report" && reportTab === tab ? styles.sideButtonActive : {}) }} onClick={() => onSelectReport(tab)}>
          <span>{tabLabel(tab)}</span>
          {theme === THEME_PINK && tab === "full" && <Sparkles size={13} aria-hidden="true" />}
        </button>
      ))}

      <div style={styles.sideFooter}>
        <button type="button" style={{ ...styles.sideButton, ...(isFiveSActive ? styles.sideButtonActive : {}), marginBottom: 10 }} onClick={onSelectFiveS}>
          <span>5S</span>
        </button>

        <button type="button" style={{ ...styles.sideButton, ...(isDieNumberActive ? styles.sideButtonActive : {}), marginBottom: 10 }} onClick={onSelectDieNumber}>
          <span>Die #</span>
        </button>

        <div style={{ marginBottom: 10 }}>
          <label style={styles.label}>Date</label>
          <input type="date" value={date} onChange={(event) => onDateChange(event.target.value)} style={styles.input} />
        </div>
      </div>
    </nav>
  );
}

function SettingsScreen({ shift, onShiftChange, theme, onThemeChange, goHome, goLineView, onMenuClick }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Card style={{ ...styles.topBarCard, position: "sticky", top: 0, zIndex: 60 }}>
        <div style={{ display: "grid", gridTemplateColumns: "92px minmax(0, 1fr) 74px", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6, justifySelf: "start" }}>
            <Button small onClick={goHome} aria-label="Home" style={{ width: 42 }}>
              <Home size={16} aria-hidden="true" />
            </Button>
            <Button small onClick={goLineView}>Line</Button>
          </div>

          <div style={styles.screenTitle}>Settings</div>

          <Button small onClick={onMenuClick} style={{ justifySelf: "stretch", padding: "7px 5px", fontSize: 11 }}>
            <Menu size={14} aria-hidden="true" />
            Menu
          </Button>
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: 15, fontWeight: 900, color: "var(--wn-title, #e2bd73)", marginBottom: 8 }}>Theme</div>
        <div style={styles.shiftGrid}>
          {THEME_OPTIONS.map(([value, label]) => (
            <Button key={value} active={theme === value} onClick={() => onThemeChange(value)}>
              {label}
            </Button>
          ))}
        </div>
        <div style={{ ...styles.muted, marginTop: 8 }}>
          {theme === THEME_PINK ? "Soft Pink / Pretty theme" : "Default Theme"}
        </div>
      </Card>

      <Card>
        <label style={styles.label}>Shift</label>
        <div style={styles.shiftGrid}>
          {SHIFT_OPTIONS.map((option) => (
            <Button key={option} active={shift === option} onClick={() => onShiftChange(option)}>
              {option}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ReportHeader({ title, date, shift, printable, dateLabel }) {
  const reportTheme = getReportTheme(printable);
  const dateStyle = dateLabel
    ? { fontSize: 11, fontWeight: 700, textAlign: "center", whiteSpace: "nowrap" }
    : { fontSize: 13, fontWeight: 700, textAlign: "left" };

  return (
    <div style={reportTheme.header}>
      <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
      <div style={dateStyle}>{dateLabel || formatDisplayDate(date)}</div>
      <div style={{ fontSize: 13, fontWeight: 700, textAlign: "right" }}>Shift {shift}</div>
    </div>
  );
}

function PdfButton({ onClick, onBack, isExporting, printable }) {
  const reportTheme = getReportTheme(printable);

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <Button small onClick={onBack} style={reportTheme.button}>Back</Button>
      <Button small onClick={onClick} disabled={isExporting} style={{ ...reportTheme.button, ...(isExporting ? { opacity: 0.7 } : {}) }}>
        {isExporting ? "PDF..." : "PDF"}
      </Button>
    </div>
  );
}

function LinesScreen({ data, selectedLine, onSelectLine, lineVisibility, isEditingLines, onToggleLine, onToggleLineGroup }) {
  return (
    <Card>
      <LineButtonGrid
        data={data}
        selectedLine={selectedLine}
        onSelectLine={onSelectLine}
        lineVisibility={lineVisibility}
        isEditingLines={isEditingLines}
        onToggleLine={onToggleLine}
        onToggleLineGroup={onToggleLineGroup}
      />
    </Card>
  );
}

function LineButtonGrid({ data, selectedLine, onSelectLine, lineVisibility, isEditingLines, onToggleLine, onToggleLineGroup }) {
  const visibleGroups = LINE_GROUPS.filter((group) => isEditingLines || isGroupVisible(lineVisibility, group));

  return (
    <div style={styles.lineGrid}>
      {visibleGroups.map((group) => {
        const groupVisible = isGroupVisible(lineVisibility, group);

        return (
          <div key={group.name} style={styles.lineColumn}>
            {isEditingLines ? (
              <Button
                active={groupVisible}
                small
                style={{ ...styles.lineGroupButton, ...(groupVisible ? {} : styles.lineToggleOff) }}
                onClick={() => onToggleLineGroup(group)}
              >
                {group.name}
              </Button>
            ) : (
              <div style={styles.lineGroupTitle}>{group.name}</div>
            )}
            {group.lines.map((line) => {
              const lineKey = String(line);
              const lineVisible = isLineVisible(lineVisibility, line);
              const firstDie = data[lineKey]?.batches?.[0]?.die;
              if (!isEditingLines && !lineVisible) return null;

              return (
                <Button
                  key={line}
                  active={isEditingLines ? lineVisible : selectedLine === lineKey}
                  style={{ ...styles.lineButton, justifyContent: "space-between", ...(lineVisible ? {} : styles.lineToggleOff) }}
                  onClick={() => (isEditingLines ? onToggleLine(lineKey) : onSelectLine(line))}
                >
                  <span>{line}</span>
                  <span style={{ fontSize: 14, opacity: 0.8 }}>{firstDie || ""}</span>
                </Button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function MaterialFields({ material, canAddCoex, canDelete, newCoexNumber, setNewCoexNumber, removeMaterial, updateMaterial, addCoex, updateCoex, removeCoex }) {
  const isEditing = !material.confirmed;

  return (
    <div style={styles.subCard}>
      {isEditing ? (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {canDelete && <Button small onClick={() => removeMaterial(material.id)}>Delete</Button>}
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

function TemperatureAdjustmentFields({ temperatures, action, onChange }) {
  return (
    <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "64px 54px minmax(0, 1fr)", gap: 6, alignItems: "end" }}>
        <div style={styles.temperatureLabel}>Zone</div>
        <div style={styles.temperatureLabel}>Input</div>
        <div style={styles.temperatureLabel}>Change</div>
      </div>
      {TEMPERATURE_FIELDS.map(([key, label]) => (
        <div key={key} style={{ display: "grid", gridTemplateColumns: "64px 54px minmax(0, 1fr)", gap: 6, alignItems: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--wn-title, #e2bd73)" }}>{label}</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--wn-input-text, #f8e9c4)" }}>{temperatures?.[key] || "-"}</div>
          <input
            value={action.temperatureAdjustments?.[key] || ""}
            onChange={(event) => onChange(key, event.target.value)}
            style={styles.temperatureInput}
          />
        </div>
      ))}
    </div>
  );
}

function TroubleshootFields({
  note,
  temperatures,
  updateNote,
  deleteNote,
  addNoteAction,
  updateNoteAction,
  updateNoteTemperatureAdjustment,
  deleteNoteAction,
  addNoteResult,
  updateNoteResult,
  deleteNoteResult,
}) {
  const isEditing = !note.confirmed;

  return (
    <div style={styles.subCard}>
      {isEditing ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <TimestampInput value={note.timestamp} onChange={(value) => updateNote(note.id, "timestamp", value)} label="Issue timestamp" />
            <div style={{ display: "flex", gap: 6 }}>
              <Button small onClick={() => deleteNote(note.id)}>Delete</Button>
              <Button small active onClick={() => updateNote(note.id, "confirmed", true)}>Confirm</Button>
            </div>
          </div>

          <div style={styles.noteGrid}>
            <Field label="Issue" value={note.note} onChange={(value) => updateNote(note.id, "note", value)} textarea />
            {note.actions.map((action, actionIndex) => (
              <div key={action.id} style={styles.coexInset}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <TimestampInput value={action.timestamp} onChange={(value) => updateNoteAction(note.id, action.id, "timestamp", value)} label={`Action ${actionIndex + 1} timestamp`} />
                  <Button small onClick={() => deleteNoteAction(note.id, action.id)}>Delete Action</Button>
                </div>

                <Field label="Action" value={action.action} onChange={(value) => updateNoteAction(note.id, action.id, "action", value)} textarea />

                {action.actionType === ACTION_TYPE_TEMP_ADJUSTMENT && (
                  <TemperatureAdjustmentFields
                    temperatures={temperatures}
                    action={action}
                    onChange={(key, value) => updateNoteTemperatureAdjustment(note.id, action.id, key, value)}
                  />
                )}

                <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                  {action.results.map((result, resultIndex) => (
                    <div key={result.id} style={{ display: "grid", gap: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <TimestampInput value={result.timestamp} onChange={(value) => updateNoteResult(note.id, action.id, result.id, "timestamp", value)} label={`Result ${resultIndex + 1} timestamp`} />
                        <Button small onClick={() => deleteNoteResult(note.id, action.id, result.id)}>Delete</Button>
                      </div>
                      <Field label="Result" value={result.result} onChange={(value) => updateNoteResult(note.id, action.id, result.id, "result", value)} textarea />
                    </div>
                  ))}
                  {actionIndex === note.actions.length - 1 && action.results.length === 0 && <Button small onClick={() => addNoteResult(note.id, action.id)}>Add Result</Button>}
                </div>
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <select
                aria-label="Action type"
                value=""
                onChange={(event) => {
                  if (event.target.value) addNoteAction(note.id, event.target.value);
                }}
                style={{ ...styles.button, ...styles.smallButton, width: "100%" }}
              >
                <option value="">Action type</option>
                {ACTION_TYPE_MENU_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <Button small onClick={() => addNoteAction(note.id)} style={{ width: "100%" }}>Action</Button>
            </div>
          </div>
        </>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 8, alignItems: "start" }}>
          <div>
            <DisplayValue label={labelWithTimestamp("Issue", note.timestamp)} value={note.note} wide />
            {note.actions.map((action) => (
              <div key={action.id} style={styles.coexInset}>
                {action.actionType === ACTION_TYPE_TEMP_ADJUSTMENT && <DisplayValue label="Action Type" value={actionTypeLabel(action.actionType)} wide />}
                <DisplayValue label={labelWithTimestamp("Action", action.timestamp)} value={action.action} wide />
                {action.actionType === ACTION_TYPE_TEMP_ADJUSTMENT && (
                  <div style={{ marginTop: 8 }}>
                    <DisplayValue label="Temp Adjustment" value={formatTemperatureAdjustmentSummary(action, temperatures)} wide />
                  </div>
                )}
                {action.results.map((result) => (
                  <div key={result.id} style={{ marginTop: 8 }}>
                    <DisplayValue label={labelWithTimestamp("Result", result.timestamp)} value={result.result} wide />
                  </div>
                ))}
              </div>
            ))}
          </div>
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

function TroubleshootDisplay({ note, temperatures, isCollapsed, onCollapsedChange }) {
  return (
    <div style={styles.subCard}>
      <div style={{ fontSize: 15, fontWeight: 700, lineHeight: "19px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        <Button
          small
          aria-label={isCollapsed ? "Show troubleshoot issue details" : "Hide troubleshoot issue details"}
          title={isCollapsed ? "Show troubleshoot issue details" : "Hide troubleshoot issue details"}
          onClick={() => onCollapsedChange(!isCollapsed)}
          style={{ float: "right", width: 42, padding: 0, marginLeft: 8, marginBottom: 4 }}
        >
          {isCollapsed ? <Plus size={16} aria-hidden="true" /> : <Minus size={16} aria-hidden="true" />}
        </Button>
        <span style={{ ...styles.muted, fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>{labelWithTimestamp("Issue", note.timestamp)} </span>
        {hasText(note.note) ? note.note : "-"}
      </div>

      {!isCollapsed && note.actions.map((action) => (
        <div key={action.id} style={styles.coexInset}>
          {action.actionType === ACTION_TYPE_TEMP_ADJUSTMENT && <DisplayValue label="Action Type" value={actionTypeLabel(action.actionType)} wide />}
          <DisplayValue label={labelWithTimestamp("Action", action.timestamp)} value={action.action} wide />
          {action.actionType === ACTION_TYPE_TEMP_ADJUSTMENT && (
            <div style={{ marginTop: 8 }}>
              <DisplayValue label="Temp Adjustment" value={formatTemperatureAdjustmentSummary(action, temperatures)} wide />
            </div>
          )}
          {action.results.map((result) => (
            <div key={result.id} style={{ marginTop: 8 }}>
              <DisplayValue label={labelWithTimestamp("Result", result.timestamp)} value={result.result} wide />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function LineRateCard({ temperatures, onChange, isCollapsed, onCollapsedChange }) {
  const timePerContainer = calculateTimePerContainer(temperatures);
  const timeUntilDone = calculateTimeUntilDone(temperatures);
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
  const rateFields = [
    ["lineSpeed", "Line Speed"],
    ["cutLength", "Cut Length"],
  ];
  const containerFields = [
    ["currentContainer", "Current Container"],
    ["totalContainers", "Total Containers"],
    ["perContainer", "Per Container"],
  ];

  if (isCollapsed) {
    return (
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 42px", gap: 8, alignItems: "center" }}>
          <DisplayValue label="Line Speed" value={temperatures?.lineSpeed || "-"} />
          <Button
            small
            aria-label="Show line rate settings"
            title="Show line rate settings"
            onClick={() => onCollapsedChange(false)}
            style={{ width: 42, padding: 0 }}
          >
            <Plus size={16} aria-hidden="true" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr)) 42px", gap: 8, alignItems: "end" }}>
        {rateFields.map(renderInput)}
        <Button
          small
          aria-label="Hide line rate settings"
          title="Hide line rate settings"
          onClick={() => onCollapsedChange(true)}
          style={{ width: 42, padding: 0 }}
        >
          <Minus size={16} aria-hidden="true" />
        </Button>
      </div>
      <div style={{ ...styles.settingsGridThree, marginTop: 8 }}>{containerFields.map(renderInput)}</div>
      <div style={styles.calculatedSetting}>
        <div style={styles.temperatureLabel}>Time Per Container</div>
        <div style={styles.calculatedValue}>{timePerContainer || "-"}</div>
      </div>
      <div style={styles.calculatedSetting}>
        <div style={styles.temperatureLabel}>Time Until Done</div>
        <div style={styles.calculatedValue}>{timeUntilDone || "-"}</div>
      </div>
    </Card>
  );
}

function LineCalculatorCard({ calculator, updateCalculator, removeCalculator }) {
  const result = calculateLineCalculatorResult(calculator);
  const fields = getCalculatorFields(calculator.type);

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ fontWeight: 900, color: "var(--wn-title, #e2bd73)" }}>{getCalculatorTitle(calculator.type)}</div>
        <Button small onClick={() => removeCalculator(calculator.id)}>Delete</Button>
      </div>

      <div style={styles.settingsGridThree}>
        {fields.map(([field, label]) => (
          <div key={field} style={{ direction: "ltr" }}>
            <label style={styles.temperatureLabel}>{label}</label>
            <input
              inputMode="numeric"
              value={calculator.inputs?.[field] || ""}
              onChange={(event) => updateCalculator(calculator.id, field, event.target.value)}
              style={styles.temperatureInput}
            />
          </div>
        ))}
      </div>

      <div style={styles.calculatedSetting}>
        <div style={styles.temperatureLabel}>{getCalculatorResultLabel(calculator.type)}</div>
        <div style={styles.calculatedValue}>{result || "-"}</div>
      </div>
    </Card>
  );
}

function LineCalculators({ calculators, addCalculator, updateCalculator, removeCalculator, isCollapsed, onCollapsedChange }) {
  const handleAddCalculator = (type) => {
    addCalculator(type);
    onCollapsedChange(false);
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 42px", gap: 8 }}>
        <select
          aria-label="Add calculator"
          value=""
          onChange={(event) => {
            if (event.target.value) handleAddCalculator(event.target.value);
          }}
          style={{ ...styles.button, width: "100%", minWidth: 0, textAlign: "center" }}
        >
          <option value="">Add Calculator</option>
          {CALCULATOR_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <Button
          small
          aria-label={isCollapsed ? "Show calculators" : "Hide calculators"}
          title={isCollapsed ? "Show calculators" : "Hide calculators"}
          onClick={() => onCollapsedChange(!isCollapsed)}
          style={{ width: 42, padding: 0 }}
        >
          {isCollapsed ? <Plus size={16} aria-hidden="true" /> : <Minus size={16} aria-hidden="true" />}
        </Button>
      </div>

      {!isCollapsed && calculators.map((calculator) => (
        <LineCalculatorCard
          key={calculator.id}
          calculator={calculator}
          updateCalculator={updateCalculator}
          removeCalculator={removeCalculator}
        />
      ))}
    </div>
  );
}

function GeneralNotesCard({ value, onChange, isCollapsed, onCollapsedChange }) {
  if (isCollapsed) {
    return (
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 42px", gap: 8, alignItems: "center" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ ...styles.muted, fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>Notes</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {hasText(value) ? value : "-"}
            </div>
          </div>
          <Button
            small
            aria-label="Show notes"
            title="Show notes"
            onClick={() => onCollapsedChange(false)}
            style={{ width: 42, padding: 0 }}
          >
            <Plus size={16} aria-hidden="true" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 42px", gap: 8, alignItems: "start" }}>
        <Field label="Notes" value={value || ""} onChange={onChange} textarea />
        <Button
          small
          aria-label="Hide notes"
          title="Hide notes"
          onClick={() => onCollapsedChange(true)}
          style={{ width: 42, padding: 0, marginTop: 26 }}
        >
          <Minus size={16} aria-hidden="true" />
        </Button>
      </div>
    </Card>
  );
}

function SettingsNotesFields({ notes, onAddNote, onChangeNote }) {
  const normalizedNotes = normalizeSettingsNotes(notes);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <label style={{ ...styles.label, marginBottom: 0 }}>Notes</label>
        <Button small onClick={onAddNote} aria-label="Add settings note" style={{ width: 36, minHeight: 34, padding: 0 }}>
          <Plus size={16} aria-hidden="true" />
        </Button>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {normalizedNotes.map((note, index) => (
          <Field
            key={note.id}
            label={index === 0 ? "Note" : `Note ${index + 1}`}
            value={note.note}
            onChange={(value) => onChangeNote(note.id, value)}
            textarea
          />
        ))}
      </div>
    </div>
  );
}

function SettingsNotesCard({ notes, onAddNote, onChangeNote }) {
  return (
    <Card>
      <SettingsNotesFields notes={notes} onAddNote={onAddNote} onChangeNote={onChangeNote} />
    </Card>
  );
}

function TemperatureSettings({ temperatures, settingsNotes, onChange, onAddSettingsNote, onUpdateSettingsNote, onSaveDieNumber, onImportLastDieSetting }) {
  const cardTitle = { fontSize: 14, fontWeight: 900, color: "var(--wn-title, #e2bd73)", marginBottom: 8, textShadow: "var(--wn-title-shadow, 0 1px 0 #000)" };
  const renderInput = ([key, label], inputMode = "numeric") => (
    <div key={key} style={{ direction: "ltr" }}>
      <label style={styles.temperatureLabel}>{label}</label>
      <input
        inputMode={inputMode}
        value={temperatures?.[key] || ""}
        onChange={(event) => onChange(key, event.target.value)}
        style={styles.temperatureInput}
      />
    </div>
  );

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 74px", gap: 8, alignItems: "end" }}>
          {renderInput(DIE_NUMBER_FIELD, "text")}
          <select
            aria-label="Die file options"
            value=""
            onChange={(event) => {
              if (event.target.value === "save") onSaveDieNumber();
              if (event.target.value === "import") onImportLastDieSetting();
              event.target.value = "";
            }}
            style={{ ...styles.button, ...styles.smallButton, width: "100%", padding: "7px 8px", textAlign: "center" }}
          >
            <option value="">File</option>
            <option value="save">Save</option>
            <option value="import">Import Last</option>
          </select>
        </div>
      </Card>

      <Card>
        <div style={cardTitle}>Temperatures</div>
        <div style={styles.temperatureGrid}>{TEMPERATURE_FIELDS.map(renderInput)}</div>
        <div style={{ ...styles.settingsGridFour, marginTop: 8 }}>{AUX_TEMPERATURE_FIELDS.map(renderInput)}</div>
      </Card>

      <Card>
        <div style={cardTitle}>Down Stream</div>
        <div style={styles.settingsGridThree}>{PROCESS_SETTING_FIELDS.map((field) => renderInput(field, "text"))}</div>
      </Card>

      <Card>
        <div style={styles.settingsGridThree}>{PRODUCTION_SETTING_FIELDS.map((field) => renderInput(field, "text"))}</div>
      </Card>

      <SettingsNotesCard notes={settingsNotes} onAddNote={onAddSettingsNote} onChangeNote={onUpdateSettingsNote} />
    </div>
  );
}

function DieSettingsScreen({
  dieSettings,
  goHome,
  goLineView,
  onMenuClick,
  onDeleteDieSetting,
  onUpdateDieSettingTemperature,
  onAddDieSettingNote,
  onUpdateDieSettingNote,
}) {
  const [editingId, setEditingId] = useState("");
  const cardTitle = { fontSize: 14, fontWeight: 900, color: "var(--wn-title, #e2bd73)", marginBottom: 8, textShadow: "var(--wn-title-shadow, 0 1px 0 #000)" };
  const renderInput = (setting, [key, label], inputMode = "text") => (
    <div key={key} style={{ direction: "ltr" }}>
      <label style={styles.temperatureLabel}>{label}</label>
      <input
        inputMode={inputMode}
        value={setting.temperatures?.[key] || ""}
        onChange={(event) => onUpdateDieSettingTemperature(setting.id, key, event.target.value)}
        style={styles.temperatureInput}
      />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Card style={{ ...styles.topBarCard, position: "sticky", top: 0, zIndex: 60 }}>
        <div style={{ display: "grid", gridTemplateColumns: "92px minmax(0, 1fr) 74px", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6, justifySelf: "start" }}>
            <Button small onClick={goHome} aria-label="Home" style={{ width: 42 }}>
              <Home size={16} aria-hidden="true" />
            </Button>
            <Button small onClick={goLineView}>Line</Button>
          </div>

          <div style={styles.screenTitle}>Die #</div>

          <Button small onClick={onMenuClick} style={{ justifySelf: "stretch", padding: "7px 5px", fontSize: 11 }}>
            <Menu size={14} aria-hidden="true" />
            Menu
          </Button>
        </div>
      </Card>

      {dieSettings.length === 0 ? (
        <Card>
          <div style={{ color: "var(--wn-label, #d7c497)", fontWeight: 800 }}>No saved die settings yet.</div>
        </Card>
      ) : (
        dieSettings.map((setting) => (
          <Card key={setting.id}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 8, alignItems: "start" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: "var(--wn-title, #e2bd73)" }}>{setting.dieNumber}</div>
                {hasText(setting.savedAt) && <div style={{ ...styles.muted, fontSize: 11, marginTop: 2 }}>Date {formatSavedAt(setting.savedAt)}</div>}
              </div>
              <Button small onClick={() => setEditingId((currentId) => (currentId === setting.id ? "" : setting.id))}>
                Edit
              </Button>
            </div>

            {editingId === setting.id && (
              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                <div>
                  <div style={cardTitle}>Die #</div>
                  <div style={styles.settingsGridThree}>{[DIE_NUMBER_FIELD].map((field) => renderInput(setting, field))}</div>
                </div>
                <div>
                  <div style={cardTitle}>Temperatures</div>
                  <div style={styles.temperatureGrid}>{TEMPERATURE_FIELDS.map((field) => renderInput(setting, field, "numeric"))}</div>
                  <div style={{ ...styles.settingsGridFour, marginTop: 8 }}>{AUX_TEMPERATURE_FIELDS.map((field) => renderInput(setting, field, "numeric"))}</div>
                </div>
                <div>
                  <div style={cardTitle}>Down Stream</div>
                  <div style={styles.settingsGridThree}>{PROCESS_SETTING_FIELDS.map((field) => renderInput(setting, field))}</div>
                </div>
                <div>
                  <div style={cardTitle}>Gram Weight</div>
                  <div style={styles.settingsGridThree}>{PRODUCTION_SETTING_FIELDS.map((field) => renderInput(setting, field))}</div>
                </div>
                <SettingsNotesFields
                  notes={setting.settingsNotes}
                  onAddNote={() => onAddDieSettingNote(setting.id)}
                  onChangeNote={(noteId, value) => onUpdateDieSettingNote(setting.id, noteId, value)}
                />
                <Button small onClick={() => onDeleteDieSetting(setting.id)}>Delete</Button>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}

function HighlightedParagraph({ parts, fallback, style }) {
  const textParts = parts?.length ? parts : [{ text: fallback || "" }];

  return (
    <p style={style}>
      {textParts.map((part, index) => (
        <span key={`${part.text}-${index}`} style={part.highlight ? { color: "var(--wn-title, #e2bd73)", fontWeight: 900 } : undefined}>
          {part.text}
        </span>
      ))}
    </p>
  );
}

function FiveSPageHeader({ title, goHome, onReport }) {
  return (
    <Card style={{ ...styles.topBarCard, position: "sticky", top: 0, zIndex: 60 }}>
      <div style={{ display: "grid", gridTemplateColumns: "42px minmax(0, 1fr) 74px", gap: 8, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6, justifySelf: "start" }}>
          <Button small onClick={goHome} aria-label="Home" style={{ width: 42 }}>
            <Home size={16} aria-hidden="true" />
          </Button>
        </div>

        <div style={styles.screenTitle}>{title}</div>

        <Button small onClick={onReport} style={{ justifySelf: "stretch", padding: "7px 5px", fontSize: 11 }}>Report</Button>
      </div>
    </Card>
  );
}

function FiveSScreen({ goHome, onSelectStep, onReport }) {
  const pageTitle = { fontSize: 18, fontWeight: 900, color: "var(--wn-title, #e2bd73)", marginBottom: 8, textShadow: "var(--wn-title-shadow, 0 1px 0 #000)" };
  const sectionTitle = { fontSize: 15, fontWeight: 900, color: "var(--wn-title, #e2bd73)", marginBottom: 6 };
  const paragraph = { fontSize: 14, lineHeight: "19px", margin: "0 0 8px", color: "var(--wn-text, #f1dfb6)", whiteSpace: "pre-line" };
  const list = { margin: "4px 0 10px 18px", padding: 0, display: "grid", gap: 3, fontSize: 14, lineHeight: "18px" };
  const stepButton = {
    ...styles.button,
    width: "fit-content",
    maxWidth: "100%",
    justifyContent: "center",
    marginBottom: 8,
    minHeight: 34,
    padding: "7px 10px",
    fontSize: 12,
    lineHeight: "15px",
    whiteSpace: "nowrap",
    color: "var(--wn-title, #e2bd73)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <FiveSPageHeader title="5S" goHome={goHome} onReport={onReport} />

      <Card>
        <div style={pageTitle}>5S</div>
        <p style={paragraph}>5S is a workplace organization system designed to improve:</p>
        <ul style={list}>
          {FIVE_S_IMPROVEMENTS.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p style={paragraph}>It focuses on reducing waste, confusion, and unnecessary movement by creating a structured work environment.</p>
        <p style={paragraph}>The name comes from five steps:</p>
      </Card>

      {FIVE_S_STEPS.map((step, index) => (
        <Card key={step.title}>
          <button type="button" style={stepButton} onClick={() => onSelectStep(index)}>
            {index + 1}. {step.title}
          </button>
          <HighlightedParagraph parts={step.descriptionParts} fallback={step.description} style={paragraph} />
          <p style={paragraph}>{step.listTitle}</p>
          <ul style={list}>
            {step.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <p style={paragraph}>{step.goal}</p>
        </Card>
      ))}

      <Card>
        <div style={sectionTitle}>What 5S Tries to Improve</div>
        <p style={paragraph}>5S mainly reduces:</p>
        <ul style={list}>
          {FIVE_S_REDUCES.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p style={paragraph}>It creates a workspace that is easier to understand, maintain, and manage.</p>
      </Card>

      <Card>
        <div style={sectionTitle}>Common Misunderstanding</div>
        <p style={paragraph}>5S is often mistaken for:</p>
        <p style={paragraph}>"just cleaning."</p>
        <p style={paragraph}>But the actual purpose is creating a system where:</p>
        <ul style={list}>
          {FIVE_S_SYSTEM_GOALS.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p style={paragraph}>Cleaning is only one part of it.</p>
      </Card>
    </div>
  );
}

function FiveSDetailScreen({ stepIndex, notes, onNoteChange, goHome, goFiveSOverview, onReport }) {
  const [deleteArmedCard, setDeleteArmedCard] = useState("");
  const step = FIVE_S_STEPS[stepIndex] || FIVE_S_STEPS[0];
  const currentNotes = normalizeFiveSNoteEntry(notes?.[String(stepIndex)]);
  const goalLabel = fiveSGoalLabel(stepIndex);
  const resultLabel = fiveSResultLabel(stepIndex);
  const isSortStep = stepIndex === 0;
  const sortCards = getFiveSSortCards(currentNotes).filter((card) => !card.deleted);
  const targetAreaBoxStyle = isSortStep ? { width: "50%", minWidth: 150, maxWidth: "100%" } : {};
  const goalInputStyle = isSortStep ? { ...styles.input, ...targetAreaBoxStyle } : { ...styles.textarea, minHeight: 92 };
  const paragraph = { fontSize: 14, lineHeight: "19px", margin: "0 0 8px", color: "var(--wn-text, #f1dfb6)", whiteSpace: "pre-line" };
  const list = { margin: "4px 0 10px 18px", padding: 0, display: "grid", gap: 3, fontSize: 14, lineHeight: "18px" };
  const sectionTitle = { fontSize: 15, fontWeight: 900, color: "var(--wn-title, #e2bd73)", marginBottom: 6, marginTop: 12 };
  const redDeleteStyle = { background: "linear-gradient(180deg, #8e2929 0%, #4a1111 100%)", borderColor: "#e18b8b", color: "#ffe2e2" };
  const sortIntroCardStyle = isSortStep
    ? {
      position: "sticky",
      top: 62,
      zIndex: 55,
    }
    : undefined;

  const renderGoalCard = (noteEntry, cardId = "") => {
    const items = noteEntry.items.length ? noteEntry.items : noteEntry.result ? [noteEntry.result] : [];
    const deleteKey = `${stepIndex}:${cardId || "single"}`;
    const deleteArmed = deleteArmedCard === deleteKey;
    const updateField = (field, value, itemIndex) => {
      setDeleteArmedCard("");
      onNoteChange(stepIndex, field, value, itemIndex, cardId);
    };
    const handleDeleteCard = () => {
      if (!deleteArmed) {
        setDeleteArmedCard(deleteKey);
        return;
      }

      onNoteChange(stepIndex, "deleteCard", "", undefined, cardId);
      setDeleteArmedCard("");
    };

    return (
      <Card key={cardId || "goal-card"}>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <label style={{ ...styles.label, marginBottom: 0 }}>{goalLabel}</label>
            <div style={{ display: "flex", gap: 6 }}>
              <Button small onClick={handleDeleteCard} style={deleteArmed ? redDeleteStyle : {}}>
                Delete
              </Button>
              <Button small active={!noteEntry.confirmed} onClick={() => updateField("confirmed", !noteEntry.confirmed)}>
                {noteEntry.confirmed ? "Edit" : "Confirm"}
              </Button>
            </div>
          </div>

          {noteEntry.confirmed ? (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={targetAreaBoxStyle}>
                <DisplayValue label={goalLabel} value={noteEntry.goal} wide />
              </div>
              <DisplayValue label={resultLabel} value={isSortStep ? items.filter(hasText).join("\n") : noteEntry.result} wide />
            </div>
          ) : (
            <>
              {isSortStep ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <input value={noteEntry.goal} onChange={(event) => updateField("goal", event.target.value)} style={goalInputStyle} />
                  <Button small onClick={() => updateField("addItem")} style={{ marginLeft: "auto" }}>+ Item</Button>
                </div>
              ) : (
                <textarea value={noteEntry.goal} onChange={(event) => updateField("goal", event.target.value)} style={goalInputStyle} />
              )}

              <label style={styles.label}>{resultLabel}</label>
              {isSortStep ? (
                <div style={{ display: "grid", gap: 6 }}>
                  {items.map((item, itemIndex) => (
                    <div key={itemIndex} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 34px", gap: 6, alignItems: "center", width: "88%", maxWidth: "100%" }}>
                      <input
                        value={item}
                        onChange={(event) => updateField("item", event.target.value, itemIndex)}
                        style={{ ...styles.input, width: "100%" }}
                      />
                      <Button small onClick={() => updateField("removeItem", "", itemIndex)} aria-label="Remove item" style={{ width: 34, minHeight: 38, padding: 0 }}>
                        -
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <textarea value={noteEntry.result} onChange={(event) => updateField("result", event.target.value)} style={{ ...styles.textarea, minHeight: 92 }} />
              )}
            </>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <FiveSPageHeader title={step.title} goHome={goHome} onReport={onReport} />

      <Card style={sortIntroCardStyle}>
        <div style={{ display: "grid", gridTemplateColumns: isSortStep ? "minmax(0, 1fr) auto" : "minmax(0, 1fr)", gap: 8, alignItems: "center" }}>
          <HighlightedParagraph parts={step.descriptionParts} fallback={step.description} style={{ ...paragraph, margin: 0 }} />
          {isSortStep && (
            <Button small onClick={() => onNoteChange(stepIndex, "addCard")} style={{ justifySelf: "end" }}>
              Add Target Area
            </Button>
          )}
        </div>
      </Card>

      {isSortStep ? (
        <>{sortCards.map((card) => renderGoalCard(card, card.id))}</>
      ) : currentNotes.deleted ? (
        <Card>
          <Button small onClick={() => onNoteChange(stepIndex, "restoreCard")}>Add Goal</Button>
        </Card>
      ) : (
        renderGoalCard(currentNotes)
      )}

      <Card>
        <div style={sectionTitle}>{step.listTitle}</div>
        <ul style={list}>
          {step.items.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p style={paragraph}>{step.goal}</p>
      </Card>

      <Button small onClick={goFiveSOverview} style={{ width: 120, maxWidth: "100%", minHeight: 34, padding: "6px 8px", fontSize: 12, marginBottom: 10, color: "var(--wn-title, #e2bd73)" }}>5S Overview</Button>
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
    addOperator,
    updateOperator,
    removeOperator,
    updateTemperature,
    addCalculator,
    updateCalculator,
    removeCalculator,
    updateGeneralNotes,
    addSettingsNote,
    updateSettingsNote,
    saveDieSetting,
    importLastDieSetting,
    lineRateCollapsed,
    setLineRateCollapsed,
    notesCollapsed,
    setNotesCollapsed,
    calculatorsCollapsed,
    setCalculatorsCollapsed,
    getTroubleshootCollapsed,
    setTroubleshootCollapsed,
    addBatch,
    updateBatch,
    removeBatch,
    removeMaterial,
    updateMaterial,
    addCoex,
    updateCoex,
    removeCoex,
    newCoexNumber,
    setNewCoexNumber,
    addNote,
    updateNote,
    addNoteAction,
    updateNoteAction,
    updateNoteTemperatureAdjustment,
    deleteNoteAction,
    addNoteResult,
    updateNoteResult,
    deleteNoteResult,
    deleteNote,
  } = props;
  const hasAnyCoex = selected.materials.some((material) => material.coexes.length > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Card style={{ ...styles.topBarCard, position: "sticky", top: 0, zIndex: 60 }}>
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

          <div style={styles.screenTitle}>Line {selectedLine}</div>

          {showSettings ? <div /> : <Button small onClick={addBatch} style={{ justifySelf: "stretch" }}>Add Batch</Button>}
        </div>
      </Card>

      {showSettings ? (
        <TemperatureSettings
          temperatures={selected.temperatures}
          settingsNotes={selected.settingsNotes}
          onChange={updateTemperature}
          onAddSettingsNote={addSettingsNote}
          onUpdateSettingsNote={updateSettingsNote}
          onSaveDieNumber={saveDieSetting}
          onImportLastDieSetting={importLastDieSetting}
        />
      ) : (
        <>
          <OperatorCard operators={normalizeOperators(selected)} addOperator={addOperator} updateOperator={updateOperator} removeOperator={removeOperator} />

          {selected.batches.map((batch, index) => {
            const batchMaterials = selected.materials.filter((material) => isMaterialForBatch(material, batch, index));
            const batchNotes = selected.notes.filter((note) => note.batchId === batch.id || (!note.batchId && index === 0 && hasTroubleshootContent(note)));
            const isEditing = !batch.confirmed;

            return (
              <Card key={batch.id} className={`batch-card batch-card-${index % 4}`}>
                <div className="batch-theme-tag">{batch.batch ? `Batch ${batch.batch}` : "Batch"}</div>
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

                    {batchMaterials.length > 0 && (
                      <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                        {batchMaterials.map((material) => (
                          <MaterialFields
                            key={material.id}
                            material={material}
                            canAddCoex={!hasAnyCoex}
                            canDelete={batchMaterials.length > 1}
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

                    <div style={{ marginTop: 10 }}>
                      <Button small onClick={() => addNote(batch.id, batch)} style={{ width: "100%" }}>Troubleshoot</Button>
                    </div>

                    {batchNotes.length > 0 && (
                      <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                        {batchNotes.map((note) => (
                          <TroubleshootFields
                            key={note.id}
                            note={note}
                            temperatures={selected.temperatures}
                            updateNote={updateNote}
                            addNoteAction={addNoteAction}
                            updateNoteAction={updateNoteAction}
                            updateNoteTemperatureAdjustment={updateNoteTemperatureAdjustment}
                            deleteNoteAction={deleteNoteAction}
                            addNoteResult={addNoteResult}
                            updateNoteResult={updateNoteResult}
                            deleteNoteResult={deleteNoteResult}
                            deleteNote={deleteNote}
                          />
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
                          <TroubleshootDisplay
                            key={note.id}
                            note={note}
                            temperatures={selected.temperatures}
                            isCollapsed={getTroubleshootCollapsed(note.id)}
                            onCollapsedChange={(isCollapsed) => setTroubleshootCollapsed(note.id, isCollapsed)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </Card>
            );
          })}

          <LineRateCard temperatures={selected.temperatures} onChange={updateTemperature} isCollapsed={lineRateCollapsed} onCollapsedChange={setLineRateCollapsed} />
          <GeneralNotesCard value={selected.generalNotes} onChange={updateGeneralNotes} isCollapsed={notesCollapsed} onCollapsedChange={setNotesCollapsed} />
          <LineCalculators
            calculators={selected.calculators || []}
            addCalculator={addCalculator}
            updateCalculator={updateCalculator}
            removeCalculator={removeCalculator}
            isCollapsed={calculatorsCollapsed}
            onCollapsedChange={setCalculatorsCollapsed}
          />
        </>
      )}
    </div>
  );
}

function ScheduleReport({ data, date, shift, exportReportPdf, isExporting, isPrintableReport, reportBack }) {
  const grid = { display: "grid", gridTemplateColumns: "28px 48px 45px 30px 1fr 48px", columnGap: 2, textAlign: "left" };
  const reportTheme = getReportTheme(isPrintableReport);
  const batchColumn = { paddingLeft: 6, boxSizing: "border-box" };

  return (
    <div>
      <PdfButton onBack={reportBack} onClick={exportReportPdf} isExporting={isExporting} printable={isPrintableReport} />
      <div id="print-area" style={reportTheme.shell}>
        <ReportHeader title="Schedule" date={date} shift={shift} printable={isPrintableReport} />
        <div data-pdf-card="true" style={reportTheme.block}>
          <div style={{ ...grid, ...reportTheme.headRow }}>
            <div>Line</div><div>Operator</div><div style={batchColumn}>Batch</div><div>Die</div><div>Description</div><div>Qty</div>
          </div>
          {Object.entries(data).map(([line, lineData]) => {
            const filledBatches = getFilledBatches(lineData);
            const operatorText = getOperatorText(lineData);
            const hasContent = hasText(operatorText) || filledBatches.length > 0;
            if (!hasContent) return null;

            const rowsToPrint = filledBatches.length ? filledBatches : [createBatch()];

            return (
              <div key={line} style={{ marginBottom: 4 }}>
                {rowsToPrint.map((batch, index) => (
                  <div key={batch.id} style={{ ...grid, ...reportTheme.row, marginBottom: index === rowsToPrint.length - 1 ? 0 : 2 }}>
                    <div>{index === 0 ? line : ""}</div>
                    <div>{index === 0 ? operatorText || "-" : ""}</div>
                    <div style={batchColumn}>{batch.batch || "-"}</div>
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

function TroubleshootReport({ data, date, shift, exportReportPdf, isExporting, isPrintableReport, reportBack }) {
  const grid = { display: "grid", gridTemplateColumns: "28px 42px 1fr 1fr 1fr", columnGap: 2 };
  const reportTheme = getReportTheme(isPrintableReport);

  return (
    <div>
      <PdfButton onBack={reportBack} onClick={exportReportPdf} isExporting={isExporting} printable={isPrintableReport} />
      <div id="print-area" style={reportTheme.shell}>
        <ReportHeader title="Troubleshoot" date={date} shift={shift} printable={isPrintableReport} />
        <div data-pdf-card="true" style={reportTheme.block}>
          <div style={{ ...grid, ...reportTheme.headRow }}>
            <div>Line</div><div>Die</div><div>Issue</div><div>Action</div><div>Result</div>
          </div>
          {Object.entries(data).map(([line, lineData]) => {
            const rows = getTroubleshootRowsForLine(line, lineData);
            if (!rows.length) return null;

            return rows.map((row, index) => (
              <div
                key={row.id}
                style={{
                  ...grid,
                  ...reportTheme.row,
                  ...(row.issueStart && index > 0 ? { borderTop: "1px solid rgba(202,165,107,.55)", paddingTop: 4 } : {}),
                  marginBottom: 4,
                }}
              >
                <div>{index === 0 ? row.line : ""}</div>
                <div>{row.die}</div>
                <div>{row.issue}</div>
                <div>{row.action}</div>
                <div>{row.result}</div>
              </div>
            ));
          })}
        </div>
      </div>
    </div>
  );
}

function MaterialsReport({ data, date, shift, exportReportPdf, isExporting, isPrintableReport, reportBack }) {
  const grid = { display: "grid", gridTemplateColumns: "28px 45px 45px 1fr 1fr 1fr 1fr" };
  const reportTheme = getReportTheme(isPrintableReport);

  return (
    <div>
      <PdfButton onBack={reportBack} onClick={exportReportPdf} isExporting={isExporting} printable={isPrintableReport} />
      <div id="print-area" style={reportTheme.shell}>
        <ReportHeader title="Materials" date={date} shift={shift} printable={isPrintableReport} />
        <div data-pdf-card="true" style={reportTheme.block}>
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

const getDailyReportLineDetails = (line, lineData) => {
  const filledBatches = getFilledBatches(lineData);
  const operatorText = getOperatorText(lineData);
  const materialRows = getMaterialRowsForReport(line, lineData);
  const troubleshootRows = getTroubleshootRowsForLine(line, lineData);
  const generalNotes = lineData.generalNotes || "";
  const hasContent = hasText(operatorText) || filledBatches.length > 0 || materialRows.length > 0 || troubleshootRows.length > 0 || hasText(generalNotes);
  const rowsToPrint = filledBatches.length ? filledBatches : [createBatch()];

  return { filledBatches, operatorText, materialRows, troubleshootRows, generalNotes, hasContent, rowsToPrint };
};

function DailyReportLineContent({ line, lineData, reportTheme, details }) {
  const scheduleGrid = { display: "grid", gridTemplateColumns: "48px 45px 30px 1fr 48px", columnGap: 2, textAlign: "left" };
  const materialGrid = { display: "grid", gridTemplateColumns: "45px 45px 1fr 1fr 1fr 1fr", columnGap: 2 };
  const troubleGrid = { display: "grid", gridTemplateColumns: "42px 1fr 1fr 1fr", columnGap: 2 };
  const sectionTitle = { ...reportTheme.headRow, borderBottom: 0, marginBottom: 4 };
  const batchColumn = { paddingLeft: 6, boxSizing: "border-box" };
  const reportDetails = details || getDailyReportLineDetails(line, lineData);
  const { operatorText, materialRows, troubleshootRows, generalNotes, rowsToPrint } = reportDetails;

  if (!reportDetails.hasContent) return null;

  return (
    <>
      <div style={{ ...scheduleGrid, ...reportTheme.headRow }}>
        <div>Operator</div><div style={batchColumn}>Batch</div><div>Die</div><div>Description</div><div>Qty</div>
      </div>
      {rowsToPrint.map((batch, index) => (
        <div key={batch.id} style={{ ...scheduleGrid, ...reportTheme.row, marginBottom: index === rowsToPrint.length - 1 ? 0 : 2 }}>
          <div>{index === 0 ? operatorText || "-" : ""}</div>
          <div style={batchColumn}>{batch.batch || "-"}</div>
          <div>{batch.die || ""}</div>
          <div>{batch.description || ""}</div>
          <div>{batch.quantity || ""}</div>
        </div>
      ))}

      {materialRows.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={sectionTitle}>Materials</div>
          <div style={{ ...materialGrid, ...reportTheme.headRow }}>
            <div>Die</div><div>Batch</div><div>Natural</div><div>Color</div><div>Regrind</div><div>Additive</div>
          </div>
          {materialRows.map((row, index) => (
            <div key={`${line}-${index}-${row.batch}`} style={{ ...materialGrid, ...reportTheme.row, marginBottom: 2 }}>
              <div style={{ textAlign: "left" }}>{row.die}</div>
              <div style={{ textAlign: "left" }}>{row.batch}</div>
              <div style={{ textAlign: "left" }}>{row.natural}</div>
              <div style={{ textAlign: "left" }}>{row.color}</div>
              <div style={{ textAlign: "left" }}>{row.regrind}</div>
              <div style={{ textAlign: "left" }}>{row.additive}</div>
            </div>
          ))}
        </div>
      )}

      {troubleshootRows.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={sectionTitle}>Troubleshoot</div>
          <div style={{ ...troubleGrid, ...reportTheme.headRow }}>
            <div>Die</div><div>Issue</div><div>Action</div><div>Result</div>
          </div>
          {troubleshootRows.map((row, index) => (
            <div
              key={row.id}
              style={{
                ...troubleGrid,
                ...reportTheme.row,
                ...(row.issueStart && index > 0 ? { borderTop: "1px solid rgba(202,165,107,.55)", paddingTop: 4 } : {}),
                marginBottom: 4,
              }}
            >
              <div>{row.die}</div>
              <div>{row.issue}</div>
              <div>{row.action}</div>
              <div>{row.result}</div>
            </div>
          ))}
        </div>
      )}

      {hasText(generalNotes) && (
        <div style={{ marginTop: 8 }}>
          <div style={sectionTitle}>General Notes</div>
          <div style={{ ...reportTheme.row, whiteSpace: "pre-wrap" }}>{generalNotes}</div>
        </div>
      )}
    </>
  );
}

function DailyReportLineCards({ data, reportTheme, lineTitleFor = (line) => `Line ${line}`, cardKeyPrefix = "" }) {
  const sectionTitle = { ...reportTheme.headRow, borderBottom: 0, marginBottom: 4 };

  return Object.entries(data).map(([line, lineData]) => {
    const details = getDailyReportLineDetails(line, lineData);
    if (!details.hasContent) return null;

    return (
      <div key={`${cardKeyPrefix}${line}`} data-pdf-card="true" style={reportTheme.block}>
        <div style={sectionTitle}>{lineTitleFor(line)}</div>
        <DailyReportLineContent line={line} lineData={lineData} reportTheme={reportTheme} details={details} />
      </div>
    );
  });
}

function WeeklyReportLineCards({ weekEntries, reportTheme }) {
  const sectionTitle = { ...reportTheme.headRow, borderBottom: 0, marginBottom: 4 };
  const dateTitle = { ...sectionTitle, color: reportTheme.row.color, marginBottom: 5 };
  const dateSectionStyle = (index) => ({
    ...(index > 0 ? { borderTop: "1px solid rgba(202,165,107,.55)", marginTop: 8, paddingTop: 6 } : {}),
  });

  return LINE_NUMBERS.map((lineNumber) => {
    const line = String(lineNumber);
    const dateEntries = weekEntries
      .map((entry) => {
        const lineData = entry.data[line] || createLineData();
        const details = getDailyReportLineDetails(line, lineData);
        return details.hasContent ? { ...entry, lineData, details } : null;
      })
      .filter(Boolean);

    if (!dateEntries.length) return null;

    return (
      <div key={line} data-pdf-card="true" style={reportTheme.block}>
        <div style={sectionTitle}>Line {line}</div>
        {dateEntries.map((entry, index) => (
          <div key={`${line}-${entry.date}`} data-pdf-date-section="true" style={dateSectionStyle(index)}>
            <div style={dateTitle}>{formatDisplayDate(entry.date)}</div>
            <DailyReportLineContent line={line} lineData={entry.lineData} reportTheme={reportTheme} details={entry.details} />
          </div>
        ))}
      </div>
    );
  });
}

function DailyReport({ data, date, shift, exportReportPdf, isExporting, isPrintableReport, reportBack }) {
  const reportTheme = getReportTheme(isPrintableReport);

  return (
    <div>
      <PdfButton onBack={reportBack} onClick={exportReportPdf} isExporting={isExporting} printable={isPrintableReport} />
      <div id="print-area" style={reportTheme.shell}>
        <ReportHeader title="Daily Report" date={date} shift={shift} printable={isPrintableReport} />
        <DailyReportLineCards data={data} reportTheme={reportTheme} />
      </div>
    </div>
  );
}

function WeeklyReport({ data, date, shift, exportReportPdf, isExporting, isPrintableReport, reportBack }) {
  const reportTheme = getReportTheme(isPrintableReport);
  const weekEntries = useMemo(() => getWeekDateValues(date).map((workDate) => ({
    date: workDate,
    data: workDate === date ? data : loadSavedData(workDate),
  })), [data, date]);

  return (
    <div>
      <PdfButton onBack={reportBack} onClick={exportReportPdf} isExporting={isExporting} printable={isPrintableReport} />
      <div id="print-area" style={reportTheme.shell}>
        <ReportHeader title="Weekly Report" date={date} dateLabel={formatWeekRange(date)} shift={shift} printable={isPrintableReport} />
        <WeeklyReportLineCards weekEntries={weekEntries} reportTheme={reportTheme} />
      </div>
    </div>
  );
}

function LineReport({ selectedLine, data, date, shift, exportReportPdf, isExporting, isPrintableReport, reportBack }) {
  const lineData = data[selectedLine] || createLineData();
  const batchGrid = { display: "grid", gridTemplateColumns: "48px 42px 1fr 46px", columnGap: 3 };
  const materialGrid = { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", columnGap: 3 };
  const troubleGrid = { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", columnGap: 3 };
  const reportTheme = getReportTheme(isPrintableReport);
  const settingCell = reportTheme.settingCell;
  const settingLabel = reportTheme.settingLabel;
  const settingValue = { fontSize: 12, fontWeight: 800, marginTop: 2, minHeight: 14, wordBreak: "break-word" };
  const settingGrid = { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 5 };
  const sectionInset = { paddingLeft: 8, boxSizing: "border-box" };
  const materialRows = getMaterialRowsForReport(selectedLine, lineData);
  const troubleshootRows = getTroubleshootRowsForLine(selectedLine, lineData);
  const filledBatches = getFilledBatches(lineData);
  const batchesToPrint = filledBatches.length ? filledBatches : lineData.batches;
  const renderSetting = ([key, label, calculatedValue]) => (
    <div key={key} style={settingCell}>
      <div style={settingLabel}>{label}</div>
      <div style={settingValue}>{hasText(calculatedValue) ? calculatedValue : lineData.temperatures?.[key] || "-"}</div>
    </div>
  );

  return (
    <div>
      <PdfButton onBack={reportBack} onClick={exportReportPdf} isExporting={isExporting} printable={isPrintableReport} />
      <div id="print-area" style={reportTheme.shell}>
        <ReportHeader title={`Line ${selectedLine} Report`} date={date} shift={shift} printable={isPrintableReport} />

        <div data-pdf-card="true" style={reportTheme.block}>
          <div style={{ ...reportTheme.headRow, borderBottom: 0, marginBottom: 4 }}>Line Information</div>
          <div style={settingGrid}>
            {[
              ["line", "Line", selectedLine],
              ["operator", "Operator", getOperatorText(lineData) || "-"],
              ["date", "Date", formatDisplayDate(date)],
              ["shift", "Shift", shift],
            ].map(renderSetting)}
          </div>
        </div>

        <div data-pdf-card="true" style={reportTheme.block}>
          <div style={{ ...reportTheme.headRow, borderBottom: 0, marginBottom: 4 }}>Batch Information</div>
          <div style={sectionInset}>
            <div style={{ ...batchGrid, ...reportTheme.headRow }}>
              <div>Batch</div><div>Die</div><div>Description</div><div>Qty</div>
            </div>
            {batchesToPrint.map((batch) => (
              <div key={batch.id} style={{ ...batchGrid, ...reportTheme.row, marginBottom: 3 }}>
                <div>{batch.batch || "-"}</div>
                <div>{batch.die || ""}</div>
                <div>{batch.description || ""}</div>
                <div>{batch.quantity || ""}</div>
              </div>
            ))}
          </div>

          {materialRows.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ ...reportTheme.headRow, borderBottom: 0, marginBottom: 4 }}>Materials</div>
              <div style={sectionInset}>
                <div style={{ ...materialGrid, ...reportTheme.headRow }}>
                  <div>Natural</div><div>Color</div><div>Regrind</div><div>Additive</div>
                </div>
                {materialRows.map((row, index) => (
                  <div key={`${row.batch}-${index}`} style={{ ...materialGrid, ...reportTheme.row, marginBottom: 3 }}>
                    <div>{row.natural}</div>
                    <div>{row.color}</div>
                    <div>{row.regrind}</div>
                    <div>{row.additive}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {troubleshootRows.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ ...reportTheme.headRow, borderBottom: 0, marginBottom: 4 }}>Troubleshoot</div>
              <div style={sectionInset}>
                <div style={{ ...troubleGrid, ...reportTheme.headRow }}>
                  <div>Issue</div><div>Action</div><div>Result</div>
                </div>
                {troubleshootRows.map((row, index) => (
                  <div
                    key={row.id}
                    style={{
                      ...troubleGrid,
                      ...reportTheme.row,
                      ...(row.issueStart && index > 0 ? { borderTop: "1px solid rgba(202,165,107,.55)", paddingTop: 4 } : {}),
                      marginBottom: 4,
                    }}
                  >
                    <div>{row.issue}</div>
                    <div>{row.action}</div>
                    <div>{row.result}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FiveSReport({ fiveSReportIndex, fiveSNotes, date, shift, exportReportPdf, isExporting, isPrintableReport, reportBack }) {
  const reportTheme = getReportTheme(isPrintableReport);
  const stepIndexes = typeof fiveSReportIndex === "number"
    ? [fiveSReportIndex]
    : FIVE_S_STEPS.map((_, index) => index);
  const detailGrid = { display: "grid", gridTemplateColumns: "72px minmax(0, 1fr)", columnGap: 6, rowGap: 4 };
  const reportTitleText = typeof fiveSReportIndex === "number" ? `${FIVE_S_STEPS[fiveSReportIndex]?.title || "5S"} Report` : "5S Report";

  return (
    <div>
      <PdfButton onBack={reportBack} onClick={exportReportPdf} isExporting={isExporting} printable={isPrintableReport} />
      <div id="print-area" style={reportTheme.shell}>
        <ReportHeader title={reportTitleText} date={date} shift={shift} printable={isPrintableReport} />

        {stepIndexes.flatMap((stepIndex) => {
          const step = FIVE_S_STEPS[stepIndex] || FIVE_S_STEPS[0];
          const currentNotes = normalizeFiveSNoteEntry(fiveSNotes?.[String(stepIndex)]);
          const noteEntries = stepIndex === 0
            ? getFiveSSortCards(currentNotes).filter((card) => !card.deleted)
            : currentNotes.deleted
              ? []
              : [currentNotes];

          return noteEntries.map((noteEntry, noteIndex) => (
            <div key={`${step.title}-${noteEntry.id || noteIndex}`} data-pdf-card="true" style={reportTheme.block}>
              <div style={{ ...reportTheme.headRow, borderBottom: 0, marginBottom: 5 }}>{step.title}</div>

              <div style={{ ...detailGrid, ...reportTheme.row }}>
                <div style={{ fontWeight: 800 }}>{fiveSGoalLabel(stepIndex)}</div>
                <div>{noteEntry.goal || "-"}</div>
                <div style={{ fontWeight: 800 }}>{fiveSResultLabel(stepIndex)}</div>
                <div>{stepIndex === 0 ? noteEntry.items.filter(hasText).join("\n") || "-" : noteEntry.result || "-"}</div>
              </div>
            </div>
          ));
        })}
      </div>
    </div>
  );
}

function ReportScreen({ reportTab, selectedLine, fiveSReportIndex, fiveSNotes, theme, onMenuClick, goHome, goLineView, goFiveSOverview, goFiveSDetail, data, isPrintableReport, togglePrintableReport, ...props }) {
  const reportTheme = getReportTheme(isPrintableReport);
  const printableButtonStyle = isPrintableReport ? reportTheme.activeButton : reportTheme.button;
  const isFiveSReport = reportTab === "fiveS";
  const reportBack = isFiveSReport
    ? typeof fiveSReportIndex === "number"
      ? () => goFiveSDetail(fiveSReportIndex)
      : goFiveSOverview
    : goLineView;
  const reportProps = { ...props, reportBack };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Card style={{ ...reportTheme.card, ...(!isPrintableReport ? styles.topBarCard : {}), position: "sticky", top: 0, zIndex: 60 }}>
        <div style={{ display: "grid", gridTemplateColumns: "92px minmax(0, 1fr) 142px", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6, justifySelf: "start" }}>
            <Button small onClick={goHome} aria-label="Home" style={{ ...reportTheme.button, width: 42 }}>
              <Home size={16} aria-hidden="true" />
            </Button>
            <Button small onClick={isFiveSReport ? goFiveSOverview : goLineView} style={reportTheme.button}>{isFiveSReport ? "5S" : "Line"}</Button>
          </div>

          <div
            style={{
              ...styles.screenTitle,
              fontSize: isPrintableReport ? 16 : 18,
              color: isPrintableReport ? "#000" : "var(--wn-title, #e2bd73)",
              textShadow: isPrintableReport ? "none" : styles.screenTitle.textShadow,
              whiteSpace: "nowrap",
              minWidth: 0,
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              {reportTitle(reportTab, selectedLine, fiveSReportIndex)}
              {theme === THEME_PINK && reportTab === "full" && <Sparkles size={13} aria-hidden="true" />}
            </span>
          </div>

          <div style={{ display: "flex", gap: 6, justifySelf: "stretch" }}>
            <Button small onClick={togglePrintableReport} style={{ ...printableButtonStyle, flex: "1 1 0", padding: "7px 5px", fontSize: 11 }}>Printable</Button>
            {!isFiveSReport && (
              <Button small onClick={onMenuClick} style={{ ...reportTheme.button, flex: "1 1 0", padding: "7px 5px", fontSize: 11 }}>
                <Menu size={14} aria-hidden="true" />
                Menu
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card style={reportTheme.card}>
        {reportTab === "full" && <DailyReport data={data} isPrintableReport={isPrintableReport} {...reportProps} />}
        {reportTab === "weekly" && <WeeklyReport data={data} isPrintableReport={isPrintableReport} {...reportProps} />}
        {reportTab === "schedule" && <ScheduleReport data={data} isPrintableReport={isPrintableReport} {...reportProps} />}
        {reportTab === "troubleshoot" && <TroubleshootReport data={data} isPrintableReport={isPrintableReport} {...reportProps} />}
        {reportTab === "materials" && <MaterialsReport data={data} isPrintableReport={isPrintableReport} {...reportProps} />}
        {reportTab === "line" && <LineReport selectedLine={selectedLine} data={data} isPrintableReport={isPrintableReport} {...reportProps} />}
        {reportTab === "fiveS" && <FiveSReport fiveSReportIndex={fiveSReportIndex} fiveSNotes={fiveSNotes} isPrintableReport={isPrintableReport} {...reportProps} />}
      </Card>
    </div>
  );
}

export default function App() {
  const [isExporting, setIsExporting] = useState(false);
  const [shift, setShift] = useState(getInitialShift);
  const [theme, setTheme] = useState(getInitialTheme);
  const [date, setDate] = useState(getInitialDate);
  const [data, setData] = useState(() => loadSavedData(getInitialDate()));
  const [selectedLine, setSelectedLine] = useState("1");
  const [screen, setScreen] = useState("lines");
  const [reportTab, setReportTab] = useState("schedule");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingLines, setIsEditingLines] = useState(false);
  const [lineVisibility, setLineVisibility] = useState(loadLineVisibility);
  const [collapseState, setCollapseState] = useState(loadCollapseState);
  const [dieSettings, setDieSettings] = useState(loadDieSettings);
  const [isPrintableReport, setIsPrintableReport] = useState(false);
  const [showLineSettings, setShowLineSettings] = useState(false);
  const [newCoexNumber, setNewCoexNumber] = useState("02");
  const [selectedFiveSIndex, setSelectedFiveSIndex] = useState(0);
  const [fiveSReportIndex, setFiveSReportIndex] = useState(null);
  const [fiveSNotes, setFiveSNotes] = useState(() => loadFiveSNotes(getInitialDate()));
  const [touchStartX, setTouchStartX] = useState(null);

  useEffect(() => {
    localStorage.setItem(`work-notes-${date}`, JSON.stringify(data));
  }, [data, date]);

  useEffect(() => {
    savePreference(ACTIVE_DATE_STORAGE_KEY, date);
  }, [date]);

  useEffect(() => {
    savePreference(ACTIVE_SHIFT_STORAGE_KEY, shift);
  }, [shift]);

  useEffect(() => {
    savePreference(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    savePreference(LINE_VISIBILITY_STORAGE_KEY, JSON.stringify(normalizeLineVisibility(lineVisibility)));
  }, [lineVisibility]);

  useEffect(() => {
    savePreference(UI_COLLAPSE_STORAGE_KEY, JSON.stringify(normalizeCollapseState(collapseState)));
  }, [collapseState]);

  useEffect(() => {
    savePreference(DIE_SETTINGS_STORAGE_KEY, JSON.stringify(normalizeDieSettings(dieSettings)));
  }, [dieSettings]);

  useEffect(() => {
    savePreference(`${FIVE_S_NOTES_STORAGE_PREFIX}-${date}`, JSON.stringify(normalizeFiveSNotes(fiveSNotes)));
  }, [date, fiveSNotes]);

  const selected = useMemo(() => data[selectedLine] || createLineData(), [data, selectedLine]);
  const selectedCollapseKey = `${date}:${selectedLine}`;
  const getCollapsed = (group, key) => Boolean(normalizeCollapseState(collapseState)[group]?.[key]);
  const setCollapsed = (group, key, isCollapsed) => {
    setCollapseState((previousState) => {
      const normalizedState = normalizeCollapseState(previousState);
      const nextGroup = { ...normalizedState[group] };
      if (isCollapsed) nextGroup[key] = true;
      else delete nextGroup[key];

      return { ...normalizedState, [group]: nextGroup };
    });
  };

  const updateSelectedLine = (lineUpdater) => {
    setData((previousData) => ({
      ...previousData,
      [selectedLine]: lineUpdater(previousData[selectedLine] || createLineData()),
    }));
  };

  const updateOperators = (operatorsUpdater) => {
    updateSelectedLine((lineData) => {
      const lineDataWithoutLegacyOperator = { ...lineData };
      delete lineDataWithoutLegacyOperator.operator;
      return {
        ...lineDataWithoutLegacyOperator,
        operators: operatorsUpdater(normalizeOperators(lineData)),
      };
    });
  };
  const addOperator = () => updateOperators((operators) => [...operators, createOperator()]);
  const updateOperator = (id, value) => {
    updateOperators((operators) => {
      const hasMatch = operators.some((operator) => operator.id === id);
      return operators.map((operator, index) => (
        operator.id === id || (!hasMatch && index === 0) ? { ...operator, name: value } : operator
      ));
    });
  };
  const removeOperator = (id) => {
    updateOperators((operators) => {
      const nextOperators = operators.filter((operator) => operator.id !== id);
      return nextOperators.length ? nextOperators : [createOperator()];
    });
  };
  const addCalculator = (type) => {
    if (!CALCULATOR_FIELDS[type]) return;
    updateSelectedLine((lineData) => ({ ...lineData, calculators: [...normalizeLineCalculators(lineData.calculators), createLineCalculator(type)] }));
  };
  const updateCalculator = (id, field, value) => {
    updateSelectedLine((lineData) => ({
      ...lineData,
      calculators: normalizeLineCalculators(lineData.calculators).map((calculator) => (
        calculator.id === id ? { ...calculator, inputs: { ...calculator.inputs, [field]: value } } : calculator
      )),
    }));
  };
  const removeCalculator = (id) => updateSelectedLine((lineData) => ({ ...lineData, calculators: normalizeLineCalculators(lineData.calculators).filter((calculator) => calculator.id !== id) }));
  const updateGeneralNotes = (value) => updateSelectedLine((lineData) => ({ ...lineData, generalNotes: value }));
  const addSettingsNote = () => updateSelectedLine((lineData) => ({ ...lineData, settingsNotes: [...normalizeSettingsNotes(lineData.settingsNotes), createSettingsNote()] }));
  const updateSettingsNote = (id, value) => {
    updateSelectedLine((lineData) => ({
      ...lineData,
      settingsNotes: normalizeSettingsNotes(lineData.settingsNotes).map((note) => (note.id === id ? { ...note, note: value } : note)),
    }));
  };

  const saveDieSetting = () => {
    const lineData = data[selectedLine] || createLineData();
    const currentDieNumber = String(lineData.temperatures?.dieNumber || "").trim();
    if (!hasText(currentDieNumber)) {
      window.alert("Enter a Die # before saving.");
      return;
    }

    setDieSettings((previousSettings) => {
      const normalizedSettings = normalizeDieSettings(previousSettings);
      return normalizeDieSettings([...normalizedSettings, createDieSettingFromLineData(lineData)]);
    });
    savePreference(`work-notes-${date}`, JSON.stringify(data));
    document.activeElement?.blur?.();
  };

  const importLastDieSetting = () => {
    const currentDieNumber = String((data[selectedLine] || createLineData()).temperatures?.dieNumber || "").trim();
    if (!hasText(currentDieNumber)) {
      window.alert("Enter a Die # before importing.");
      return;
    }

    const matchingSettings = normalizeDieSettings(dieSettings)
      .filter((setting) => setting.dieNumber.toLowerCase() === currentDieNumber.toLowerCase())
      .sort((first, second) => String(second.savedAt || "").localeCompare(String(first.savedAt || "")));

    if (!matchingSettings.length) {
      window.alert(`No saved settings found for Die # ${currentDieNumber}.`);
      return;
    }

    updateSelectedLine((lineData) => applyDieSettingToLineData(lineData, matchingSettings[0]));
    document.activeElement?.blur?.();
  };

  const deleteDieSetting = (id) => {
    if (!window.confirm("Delete this saved die setting?")) return;
    setDieSettings((previousSettings) => normalizeDieSettings(previousSettings).filter((setting) => setting.id !== id));
  };

  const updateDieSetting = (id, settingUpdater) => {
    setDieSettings((previousSettings) =>
      normalizeDieSettings(previousSettings).map((setting) => (
        setting.id === id ? normalizeDieSetting(settingUpdater(setting)) : setting
      ))
    );
  };

  const updateDieSettingTemperature = (id, field, value) => {
    updateDieSetting(id, (setting) => {
      const temperatures = { ...setting.temperatures, [field]: value };
      if (field === DIE_NUMBER_FIELD[0]) temperatures.dieNumber = value;

      return {
        ...setting,
        dieNumber: field === DIE_NUMBER_FIELD[0] ? value : setting.dieNumber,
        temperatures,
      };
    });
  };

  const addDieSettingNote = (id) => {
    updateDieSetting(id, (setting) => ({
      ...setting,
      settingsNotes: [...normalizeSettingsNotes(setting.settingsNotes), createSettingsNote()],
    }));
  };

  const updateDieSettingNote = (id, noteId, value) => {
    updateDieSetting(id, (setting) => ({
      ...setting,
      settingsNotes: normalizeSettingsNotes(setting.settingsNotes).map((note) => (note.id === noteId ? { ...note, note: value } : note)),
    }));
  };

  const addBatch = () => updateSelectedLine((lineData) => {
    const { batch, material } = createBatchWithMaterial();
    return { ...lineData, batches: [...lineData.batches, batch], materials: [...lineData.materials, material] };
  });

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
      const materials = lineData.materials.filter((material) => material.batchId !== id);
      if (batches.length) return { ...lineData, batches, materials: ensureMaterialsForBatches(batches, materials), notes: lineData.notes.filter((note) => note.batchId !== id) };

      const { batch, material } = createBatchWithMaterial();
      return {
        ...lineData,
        batches: [batch],
        materials: [material],
        notes: lineData.notes.filter((note) => note.batchId !== id),
      };
    });
  };

  const updateMaterial = (id, field, value) => {
    updateSelectedLine((lineData) => ({
      ...lineData,
      materials: lineData.materials.map((material) => (material.id === id ? { ...material, [field]: value } : material)),
    }));
  };

  const removeMaterial = (id) => {
    updateSelectedLine((lineData) => {
      const removedMaterial = lineData.materials.find((material) => material.id === id);
      const materials = lineData.materials.filter((material) => material.id !== id);
      const batch = lineData.batches.find((lineBatch) => lineBatch.id === removedMaterial?.batchId) || (!removedMaterial?.batchId ? lineData.batches[0] : null);
      if (!batch) return { ...lineData, materials };

      return { ...lineData, materials: ensureMaterialsForBatches(lineData.batches, materials) };
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

  const updateNoteActions = (id, actionsUpdater) => {
    updateSelectedLine((lineData) => ({
      ...lineData,
      notes: lineData.notes.map((note) => (note.id === id ? { ...note, actions: actionsUpdater(note.actions || []) } : note)),
    }));
  };

  const addNoteAction = (id, actionType = ACTION_TYPE_OTHER) => updateNoteActions(id, (actions) => [...actions, createTroubleshootAction("", [], actionType)]);
  const updateNoteAction = (id, actionId, field, value) => {
    updateNoteActions(id, (actions) => actions.map((action) => (action.id === actionId ? { ...action, [field]: value } : action)));
  };
  const updateNoteTemperatureAdjustment = (id, actionId, temperatureKey, value) => {
    updateNoteActions(id, (actions) =>
      actions.map((action) =>
        action.id === actionId
          ? { ...action, temperatureAdjustments: { ...createTemperatureAdjustments(), ...action.temperatureAdjustments, [temperatureKey]: value } }
          : action
      )
    );
  };
  const deleteNoteAction = (id, actionId) => {
    updateNoteActions(id, (actions) => actions.filter((action) => action.id !== actionId));
  };
  const addNoteResult = (id, actionId) => {
    updateNoteActions(id, (actions) => actions.map((action) => (action.id === actionId ? { ...action, results: [...(action.results || []), createTroubleshootResult()] } : action)));
  };
  const updateNoteResult = (id, actionId, resultId, field, value) => {
    updateNoteActions(id, (actions) =>
      actions.map((action) =>
        action.id === actionId
          ? { ...action, results: (action.results || []).map((result) => (result.id === resultId ? { ...result, [field]: value } : result)) }
          : action
      )
    );
  };
  const deleteNoteResult = (id, actionId, resultId) => {
    updateNoteActions(id, (actions) => actions.map((action) => (action.id === actionId ? { ...action, results: (action.results || []).filter((result) => result.id !== resultId) } : action)));
  };

  const deleteNote = (id) => updateSelectedLine((lineData) => ({ ...lineData, notes: lineData.notes.filter((note) => note.id !== id) }));

  const exportReportPdf = async () => {
    const reportElement = document.getElementById("print-area");
    if (!reportElement || isExporting) return;

    try {
      setIsExporting(true);
      const [{ default: html2canvas }, jspdfModule] = await Promise.all([import("html2canvas"), import("jspdf")]);
      const JsPDF = jspdfModule.default || jspdfModule.jsPDF;
      const backgroundColor = isPrintableReport ? "#ffffff" : "#10181c";
      const canvas = await html2canvas(reportElement, { scale: PDF_CANVAS_SCALE, backgroundColor, useCORS: true });
      const pdf = new JsPDF({ orientation: "p", unit: "pt", format: "letter" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const usableWidth = pageWidth - PDF_MARGIN * 2;
      const usableHeight = pageHeight - PDF_MARGIN * 2;
      const canvasToPdfScale = usableWidth / canvas.width;
      const pageHeightInCanvasPixels = usableHeight / canvasToPdfScale;
      const cardBounds = getPdfCardBounds(reportElement, canvas);
      const pageSlices = getPdfPageSlices(canvas.height, pageHeightInCanvasPixels, cardBounds);

      const weekDates = reportTab === "weekly" ? getWeekDateValues(date) : [];
      const reportName = reportTab === "line" ? `line_${selectedLine}` : reportTab === "full" ? "daily_report" : reportTab === "weekly" ? "weekly_report" : reportTab;
      const reportDateName = reportTab === "weekly" ? `${weekDates[0]}_to_${weekDates[6]}` : date;
      pageSlices.forEach((slice, index) => {
        if (index > 0) pdf.addPage();
        const sliceCanvas = createPdfSliceCanvas(canvas, slice, backgroundColor);
        const sliceHeight = sliceCanvas.height * canvasToPdfScale;
        pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", PDF_MARGIN, PDF_MARGIN, usableWidth, sliceHeight);
      });
      pdf.save(`${reportName}_${sanitizeFilename(reportDateName)}_shift_${shift}.pdf`);
    } catch (error) {
      console.error(error);
      window.alert("Could not create the PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const changeDate = (nextDate) => {
    if (!isDateInputValue(nextDate)) return;
    setDate(nextDate);
    setData(loadSavedData(nextDate));
    setFiveSNotes(loadFiveSNotes(nextDate));
  };

  const selectLine = (line) => {
    setSelectedLine(String(line));
    setScreen("entry");
    setIsEditingLines(false);
    setShowLineSettings(false);
    setIsMenuOpen(false);
  };

  const toggleLineVisibility = (lineKey) => {
    setLineVisibility((previousVisibility) => ({
      ...normalizeLineVisibility(previousVisibility),
      [lineKey]: !isLineVisible(previousVisibility, lineKey),
    }));
  };

  const toggleLineGroupVisibility = (group) => {
    setLineVisibility((previousVisibility) => {
      const normalizedVisibility = normalizeLineVisibility(previousVisibility);
      const nextGroupVisible = !isGroupVisible(normalizedVisibility, group);

      return {
        ...normalizedVisibility,
        ...Object.fromEntries(group.lines.map((line) => [String(line), nextGroupVisible])),
      };
    });
  };

  const moveLine = (direction) => {
    const currentIndex = LINE_NUMBERS.indexOf(Number(selectedLine));
    if (currentIndex < 0) return;

    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= LINE_NUMBERS.length) return;

    setSelectedLine(String(LINE_NUMBERS[nextIndex]));
  };

  const moveFiveSStep = (direction) => {
    setSelectedFiveSIndex((currentIndex) => {
      const nextIndex = currentIndex + direction;
      if (nextIndex < 0 || nextIndex >= FIVE_S_STEPS.length) return currentIndex;
      return nextIndex;
    });
  };

  const updateFiveSNote = (index, field, value, itemIndex, cardId) => {
    setFiveSNotes((previousNotes) => {
      const normalizedNotes = normalizeFiveSNotes(previousNotes);
      const key = String(index);
      const currentNote = normalizedNotes[key] || createFiveSNoteEntry();
      const isSortStep = Number(index) === 0;
      const sortCards = getFiveSSortCards(currentNote);
      const updateSortCards = (cards) => ({
        ...currentNote,
        cards,
        deleted: cards.length === 0,
      });

      if (isSortStep) {
        const targetCardId = cardId || SORT_PRIMARY_CARD_ID;
        const updateTargetCard = (cardUpdater) => {
          const nextCards = sortCards.map((card) => (card.id === targetCardId ? cardUpdater(card) : card));

          return {
            ...normalizedNotes,
            [key]: updateSortCards(nextCards),
          };
        };

        if (field === "addCard" || field === "restoreCard") {
          return {
            ...normalizedNotes,
            [key]: updateSortCards([...sortCards, createFiveSCardEntry()]),
          };
        }

        if (field === "deleteCard") {
          return updateTargetCard((card) => ({ ...card, ...createFiveSCardEntry(), id: card.id, deleted: true }));
        }

        if (field === "addItem") {
          return updateTargetCard((card) => {
            const currentItems = card.items.length ? card.items : card.result ? [card.result] : [];
            return { ...card, items: [...currentItems, ""] };
          });
        }

        if (field === "item") {
          return updateTargetCard((card) => {
            const currentItems = card.items.length ? card.items : [card.result || ""];
            const nextItems = currentItems.map((item, indexInItems) => (indexInItems === itemIndex ? value : item));

            return { ...card, items: nextItems, result: nextItems.filter(hasText).join("\n") };
          });
        }

        if (field === "removeItem") {
          return updateTargetCard((card) => {
            const currentItems = card.items.length ? card.items : card.result ? [card.result] : [];
            const nextItems = currentItems.filter((_, indexInItems) => indexInItems !== itemIndex);

            return { ...card, items: nextItems, result: nextItems.filter(hasText).join("\n") };
          });
        }

        return updateTargetCard((card) => ({ ...card, [field]: value }));
      }

      if (field === "deleteCard") {
        return {
          ...normalizedNotes,
          [key]: { ...createFiveSNoteEntry(), deleted: true },
        };
      }

      if (field === "restoreCard") {
        return {
          ...normalizedNotes,
          [key]: createFiveSNoteEntry(),
        };
      }

      if (field === "addItem") {
        const currentItems = currentNote.items.length ? currentNote.items : currentNote.result ? [currentNote.result] : [];

        return {
          ...normalizedNotes,
          [key]: { ...currentNote, items: [...currentItems, ""] },
        };
      }

      if (field === "item") {
        const currentItems = currentNote.items.length ? currentNote.items : [currentNote.result || ""];
        const nextItems = currentItems.map((item, indexInItems) => (indexInItems === itemIndex ? value : item));

        return {
          ...normalizedNotes,
          [key]: { ...currentNote, items: nextItems, result: nextItems.filter(hasText).join("\n") },
        };
      }

      if (field === "removeItem") {
        const currentItems = currentNote.items.length ? currentNote.items : currentNote.result ? [currentNote.result] : [];
        const nextItems = currentItems.filter((_, indexInItems) => indexInItems !== itemIndex);

        return {
          ...normalizedNotes,
          [key]: { ...currentNote, items: nextItems, result: nextItems.filter(hasText).join("\n") },
        };
      }

      return {
        ...normalizedNotes,
        [key]: { ...currentNote, [field]: value },
      };
    });
  };

  const goHome = () => {
    setScreen("lines");
    setShowLineSettings(false);
    setIsMenuOpen(false);
  };

  const goLineView = () => {
    setScreen("entry");
    setIsEditingLines(false);
    setShowLineSettings(false);
    setIsMenuOpen(false);
  };

  const goLineReport = () => {
    setReportTab("line");
    setScreen("report");
    setIsEditingLines(false);
    setShowLineSettings(false);
    setIsMenuOpen(false);
  };

  const goFiveSReport = (stepIndex = null) => {
    setFiveSReportIndex(typeof stepIndex === "number" ? stepIndex : null);
    setReportTab("fiveS");
    setScreen("report");
    setIsEditingLines(false);
    setShowLineSettings(false);
    setIsMenuOpen(false);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen((isOpen) => !isOpen);
  };

  const selectReport = (tab) => {
    setReportTab(tab);
    setScreen("report");
    setIsEditingLines(false);
    setShowLineSettings(false);
    setIsMenuOpen(false);
  };

  const openDieSettingsList = () => {
    setScreen("dieSettings");
    setShowLineSettings(false);
    setIsEditingLines(false);
    setIsMenuOpen(false);
  };

  const openSettingsPage = () => {
    setScreen("settings");
    setShowLineSettings(false);
    setIsEditingLines(false);
    setIsMenuOpen(false);
  };

  const openFiveSPage = () => {
    setScreen("fiveS");
    setShowLineSettings(false);
    setIsEditingLines(false);
    setIsMenuOpen(false);
  };

  const openFiveSDetail = (index) => {
    setSelectedFiveSIndex(index);
    setScreen("fiveSDetail");
    setShowLineSettings(false);
    setIsEditingLines(false);
    setIsMenuOpen(false);
  };

  const handleTouchEnd = (event) => {
    if (touchStartX == null) return;
    if (isMenuOpen) {
      setTouchStartX(null);
      return;
    }

    const endX = event.changedTouches[0].clientX;
    const deltaX = touchStartX - endX;

    if (Math.abs(deltaX) > 60) {
      const shouldSwipeLines = screen === "entry" || (screen === "report" && reportTab === "line");

      if (shouldSwipeLines) {
        if (deltaX > 0) moveLine(1);
        if (deltaX < 0) moveLine(-1);
      }

      if (screen === "fiveSDetail") {
        if (deltaX > 0) moveFiveSStep(1);
        if (deltaX < 0) moveFiveSStep(-1);
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
    addOperator,
    updateOperator,
    removeOperator,
    updateTemperature: (field, value) => updateSelectedLine((lineData) => ({ ...lineData, temperatures: { ...createTemperatures(), ...lineData.temperatures, [field]: value } })),
    addCalculator,
    updateCalculator,
    removeCalculator,
    updateGeneralNotes,
    addSettingsNote,
    updateSettingsNote,
    saveDieSetting,
    importLastDieSetting,
    lineRateCollapsed: getCollapsed("lineRate", selectedCollapseKey),
    setLineRateCollapsed: (isCollapsed) => setCollapsed("lineRate", selectedCollapseKey, isCollapsed),
    notesCollapsed: getCollapsed("notes", selectedCollapseKey),
    setNotesCollapsed: (isCollapsed) => setCollapsed("notes", selectedCollapseKey, isCollapsed),
    calculatorsCollapsed: getCollapsed("calculators", selectedCollapseKey),
    setCalculatorsCollapsed: (isCollapsed) => setCollapsed("calculators", selectedCollapseKey, isCollapsed),
    getTroubleshootCollapsed: (noteId) => getCollapsed("troubleshoot", `${selectedCollapseKey}:${noteId}`),
    setTroubleshootCollapsed: (noteId, isCollapsed) => setCollapsed("troubleshoot", `${selectedCollapseKey}:${noteId}`, isCollapsed),
    addBatch,
    updateBatch,
    removeBatch,
    addNote,
    updateNote,
    addNoteAction,
    updateNoteAction,
    updateNoteTemperatureAdjustment,
    deleteNoteAction,
    addNoteResult,
    updateNoteResult,
    deleteNoteResult,
    deleteNote,
    newCoexNumber,
    setNewCoexNumber,
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
    theme,
    exportReportPdf,
    isExporting,
    goHome,
    goLineView,
    goFiveSOverview: openFiveSPage,
    goFiveSDetail: openFiveSDetail,
    selectedLine,
    fiveSReportIndex,
    fiveSNotes,
    onMenuClick: toggleMenu,
    isPrintableReport,
    togglePrintableReport: () => setIsPrintableReport((isPrintable) => !isPrintable),
  };

  return (
    <div style={{ ...styles.page, ...getThemeVariables(theme) }} data-theme={theme} onTouchStart={(event) => setTouchStartX(event.touches[0].clientX)} onTouchEnd={handleTouchEnd}>
      <div style={styles.appFrame}>
        {isMenuOpen && <button type="button" aria-label="Close menu" style={styles.menuScrim} onClick={closeMenu} />}
        {isMenuOpen && (
          <SidePanel
            screen={screen}
            reportTab={reportTab}
            date={date}
            theme={theme}
            isDieNumberActive={screen === "dieSettings"}
            isFiveSActive={screen === "fiveS" || screen === "fiveSDetail" || (screen === "report" && reportTab === "fiveS")}
            onDateChange={changeDate}
            onSelectReport={selectReport}
            onSelectDieNumber={openDieSettingsList}
            onSelectFiveS={openFiveSPage}
          />
        )}

        <div style={styles.container}>
          {screen === "lines" && (
            <>
              <HomeHeader
                menuOpen={isMenuOpen}
                onMenuClick={toggleMenu}
                isEditingLines={isEditingLines}
                onEditClick={() => setIsEditingLines((isEditing) => !isEditing)}
                onSettingsClick={openSettingsPage}
              />
              <LinesScreen
                data={data}
                selectedLine={selectedLine}
                onSelectLine={selectLine}
                lineVisibility={lineVisibility}
                isEditingLines={isEditingLines}
                onToggleLine={toggleLineVisibility}
                onToggleLineGroup={toggleLineGroupVisibility}
              />
            </>
          )}

          {screen === "entry" && <EntryScreen {...sharedEntryProps} />}

          {screen === "settings" && (
            <SettingsScreen
              shift={shift}
              onShiftChange={setShift}
              theme={theme}
              onThemeChange={(nextTheme) => setTheme(normalizeTheme(nextTheme))}
              goHome={goHome}
              goLineView={goLineView}
              onMenuClick={toggleMenu}
            />
          )}

          {screen === "dieSettings" && (
            <DieSettingsScreen
              dieSettings={normalizeDieSettings(dieSettings)}
              goHome={goHome}
              goLineView={goLineView}
              onMenuClick={toggleMenu}
              onDeleteDieSetting={deleteDieSetting}
              onUpdateDieSettingTemperature={updateDieSettingTemperature}
              onAddDieSettingNote={addDieSettingNote}
              onUpdateDieSettingNote={updateDieSettingNote}
            />
          )}

          {screen === "fiveS" && <FiveSScreen goHome={goHome} onSelectStep={openFiveSDetail} onReport={() => goFiveSReport(null)} />}

          {screen === "fiveSDetail" && (
            <FiveSDetailScreen
              stepIndex={selectedFiveSIndex}
              notes={fiveSNotes}
              onNoteChange={updateFiveSNote}
              goHome={goHome}
              goFiveSOverview={openFiveSPage}
              onReport={() => goFiveSReport(selectedFiveSIndex)}
            />
          )}

          {screen === "report" && <ReportScreen reportTab={reportTab} {...sharedReportProps} />}
        </div>
      </div>
    </div>
  );
}
