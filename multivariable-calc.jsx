import { useState, useEffect, useRef } from "react";
import * as Plotly from "plotly";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS — "Deep Space Observatory" aesthetic
// ─────────────────────────────────────────────────────────────
const C = {
  bg:      "#060C18",
  surface: "#0C1829",
  surfHov: "#112035",
  border:  "rgba(0,200,255,0.13)",
  cyan:    "#00C8FF",
  gold:    "#F5B942",
  purple:  "#9B8FFF",
  green:   "#00FF99",
  red:     "#FF5566",
  text:    "#C8DCFF",
  muted:   "#4A6080",
  white:   "#EEF5FF",
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Lora:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;700&display=swap');
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0}
input[type=range]{width:100%;accent-color:${C.cyan};cursor:pointer;height:4px}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-track{background:${C.bg}}
::-webkit-scrollbar-thumb{background:rgba(0,200,255,0.2);border-radius:3px}
button:hover{filter:brightness(1.15)}
`;

// ─────────────────────────────────────────────────────────────
// CURRICULUM
// ─────────────────────────────────────────────────────────────
const TOPICS = [
  { id:"vectors",   label:"Vectors & 3D Space",          icon:"⟨⟩",  color:C.cyan,   group:"Vectors" },
  { id:"lines3d",   label:"Lines & Planes in 3D",        icon:"⊥",   color:C.green,  group:"Vectors" },
  { id:"curves",    label:"Vector-Valued Functions",      icon:"r(t)", color:C.gold,  group:"Vectors" },
  { id:"surfaces",  label:"Functions of Two Variables",   icon:"f",   color:C.gold,   group:"Surfaces" },
  { id:"levelcurves", label:"Level Curves & Contours",   icon:"≡",   color:C.green,  group:"Surfaces" },
  { id:"quadrics",  label:"Quadric Surfaces",             icon:"◉",   color:C.purple, group:"Surfaces" },
  { id:"limits2d",  label:"Limits & Continuity in 2D",   icon:"lim", color:C.cyan,   group:"Surfaces" },
  { id:"partial",   label:"Partial Derivatives",          icon:"∂",   color:C.purple, group:"Differentiation" },
  { id:"gradient",  label:"The Gradient",                 icon:"∇",   color:C.cyan,   group:"Differentiation" },
  { id:"optimize",  label:"Optimization",                 icon:"◬",   color:C.gold,   group:"Differentiation" },
  { id:"double",    label:"Double Integrals",             icon:"∬",   color:C.purple, group:"Integration" },
  { id:"triple",    label:"Triple Integrals",             icon:"∭",   color:C.cyan,   group:"Integration" },
  { id:"vecfields", label:"Vector Fields",                icon:"⟳",   color:C.gold,   group:"Integration" },
  { id:"lineint",   label:"Line Integrals",               icon:"∮",   color:C.purple, group:"Integration" },
  { id:"theorems",  label:"The Grand Theorems",           icon:"★",   color:C.cyan,   group:"Integration" },
];

// ─────────────────────────────────────────────────────────────
// SMALL COMPONENTS
// ─────────────────────────────────────────────────────────────
const H1 = ({ children }) => (
  <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:700,
    color:C.white, margin:"0 0 10px", letterSpacing:-0.8, lineHeight:1.2 }}>
    {children}
  </h1>
);
const H2 = ({ children }) => (
  <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:600,
    color:C.white, margin:"32px 0 12px", letterSpacing:-0.3 }}>
    {children}
  </h2>
);
const H3 = ({ children, color=C.cyan }) => (
  <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:600,
    color, margin:"22px 0 8px" }}>
    {children}
  </h3>
);
const P = ({ children }) => (
  <p style={{ fontFamily:"'Lora',serif", fontSize:17, lineHeight:1.85,
    color:C.text, margin:"0 0 14px" }}>
    {children}
  </p>
);
const Em = ({ children, c=C.cyan }) => (
  <span style={{ color:c, fontWeight:600 }}>{children}</span>
);
const Eq = ({ children, block=false }) => {
  if (block) return (
    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:14.5, color:C.gold,
      background:"rgba(245,185,66,0.07)", border:`1px solid rgba(245,185,66,0.2)`,
      borderRadius:8, padding:"14px 20px", margin:"16px 0", lineHeight:2,
      letterSpacing:0.3, overflowX:"auto", whiteSpace:"pre-wrap" }}>
      {children}
    </div>
  );
  return (
    <code style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:14, color:C.gold,
      background:"rgba(245,185,66,0.09)", padding:"2px 7px", borderRadius:4 }}>
      {children}
    </code>
  );
};
const Note = ({ title, children, color=C.purple }) => {
  const rgb = color === C.purple ? "155,143,255"
            : color === C.gold   ? "245,185,66"
            : color === C.green  ? "0,255,153"
            : color === C.red    ? "255,85,102"
            : "0,200,255";
  return (
    <div style={{ borderLeft:`3px solid ${color}`,
      background:`rgba(${rgb},0.06)`, borderRadius:"0 8px 8px 0",
      padding:"14px 18px", margin:"18px 0" }}>
      {title && <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11,
        color, fontWeight:700, marginBottom:6, letterSpacing:1.5, textTransform:"uppercase" }}>
        {title}
      </div>}
      <div style={{ fontFamily:"'Lora',serif", fontSize:15.5, color:C.text,
        lineHeight:1.75, whiteSpace:"pre-wrap" }}>
        {children}
      </div>
    </div>
  );
};
const PlotBox = ({ id, h=430 }) => (
  <div id={id} style={{ height:h, borderRadius:12, overflow:"hidden",
    border:`1px solid ${C.border}`, margin:"18px 0", background:"#080F1C" }} />
);
const Slider = ({ label, value, min, max, step=0.1, onChange }) => (
  <div style={{ margin:"10px 0" }}>
    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12.5,
      color:C.muted, marginBottom:4 }}>
      {label}: <span style={{ color:C.gold }}>{Number(value).toFixed(2)}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(+e.target.value)} />
  </div>
);
const Btn = ({ children, active, onClick, color=C.cyan }) => (
  <button onClick={onClick} style={{
    padding:"7px 14px", cursor:"pointer", borderRadius:6, fontSize:12,
    fontFamily:"'JetBrains Mono',monospace", transition:"all 0.15s",
    background: active ? color : "rgba(255,255,255,0.05)",
    color: active ? C.bg : C.text,
    border:`1px solid ${active ? color : C.border}`,
  }}>{children}</button>
);

// Quiz
const Quiz = ({ q, opts, ans, exp }) => {
  const [sel, setSel] = useState(null);
  const [done, setDone] = useState(false);
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`,
      borderRadius:12, padding:20, margin:"28px 0" }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10.5,
        color:C.cyan, letterSpacing:2, marginBottom:10, textTransform:"uppercase" }}>
        ✦ Check Your Understanding
      </div>
      <div style={{ fontFamily:"'Lora',serif", fontSize:17, color:C.white,
        marginBottom:16, lineHeight:1.65 }}>{q}</div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {opts.map((o,i) => {
          let bg="rgba(255,255,255,0.04)", bc="rgba(255,255,255,0.1)", tc=C.text;
          if (done) {
            if (i===ans)       { bg="rgba(0,255,153,0.1)";  bc=C.green;  tc=C.green; }
            else if (i===sel)  { bg="rgba(255,85,102,0.1)"; bc=C.red;    tc=C.red;   }
          } else if (i===sel)  { bg="rgba(0,200,255,0.1)";  bc=C.cyan;   tc=C.cyan;  }
          return (
            <button key={i} onClick={()=>!done&&setSel(i)} style={{
              background:bg, border:`1px solid ${bc}`, borderRadius:8,
              padding:"10px 15px", color:tc, fontSize:15.5, cursor:done?"default":"pointer",
              textAlign:"left", fontFamily:"'Lora',serif", transition:"all 0.15s",
            }}>{o}</button>
          );
        })}
      </div>
      {sel!==null && !done && (
        <button onClick={()=>setDone(true)} style={{
          marginTop:12, padding:"8px 20px", background:C.cyan, color:C.bg,
          border:"none", borderRadius:6, fontSize:12.5, fontWeight:700,
          cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", letterSpacing:0.5,
        }}>CHECK →</button>
      )}
      {done && (
        <div style={{ marginTop:12, padding:"12px 16px", background:"rgba(0,255,153,0.05)",
          borderRadius:8, fontSize:15, color:C.text, fontFamily:"'Lora',serif", lineHeight:1.75 }}>
          <Em c={C.green}>Explanation: </Em>{exp}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// PLOTLY HELPERS
// ─────────────────────────────────────────────────────────────
const pLayout = (ext={}) => {
  const l = {
    paper_bgcolor:"#080F1C", plot_bgcolor:"#080F1C",
    font:{ family:"JetBrains Mono", color:C.muted, size:11 },
    margin:{ t:24, r:20, b:44, l:44 },
    autosize:true,
  };
  if (ext.scene) {
    l.scene = {
      bgcolor:"#080F1C",
      xaxis:{ gridcolor:"#1A2840", zerolinecolor:"#1A2840", color:C.muted },
      yaxis:{ gridcolor:"#1A2840", zerolinecolor:"#1A2840", color:C.muted },
      zaxis:{ gridcolor:"#1A2840", zerolinecolor:"#1A2840", color:C.muted },
      ...ext.scene,
    };
  }
  if (ext.xaxis) l.xaxis = { gridcolor:"#1A2840", zerolinecolor:"#2A3850", color:C.muted, ...ext.xaxis };
  if (ext.yaxis) l.yaxis = { gridcolor:"#1A2840", zerolinecolor:"#2A3850", color:C.muted, ...ext.yaxis };
  const { scene, xaxis, yaxis, ...rest } = ext;
  return { ...l, ...rest };
};
const pCfg = { responsive:true, displayModeBar:false };

function mkSurface(fn, rng=[-3,3], n=46, cs) {
  const xs = Array.from({length:n},(_,i)=>rng[0]+(rng[1]-rng[0])*i/(n-1));
  return {
    type:"surface", x:xs, y:xs,
    z: xs.map(y=>xs.map(x=>fn(x,y))),
    colorscale: cs||[[0,"#0D2040"],[0.35,"#005599"],[0.6,"#00AACC"],[0.85,"#00DDBB"],[1,"#F5B942"]],
    showscale:false, opacity:0.88,
  };
}

// ─────────────────────────────────────────────────────────────
// PAGE 1 — VECTORS
// ─────────────────────────────────────────────────────────────
function VectorsPage() {
  const pid = "pv";
  const [ax,setAx]=useState(2), [ay,setAy]=useState(1), [az,setAz]=useState(1);
  const [bx,setBx]=useState(1), [by,setBy]=useState(2), [bz,setBz]=useState(-1);

  useEffect(()=>{
    const cx=ay*bz-az*by, cy=az*bx-ax*bz, cz=ax*by-ay*bx;
    const vec=(x,y,z,col,name)=>({
      type:"scatter3d", x:[0,x],y:[0,y],z:[0,z],
      mode:"lines+markers",
      line:{color:col,width:6},
      marker:{color:col,size:[0,7]},
      name,
    });
    Plotly.react(pid,[
      vec(ax,ay,az,C.cyan,"a"),
      vec(bx,by,bz,C.gold,"b"),
      vec(cx,cy,cz,C.purple,"a × b"),
    ],pLayout({ scene:{camera:{eye:{x:1.6,y:1.6,z:1.2}}},
      showlegend:true, legend:{bgcolor:"rgba(0,0,0,0)",font:{color:C.text,size:12}} }),pCfg);
  },[ax,ay,az,bx,by,bz]);

  const dot=ax*bx+ay*by+az*bz;
  const cx=ay*bz-az*by, cy=az*bx-ax*bz, cz=ax*by-ay*bx;
  const mA=Math.sqrt(ax*ax+ay*ay+az*az), mB=Math.sqrt(bx*bx+by*by+bz*bz);
  const theta = mA&&mB ? (Math.acos(Math.max(-1,Math.min(1,dot/(mA*mB))))*180/Math.PI).toFixed(1) : "—";

  return <div>
    <H1>Vectors & 3D Space</H1>
    <P>Multivariable calculus unfolds across multiple dimensions. Our primary tool for navigating this terrain is the <Em>vector</Em> — a mathematical object with both <Em c={C.gold}>magnitude</Em> and <Em>direction</Em>.</P>

    <H2>Vectors in Component Form</H2>
    <P>A vector <Em>v</Em> in 3D space is written in terms of the standard basis vectors <Eq>î</Eq>, <Eq>ĵ</Eq>, <Eq>k̂</Eq>:</P>
    <Eq block>v = ⟨a, b, c⟩ = a·î + b·ĵ + c·k̂

Magnitude:  |v| = √(a² + b² + c²)</Eq>

    <H2>The Dot Product</H2>
    <P>The dot product takes two vectors and returns a <Em c={C.gold}>scalar</Em>. It measures alignment — how much the vectors point in the same direction:</P>
    <Eq block>u · v = u₁v₁ + u₂v₂ + u₃v₃  =  |u||v| cos θ</Eq>
    <P>Key consequences: if <Eq>u · v = 0</Eq> the vectors are <Em>perpendicular</Em>. The dot product also lets us project one vector onto another and find angles instantly.</P>

    <H2>The Cross Product</H2>
    <P>The cross product takes two vectors and returns a <Em>new vector</Em> perpendicular to both. Its magnitude equals the area of the parallelogram the two vectors span:</P>
    <Eq block>a × b =  | î   ĵ   k̂ |
             | a₁  a₂  a₃ |
             | b₁  b₂  b₃ |

        = ⟨a₂b₃ − a₃b₂,  a₃b₁ − a₁b₃,  a₁b₂ − a₂b₁⟩</Eq>
    <Note color={C.purple} title="Right-hand rule">
      Point your right hand's fingers from a toward b, curl them — your thumb points in the direction of a × b. This gives the orientation of the perpendicular vector.
    </Note>

    <H3>Interactive Vector Lab</H3>
    <P>Drag the sliders to change vector components. Watch the cross product (purple) stay perpendicular to both:</P>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
      <div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:C.cyan,marginBottom:8}}>
          a = ⟨{ax},{ay},{az}⟩   |a| = {mA.toFixed(3)}
        </div>
        <Slider label="aₓ" value={ax} min={-3} max={3} onChange={setAx}/>
        <Slider label="a_y" value={ay} min={-3} max={3} onChange={setAy}/>
        <Slider label="a_z" value={az} min={-3} max={3} onChange={setAz}/>
      </div>
      <div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:C.gold,marginBottom:8}}>
          b = ⟨{bx},{by},{bz}⟩   |b| = {mB.toFixed(3)}
        </div>
        <Slider label="bₓ" value={bx} min={-3} max={3} onChange={setBx}/>
        <Slider label="b_y" value={by} min={-3} max={3} onChange={setBy}/>
        <Slider label="b_z" value={bz} min={-3} max={3} onChange={setBz}/>
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginTop:6}}>
      <Note color={C.cyan}>a · b = {dot.toFixed(3)}</Note>
      <Note color={C.gold}>θ = {theta}°</Note>
      <Note color={C.purple}>a × b = ⟨{cx.toFixed(2)},{cy.toFixed(2)},{cz.toFixed(2)}⟩</Note>
    </div>
    <PlotBox id={pid} h={440}/>

    <Quiz q="If u = ⟨1, 0, 0⟩ and v = ⟨0, 1, 0⟩, what is u × v?"
      opts={["⟨1, 1, 0⟩","⟨0, 0, 1⟩","⟨0, 0, −1⟩","0"]} ans={1}
      exp="Using the formula: (0·0−0·1, 0·0−1·0, 1·1−0·0) = ⟨0,0,1⟩ = k̂. The cross product of î and ĵ is k̂, pointing straight up — consistent with the right-hand rule."/>
  </div>;
}

// ─────────────────────────────────────────────────────────────
// PAGE 2 — SURFACES
// ─────────────────────────────────────────────────────────────
function SurfacesPage() {
  const pid="ps";
  const [fn,setFn]=useState("paraboloid");
  const FNS={
    paraboloid:{f:(x,y)=>x*x+y*y,     label:"z = x² + y²"},
    saddle:    {f:(x,y)=>x*x-y*y,     label:"z = x² − y²"},
    ripple:    {f:(x,y)=>Math.sin(Math.sqrt(x*x+y*y)), label:"z = sin(√(x²+y²))"},
    sincos:    {f:(x,y)=>Math.sin(x)*Math.cos(y),      label:"z = sin(x)cos(y)"},
    cone:      {f:(x,y)=>Math.sqrt(x*x+y*y),           label:"z = √(x²+y²)"},
  };
  useEffect(()=>{
    const surf=mkSurface(FNS[fn].f,[-3,3],52);
    surf.contours={z:{show:true,usecolormap:true,highlightcolor:C.gold,project:{z:true}}};
    Plotly.react(pid,[surf],pLayout({scene:{aspectmode:"cube",camera:{eye:{x:1.8,y:1.8,z:1.3}}}}),pCfg);
  },[fn]);

  return <div>
    <H1>Functions of Two Variables</H1>
    <P>A function <Em>f : ℝ² → ℝ</Em> takes a 2D input point (x,y) and returns one number. We visualize it as a <Em c={C.gold}>surface</Em> in 3D — a landscape rising above the xy-plane.</P>

    <H2>Surfaces and Level Curves</H2>
    <P>For any constant <Em>c</Em>, the set {"{(x,y) | f(x,y) = c}"} is a <Em>level curve</Em>. Stack all level curves together: you get the <Em>contour map</Em> — like topographic elevation lines. Closely packed contours = steep terrain. Sparse contours = gentle slope.</P>
    <Eq block>Level curve at height c:  f(x,y) = c   (a curve in the xy-plane)</Eq>

    <H2>Key Surfaces to Know</H2>
    <Note color={C.cyan} title="Paraboloid — z = x² + y²">
      Bowl shape opening upward. Minimum at the origin. Level curves are circles. The fundamental shape in optimization (local minima look like paraboloids).
    </Note>
    <Note color={C.gold} title="Saddle — z = x² − y²">
      Curves up in the x-direction, down in the y-direction. Looks like a horse saddle. Level curves are hyperbolas. Critical point at origin is neither max nor min.
    </Note>
    <Note color={C.purple} title="Ellipsoid — x²/a² + y²/b² + z²/c² = 1">
      A stretched sphere. All level curves are ellipses. Models many physical shapes (atomic electron clouds, gravitational potentials).
    </Note>

    <H2>Limits and Continuity</H2>
    <P>The limit <Em>lim₍ₓ,ᵧ₎→₍ₐ,ᵦ₎ f(x,y) = L</Em> means f approaches L as (x,y) approaches (a,b) from <Em>any direction</Em>. This is much stricter than 1D — you must check all possible approach paths. A common exam trick: approach along y=x and y=x² and show different limits (no limit exists).</P>
    <Eq block>A function is continuous at (a,b) if:
  lim₍ₓ,ᵧ₎→₍ₐ,ᵦ₎ f(x,y) = f(a,b)</Eq>

    <H3>Interactive Surface Explorer</H3>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
      {Object.entries(FNS).map(([k,v])=>(
        <Btn key={k} active={fn===k} onClick={()=>setFn(k)}>{k}</Btn>
      ))}
    </div>
    <Note color={C.gold}>{FNS[fn].label} — level curves projected below</Note>
    <PlotBox id={pid} h={490}/>
    <P>The contour lines at the bottom are level curves. Notice how the saddle's contours look like hyperbolas, while the paraboloid's are perfect circles.</P>

    <Quiz q="What is the domain of f(x,y) = ln(x² + y² − 1)?"
      opts={["All of ℝ²","The unit disk x²+y² ≤ 1","Outside the unit circle: x²+y² > 1","Only where x > 0"]} ans={2}
      exp="ln(t) requires t > 0. We need x²+y²−1 > 0, i.e. x²+y² > 1. This is the exterior of the unit circle — all points more than distance 1 from the origin."/>
  </div>;
}

