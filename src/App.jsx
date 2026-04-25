import React, { useEffect, useMemo, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const lineNumbers = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,24,25,26,27,28,29,30,31];
const shiftOptions = ["A", "B", "C"];
const lineGroups = [
  { name: "Flex", lines: [1,2,3,4,5,6,7,8,9] },
  { name: "Custom", lines: [10,11,12,13,14,15,16,17,18] },
  { name: "Fence", lines: [24,25,26,27,28,29,30,31] },
];

const styles = {
  page:{minHeight:"100vh",background:"#f1f5f9",color:"#0f172a",padding:10,fontFamily:"Arial, sans-serif",boxSizing:"border-box"},
  container:{width:"100%",maxWidth:430,margin:"0 auto"},
  card:{background:"#fff",border:"1px solid #cbd5e1",borderRadius:16,boxShadow:"0 1px 3px rgba(0,0,0,.08)"},
  cardBody:{padding:12},
  label:{display:"block",fontSize:14,fontWeight:600,marginBottom:6},
  input:{width:"100%",color:"#0f172a",boxSizing:"border-box",padding:"10px 12px",border:"1px solid #cbd5e1",borderRadius:12,fontSize:14,background:"#fff"},
  textarea:{width:"100%",color:"#0f172a",boxSizing:"border-box",padding:"10px 12px",border:"1px solid #cbd5e1",borderRadius:12,fontSize:14,minHeight:74,resize:"vertical",background:"#fff"},
  button:{border:"1px solid #cbd5e1",background:"#fff",color:"#0f172a",borderRadius:14,padding:"10px 12px",fontSize:14,fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,minHeight:42},
  smallButton:{padding:"7px 9px",fontSize:12,minHeight:36},
  buttonPrimary:{background:"#0f172a",color:"#fff",border:"1px solid #0f172a"},
  entryTabGrid:{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:6,marginBottom:10,position:"sticky",top:0,zIndex:20,background:"#fff",paddingBottom:8,borderBottom:"1px solid #e2e8f0"},
  entryTabButton:{padding:"7px 3px",fontSize:11,minHeight:38},
  lineGrid:{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:10},
  lineColumn:{display:"flex",flexDirection:"column",gap:6},
  lineGroupTitle:{fontWeight:800,textAlign:"left",fontSize:14,marginBottom:2},
  lineButton:{minHeight:48,fontSize:18},
  shiftGrid:{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:8},
  batchRow:{display:"grid",gridTemplateColumns:"30% 1fr",gap:10,alignItems:"end"},
  noteGrid:{display:"grid",gridTemplateColumns:"1fr",gap:10},
  reportShell:{width:"100%",overflowX:"hidden"},
  reportHeader:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",alignItems:"center",marginBottom:8,paddingBottom:6,borderBottom:"1px solid #cbd5e1"},
  reportBlock:{border:"1px solid #cbd5e1",borderRadius:10,padding:6,marginBottom:8},
  reportGrid:{display:"grid",gridTemplateColumns:"28px 50px 52px 30px 1fr 60px",columnGap:2,textAlign:"left"},
  reportHeadRow:{fontSize:10,fontWeight:700,borderBottom:"1px solid #cbd5e1",paddingBottom:3,marginBottom:5,lineHeight:"12px"},
  reportRow:{fontSize:10,lineHeight:"12px",alignItems:"start",wordBreak:"break-word"},
  muted:{fontSize:13,color:"#64748b"},
  bottomNav:{position:"sticky",bottom:0,background:"#f1f5f9",paddingTop:8,marginTop:10,display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:8},
};

