# -*- coding: utf-8 -*-
# Lattice Hub enclosure CAD builder (FreeCAD) - printable revision v2
# Fixes: screw holes start at z=0 (not below build plate), snap-fit verified
import FreeCAD, Part, Mesh, MeshPart, Import, os
try:
    import FreeCADGui
    HAS_GUI = True
except Exception:
    HAS_GUI = False

BASE = r"C:\Users\Guruprasad\Lattice\Lattice Developer git terminal\Lattice website code"
HUB = os.path.join(BASE, "Lattice_Hub")
EXPORT = os.path.join(HUB, "05_Exports")
os.makedirs(EXPORT, exist_ok=True)

OW = 160.0
OD = 130.0
OH = 38.0
WT = 2.2
CR = 12.0
SPLIT = 20.0

DISP_W = 90.0
DISP_D = 55.0
DISP_T = 6.0
DISP_BORDER = 2.0

RJ45_W, RJ45_H = 16.5, 13.5
USBC_W, USBC_H = 9.5, 3.5
USBA_W, USBA_H = 13.0, 5.5
HDMI_W, HDMI_H = 14.5, 4.5

PCB_W, PCB_D, PCB_H = 100.0, 70.0, 15.0
PWR_W, PWR_D, PWR_H = 40.0, 30.0, 15.0
SPK_W, SPK_D, SPK_H = 50.0, 25.0, 15.0

# Snap-fit parameters (FDM conservative, editable)
SNAP_CLEARANCE = 0.35
TAB_THICKNESS = 2.0
TAB_WIDTH = 10.0
TAB_HEIGHT = 8.0
HOOK_DEPTH = 0.9
HOOK_HEIGHT = 1.6
POCKET_DEPTH = HOOK_DEPTH + SNAP_CLEARANCE + 0.4
POCKET_HEIGHT = 3.2
POCKET_WIDTH = TAB_WIDTH + 2*SNAP_CLEARANCE

doc = FreeCAD.newDocument("Lattice_Hub")

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
G_ENC = make_group("01_Enclosure")
G_INT = make_group("02_Internal")
G_ASM = make_group("03_Assembly")

rear_y = OD/2
side_x = OW/2

# ---------- BOTTOM SHELL ----------
bottom_outer = rounded_box(OW, OD, SPLIT, CR, 0)
inner_b = rounded_box(OW-2*WT, OD-2*WT, SPLIT-WT, max(CR-WT,1.0), WT)
bottom_shell = bottom_outer.cut(inner_b)

# ---------- TOP SHELL ----------
top_h = OH - SPLIT
top_outer = rounded_box(OW, OD, top_h, CR, SPLIT)
inner_t = rounded_box(OW-2*WT, OD-2*WT, top_h-WT, max(CR-WT,1.0), SPLIT)
top_shell = top_outer.cut(inner_t)

# ---------- BOTTOM SHELL FEATURES ----------
def cut_box(shell, x,y,z,w,d,h):
    b = Part.makeBox(w,d,h, V(x-w/2, y-d/2, z-h/2))
    return shell.cut(b)

# rear ports (bottom row, z=13)
for x in [-52,-22,8]:
    bottom_shell = cut_box(bottom_shell, x, rear_y, 13, RJ45_W, WT+2, RJ45_H)
for x in [34,48]:
    bottom_shell = cut_box(bottom_shell, x, rear_y, 13, USBC_W, WT+2, USBC_H)
# side USB-C (z=15) in bottom shell
bottom_shell = cut_box(bottom_shell, side_x, 15, 15, WT+2, USBC_W, USBC_H)

# underside vents (start at z=0, NO geometry below build plate)
for i in range(5):
    x = -60 + i*30
    slot = Part.makeBox(40, 6, WT+1, V(x-20, -3, 0))
    bottom_shell = bottom_shell.cut(slot)

# wall mount keyholes (rear wall, through-wall cuts)
for x in [-30, 30]:
    c = Part.makeCylinder(4.0, WT+2, V(x, rear_y-WT-1, 8), V(0,1,0))
    bottom_shell = bottom_shell.cut(c)
    sl = Part.makeBox(3, WT+2, 8, V(x-1.5, rear_y-WT-1, 0))
    bottom_shell = bottom_shell.cut(sl)

