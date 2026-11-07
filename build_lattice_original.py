# -*- coding: utf-8 -*-
# Lattice Hub enclosure CAD builder (FreeCAD) - v3 (no clipping slivers)
import FreeCAD, Part, Mesh, MeshPart, Import, os
try:
    import FreeCADGui
    HAS_GUI = True
except Exception:
    HAS_GUI = False

BASE = r"C:\Users\Guruprasad\Lattice\Lattice Developer git terminal\Lattice--Opensource\Lattice_Hub"
EXPORT = os.path.join(BASE, "05_Exports")
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

doc = FreeCAD.newDocument("Lattice_Hub")

def V(x,y,z): return FreeCAD.Vector(x,y,z)

def rounded_box(w,d,h,r,z0=0, cx=0, cy=0):
    b = Part.makeBox(w,d,h, V(cx-w/2, cy-d/2, z0))
    if r and r>0:
        verts=[e for e in b.Edges if abs(e.Vertexes[0].Z-e.Vertexes[1].Z)>h-1 and abs(e.Vertexes[0].X-e.Vertexes[1].X)<1e-6 and abs(e.Vertexes[0].Y-e.Vertexes[1].Y)<1e-6]
        if verts:
            try:
                b = b.makeFillet(r, verts)
            except Exception as e:
                print("fillet fail", e)
    return b

def add_feat(name, shape, group=None):
    o = doc.addObject("Part::Feature", name)
    o.Shape = shape
    if group is not None:
        group.addObject(o)
    return o

def make_group(name):
    g = doc.addObject("App::Part", name)
    return g

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
# bottom-row rear ports (z=13)
def cut_box(shell, x,y,z,w,d,h):
    b = Part.makeBox(w,d,h, V(x-w/2, y-d/2, z-h/2))
    return shell.cut(b)

for x in [-52,-22,8]:
    bottom_shell = cut_box(bottom_shell, x, rear_y, 13, RJ45_W, WT+2, RJ45_H)
for x in [34,48]:
    bottom_shell = cut_box(bottom_shell, x, rear_y, 13, USBC_W, WT+2, USBC_H)
# side USB-C (z=15) in bottom shell
bottom_shell = cut_box(bottom_shell, side_x, 15, 15, WT+2, USBC_W, USBC_H)

# underside vents
for i in range(5):
    x = -60 + i*30
    slot = Part.makeBox(40, 6, WT+1, V(x-20, -3, -0.5))
    bottom_shell = bottom_shell.cut(slot)
# feet recesses
for (fx,fy) in [(-60,-50),(60,-50),(-60,50),(60,50)]:
    foot = Part.makeCylinder(4.0, 0.6, V(fx,fy,-0.6), V(0,0,1))
    bottom_shell = bottom_shell.cut(foot)
# wall mount keyholes
for x in [-30, 30]:
    c = Part.makeCylinder(4.0, WT+2, V(x, rear_y-WT-1, 8), V(0,1,0))
    bottom_shell = bottom_shell.cut(c)
    sl = Part.makeBox(3, WT+2, 8, V(x-1.5, rear_y-WT-1, 0))
    bottom_shell = bottom_shell.cut(sl)

# PCB mounting bosses
pcb_boss_pts = [(-40, -20), (40, -20), (-40, 40), (40, 40)]
for (bx,by) in pcb_boss_pts:
    b = Part.makeCylinder(2.5, 5.0, V(bx,by,WT), V(0,0,1))
    bottom_shell = bottom_shell.fuse(b)
    h = Part.makeCylinder(1.25, 6.0, V(bx,by,WT), V(0,0,1))
    bottom_shell = bottom_shell.cut(h)

# speaker mounting bosses
spk_boss = [(-20,-50),(20,-50),(-20,-30),(20,-30)]
for (bx,by) in spk_boss:
    b = Part.makeCylinder(2.0, 4.0, V(bx,by,WT), V(0,0,1))
    bottom_shell = bottom_shell.fuse(b)
    h = Part.makeCylinder(1.1, 5.0, V(bx,by,WT), V(0,0,1))
    bottom_shell = bottom_shell.cut(h)

# alignment pins
pin_pts = [(0, 58),(0,-58),(58,0),(-58,0)]
for (px,py) in pin_pts:
    pin = Part.makeCylinder(2.0, 3.0, V(px,py,SPLIT), V(0,0,1))
    bottom_shell = bottom_shell.fuse(pin)

# screw clearance holes
screw_pts = [(-60,50),(-60,-50),(60,-50),(-62,0),(62,0)]
for (sx,sy) in screw_pts:
    hole = Part.makeCylinder(1.6, SPLIT+1, V(sx,sy,-0.5), V(0,0,1))
    bottom_shell = bottom_shell.cut(hole)

# ---------- TOP SHELL FEATURES ----------
# top-row rear ports (z=23)
for x in [34,52]:
    top_shell = cut_box(top_shell, x, rear_y, 23, USBA_W, WT+2, USBA_H)
top_shell = cut_box(top_shell, 62, rear_y, 23, USBC_W, WT+2, USBC_H)
top_shell = cut_box(top_shell, 62, rear_y, 30, HDMI_W, WT+2, HDMI_H)
# side HDMI (z=25) and debug (z=32) in top shell
top_shell = cut_box(top_shell, side_x, 0, 25, WT+2, HDMI_W, HDMI_H)
dbg = Part.makeCylinder(3.0, WT+2, V(side_x-WT-1, -15, 32), V(1,0,0))
top_shell = top_shell.cut(dbg)

