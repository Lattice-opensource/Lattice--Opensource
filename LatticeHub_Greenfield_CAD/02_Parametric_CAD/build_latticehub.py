# -*- coding: utf-8 -*-
# Lattice Hub GREENFIELD enclosure CAD builder (FreeCAD) - R001
# New build from scratch. No inheritance from previous enclosure solids.
import FreeCAD, Part, Mesh, MeshPart, Import, os
try:
    import FreeCADGui
    HAS_GUI = True
except Exception:
    HAS_GUI = False

ROOT = r"C:\Users\Guruprasad\Lattice\Lattice Developer git terminal\Lattice website code\LatticeHub_Greenfield_CAD"
EXPORT_STL = os.path.join(ROOT, "05_STL_Exports")
EXPORT_STEP = os.path.join(ROOT, "06_STEP_Exports")
CAD_DIR = os.path.join(ROOT, "02_Parametric_CAD")
os.makedirs(EXPORT_STL, exist_ok=True)
os.makedirs(EXPORT_STEP, exist_ok=True)
os.makedirs(CAD_DIR, exist_ok=True)

# ---------- MASTER PARAMETERS (authoritative) ----------
# Enclosure envelope (derived from component layout, see dimension justification)
OW = 160.0          # overall width
OD = 130.0          # overall depth
OH = 40.0           # overall height (slightly taller for serviceability)
WT = 2.4            # wall thickness
CR = 14.0           # corner radius
SPLIT = 22.0        # split height (bottom shell height)
TOP_H = OH - SPLIT  # top shell height = 18

# Bottom shell
BASE_T = 2.6        # base floor thickness
BOSS_D = 6.0        # mounting boss outer diameter
BOSS_HOLE = 2.6     # M2.5 clearance
BOSS_HEIGHT = 6.0   # standoff height (PCB clearance from floor)

# Raspberry Pi 4 Model B (verified dimensions)
PI_PCB_W = 85.0
PI_PCB_D = 56.0
PI_PCB_T = 1.5
PI_MOUNT = [(3.5,3.5),(81.5,3.5),(3.5,52.5),(81.5,52.5)]  # relative to PCB corner

# Display (provisional - 4" TFT, documented as provisional)
DISP_W = 90.0
DISP_D = 55.0
DISP_T = 6.0
DISP_BORDER = 2.5

# Ports (verified connector envelope placeholders)
RJ45_W, RJ45_H = 16.5, 13.5
USBC_W, USBC_H = 9.5, 3.5
USBA_W, USBA_H = 13.0, 5.5
HDMI_W, HDMI_H = 14.5, 4.5

# Snap-fit (FDM conservative, editable)
SNAP_CLEARANCE = 0.4
TAB_THICK = 2.0
TAB_WIDTH = 12.0
TAB_HEIGHT = 9.0
HOOK_DEPTH = 0.3
HOOK_HEIGHT = 1.8
POCKET_DEPTH = HOOK_DEPTH + SNAP_CLEARANCE + 0.5
POCKET_HEIGHT = 3.5
POCKET_WIDTH = TAB_WIDTH + 2*SNAP_CLEARANCE

# Feet
FOOT_D = 8.0
FOOT_H = 2.0

doc = FreeCAD.newDocument("LatticeHub_Master")

def V(x,y,z): return FreeCAD.Vector(x,y,z)

def rounded_box(w,d,h,r,z0=0,cx=0,cy=0):
    b = Part.makeBox(w,d,h, V(cx-w/2, cy-d/2, z0))
    if r and r>0:
        verts=[e for e in b.Edges if abs(e.Vertexes[0].Z-e.Vertexes[1].Z)>h-1 and abs(e.Vertexes[0].X-e.Vertexes[1].X)<1e-6 and abs(e.Vertexes[0].Y-e.Vertexes[1].Y)<1e-6]
        if verts:
            try: b = b.makeFillet(r, verts)
            except Exception as e: print("fillet fail", e)
    return b

def add_feat(name, shape, group=None):
    o = doc.addObject("Part::Feature", name)
    o.Shape = shape
    if group is not None: group.addObject(o)
    return o

def make_group(name):
    return doc.addObject("App::Part", name)

G_PARAM = make_group("00_Master_Parameters")
G_COMP  = make_group("01_Components")
G_ENC   = make_group("02_Enclosure")
G_ASM   = make_group("03_Assembly")
G_PRINT = make_group("04_Print_Orientations")

rear_y = OD/2
side_x = OW/2