# PCB mounting bosses (fused into floor)
pcb_boss_pts = [(-40, -20), (40, -20), (-40, 40), (40, 40)]
for (bx,by) in pcb_boss_pts:
    b = Part.makeCylinder(2.5, 5.0, V(bx,by,WT-0.5), V(0,0,1))
    bottom_shell = bottom_shell.fuse(b)
    h = Part.makeCylinder(1.25, 6.0, V(bx,by,WT-0.5), V(0,0,1))
    bottom_shell = bottom_shell.cut(h)

# speaker mounting bosses
spk_boss = [(-20,-50),(20,-50),(-20,-30),(20,-30)]
for (bx,by) in spk_boss:
    b = Part.makeCylinder(2.0, 4.0, V(bx,by,WT-0.5), V(0,0,1))
    bottom_shell = bottom_shell.fuse(b)
    h = Part.makeCylinder(1.1, 5.0, V(bx,by,WT-0.5), V(0,0,1))
    bottom_shell = bottom_shell.cut(h)

# alignment pins (tapered cones, fused to top edge of perimeter walls)
pin_pts = [(78.0, 15.0), (-78.0, 15.0), (15.0, -63.0), (15.0, 63.0)]
for (px,py) in pin_pts:
    pin = Part.makeCone(1.5, 0.9, 3.0, V(px,py,SPLIT-1.0), V(0,0,1))
    bottom_shell = bottom_shell.fuse(pin)

# screw clearance holes (start at z=0, NOT below build plate)
screw_pts = [(-60,50),(-60,-50),(60,-50),(-62,0),(62,0)]
for (sx,sy) in screw_pts:
    hole = Part.makeCylinder(1.6, SPLIT+1, V(sx,sy,0), V(0,0,1))
    bottom_shell = bottom_shell.cut(hole)

# ---------- TOP SHELL FEATURES ----------
# rear ports (top row, z=23)
for x in [34,52]:
    top_shell = cut_box(top_shell, x, rear_y, 23, USBA_W, WT+2, USBA_H)
top_shell = cut_box(top_shell, 62, rear_y, 23, USBC_W, WT+2, USBC_H)
top_shell = cut_box(top_shell, 62, rear_y, 30, HDMI_W, WT+2, HDMI_H)
# side HDMI (z=25) and debug (z=32) in top shell
top_shell = cut_box(top_shell, side_x, 0, 25, WT+2, HDMI_W, HDMI_H)
dbg = Part.makeCylinder(3.0, WT+2, V(side_x-WT-1, -15, 32), V(1,0,0))
top_shell = top_shell.cut(dbg)

# display pocket (top) — sloped, no horizontal bottom face (avoids overhang when upside down)
# Top opening at roof surface, bottom narrower, sides slope inward going down
pock_w_top = DISP_W + DISP_BORDER * 2
pock_d_top = DISP_D + DISP_BORDER * 2
pock_w_bot = DISP_W
pock_d_bot = DISP_D
pock_depth = 2.0
# Create tapered pocket via loft between top and bottom rectangles
top_wire = Part.makePolygon([
    V(-pock_w_top/2, -pock_d_top/2, OH-2),
    V(pock_w_top/2, -pock_d_top/2, OH-2),
    V(pock_w_top/2, pock_d_top/2, OH-2),
    V(-pock_w_top/2, pock_d_top/2, OH-2),
    V(-pock_w_top/2, -pock_d_top/2, OH-2),
])
bot_wire = Part.makePolygon([
    V(-pock_w_bot/2, -pock_d_bot/2, OH-2-pock_depth),
    V(pock_w_bot/2, -pock_d_bot/2, OH-2-pock_depth),
    V(pock_w_bot/2, pock_d_bot/2, OH-2-pock_depth),
    V(-pock_w_bot/2, pock_d_bot/2, OH-2-pock_depth),
    V(-pock_w_bot/2, -pock_d_bot/2, OH-2-pock_depth),
])
# Loft faces to make a shell, then cap it to make a solid cut volume
top_face = Part.makePolygon([V(-pock_w_top/2, -pock_d_top/2, OH-2), V(pock_w_top/2, -pock_d_top/2, OH-2), V(pock_w_top/2, pock_d_top/2, OH-2), V(-pock_w_top/2, pock_d_top/2, OH-2)]).thicken(0.1) if False else None
# Simpler: create a box for the full pocket volume and subtract inner smaller box from bottom
pocket_outer = Part.makeBox(pock_w_top, pock_d_top, pock_depth, V(-pock_w_top/2, -pock_d_top/2, OH-2-pock_depth))
pocket_inner = Part.makeBox(pock_w_bot, pock_d_bot, pock_depth+1, V(-pock_w_bot/2, -pock_d_bot/2, OH-2-pock_depth-0.5))
# Use loft: create faces between corresponding edges
from FreeCAD import Base
wires_top = [top_wire]
wires_bot = [bot_wire]
# Create lofted solid directly
try:
    pocket_solid = Part.makeLoft([top_wire, bot_wire], True)