# display pocket (top) + hole
pocket = rounded_box(DISP_W+DISP_BORDER*2, DISP_D+DISP_BORDER*2, 2.0, 3.0, OH-2.0)
top_shell = top_shell.cut(pocket)
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

# alignment pockets in top shell
for (px,py) in pin_pts:
    pocket = Part.makeCylinder(2.15, 3.5, V(px,py,SPLIT-0.5), V(0,0,1))
    top_shell = top_shell.cut(pocket)

# screw bosses in top shell
for (sx,sy) in screw_pts:
    boss = Part.makeCylinder(3.5, 8.0, V(sx,sy,SPLIT-8.0), V(0,0,1))
    top_shell = top_shell.fuse(boss)
    cavity = Part.makeCylinder(2.3, 5.0, V(sx,sy,SPLIT-8.0), V(0,0,1))
    top_shell = top_shell.cut(cavity)

# ---------- ADD TO DOC ----------
g_top = make_group("Top_Shell")
g_bot = make_group("Bottom_Shell")
o_top = add_feat("Top_Shell", top_shell, g_top)
o_bot = add_feat("Bottom_Shell", bottom_shell, g_bot)

# ---------- INTERNAL PLACEHOLDERS ----------
g_int = make_group("Internal_Volumes")
def box_feat(name, w,d,h, x0,y0,z0):
    b = Part.makeBox(w,d,h, V(x0,y0,z0))
    return add_feat(name, b, g_int)

box_feat("MAIN_COMPUTER_PLACEHOLDER", PCB_W, PCB_D, PCB_H, -PCB_W/2, 10-PCB_D/2, 8)
box_feat("DISPLAY_PLACEHOLDER", DISP_W, DISP_D, DISP_T, -DISP_W/2, -DISP_D/2, OH-DISP_T-1)
box_feat("POWER_VOLUME_PLACEHOLDER", PWR_W, PWR_D, PWR_H, 45-PWR_W/2, 38-PWR_D/2, 8)
box_feat("SPEAKER_VOLUME_PLACEHOLDER", SPK_W, SPK_D, SPK_H, -SPK_W/2, -55, 7)

g_conn = make_group("Connector_Volumes")
def conn_vol(name, x,z, w,h, depth=25):
    b = Part.makeBox(w, depth, h, V(x-w/2, rear_y-depth+WT, z-h/2))
    return add_feat(name, b, g_conn)

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

# ---------- MASTER PARAMETERS SPREADSHEET ----------
ss = doc.addObject("Spreadsheet::Sheet", "Master_Parameters")
params = [
 ("overall_width", OW), ("overall_depth", OD), ("overall_height", OH),
 ("wall_thickness", WT), ("corner_radius", CR), ("split_height", SPLIT),
 ("display_width", DISP_W), ("display_depth", DISP_D), ("display_thickness", DISP_T),
 ("display_border", DISP_BORDER), ("rj45_w", RJ45_W), ("rj45_h", RJ45_H),
 ("usbc_w", USBC_W), ("usbc_h", USBC_H), ("usba_w", USBA_W), ("usba_h", USBA_H),
 ("hdmi_w", HDMI_W), ("hdmi_h", HDMI_H), ("pcb_w", PCB_W), ("pcb_d", PCB_D),
 ("pcb_h", PCB_H), ("power_w", PWR_W), ("power_d", PWR_D), ("power_h", PWR_H),
 ("speaker_w", SPK_W), ("speaker_d", SPK_D), ("speaker_h", SPK_H),
]
ss.set("A1", "Parameter"); ss.set("B1", "Value"); ss.set("C1", "Unit")
for i,(k,v) in enumerate(params, start=2):
    ss.set(f"A{i}", k); ss.set(f"B{i}", str(v)); ss.set(f"C{i}", "mm")
doc.recompute()

# ---------- SET VISIBILITY (GUI mode) ----------
if HAS_GUI:
    for o in doc.Objects:
        try:
            o.ViewObject.Visibility = True
        except Exception:
            pass
    FreeCADGui.updateGui()

# ---------- SAVE ----------
fc_path = os.path.join(BASE, "03_Assembly", "Lattice_Hub.FCStd")
doc.saveAs(fc_path)
print("saved FCStd:", fc_path)
if HAS_GUI:
    FreeCADGui.getMainWindow().close()

# ---------- EXPORTS ----------
Import.export([o_top], os.path.join(EXPORT, "Top_Shell.step"))
Import.export([o_bot], os.path.join(EXPORT, "Bottom_Shell.step"))
Import.export([o_asm], os.path.join(EXPORT, "Lattice_Hub_Assembly.step"))
print("STEP exported")

for name, sh in [("Top_Shell", top_shell), ("Bottom_Shell", bottom_shell), ("Lattice_Hub_Assembly", assembly)]:
    m = MeshPart.meshFromShape(sh, 0.5)
    m.write(os.path.join(EXPORT, name + ".stl"))
    print("STL exported", name)

print("Top vol", round(top_shell.Volume,1), "Bot vol", round(bottom_shell.Volume,1))
print("Asm bbox", assembly.BoundBox.XLength, assembly.BoundBox.YLength, assembly.BoundBox.ZLength)
print("DONE")
FreeCAD.closeDocument(doc.Name)