// ─────────────────────────────────────────────────────────────
// PAGE — LEVEL CURVES & CONTOURS
// ─────────────────────────────────────────────────────────────
function LevelCurvesPage() {

  // ── Viz A: Surface + projected contours ──────────────────────
  const pidA = "plcA";
  const [fnKey, setFnKey] = useState("volcano");
  const [cHeight, setCHeight] = useState(0.5);

  // ── Viz B: Pure 2D contour map with custom level picker ───────
  const pidB = "plcB";
  const [numLevels, setNumLevels] = useState(10);
  const [fn2Key, setFn2Key] = useState("himmelblau");

  // ── Viz C: Gradient ⊥ level curves ───────────────────────────
  const pidC = "plcC";
  const [gcx, setGcx] = useState(1.0);
  const [gcy, setGcy] = useState(1.0);

  // ── Viz D: Cross-section slicer ───────────────────────────────
  const pidD = "plcD";
  const [sliceX, setSliceX] = useState(0.5);
  const [sliceMode, setSliceMode] = useState("x");

  const FNS = {
    volcano:    { f:(x,y) => 2*Math.exp(-(x*x+y*y)*0.5)*(1-(x*x+y*y)*0.18), label:"Volcano: z=2e^{-r²/2}(1−0.18r²)", zRange:[-0.4,2.1] },
    saddle:     { f:(x,y) => x*x - y*y,                                       label:"Saddle: z=x²−y²",                 zRange:[-4,4] },
    rosenbrock: { f:(x,y) => { const v=(1-x)**2+100*(y-x*x)**2; return Math.min(v,15); }, label:"Rosenbrock banana: z=(1−x)²+100(y−x²)²", zRange:[0,15] },
    ripple:     { f:(x,y) => Math.sin(Math.sqrt(x*x+y*y+0.01)*2.5),           label:"Ripple: z=sin(2.5r)",             zRange:[-1,1] },
    ellipse:    { f:(x,y) => x*x*0.5 + y*y*2,                                 label:"Elliptic paraboloid: z=x²/2+2y²", zRange:[0,8] },
  };

  const FNS2 = {
    himmelblau: { f:(x,y)=>{ const v=(x*x+y-11)**2+(x+y*y-7)**2; return Math.min(v,120);}, label:"Himmelblau: (x²+y−11)²+(x+y²−7)²", range:[-4,4] },
    six_hump:   { f:(x,y)=>{ const v=(4-2.1*x*x+x**4/3)*x*x+x*y+(-4+4*y*y)*y*y; return Math.min(Math.max(v,-1.5),3);}, label:"Six-hump camel", range:[-2.5,2.5] },
    peaks:      { f:(x,y)=>3*(1-x)**2*Math.exp(-x*x-((y+1)**2))-10*(x/5-x**3-y**5)*Math.exp(-x*x-y*y)-Math.exp(-((x+1)**2)-y*y)/3, label:"Peaks function", range:[-3,3] },
    trig:       { f:(x,y)=>Math.sin(x)*Math.cos(y), label:"sin(x)cos(y)", range:[-Math.PI,Math.PI] },
  };

  // ── Effect A: surface + contour projection ────────────────────
  useEffect(() => {
    const fn = FNS[fnKey].f;
    const surf = mkSurface(fn, [-3,3], 52);
    surf.contours = { z:{ show:true, usecolormap:true, highlightcolor:C.gold, project:{z:true} } };
    surf.opacity = 0.78;

    // Single highlighted level
    const xs = Array.from({length:60},(_,i)=>-3+6*i/59);
    const cz = cHeight;
    // Compute marching squares (simple threshold scan) for the level curve
    const segments = [];
    const grid = xs.map(y => xs.map(x => fn(x,y)));
    for (let i=0; i<xs.length-1; i++) {
      for (let j=0; j<xs.length-1; j++) {
        const z00=grid[j][i], z10=grid[j][i+1], z01=grid[j+1][i], z11=grid[j+1][i+1];
        const interp=(za,zb,xa,xb)=>{ const t=(cz-za)/(zb-za+1e-12); return xa+t*(xb-xa); };
        const corners=[z00,z10,z11,z01].map(z=>z>=cz?1:0);
        const code=corners[0]*8+corners[1]*4+corners[2]*2+corners[3];
        const x0=xs[i],x1=xs[i+1],y0=xs[j],y1=xs[j+1];
        const edges=[
          [interp(z00,z10,x0,x1),y0],[x1,interp(z10,z11,y0,y1)],
          [interp(z01,z11,x0,x1),y1],[x0,interp(z00,z01,y0,y1)],
        ];
        const lookup={1:[[3,2]],2:[[2,1]],3:[[3,1]],4:[[1,2]],5:[[0,3],[1,2]],
          6:[[0,1]],7:[[3,0]],8:[[0,3]],9:[[0,2]],10:[[0,1],[2,3]],
          11:[[0,1]],12:[[1,3]],13:[[1,2]],14:[[2,3]],15:[]};
        for (const [a,b] of (lookup[code]||[])) {
          segments.push([edges[a][0],edges[b][0],null]);
          segments.push([edges[a][1],edges[b][1],null]);
        }
      }
    }
    const lcX=segments.filter((_,i)=>i%3!==2).flat();
    const lcY=segments.filter((_,i)=>i%3===1||i%3===0).map((v,i)=>i%2===0?null:v).filter(v=>v!==null);
    // Simpler: just use Plotly surface contour at exact level z=cHeight
    const levelPlane = {
      type:"surface",
      x:[-3,3], y:[-3,3],
      z:[[cz,cz],[cz,cz]],
      colorscale:[[0,"rgba(255,85,102,0.25)"],[1,"rgba(255,85,102,0.25)"]],
      showscale:false, opacity:0.35, name:`z = ${cz.toFixed(2)}`, hoverinfo:"skip",
    };
    Plotly.react(pidA, [surf, levelPlane], pLayout({
      scene:{camera:{eye:{x:1.7,y:1.7,z:1.35}}, aspectmode:"cube"},
      showlegend:false,
    }), pCfg);
  }, [fnKey, cHeight]);

  // ── Effect B: 2D contour map ───────────────────────────────────
  useEffect(() => {
    const { f, range } = FNS2[fn2Key];
    const N = 80;
    const xs = Array.from({length:N},(_,i)=>range[0]+(range[1]-range[0])*i/(N-1));
    const z = xs.map(y=>xs.map(x=>f(x,y)));
    const contour = {
      type:"contour", x:xs, y:xs, z,
      colorscale:[[0,"#060C28"],[0.15,"#0A2060"],[0.3,"#0060AA"],[0.5,"#00AACC"],[0.7,"#00DDBB"],[0.85,"#A0E070"],[1,"#F5E060"]],
      contours:{ coloring:"heatmap", showlabels:true,
        labelfont:{size:10,color:"white",family:"JetBrains Mono"},
        ncontours: numLevels,
      },
      showscale:true,
      colorbar:{ tickfont:{color:C.muted,size:10}, bgcolor:"rgba(0,0,0,0)", outlinecolor:"rgba(255,255,255,0.1)" },
    };
    Plotly.react(pidB, [contour], pLayout({
      xaxis:{range}, yaxis:{range, scaleanchor:"x"}, margin:{t:24,r:20,b:44,l:44},
    }), pCfg);
  }, [fn2Key, numLevels]);

  // ── Effect C: gradient ⊥ level curves ─────────────────────────
  useEffect(() => {
    const fn = FNS["ellipse"].f;
    const dfx = (x,y)=>(fn(x+0.001,y)-fn(x-0.001,y))/0.002;
    const dfy = (x,y)=>(fn(x,y+0.001)-fn(x,y-0.001))/0.002;
    const N=70;
    const xs=Array.from({length:N},(_,i)=>-3+6*i/(N-1));
    const z=xs.map(y=>xs.map(x=>fn(x,y)));

    const contour = {
      type:"contour", x:xs, y:xs, z,
      colorscale:[[0,"#060C28"],[0.4,"#003388"],[0.7,"#0088BB"],[1,"#00CCDD"]],
      contours:{coloring:"lines", showlabels:true, ncontours:9,
        labelfont:{size:10,color:C.gold,family:"JetBrains Mono"}},
      showscale:false, line:{width:1.5},
    };

    // Gradient arrows (field)
    const arX=[],arY=[];
    for(let x=-2.8;x<=2.8;x+=0.7)for(let y=-2.8;y<=2.8;y+=0.7){
      const gx=dfx(x,y),gy=dfy(x,y),l=Math.sqrt(gx*gx+gy*gy)||1,s=0.25/l;
      arX.push(x,x+gx*s,null); arY.push(y,y+gy*s,null);
    }
    const arrows={type:"scatter",x:arX,y:arY,mode:"lines",
      line:{color:"rgba(0,200,255,0.45)",width:1.2},hoverinfo:"skip",name:"∇f field"};

    // Highlighted gradient at chosen point
    const fv=fn(gcx,gcy), gx2=dfx(gcx,gcy), gy2=dfy(gcx,gcy);
    const l2=Math.sqrt(gx2*gx2+gy2*gy2)||1, sc=0.5/l2;
    const selGrad={type:"scatter",x:[gcx,gcx+gx2*sc],y:[gcy,gcy+gy2*sc],
      mode:"lines+markers",line:{color:C.red,width:4},
      marker:{color:C.red,size:[0,11]},name:"∇f at P"};
    const pt={type:"scatter",x:[gcx],y:[gcy],mode:"markers",
      marker:{color:C.red,size:11},name:"P"};

    // Tangent to level curve (perpendicular to gradient)
    const tScale=0.45, tx=-gy2/l2, ty=gx2/l2;
    const tangent={type:"scatter",
      x:[gcx-tx*tScale,gcx+tx*tScale],y:[gcy-ty*tScale,gcy+ty*tScale],
      mode:"lines",line:{color:C.green,width:3,dash:"dash"},name:"Level curve tangent"};

    Plotly.react(pidC,[contour,arrows,selGrad,tangent,pt],pLayout({
      xaxis:{range:[-3,3]},yaxis:{range:[-3,3],scaleanchor:"x"},
      showlegend:true,legend:{bgcolor:"rgba(0,0,0,0)",font:{color:C.text,size:11}},
    }),pCfg);
  },[gcx,gcy]);

  // ── Effect D: cross-section slicer ────────────────────────────
  useEffect(() => {
    const fn = FNS[fnKey].f;
    const N=120;
    const ts=Array.from({length:N},(_,i)=>-3+6*i/(N-1));

    // 3D surface (small, wireframe style)
    const xs3=Array.from({length:30},(_,i)=>-3+6*i/29);
    const surf={type:"surface",x:xs3,y:xs3,
      z:xs3.map(y=>xs3.map(x=>fn(x,y))),
      colorscale:[[0,"#0D1E3A"],[0.5,"#005588"],[1,"#00AACC"]],
      showscale:false,opacity:0.35};

    // Slice plane
    let slicePlane, sliceCurve;
    if (sliceMode==="x") {
      const sx=sliceX;
      const ys=ts;
      const zs=ys.map(y=>fn(sx,y));
      const planeY=[-3,3],planeZ=FNS[fnKey].zRange;
      slicePlane={type:"surface",
        x:[[sx,sx],[sx,sx]],
        y:[[-3,3],[-3,3]],
        z:[[planeZ[0],planeZ[0]],[planeZ[1],planeZ[1]]],
        colorscale:[[0,"rgba(245,185,66,0.12)"],[1,"rgba(245,185,66,0.12)"]],
        showscale:false,opacity:0.3};
      sliceCurve={type:"scatter3d",
        x:ys.map(()=>sx),y:ys,z:zs,
        mode:"lines",line:{color:C.gold,width:5},name:`f(${sx.toFixed(2)}, y)`};
    } else {
      const sy=sliceX;
      const xs2=ts;
      const zs=xs2.map(x=>fn(x,sy));
      slicePlane={type:"surface",
        x:[[-3,3],[-3,3]],
        y:[[sy,sy],[sy,sy]],
        z:[[FNS[fnKey].zRange[0],FNS[fnKey].zRange[0]],[FNS[fnKey].zRange[1],FNS[fnKey].zRange[1]]],
        colorscale:[[0,"rgba(155,143,255,0.12)"],[1,"rgba(155,143,255,0.12)"]],
        showscale:false,opacity:0.3};
      sliceCurve={type:"scatter3d",
        x:xs2,y:xs2.map(()=>sy),z:zs,
        mode:"lines",line:{color:C.purple,width:5},name:`f(x, ${sy.toFixed(2)})`};
    }

    Plotly.react(pidD,[surf,slicePlane,sliceCurve],pLayout({
      scene:{camera:{eye:{x:1.8,y:1.8,z:1.3}}},
      showlegend:true,legend:{bgcolor:"rgba(0,0,0,0)",font:{color:C.text,size:11}},
    }),pCfg);
  },[fnKey,sliceX,sliceMode]);

  return <div>
    <H1>Level Curves & Contour Maps</H1>
    <P>
      A <Em>level curve</Em> of f(x,y) at height c is the set of all input points where the function equals c exactly. Stacking these curves for many values of c produces a <Em c={C.gold}>contour map</Em> — the 2D fingerprint of a surface. Topographic maps, weather pressure charts, and temperature isotherms are all contour maps in disguise.
    </P>
    <Eq block>{`Level curve at height c:   L_c = { (x,y) ∈ ℝ² | f(x,y) = c }

This is a curve in the domain (xy-plane), NOT on the surface itself.`}</Eq>

    {/* ═══════ A: SURFACE + LEVEL PLANE ════════════════════════ */}
    <div style={{borderTop:`2px solid ${C.cyan}`,marginTop:32,paddingTop:18}}>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10.5,color:C.cyan,
        letterSpacing:2.5,textTransform:"uppercase",marginBottom:10}}>Part I — Surface & its Slicing Plane</div>
    </div>

    <H2>Geometry: Slicing the Surface Horizontally</H2>
    <P>Imagine the surface as a mountain range. Slicing it with a horizontal plane <Eq>z = c</Eq> gives a cross-section. The <Em>shadow</Em> of that cross-section on the xy-plane is the level curve. Moving the plane up and down traces out the entire family of level curves.</P>
    <Note color={C.gold} title="Key Geometric Fact">
      {`The spacing between level curves encodes the steepness:
  • Closely packed contours  → steep terrain (|∇f| is large)
  • Widely spaced contours   → gentle slope (|∇f| is small)
  • No contours at all       → flat region (f ≈ constant)

This is why topographic maps look densely striped on cliffs and bare on plateaus.`}
    </Note>
    <Note color={C.purple} title="Level curves never cross">
      {`If two distinct level curves L_a and L_b crossed at point P, then f(P)=a AND f(P)=b, forcing a=b — contradiction. So level curves for different values are always disjoint.
(Exception: where ∇f = 0, they can touch or merge — these are critical points.)`}
    </Note>

    <H3 color={C.cyan}>Interactive: Surface + Horizontal Slice</H3>
    <P>The semi-transparent red plane slices the surface at height c. The intersection of that plane with the surface is the level curve at that height.</P>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
      {Object.entries(FNS).map(([k,v])=>(
        <Btn key={k} active={fnKey===k} onClick={()=>setFnKey(k)} color={C.cyan}>{k}</Btn>
      ))}
    </div>
    <Note color={C.cyan}>{FNS[fnKey].label}</Note>
    <Slider label="Slice height c" value={cHeight}
      min={FNS[fnKey].zRange[0]*0.9} max={FNS[fnKey].zRange[1]*0.9} step={0.02} onChange={setCHeight}/>
    <Note color={C.red}>Current level: z = {cHeight.toFixed(3)}</Note>
    <PlotBox id={pidA} h={470}/>

    {/* ═══════ B: 2D CONTOUR MAP ════════════════════════════════ */}
    <div style={{borderTop:`2px solid ${C.gold}`,marginTop:40,paddingTop:18}}>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10.5,color:C.gold,
        letterSpacing:2.5,textTransform:"uppercase",marginBottom:10}}>Part II — Reading Contour Maps</div>
    </div>

    <H2>The Contour Map as a 2D Object</H2>
    <P>Rather than viewing the surface, we project everything onto the xy-plane. Each curve is labelled with its z-value (if legible). The full collection is the <Em>contour map</Em> — it encodes everything about the function's topology.</P>
    <Note color={C.cyan} title="What to look for on a contour map">
      {`• Closed oval loops    → local max or min inside (like a hilltop or basin)
• Figure-eight (∞ shape) → saddle point at the crossing
• Parallel straight lines → f is approximately linear in that region
• Concentric circles      → radially symmetric function (like r² or e^{-r²})
• Hyperbola-shaped curves → saddle surface (x²−y²) or near a saddle point`}
    </Note>

    <H2>Classic Contour Signatures</H2>
    <Note color={C.gold} title="Paraboloid z=x²+y² → circular level curves">
      {`x²+y²=c  →  circle of radius √c
Curves are evenly spaced in z but the circles grow as √c — they get
closer together in radius, showing the bowl steepens near the rim.`}
    </Note>
    <Note color={C.purple} title="Saddle z=x²−y² → hyperbolic level curves">
      {`x²−y²=c:
  c > 0  →  hyperbolas opening left/right  (surface is higher)
  c = 0  →  the two diagonals y=±x          (the saddle "ridge lines")
  c < 0  →  hyperbolas opening up/down

The c=0 contour through the saddle point splits into two crossing lines.
This crossing is the hallmark signature of a saddle on a contour map.`}
    </Note>
    <Note color={C.green} title="Rosenbrock's banana — famous in optimization">
      {`f(x,y) = (1−x)² + 100(y−x²)²
Global min at (1,1) where f=0, but the valley is a long curved banana.
Level curves are elongated nested ovals along the parabola y=x².
Gradient descent struggles here because the long narrow valley means
small steps toward the minimum but large oscillations across the valley.`}
    </Note>

    <H3 color={C.gold}>Interactive: 2D Contour Map Explorer</H3>
    <P>Adjust the number of level curves and swap between functions. Notice how the Himmelblau function has <Em>four</Em> global minima (the dark blue pockets), visible as four separate isolated loops.</P>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
      {Object.entries(FNS2).map(([k,v])=>(
        <Btn key={k} active={fn2Key===k} onClick={()=>setFn2Key(k)} color={C.gold}>{k}</Btn>
      ))}
    </div>
    <Note color={C.gold}>{FNS2[fn2Key].label}</Note>
    <Slider label="Number of level curves" value={numLevels} min={3} max={30} step={1} onChange={setNumLevels}/>
    <PlotBox id={pidB} h={460}/>

    <Quiz q="On a contour map, what does a saddle point look like?"
      opts={[
        "A single isolated closed loop",
        "Two families of level curves crossing — a figure-eight or ×-shape at one point",
        "A region with no contour lines",
        "Parallel equally-spaced lines"
      ]} ans={1}
      exp="At a saddle point, the level curve through that point splits into two crossing branches (like an × or ∞ shape). For z=x²−y², the level z=0 gives x²=y², i.e. the lines y=±x, which cross at the origin — the saddle. The level curves change topology (from two separate loops to one figure-eight) as c passes through 0."/>

    {/* ═══════ C: GRADIENT ⊥ LEVEL CURVES ═════════════════════ */}
    <div style={{borderTop:`2px solid ${C.purple}`,marginTop:40,paddingTop:18}}>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10.5,color:C.purple,
        letterSpacing:2.5,textTransform:"uppercase",marginBottom:10}}>Part III — The Gradient & Level Curves</div>
    </div>

    <H2>The Fundamental Theorem of Level Curves</H2>
    <P>The gradient <Em>∇f</Em> is always <Em c={C.red}>perpendicular</Em> to the level curves of f. This single fact connects differential calculus to geometry and powers almost every application of multivariable calculus.</P>
    <Eq block>{`Proof: Let r(t) be any curve lying on the level set f(r(t)) = c.
Differentiate: d/dt[f(r(t))] = ∇f · r′(t) = 0
∴ ∇f ⊥ r′(t) for EVERY tangent direction of the level curve.
∴ ∇f is normal to the level curve.`}</Eq>
    <Note color={C.cyan} title="Consequences">
      {`• ∇f points toward higher values, cutting across level curves perpendicularly
• The directional derivative in any tangent direction = 0 (no change along level curve)
• The directional derivative is maximized along ∇f (steepest ascent)
• ∇f = 0 at critical points — the gradient field vanishes where the surface is flat
• Equipotential lines in E&M are level curves of V; electric field E=−∇V ⊥ them`}
    </Note>

    <H2>Using Level Curves to Sketch Gradients</H2>
    <P>Without computing any derivatives, you can sketch the gradient field from a contour map alone:</P>
    <Note color={C.gold} title="Recipe">
      {`1. Draw short arrows perpendicular to each contour line
2. Point them toward higher values (larger c labels)
3. Make arrows longer where contours are closely packed (steep = large |∇f|)
4. Mark ∇f = 0 at local extrema (centers of closed loops) and saddles (figure-eights)

This is how oceanographers read current direction from pressure maps, and
how engineers design heat fins to maximize temperature gradient.`}
    </Note>

    <H3 color={C.purple}>Interactive: Gradient ⊥ Level Curves</H3>
    <P>
      Cyan arrows: the gradient field ∇f. <Em c={C.red}>Red arrow</Em>: ∇f at your chosen point P.
      <Em c={C.green}> Green dashed line</Em>: tangent to the level curve through P.
      Notice: the red arrow is always exactly 90° from the green line!
    </P>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Slider label="x" value={gcx} min={-2.5} max={2.5} step={0.05} onChange={setGcx}/>
      <Slider label="y" value={gcy} min={-2.5} max={2.5} step={0.05} onChange={setGcy}/>
    </div>
    <Note color={C.red}>
      ∇f = ⟨{(gcx).toFixed(3)}, {(4*gcy).toFixed(3)}⟩ {"  "}
      Level value: f(P) = {(gcx*gcx*0.5+gcy*gcy*2).toFixed(3)}
    </Note>
    <PlotBox id={pidC} h={440}/>

    <Quiz q="For f(x,y) = x² + y², which direction is ∇f at the point (1, 1)?"
      opts={[
        "⟨1, 1⟩ — along the level curve",
        "⟨2, 2⟩ — pointing away from origin, perpendicular to the circle x²+y²=2",
        "⟨−2,−2⟩ — pointing toward origin",
        "⟨2, −2⟩ — along the level curve tangent"
      ]} ans={1}
      exp="∇f = ⟨2x, 2y⟩ = ⟨2,2⟩ at (1,1). The level curve through (1,1) is the circle x²+y²=2. Its tangent at (1,1) is in direction ⟨−1,1⟩ (perpendicular to the radius). Indeed ⟨2,2⟩·⟨−1,1⟩ = 0 ✓ — the gradient points radially outward, perpendicular to the circular level curve."/>

    {/* ═══════ D: CROSS-SECTION SLICER ═════════════════════════ */}
    <div style={{borderTop:`2px solid ${C.green}`,marginTop:40,paddingTop:18}}>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10.5,color:C.green,
        letterSpacing:2.5,textTransform:"uppercase",marginBottom:10}}>Part IV — Cross-Sections & Traces</div>
    </div>

    <H2>Traces: Vertical Slices</H2>
    <P>A <Em>trace</Em> is the curve you get by fixing one variable and letting the other vary — a vertical slice through the surface. This is closely related to partial derivatives: the slope of a trace at any point is exactly the partial derivative in that direction.</P>
    <Eq block>{`x-trace (fix x=a):  z = f(a, y)  — a single-variable function of y
y-trace (fix y=b):  z = f(x, b)  — a single-variable function of x

The partial derivative ∂f/∂x at (a,b) = slope of the y=b trace at x=a.`}</Eq>

    <Note color={C.gold} title="Traces vs Level Curves — the key distinction">
      {`Level curve at z=c:  f(x,y) = c   →  a curve in the xy-PLANE (domain)
Trace at x=a:        z = f(a, y)   →  a curve in the xz-PLANE (surface)

Level curves are HORIZONTAL slices (constant z).
Traces are VERTICAL slices (constant x or y).

Together they give a complete picture of the surface's geometry.`}
    </Note>

    <H2>Identifying Surfaces from Traces</H2>
    <P>The trace method is the standard technique for sketching quadric surfaces and identifying unknowns. For each coordinate plane, set the other variable to zero and identify what curve you get:</P>
    <Note color={C.purple} title="Example: Identify z = 4 − x² − y²">
      {`Level curves (z=c): x²+y²=4−c  →  circles for c<4, nothing for c>4, point at c=4
x-trace (y=0):      z = 4−x²          →  downward parabola
y-trace (x=0):      z = 4−y²          →  downward parabola
→ An elliptic paraboloid opening downward, vertex at (0,0,4)`}
    </Note>

    <H3 color={C.green}>Interactive: Vertical Slice Visualizer</H3>
    <P>The translucent slab is the slicing plane; the colored curve is the trace — what you'd see if you cut through the surface. Use the mode toggle to slice in the x or y direction.</P>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
      {Object.entries(FNS).map(([k])=>(
        <Btn key={k} active={fnKey===k} onClick={()=>setFnKey(k)} color={C.green}>{k}</Btn>
      ))}
    </div>
    <div style={{display:"flex",gap:8,marginBottom:10}}>
      <Btn active={sliceMode==="x"} onClick={()=>setSliceMode("x")} color={C.gold}>Fix x (y-trace)</Btn>
      <Btn active={sliceMode==="y"} onClick={()=>setSliceMode("y")} color={C.purple}>Fix y (x-trace)</Btn>
    </div>
    <Slider label={sliceMode==="x"?"x = a (fixed)":"y = b (fixed)"} value={sliceX} min={-2.8} max={2.8} step={0.05} onChange={setSliceX}/>
    <Note color={sliceMode==="x"?C.gold:C.purple}>
      {sliceMode==="x"
        ? `Trace: z = f(${sliceX.toFixed(2)}, y)  →  a curve in the plane x=${sliceX.toFixed(2)}`
        : `Trace: z = f(x, ${sliceX.toFixed(2)})  →  a curve in the plane y=${sliceX.toFixed(2)}`}
    </Note>
    <PlotBox id={pidD} h={460}/>

    <Quiz q="The level curves of f(x,y) = e^{-(x²+y²)} are..."
      opts={[
        "Parabolas opening upward",
        "Hyperbolas with asymptotes along the axes",
        "Circles centered at the origin",
        "Straight lines with slope −1"
      ]} ans={2}
      exp="Setting e^{-(x²+y²)} = c gives −(x²+y²) = ln c, so x²+y² = −ln c = ln(1/c). For 0 < c < 1, this is a circle of radius √(ln(1/c)). As c→0⁺, the radius grows → ∞. As c→1, radius→0 (the maximum at origin). All level curves are concentric circles."/>

    <Quiz q="You're hiking on terrain described by z=f(x,y). You want to walk without gaining altitude. Which direction should you head?"
      opts={[
        "Along ∇f",
        "Opposite to ∇f",
        "Perpendicular to ∇f (along the level curve)",
        "At 45° to ∇f"
      ]} ans={2}
      exp="Walking without gaining altitude means staying on the same level curve f(x,y)=c. The tangent direction to the level curve is exactly perpendicular to ∇f (proven above). So head perpendicular to the gradient — in the direction where the directional derivative D_û f = ∇f·û = |∇f|cos(90°) = 0."/>
  </div>;
}