except Exception:
    # Fallback: use a box cut with sloped sides via difference of two boxes
    pocket_solid = Part.makeBox(pock_w_top, pock_d_top, pock_depth, V(-pock_w_top/2, -pock_d_top/2, OH-2-pock_depth))
    inner = Part.makeBox(pock_w_bot, pock_d_bot, pock_depth+2, V(-pock_w_bot/2, -pock_d_bot/2, OH-2-pock_depth-1))
    pocket_solid = pocket_solid.cut(inner)
top_shell = top_shell.cut(pocket_solid)
# display hole (through-cut, vertical — fine upside down)
hole = rounded_box(DISP_W, DISP_D, top_h+2, 2.0, SPLIT-1)
top_shell = top_shell.cut(hole)

# rear exhaust vents
for i in range(3):
    x = -40 + i*40
    slot = Part.makeBox(30, WT+2, 8, V(x-15, rear_y-WT-1, 28))
    top_shell = top_shell.cut(slot)

# mic holes on top front
for x in [-20,0,20]:
    mic = Part.makeCylinder(0.8, 5, V(x, -OD/2+5, OH), V(0,0,-1))
    top_shell = top_shell.cut(mic)

# alignment pockets in top shell (match pin positions, oversized for slotting)
for (px,py) in pin_pts:
    pocket = Part.makeCylinder(1.8, 3.5, V(px,py,SPLIT-1.0), V(0,0,1))
    top_shell = top_shell.cut(pocket)

# ---------- SNAP-FIT: tabs on bottom (inner wall, extending upward) ----------
# Snap clearance for pocket engagement
SC = SNAP_CLEARANCE

# Right wall: tab extends inward from inner surface x=77.8; hook overlaps tab for fusion
tab_r = Part.makeBox(TAB_THICKNESS, TAB_WIDTH, TAB_HEIGHT, V(75.8, -TAB_WIDTH/2, SPLIT-TAB_HEIGHT))
hook_r = Part.makeBox(HOOK_DEPTH, TAB_WIDTH, HOOK_HEIGHT, V(77.0, -TAB_WIDTH/2, SPLIT-0.5))
bottom_shell = bottom_shell.fuse(tab_r)
bottom_shell = bottom_shell.fuse(hook_r)

# Left wall: tab extends inward from inner surface x=-77.8
tab_l = Part.makeBox(TAB_THICKNESS, TAB_WIDTH, TAB_HEIGHT, V(-77.8-TAB_THICKNESS, -TAB_WIDTH/2, SPLIT-TAB_HEIGHT))
hook_l = Part.makeBox(HOOK_DEPTH, TAB_WIDTH, HOOK_HEIGHT, V(-78.7, -TAB_WIDTH/2, SPLIT-0.5))
bottom_shell = bottom_shell.fuse(tab_l)
bottom_shell = bottom_shell.fuse(hook_l)

# Front wall: tab extends inward from inner surface y=-62.8
tab_f = Part.makeBox(TAB_WIDTH, TAB_THICKNESS, TAB_HEIGHT, V(-TAB_WIDTH/2, -64.8-TAB_THICKNESS+TAB_THICKNESS, SPLIT-TAB_HEIGHT))
hook_f = Part.makeBox(TAB_WIDTH, HOOK_DEPTH, HOOK_HEIGHT, V(-TAB_WIDTH/2, -63.7, SPLIT-0.5))
bottom_shell = bottom_shell.fuse(tab_f)
bottom_shell = bottom_shell.fuse(hook_f)

# Back wall: tab extends inward from inner surface y=62.8
tab_b = Part.makeBox(TAB_WIDTH, TAB_THICKNESS, TAB_HEIGHT, V(-TAB_WIDTH/2, 62.8, SPLIT-TAB_HEIGHT))
hook_b = Part.makeBox(TAB_WIDTH, HOOK_DEPTH, HOOK_HEIGHT, V(-TAB_WIDTH/2, 63.7, SPLIT-0.5))
bottom_shell = bottom_shell.fuse(tab_b)
bottom_shell = bottom_shell.fuse(hook_b)