const makeId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const todayString = () => new Date().toISOString().slice(0,10);
const formatDisplayDate = (iso) => {
  if (!iso) return "";
  const [y,m,d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${parseInt(m,10)}-${parseInt(d,10)}-${y}`;
};

if (typeof window !== "undefined") {
  console.assert(formatDisplayDate("2026-04-23") === "4-23-2026", "formats ISO date");
  console.assert(formatDisplayDate("") === "", "keeps empty date empty");
  console.assert(formatDisplayDate("bad-input") === "bad-input", "passes malformed input through");
}

const newCoex = (number = 1) => ({ id: makeId(), number, natural:"", color:"", regrind:"", additive:"" });
const newMaterial = () => ({ id: makeId(), batch:"", die:"", natural:"", color:"", regrind:"", additive:"", coexes: [] });
const newBatch = () => ({ id: makeId(), batch:"", die:"", description:"", quantity:"" });

const buildData = () => Object.fromEntries(
  lineNumbers.map((line) => [String(line), { operator:"", batches:[newBatch()], materials:[newMaterial()], notes:[] }])
);

const normalizeCoexes = (coexes) => Array.isArray(coexes)
  ? coexes.map((c, i) => ({ id:c?.id || makeId(), number:c?.number || i + 1, natural:c?.natural || "", color:c?.color || "", regrind:c?.regrind || "", additive:c?.additive || "" }))
  : [];

const normalizeMaterials = (materials) => {
  if (Array.isArray(materials) && materials.length) {
    return materials.map((m) => {
      if (m?.isCoex) {
        return { id:m.id || makeId(), batch:"", die:"", natural:"", color:"", regrind:"", additive:"", coexes:[{ id:m.id || makeId(), number:m.coexNumber || 1, natural:m.natural || "", color:m.color || "", regrind:m.regrind || "", additive:m.additive || "" }] };
      }
      return {
        id:m?.id || makeId(),
        batch:m?.batch || "",
        die:m?.die || "",
        natural:m?.natural || "",
        color:m?.color || m?.material || "",
        regrind:m?.regrind || "",
        additive:m?.additive || "",
        coexes: normalizeCoexes(m?.coexes),
      };
    });
  }
  return [newMaterial()];
};

const normalizeBatches = (item) => Array.isArray(item?.batches) && item.batches.length
  ? item.batches.map((b) => ({ id:b?.id || makeId(), batch:b?.batch || "", die:b?.die || "", description:b?.description || "", quantity:b?.quantity || "" }))
  : [newBatch()];

const normalizeNotes = (notes) => Array.isArray(notes)
  ? notes.map((n) => ({ id:n?.id || makeId(), note:n?.note || n?.issue || "", action:n?.action || "", die:n?.die || "" }))
  : [];

const sanitizeFilename = (value) => value.replace(/[^a-z0-9-_]+/gi,"_");

export default function App(){
  const [isExporting,setIsExporting]=useState(false);
  const [shift,setShift]=useState("A");
  const [date,setDate]=useState(todayString());
  const [data,setData]=useState(buildData());
  const [selectedLine,setSelectedLine]=useState("1");
  const [screen,setScreen]=useState("lines");
  const [newNote,setNewNote]=useState("");
  const [newAction,setNewAction]=useState("");
  const [newDie,setNewDie]=useState("");
  const [newCoexNumber,setNewCoexNumber]=useState("02");
  const [touchStartX,setTouchStartX]=useState(null);
  const [entryTab,setEntryTab]=useState("schedule");
  const [reportTab,setReportTab]=useState("schedule");

  useEffect(()=>{
    const saved=localStorage.getItem(`work-notes-${date}`);
    if(!saved){ setData(buildData()); return; }
    try{
      const parsed=JSON.parse(saved);
      const base=buildData();
      Object.keys(parsed || {}).forEach((line)=>{
        if(!base[line]) return;
        const item=parsed[line] || {};
        base[line]={ operator:item.operator || "", batches:normalizeBatches(item), materials:normalizeMaterials(item.materials), notes:normalizeNotes(item.notes) };
      });
      setData(base);
    }catch{ setData(buildData()); }
  },[date]);

  useEffect(()=>{ localStorage.setItem(`work-notes-${date}`,JSON.stringify(data)); },[data,date]);

  const selected=useMemo(()=>data[selectedLine] || buildData()[selectedLine],[data,selectedLine]);

  const updateOperator=(value)=>setData((prev)=>({...prev,[selectedLine]:{...prev[selectedLine],operator:value}}));
  const updateBatch=(id,field,value)=>setData((prev)=>({...prev,[selectedLine]:{...prev[selectedLine],batches:prev[selectedLine].batches.map((b)=>b.id===id?{...b,[field]:value}:b)}}));
  const addBatch=()=>setData((prev)=>({...prev,[selectedLine]:{...prev[selectedLine],batches:[...prev[selectedLine].batches,newBatch()]}}));
  const removeBatch=(id)=>setData((prev)=>{const filtered=prev[selectedLine].batches.filter((b)=>b.id!==id);return {...prev,[selectedLine]:{...prev[selectedLine],batches:filtered.length?filtered:[newBatch()]}};});

  const updateMaterial=(id,field,value)=>setData((prev)=>({...prev,[selectedLine]:{...prev[selectedLine],materials:prev[selectedLine].materials.map((m)=>m.id===id?{...m,[field]:value}:m)}}));
  const addMaterial=()=>setData((prev)=>({...prev,[selectedLine]:{...prev[selectedLine],materials:[...prev[selectedLine].materials,newMaterial()]}}));
  const removeMaterial=(id)=>setData((prev)=>{const filtered=prev[selectedLine].materials.filter((m)=>m.id!==id);return {...prev,[selectedLine]:{...prev[selectedLine],materials:filtered.length?filtered:[newMaterial()]}};});
  const addCoex=(materialId)=>{
    const clean=String(newCoexNumber || "").trim().replace(/^Coex/i, "");
    if(!clean) return;
    setData((prev)=>({...prev,[selectedLine]:{...prev[selectedLine],materials:prev[selectedLine].materials.map((m)=>{
      if(m.id!==materialId) return m;
      return {...m,coexes:[newCoex(clean)]};
    })}}));
  };
  const updateCoex=(materialId,coexId,field,value)=>setData((prev)=>({...prev,[selectedLine]:{...prev[selectedLine],materials:prev[selectedLine].materials.map((m)=>m.id===materialId?{...m,coexes:(m.coexes || []).map((c)=>c.id===coexId?{...c,[field]:value}:c)}:m)}}));
  const removeCoex=(materialId,coexId)=>setData((prev)=>({...prev,[selectedLine]:{...prev[selectedLine],materials:prev[selectedLine].materials.map((m)=>m.id===materialId?{...m,coexes:(m.coexes || []).filter((c)=>c.id!==coexId)}:m)}}));

  const addNotePair=()=>{
    if(!newNote.trim() && !newAction.trim() && !newDie.trim()) return;
    setData((prev)=>({...prev,[selectedLine]:{...prev[selectedLine],notes:[...prev[selectedLine].notes,{id:makeId(),note:newNote.trim(),action:newAction.trim(),die:newDie.trim()}]}}));
    setNewNote(""); setNewAction(""); setNewDie("");
  };
  const deleteNotePair=(id)=>setData((prev)=>({...prev,[selectedLine]:{...prev[selectedLine],notes:prev[selectedLine].notes.filter((n)=>n.id!==id)}}));

  const exportReportPdf=async()=>{
    const reportElement=document.getElementById("print-area");
    if(!reportElement || isExporting) return;
    try{
      setIsExporting(true);
      const canvas=await html2canvas(reportElement,{scale:3,backgroundColor:"#ffffff",useCORS:true});
      const pdf=new jsPDF({orientation:"p",unit:"pt",format:"letter"});
      const margin=24;
      const pageWidth=pdf.internal.pageSize.getWidth();
      const usableWidth=pageWidth-margin*2;
      const imgHeight=(canvas.height*usableWidth)/canvas.width;
      pdf.addImage(canvas.toDataURL("image/png"),"PNG",margin,margin,usableWidth,imgHeight);
      pdf.save(`${reportTab}_${sanitizeFilename(date)}_shift_${shift}.pdf`);
    }catch(error){ console.error(error); window.alert("Could not create the PDF."); }
    finally{ setIsExporting(false); }
  };

  const selectLine=(line)=>{ setSelectedLine(String(line)); setScreen("entry"); };
  const moveLine=(direction)=>{
    const currentIndex=lineNumbers.indexOf(Number(selectedLine));
    if(currentIndex<0) return;
    const nextIndex=currentIndex+direction;
    if(nextIndex<0 || nextIndex>=lineNumbers.length) return;
    setSelectedLine(String(lineNumbers[nextIndex]));
  };
  const goNext=()=>{ if(screen==="lines") setScreen("entry"); else if(screen==="entry") setScreen("report"); };
  const goBack=()=>{ if(screen==="report") setScreen("entry"); else if(screen==="entry") setScreen("lines"); };
  const handleTouchEnd=(e)=>{
    if(touchStartX==null) return;
    const endX=e.changedTouches[0].clientX;
    const deltaX=touchStartX-endX;

    if(Math.abs(deltaX)>60){
      if(deltaX>0) goNext();
      if(deltaX<0) goBack();
    }

    setTouchStartX(null);
  };

  const materialRowsForReport=(line,item)=>{
    const rows=[];
    const fallbackDie=item.batches?.[0]?.die || "";
    item.materials.forEach((m,matIndex)=>{
      const hasMain=(m.batch||"").trim() || (m.die||"").trim() || (m.natural||"").trim() || (m.color||"").trim() || (m.regrind||"").trim() || (m.additive||"").trim() || (m.coexes||[]).length;
      if(!hasMain) return;
      rows.push({label: matIndex===0 ? line : "", die:m.die || (matIndex===0 ? fallbackDie : ""), batch:m.batch, natural:m.natural, color:m.color, regrind:m.regrind, additive:m.additive});
      (m.coexes || []).forEach((c)=>rows.push({label:`Coex${String(c.number).padStart(2,"0")}`, die:"", batch:"", natural:c.natural, color:c.color, regrind:c.regrind, additive:c.additive}));
    });
    return rows;
  };

  return (
    <div style={styles.page} onTouchStart={(e)=>setTouchStartX(e.touches[0].clientX)} onTouchEnd={handleTouchEnd}>
      <div style={styles.container}>
        {screen==="lines" && (
          <div style={styles.card}><div style={styles.cardBody}>
            <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} style={styles.input}/>
            <div style={{marginTop:14}}><label style={styles.label}>Shift</label><div style={styles.shiftGrid}>{shiftOptions.map((s)=><button key={s} onClick={()=>setShift(s)} style={{...styles.button,...(shift===s?styles.buttonPrimary:{})}}>{s}</button>)}</div></div>
            <div style={{marginTop:14}}><div style={styles.lineGrid}>{lineGroups.map((group)=><div key={group.name} style={styles.lineColumn}><div style={styles.lineGroupTitle}>{group.name}</div>{group.lines.map((line)=>{const firstDie=data[String(line)]?.batches?.[0]?.die;return <button key={line} onClick={()=>selectLine(line)} style={{...styles.button,...styles.lineButton,justifyContent:"space-between",...(selectedLine===String(line)?styles.buttonPrimary:{})}}><span>{line}</span><span style={{fontSize:14,opacity:.8}}>{firstDie || ""}</span></button>;})}</div>)}</div></div>
          </div></div>
        )}

        {screen==="entry" && (
          <div style={{display:"flex",flexDirection:"column",gap:10}}><div style={styles.card}><div style={styles.cardBody}>
            <div style={styles.entryTabGrid}>{["schedule","troubleshoot","materials","attendance"].map((tab)=><button key={tab} onClick={()=>setEntryTab(tab)} style={{...styles.button,...styles.entryTabButton,...(entryTab===tab?styles.buttonPrimary:{})}}>{tab==="troubleshoot"?"Troubleshoot":tab[0].toUpperCase()+tab.slice(1)}</button>)}</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <button onClick={()=>moveLine(1)} style={{...styles.button,...styles.smallButton}}>↑</button>
              <div style={{fontWeight:800,fontSize:18}}>Line {selectedLine}</div>
              <button onClick={()=>moveLine(-1)} style={{...styles.button,...styles.smallButton}}>↓</button>
            </div>

            {entryTab==="schedule" && <div>
              <label style={styles.label}>Operator</label><input value={selected.operator} onChange={(e)=>updateOperator(e.target.value)} style={styles.input}/>
              <div style={{marginTop:12}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><label style={styles.label}>Batches</label><button onClick={addBatch} style={{...styles.button,...styles.smallButton}}>+ Add Batch</button></div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>{selected.batches.map((b,index)=><div key={b.id} style={{...styles.card,boxShadow:"none"}}><div style={styles.cardBody}><div style={{...styles.muted,fontWeight:700,marginBottom:8}}>Batch {index+1}</div><div style={styles.batchRow}><div><label style={styles.label}>Batch</label><input value={b.batch} onChange={(e)=>updateBatch(b.id,"batch",e.target.value)} style={styles.input}/></div><div><label style={styles.label}>Die</label><input value={b.die} onChange={(e)=>updateBatch(b.id,"die",e.target.value)} style={styles.input}/></div></div><div style={{marginTop:10}}><label style={styles.label}>Description</label><input value={b.description} onChange={(e)=>updateBatch(b.id,"description",e.target.value)} style={styles.input}/></div><div style={{marginTop:10}}><label style={styles.label}>Quantity</label><input value={b.quantity} onChange={(e)=>updateBatch(b.id,"quantity",e.target.value)} style={styles.input}/></div><div style={{marginTop:8}}><button onClick={()=>removeBatch(b.id)} style={{...styles.button,...styles.smallButton}}>Delete</button></div></div></div>)}</div></div>
            </div>}

            {entryTab==="troubleshoot" && <div>
              <div style={styles.noteGrid}><div><label style={styles.label}>Die</label><input value={newDie} onChange={(e)=>setNewDie(e.target.value)} style={styles.input}/></div><div><label style={styles.label}>Notes</label><textarea value={newNote} onChange={(e)=>setNewNote(e.target.value)} style={styles.textarea}/></div><div><label style={styles.label}>Troubleshooting Steps Taken</label><textarea value={newAction} onChange={(e)=>setNewAction(e.target.value)} style={styles.textarea}/></div></div>
              <div style={{marginTop:10}}><button onClick={addNotePair} style={{...styles.button,...styles.buttonPrimary}}>+ Add Note / Troubleshooting</button></div>
              <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:8}}>{selected.notes.length>0?selected.notes.map((n,index)=><div key={n.id} style={{...styles.card,boxShadow:"none"}}><div style={styles.cardBody}><div style={{...styles.muted,fontWeight:700}}>Pair {index+1}</div><div style={{fontSize:14,marginTop:6}}><strong>Die:</strong> {n.die}</div><div style={{fontSize:14,marginTop:6}}><strong>Notes:</strong> {n.note}</div><div style={{fontSize:14,marginTop:4}}><strong>Troubleshooting Steps Taken:</strong> {n.action}</div><div style={{marginTop:8}}><button onClick={()=>deleteNotePair(n.id)} style={{...styles.button,...styles.smallButton}}>Delete</button></div></div></div>):<div style={styles.muted}>No troubleshooting entries yet.</div>}</div>
            </div>}

            {entryTab==="materials" && <div>
              <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",marginBottom:8}}><button onClick={addMaterial} style={{...styles.button,...styles.smallButton}}>+ Add</button></div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>{selected.materials.map((m,index)=><div key={m.id} style={{...styles.card,boxShadow:"none"}}><div style={styles.cardBody}><div style={{...styles.muted,fontWeight:700,marginBottom:6}}>Material Row {index+1}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><div><label style={styles.label}>Batch</label><input value={m.batch} onChange={(e)=>updateMaterial(m.id,"batch",e.target.value)} style={styles.input}/></div><div><label style={styles.label}>Die</label><input value={m.die} onChange={(e)=>updateMaterial(m.id,"die",e.target.value)} style={styles.input}/></div></div><div style={{marginTop:8}}><label style={styles.label}>Natural</label><input value={m.natural} onChange={(e)=>updateMaterial(m.id,"natural",e.target.value)} style={styles.input}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><div><label style={styles.label}>Color</label><input value={m.color} onChange={(e)=>updateMaterial(m.id,"color",e.target.value)} style={styles.input}/></div><div><label style={styles.label}>Regrind</label><input value={m.regrind} onChange={(e)=>updateMaterial(m.id,"regrind",e.target.value)} style={styles.input}/></div></div><div style={{marginTop:8}}><label style={styles.label}>Additive</label><input value={m.additive} onChange={(e)=>updateMaterial(m.id,"additive",e.target.value)} style={styles.input}/></div><div style={{display:"flex",gap:6,marginTop:8,alignItems:"end"}}>{!selected.materials.some((row)=>(row.coexes || []).length > 0) && <><div style={{width:80}}><label style={styles.label}>Coex #</label><input value={newCoexNumber} onChange={(e)=>setNewCoexNumber(e.target.value)} style={styles.input}/></div><button onClick={()=>addCoex(m.id)} style={{...styles.button,...styles.smallButton}}>+ Add Coex</button></>}<button onClick={()=>removeMaterial(m.id)} style={{...styles.button,...styles.smallButton}}>Delete</button></div>{(m.coexes || []).map((c)=><div key={c.id} style={{borderLeft:"3px solid #94a3b8",paddingLeft:8,marginTop:10}}><div style={{fontWeight:800,marginBottom:6}}>Coex{String(c.number).padStart(2,"0")}</div><div style={{marginTop:8}}><label style={styles.label}>Natural</label><input value={c.natural} onChange={(e)=>updateCoex(m.id,c.id,"natural",e.target.value)} style={styles.input}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><div><label style={styles.label}>Color</label><input value={c.color} onChange={(e)=>updateCoex(m.id,c.id,"color",e.target.value)} style={styles.input}/></div><div><label style={styles.label}>Regrind</label><input value={c.regrind} onChange={(e)=>updateCoex(m.id,c.id,"regrind",e.target.value)} style={styles.input}/></div></div><div style={{marginTop:8}}><label style={styles.label}>Additive</label><input value={c.additive} onChange={(e)=>updateCoex(m.id,c.id,"additive",e.target.value)} style={styles.input}/></div><div style={{marginTop:8}}><button onClick={()=>removeCoex(m.id,c.id)} style={{...styles.button,...styles.smallButton}}>Delete Coex</button></div></div>)}</div></div>)}</div>
            </div>}

            {entryTab==="attendance" && <div style={styles.muted}>Attendance tracking coming next.</div>}
          </div></div></div>
        )}

        {screen==="report" && (
          <div style={styles.card}><div style={styles.cardBody}>
            <div style={styles.entryTabGrid}>{["schedule","troubleshoot","materials","attendance"].map((tab)=><button key={tab} onClick={()=>setReportTab(tab)} style={{...styles.button,...styles.entryTabButton,...(reportTab===tab?styles.buttonPrimary:{})}}>{tab==="troubleshoot"?"Troubleshoot":tab[0].toUpperCase()+tab.slice(1)}</button>)}</div>

            {reportTab==="schedule" && <div><div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",marginBottom:10}}><button onClick={exportReportPdf} disabled={isExporting} style={{...styles.button,...styles.smallButton,...(isExporting?{opacity:.7}:{})}}>{isExporting?"PDF...":"PDF"}</button></div><div id="print-area" style={styles.reportShell}><div style={styles.reportHeader}><div style={{fontSize:13,fontWeight:700}}>Schedule</div><div style={{fontSize:13,fontWeight:700,textAlign:"left"}}>{formatDisplayDate(date)}</div><div style={{fontSize:13,fontWeight:700,textAlign:"right"}}>Shift {shift}</div></div><div style={styles.reportBlock}><div style={{...styles.reportGrid,...styles.reportHeadRow}}><div>Line</div><div>Operator</div><div>Batch</div><div>Die</div><div>Description</div><div>Quantity</div></div>{Object.entries(data).map(([line,item])=>{const filledBatches=item.batches.filter((b)=>(b.batch||"").trim()||(b.die||"").trim()||(b.description||"").trim()||(b.quantity||"").trim());const hasContent=(item.operator||"").trim()||filledBatches.length;if(!hasContent)return null;const rowsToPrint=filledBatches.length?filledBatches:[newBatch()];return <div key={line} style={{marginBottom:4}}>{rowsToPrint.map((b,index)=><div key={b.id} style={{...styles.reportGrid,...styles.reportRow,marginBottom:index===rowsToPrint.length-1?0:2}}><div>{index===0?line:""}</div><div>{index===0?item.operator||"-":""}</div><div>{b.batch||"-"}</div><div>{b.die||""}</div><div>{b.description||""}</div><div>{b.quantity||""}</div></div>)}</div>;})}</div></div></div>}

            {reportTab==="troubleshoot" && <div><div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",marginBottom:10}}><button onClick={exportReportPdf} disabled={isExporting} style={{...styles.button,...styles.smallButton,...(isExporting?{opacity:.7}:{})}}>{isExporting?"PDF...":"PDF"}</button></div><div id="print-area" style={styles.reportShell}><div style={styles.reportHeader}><div style={{fontSize:13,fontWeight:700}}>Troubleshoot</div><div style={{fontSize:13,fontWeight:700,textAlign:"left"}}>{formatDisplayDate(date)}</div><div style={{fontSize:13,fontWeight:700,textAlign:"right"}}>Shift {shift}</div></div><div style={styles.reportBlock}><div style={{display:"grid",gridTemplateColumns:"30px 50px 1fr 2fr",...styles.reportHeadRow}}><div>Line</div><div>Die</div><div>Issue</div><div>Troubleshooting Steps Taken</div></div>{Object.entries(data).map(([line,item])=>{if(!item.notes.length)return null;const firstDie=item.batches?.[0]?.die||"";return item.notes.map((n,index)=><div key={n.id} style={{display:"grid",gridTemplateColumns:"30px 50px 1fr 2fr",...styles.reportRow,marginBottom:4}}><div>{index===0?line:""}</div><div>{n.die||(index===0?firstDie:"")}</div><div>{n.note||""}</div><div>{n.action||""}</div></div>);})}</div></div></div>}

            {reportTab==="materials" && <div><div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}><button onClick={exportReportPdf} style={{...styles.button,...styles.smallButton}}>PDF</button></div><div id="print-area" style={styles.reportShell}><div style={styles.reportHeader}><div style={{fontWeight:700}}>Materials</div><div style={{textAlign:"left"}}>{formatDisplayDate(date)}</div><div style={{textAlign:"right"}}>Shift {shift}</div></div><div style={styles.reportBlock}><div style={{display:"grid",gridTemplateColumns:"28px 45px 45px 1fr 1fr 1fr 1fr",...styles.reportHeadRow}}><div>Line</div><div>Die</div><div>Batch</div><div>Natural</div><div>Color</div><div>Regrind</div><div>Additive</div></div>{Object.entries(data).map(([line,item])=>{const rows=materialRowsForReport(line,item);if(!rows.length)return null;return rows.map((r,i)=><div key={`${line}-${i}-${r.label}`} style={{display:"grid",gridTemplateColumns:"28px 45px 45px 1fr 1fr 1fr 1fr",...styles.reportRow,marginBottom:2}}><div style={{textAlign:"left",whiteSpace:"nowrap"}}>{r.label}</div><div style={{textAlign:"left"}}>{r.die}</div><div style={{textAlign:"left"}}>{r.batch}</div><div style={{textAlign:"left"}}>{r.natural}</div><div style={{textAlign:"left"}}>{r.color}</div><div style={{textAlign:"left"}}>{r.regrind}</div><div style={{textAlign:"left"}}>{r.additive}</div></div>);})}</div></div></div>}
            {reportTab==="attendance" && <div style={styles.muted}>Attendance report coming next.</div>}
          </div></div>
        )}

        <div style={styles.bottomNav}><button onClick={()=>setScreen("lines")} style={{...styles.button,...styles.smallButton,...(screen==="lines"?styles.buttonPrimary:{})}}>Lines</button><button onClick={()=>setScreen("entry")} style={{...styles.button,...styles.smallButton,...(screen==="entry"?styles.buttonPrimary:{})}}>Entry</button><button onClick={()=>setScreen("report")} style={{...styles.button,...styles.smallButton,...(screen==="report"?styles.buttonPrimary:{})}}>Reports</button></div>
      </div>
    </div>
  );
}