// ─────────────────────────────────────────────────────────────
// PAGE 3 — PARTIAL DERIVATIVES
// ─────────────────────────────────────────────────────────────
function PartialPage() {
  const pid="pp";
  const [px,setPx]=useState(1.0), [py,setPy]=useState(1.0);
  const fn=(x,y)=>Math.sin(x)*Math.exp(-0.3*(x*x+y*y));
  const dfx=(x,y)=>(fn(x+0.001,y)-fn(x-0.001,y))/0.002;
  const dfy=(x,y)=>(fn(x,y+0.001)-fn(x,y-0.001))/0.002;

  useEffect(()=>{
    const surf=mkSurface(fn,[-3,3],50,[[0,"#0D2040"],[0.4,"#004488"],[0.7,"#0088BB"],[1,"#00C8FF"]]);
    surf.opacity=0.72;
    const fv=fn(px,py), gx=dfx(px,py), gy=dfy(px,py);
    const txLine={type:"scatter3d",x:[-3,3],y:[py,py],z:[-3,3].map(x=>fv+gx*(x-px)),
      mode:"lines",line:{color:C.gold,width:5},name:"∂f/∂x tangent"};
    const tyLine={type:"scatter3d",x:[px,px],y:[-3,3],z:[-3,3].map(y=>fv+gy*(y-py)),
      mode:"lines",line:{color:C.green,width:5},name:"∂f/∂y tangent"};
    const pt={type:"scatter3d",x:[px],y:[py],z:[fv],mode:"markers",
      marker:{color:C.red,size:8},name:"Point (a,b)"};
    Plotly.react(pid,[surf,txLine,tyLine,pt],pLayout({
      scene:{camera:{eye:{x:1.9,y:1.9,z:1.4}}},
      showlegend:true,legend:{bgcolor:"rgba(0,0,0,0)",font:{color:C.text,size:11}},
    }),pCfg);
  },[px,py]);

  const gx=dfx(px,py), gy=dfy(px,py);

  return <div>
    <H1>Partial Derivatives</H1>
    <P>When a function depends on multiple variables, we can ask: <Em>"how does it change if we nudge only one variable, holding all others fixed?"</Em> — That's exactly what a partial derivative measures.</P>

    <H2>Definition</H2>
    <P>Treat all other variables as constants and differentiate normally:</P>
    <Eq block>∂f/∂x = fₓ = lim[h→0] (f(x+h, y) − f(x, y)) / h

∂f/∂y = f_y = lim[h→0] (f(x, y+h) − f(x, y)) / h</Eq>
    <P><Em c={C.gold}>Geometric meaning:</Em> <Eq>∂f/∂x</Eq> is the slope of the surface in the x-direction. <Eq>∂f/∂y</Eq> is the slope in the y-direction. Each is the slope of a curve you'd trace by slicing the surface with an axis-aligned vertical plane.</P>

    <H2>Computing Partial Derivatives</H2>
    <P>Apply all single-variable rules (product, chain, etc.), treating other variables as constants:</P>
    <Note color={C.gold} title="Example">
      {`f(x,y) = x³y² + sin(xy)

∂f/∂x = 3x²y² + y·cos(xy)   ← y treated as constant
∂f/∂y = 2x³y + x·cos(xy)   ← x treated as constant`}
    </Note>

    <H2>Higher-Order Partials & Clairaut's Theorem</H2>
    <P>We can differentiate multiple times. The <Em>mixed partials</Em> satisfy a beautiful symmetry:</P>
    <Eq block>∂²f/∂x∂y  =  ∂²f/∂y∂x         (Clairaut's Theorem)</Eq>
    <P>As long as the second partial derivatives are continuous, the order of differentiation doesn't matter. You can verify this easily: try <Eq>f = x²y³</Eq> and differentiate both ways.</P>

    <H2>The Tangent Plane</H2>
    <P>The two partial derivatives together define the <Em>tangent plane</Em> to the surface at (a, b, f(a,b)) — the best flat approximation near that point:</P>
    <Eq block>z  =  f(a,b) + fₓ(a,b)·(x − a) + f_y(a,b)·(y − b)</Eq>
    <P>This is the multivariable analogue of the tangent line. We use it for <Em>linear approximation</Em>: <Eq>Δf ≈ fₓΔx + f_yΔy</Eq>.</P>

    <H3>Interactive: Tangent Lines at Any Point</H3>
    <P>Move (a,b) to see the tangent lines (slices of the tangent plane) in the x and y directions:</P>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
      <Slider label="a (x)" value={px} min={-2.5} max={2.5} step={0.05} onChange={setPx}/>
      <Slider label="b (y)" value={py} min={-2.5} max={2.5} step={0.05} onChange={setPy}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:4}}>
      <Note color={C.gold}>∂f/∂x({px.toFixed(2)},{py.toFixed(2)}) = {gx.toFixed(4)}</Note>
      <Note color={C.green}>∂f/∂y({px.toFixed(2)},{py.toFixed(2)}) = {gy.toFixed(4)}</Note>
    </div>
    <PlotBox id={pid} h={460}/>

    <Quiz q="For f(x,y) = x²y + eʸ, what is ∂²f / ∂y∂x?"
      opts={["2x + eʸ","2xy + eʸ","2x","2xy"]} ans={2}
      exp="First ∂f/∂x = 2xy (eʸ vanishes since ∂(eʸ)/∂x = 0). Then ∂(2xy)/∂y = 2x. So the mixed partial is 2x."/>
  </div>;
}

// ─────────────────────────────────────────────────────────────
// PAGE 4 — GRADIENT
// ─────────────────────────────────────────────────────────────
function GradientPage() {
  const pid="pgr";
  const [gx,setGx]=useState(1.2), [gy,setGy]=useState(0.8);
  const fn=(x,y)=>Math.exp(-(x*x+y*y)/3)*Math.cos(x+y);
  const dfx=(x,y)=>(fn(x+0.001,y)-fn(x-0.001,y))/0.002;
  const dfy=(x,y)=>(fn(x,y+0.001)-fn(x,y-0.001))/0.002;

  useEffect(()=>{
    const xs=Array.from({length:60},(_,i)=>-3+6*i/59);
    const contour={type:"contour",x:xs,y:xs,z:xs.map(y=>xs.map(x=>fn(x,y))),
      colorscale:[[0,"#0D1E3A"],[0.3,"#0060AA"],[0.55,"#00AACC"],[0.8,"#00DDCC"],[1,"#F5E060"]],
      contours:{coloring:"heatmap",showlabels:true,labelfont:{size:10,color:"white",family:"JetBrains Mono"}},
      showscale:false};
    const arX=[],arY=[];
    for(let x=-2.5;x<=2.5;x+=0.65)for(let y=-2.5;y<=2.5;y+=0.65){
      const fx=dfx(x,y),fy=dfy(x,y),l=Math.sqrt(fx*fx+fy*fy)||1,s=0.22/l;
      arX.push(x,x+fx*s,null); arY.push(y,y+fy*s,null);
    }
    const field={type:"scatter",x:arX,y:arY,mode:"lines",
      line:{color:"rgba(255,255,255,0.35)",width:1.2},hoverinfo:"skip"};
    const fx=dfx(gx,gy),fy=dfy(gx,gy),l=Math.sqrt(fx*fx+fy*fy)||1,s=0.55/l;
    const selArrow={type:"scatter",x:[gx,gx+fx*s],y:[gy,gy+fy*s],mode:"lines+markers",
      line:{color:C.red,width:4},marker:{color:C.red,size:[0,10]},name:"∇f at point"};
    const pt={type:"scatter",x:[gx],y:[gy],mode:"markers",
      marker:{color:C.red,size:11,symbol:"circle"},name:"Point"};
    Plotly.react(pid,[contour,field,selArrow,pt],pLayout({
      xaxis:{range:[-3,3],showgrid:false},yaxis:{range:[-3,3],showgrid:false},
      showlegend:false,
    }),pCfg);
  },[gx,gy]);

  const fx=dfx(gx,gy),fy=dfy(gx,gy),mag=Math.sqrt(fx*fx+fy*fy);

  return <div>
    <H1>The Gradient</H1>
    <P>The <Em>gradient</Em> ∇f bundles all partial derivatives into one vector, pointing in the direction of <Em c={C.gold}>steepest ascent</Em>. It is arguably the most important object in all of multivariable calculus.</P>
    <Eq block>∇f  =  ⟨∂f/∂x, ∂f/∂y⟩   (2D)
∇f  =  ⟨∂f/∂x, ∂f/∂y, ∂f/∂z⟩   (3D)</Eq>

    <H2>Three Key Properties</H2>
    <Note color={C.cyan} title="Direction of steepest ascent">∇f points in the direction that increases f the fastest. If you're hiking, ∇f points straight uphill.</Note>
    <Note color={C.gold} title="Magnitude = rate of steepest increase">|∇f| is how quickly f increases per unit distance in that optimal direction.</Note>
    <Note color={C.purple} title="Perpendicular to level curves">∇f is always perpendicular (normal) to the level curve f(x,y) = c through that point. This is why heat flows perpendicular to isotherms, and water flows perpendicular to contour lines.</Note>

    <H2>Directional Derivatives</H2>
    <P>The <Em>directional derivative</Em> D_û f gives the rate of change in any direction û (a unit vector):</P>
    <Eq block>D_û f = ∇f · û  =  |∇f| cos θ</Eq>
    <P>This is maximized (= |∇f|) when û aligns with ∇f. It's zero when û is tangent to a level curve. It's most negative (= −|∇f|) when û points opposite to ∇f.</P>
    <Note color={C.gold} title="Example">
      {`f(x,y) = x² + y²,   û = ⟨1/√2, 1/√2⟩
∇f = ⟨2x, 2y⟩
At (1,1): ∇f = ⟨2, 2⟩
D_û f = ⟨2,2⟩ · ⟨1/√2, 1/√2⟩ = 2√2`}
    </Note>

    <H2>The Gradient in Higher Dimensions</H2>
    <P>The gradient generalizes completely to any number of dimensions. In machine learning, <Em>gradient descent</Em> minimizes a loss function L(θ) by iteratively moving opposite to the gradient: <Eq>θ ← θ − α·∇L(θ)</Eq>. The gradient tells the algorithm which direction to update millions of parameters simultaneously.</P>

    <H3>Interactive Gradient Explorer</H3>
    <P>White arrows: gradient field ∇f. Red arrow: ∇f at your chosen point — always perpendicular to the level curve (contour) through it!</P>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
      <Slider label="x" value={gx} min={-2.5} max={2.5} step={0.05} onChange={setGx}/>
      <Slider label="y" value={gy} min={-2.5} max={2.5} step={0.05} onChange={setGy}/>
    </div>
    <Note color={C.red}>∇f({gx.toFixed(2)},{gy.toFixed(2)}) = ⟨{fx.toFixed(4)}, {fy.toFixed(4)}⟩,   |∇f| = {mag.toFixed(4)}</Note>
    <PlotBox id={pid} h={460}/>

    <Quiz q="You want to move from a point with zero rate of change in f. In which direction should you move?"
      opts={["Along ∇f","Opposite to ∇f","Perpendicular to ∇f (tangent to level curve)","In direction ∇f/|∇f|²"]} ans={2}
      exp="Zero rate of change means staying on the same level curve. Since ∇f is always perpendicular to level curves, moving perpendicular to ∇f (along the level curve) gives D_û f = ∇f · û = |∇f|cos(90°) = 0."/>
  </div>;
}

// ─────────────────────────────────────────────────────────────
// PAGE 5 — OPTIMIZATION
// ─────────────────────────────────────────────────────────────
function OptimizePage() {
  const pid="po";
  const [ft,setFt]=useState("saddle");
  const FNS={
    saddle:  {f:(x,y)=>x*x-y*y,          label:"z = x² − y²",      desc:"Saddle point at (0,0): D = fxx·fyy−fxy² = (2)(−2)−0 = −4 < 0"},
    min:     {f:(x,y)=>x*x+2*y*y-2*x+1,  label:"z = x²+2y²−2x+1", desc:"Local min at (1,0): ∇f=0 → fₓ=2x−2=0, f_y=4y=0 → (1,0). D=8>0, fxx=2>0 ✓"},
    monkey:  {f:(x,y)=>3*x*x*y-y*y*y,    label:"z = 3x²y − y³",    desc:"Monkey saddle at origin — three valleys (for two legs and a tail!)"},
  };
  useEffect(()=>{
    const surf=mkSurface(FNS[ft].f,[-2.5,2.5],46,
      [[0,"#1A0A3A"],[0.35,"#4A1A88"],[0.6,"#8060FF"],[0.85,"#C0B0FF"],[1,"#E8E0FF"]]);
    surf.opacity=0.88;
    Plotly.react(pid,[surf],pLayout({scene:{camera:{eye:{x:1.9,y:1.9,z:1.5}}}}),pCfg);
  },[ft]);

  return <div>
    <H1>Optimization in Multiple Variables</H1>
    <P>Finding maxima and minima of multivariable functions is one of the most practically important topics — it powers machine learning, economics, engineering design, and physics.</P>

    <H2>Critical Points</H2>
    <P>Critical points occur where all partial derivatives are zero simultaneously:</P>
    <Eq block>∇f = 0   ⟺   ∂f/∂x = 0  AND  ∂f/∂y = 0</Eq>
    <P>Unlike single-variable calculus, we now have a third possibility beyond max and min: the <Em c={C.gold}>saddle point</Em>, where the surface curves up in one direction and down in another.</P>

    <H2>The Second Derivative Test</H2>
    <P>At a critical point (a,b), define the <Em>discriminant</Em> D (determinant of the Hessian matrix):</P>
    <Eq block>{`D  =  fₓₓ · f_yy  −  (f_xy)²

D > 0 and fₓₓ > 0  →  Local MINIMUM
D > 0 and fₓₓ < 0  →  Local MAXIMUM
D < 0               →  SADDLE POINT
D = 0               →  Test inconclusive (need higher-order analysis)`}</Eq>
    <Note color={C.purple} title="The Hessian Matrix">
      {`The discriminant is the determinant of the Hessian matrix:

H = | fxx  fxy |    det(H) = fxx·fyy − fxy²
    | fxy  fyy |

det(H) > 0 means H is definite — same curvature sign in all directions (bowl or dome). det(H) < 0 means indefinite — curves up one way, down another (saddle).`}
    </Note>

    <H2>Lagrange Multipliers</H2>
    <P>When we must optimize subject to a <Em>constraint</Em> g(x,y) = 0, Lagrange multipliers are the elegant solution:</P>
    <Eq block>Maximize/minimize f(x,y) subject to g(x,y) = 0

Condition:  ∇f = λ ∇g   AND   g(x,y) = 0</Eq>
    <P>The geometric insight: at a constrained extremum, ∇f must be parallel to ∇g. If they weren't parallel, you could move along the constraint curve and improve f — contradicting the extremum.</P>
    <Note color={C.gold} title="Classic Example">
      {`Maximize f(x,y) = xy subject to g(x,y) = x+y−10 = 0.

∇f = ⟨y, x⟩ = λ⟨1,1⟩ = λ∇g
So y = λ and x = λ → x = y
x + y = 10  →  x = y = 5

Maximum: f(5,5) = 25. (This proves AM-GM: xy ≤ ((x+y)/2)²)`}
    </Note>

    <H3>Surface Types at Critical Points</H3>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
      {Object.entries(FNS).map(([k])=><Btn key={k} active={ft===k} onClick={()=>setFt(k)} color={C.purple}>{k}</Btn>)}
    </div>
    <Note color={C.gold}>{FNS[ft].desc}</Note>
    <PlotBox id={pid} h={450}/>

    <Quiz q="For f(x,y) = x² + 4y², find and classify the critical point."
      opts={["Local max at (0,0)","Local min at (0,0)","Saddle point at (0,0)","No critical points"]} ans={1}
      exp="∇f = ⟨2x, 8y⟩ = 0 → (0,0) is the only critical point. D = fxx·fyy − fxy² = 2·8 − 0 = 16 > 0. Since fxx = 2 > 0, it's a local (and global) minimum."/>
  </div>;
}

// ─────────────────────────────────────────────────────────────
// PAGE 6 — DOUBLE INTEGRALS
// ─────────────────────────────────────────────────────────────
function DoubleIntPage() {
  const pid="pdi";
  const [a,setA]=useState(2.5);
  useEffect(()=>{
    const fn=(x,y)=>Math.max(0, a-0.4*x*x-0.6*y*y);
    const surf=mkSurface(fn,[-3,3],46,[[0,"#0A1F3A"],[0.4,"#0080BB"],[0.7,"#00BBDD"],[1,"#00E8FF"]]);
    const xs2=Array.from({length:20},(_,i)=>-3+6*i/19);
    const base={type:"surface",x:xs2,y:xs2,z:xs2.map(()=>xs2.map(()=>0)),
      colorscale:[[0,"rgba(0,200,100,0.15)"],[1,"rgba(0,200,100,0.15)"]],
      showscale:false,opacity:0.35};
    Plotly.react(pid,[surf,base],pLayout({scene:{camera:{eye:{x:1.8,y:1.8,z:1.2}}}}),pCfg);
  },[a]);

  return <div>
    <H1>Double Integrals</H1>
    <P>A double integral <Em>∬_R f(x,y) dA</Em> sums f over a 2D region R. Geometrically, when f ≥ 0, this equals the <Em c={C.gold}>volume under the surface</Em> z = f(x,y) above R.</P>

    <H2>Fubini's Theorem: Iterated Integrals</H2>
    <P>Rather than summing over infinitesimal patches simultaneously, Fubini's theorem lets us do two consecutive single-variable integrals:</P>
    <Eq block>∬_R f(x,y) dA = ∫_a^b [∫_c^d f(x,y) dy] dx = ∫_c^d [∫_a^b f(x,y) dx] dy</Eq>
    <P>The inner integral fixes one variable and integrates the other. The outer integral finishes the calculation. For continuous f on a rectangle, the order never matters.</P>
    <Note color={C.gold} title="Worked Example">
      {`Compute ∬_R xy dA  where R = [0,2] × [0,3].

∫₀² [∫₀³ xy dy] dx
= ∫₀² x·[y²/2]₀³ dx
= ∫₀² x·(9/2) dx
= (9/2)·[x²/2]₀²
= (9/2)·2 = 9`}
    </Note>

    <H2>Non-Rectangular Regions</H2>
    <P>For general regions, the limits of integration become functions of each other:</P>
    <Eq block>{`Type I  (x fixed, y varies): ∫_a^b ∫_{g₁(x)}^{g₂(x)} f(x,y) dy dx

Type II (y fixed, x varies): ∫_c^d ∫_{h₁(y)}^{h₂(y)} f(x,y) dx dy`}</Eq>
    <P>Choosing the right type can dramatically simplify an integral. When the region is bounded by functions of x, use Type I. When bounded by functions of y, Type II is cleaner.</P>

    <H2>Polar Coordinates for Double Integrals</H2>
    <P>When the region is a disk, ring, or wedge, polar coordinates simplify massively. The crucial detail: the area element <Em c={C.red}>must include r</Em>:</P>
    <Eq block>x = r cosθ,   y = r sinθ

dA = r dr dθ   ← the extra r is the Jacobian!</Eq>
    <Note color={C.purple} title="Why r dr dθ?">
      A tiny polar patch at (r,θ) has radial width dr and arc length r dθ (arc length increases with r). Area = r dr dθ. Forgetting the extra r is the single most common polar coordinates error.
    </Note>
    <Note color={C.cyan} title="Classic: Area of a disk">
      {`∬_{disk of radius R} dA = ∫₀²π ∫₀ᴿ r dr dθ
  = 2π · [r²/2]₀ᴿ = πR²   ✓`}
    </Note>

    <H3>Interactive: Volume Under Surface</H3>
    <Slider label="Height parameter a" value={a} min={0.5} max={4} step={0.1} onChange={setA}/>
    <P>Visualizing z = max(0, a − 0.4x² − 0.6y²). The double integral ∬ f dA gives the volume of this solid above the xy-plane.</P>
    <PlotBox id={pid} h={440}/>

    <Quiz q="Evaluate ∫₀¹ ∫₀¹ (x + y) dy dx"
      opts={["1/4","1/2","1","3/2"]} ans={2}
      exp="Inner: ∫₀¹(x+y)dy = [xy+y²/2]₀¹ = x+1/2. Outer: ∫₀¹(x+1/2)dx = [x²/2+x/2]₀¹ = 1/2+1/2 = 1."/>
  </div>;
}