# ---------- COMPONENT: Raspberry Pi 4 (verified envelope) ----------
g_pi = make_group("Component_RaspberryPi4")
pi_pcb = Part.makeBox(PI_PCB_W, PI_PCB_D, PI_PCB_T, V(-PI_PCB_W/2+20, -PI_PCB_D/2, BASE_T+BOSS_HEIGHT))
# mounting bosses at PI_MOUNT (offset so PCB centered-ish at x=20, y=0)
pi_offset_x = 20.0
pi_offset_y = 0.0
pi_bosses = []
for (mx,my) in PI_MOUNT:
    bx = mx - PI_PCB_W/2 + pi_offset_x
    by = my - PI_PCB_D/2 + pi_offset_y
    b = Part.makeCylinder(BOSS_D/2, BOSS_HEIGHT+0.5, V(bx,by,BASE_T-0.5), V(0,0,1))
    h = Part.makeCylinder(BOSS_HOLE/2, BOSS_HEIGHT+2, V(bx,by,BASE_T-1), V(0,0,1))
    b = b.cut(h)
    pi_bosses.append((bx,by,b))
    add_feat(f"PI_BOSS_{int(mx)}_{int(my)}", b, g_pi)

# ---------- BOTTOM SHELL ----------
bottom_outer = rounded_box(OW, OD, SPLIT, CR, 0)
inner_b = rounded_box(OW-2*WT, OD-2*WT, SPLIT-BASE_T, max(CR-WT,1.0), BASE_T)
bottom_shell = bottom_outer.cut(inner_b)

# fuse bosses into bottom shell (overlap for solid merge)
for (bx,by,b) in pi_bosses:
    bottom_shell = bottom_shell.fuse(b)

# feet: removed downward-extending feet so the base floor sits flat on z=0 build plate.
# Internal mounting bosses provide PCB elevation; external feet can be added as separate printable parts later.

# underside vents (slots through base, start at z=0)
for i in range(4):
    x = -45 + i*30
    slot = Part.makeBox(28, 5, BASE_T+1, V(x-14, -2.5, 0))
    bottom_shell = bottom_shell.cut(slot)

# wall mount keyholes (rear)
for x in [-25, 25]:
    c = Part.makeCylinder(3.5, WT+2, V(x, rear_y-WT-1, 10), V(0,1,0))
    bottom_shell = bottom_shell.cut(c)
    sl = Part.makeBox(2.5, WT+2, 7, V(x-1.25, rear_y-WT-1, 3.5))
    bottom_shell = bottom_shell.cut(sl)

# ---------- TOP SHELL ----------
top_outer = rounded_box(OW, OD, TOP_H, CR, SPLIT)
inner_t = rounded_box(OW-2*WT, OD-2*WT, TOP_H-WT, max(CR-WT,1.0), SPLIT)
top_shell = top_outer.cut(inner_t)

# display pocket + opening
pocket = rounded_box(DISP_W+DISP_BORDER*2, DISP_D+DISP_BORDER*2, 2.0, 3.0, OH-2.0)
top_shell = top_shell.cut(pocket)
hole = rounded_box(DISP_W, DISP_D, TOP_H+4, 2.0, SPLIT-1)
top_shell = top_shell.cut(hole)

# rear exhaust vents (top shell, upper region)
for i in range(3):
    x = -30 + i*30
    slot = Part.makeBox(22, WT+2, 6, V(x-11, rear_y-WT-1, OH-5))
    top_shell = top_shell.cut(slot)

# mic holes
for x in [-15,0,15]:
    mic = Part.makeCylinder(0.9, 6, V(x, -OD/2+6, OH), V(0,0,-1))
    top_shell = top_shell.cut(mic)

# ---------- SNAP-FIT + ALIGNMENT ----------
# alignment pins on bottom (tapered cones) at perimeter walls
pin_pts = [(78.0, 0.0), (-78.0, 0.0), (0.0, -63.0), (0.0, 63.0)]
for (px,py) in pin_pts:
    pin = Part.makeCone(1.5, 0.9, 3.0, V(px,py,SPLIT-1.0), V(0,0,1))
    bottom_shell = bottom_shell.fuse(pin)

# alignment pockets in top
for (px,py) in pin_pts:
    pocket = Part.makeCylinder(1.8, 3.5, V(px,py,SPLIT-1.0), V(0,0,1))
    top_shell = top_shell.cut(pocket)

