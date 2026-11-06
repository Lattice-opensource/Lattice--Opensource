import { useRef, useState, useCallback } from "react";

import type { NormalizedPoint, RoomPolygon } from "../types";
export type { NormalizedPoint, RoomPolygon };

interface BlueprintViewerProps {
  blueprintUrl?: string | null;
  rooms: RoomPolygon[];
  selectedRoomId: string | null;
  drawing: boolean;
  draftPoints: NormalizedPoint[];
  onSelectRoom: (id: string | null) => void;
  onCanvasClick: (pt: NormalizedPoint) => void;
  onCanvasDoubleClick: () => void;
  onFinishDraw: () => void;
  onCancelDraw: () => void;
}

export function BlueprintViewer({
  blueprintUrl,
  rooms,
  selectedRoomId,
  drawing,
  draftPoints,
  onSelectRoom,
  onCanvasClick,
  onCanvasDoubleClick,
  onFinishDraw,
  onCancelDraw,
}: BlueprintViewerProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  const toNormalized = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const inv = ctm.inverse();
    const transformed = pt.matrixTransform(inv);
    // account for zoom/pan transform applied to inner group: divide out
    const x = (transformed.x - pan.x) / zoom;
    const y = (transformed.y - pan.y) / zoom;
    if (x < 0 || x > 1 || y < 0 || y > 1) return null;
    return { x, y };
  }, [zoom, pan]);

  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.min(8, Math.max(0.5, z * delta)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (drawing) return;
    if (e.button !== 0) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  }, [drawing, pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isPanning || !panStart.current) return;
    const dx = (e.clientX - panStart.current.x) / 400;
    const dy = (e.clientY - panStart.current.y) / 400;
    setPan({ x: panStart.current.px + dx, y: panStart.current.py + dy });
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    panStart.current = null;
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) return;
    if (!drawing) return;
    const pt = toNormalized(e);
    if (pt) onCanvasClick(pt);
  }, [isPanning, drawing, toNormalized, onCanvasClick]);

  const handleDoubleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!drawing) return;
    e.preventDefault();
    onCanvasDoubleClick();
  }, [drawing, onCanvasDoubleClick]);

  const pointsToPath = (pts: NormalizedPoint[]) =>
    pts.length === 0 ? '' : pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + (pts.length > 2 ? ' Z' : '');

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs text-muted">
        <button type="button" onClick={() => setZoom((z) => Math.min(8, z * 1.2))} className="rounded border border-line px-2 py-1 hover:bg-page">Zoom in</button>
        <button type="button" onClick={() => setZoom((z) => Math.max(0.5, z / 1.2))} className="rounded border border-line px-2 py-1 hover:bg-page">Zoom out</button>
        <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="rounded border border-line px-2 py-1 hover:bg-page">Reset view</button>
        <span className="ml-auto">Zoom: {zoom.toFixed(2)}×</span>
      </div>
      <svg
        ref={svgRef}
        viewBox="0 0 1 1"
        preserveAspectRatio="xMidYMid meet"
        className="h-[480px] w-full cursor-crosshair rounded-lg border border-line bg-page"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
          {blueprintUrl ? (
            <image href={blueprintUrl} x={0} y={0} width={1} height={1} preserveAspectRatio="none" />
          ) : (
            <rect x={0} y={0} width={1} height={1} fill="#f6f7f9" stroke="#e7e9ee" />
          )}
          {rooms.map((r) => {
            const selected = r.id === selectedRoomId;
            return (
              <g key={r.id} onClick={(e) => { e.stopPropagation(); onSelectRoom(r.id); }} style={{ cursor: 'pointer' }}>
                <path d={pointsToPath(r.points)} fill={selected ? 'rgba(225,29,72,0.25)' : 'rgba(5,150,105,0.15)'} stroke={selected ? '#e11d48' : '#059669'} strokeWidth={0.005} />
                <text x={r.points[0]?.x ?? 0} y={r.points[0]?.y ?? 0} fontSize={0.03} fill="#0f172a" fontWeight="bold">
                  {r.name}
                </text>
              </g>
            );
          })}
          {drawing && draftPoints.length > 0 && (
            <path d={pointsToPath(draftPoints)} fill="rgba(225,29,72,0.15)" stroke="#e11d48" strokeWidth={0.005} strokeDasharray="0.01 0.005" />
          )}
          {drawing && draftPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={0.008} fill="#e11d48" />
          ))}
        </g>
      </svg>
      {drawing ? (
        <div className="flex items-center gap-2 text-xs">
          <button type="button" onClick={onFinishDraw} disabled={draftPoints.length < 3} className="rounded bg-brand px-3 py-1.5 text-white disabled:opacity-50">Finish room</button>
          <button type="button" onClick={onCancelDraw} className="rounded border border-line px-3 py-1.5">Cancel</button>
          <span className="text-muted">Click to add points. Double-click to close.</span>
        </div>
      ) : null}
    </div>
  );
}