// ─────────────────────────────────────────────────────────────
// PAGE 7 — TRIPLE INTEGRALS
// ─────────────────────────────────────────────────────────────
function TripleIntPage() {
  const pid="pti";
  const [coord,setCoord]=useState("rect");
  useEffect(()=>{
    if(coord==="sphere"){
      const u=Array.from({length:35},(_,i)=>i*Math.PI/34);
      const v=Array.from({length:35},(_,i)=>i*2*Math.PI/34);
      const sphere={type:"surface",
        x:u.map(p=>v.map(t=>Math.sin(p)*Math.cos(t))),
        y:u.map(p=>v.map(t=>Math.sin(p)*Math.sin(t))),
        z:u.map(p=>v.map(()=>Math.cos(p))),
        colorscale:[[0,"#0D2040"],[0.5,"#0080CC"],[1,"#00C8FF"]],
        showscale:false,opacity:0.65};
      const axes=["x","y","z"].map((lbl,i)=>{
        const d=[0,0,0]; d[i]=1.6;
        return {type:"scatter3d",x:[0,d[0]],y:[0,d[1]],z:[0,d[2]],
          mode:"lines+text",text:["",lbl],
          textfont:{color:[C.red,C.green,C.cyan][i],size:14,family:"JetBrains Mono"},
          line:{color:[C.red,C.green,C.cyan][i],width:3},hoverinfo:"skip"};
      });
      Plotly.react(pid,[sphere,...axes],pLayout({
        scene:{camera:{eye:{x:1.8,y:1.8,z:1.2}},aspectmode:"cube"},showlegend:false}),pCfg);
    } else if(coord==="cylinder"){
      const ts=Array.from({length:50},(_,i)=>i*2*Math.PI/49);
      const zs=[0,1];
      const cyl={type:"surface",
        x:zs.map(()=>ts.map(t=>Math.cos(t))),
        y:zs.map(()=>ts.map(t=>Math.sin(t))),
        z:zs.map(z=>ts.map(()=>z)),
        colorscale:[[0,"#0A1F3A"],[1,"#00AAFF"]],showscale:false,opacity:0.6};
      const top={type:"surface",
        x:[Array.from({length:10},(_,i)=>i/9)].map(r=>ts.map(t=>r[0]*Math.cos(t))),
        y:[Array.from({length:10},(_,i)=>i/9)].map(r=>ts.map(t=>r[0]*Math.sin(t))),
        z:[[...ts.map(()=>1)]],
        colorscale:[[0,"#004488"],[1,"#0088CC"]],showscale:false,opacity:0.5};
      Plotly.react(pid,[cyl,top],pLayout({scene:{camera:{eye:{x:1.8,y:1.8,z:1.3}}}}),pCfg);
    } else {
      // Rectangular box
      const b=[0,1];
      const faces=[];
      [[0,1],[0,1]].forEach((_,i)=>{
        const xs=b.flatMap(x=>[x,x,null]);
        faces.push({type:"scatter3d",x:[0,1,1,0,0,null,0,1,1,0,0],y:[0,0,1,1,0,null,0,0,1,1,0],z:[0,0,0,0,0,null,1,1,1,1,1],
          mode:"lines",line:{color:C.gold,width:3},name:"Unit box"});
      });
      const verticals=[
        {x:[0,0],y:[0,0],z:[0,1]},{x:[1,1],y:[0,0],z:[0,1]},
        {x:[0,0],y:[1,1],z:[0,1]},{x:[1,1],y:[1,1],z:[0,1]},
      ].map(d=>({type:"scatter3d",x:d.x,y:d.y,z:d.z,mode:"lines",line:{color:C.gold,width:3},hoverinfo:"skip"}));
      Plotly.react(pid,[faces[0],...verticals],pLayout({
        scene:{camera:{eye:{x:1.8,y:1.8,z:1.4}}},showlegend:false}),pCfg);
    }
  },[coord]);

  return <div>
    <H1>Triple Integrals</H1>
    <P>Moving into 3D, we integrate a function f(x,y,z) over a solid region E. The result can represent total mass (with density ρ), charge, probability, moment of inertia, or simply volume (set f=1).</P>
    <Eq block>∭_E f(x,y,z) dV  =  ∫∫∫ f dz dy dx</Eq>

    <H2>Iterated Triple Integrals</H2>
    <P>Fubini extends naturally to three dimensions. For a box [a,b]×[c,d]×[e,g]:</P>
    <Eq block>∫_a^b ∫_c^d ∫_e^g f(x,y,z) dz dy dx</Eq>
    <P>For non-box regions, the innermost limits can depend on the outer variables, and the middle limits can depend on the outermost variable.</P>

    <H2>Cylindrical Coordinates</H2>
    <P>Replace (x,y) with polar, keep z. Perfect for cylinders, cones, and paraboloids:</P>
    <Eq block>x = r cosθ,   y = r sinθ,   z = z

dV = r dr dθ dz   ← same extra r as polar!</Eq>
    <Note color={C.cyan} title="When to use cylindrical">
      Any region with circular symmetry in x and y: full cylinders, cones, paraboloids, or any solid bounded by r = g(z) surfaces. The integration order is typically: z first (innermost), then r, then θ.
    </Note>

    <H2>Spherical Coordinates</H2>
    <P>Use ρ (distance from origin), φ (polar angle from +z axis, 0 to π), and θ (azimuthal in xy-plane, 0 to 2π):</P>
    <Eq block>x = ρ sinφ cosθ
y = ρ sinφ sinθ
z = ρ cosφ

dV = ρ² sinφ  dρ dφ dθ</Eq>
    <Note color={C.gold} title="Deriving the Jacobian ρ² sinφ">
      {`The ρ² comes from the expanding spherical shell area.
The sinφ comes from the "latitude compression" — patches near the poles (φ≈0 or φ≈π) are smaller. Forgetting this factor is the classic spherical coordinates mistake.`}
    </Note>
    <Note color={C.purple} title="Classic: Volume of a sphere of radius R">
      {`∭_E dV = ∫₀²π ∫₀π ∫₀ᴿ ρ² sinφ dρ dφ dθ
= 2π · 2 · R³/3 = 4πR³/3   ✓`}
    </Note>

    <H3>Visualize Coordinate Systems</H3>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
      {[["rect","Rectangular"],["cylinder","Cylindrical"],["sphere","Spherical"]].map(([k,l])=>(
        <Btn key={k} active={coord===k} onClick={()=>setCoord(k)} color={C.cyan}>{l}</Btn>
      ))}
    </div>
    <PlotBox id={pid} h={440}/>

    <Quiz q="The volume element in spherical coordinates dV equals..."
      opts={["dρ dφ dθ","ρ² dρ dφ dθ","ρ² sinφ dρ dφ dθ","ρ sinφ dρ dφ dθ"]} ans={2}
      exp="The Jacobian of the spherical coordinate transformation is ρ² sinφ. This accounts for the varying size of volume elements as ρ and φ change. Without this factor, your integrals will give the wrong answer."/>
  </div>;
}