# snap tabs on bottom (on actual walls, away from pins)
# right wall (tab at y=-30): overlap into wall by 1.0mm for solid fusion
tab_r = Part.makeBox(TAB_THICK, TAB_WIDTH, TAB_HEIGHT, V(76.6, -30-TAB_WIDTH/2, SPLIT-TAB_HEIGHT))
hook_r = Part.makeBox(HOOK_DEPTH, TAB_WIDTH, HOOK_HEIGHT, V(77.6, -30-TAB_WIDTH/2, SPLIT))
bottom_shell = bottom_shell.fuse(tab_r); bottom_shell = bottom_shell.fuse(hook_r)
# left wall
tab_l = Part.makeBox(TAB_THICK, TAB_WIDTH, TAB_HEIGHT, V(-78.6, -30-TAB_WIDTH/2, SPLIT-TAB_HEIGHT))
hook_l = Part.makeBox(HOOK_DEPTH, TAB_WIDTH, HOOK_HEIGHT, V(-78.8, -30-TAB_WIDTH/2, SPLIT))
bottom_shell = bottom_shell.fuse(tab_l); bottom_shell = bottom_shell.fuse(hook_l)
# front wall (tab at x=-30): overlap 1.0mm into wall
tab_f = Part.makeBox(TAB_WIDTH, TAB_THICK, TAB_HEIGHT, V(-30-TAB_WIDTH/2, -63.8, SPLIT-TAB_HEIGHT))
hook_f = Part.makeBox(TAB_WIDTH, HOOK_DEPTH, HOOK_HEIGHT, V(-30-TAB_WIDTH/2, -64.1, SPLIT))
bottom_shell = bottom_shell.fuse(tab_f); bottom_shell = bottom_shell.fuse(hook_f)
# back wall (tab at x=-30): overlap 1.0mm into wall
tab_b = Part.makeBox(TAB_WIDTH, TAB_THICK, TAB_HEIGHT, V(-30-TAB_WIDTH/2, 61.8, SPLIT-TAB_HEIGHT))
hook_b = Part.makeBox(TAB_WIDTH, HOOK_DEPTH, HOOK_HEIGHT, V(-30-TAB_WIDTH/2, 62.8, SPLIT))
bottom_shell = bottom_shell.fuse(tab_b); bottom_shell = bottom_shell.fuse(hook_b)

# snap pockets in top (match new tab positions)
pock_r = Part.makeBox(POCKET_DEPTH, POCKET_WIDTH, POCKET_HEIGHT, V(77.6, -30-POCKET_WIDTH/2, SPLIT))
top_shell = top_shell.cut(pock_r)
pock_l = Part.makeBox(POCKET_DEPTH, POCKET_WIDTH, POCKET_HEIGHT, V(-77.6-POCKET_DEPTH, -30-POCKET_WIDTH/2, SPLIT))
top_shell = top_shell.cut(pock_l)
pock_f = Part.makeBox(POCKET_WIDTH, POCKET_DEPTH, POCKET_HEIGHT, V(-30-POCKET_WIDTH/2, -64.2, SPLIT))
top_shell = top_shell.cut(pock_f)
pock_b = Part.makeBox(POCKET_WIDTH, POCKET_DEPTH, POCKET_HEIGHT, V(-30-POCKET_WIDTH/2, 62.8, SPLIT))
top_shell = top_shell.cut(pock_b)

# clean
try: bottom_shell = bottom_shell.removeSplitter()
except: pass
try: top_shell = top_shell.removeSplitter()
except: pass

# ---------- PORTS (rear) ----------
for x in [-52,-22,8]:
    bottom_shell = bottom_shell.cut(Part.makeBox(RJ45_W, WT+2, RJ45_H, V(x-RJ45_W/2, rear_y-WT-1, 11-RJ45_H/2)))
for x in [34,48]:
    bottom_shell = bottom_shell.cut(Part.makeBox(USBC_W, WT+2, USBC_H, V(x-USBC_W/2, rear_y-WT-1, 11-USBC_H/2)))
# side USB-C
bottom_shell = bottom_shell.cut(Part.makeBox(WT+2, USBC_W, USBC_H, V(side_x-WT-1, 15-USBC_W/2, 13-USBC_H/2)))
# top shell rear ports
for x in [34,52]:
    top_shell = top_shell.cut(Part.makeBox(USBA_W, WT+2, USBA_H, V(x-USBA_W/2, rear_y-WT-1, 28-USBA_H/2)))
top_shell = top_shell.cut(Part.makeBox(USBC_W, WT+2, USBC_H, V(62-USBC_W/2, rear_y-WT-1, 28-USBC_H/2)))
top_shell = top_shell.cut(Part.makeBox(HDMI_W, WT+2, HDMI_H, V(62-HDMI_W/2, rear_y-WT-1, 33-HDMI_H/2)))
# side HDMI
top_shell = top_shell.cut(Part.makeBox(WT+2, HDMI_W, HDMI_H, V(side_x-WT-1, -HDMI_W/2, 26-HDMI_H/2)))

# ---------- ADD TO DOC ----------
g_top = make_group("Top_Shell")
g_bot = make_group("Bottom_Shell")
o_top = add_feat("Top_Shell", top_shell, g_top)
o_bot = add_feat("Bottom_Shell", bottom_shell, g_bot)

# ---------- INTERNAL PLACEHOLDERS ----------
g_int = make_group("Internal_Volumes")
def box_feat(name,w,d,h,x0,y0,z0):
    b = Part.makeBox(w,d,h, V(x0,y0,z0)); return add_feat(name,b,g_int)
