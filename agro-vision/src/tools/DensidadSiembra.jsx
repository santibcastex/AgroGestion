import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeft, Camera, Upload, RotateCcw, Save, Download, Ruler, Sprout, RefreshCw } from 'lucide-react';

const MAX_DIM = 800;
const ROW_PRESETS = [17.5, 21, 35, 52.5, 70];

let idCounter = 1;
const nextId = () => idCounter++;

export default function DensidadSiembra({ onBack }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [points, setPoints] = useState([]); // calibration points, image-space coords
  const [markers, setMarkers] = useState([]); // {id, x, y}
  const [threshold, setThreshold] = useState(15);
  const [bandPct, setBandPct] = useState(16);
  const [minArea, setMinArea] = useState(10);
  const [rowSpacing, setRowSpacing] = useState(52.5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [saved, setSaved] = useState(false);

  const srcCanvasRef = useRef(null);
  const displayCanvasRef = useRef(null);
  const camInputRef = useRef(null);
  const upInputRef = useRef(null);

  const maskRef = useRef(null); // Uint8Array vegetation mask for current image
  const dimsRef = useRef({ w: 0, h: 0 });

  // ---------- coordinate mapping (object-contain canvas) ----------
  const getCanvasCoords = useCallback((e) => {
    const canvas = displayCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const cw = canvas.width, ch = canvas.height;
    const scale = Math.min(rect.width / cw, rect.height / ch);
    const contentW = cw * scale, contentH = ch * scale;
    const offsetX = (rect.width - contentW) / 2;
    const offsetY = (rect.height - contentH) / 2;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left - offsetX) / scale;
    const y = (clientY - rect.top - offsetY) / scale;
    return { x, y, scale };
  }, []);

  // ---------- vegetation mask (ExG) ----------
  const computeMask = useCallback((th) => {
    const src = srcCanvasRef.current;
    const { w, h } = dimsRef.current;
    if (!w) return null;
    const data = src.getContext('2d').getImageData(0, 0, w, h).data;
    const mask = new Uint8Array(w * h);
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      mask[p] = (2 * g - r - b) > th ? 1 : 0;
    }
    return mask;
  }, []);

  // ---------- eligible band around calibration line ----------
  const computeEligible = useCallback((w, h, p1, p2, bandHalf) => {
    const eligible = new Uint8Array(w * h);
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const lenSq = dx * dx + dy * dy || 1;
    const len = Math.sqrt(lenSq);
    const pad = len * 0.06;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const t = ((x - p1.x) * dx + (y - p1.y) * dy) / lenSq;
        if (t < -pad / len || t > 1 + pad / len) continue;
        const projX = p1.x + t * dx, projY = p1.y + t * dy;
        const dist = Math.hypot(x - projX, y - projY);
        if (dist <= bandHalf) eligible[y * w + x] = 1;
      }
    }
    return eligible;
  }, []);

  // ---------- connected components ----------
  const detectBlobs = useCallback((mask, eligible, w, h, minAreaPx) => {
    const visited = new Uint8Array(w * h);
    const blobs = [];
    const stack = new Int32Array(w * h);
    for (let idx = 0; idx < w * h; idx++) {
      if (mask[idx] && eligible[idx] && !visited[idx]) {
        let sp = 0;
        stack[sp++] = idx;
        visited[idx] = 1;
        let sumX = 0, sumY = 0, count = 0;
        while (sp > 0) {
          const cur = stack[--sp];
          const cy = (cur / w) | 0, cx = cur - cy * w;
          sumX += cx; sumY += cy; count++;
          if (cx > 0) { const n = cur - 1; if (mask[n] && eligible[n] && !visited[n]) { visited[n] = 1; stack[sp++] = n; } }
          if (cx < w - 1) { const n = cur + 1; if (mask[n] && eligible[n] && !visited[n]) { visited[n] = 1; stack[sp++] = n; } }
          if (cur - w >= 0) { const n = cur - w; if (mask[n] && eligible[n] && !visited[n]) { visited[n] = 1; stack[sp++] = n; } }
          if (cur + w < w * h) { const n = cur + w; if (mask[n] && eligible[n] && !visited[n]) { visited[n] = 1; stack[sp++] = n; } }
        }
        if (count >= minAreaPx) blobs.push({ x: sumX / count, y: sumY / count, area: count });
      }
    }
    return blobs;
  }, []);

  // ---------- redraw ----------
  const redraw = useCallback((pts, mk) => {
    const src = srcCanvasRef.current, disp = displayCanvasRef.current;
    const { w, h } = dimsRef.current;
    if (!w) return;
    const ctx = disp.getContext('2d');
    ctx.drawImage(src, 0, 0);

    if (pts.length === 2) {
      const bandHalf = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) * (bandPct / 100);
      // banda semitransparente
      ctx.save();
      ctx.strokeStyle = 'rgba(139,197,63,0.35)';
      ctx.lineWidth = bandHalf * 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[1].x, pts[1].y);
      ctx.stroke();
      ctx.restore();

      ctx.strokeStyle = '#C1662F';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[1].x, pts[1].y);
      ctx.stroke();
    }
    pts.forEach((p, i) => {
      ctx.fillStyle = '#C1662F';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#14140F';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(i === 0 ? 'A' : 'B', p.x, p.y);
    });

    mk.forEach((m, i) => {
      ctx.fillStyle = '#8BC53F';
      ctx.strokeStyle = '#14140F';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(m.x, m.y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#14140F';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), m.x, m.y);
    });
  }, [bandPct]);

  const runDetection = useCallback((pts) => {
    if (pts.length !== 2) return;
    setBusy(true);
    setTimeout(() => {
      const { w, h } = dimsRef.current;
      const mask = computeMask(threshold);
      maskRef.current = mask;
      const bandHalf = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) * (bandPct / 100);
      const eligible = computeEligible(w, h, pts[0], pts[1], bandHalf);
      const blobs = detectBlobs(mask, eligible, w, h, minArea);
      const mk = blobs.map((b) => ({ id: nextId(), x: b.x, y: b.y }));
      setMarkers(mk);
      redraw(pts, mk);
      setBusy(false);
      setSaved(false);
    }, 10);
  }, [threshold, bandPct, minArea, computeMask, computeEligible, detectBlobs, redraw]);

  // re-run auto detection when controls change (after calibration done)
  useEffect(() => {
    if (points.length === 2) runDetection(points);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold, bandPct, minArea]);

  useEffect(() => {
    if (imgLoaded) redraw(points, markers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgLoaded]);

  // ---------- load image ----------
  const loadImageToCanvas = useCallback(async (file) => {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      let bitmap;
      try { bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
      catch { bitmap = await createImageBitmap(file); }
      const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
      const w = Math.round(bitmap.width * scale);
      const h = Math.round(bitmap.height * scale);

      const src = srcCanvasRef.current;
      src.width = w; src.height = h;
      src.getContext('2d').drawImage(bitmap, 0, 0, w, h);

      const disp = displayCanvasRef.current;
      disp.width = w; disp.height = h;

      dimsRef.current = { w, h };
      setPoints([]);
      setMarkers([]);
      setImgLoaded(true);
      redraw([], []);
    } catch (e) {
      setError('No se pudo leer la imagen. Probá con otra foto.');
    } finally {
      setBusy(false);
    }
  }, [redraw]);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (f) loadImageToCanvas(f);
    e.target.value = '';
  };

  // ---------- click handling ----------
  const onCanvasClick = (e) => {
    if (!imgLoaded || busy) return;
    const { x, y, scale } = getCanvasCoords(e);
    const { w, h } = dimsRef.current;
    if (x < 0 || y < 0 || x > w || y > h) return;

    if (points.length < 2) {
      const next = [...points, { x, y }];
      setPoints(next);
      redraw(next, markers);
      if (next.length === 2) runDetection(next);
      return;
    }

    const tolerance = 22 / scale;
    const hitIdx = markers.findIndex((m) => Math.hypot(m.x - x, m.y - y) < tolerance);
    let next;
    if (hitIdx >= 0) {
      next = markers.filter((_, i) => i !== hitIdx);
    } else {
      next = [...markers, { id: nextId(), x, y }];
    }
    setMarkers(next);
    redraw(points, next);
    setSaved(false);
  };

  const recalibrar = () => {
    setPoints([]);
    setMarkers([]);
    redraw([], []);
    setSaved(false);
  };

  const reset = () => {
    setImgLoaded(false);
    setPoints([]);
    setMarkers([]);
    setError(null);
    setSaved(false);
    const disp = displayCanvasRef.current;
    if (disp) disp.getContext('2d').clearRect(0, 0, disp.width, disp.height);
  };

  const count = markers.length;
  const density = points.length === 2 && count > 0 && rowSpacing > 0
    ? (count * 1000000) / rowSpacing
    : null;

  const saveReading = () => {
    if (density == null) return;
    const thumb = displayCanvasRef.current.toDataURL('image/jpeg', 0.5);
    setHistory((h) => [{ id: Date.now(), ts: new Date(), count, rowSpacing, density, thumb }, ...h]);
    setSaved(true);
  };

  const exportCSV = () => {
    if (history.length === 0) return;
    const rows = [['fecha_hora', 'plantas_por_metro', 'distancia_surco_cm', 'densidad_pl_ha', 'densidad_pl_m2']];
    history.slice().reverse().forEach((r) => {
      rows.push([r.ts.toISOString(), r.count, r.rowSpacing, Math.round(r.density), (r.density / 10000).toFixed(1)]);
    });
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `densidad_siembra_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const avgDensity = history.length >= 2
    ? history.reduce((s, r) => s + r.density, 0) / history.length
    : null;

  return (
    <div className="min-h-screen w-full" style={{ background: '#14140F' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
        .ds-root { font-family: 'Inter', sans-serif; color: #F2EFE6; }
        .ds-mono { font-family: 'JetBrains Mono', monospace; }
        .ds-display { font-family: 'Archivo Black', sans-serif; letter-spacing: -0.02em; }
        .ds-slider { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; background: #33301F; }
        .ds-slider::-webkit-slider-thumb {
          -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
          background: #8BC53F; border: 3px solid #14140F; box-shadow: 0 0 0 1px #8BC53F; cursor: pointer; margin-top: -7px;
        }
        .ds-slider::-webkit-slider-runnable-track { height: 4px; border-radius: 2px; background: #33301F; }
        .ds-preset { transition: all .15s; }
      `}</style>

      <div className="ds-root max-w-md mx-auto px-4 py-6 flex flex-col gap-4">

        <header className="flex items-center gap-2 pb-1">
          <button onClick={onBack} className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ background: '#1C1B15', border: '1px solid #33301F' }}>
            <ArrowLeft size={16} color="#9B968A" />
          </button>
          <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ background: '#1C1B15', border: '1px solid #33301F' }}>
            <Sprout size={16} color="#8BC53F" />
          </div>
          <div>
            <div className="ds-mono text-[10px] tracking-widest" style={{ color: '#9B968A' }}>DENSIDAD DE SIEMBRA</div>
            <div className="text-sm font-medium leading-tight">Conteo de plantas por metro lineal</div>
          </div>
        </header>

        {!imgLoaded && (
          <div className="text-[11px] rounded-lg px-3 py-2.5 leading-relaxed" style={{ background: '#1C1B15', border: '1px solid #33301F', color: '#9B968A' }}>
            Marcá 1 metro sobre el surco con cinta o dos estacas, fotografiá ese tramo, y después tocá los dos extremos (A y B) sobre la foto para indicar el segmento.
          </div>
        )}

        {/* Panel de imagen */}
        <div
          className="w-full aspect-square rounded-lg overflow-hidden relative flex items-center justify-center"
          style={{ background: '#1C1B15', border: '1px solid #33301F' }}
        >
          <canvas ref={srcCanvasRef} style={{ display: 'none' }} />
          {!imgLoaded && (
            <div className="flex flex-col items-center gap-2 px-8 text-center">
              <Ruler size={28} color="#5C7A2E" />
              <p className="text-xs" style={{ color: '#9B968A' }}>Sacá o cargá la foto del metro marcado en el surco.</p>
            </div>
          )}
          <canvas
            ref={displayCanvasRef}
            onClick={onCanvasClick}
            className="w-full h-full object-contain"
            style={{ display: imgLoaded ? 'block' : 'none', cursor: imgLoaded ? 'crosshair' : 'default' }}
          />
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center ds-mono text-xs" style={{ background: 'rgba(20,20,15,0.75)', color: '#8BC53F' }}>
              PROCESANDO…
            </div>
          )}
          {imgLoaded && points.length < 2 && !busy && (
            <div className="absolute bottom-2 left-2 right-2 text-center ds-mono text-[10px] py-1.5 rounded" style={{ background: 'rgba(20,20,15,0.85)', color: '#C1662F' }}>
              TOCÁ EL PUNTO {points.length === 0 ? 'A (inicio)' : 'B (fin, a 1 metro de A)'}
            </div>
          )}
        </div>

        {error && (
          <div className="text-xs ds-mono px-3 py-2 rounded" style={{ background: '#231512', color: '#C1662F', border: '1px solid #4a2a1f' }}>{error}</div>
        )}

        {/* Readout */}
        <div className="rounded-lg px-4 py-3" style={{ background: '#1C1B15', border: '1px solid #33301F' }}>
          <div className="flex items-baseline justify-between">
            <span className="ds-mono text-[10px] tracking-widest" style={{ color: '#9B968A' }}>PLANTAS / METRO</span>
            <span className="ds-display text-3xl" style={{ color: '#8BC53F' }}>{points.length === 2 ? count : '––'}</span>
          </div>
          <div className="h-px my-2.5" style={{ background: '#33301F' }} />
          <div className="flex items-baseline justify-between">
            <span className="ds-mono text-[10px] tracking-widest" style={{ color: '#9B968A' }}>DENSIDAD</span>
            <span className="ds-mono text-lg" style={{ color: '#F2EFE6' }}>
              {density != null ? Math.round(density).toLocaleString('es-AR') : '––'} <span className="text-xs" style={{ color: '#9B968A' }}>pl/ha</span>
            </span>
          </div>
          {density != null && (
            <div className="text-[10px] text-right ds-mono mt-0.5" style={{ color: '#6b6759' }}>
              {(density / 10000).toFixed(1)} pl/m²
            </div>
          )}
        </div>

        {/* Distanciamiento entre surcos */}
        <div className="rounded-lg px-4 py-3" style={{ background: '#1C1B15', border: '1px solid #33301F' }}>
          <div className="text-xs mb-2" style={{ color: '#9B968A' }}>Distanciamiento entre surcos (cm)</div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {ROW_PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setRowSpacing(p)}
                className="ds-preset ds-mono text-xs px-2.5 py-1 rounded"
                style={{
                  background: rowSpacing === p ? '#8BC53F' : '#232116',
                  color: rowSpacing === p ? '#14140F' : '#F2EFE6',
                  border: '1px solid #33301F',
                }}
              >
                {p}
              </button>
            ))}
          </div>
          <input
            type="number"
            step="0.5"
            value={rowSpacing}
            onChange={(e) => setRowSpacing(Number(e.target.value) || 0)}
            className="ds-mono text-sm w-full rounded px-3 py-2"
            style={{ background: '#14140F', border: '1px solid #33301F', color: '#F2EFE6' }}
            placeholder="Distanciamiento custom"
          />
        </div>

        {/* Controles de detección */}
        {imgLoaded && (
          <div className="rounded-lg px-4 py-3 flex flex-col gap-3" style={{ background: '#1C1B15', border: '1px solid #33301F' }}>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px]" style={{ color: '#9B968A' }}>Sensibilidad de color</span>
                <span className="ds-mono text-xs">{threshold}</span>
              </div>
              <input type="range" min={-30} max={80} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="ds-slider w-full" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px]" style={{ color: '#9B968A' }}>Ancho de banda sobre el surco</span>
                <span className="ds-mono text-xs">{bandPct}%</span>
              </div>
              <input type="range" min={5} max={40} value={bandPct} onChange={(e) => setBandPct(Number(e.target.value))} className="ds-slider w-full" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px]" style={{ color: '#9B968A' }}>Tamaño mínimo de planta</span>
                <span className="ds-mono text-xs">{minArea}px</span>
              </div>
              <input type="range" min={2} max={80} value={minArea} onChange={(e) => setMinArea(Number(e.target.value))} className="ds-slider w-full" />
            </div>
            <p className="text-[10px] leading-relaxed" style={{ color: '#6b6759' }}>
              Cambiar estos controles vuelve a detectar automático y borra correcciones manuales. Después de ajustar, tocá una planta detectada de más para sacarla, o un lugar vacío dentro de la banda para agregar una que falte.
            </p>
          </div>
        )}

        {/* Acciones */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => camInputRef.current?.click()} className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium" style={{ background: '#8BC53F', color: '#14140F' }}>
            <Camera size={15} /> Tomar foto
          </button>
          <button onClick={() => upInputRef.current?.click()} className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium" style={{ background: '#1C1B15', border: '1px solid #33301F', color: '#F2EFE6' }}>
            <Upload size={15} /> Cargar imagen
          </button>
        </div>
        <input ref={camInputRef} type="file" accept="image/*" capture="environment" onChange={onFile} style={{ display: 'none' }} />
        <input ref={upInputRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />

        {imgLoaded && (
          <div className="grid grid-cols-3 gap-2">
            <button onClick={recalibrar} className="flex flex-col items-center justify-center gap-1 rounded-lg py-2.5 text-[11px] font-medium" style={{ background: '#1C1B15', border: '1px solid #33301F', color: '#F2EFE6' }}>
              <RefreshCw size={14} /> Recalibrar
            </button>
            <button onClick={saveReading} disabled={density == null} className="flex flex-col items-center justify-center gap-1 rounded-lg py-2.5 text-[11px] font-medium disabled:opacity-40" style={{ background: '#1C1B15', border: '1px solid #33301F', color: saved ? '#8BC53F' : '#F2EFE6' }}>
              <Save size={14} /> {saved ? 'Guardada' : 'Guardar'}
            </button>
            <button onClick={reset} className="flex flex-col items-center justify-center gap-1 rounded-lg py-2.5 text-[11px] font-medium" style={{ background: '#1C1B15', border: '1px solid #33301F', color: '#F2EFE6' }}>
              <RotateCcw size={14} /> Nueva foto
            </button>
          </div>
        )}

        {/* Historial */}
        {history.length > 0 && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="ds-mono text-[10px] tracking-widest" style={{ color: '#9B968A' }}>MUESTRAS ({history.length})</span>
              <button onClick={exportCSV} className="flex items-center gap-1 ds-mono text-[10px]" style={{ color: '#8BC53F' }}>
                <Download size={12} /> CSV
              </button>
            </div>
            {avgDensity != null && (
              <div className="rounded-lg px-3 py-2 mb-2 flex items-baseline justify-between" style={{ background: '#232116', border: '1px solid #33301F' }}>
                <span className="text-[11px]" style={{ color: '#9B968A' }}>Promedio de la sesión</span>
                <span className="ds-mono text-sm" style={{ color: '#8BC53F' }}>{Math.round(avgDensity).toLocaleString('es-AR')} pl/ha</span>
              </div>
            )}
            <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
              {history.map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-lg px-2.5 py-2" style={{ background: '#1C1B15', border: '1px solid #33301F' }}>
                  <img src={r.thumb} alt="" className="w-9 h-9 rounded object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs ds-mono" style={{ color: '#F2EFE6' }}>
                      {r.ts.toLocaleDateString('es-AR')} {r.ts.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-[10px]" style={{ color: '#6b6759' }}>{r.count} pl/m · surco {r.rowSpacing}cm</div>
                  </div>
                  <div className="ds-mono text-sm flex-shrink-0" style={{ color: '#8BC53F' }}>
                    {Math.round(r.density).toLocaleString('es-AR')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