// ─────────────────────────────────────────────────────────────
// PAGE 8 — VECTOR FIELDS
// ─────────────────────────────────────────────────────────────
function VecFieldsPage() {
  const pid="pvf";
  const [ft,setFt]=useState("rotation");
  const FIELDS={
    rotation:  {P:(x,y)=>-y,    Q:(x,y)=>x,    label:"F = ⟨−y, x⟩", divStr:"div F = 0 (incompressible)", curlStr:"curl F = 2 (rotational)"},
    source:    {P:(x,y)=>x,     Q:(x,y)=>y,    label:"F = ⟨x, y⟩",  divStr:"div F = 2 (source field)", curlStr:"curl F = 0 (irrotational)"},
    conservative:{P:(x,y)=>2*x, Q:(x,y)=>2*y,  label:"F = ∇(x²+y²)", divStr:"div F = 4",           curlStr:"curl F = 0 (conservative!)"},
    saddle:    {P:(x,y)=>x,     Q:(x,y)=>-y,   label:"F = ⟨x, −y⟩", divStr:"div F = 0",           curlStr:"curl F = 0"},
  };
  useEffect(()=>{
    const {P,Q}=FIELDS[ft];
    const arX=[],arY=[];
    for(let x=-2.5;x<=2.5;x+=0.6)for(let y=-2.5;y<=2.5;y+=0.6){
      const fx=P(x,y),fy=Q(x,y),l=Math.sqrt(fx*fx+fy*fy)||1,s=0.22/l;
      arX.push(x,x+fx*s,null); arY.push(y,y+fy*s,null);
    }
    Plotly.react(pid,[{type:"scatter",x:arX,y:arY,mode:"lines",
      line:{color:C.cyan,width:1.5},hoverinfo:"skip"}],
      pLayout({xaxis:{range:[-3,3]},yaxis:{range:[-3,3],scaleanchor:"x"},showlegend:false}),pCfg);
  },[ft]);

  return <div>
    <H1>Vector Fields</H1>
    <P>A <Em>vector field</Em> assigns a vector to every point in space. Think wind velocity across a weather map, electric field lines, fluid flow, or magnetic force — at each location, there's an arrow showing direction and strength.</P>
    <Eq block>F(x,y) = ⟨P(x,y), Q(x,y)⟩   (2D)
F(x,y,z) = ⟨P, Q, R⟩             (3D)</Eq>

    <H2>Divergence: Sources and Sinks</H2>
    <P>The <Em>divergence</Em> of F measures how much the field "spreads out" or "converges" at a point — the net outward flux per unit volume:</P>
    <Eq block>div F = ∇ · F = ∂P/∂x + ∂Q/∂y   (+ ∂R/∂z in 3D)</Eq>
    <P>div F {">"} 0 → <Em c={C.green}>source</Em> (fluid being created). div F {"<"} 0 → <Em c={C.red}>sink</Em> (fluid being absorbed). div F = 0 → <Em>incompressible</Em>. Incompressible fluid mechanics and magnetism (∇·B = 0) live here.</P>

    <H2>Curl: Rotation and Circulation</H2>
    <P>The <Em>curl</Em> measures the rotational tendency — how much the field would spin a tiny paddle wheel placed at that point:</P>
    <Eq block>In 2D: curl F = ∂Q/∂x − ∂P/∂y   (scalar, the z-component)

In 3D: curl F = ∇ × F = ⟨∂R/∂y−∂Q/∂z, ∂P/∂z−∂R/∂x, ∂Q/∂x−∂P/∂y⟩</Eq>

    <H2>Conservative Vector Fields</H2>
    <P>A field F is <Em>conservative</Em> if F = ∇f for some scalar <Em c={C.gold}>potential function</Em> f. This is the most important class of vector fields in physics.</P>
    <Note color={C.gold} title="Conservative Field Criterion">
      {`F = ⟨P,Q⟩ is conservative on a simply-connected domain
  ⟺  ∂P/∂y = ∂Q/∂x   (equivalently, curl F = 0)

If conservative, find f by integrating: f = ∫P dx + C(y), then determine C(y) using f_y = Q.`}
    </Note>
    <P>Conservative fields have an <Em>enormous practical payoff</Em>: the line integral ∫_C F·dr depends only on endpoints, not the path. Gravity and electrostatics are conservative — that's why potential energy is a useful concept.</P>

    <H3>Interactive Vector Field Gallery</H3>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
      {Object.entries(FIELDS).map(([k,v])=><Btn key={k} active={ft===k} onClick={()=>setFt(k)} color={C.gold}>{k}</Btn>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <Note color={C.cyan}>{FIELDS[ft].divStr}</Note>
      <Note color={C.purple}>{FIELDS[ft].curlStr}</Note>
    </div>
    <PlotBox id={pid} h={420}/>

    <Quiz q="For F = ⟨x², 2xy⟩, is F conservative? Check ∂P/∂y = ∂Q/∂x."
      opts={["Yes: ∂(x²)/∂y = 0 = ∂(2xy)/∂x","No: ∂(x²)/∂y = 0 ≠ ∂(2xy)/∂x = 2y","Yes: div F = 0","Cannot determine without integrating"]} ans={1}
      exp="∂P/∂y = ∂(x²)/∂y = 0. ∂Q/∂x = ∂(2xy)/∂x = 2y. Since 0 ≠ 2y for y≠0, the field is NOT conservative. Its curl (2y) is nonzero."/>
  </div>;
}

// ─────────────────────────────────────────────────────────────
// PAGE 9 — LINE INTEGRALS
// ─────────────────────────────────────────────────────────────
function LineIntPage() {
  const pid="pli";
  const [pathType,setPathType]=useState("circle");
  useEffect(()=>{
    const P=(x,y)=>-y*0.5, Q=(x,y)=>x*0.5;
    const arX=[],arY=[];
    for(let x=-2.5;x<=2.5;x+=0.7)for(let y=-2.5;y<=2.5;y+=0.7){
      const fx=P(x,y),fy=Q(x,y),l=Math.sqrt(fx*fx+fy*fy)||1,s=0.3/l;
      arX.push(x,x+fx*s,null); arY.push(y,y+fy*s,null);
    }
    const field={type:"scatter",x:arX,y:arY,mode:"lines",
      line:{color:"rgba(0,180,230,0.4)",width:1.2},hoverinfo:"skip",name:"F"};
    let pathTrace;
    if(pathType==="circle"){
      const ts=Array.from({length:100},(_,i)=>i*2*Math.PI/99);
      pathTrace={type:"scatter",x:ts.map(t=>Math.cos(t)),y:ts.map(t=>Math.sin(t)),
        mode:"lines",line:{color:C.gold,width:3.5},name:"Circle: ∮F·dr = π"};
    } else if(pathType==="line"){
      pathTrace={type:"scatter",x:[-1.5,1.5],y:[0,0],mode:"lines",
        line:{color:C.green,width:3.5,dash:"dash"},name:"Straight: ∫F·dr = 0"};
    } else {
      const ts=Array.from({length:80},(_,i)=>-1.5+3*i/79);
      pathTrace={type:"scatter",x:ts,y:ts.map(t=>0.5*Math.sin(Math.PI*t/1.5)),
        mode:"lines",line:{color:C.purple,width:3.5},name:"Sine curve"};
    }
    Plotly.react(pid,[field,pathTrace],pLayout({
      xaxis:{range:[-3,3]},yaxis:{range:[-3,3],scaleanchor:"x"},
      showlegend:true,legend:{bgcolor:"rgba(0,0,0,0)",font:{color:C.text,size:12}},
    }),pCfg);
  },[pathType]);

  return <div>
    <H1>Line Integrals</H1>
    <P>A <Em>line integral</Em> integrates a function along a curve C in space — think of summing up values as you travel a path, rather than across a flat region.</P>

    <H2>Scalar Line Integrals: ∫_C f ds</H2>
    <P>Integrate a scalar function f along the arc length ds of curve C. Parameterize C as r(t) for t ∈ [a,b]:</P>
    <Eq block>∫_C f ds = ∫_a^b f(r(t)) · |r'(t)| dt

where |r'(t)| = √(x'(t)² + y'(t)² + z'(t)²)  is the speed</Eq>
    <P>Applications: total mass of a wire with density f(x,y), arc length (set f=1), charge on a wire.</P>

    <H2>Vector Line Integrals: ∫_C F · dr</H2>
    <P>Integrate the component of F along the curve — this measures <Em c={C.gold}>work done</Em> by force F along path C:</P>
    <Eq block>W = ∫_C F · dr = ∫_a^b F(r(t)) · r'(t) dt
           = ∫_C P dx + Q dy + R dz</Eq>
    <P>The dot product extracts how much of the force pushes along the direction of travel. Moving with the field: positive work. Against it: negative work.</P>

    <H2>Fundamental Theorem for Line Integrals</H2>
    <P>For conservative fields F = ∇f, there's a breathtaking shortcut — the path doesn't matter, only the endpoints:</P>
    <Eq block>∫_C ∇f · dr  =  f(r(b)) − f(r(a))   ← FTC for line integrals</Eq>
    <Note color={C.cyan} title="Path Independence">
      {`Conservative field → path independent.
Path independent → ∮_C F·dr = 0 for any closed loop.
Zero closed loop integral → curl F = 0.
curl F = 0 → conservative (on simply connected domain).

These four conditions are all equivalent! They form a closed logical circle.`}
    </Note>
    <Note color={C.gold} title="Worked Example: Work around a circle">
      {`F = ⟨−y, x⟩,  C: r(t) = ⟨cos t, sin t⟩, t ∈ [0, 2π]
r'(t) = ⟨−sin t, cos t⟩
F(r(t)) = ⟨−sin t, cos t⟩
F · r' = sin²t + cos²t = 1
∫_C F·dr = ∫₀²π 1 dt = 2π  ✓`}
    </Note>

    <H3>Interactive: Field + Paths</H3>
    <P>Rotational field F = ⟨−y/2, x/2⟩. The circular path aligns with the field (positive work!). The straight line crosses field lines perpendicularly (zero work).</P>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
      {[["circle","Circle"],["line","Straight"],["sine","Sine curve"]].map(([k,l])=>(
        <Btn key={k} active={pathType===k} onClick={()=>setPathType(k)} color={C.purple}>{l}</Btn>
      ))}
    </div>
    <PlotBox id={pid} h={420}/>

    <Quiz q="For conservative F = ∇f where f(x,y) = x²y, what is ∫_C F·dr from (0,0) to (2,3)?"
      opts={["12","6","18","Depends on the path"]} ans={0}
      exp="FTC for line integrals: ∫_C ∇f · dr = f(2,3) − f(0,0) = (4)(3) − 0 = 12. No integration needed! Just evaluate the potential function at the endpoints. This is the power of conservative fields."/>
  </div>;
}

// ─────────────────────────────────────────────────────────────
// PAGE 10 — THEOREMS
// ─────────────────────────────────────────────────────────────
function TheoremsPage() {
  const pid1="pt1", pid2="pt2", pid3="pt3";
  useEffect(()=>{
    // Green's theorem: region + boundary
    const ts=Array.from({length:100},(_,i)=>i*2*Math.PI/99);
    const bX=ts.map(t=>2*Math.cos(t)+0.4*Math.cos(3*t));
    const bY=ts.map(t=>1.5*Math.sin(t));
    const region={type:"scatter",x:[...bX,bX[0]],y:[...bY,bY[0]],mode:"lines",
      line:{color:C.gold,width:3},fill:"toself",fillcolor:"rgba(245,185,66,0.1)",name:"Region D"};
    const nX=[],nY=[];
    for(let i=0;i<bX.length-1;i+=6){
      const dx=bX[(i+1)%bX.length]-bX[i],dy=bY[(i+1)%bY.length]-bY[i];
      const l=Math.sqrt(dx*dx+dy*dy);
      nX.push(bX[i],bX[i]+dy/l*0.28,null); nY.push(bY[i],bY[i]-dx/l*0.28,null);
    }
    Plotly.react(pid1,[region,{type:"scatter",x:nX,y:nY,mode:"lines",
      line:{color:C.cyan,width:1.5},hoverinfo:"skip",name:"Outward normals"}],
      pLayout({xaxis:{range:[-3.5,3.5]},yaxis:{range:[-2.5,2.5],scaleanchor:"x"},
        showlegend:true,legend:{bgcolor:"rgba(0,0,0,0)",font:{color:C.text,size:11}}}),pCfg);
  },[]);

  useEffect(()=>{
    // Stokes: surface + boundary curve
    const ts=Array.from({length:80},(_,i)=>i*2*Math.PI/79);
    const curve={type:"scatter3d",x:ts.map(t=>Math.cos(t)),y:ts.map(t=>Math.sin(t)),z:ts.map(()=>0),
      mode:"lines",line:{color:C.gold,width:4},name:"Boundary C"};
    const us=Array.from({length:20},(_,i)=>i/19);
    const surf2={type:"surface",
      x:us.map(r=>ts.slice(0,40).map(t=>r*Math.cos(t))),
      y:us.map(r=>ts.slice(0,40).map(t=>r*Math.sin(t))),
      z:us.map(r=>ts.slice(0,40).map(t=>r*0.5*Math.sin(2*t))),
      colorscale:[[0,"#0D2040"],[0.5,"#5040AA"],[1,"#9B8FFF"]],
      showscale:false,opacity:0.65,name:"Surface S"};
    Plotly.react(pid2,[surf2,curve],pLayout({
      scene:{camera:{eye:{x:1.8,y:1.8,z:1.6}}},
      showlegend:true,legend:{bgcolor:"rgba(0,0,0,0)",font:{color:C.text,size:11}}}),pCfg);
  },[]);

  useEffect(()=>{
    // Divergence: box + outward arrows
    const edges={type:"scatter3d",
      x:[0,1,1,0,0,null,0,1,1,0,0,null,0,0,null,1,1,null,0,0,null,1,1],
      y:[0,0,1,1,0,null,0,0,1,1,0,null,0,0,null,0,0,null,1,1,null,1,1],
      z:[0,0,0,0,0,null,1,1,1,1,1,null,0,1,null,0,1,null,0,1,null,0,1],
      mode:"lines",line:{color:C.gold,width:3},name:"Surface ∂E"};
    const faces=[
      {p:[0.5,0.5,0],d:[0,0,-0.4]},{p:[0.5,0.5,1],d:[0,0,0.4]},
      {p:[0.5,0,0.5],d:[0,-0.4,0]},{p:[0.5,1,0.5],d:[0,0.4,0]},
      {p:[0,0.5,0.5],d:[-0.4,0,0]},{p:[1,0.5,0.5],d:[0.4,0,0]},
    ];
    const arrs=faces.map(({p,d})=>({type:"scatter3d",
      x:[p[0],p[0]+d[0]],y:[p[1],p[1]+d[1]],z:[p[2],p[2]+d[2]],
      mode:"lines+markers",line:{color:C.cyan,width:4},
      marker:{color:C.cyan,size:[0,7]},showlegend:false,hoverinfo:"skip"}));
    Plotly.react(pid3,[edges,...arrs],pLayout({
      scene:{camera:{eye:{x:1.8,y:1.8,z:1.3}}},showlegend:false}),pCfg);
  },[]);

  return <div>
    <H1>The Grand Theorems</H1>
    <P>Multivariable calculus culminates in three extraordinary theorems. Each generalizes the single-variable Fundamental Theorem of Calculus to higher dimensions. They share one profound idea: <Em c={C.gold}>the integral over a region equals an integral over its boundary.</Em></P>

    <H2>Green's Theorem</H2>
    <P>Relates a <Em>line integral</Em> around a closed curve C (boundary of region D) to a <Em>double integral</Em> over D:</P>
    <Eq block>∮_C P dx + Q dy  =  ∬_D (∂Q/∂x − ∂P/∂y) dA</Eq>
    <P>Left: circulation around the boundary. Right: total rotation (curl) inside the region. The boundary "accumulates" all the local rotations in the interior.</P>
    <Note color={C.gold} title="Remarkable corollary: computing areas">
      {`Area(D) = ∮_C x dy  =  −∮_C y dx  =  ½∮_C (x dy − y dx)

Green's theorem lets you compute 2D areas using only boundary integrals — incredibly useful for regions bounded by parametric curves.`}
    </Note>
    <PlotBox id={pid1} h={340}/>

    <H2>Stokes' Theorem</H2>
    <P>The 3D generalization: relates the circulation of F around boundary curve C of surface S to the flux of curl F through S:</P>
    <Eq block>∮_C F · dr  =  ∬_S (curl F) · dS  =  ∬_S (∇ × F) · dS</Eq>
    <Note color={C.purple} title="Why Stokes' unifies everything">
      {`• curl F = 0 everywhere ⟹ every loop integral is zero (path independence)
• Green's theorem IS Stokes' theorem restricted to flat 2D surfaces
• Explains why magnetic monopoles don't exist: ∇·B = 0 and Stokes' theorem together force closed magnetic field lines`}
    </Note>
    <PlotBox id={pid2} h={360}/>

    <H2>The Divergence Theorem (Gauss's Theorem)</H2>
    <P>Relates the total outward <Em>flux</Em> through closed surface ∂E to the <Em>divergence</Em> inside solid E:</P>
    <Eq block>{`∯_{∂E} F · dS  =  ∭_E (div F) dV  =  ∭_E (∇ · F) dV`}</Eq>
    <P>Total fluid leaving through the surface = net sources minus sinks created inside. This is conservation of mass in integral form. In physics: Gauss's Law for electricity is exactly this with E-field and charge density.</P>
    <PlotBox id={pid3} h={360}/>

    <Note color={C.cyan} title="The Unifying Perspective: Generalized Stokes' Theorem">
      {`All four classical theorems are the same statement in the language of differential forms:

    ∫_{∂Ω} ω  =  ∫_Ω dω

where ω is a differential form and d is the exterior derivative.

• 0D → 1D: Fundamental Theorem of Calculus
• 1D → 2D: Green's Theorem
• 2D → 3D: Stokes' Theorem (surfaces)
• 3D → volume: Divergence Theorem

One formula. All of calculus.`}
    </Note>

    <Quiz q="If div F = 0 everywhere inside a closed surface S, the net flux through S equals..."
      opts={["The surface area of S","Zero","The enclosed volume","Cannot be determined"]} ans={1}
      exp="By the Divergence Theorem: ∯_S F·dS = ∭_E div F dV. If div F = 0 everywhere in E, then the triple integral is 0, so net flux through the surface is 0. Such fields (like magnetic fields, ∇·B=0) have no sources or sinks."/>
  </div>;
}

// ─────────────────────────────────────────────────────────────
// PAGE 1B — LINES & PLANES IN 3D
// ─────────────────────────────────────────────────────────────
function Lines3DPage() {
  const pid = "pl3d";
  const [mode, setMode] = useState("plane");
  const [nx, setNx] = useState(1), [ny, setNy] = useState(1), [nz, setNz] = useState(1);
  const [px2, setPx2] = useState(0), [py2, setPy2] = useState(0), [pz2, setPz2] = useState(0);

  useEffect(() => {
    const traces = [];
    if (mode === "plane") {
      // Plane through (px2,py2,pz2) with normal (nx,ny,nz)
      // n·(r - p) = 0 → nx(x-px2)+ny(y-py2)+nz(z-pz2)=0
      // Solve for z if nz≠0: z = pz2 - (nx*(x-px2)+ny*(y-py2))/nz
      const xs = Array.from({ length: 30 }, (_, i) => -3 + 6 * i / 29);
      let planeSurf;
      if (Math.abs(nz) > 0.01) {
        planeSurf = {
          type: "surface", x: xs, y: xs,
          z: xs.map(y => xs.map(x => pz2 - (nx * (x - px2) + ny * (y - py2)) / nz)),
          colorscale: [[0, "rgba(0,150,220,0.5)"], [1, "rgba(0,200,255,0.5)"]],
          showscale: false, opacity: 0.5, name: "Plane"
        };
      } else {
        planeSurf = {
          type: "scatter3d", x: [px2, px2], y: [py2, py2], z: [-3, 3],
          mode: "lines", line: { color: C.cyan, width: 4 }, name: "Degenerate plane"
        };
      }
      // Normal vector arrow
      const normalArrow = {
        type: "scatter3d",
        x: [px2, px2 + nx * 0.8], y: [py2, py2 + ny * 0.8], z: [pz2, pz2 + nz * 0.8],
        mode: "lines+markers", line: { color: C.red, width: 5 },
        marker: { color: C.red, size: [0, 8] }, name: "Normal n"
      };
      // Point
      const pt = {
        type: "scatter3d", x: [px2], y: [py2], z: [pz2], mode: "markers",
        marker: { color: C.gold, size: 9 }, name: "Point P₀"
      };
      // Axes
      traces.push(planeSurf, normalArrow, pt);
    } else {
      // Line: r(t) = p + t*d, d = (nx,ny,nz) as direction
      const ts = Array.from({ length: 60 }, (_, i) => -2.5 + 5 * i / 59);
      const line = {
        type: "scatter3d",
        x: ts.map(t => px2 + nx * t), y: ts.map(t => py2 + ny * t), z: ts.map(t => pz2 + nz * t),
        mode: "lines", line: { color: C.cyan, width: 5 }, name: "Line r(t)"
      };
      const dirArrow = {
        type: "scatter3d",
        x: [px2, px2 + nx], y: [py2, py2 + ny], z: [pz2, pz2 + nz],
        mode: "lines+markers", line: { color: C.gold, width: 5 },
        marker: { color: C.gold, size: [0, 9] }, name: "Direction d"
      };
      const pt = {
        type: "scatter3d", x: [px2], y: [py2], z: [pz2], mode: "markers",
        marker: { color: C.red, size: 10 }, name: "Point P₀"
      };
      traces.push(line, dirArrow, pt);
    }
    Plotly.react(pid, traces, pLayout({
      scene: { camera: { eye: { x: 1.7, y: 1.7, z: 1.4 } }, aspectmode: "cube" },
      showlegend: true, legend: { bgcolor: "rgba(0,0,0,0)", font: { color: C.text, size: 11 } }
    }), pCfg);
  }, [mode, nx, ny, nz, px2, py2, pz2]);

  const mag = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
  const d = nx * px2 + ny * py2 + nz * pz2;

  return <div>
    <H1>Lines & Planes in 3D</H1>
    <P>In 3D space, lines and planes are described using vectors. This is more powerful than slope-intercept form — it generalises to any dimension and makes geometric reasoning algebraic.</P>

    <H2>Parametric Equations of a Line</H2>
    <P>A line through point <Em>P₀ = (x₀,y₀,z₀)</Em> in direction <Em>d = ⟨a,b,c⟩</Em> is traced by the position vector:</P>
    <Eq block>{`r(t) = P₀ + t·d = ⟨x₀+at, y₀+bt, z₀+ct⟩,   t ∈ ℝ

Scalar form (symmetric equations):
  (x − x₀)/a  =  (y − y₀)/b  =  (z − z₀)/c`}</Eq>
    <P>As <Em>t</Em> sweeps all real numbers, <Em>r(t)</Em> sweeps the entire line. The direction vector <Eq>d</Eq> can be scaled freely — only its direction matters for specifying the line.</P>
    <Note color={C.gold} title="Two-point form">
      {`Given P₀ = (1,2,3) and P₁ = (4,0,−1):
Direction: d = P₁ − P₀ = ⟨3,−2,−4⟩
Line: r(t) = ⟨1+3t, 2−2t, 3−4t⟩
At t=0 we're at P₀; at t=1 we're at P₁.`}
    </Note>

    <H2>Equations of a Plane</H2>
    <P>A plane is determined by a <Em>point P₀</Em> it passes through and a <Em>normal vector n = ⟨a,b,c⟩</Em> perpendicular to it. Every vector lying in the plane is perpendicular to n:</P>
    <Eq block>{`Point-normal form:   n · (r − P₀) = 0
Expanded:            a(x−x₀) + b(y−y₀) + c(z−z₀) = 0
Standard form:       ax + by + cz = d,   where d = n · P₀`}</Eq>
    <Note color={C.cyan} title="Finding a plane through 3 points">
      {`Given A, B, C (non-collinear):
  d₁ = B − A,   d₂ = C − A   (two vectors in the plane)
  n = d₁ × d₂               (cross product is perpendicular to both)
  Plane: n · (r − A) = 0`}
    </Note>

    <H2>Angles & Distances</H2>
    <P>The angle θ between two planes with normals n₁ and n₂ is the angle between the normals themselves (or its supplement):</P>
    <Eq block>{`cos θ = |n₁ · n₂| / (|n₁| |n₂|)

Distance from point Q to plane ax+by+cz=d:
  dist = |a·Qx + b·Qy + c·Qz − d| / √(a²+b²+c²)`}</Eq>
    <P>The distance formula comes directly from projecting the vector from any plane-point to Q onto the unit normal.</P>
    <Note color={C.purple} title="Parallel, Perpendicular, Intersecting">
      {`Two planes are:
• Parallel     if n₁ × n₂ = 0  (normals are parallel)
• Perpendicular if n₁ · n₂ = 0  (normals are perpendicular)
• Intersecting  otherwise → their intersection is a line
  (direction of intersection = n₁ × n₂)`}
    </Note>

    <H2>Line–Plane Intersection</H2>
    <P>To find where line <Eq>r(t) = P₀ + td</Eq> meets plane <Eq>n·r = D</Eq>, substitute r(t) into the plane equation:</P>
    <Eq block>{`n · (P₀ + td) = D
t = (D − n·P₀) / (n·d)

If n·d = 0: line is parallel to plane (no intersection or lies in it).`}</Eq>

    <H3>Interactive: Line & Plane Explorer</H3>
    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
      <Btn active={mode === "plane"} onClick={() => setMode("plane")} color={C.cyan}>Plane Mode</Btn>
      <Btn active={mode === "line"} onClick={() => setMode("line")} color={C.gold}>Line Mode</Btn>
    </div>
    <P>{mode === "plane"
      ? "Adjust the normal vector n and base point P₀. The plane updates live — watch how the normal arrow is always perpendicular to the surface."
      : "Adjust the direction vector d and starting point P₀. The line r(t) = P₀ + td extends infinitely in both directions."
    }</P>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: mode === "plane" ? C.red : C.gold, marginBottom: 6 }}>
          {mode === "plane" ? "Normal n" : "Direction d"} = ⟨{nx.toFixed(2)},{ny.toFixed(2)},{nz.toFixed(2)}⟩
        </div>
        <Slider label="x" value={nx} min={-2} max={2} step={0.05} onChange={setNx} />
        <Slider label="y" value={ny} min={-2} max={2} step={0.05} onChange={setNy} />
        <Slider label="z" value={nz} min={-2} max={2} step={0.05} onChange={setNz} />
      </div>
      <div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.gold, marginBottom: 6 }}>
          Point P₀ = ({px2.toFixed(2)},{py2.toFixed(2)},{pz2.toFixed(2)})
        </div>
        <Slider label="x₀" value={px2} min={-2} max={2} step={0.05} onChange={setPx2} />
        <Slider label="y₀" value={py2} min={-2} max={2} step={0.05} onChange={setPy2} />
        <Slider label="z₀" value={pz2} min={-2} max={2} step={0.05} onChange={setPz2} />
      </div>
    </div>
    {mode === "plane" && (
      <Note color={C.cyan}>
        Plane equation: {nx.toFixed(2)}(x−{px2.toFixed(1)}) + {ny.toFixed(2)}(y−{py2.toFixed(1)}) + {nz.toFixed(2)}(z−{pz2.toFixed(1)}) = 0
        {"\n"}Standard form: {nx.toFixed(2)}x + {ny.toFixed(2)}y + {nz.toFixed(2)}z = {d.toFixed(2)}
      </Note>
    )}
    {mode === "line" && (
      <Note color={C.gold}>
        r(t) = ⟨{px2.toFixed(1)}+{nx.toFixed(2)}t, {py2.toFixed(1)}+{ny.toFixed(2)}t, {pz2.toFixed(1)}+{nz.toFixed(2)}t⟩{"\n"}|d| = {mag.toFixed(3)}
      </Note>
    )}
    <PlotBox id={pid} h={460} />

    <Quiz q="The planes 2x − y + 3z = 5 and 4x − 2y + 6z = 1 are..."
      opts={["Perpendicular","Parallel but distinct","The same plane","Intersecting at a line"]} ans={1}
      exp="The normal of the first plane is n₁ = ⟨2,−1,3⟩. The normal of the second is n₂ = ⟨4,−2,6⟩ = 2n₁. Since n₂ = 2n₁, the normals are parallel, so the planes are parallel. But 5 ≠ 2·1 (they don't satisfy each other's equations), so they're distinct parallel planes — never intersecting." />
  </div>;
}