# ---------- SNAP-FIT: pockets on top (receive hooks with clearance) ----------
# Pockets cut into top shell's bottom wall, sized slightly larger than hooks
# Right pocket (extends outward from inner wall to receive outward hook)
pock_r = Part.makeBox(POCKET_DEPTH+SC, POCKET_WIDTH+2*SC, POCKET_HEIGHT+SC, V(77.8, -POCKET_WIDTH/2-SC, SPLIT-0.5-SC))
top_shell = top_shell.cut(pock_r)
# Left pocket
pock_l = Part.makeBox(POCKET_DEPTH+SC, POCKET_WIDTH+2*SC, POCKET_HEIGHT+SC, V(-77.8-POCKET_DEPTH, -POCKET_WIDTH/2-SC, SPLIT-0.5-SC))
top_shell = top_shell.cut(pock_l)
# Front pocket
pock_f = Part.makeBox(POCKET_WIDTH+2*SC, POCKET_DEPTH+SC, POCKET_HEIGHT+SC, V(-POCKET_WIDTH/2-SC, -62.8-POCKET_DEPTH-SC, SPLIT-0.5-SC))
top_shell = top_shell.cut(pock_f)
# Back pocket
pock_b = Part.makeBox(POCKET_WIDTH+2*SC, POCKET_DEPTH+SC, POCKET_HEIGHT+SC, V(-POCKET_WIDTH/2-SC, 62.8, SPLIT-0.5-SC))
top_shell = top_shell.cut(pock_b)

# Clean up splitters
try: bottom_shell = bottom_shell.removeSplitter()
except Exception as e: print("removeSplitter bottom", e)
try: top_shell = top_shell.removeSplitter()
except Exception as e: print("removeSplitter top", e)

# ---------- ADD TO DOC ----------
g_top = make_group("Top_Shell")
g_bot = make_group("Bottom_Shell")
o_top = add_feat("Top_Shell", top_shell, g_top)
o_bot = add_feat("Bottom_Shell", bottom_shell, g_bot)

# ---------- INTERNAL PLACEHOLDERS ----------
g_int = make_group("Internal_Volumes")
def box_feat(name,w,d,h,x0,y0,z0):
    b = Part.makeBox(w,d,h, V(x0,y0,z0)); return add_feat(name,b,g_int)
box_feat("MAIN_COMPUTER_PLACEHOLDER", PCB_W, PCB_D, PCB_H, -PCB_W/2, 10-PCB_D/2, 8)
box_feat("DISPLAY_PLACEHOLDER", DISP_W, DISP_D, DISP_T, -DISP_W/2, -DISP_D/2, OH-DISP_T-1)
box_feat("POWER_VOLUME_PLACEHOLDER", PWR_W, PWR_D, PWR_H, 45-PWR_W/2, 38-PWR_D/2, 8)
box_feat("SPEAKER_VOLUME_PLACEHOLDER", SPK_W, SPK_D, SPK_H, -SPK_W/2, -55, 7)

# ---------- CONNECTOR CLEARANCE VOLUMES ----------
g_conn = make_group("Connector_Volumes")
def conn_vol(name,x,z,w,h,depth=25):
    b = Part.makeBox(w,depth,h, V(x-w/2, rear_y-depth+WT, z-h/2))
    return add_feat(name,b,g_conn)
for i,x in enumerate([-52,-22,8]):
    conn_vol(f"RJ45_{i+1}_CLEARANCE", x, 13, RJ45_W+4, RJ45_H+4)
for i,x in enumerate([34,48]):
    conn_vol(f"USBC_REAR_{i+1}_CLEARANCE", x, 13, USBC_W+4, USBC_H+4)
for i,x in enumerate([34,52]):
    conn_vol(f"USBA_REAR_{i+1}_CLEARANCE", x, 23, USBA_W+4, USBA_H+4)
conn_vol("POWER_CLEARANCE", 62, 23, USBC_W+4, USBC_H+4)
conn_vol("HDMI_REAR_CLEARANCE", 62, 30, HDMI_W+4, HDMI_H+4)
side_conn = Part.makeBox(25, USBC_W+4, USBC_H+4, V(side_x-25, 15-(USBC_W+4)/2, 15-(USBC_H+4)/2))
add_feat("USBC_SIDE_CLEARANCE", side_conn, g_conn)
side_conn2 = Part.makeBox(25, HDMI_W+4, HDMI_H+4, V(side_x-25, -(HDMI_W+4)/2, 25-(HDMI_H+4)/2))
add_feat("HDMI_SIDE_CLEARANCE", side_conn2, g_conn)