box_feat("PI_PCB_PLACEHOLDER", PI_PCB_W, PI_PCB_D, PI_PCB_T, pi_offset_x-PI_PCB_W/2, pi_offset_y-PI_PCB_D/2, BASE_T+BOSS_HEIGHT)
box_feat("DISPLAY_PLACEHOLDER", DISP_W, DISP_D, DISP_T, -DISP_W/2, -DISP_D/2, OH-DISP_T-1)
box_feat("SPEAKER_PLACEHOLDER", 40, 20, 10, -20, -50, 8)

# ---------- ASSEMBLY ----------
g_asm = make_group("Lattice_Hub_Assembly")
assembly = top_shell.copy(); assembly = assembly.fuse(bottom_shell.copy())
o_asm = add_feat("Lattice_Hub_Assembly", assembly, g_asm)

# ---------- PRINT ORIENTATIONS ----------
# Top: upside down (exterior top on build plate). Transform: (x, -y, OH-z)
mat = FreeCAD.Matrix()
mat.A11=1; mat.A12=0; mat.A13=0; mat.A14=0
mat.A21=0; mat.A22=-1; mat.A23=0; mat.A24=0
mat.A31=0; mat.A32=0; mat.A33=-1; mat.A34=OH
top_print_shape = top_shell.transformed(mat)
# Bottom: as-is
o_top_print = add_feat("Top_Shell_Print", top_print_shape, g_top)
o_bot_print = add_feat("Bottom_Shell_Print", bottom_shell.copy(), g_bot)

# ---------- PARAMETER SHEET ----------
ss = doc.addObject("Spreadsheet::Sheet", "Master_Parameters")
params = [
 ("enclosure_width",OW),("enclosure_depth",OD),("enclosure_height",OH),
 ("wall_thickness",WT),("corner_radius",CR),("split_height",SPLIT),
 ("base_thickness",BASE_T),("top_height",TOP_H),
 ("pi_pcb_width",PI_PCB_W),("pi_pcb_depth",PI_PCB_D),
 ("display_width",DISP_W),("display_depth",DISP_D),
 ("snap_clearance",SNAP_CLEARANCE),("tab_thickness",TAB_THICK),
 ("tab_width",TAB_WIDTH),("tab_height",TAB_HEIGHT),
 ("hook_depth",HOOK_DEPTH),("hook_height",HOOK_HEIGHT),
 ("insertion_depth",3.0),("engagement_depth",2.0),
]
ss.set("A1","Parameter"); ss.set("B1","Value"); ss.set("C1","Unit")
for i,(k,v) in enumerate(params,start=2):
    ss.set(f"A{i}",k); ss.set(f"B{i}",str(v)); ss.set(f"C{i}","mm")
doc.recompute()

if HAS_GUI:
    for o in doc.Objects:
        try: o.ViewObject.Visibility=True
        except: pass
    FreeCADGui.updateGui()

FC_PATH = os.path.join(CAD_DIR, "LatticeHub_Master.FCStd")
doc.saveAs(FC_PATH)
print("saved FCStd:", FC_PATH)

# ---------- EXPORTS ----------
Import.export([o_top], os.path.join(EXPORT_STEP,"LatticeHub_Top_R001.step"))
Import.export([o_bot], os.path.join(EXPORT_STEP,"LatticeHub_Bottom_R001.step"))
Import.export([o_asm], os.path.join(EXPORT_STEP,"LatticeHub_Assembly_R001.step"))
Import.export([o_top_print], os.path.join(EXPORT_STEP,"LatticeHub_Top_Print_R001.step"))
Import.export([o_bot_print], os.path.join(EXPORT_STEP,"LatticeHub_Bottom_Print_R001.step"))
print("STEP exported")

# STL print-ready (default part STLs are print-oriented)
m_top = MeshPart.meshFromShape(top_print_shape, 0.5)
m_top.write(os.path.join(EXPORT_STL,"LatticeHub_Top_R001.stl"))
m_bot = MeshPart.meshFromShape(bottom_shell, 0.5)
m_bot.write(os.path.join(EXPORT_STL,"LatticeHub_Bottom_R001.stl"))
m_asm = MeshPart.meshFromShape(assembly, 0.5)
m_asm.write(os.path.join(EXPORT_STL,"LatticeHub_Assembly_R001.stl"))
print("STL exported")

print("Top vol", round(top_shell.Volume,1), "Bot vol", round(bottom_shell.Volume,1))
print("Top solids", len(top_shell.Solids), "Bot solids", len(bottom_shell.Solids))
print("Asm bbox", assembly.BoundBox.XLength, assembly.BoundBox.YLength, assembly.BoundBox.ZLength)
print("DONE")
FreeCAD.closeDocument(doc.Name)