// ─────────────────────────────────────────────────────────────
// PAGE 1C — PARAMETRIZATION (DEEP DIVE)
// ─────────────────────────────────────────────────────────────
function CurvesPage() {

  // ── Section A: 2D Curve Parametrization ──
  const [curve2D, setCurve2D] = useState("circle");
  const [t2D, setT2D] = useState(1.5);
  const [eA, setEA] = useState(2.0);
  const [eB, setEB] = useState(1.2);
  const [cyclK, setCyclK] = useState(1.0);
  const pid2d = "pc2d";

  // ── Section B: 3D Frenet Frame ──
  const [curve3D, setCurve3D] = useState("helix");
  const [t3D, setT3D] = useState(2.5);
  const [showN, setShowN] = useState(true);
  const [showB, setShowB] = useState(true);
  const [showOsc, setShowOsc] = useState(false);
  const [helixC, setHelixC] = useState(0.4);
  const pid3d = "pc3d";

  // ── Section C: Arc Length ──
  const [arcT, setArcT] = useState(Math.PI);
  const pidArc = "pcArc";

  // ── Section D: Surface Parametrization ──
  const [surfType, setSurfType] = useState("torus");
  const [torusR, setTorusR] = useState(2.0);
  const [torusr, setTorusr] = useState(0.6);
  const pidSurf = "pcSurf";

  // ─── 2D CURVES ───────────────────────────────────────────────
  const CURVES_2D = {
    circle:   { label:"Circle",    f: t => [Math.cos(t), Math.sin(t)], fp: t => [-Math.sin(t), Math.cos(t)], tR:[0,2*Math.PI], eq:"x=cos t, y=sin t" },
    ellipse:  { label:"Ellipse",   f: t => [eA*Math.cos(t), eB*Math.sin(t)], fp: t => [-eA*Math.sin(t), eB*Math.cos(t)], tR:[0,2*Math.PI], eq:"x=a·cos t, y=b·sin t" },
    parabola: { label:"Parabola",  f: t => [t, t*t*0.5], fp: t => [1, t], tR:[-2.5,2.5], eq:"x=t, y=t²/2" },
    lemniscate:{ label:"Lemniscate",f: t => [Math.cos(t)*Math.sqrt(Math.max(0,Math.cos(2*t))), Math.sin(t)*Math.sqrt(Math.max(0,Math.cos(2*t)))], fp: t=>[0,0], tR:[0,2*Math.PI], eq:"r²=cos 2θ" },
    cycloid:  { label:"Cycloid",   f: t => [cyclK*(t-Math.sin(t)), cyclK*(1-Math.cos(t))], fp: t => [cyclK*(1-Math.cos(t)), cyclK*Math.sin(t)], tR:[0,4*Math.PI], eq:"x=k(t−sin t), y=k(1−cos t)" },
    astroid:  { label:"Astroid",   f: t => [Math.cos(t)**3, Math.sin(t)**3], fp: t => [-3*Math.cos(t)**2*Math.sin(t), 3*Math.sin(t)**2*Math.cos(t)], tR:[0,2*Math.PI], eq:"x=cos³t, y=sin³t" },
    rose:     { label:"Rose (k=3)",f: t => [Math.cos(3*t)*Math.cos(t), Math.cos(3*t)*Math.sin(t)], fp: t => [0,0], tR:[0,Math.PI], eq:"r=cos 3θ" },
    spiral:   { label:"Archimedean Spiral", f: t => [(t/5)*Math.cos(t), (t/5)*Math.sin(t)], fp: t => [(1/5)*Math.cos(t)-(t/5)*Math.sin(t),(1/5)*Math.sin(t)+(t/5)*Math.cos(t)], tR:[0,6*Math.PI], eq:"r=t/5" },
  };

  useEffect(() => {
    const c = CURVES_2D[curve2D];
    const N = 300;
    const ts = Array.from({length:N}, (_,i) => c.tR[0] + (c.tR[1]-c.tR[0])*i/(N-1));
    const pts = ts.map(t => c.f(t));
    const curveLine = { type:"scatter", x:pts.map(p=>p[0]), y:pts.map(p=>p[1]),
      mode:"lines", line:{color:C.cyan, width:2.5}, name:"r(t)" };

    const tCl = Math.max(c.tR[0], Math.min(c.tR[1], t2D));
    const pos = c.f(tCl);
    const vel = c.fp(tCl);
    const speed = Math.sqrt(vel[0]**2 + vel[1]**2) || 0.001;
    const sc = 0.38;
    const T = [vel[0]/speed, vel[1]/speed];
    const N2 = [-T[1], T[0]]; // normal (rotated 90°)

    const pt = { type:"scatter", x:[pos[0]], y:[pos[1]], mode:"markers",
      marker:{color:C.red, size:11, symbol:"circle"}, name:"r(t₀)" };
    const tv = { type:"scatter", x:[pos[0], pos[0]+T[0]*sc], y:[pos[1], pos[1]+T[1]*sc],
      mode:"lines+markers", line:{color:C.gold,width:4},
      marker:{color:C.gold,size:[0,9]}, name:"T̂ tangent" };
    const nv = { type:"scatter", x:[pos[0], pos[0]+N2[0]*sc], y:[pos[1], pos[1]+N2[1]*sc],
      mode:"lines+markers", line:{color:C.purple,width:3,dash:"dot"},
      marker:{color:C.purple,size:[0,8]}, name:"N̂ normal" };

    Plotly.react(pid2d, [curveLine, tv, nv, pt], pLayout({
      xaxis:{range:[-3.5,3.5], scaleanchor:"y"},
      yaxis:{range:[-2.2,4.2]},
      showlegend:true, legend:{bgcolor:"rgba(0,0,0,0)", font:{color:C.text,size:11}},
    }), pCfg);
  }, [curve2D, t2D, eA, eB, cyclK]);

  // ─── 3D FRENET FRAME ─────────────────────────────────────────
  const CURVES_3D = {
    helix: {
      label:"Helix",
      r:  t => [Math.cos(t), Math.sin(t), helixC*t],
      rp: t => [-Math.sin(t), Math.cos(t), helixC],
      rpp:t => [-Math.cos(t), -Math.sin(t), 0],
      tR: [0, 4*Math.PI],
      eq: "r(t) = ⟨cos t, sin t, ct⟩",
    },
    trefoil: {
      label:"Trefoil Knot",
      r:  t => [Math.sin(t)+2*Math.sin(2*t), Math.cos(t)-2*Math.cos(2*t), -Math.sin(3*t)],
      rp: t => [Math.cos(t)+4*Math.cos(2*t), -Math.sin(t)+4*Math.sin(2*t), -3*Math.cos(3*t)],
      rpp:t => [-Math.sin(t)-8*Math.sin(2*t), -Math.cos(t)+8*Math.cos(2*t), 9*Math.sin(3*t)],
      tR: [0, 2*Math.PI],
      eq: "r(t) = ⟨sin t+2sin 2t, cos t−2cos 2t, −sin 3t⟩",
    },
    lissajous3d: {
      label:"3D Lissajous",
      r:  t => [Math.sin(3*t), Math.sin(2*t), Math.sin(t)],
      rp: t => [3*Math.cos(3*t), 2*Math.cos(2*t), Math.cos(t)],
      rpp:t => [-9*Math.sin(3*t), -4*Math.sin(2*t), -Math.sin(t)],
      tR: [0, 2*Math.PI],
      eq: "r(t) = ⟨sin 3t, sin 2t, sin t⟩",
    },
    parabolicArc: {
      label:"Parabolic Arc",
      r:  t => [t, t*t*0.5, t*t*t*0.15],
      rp: t => [1, t, 0.45*t*t],
      rpp:t => [0, 1, 0.9*t],
      tR: [-2.5, 2.5],
      eq: "r(t) = ⟨t, t²/2, 3t³/20⟩",
    },
  };

  // cross product helper
  const cross = (a,b) => [
    a[1]*b[2]-a[2]*b[1],
    a[2]*b[0]-a[0]*b[2],
    a[0]*b[1]-a[1]*b[0],
  ];
  const norm3 = v => { const l=Math.sqrt(v[0]**2+v[1]**2+v[2]**2)||1; return v.map(x=>x/l); };
  const mag3  = v => Math.sqrt(v[0]**2+v[1]**2+v[2]**2);
  const scale3 = (v,s) => v.map(x=>x*s);
  const add3   = (a,b) => a.map((x,i)=>x+b[i]);

  // compute curvature & torsion at t
  const frenet = (c3, t) => {
    const rp  = c3.rp(t);
    const rpp = c3.rpp(t);
    const sp  = mag3(rp);
    const T_  = norm3(rp);
    const cr  = cross(rp, rpp);
    const kappa = mag3(cr) / (sp**3);
    // N̂ = (rp × rpp) × rp / ... simpler: dT/dt / |dT/dt|
    const h = 0.0001;
    const Tp = CURVES_3D[curve3D].r(Math.min(c3.tR[1], t+h));
    const Tm = CURVES_3D[curve3D].r(Math.max(c3.tR[0], t-h));
    const T2 = norm3(c3.rp(Math.min(c3.tR[1], t+h)));
    const T1 = norm3(c3.rp(Math.max(c3.tR[0], t-h)));
    const dT = [(T2[0]-T1[0])/(2*h),(T2[1]-T1[1])/(2*h),(T2[2]-T1[2])/(2*h)];
    const N_ = norm3(dT.map(x=>x)||[0,1,0]);
    const B_ = norm3(cross(T_, N_));
    // torsion via triple product: τ = (r'×r'')·r''' / |r'×r''|²
    return { T:T_, N:N_, B:B_, kappa, sp };
  };

  useEffect(() => {
    const c3 = CURVES_3D[curve3D];
    const [t0,t1] = c3.tR;
    const N = 250;
    const ts = Array.from({length:N}, (_,i)=>t0+(t1-t0)*i/(N-1));

    // Color by speed
    const pts = ts.map(t=>c3.r(t));
    const speeds = ts.map(t=>mag3(c3.rp(t)));
    const maxSp = Math.max(...speeds);
    const colors = speeds.map(s => s/maxSp);

    const curveLine = { type:"scatter3d",
      x:pts.map(p=>p[0]), y:pts.map(p=>p[1]), z:pts.map(p=>p[2]),
      mode:"lines",
      line:{ color:colors, colorscale:[[0,"#0040AA"],[0.4,"#00AADD"],[0.7,"#00DDAA"],[1,"#F5B942"]], width:5, cmin:0, cmax:1 },
      name:"r(t) — color = speed" };

    const tCl = Math.max(t0, Math.min(t1, t3D));
    const pos = c3.r(tCl);
    const { T, N: Nv, B, kappa, sp } = frenet(c3, tCl);
    const fs = 0.6;

    const traces = [curveLine];

    // Tangent arrow
    traces.push({ type:"scatter3d",
      x:[pos[0], pos[0]+T[0]*fs], y:[pos[1], pos[1]+T[1]*fs], z:[pos[2], pos[2]+T[2]*fs],
      mode:"lines+markers", line:{color:C.gold,width:6},
      marker:{color:C.gold,size:[0,10]}, name:"T̂ (tangent)" });

    // Principal Normal
    if (showN) traces.push({ type:"scatter3d",
      x:[pos[0], pos[0]+Nv[0]*fs], y:[pos[1], pos[1]+Nv[1]*fs], z:[pos[2], pos[2]+Nv[2]*fs],
      mode:"lines+markers", line:{color:C.purple,width:5},
      marker:{color:C.purple,size:[0,8]}, name:"N̂ (normal)" });

    // Binormal
    if (showB) traces.push({ type:"scatter3d",
      x:[pos[0], pos[0]+B[0]*fs], y:[pos[1], pos[1]+B[1]*fs], z:[pos[2], pos[2]+B[2]*fs],
      mode:"lines+markers", line:{color:C.green,width:5},
      marker:{color:C.green,size:[0,8]}, name:"B̂ (binormal)" });

    // Osculating circle
    if (showOsc && kappa > 0.001) {
      const R = 1/kappa;
      const center = add3(pos, scale3(Nv, R));
      const oscTs = Array.from({length:80}, (_,i)=>i*2*Math.PI/79);
      const oscPts = oscTs.map(a => {
        const cosA = Math.cos(a), sinA = Math.sin(a);
        return add3(center, add3(scale3(T, R*cosA), scale3(Nv, -R+R*sinA)));
      });
      traces.push({ type:"scatter3d",
        x:oscPts.map(p=>p[0]), y:oscPts.map(p=>p[1]), z:oscPts.map(p=>p[2]),
        mode:"lines", line:{color:"rgba(255,85,102,0.7)",width:3,dash:"dot"},
        name:`Osculating circle (R=1/κ=${R.toFixed(2)})` });
    }

    // Point
    traces.push({ type:"scatter3d", x:[pos[0]], y:[pos[1]], z:[pos[2]],
      mode:"markers", marker:{color:C.red,size:10}, name:"r(t₀)" });

    Plotly.react(pid3d, traces, pLayout({
      scene:{camera:{eye:{x:1.7,y:1.7,z:1.3}}},
      showlegend:true, legend:{bgcolor:"rgba(0,0,0,0)", font:{color:C.text,size:10}}
    }), pCfg);
  }, [curve3D, t3D, showN, showB, showOsc, helixC]);

  // ─── ARC LENGTH VISUALIZATION ─────────────────────────────────
  useEffect(() => {
    // Helix arc length integrand visualization
    const c3 = CURVES_3D.helix;
    const N = 200;
    const ts = Array.from({length:N}, (_,i)=>i*4*Math.PI/(N-1));
    const speeds = ts.map(t=>mag3(c3.rp(t)));

    // Filled area from 0 to arcT
    const arcTs = ts.filter(t=>t<=arcT);
    const arcSpeeds = arcTs.map(t=>mag3(c3.rp(t)));

    const integrand = { type:"scatter", x:ts, y:speeds,
      mode:"lines", line:{color:C.cyan,width:2.5}, name:"|r′(t)|" };
    const area = { type:"scatter",
      x:[...arcTs, arcT, 0], y:[...arcSpeeds, 0, 0],
      fill:"toself", fillcolor:"rgba(0,200,255,0.15)",
      line:{color:C.cyan,width:0}, name:`Arc length ≈ ${(arcT*Math.sqrt(1+helixC**2)).toFixed(3)}`, mode:"lines" };
    const vline = { type:"scatter", x:[arcT,arcT], y:[0,Math.max(...speeds)*1.1],
      mode:"lines", line:{color:C.gold,width:2,dash:"dash"}, name:`t = ${arcT.toFixed(2)}` };

    Plotly.react(pidArc, [area, integrand, vline], pLayout({
      xaxis:{ title:"t", range:[0,4*Math.PI] },
      yaxis:{ title:"|r′(t)| = speed", range:[0, Math.max(...speeds)*1.3] },
      showlegend:true, legend:{bgcolor:"rgba(0,0,0,0)",font:{color:C.text,size:11}},
    }), pCfg);
  }, [arcT, helixC]);

  // ─── SURFACE PARAMETRIZATION ──────────────────────────────────
  useEffect(() => {
    const R = torusR, r = torusr;
    const N = 50;
    const us = Array.from({length:N}, (_,i)=>i*2*Math.PI/(N-1));
    const vs = Array.from({length:N}, (_,i)=>i*2*Math.PI/(N-1));

    let traces = [];
    if (surfType === "torus") {
      const torus = { type:"surface",
        x: us.map(u => vs.map(v => (R+r*Math.cos(v))*Math.cos(u))),
        y: us.map(u => vs.map(v => (R+r*Math.cos(v))*Math.sin(u))),
        z: us.map(u => vs.map(v => r*Math.sin(v))),
        colorscale:[[0,"#0D2040"],[0.33,"#0060AA"],[0.66,"#00BBCC"],[1,"#F5B942"]],
        showscale:false, opacity:0.82 };
      // u-parameter curves (red)
      for (let i=0; i<5; i++) {
        const u0 = i*2*Math.PI/5;
        const pts = vs.map(v => [(R+r*Math.cos(v))*Math.cos(u0),(R+r*Math.cos(v))*Math.sin(u0),r*Math.sin(v)]);
        traces.push({ type:"scatter3d", x:pts.map(p=>p[0]),y:pts.map(p=>p[1]),z:pts.map(p=>p[2]),
          mode:"lines", line:{color:"rgba(255,85,102,0.9)",width:3}, showlegend:i===0, name:"u-curves" });
      }
      // v-parameter curves (gold)
      for (let i=0; i<8; i++) {
        const v0 = i*2*Math.PI/8;
        const pts = us.map(u => [(R+r*Math.cos(v0))*Math.cos(u),(R+r*Math.cos(v0))*Math.sin(u),r*Math.sin(v0)]);
        traces.push({ type:"scatter3d", x:pts.map(p=>p[0]),y:pts.map(p=>p[1]),z:pts.map(p=>p[2]),
          mode:"lines", line:{color:"rgba(245,185,66,0.9)",width:3}, showlegend:i===0, name:"v-curves" });
      }
      traces.unshift(torus);
    } else if (surfType === "sphere") {
      const sp = { type:"surface",
        x:us.map(u=>vs.map(v=>Math.sin(u/2)*Math.cos(v))),
        y:us.map(u=>vs.map(v=>Math.sin(u/2)*Math.sin(v))),
        z:us.map(u=>vs.map(v=>Math.cos(u/2))),
        colorscale:[[0,"#0D2040"],[0.5,"#005599"],[1,"#00C8FF"]], showscale:false, opacity:0.72 };
      for (let i=0; i<6; i++) {
        const phi = (i+1)*Math.PI/7;
        const latPts = us.map(u=>[Math.sin(phi)*Math.cos(u),Math.sin(phi)*Math.sin(u),Math.cos(phi)]);
        traces.push({ type:"scatter3d", x:latPts.map(p=>p[0]),y:latPts.map(p=>p[1]),z:latPts.map(p=>p[2]),
          mode:"lines", line:{color:"rgba(255,85,102,0.7)",width:2.5}, showlegend:i===0, name:"φ-circles" });
      }
      for (let i=0; i<8; i++) {
        const theta = i*Math.PI/4;
        const lonPts = Array.from({length:50},(_,j)=>j*Math.PI/49).map(phi=>[Math.sin(phi)*Math.cos(theta),Math.sin(phi)*Math.sin(theta),Math.cos(phi)]);
        traces.push({ type:"scatter3d", x:lonPts.map(p=>p[0]),y:lonPts.map(p=>p[1]),z:lonPts.map(p=>p[2]),
          mode:"lines", line:{color:"rgba(245,185,66,0.7)",width:2.5}, showlegend:i===0, name:"θ-meridians" });
      }
      traces.unshift(sp);
    } else if (surfType === "mobius") {
      const N2=120, M2=12;
      const us2 = Array.from({length:N2},(_,i)=>i*2*Math.PI/(N2-1));
      const vs2 = Array.from({length:M2},(_,i)=>-0.5+i/(M2-1));
      const mob = { type:"surface",
        x:vs2.map(v=>us2.map(u=>(1+v*Math.cos(u/2))*Math.cos(u))),
        y:vs2.map(v=>us2.map(u=>(1+v*Math.cos(u/2))*Math.sin(u))),
        z:vs2.map(v=>us2.map(u=>v*Math.sin(u/2))),
        colorscale:[[0,"#1A0A3A"],[0.5,"#7050CC"],[1,"#C0A0FF"]], showscale:false, opacity:0.85 };
      traces.push(mob);
    } else if (surfType === "helicoidal") {
      const N2=60;
      const us2 = Array.from({length:N2},(_,i)=>i*4*Math.PI/(N2-1));
      const vs2 = Array.from({length:N2},(_,i)=>i*2/(N2-1));
      const hel = { type:"surface",
        x:vs2.map(v=>us2.map(u=>v*Math.cos(u))),
        y:vs2.map(v=>us2.map(u=>v*Math.sin(u))),
        z:vs2.map(v=>us2.map(u=>0.3*u)),
        colorscale:[[0,"#0A1F3A"],[0.5,"#007799"],[1,"#00DDBB"]], showscale:false, opacity:0.82 };
      traces.push(hel);
    }

    Plotly.react(pidSurf, traces, pLayout({
      scene:{camera:{eye:{x:1.8,y:1.8,z:1.2}}, aspectmode:"cube"},
      showlegend:true, legend:{bgcolor:"rgba(0,0,0,0)",font:{color:C.text,size:11}}
    }), pCfg);
  }, [surfType, torusR, torusr]);

  // ─── COMPUTED VALUES ──────────────────────────────────────────
  const c2 = CURVES_2D[curve2D];
  const tCl2 = Math.max(c2.tR[0], Math.min(c2.tR[1], t2D));
  const pos2 = c2.f(tCl2);
  const vel2 = c2.fp(tCl2);
  const speed2 = Math.sqrt(vel2[0]**2+vel2[1]**2);

  const c3cur = CURVES_3D[curve3D];
  const tCl3 = Math.max(c3cur.tR[0], Math.min(c3cur.tR[1], t3D));
  const { T:T3, N:N3, B:B3, kappa, sp:sp3 } = frenet(c3cur, tCl3);

  const arcLen = arcT * Math.sqrt(1 + helixC**2);

  return <div>
    <H1>Parametrization — A Deep Dive</H1>
    <P>
      Parametrization is the master key of multivariable calculus. Instead of describing a curve as <Eq>y=f(x)</Eq>, we introduce a separate <Em>parameter</Em> <Eq>t</Eq> and express every coordinate as a function of it: <Eq>x=x(t), y=y(t), z=z(t)</Eq>. This liberates us from the tyranny of functions — curves can loop, backtrack, spiral, knot, and self-intersect freely.
    </P>

    {/* ═══════════════════════════════════════ SECTION A */}
    <div style={{borderTop:`2px solid ${C.cyan}`, marginTop:40, paddingTop:20}}>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10.5,color:C.cyan,letterSpacing:2.5,textTransform:"uppercase",marginBottom:10}}>
        Part I — Parametrizing 2D Curves
      </div>
    </div>

    <H2>Why Parametrize?</H2>
    <P>Consider the unit circle. Written as a function <Eq>y=f(x)</Eq>, you need two pieces: <Eq>y=+√(1-x²)</Eq> and <Eq>y=-√(1-x²)</Eq>, and you can't travel around it continuously. Parametrically, one clean pair does everything:</P>
    <Eq block>{`r(t) = ⟨cos t, sin t⟩,   t ∈ [0, 2π]

As t increases from 0 to 2π, the point traces the circle counterclockwise exactly once.
At t=0: (1,0).   At t=π/2: (0,1).   At t=π: (−1,0).   At t=3π/2: (0,−1).`}</Eq>

    <H2>Parametrizing Classic 2D Curves</H2>
    <Note color={C.cyan} title="Circle — r(t) = ⟨R cos t, R sin t⟩">
      Satisfies x²+y²=R² at every t. Constant speed |r′|=R. Clockwise: use ⟨cos(−t), sin(−t)⟩.
    </Note>
    <Note color={C.gold} title="Ellipse — r(t) = ⟨a cos t, b sin t⟩">
      {`Satisfies x²/a²+y²/b²=1. Semi-axes a (horizontal) and b (vertical).
Speed is NOT constant: |r′(t)| = √(a²sin²t + b²cos²t)  varies with t.
This makes arc length of an ellipse a hard integral (elliptic integral)!`}
    </Note>
    <Note color={C.purple} title="Cycloid — r(t) = ⟨k(t−sin t), k(1−cos t)⟩">
      {`Traced by a point on a rolling circle of radius k. Famous properties:
• Tautochrone: a ball placed anywhere on an upside-down cycloid arch reaches
  the bottom in exactly the same time, regardless of starting height!
• Brachistochrone: the path of fastest descent under gravity is the cycloid.`}
    </Note>
    <Note color={C.green} title="Astroid — r(t) = ⟨cos³t, sin³t⟩">
      Satisfies x^(2/3)+y^(2/3)=1. Has 4 cusps where r′(t)=0 (speed=0). Beautiful self-similar structure — it's a hypocycloid with ratio 4:1.
    </Note>

    <H2>The Tangent Vector in 2D</H2>
    <Eq block>{`r′(t) = ⟨x′(t), y′(t)⟩   — velocity / tangent vector
T̂(t) = r′(t)/|r′(t)|       — unit tangent
N̂(t) = ⟨−T̂_y, T̂_x⟩        — unit normal (rotated 90° left)
κ(t) = |x′y″ − y′x″| / (x′²+y′²)^(3/2)  — curvature`}</Eq>

    <H2>Orientation Matters</H2>
    <P>The same curve can be parametrized in opposite <Em>orientations</Em>. Replacing <Eq>t</Eq> with <Eq>-t</Eq> reverses direction. This matters enormously for line integrals: <Eq>∫_{-C} F·dr = −∫_C F·dr</Eq>.</P>
    <Note color={C.gold} title="Multiple parametrizations, same curve">
      {`r₁(t) = ⟨t, t²⟩,   t∈[0,1]         — parabola, slow at start
r₂(t) = ⟨t², t⁴⟩, t∈[0,1]         — same curve, faster at start  
r₃(t) = ⟨sin t, sin²t⟩, t∈[0,π/2]  — same curve, different speed

All trace y=x² from (0,0) to (1,1). Geometric integrals (arc length, line
integrals of scalar functions) give the same answer. Orientation-sensitive
integrals (∫F·dr) may differ if orientation differs.`}
    </Note>

    <H3 color={C.cyan}>Interactive: 2D Curve Library</H3>
    <P>Explore 8 classic parametric curves. Watch the <Em c={C.gold}>gold tangent</Em> and <Em c={C.purple}>purple normal</Em> vectors as t changes. Notice how speed (length of r′) varies — curves with cusps have speed = 0 at those points.</P>
    <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:10}}>
      {Object.entries(CURVES_2D).map(([k,v])=>(
        <Btn key={k} active={curve2D===k} onClick={()=>setCurve2D(k)} color={C.cyan}>{v.label}</Btn>
      ))}
    </div>
    {curve2D==="ellipse" && (
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:8}}>
        <Slider label="Semi-axis a" value={eA} min={0.3} max={3} step={0.05} onChange={setEA}/>
        <Slider label="Semi-axis b" value={eB} min={0.3} max={3} step={0.05} onChange={setEB}/>
      </div>
    )}
    {curve2D==="cycloid" && (
      <Slider label="Radius k" value={cyclK} min={0.3} max={1.5} step={0.05} onChange={setCyclK}/>
    )}
    <Note color={C.cyan}><Em c={C.gold}>{CURVES_2D[curve2D].eq}</Em></Note>
    <Slider label="t" value={t2D} min={CURVES_2D[curve2D].tR[0]} max={CURVES_2D[curve2D].tR[1]} step={(CURVES_2D[curve2D].tR[1]-CURVES_2D[curve2D].tR[0])/300} onChange={setT2D}/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
      <Note color={C.red}>r({tCl2.toFixed(2)}) = ({pos2[0].toFixed(3)}, {pos2[1].toFixed(3)})</Note>
      <Note color={C.gold}>|r′| = {speed2.toFixed(4)}</Note>
      <Note color={C.purple}>κ = {Math.abs((vel2[0]*(c2.fp?.[1]||0)-vel2[1]*(c2.fp?.[0]||0))).toFixed(4)}</Note>
    </div>
    <PlotBox id={pid2d} h={430}/>

    <Quiz q="The cycloid r(t) = ⟨t − sin t, 1 − cos t⟩ has a cusp when..."
      opts={["t = π","t = 2π","t = 0 (and all t = 2kπ)","t = π/2"]} ans={2}
      exp="A cusp occurs when r′(t) = ⟨1−cos t, sin t⟩ = ⟨0,0⟩. This requires 1−cos t = 0 → cos t = 1 → t = 0, 2π, 4π, ... The rolling circle is touching the ground at these points. The curve has a sharp point (zero speed) at every complete revolution."/>

    <Quiz q="If r(t) = ⟨3cos t, 2sin t⟩, what is the speed |r′(t)| at t = 0?"
      opts={["√13","2","3","√5"]} ans={1}
      exp="r′(t) = ⟨−3sin t, 2cos t⟩. At t=0: r′(0) = ⟨0, 2⟩. So |r′(0)| = √(0+4) = 2. The ellipse moves with speed 2 at (3,0), the rightmost point — the point of maximum curvature for this ellipse."/>

    {/* ═══════════════════════════════════════ SECTION B */}
    <div style={{borderTop:`2px solid ${C.gold}`, marginTop:48, paddingTop:20}}>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10.5,color:C.gold,letterSpacing:2.5,textTransform:"uppercase",marginBottom:10}}>
        Part II — The Frenet-Serret Frame in 3D
      </div>
    </div>

    <H2>The Moving Trihedral</H2>
    <P>Every smooth 3D curve carries with it a natural <Em>orthonormal frame</Em> — three mutually perpendicular unit vectors that ride along the curve, capturing all its geometric information:</P>
    <Eq block>{`T̂(t) = r′(t) / |r′(t)|                          Unit Tangent   (gold)
N̂(t) = T̂′(t) / |T̂′(t)|                         Principal Normal (purple)
B̂(t) = T̂(t) × N̂(t)                              Binormal         (green)

{T̂, N̂, B̂} is right-handed and orthonormal at every point.`}</Eq>

    <P><Em c={C.gold}>T̂</Em> points where the curve is going. <Em c={C.purple}>N̂</Em> points toward the center of the best-fitting circle (osculating circle). <Em c={C.green}>B̂</Em> is perpendicular to the plane those two span — the <Em>osculating plane</Em>.</P>

    <H2>Curvature κ — How Much Does It Bend?</H2>
    <Eq block>{`κ = |T̂′(t)| / |r′(t)|  =  |r′ × r″| / |r′|³

Equivalently:  κ = |x′y″ − y′x″| / (x′²+y′²)^(3/2)   (2D)

Osculating circle radius: ρ = 1/κ`}</Eq>
    <Note color={C.cyan} title="Curvature of a circle">
      {`For r(t) = ⟨R cos t, R sin t⟩:
r′ = ⟨−R sin t, R cos t⟩,   |r′| = R
r″ = ⟨−R cos t, −R sin t⟩
|r′×r″| = |−R sin t·(−R sin t) − R cos t·(−R cos t)| = R²
κ = R²/R³ = 1/R   ✓

A circle of radius R has constant curvature 1/R everywhere.`}
    </Note>
    <Note color={C.gold} title="Curvature of a helix r(t)=⟨cos t, sin t, ct⟩">
      {`r′ = ⟨−sin t, cos t, c⟩,   r″ = ⟨−cos t, −sin t, 0⟩
r′×r″ = ⟨c sin t, −c cos t, 1⟩,   |r′×r″| = √(c²+1)
|r′|  = √(1+c²)
κ = √(c²+1)/(1+c²)^(3/2) = 1/(1+c²)

As c→∞ (very tall helix), κ→0 (nearly straight).
As c→0 (flat helix = circle), κ→1/R. ✓`}
    </Note>

    <H2>Torsion τ — How Much Does It Twist?</H2>
    <P>Torsion measures how fast the osculating plane rotates — equivalently, how much the curve twists out of a flat plane:</P>
    <Eq block>{`τ = −dB̂/ds · N̂  =  (r′×r″)·r‴ / |r′×r″|²

τ = 0  →  the curve is planar (lies in a fixed plane)
τ ≠ 0  →  the curve spirals out of every plane`}</Eq>
    <Note color={C.purple} title="Frenet-Serret Equations">
      {`These three ODEs govern how the frame evolves along the curve:
  dT̂/ds =  κ·N̂
  dN̂/ds = −κ·T̂ + τ·B̂
  dB̂/ds =       −τ·N̂

κ controls T̂→N̂ rotation (bending).
τ controls N̂→B̂ rotation (twisting).
A curve is completely determined (up to rigid motion) by its curvature and torsion functions κ(s) and τ(s) — the fundamental theorem of curves.`}
    </Note>

    <H3 color={C.gold}>Interactive: Frenet Frame on 3D Curves</H3>
    <P>
      Drag t along the curve. Toggle the <Em c={C.purple}>purple N̂</Em>, <Em c={C.green}>green B̂</Em>, and <Em c={C.red}>osculating circle</Em>. The color of the curve encodes speed: <Em>blue=slow, gold=fast</Em>.
    </P>
    <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:10}}>
      {Object.entries(CURVES_3D).map(([k,v])=>(
        <Btn key={k} active={curve3D===k} onClick={()=>setCurve3D(k)} color={C.gold}>{v.label}</Btn>
      ))}
    </div>
    {curve3D==="helix" && (
      <Slider label="Helix pitch c" value={helixC} min={0.05} max={1.5} step={0.05} onChange={setHelixC}/>
    )}
    <Slider label="t" value={t3D} min={CURVES_3D[curve3D].tR[0]} max={CURVES_3D[curve3D].tR[1]} step={(CURVES_3D[curve3D].tR[1]-CURVES_3D[curve3D].tR[0])/300} onChange={setT3D}/>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
      <Btn active={showN} onClick={()=>setShowN(!showN)} color={C.purple}>N̂ {showN?"ON":"OFF"}</Btn>
      <Btn active={showB} onClick={()=>setShowB(!showB)} color={C.green}>B̂ {showB?"ON":"OFF"}</Btn>
      <Btn active={showOsc} onClick={()=>setShowOsc(!showOsc)} color={C.red}>Osculating Circle {showOsc?"ON":"OFF"}</Btn>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
      <Note color={C.gold}>T̂ = ({T3.map(x=>x.toFixed(2)).join(", ")})</Note>
      <Note color={C.purple}>N̂ = ({N3.map(x=>x.toFixed(2)).join(", ")})</Note>
      <Note color={C.green}>B̂ = ({B3.map(x=>x.toFixed(2)).join(", ")})</Note>
    </div>
    <Note color={C.red}>κ = {kappa.toFixed(4)}{"   "}   ρ = 1/κ = {kappa>0.0001?(1/kappa).toFixed(3):"∞"}{"   "}   speed = {sp3.toFixed(4)}</Note>
    <Note color={C.cyan}>{CURVES_3D[curve3D].eq}</Note>
    <PlotBox id={pid3d} h={500}/>

    <Quiz q="For a straight line r(t) = ⟨t, 2t, 3t⟩, what are κ and τ?"
      opts={["κ=1, τ=0","κ=0, τ=0","κ=0, τ=1","κ=√14, τ=0"]} ans={1}
      exp="A straight line has no bending (κ=0) and no twisting (τ=0). Computing: r′=⟨1,2,3⟩, r″=⟨0,0,0⟩, so r′×r″=⟨0,0,0⟩, giving κ=|0|/|r′|³=0. With κ=0, T̂ is constant, so dT̂/ds=0=κN̂, confirming everything is zero."/>

    <Quiz q="If the binormal B̂ is constant along a curve, what can you conclude?"
      opts={["The curve has constant speed","The curvature is 1","The curve lies in a fixed plane (τ=0)","The curve is a circle"]} ans={2}
      exp="From the Frenet-Serret equations, dB̂/ds = −τ·N̂. If B̂ is constant, then dB̂/ds=0, so τ=0. Torsion = 0 means the curve has no twist out of the osculating plane — which remains fixed. A planar curve has τ=0 everywhere."/>

    {/* ═══════════════════════════════════════ SECTION C */}
    <div style={{borderTop:`2px solid ${C.purple}`, marginTop:48, paddingTop:20}}>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10.5,color:C.purple,letterSpacing:2.5,textTransform:"uppercase",marginBottom:10}}>
        Part III — Arc Length & Natural Parametrization
      </div>
    </div>

    <H2>Arc Length as an Integral</H2>
    <P>The arc length <Eq>L</Eq> from <Eq>t=a</Eq> to <Eq>t=b</Eq> integrates the speed |r′(t)| — the instantaneous rate of distance traced per unit parameter:</P>
    <Eq block>{`L(a→b) = ∫_a^b |r′(t)| dt  =  ∫_a^b √(x′²+y′²+z′²) dt`}</Eq>
    <P>This is exactly the limit of summing straight-line distances between points as the partition gets finer — the arc length is the limit of polyline approximations.</P>

    <H2>The Arc Length Function s(t)</H2>
    <P>Define <Em>s(t)</Em> as the arc length from a fixed starting point to parameter value t:</P>
    <Eq block>{`s(t) = ∫_{t₀}^t |r′(u)| du

ds/dt = |r′(t)|  ← speed = rate of arc length accumulation`}</Eq>
    <P>If <Eq>|r′(t)| = 1</Eq> everywhere (unit-speed curve), then <Eq>s = t - t₀</Eq> — the parameter IS the arc length. This is called the <Em c={C.gold}>natural (arc-length) parametrization</Em>.</P>

    <H2>Reparametrization by Arc Length</H2>
    <P>Any regular curve (r′ ≠ 0 everywhere) can be reparametrized by arc length. The resulting parametrization has speed exactly 1 and is called a <Em>unit-speed curve</Em>. This is the intrinsic description — it doesn't depend on how fast you traverse the curve, only on its geometry:</P>
    <Eq block>{`Given r(t): compute s = ∫|r′|dt  →  invert to get t = t(s)
Define: r̃(s) = r(t(s))  — now |r̃′(s)| = 1 everywhere`}</Eq>
    <Note color={C.cyan} title="Why arc-length parametrization matters">
      {`All geometric quantities (curvature, torsion) have their simplest form when expressed
w.r.t. arc length s:

κ = |d²r̃/ds²|           (magnitude of acceleration for unit-speed curve)
τ = (d²r̃/ds² × d³r̃/ds³) · (dr̃/ds)

For a general parametrization you need the chain rule corrections (the 1/|r′|³ factors).
Computations are cleaner, but inverting s(t) is usually impossible analytically.`}
    </Note>
    <Note color={C.gold} title="Helix arc length example (interactive below)">
      {`r(t) = ⟨cos t, sin t, ct⟩,   c = helix pitch slider
|r′(t)| = √(sin²t + cos²t + c²) = √(1+c²) = constant

s(t) = ∫₀ᵗ √(1+c²) du = t√(1+c²)

The helix is naturally easy to reparametrize: t = s/√(1+c²)
r̃(s) = ⟨cos(s/√(1+c²)), sin(s/√(1+c²)), cs/√(1+c²)⟩`}
    </Note>

    <H3 color={C.purple}>Interactive: Arc Length Integrand for the Helix</H3>
    <P>The shaded area below is the arc length from t=0 to t=T. Since |r′|=√(1+c²) is constant for the helix, the area is exactly a rectangle — the helix is a constant-speed curve.</P>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <Slider label="Integration limit T" value={arcT} min={0} max={4*Math.PI} step={0.05} onChange={setArcT}/>
      <Slider label="Helix pitch c" value={helixC} min={0.05} max={1.5} step={0.05} onChange={setHelixC}/>
    </div>
    <Note color={C.purple}>Arc length = ∫₀^{arcT.toFixed(2)} √(1+{helixC.toFixed(2)}²) dt = {arcLen.toFixed(4)}</Note>
    <PlotBox id={pidArc} h={340}/>

    <Quiz q="For r(t) = ⟨cos(3t), sin(3t)⟩, what is the arc length from t=0 to t=2π?"
      opts={["2π","6π","1","2π/3"]} ans={1}
      exp="r′(t) = ⟨−3sin(3t), 3cos(3t)⟩, so |r′(t)| = 3. Arc length = ∫₀^{2π} 3 dt = 6π. This makes sense: r(t) traverses the unit circle 3 times (since 3t goes 0→6π), each circuit having length 2π, for total 3×2π = 6π."/>

    {/* ═══════════════════════════════════════ SECTION D */}
    <div style={{borderTop:`2px solid ${C.green}`, marginTop:48, paddingTop:20}}>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10.5,color:C.green,letterSpacing:2.5,textTransform:"uppercase",marginBottom:10}}>
        Part IV — Parametrizing Surfaces
      </div>
    </div>

    <H2>From Curves to Surfaces</H2>
    <P>A <Em>parametric surface</Em> uses <Em c={C.gold}>two parameters</Em> (u,v) to sweep out a 2D surface in 3D space. Each (u,v) pair maps to a point on the surface:</P>
    <Eq block>{`r(u,v) = ⟨x(u,v), y(u,v), z(u,v)⟩,   (u,v) ∈ D ⊆ ℝ²`}</Eq>
    <P>Fixing v and varying u traces a <Em c={C.red}>u-curve</Em>. Fixing u and varying v traces a <Em c={C.gold}>v-curve</Em>. Together they form the parameter grid on the surface.</P>

    <H2>The Standard Surfaces</H2>
    <Note color={C.cyan} title="Sphere — r(φ,θ) = ⟨sinφ cosθ, sinφ sinθ, cosφ⟩">
      {`φ ∈ [0,π] (latitude from north pole), θ ∈ [0,2π] (longitude)
u-curves (fix θ): meridians — great semicircles from pole to pole
v-curves (fix φ): parallels — circles at constant latitude

Note: this is SPHERICAL coordinates on the unit sphere!
For radius R: multiply all components by R.`}
    </Note>
    <Note color={C.gold} title="Torus — r(u,v) = ⟨(R+r cosv)cosu, (R+r cosv)sinu, r sinv⟩">
      {`R = major radius (center of tube to center of torus)
r = minor radius (radius of the tube)
u ∈ [0,2π]: goes around the big circle (longitude)
v ∈ [0,2π]: goes around the tube (latitude of tube)

u-curves: circles on the outer/inner equator
v-curves: circles that go through the hole`}
    </Note>
    <Note color={C.purple} title="Möbius Strip — r(u,v) = ⟨(1+v cos(u/2))cos u, (1+v cos(u/2))sin u, v sin(u/2)⟩">
      {`u ∈ [0,2π], v ∈ [−½,½]
A one-sided surface — impossible to define a consistent normal!
Walking around the strip, you return to your start but on the opposite side.
This means it has no "inside" or "outside" — it's non-orientable.`}
    </Note>
    <Note color={C.green} title="Helicoidal Surface — r(u,v) = ⟨v cos u, v sin u, cu⟩">
      {`u ∈ [0, 4π], v ∈ [0,2]
u-curves (fix v): helices of radius v
v-curves (fix u): radial lines in a rotating plane
The surface swept by a line rotating and rising simultaneously.
Propeller blades and screw threads are helicoidal.`}
    </Note>

    <H2>The Surface Normal Vector</H2>
    <P>The two partial derivative vectors <Eq>r_u</Eq> and <Eq>r_v</Eq> are tangent to the surface. Their cross product gives a normal vector to the surface — crucial for surface integrals:</P>
    <Eq block>{`r_u = ∂r/∂u = ⟨∂x/∂u, ∂y/∂u, ∂z/∂u⟩   (tangent in u-direction)
r_v = ∂r/∂v = ⟨∂x/∂v, ∂y/∂v, ∂z/∂v⟩   (tangent in v-direction)

Normal:  n = r_u × r_v                   (perpendicular to surface)
Unit normal: n̂ = n / |n|`}</Eq>
    <P>The area element for surface integrals is <Eq>dS = |r_u × r_v| du dv</Eq>. This is the Jacobian of the surface parametrization — it corrects for stretching and compression as the parameter domain maps to the surface.</P>
    <Note color={C.gold} title="Surface area formula">
      {`Area(S) = ∬_D |r_u × r_v| dA

For the sphere of radius R:
r_φ = ⟨R cosφ cosθ, R cosφ sinθ, −R sinφ⟩
r_θ = ⟨−R sinφ sinθ, R sinφ cosθ, 0⟩
|r_φ × r_θ| = R² sinφ

Area = ∫₀^{2π} ∫₀^π R² sinφ dφ dθ = 4πR²   ✓`}
    </Note>

    <H2>Orientability</H2>
    <P>A surface is <Em>orientable</Em> if you can consistently define an outward normal across the entire surface without contradiction. Spheres, tori, and paraboloids are orientable. The Möbius strip is not — its normal vector flips as you travel around. This distinction matters enormously for flux integrals and Stokes' theorem.</P>

    <H3 color={C.green}>Interactive: Parametric Surface Gallery</H3>
    <P>Red lines are u-curves (u varying, v fixed). Gold lines are v-curves (v varying, u fixed). These are the coordinate curves of the parametrization — the "latitude/longitude" grid on the surface.</P>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
      {[["torus","Torus"],["sphere","Sphere"],["mobius","Möbius Strip"],["helicoidal","Helicoidal"]].map(([k,l])=>(
        <Btn key={k} active={surfType===k} onClick={()=>setSurfType(k)} color={C.green}>{l}</Btn>
      ))}
    </div>
    {surfType==="torus" && (
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:8}}>
        <Slider label="Major radius R" value={torusR} min={1} max={3} step={0.05} onChange={setTorusR}/>
        <Slider label="Tube radius r" value={torusr} min={0.1} max={Math.min(torusR-0.1,1.5)} step={0.05} onChange={setTorusr}/>
      </div>
    )}
    <PlotBox id={pidSurf} h={500}/>

    <Quiz q="For the parametrized sphere r(φ,θ) = ⟨sinφ cosθ, sinφ sinθ, cosφ⟩, what is |r_φ × r_θ|?"
      opts={["1","sinφ","sinφ cosφ","cosφ"]} ans={1}
      exp="Computing the cross product: r_φ = ⟨cosφ cosθ, cosφ sinθ, −sinφ⟩ and r_θ = ⟨−sinφ sinθ, sinφ cosθ, 0⟩. Their cross product has magnitude |r_φ×r_θ| = sinφ. This is exactly the factor that appears in spherical coordinates' volume element (ρ² sinφ has the sinφ from this surface element at ρ=1)."/>

    <Quiz q="A curve r(t) is reparametrized as r̃(s) where s is arc length. Which is true?"
      opts={["|r̃′(s)| = |r′(t)|","The curvature changes under reparametrization","r̃′(s) is always the unit tangent T̂","The torsion doubles"]} ans={2}
      exp="|r̃′(s)| = 1 by definition of arc-length parametrization — the speed is always exactly 1. This means r̃′(s) = T̂(s), the unit tangent. The curvature and torsion are geometric invariants — they don't change under reparametrization, only the formulas you use to compute them become simpler."/>
  </div>;
}