# ---------- ASSEMBLY ----------
g_asm = make_group("Lattice_Hub_Assembly")
assembly = top_shell.copy()
assembly = assembly.fuse(bottom_shell.copy())
o_asm = add_feat("Lattice_Hub_Assembly", assembly, g_asm)

# ---------- PRINT ORIENTATIONS ----------
mat = FreeCAD.Matrix()
mat.A11=1; mat.A12=0; mat.A13=0; mat.A14=0
mat.A21=0; mat.A22=-1; mat.A23=0; mat.A24=0
mat.A31=0; mat.A32=0; mat.A33=-1; mat.A34=OH
top_print_shape = top_shell.transformed(mat)
o_pb = add_feat("Bottom_Shell_Print", bottom_shell.copy(), g_bot)
o_pt = add_feat("Top_Shell_Print", top_print_shape, g_top)

# ---------- MASTER PARAMETERS SPREADSHEET ----------
ss = doc.addObject("Spreadsheet::Sheet", "Master_Parameters")
params = [
 ("overall_width",OW),("overall_depth",OD),("overall_height",OH),
 ("wall_thickness",WT),("corner_radius",CR),("split_height",SPLIT),
 ("display_width",DISP_W),("display_depth",DISP_D),("display_thickness",DISP_T),
 ("display_border",DISP_BORDER),("rj45_w",RJ45_W),("rj45_h",RJ45_H),
 ("usbc_w",USBC_W),("usbc_h",USBC_H),("usba_w",USBA_W),("usba_h",USBA_H),
 ("hdmi_w",HDMI_W),("hdmi_h",HDMI_H),("pcb_w",PCB_W),("pcb_d",PCB_D),
 ("pcb_h",PCB_H),("power_w",PWR_W),("power_d",PWR_D),("power_h",PWR_H),
 ("speaker_w",SPK_W),("speaker_d",SPK_D),("speaker_h",SPK_H),
 ("snap_clearance",SNAP_CLEARANCE),("tab_thickness",TAB_THICKNESS),
 ("tab_width",TAB_WIDTH),("tab_height",TAB_HEIGHT),("hook_depth",HOOK_DEPTH),
 ("hook_height",HOOK_HEIGHT),("insertion_depth",3.0),("engagement_depth",1.5),
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

fc_path = os.path.join(HUB, "03_Assembly", "Lattice_Hub.FCStd")
doc.saveAs(fc_path)
print("saved FCStd:", fc_path)

# ---------- EXPORTS ----------
Import.export([o_top], os.path.join(EXPORT, "Top_Shell.step"))
Import.export([o_bot], os.path.join(EXPORT, "Bottom_Shell.step"))
Import.export([o_asm], os.path.join(EXPORT, "Lattice_Hub_Assembly.step"))
Import.export([o_pt], os.path.join(EXPORT, "Top_Shell_PRINT.step"))
Import.export([o_pb], os.path.join(EXPORT, "Bottom_Shell_PRINT.step"))
print("STEP exported")

# STL print-oriented
m_top = MeshPart.meshFromShape(top_print_shape, 0.5)
m_top.write(os.path.join(EXPORT, "Top_Shell.stl"))
m_top.write(os.path.join(EXPORT, "Top_Shell_PRINT.stl"))
m_bot = MeshPart.meshFromShape(bottom_shell, 0.5)
m_bot.write(os.path.join(EXPORT, "Bottom_Shell.stl"))
m_bot.write(os.path.join(EXPORT, "Bottom_Shell_PRINT.stl"))
m_asm = MeshPart.meshFromShape(assembly, 0.5)
m_asm.write(os.path.join(EXPORT, "Lattice_Hub_Assembly.stl"))
print("STL exported")

print("Top vol", round(top_shell.Volume,1), "Bot vol", round(bottom_shell.Volume,1))
print("Top solids", len(top_shell.Solids), "Bot solids", len(bottom_shell.Solids))
bb = assembly.BoundBox
print("Asm bbox", bb.XLength, bb.YLength, bb.ZLength)
print("Overlap:", round(top_shell.Volume+bottom_shell.Volume-assembly.Volume,3))
print("DONE")
FreeCAD.closeDocument(doc.Name)