// ─────────────────────────────────────────────────────────────
// PAGE 2B — QUADRIC SURFACES
// ─────────────────────────────────────────────────────────────
function QuadricsPage() {
  const pid = "pq";
  const [qt, setQt] = useState("ellipsoid");
  const [a2, setA2] = useState(1.5), [b2, setB2] = useState(1.0), [c2, setC2] = useState(0.7);

  const QUADRICS = {
    ellipsoid: {
      label: "Ellipsoid",
      eq: "x²/a² + y²/b² + z²/c² = 1",
      desc: "A stretched sphere. All three axis radii can differ. Level curves in every direction are ellipses.",
      build: (a, b, c) => {
        const u = Array.from({ length: 40 }, (_, i) => i * Math.PI / 39);
        const v = Array.from({ length: 40 }, (_, i) => i * 2 * Math.PI / 39);
        return {
          type: "surface",
          x: u.map(p => v.map(t => a * Math.sin(p) * Math.cos(t))),
          y: u.map(p => v.map(t => b * Math.sin(p) * Math.sin(t))),
          z: u.map(p => v.map(() => c * Math.cos(p))),
          colorscale: [[0, "#0D2040"], [0.5, "#0080BB"], [1, "#00C8FF"]],
          showscale: false, opacity: 0.75
        };
      }
    },
    hyperboloid1: {
      label: "Hyperboloid (1 sheet)",
      eq: "x²/a² + y²/b² − z²/c² = 1",
      desc: "A waist-pinched surface connecting two flared ends. The cross-sections at constant z are ellipses. A classic cooling tower shape.",
      build: (a, b, c) => {
        const u = Array.from({ length: 40 }, (_, i) => -2.5 + 5 * i / 39);
        const v = Array.from({ length: 40 }, (_, i) => i * 2 * Math.PI / 39);
        return {
          type: "surface",
          x: u.map(z => v.map(t => a * Math.cosh(z * 0.7) * Math.cos(t))),
          y: u.map(z => v.map(t => b * Math.cosh(z * 0.7) * Math.sin(t))),
          z: u.map(z => v.map(() => c * z)),
          colorscale: [[0, "#1A0A3A"], [0.5, "#6040AA"], [1, "#9B8FFF"]],
          showscale: false, opacity: 0.75
        };
      }
    },
    hyperboloid2: {
      label: "Hyperboloid (2 sheets)",
      eq: "x²/a² + y²/b² − z²/c² = −1",
      desc: "Two separate bowl-shaped sheets opening away from each other. No real points between the sheets.",
      build: (a, b, c) => {
        const u = Array.from({ length: 25 }, (_, i) => 0.5 + 2 * i / 24);
        const v = Array.from({ length: 40 }, (_, i) => i * 2 * Math.PI / 39);
        const top = {
          type: "surface",
          x: u.map(z => v.map(t => a * Math.sinh(z) * Math.cos(t))),
          y: u.map(z => v.map(t => b * Math.sinh(z) * Math.sin(t))),
          z: u.map(z => v.map(() => c * Math.cosh(z))),
          colorscale: [[0, "#1A0A3A"], [1, "#9B8FFF"]], showscale: false, opacity: 0.7
        };
        const bot = {
          type: "surface",
          x: u.map(z => v.map(t => a * Math.sinh(z) * Math.cos(t))),
          y: u.map(z => v.map(t => b * Math.sinh(z) * Math.sin(t))),
          z: u.map(z => v.map(() => -c * Math.cosh(z))),
          colorscale: [[0, "#1A0A3A"], [1, "#9B8FFF"]], showscale: false, opacity: 0.7
        };
        return [top, bot];
      }
    },
    cone: {
      label: "Elliptic Cone",
      eq: "x²/a² + y²/b² = z²/c²",
      desc: "Two infinite cones joined at their apex. The only quadric that passes through the origin. Cross-sections at z=const are ellipses.",
      build: (a, b, c) => {
        const u = Array.from({ length: 30 }, (_, i) => -2 + 4 * i / 29);
        const v = Array.from({ length: 40 }, (_, i) => i * 2 * Math.PI / 39);
        return {
          type: "surface",
          x: u.map(z => v.map(t => a * Math.abs(z) / c * Math.cos(t))),
          y: u.map(z => v.map(t => b * Math.abs(z) / c * Math.sin(t))),
          z: u.map(z => v.map(() => z)),
          colorscale: [[0, "#0A1F3A"], [0.5, "#005599"], [1, "#00AACC"]],
          showscale: false, opacity: 0.72
        };
      }
    },
    hypParaboloid: {
      label: "Hyperbolic Paraboloid",
      eq: "z = x²/a² − y²/b²",
      desc: "The saddle surface. Curves up like a paraboloid in x, down in y. Slicing with horizontal planes gives hyperbolas.",
      build: (a, b) => {
        const xs = Array.from({ length: 40 }, (_, i) => -2.5 + 5 * i / 39);
        return {
          type: "surface", x: xs, y: xs,
          z: xs.map(y => xs.map(x => x * x / (a * a) - y * y / (b * b))),
          colorscale: [[0, "#1A0A3A"], [0.35, "#4A1A88"], [0.6, "#8060FF"], [1, "#C0B0FF"]],
          showscale: false, opacity: 0.82
        };
      }
    }
  };

  useEffect(() => {
    const q = QUADRICS[qt];
    let surfaces = q.build(a2, b2, c2);
    if (!Array.isArray(surfaces)) surfaces = [surfaces];
    Plotly.react(pid, surfaces, pLayout({
      scene: { camera: { eye: { x: 1.8, y: 1.8, z: 1.3 } }, aspectmode: "cube" }
    }), pCfg);
  }, [qt, a2, b2, c2]);

  return <div>
    <H1>Quadric Surfaces</H1>
    <P>Quadric surfaces are the 3D analogues of conic sections — defined by degree-2 polynomial equations in x, y, z. Mastering their shapes and standard forms is essential for setting up integrals, visualizing geometry, and recognizing physics models.</P>
    <Eq block>{`General quadric:  Ax² + By² + Cz² + Dxy + Exz + Fyz + Gx + Hy + Iz + J = 0`}</Eq>

    <H2>How to Identify & Sketch Quadrics: Traces</H2>
    <P>The key technique: take cross-sections called <Em>traces</Em> — intersect the surface with planes parallel to the coordinate planes. The resulting 2D curves tell you everything:</P>
    <Note color={C.gold} title="Trace Strategy">
      {`Set z = k (constant) → trace in the horizontal plane at height k
Set y = k             → trace in a vertical xz-plane
Set x = k             → trace in a vertical yz-plane

If all three traces are ellipses → ellipsoid
If one trace is a parabola and two are ellipses → paraboloid  
If one trace is a hyperbola → hyperboloid or cone`}
    </Note>

    <H2>The Six Standard Quadrics</H2>
    <Note color={C.cyan} title="Ellipsoid — x²/a² + y²/b² + z²/c² = 1">
      Bounded surface, like a football or Earth. All cross sections are ellipses. When a=b=c: sphere. Gravity and electrostatic equipotentials near ellipsoidal masses.
    </Note>
    <Note color={C.gold} title="Elliptic Paraboloid — z = x²/a² + y²/b²">
      Opens upward from vertex at origin. Traces in z=k are ellipses; traces in x=k or y=k are parabolas. The shape of satellite dish reflectors.
    </Note>
    <Note color={C.purple} title="Hyperbolic Paraboloid — z = x²/a² − y²/b²">
      Saddle surface. Horizontal traces (z=k) are hyperbolas. Vertical traces are parabolas opening in opposite directions. Appears in architecture (Pringle chip shape).
    </Note>
    <Note color={C.green} title="Elliptic Cone — x²/a² + y²/b² = z²/c²">
      Two cones meeting at origin. Horizontal traces are ellipses (or a single point at z=0). Vertical traces are hyperbolas or pairs of lines. The boundary between one-sheet and two-sheet hyperboloids.
    </Note>
    <Note color={C.cyan} title="Hyperboloid of One Sheet — x²/a² + y²/b² − z²/c² = 1">
      A connected surface with a waist. Horizontal traces: ellipses. Vertical traces: hyperbolas. Nuclear cooling towers are this shape — structurally optimal.
    </Note>
    <Note color={C.gold} title="Hyperboloid of Two Sheets — x²/a² + y²/b² − z²/c² = −1">
      Two disconnected bowl-shaped sheets. No points with |z| less than c. Horizontal traces (|z|{">"}c): ellipses. The − sign flips which axis rules.
    </Note>

    <H2>Completing the Square</H2>
    <P>Real equations aren't always in standard form. Completing the square reveals the center/vertex and transforms messy equations to recognizable form:</P>
    <Eq block>{`4x² − 8x + y² + z² = 5

Complete the square in x:
4(x²−2x) + y² + z² = 5
4(x−1)² − 4 + y² + z² = 5
4(x−1)² + y² + z² = 9

→ Ellipsoid centered at (1, 0, 0) with semi-axes 3/2, 3, 3`}</Eq>

    <H3>Interactive Quadric Gallery</H3>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
      {Object.entries(QUADRICS).map(([k, v]) => (
        <Btn key={k} active={qt === k} onClick={() => setQt(k)} color={C.purple}>{v.label}</Btn>
      ))}
    </div>
    <Note color={C.purple}><Em c={C.gold}>{QUADRICS[qt].eq}</Em>{"\n"}{QUADRICS[qt].desc}</Note>
    {qt !== "hypParaboloid" && (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 8 }}>
        <Slider label="a" value={a2} min={0.3} max={3} step={0.05} onChange={setA2} />
        <Slider label="b" value={b2} min={0.3} max={3} step={0.05} onChange={setB2} />
        <Slider label="c" value={c2} min={0.3} max={3} step={0.05} onChange={setC2} />
      </div>
    )}
    <PlotBox id={pid} h={470} />

    <Quiz q="Which quadric surface does x²/4 + y²/9 − z²/1 = 1 describe?"
      opts={["Ellipsoid","Elliptic cone","Hyperboloid of one sheet","Hyperboloid of two sheets"]} ans={2}
      exp="The equation has the form x²/a² + y²/b² − z²/c² = 1 (positive right-hand side, mixed signs on the left). This is the hyperboloid of ONE sheet — a connected surface with a waist. If the RHS were −1, it'd be two sheets. If = 0, it'd be a cone." />
  </div>;
}

// ─────────────────────────────────────────────────────────────
// PAGE 2C — LIMITS & CONTINUITY IN 2D
// ─────────────────────────────────────────────────────────────
function Limits2DPage() {
  const pid = "plim";
  const [fnType, setFnType] = useState("xy_over_r2");
  const [pathAngle, setPathAngle] = useState(0.5);

  const FNS = {
    xy_over_r2: {
      label: "f = xy/(x²+y²)",
      f: (x, y) => {
        const r2 = x * x + y * y;
        if (r2 < 1e-8) return 0;
        return (x * y) / r2;
      },
      limitExists: false,
      desc: "Limit as (x,y)→(0,0) does NOT exist — along y=x: limit=1/2, along y=0: limit=0.",
    },
    x2y_over_r4: {
      label: "f = x²y/(x⁴+y²)",
      f: (x, y) => {
        const d = x * x * x * x + y * y;
        if (d < 1e-12) return 0;
        return (x * x * y) / d;
      },
      limitExists: false,
      desc: "Two-path test fails: along y=0 limit=0, but along y=x²: f=x⁴/(2x⁴)=1/2. Limit DNE.",
    },
    smooth: {
      label: "f = (x²−y²)/(x²+y²+1)",
      f: (x, y) => (x * x - y * y) / (x * x + y * y + 1),
      limitExists: true,
      desc: "Limit everywhere exists (denominator never zero). f is continuous on all of ℝ².",
    },
    removable: {
      label: "f = sin(x²+y²)/(x²+y²)",
      f: (x, y) => {
        const r2 = x * x + y * y;
        if (r2 < 1e-8) return 1;
        return Math.sin(r2) / r2;
      },
      limitExists: true,
      desc: "Like sinc: limit at origin = 1 (using squeeze theorem). Removable discontinuity if we define f(0,0)=1.",
    }
  };

  useEffect(() => {
    const fn = FNS[fnType];
    const xs = Array.from({ length: 60 }, (_, i) => -2 + 4 * i / 59);
    const zvals = xs.map(y => xs.map(x => {
      const v = fn.f(x, y);
      return isFinite(v) ? Math.max(-3, Math.min(3, v)) : 0;
    }));

    const surf = {
      type: "surface", x: xs, y: xs, z: zvals,
      colorscale: [[0, "#0D2040"], [0.35, "#003388"], [0.5, "#0077BB"], [0.65, "#00AACC"], [1, "#F5E060"]],
      showscale: false, opacity: 0.8
    };

    // Path through origin
    const angle = pathAngle;
    const ts = Array.from({ length: 80 }, (_, i) => -2 + 4 * i / 79);
    const pathX = ts.map(t => t * Math.cos(angle));
    const pathY = ts.map(t => t * Math.sin(angle));
    const pathZ = ts.map((t, i) => {
      const v = fn.f(pathX[i], pathY[i]);
      return isFinite(v) ? Math.max(-3, Math.min(3, v)) : 0;
    });
    const pathTrace = {
      type: "scatter3d", x: pathX, y: pathY, z: pathZ,
      mode: "lines", line: { color: C.red, width: 5 }, name: "Approach path"
    };

    const limitVal = pathZ[40]; // near origin
    const originPt = {
      type: "scatter3d", x: [0], y: [0], z: [limitVal],
      mode: "markers", marker: { color: C.red, size: 10 }, name: `f → ${limitVal.toFixed(4)}`
    };

    Plotly.react(pid, [surf, pathTrace, originPt], pLayout({
      scene: { camera: { eye: { x: 1.8, y: 1.8, z: 1.4 } }, aspectmode: "cube" },
      showlegend: true, legend: { bgcolor: "rgba(0,0,0,0)", font: { color: C.text, size: 11 } }
    }), pCfg);
  }, [fnType, pathAngle]);

  const fn = FNS[fnType];
  const angle = pathAngle;
  const limitVal = fn.f(0.001 * Math.cos(angle), 0.001 * Math.sin(angle));

  return <div>
    <H1>Limits & Continuity in 2D</H1>
    <P>Limits in two variables are vastly more subtle than in one dimension. In 1D, there are only two directions to approach a point (left and right). In 2D, there are <Em c={C.red}>infinitely many</Em> approach paths — and the limit must be the same along every single one of them.</P>

    <H2>The Formal Definition</H2>
    <Eq block>{`lim_{(x,y)→(a,b)} f(x,y) = L

means: for every ε > 0 there exists δ > 0 such that
  if 0 < √((x−a)²+(y−b)²) < δ   then   |f(x,y) − L| < ε`}</Eq>
    <P>The 2D distance <Eq>√((x−a)²+(y−b)²)</Eq> replaces the 1D absolute value |x−a|. The limit L must be approached from <Em>all possible paths</Em> — straight lines at any angle, parabolas, spirals, everything.</P>

    <H2>Proving a Limit Exists: The Squeeze Theorem</H2>
    <P>If you can trap f between two functions that both → L, then f → L too:</P>
    <Eq block>{`If g(x,y) ≤ f(x,y) ≤ h(x,y) near (a,b),
and lim g = lim h = L,
then lim f = L.

Classic tool: use  |f(x,y)| ≤ (some expression in r = √(x²+y²))
and show the bounding expression → 0 as r → 0.`}</Eq>
    <Note color={C.cyan} title="Example: Squeeze Theorem">
      {`Show lim_{(x,y)→0} (x²y)/(x²+y²) = 0.

Note |y| ≤ √(x²+y²) = r, so:
|x²y/(x²+y²)| ≤ x²·r/(x²+y²) ≤ r²·r/r² = r → 0.

Squeezed between −r and r, both → 0. ✓`}
    </Note>

    <H2>Proving a Limit Does NOT Exist: Two-Path Test</H2>
    <P>To show a limit doesn't exist, find <Em c={C.red}>two paths</Em> giving different limiting values. You only need to show one pair!</P>
    <Eq block>{`If lim along path₁ = L₁   and   lim along path₂ = L₂
and L₁ ≠ L₂  →  the limit does not exist.`}</Eq>
    <Note color={C.red} title="The y = mx trap">
      {`f = xy/(x²+y²). Approach along y = mx:
  f = x·mx/(x²+m²x²) = mx²/((1+m²)x²) = m/(1+m²)

This changes with m! Along y=0: limit=0. Along y=x: limit=1/2.
Since different paths give different values, the limit DNE at (0,0).`}
    </Note>
    <Note color={C.gold} title="The parabola path trick">
      {`Some functions pass the y=mx test but still have no limit.
f = x²y/(x⁴+y²). Along any line y=mx: f = mx³/(x⁴+m²x²) → 0.
But along the PARABOLA y = x²:
  f = x²·x²/(x⁴+x⁴) = x⁴/(2x⁴) = 1/2 ≠ 0.
Always check parabolic paths when linear paths seem to work!`}
    </Note>

    <H2>Continuity</H2>
    <P>f is <Em>continuous at (a,b)</Em> if three conditions hold simultaneously:</P>
    <Eq block>{`1. f(a,b) is defined
2. lim_{(x,y)→(a,b)} f(x,y) exists
3. lim_{(x,y)→(a,b)} f(x,y) = f(a,b)`}</Eq>
    <P>Polynomials are always continuous. Rational functions are continuous wherever the denominator is nonzero. Compositions of continuous functions are continuous.</P>
    <Note color={C.purple} title="Continuity Algebra">
      {`If f and g are continuous at (a,b), then so are:
  f + g,   f − g,   f·g,   f/g (if g(a,b) ≠ 0),   |f|

And for composite: if f is continuous at (a,b) and h is
continuous at f(a,b), then h∘f is continuous at (a,b).

This means sin(xy), e^(x²+y²), ln(x+y) (where x+y>0)
are all automatically continuous on their domains.`}
    </Note>

    <H3>Interactive: Approach Paths & Limit Behavior</H3>
    <P>Choose a function and rotate the approach path angle. Watch how the <Em c={C.red}>red curve</Em> slides along the surface — for functions with no limit, the height at the origin changes as you rotate!</P>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
      {Object.entries(FNS).map(([k, v]) => (
        <Btn key={k} active={fnType === k} onClick={() => setFnType(k)} color={C.cyan}>{v.label}</Btn>
      ))}
    </div>
    <Note color={fn.limitExists ? C.green : C.red}>
      {fn.limitExists ? "✓ Limit EXISTS" : "✗ Limit DOES NOT EXIST"}{"\n"}{fn.desc}
    </Note>
    <Slider label="Path angle θ" value={pathAngle} min={0} max={Math.PI} step={0.02} onChange={setPathAngle} />
    <Note color={C.red}>
      Approaching (0,0) along angle {(pathAngle * 180 / Math.PI).toFixed(1)}°: f → {isFinite(limitVal) ? limitVal.toFixed(5) : "undefined"}
    </Note>
    <PlotBox id={pid} h={460} />

    <Quiz q="To show lim_{(x,y)→(0,0)} x²/(x²+y²) does not exist, the best approach is..."
      opts={["Set x=0, get limit 0. Done.","Compare y=0 (limit 1) vs x=0 (limit 0) — two paths, different values","Use squeeze theorem with x²≤x²+y²","Apply L'Hôpital's rule"]} ans={1}
      exp="Along y=0: f = x²/x² = 1. Along x=0: f = 0/y² = 0. Two different paths give limits 1 and 0. Since 1≠0, the limit does not exist. The two-path test is the cleanest approach here." />
  </div>;
}

// ─────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────
const PAGES = {
  vectors:VectorsPage, lines3d:Lines3DPage, curves:CurvesPage,
  surfaces:SurfacesPage, levelcurves:LevelCurvesPage, quadrics:QuadricsPage, limits2d:Limits2DPage,
  partial:PartialPage, gradient:GradientPage, optimize:OptimizePage,
  double:DoubleIntPage, triple:TripleIntPage, vecfields:VecFieldsPage,
  lineint:LineIntPage, theorems:TheoremsPage,
};

export default function App() {
  const [active,setActive]=useState("vectors");
  const idx=TOPICS.findIndex(t=>t.id===active);
  const Page=PAGES[active];

  return <>
    <style>{FONTS}</style>
    <div style={{display:"flex",background:C.bg,minHeight:"100vh",color:C.text}}>

      {/* ── Sidebar ── */}
      <aside style={{
        width:264, background:C.surface, borderRight:`1px solid ${C.border}`,
        flexShrink:0, display:"flex", flexDirection:"column",
        position:"sticky", top:0, height:"100vh", overflowY:"auto",
      }}>
        {/* Header */}
        <div style={{padding:"24px 20px 18px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.muted,
            letterSpacing:2.5,marginBottom:6,textTransform:"uppercase"}}>
            Full Course
          </div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:19,fontWeight:700,
            color:C.white,lineHeight:1.3}}>
            Multivariable{"\n"}Calculus
          </div>
          <div style={{marginTop:14,height:3,
            background:`linear-gradient(90deg,${C.cyan},${C.purple})`,borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",background:C.surface,
              marginLeft:`${(idx+1)/TOPICS.length*100}%`,transition:"margin 0.3s"}}/>
          </div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:C.muted,marginTop:5}}>
            {idx+1} / {TOPICS.length}
          </div>
        </div>

        {/* Nav */}
        <nav style={{padding:"8px 0",flex:1}}>
          {(() => {
            let lastGroup = null;
            return TOPICS.map((t,i)=>{
              const isActive=active===t.id;
              const groupHeader = t.group && t.group !== lastGroup ? (
                <div key={`g-${t.group}`} style={{
                  fontFamily:"'JetBrains Mono',monospace", fontSize:9.5,
                  color:C.muted, letterSpacing:2, textTransform:"uppercase",
                  padding:"12px 20px 4px", borderTop: i>0?`1px solid rgba(255,255,255,0.05)`:"none",
                }}>
                  {t.group}
                </div>
              ) : null;
              lastGroup = t.group;
              return [
                groupHeader,
                <button key={t.id} onClick={()=>setActive(t.id)} style={{
                  display:"flex", alignItems:"center", gap:11,
                  width:"100%", padding:"9px 20px",
                  background:isActive?"rgba(0,200,255,0.07)":"transparent",
                  borderLeft:`3px solid ${isActive?t.color:"transparent"}`,
                  border:"none", borderRight:"none", borderTop:"none", borderBottom:"none",
                  color:isActive?C.white:C.muted,
                  cursor:"pointer", textAlign:"left", transition:"all 0.15s",
                  fontFamily:isActive?"'Lora',serif":"'JetBrains Mono',monospace",
                  fontSize:isActive?13.5:11,
                }}>
                  <span style={{fontSize:13,width:22,textAlign:"center",flexShrink:0}}>{t.icon}</span>
                  <span style={{lineHeight:1.3}}>{t.label}</span>
                </button>
              ];
            });
          })()}
        </nav>

        {/* Footer */}
        <div style={{padding:"14px 20px",borderTop:`1px solid ${C.border}`,
          fontFamily:"'JetBrains Mono',monospace",fontSize:10.5,color:C.muted,lineHeight:1.6}}>
          ∇ · ∂ · ∬ · ∮ · ∇×<br/>
          Interactive Calculus
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{flex:1,overflowY:"auto",padding:"48px 52px 80px",maxWidth:880}}>
        {/* Topic badge */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:C.muted,
            background:"rgba(255,255,255,0.04)",border:`1px solid ${C.border}`,
            borderRadius:5,padding:"3px 10px",letterSpacing:1.5,textTransform:"uppercase"}}>
            Chapter {String(idx+1).padStart(2,"0")}
          </span>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,
            color:TOPICS[idx].color}}>
            {TOPICS[idx].icon}  {TOPICS[idx].label}
          </span>
        </div>

        <Page/>

        {/* Navigation */}
        <div style={{marginTop:52,paddingTop:28,borderTop:`1px solid ${C.border}`,
          display:"flex",gap:12,justifyContent:"space-between",alignItems:"center"}}>
          {idx>0?(
            <button onClick={()=>setActive(TOPICS[idx-1].id)} style={{
              padding:"12px 22px",background:"rgba(255,255,255,0.04)",
              border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,
              fontFamily:"'JetBrains Mono',monospace",fontSize:12,cursor:"pointer"}}>
              ← {TOPICS[idx-1].label}
            </button>
          ):<div/>}
          {idx<TOPICS.length-1?(
            <button onClick={()=>setActive(TOPICS[idx+1].id)} style={{
              padding:"12px 22px",
              background:`linear-gradient(135deg,rgba(0,200,255,0.12),rgba(155,143,255,0.12))`,
              border:`1px solid ${C.cyan}`,borderRadius:8,color:C.cyan,
              fontFamily:"'JetBrains Mono',monospace",fontSize:12,cursor:"pointer",letterSpacing:0.5}}>
              {TOPICS[idx+1].label} →
            </button>
          ):(
            <div style={{padding:"12px 20px",background:"rgba(0,255,153,0.07)",
              border:`1px solid ${C.green}`,borderRadius:8,color:C.green,
              fontFamily:"'JetBrains Mono',monospace",fontSize:12}}>
              🎓 Course Complete!
            </div>
          )}
        </div>
      </main>
    </div>
  </>;
}
