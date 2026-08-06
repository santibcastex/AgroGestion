import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeft, Camera, Upload, RotateCcw, Save, Download, Crop, Bug, Undo2, Check } from 'lucide-react';

const MAX_DIM = 900;

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const v = max;
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s, v];
}

export default function SeveridadFoliar({ onBack }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [points, setPoints] = useState([]); // vértices del contorno
  const [closed, setClosed] = useState(false);
  const [hueTh, setHueTh] = useState(78);
  const [excludeBg, setExcludeBg] = useState(true);
  const [affected, setAffected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [saved, setSaved] = useState(false);
  const [cultivo, setCultivo] = useState('trigo');
  const [nota, setNota] = useState('');

  const srcCanvasRef = useRef(null);
  const displayCanvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const camInputRef = useRef(null);
  const upInputRef = useRef(null);
  const dimsRef = useRef({ w: 0, h: 0 });

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

  const drawOutline = useCallback((pts, isClosed) => {
    const src = srcCanvasRef.current, disp = displayCanvasRef.current;
    if (!dimsRef.current.w) return;
    const dctx = disp.getContext('2d');
    dctx.drawImage(src, 0, 0);
    if (pts.length === 0) return;

    dctx.strokeStyle = '#C1662F';
    dctx.lineWidth = 2;
    dctx.beginPath();
    dctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) dctx.lineTo(pts[i].x, pts[i].y);
    if (isClosed) dctx.closePath();
    dctx.stroke();

    pts.forEach((p, i) => {
      dctx.fillStyle = i === 0 ? '#8BC53F' : '#C1662F';
      dctx.beginPath();
      dctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      dctx.fill();
      dctx.strokeStyle = '#14140F';
      dctx.lineWidth = 1.5;
      dctx.stroke();
    });
  }, []);

  const classify = useCallback((pts, th, exBg) => {
    const src = srcCanvasRef.current, disp = displayCanvasRef.current, maskC = maskCanvasRef.current;
    const { w, h } = dimsRef.current;
    if (!w || pts.length < 3) return;

    // rasterizar polígono como máscara
    maskC.width = w; maskC.height = h;
    const mctx = maskC.getContext('2d');
    mctx.clearRect(0, 0, w, h);
    mctx.fillStyle = '#fff';
    mctx.beginPath();
    mctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) mctx.lineTo(pts[i].x, pts[i].y);
    mctx.closePath();
    mctx.fill();
    const maskData = mctx.getImageData(0, 0, w, h).data;

    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
    const x0 = Math.max(0, Math.floor(Math.min(...xs)));
    const y0 = Math.max(0, Math.floor(Math.min(...ys)));
    const x1 = Math.min(w, Math.ceil(Math.max(...xs)));
    const y1 = Math.min(h, Math.ceil(Math.max(...ys)));
    const rw = x1 - x0, rh = y1 - y0;
    if (rw <= 0 || rh <= 0) return;

    const sctx = src.getContext('2d');
    const dctx = disp.getContext('2d');
    dctx.drawImage(src, 0, 0);

    const srcData = sctx.getImageData(x0, y0, rw, rh).data;
    const overlay = dctx.getImageData(x0, y0, rw, rh);
    const od = overlay.data;

    let healthy = 0, diseased = 0;
    for (let ly = 0; ly < rh; ly++) {
      for (let lx = 0; lx < rw; lx++) {
        const gx = x0 + lx, gy = y0 + ly;
        const mi = (gy * w + gx) * 4 + 3; // alpha del canvas de máscara
        if (maskData[mi] < 128) continue; // fuera del contorno

        const li = (ly * rw + lx) * 4;
        const r = srcData[li], g = srcData[li + 1], b = srcData[li + 2];
        const [hue, sat, val] = rgbToHsv(r, g, b);
        let cls;
        if (exBg && sat < 0.16 && val > 0.62) {
          cls = 0;
        } else if (hue >= th && hue <= 170 && sat > 0.15) {
          cls = 1; healthy++;
        } else {
          cls = 2; diseased++;
        }
        if (cls === 1) {
          od[li]     = Math.round(od[li]     * 0.35 + 139 * 0.65);
          od[li + 1] = Math.round(od[li + 1] * 0.35 + 197 * 0.65);
          od[li + 2] = Math.round(od[li + 2] * 0.35 + 63  * 0.65);
        } else if (cls === 2) {
          od[li]     = Math.round(od[li]     * 0.35 + 217 * 0.65);
          od[li + 1] = Math.round(od[li + 1] * 0.35 + 83  * 0.65);
          od[li + 2] = Math.round(od[li + 2] * 0.35 + 52  * 0.65);
        }
      }
    }
    dctx.putImageData(overlay, x0, y0);
    drawOutline(pts, true);

    const total = healthy + diseased;
    setAffected(total > 0 ? (diseased / total) * 100 : null);
    setSaved(false);
  }, [drawOutline]);

  useEffect(() => {
    if (closed && points.length >= 3) classify(points, hueTh, excludeBg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hueTh, excludeBg]);

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
      disp.getContext('2d').drawImage(src, 0, 0);

      dimsRef.current = { w, h };
      setPoints([]);
      setClosed(false);
      setAffected(null);
      setImgLoaded(true);
    } catch (e) {
      setError('No se pudo leer la imagen. Probá con otra foto.');
    } finally {
      setBusy(false);
    }
  }, []);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (f) loadImageToCanvas(f);
    e.target.value = '';
  };

  const onCanvasClick = (e) => {
    if (!imgLoaded || busy || closed) return;
    const { x, y, scale } = getCanvasCoords(e);
    const { w, h } = dimsRef.current;
    if (x < 0 || y < 0 || x > w || y > h) return;

    if (points.length >= 3) {
      const tolerance = 20 / scale;
      if (Math.hypot(points[0].x - x, points[0].y - y) < tolerance) {
        setClosed(true);
        classify(points, hueTh, excludeBg);
        return;
      }
    }
    const next = [...points, { x, y }];
    setPoints(next);
    drawOutline(next, false);
  };

  const deshacerPunto = () => {
    const next = points.slice(0, -1);
    setPoints(next);
    drawOutline(next, false);
  };

  const cerrarContorno = () => {
    if (points.length < 3) return;
    setClosed(true);
    classify(points, hueTh, excludeBg);
  };

  const nuevoContorno = () => {
    setPoints([]);
    setClosed(false);
    setAffected(null);
    drawOutline([], false);
    setSaved(false);
  };

  const reset = () => {
    setImgLoaded(false);
    setPoints([]);
    setClosed(false);
    setAffected(null);
    setError(null);
    setSaved(false);
    const disp = displayCanvasRef.current;
    if (disp) disp.getContext('2d').clearRect(0, 0, disp.width, disp.height);
  };

  const saveReading = () => {
    if (affected == null) return;
    const thumb = displayCanvasRef.current.toDataURL('image/jpeg', 0.5);
    setHistory((h) => [{ id: Date.now(), ts: new Date(), affected, cultivo, nota, thumb }, ...h]);
    setSaved(true);
  };

  const exportCSV = () => {
    if (history.length === 0) return;
    const rows = [['fecha_hora', 'cultivo', 'enfermedad_sospechada', 'area_afectada_%']];
    history.slice().reverse().forEach((r) => {
      rows.push([r.ts.toISOString(), r.cultivo, (r.nota || '').replace(/,/g, ';'), r.affected.toFixed(1)]);
    });
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `severidad_foliar_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen w-full" style={{ background: '#14140F' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
        .sf-root { font-family: 'Inter', sans-serif; color: #F2EFE6; }
        .sf-mono { font-family: 'JetBrains Mono', monospace; }
        .sf-display { font-family: 'Archivo Black', sans-serif; letter-spacing: -0.02em; }
        .sf-slider { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; background: #33301F; }
        .sf-slider::-webkit-slider-thumb {
          -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
          background: #D95334; border: 3px solid #14140F; box-shadow: 0 0 0 1px #D95334; cursor: pointer; margin-top: -7px;
        }
        .sf-slider::-webkit-slider-runnable-track { height: 4px; border-radius: 2px; background: #33301F; }
      `}</style>

      <div className="sf-root max-w-md mx-auto px-4 py-6 flex flex-col gap-4">

        <header className="flex items-center gap-2 pb-1">
          <button onClick={onBack} className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ background: '#1C1B15', border: '1px solid #33301F' }}>
            <ArrowLeft size={16} color="#9B968A" />
          </button>
          <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ background: '#1C1B15', border: '1px solid #33301F' }}>
            <Bug size={16} color="#D95334" />
          </div>
          <div>
            <div className="sf-mono text-[10px] tracking-widest" style={{ color: '#9B968A' }}>SEVERIDAD FOLIAR</div>
            <div className="text-sm font-medium leading-tight">Área afectada por enfermedad</div>
          </div>
        </header>

        {!imgLoaded && (
          <div className="text-[11px] rounded-lg px-3 py-2.5 leading-relaxed" style={{ background: '#1C1B15', border: '1px solid #33301F', color: '#9B968A' }}>
            Fotografiá la hoja lo más aislada posible del fondo. Después vas a marcar el contorno tocando puntos alrededor del borde.
          </div>
        )}

        {/* Panel de imagen */}
        <div className="w-full aspect-square rounded-lg overflow-hidden relative flex items-center justify-center" style={{ background: '#1C1B15', border: '1px solid #33301F' }}>
          <canvas ref={srcCanvasRef} style={{ display: 'none' }} />
          <canvas ref={maskCanvasRef} style={{ display: 'none' }} />
          {!imgLoaded && (
            <div className="flex flex-col items-center gap-2 px-8 text-center">
              <Crop size={28} color="#8a4a2f" />
              <p className="text-xs" style={{ color: '#9B968A' }}>Sacá o cargá la foto de la hoja afectada.</p>
            </div>
          )}
          <canvas
            ref={displayCanvasRef}
            onClick={onCanvasClick}
            className="w-full h-full object-contain"
            style={{ display: imgLoaded ? 'block' : 'none', cursor: imgLoaded ? 'crosshair' : 'default' }}
          />
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center sf-mono text-xs" style={{ background: 'rgba(20,20,15,0.75)', color: '#8BC53F' }}>
              PROCESANDO…
            </div>
          )}
          {imgLoaded && !closed && !busy && (
            <div className="absolute bottom-2 left-2 right-2 text-center sf-mono text-[10px] py-1.5 rounded" style={{ background: 'rgba(20,20,15,0.85)', color: '#C1662F' }}>
              {points.length === 0
                ? 'TOCÁ EL BORDE DE LA HOJA PARA EMPEZAR EL CONTORNO'
                : `${points.length} PUNTOS · TOCÁ EL PUNTO VERDE PARA CERRAR`}
            </div>
          )}
        </div>

        {/* Controles de contorno (mientras no está cerrado) */}
        {imgLoaded && !closed && (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={deshacerPunto} disabled={points.length === 0} className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium disabled:opacity-40" style={{ background: '#1C1B15', border: '1px solid #33301F', color: '#F2EFE6' }}>
              <Undo2 size={15} /> Deshacer punto
            </button>
            <button onClick={cerrarContorno} disabled={points.length < 3} className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium disabled:opacity-40" style={{ background: '#8BC53F', color: '#14140F' }}>
              <Check size={15} /> Cerrar contorno
            </button>
          </div>
        )}

        {error && (
          <div className="text-xs sf-mono px-3 py-2 rounded" style={{ background: '#231512', color: '#C1662F', border: '1px solid #4a2a1f' }}>{error}</div>
        )}

        {/* Readout */}
        <div className="rounded-lg px-4 py-3" style={{ background: '#1C1B15', border: '1px solid #33301F' }}>
          <div className="flex items-baseline justify-between mb-2">
            <span className="sf-mono text-[10px] tracking-widest" style={{ color: '#9B968A' }}>ÁREA AFECTADA</span>
            <span className="sf-display text-3xl" style={{ color: '#D95334' }}>
              {affected != null ? affected.toFixed(1) : '––'}<span className="text-lg">%</span>
            </span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#33301F' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${affected ?? 0}%`, background: '#D95334' }} />
          </div>
        </div>

        {/* Cultivo */}
        <div className="rounded-lg px-4 py-3" style={{ background: '#1C1B15', border: '1px solid #33301F' }}>
          <div className="text-xs mb-2" style={{ color: '#9B968A' }}>Cultivo</div>
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {['trigo', 'soja'].map((c) => (
              <button
                key={c}
                onClick={() => setCultivo(c)}
                className="text-xs py-1.5 rounded capitalize"
                style={{
                  background: cultivo === c ? '#D95334' : '#232116',
                  color: cultivo === c ? '#14140F' : '#F2EFE6',
                  border: '1px solid #33301F',
                }}
              >
                {c}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Enfermedad sospechada (opcional)"
            className="text-sm w-full rounded px-3 py-2"
            style={{ background: '#14140F', border: '1px solid #33301F', color: '#F2EFE6' }}
          />
        </div>

        {/* Controles de clasificación */}
        {imgLoaded && closed && (
          <div className="rounded-lg px-4 py-3 flex flex-col gap-3" style={{ background: '#1C1B15', border: '1px solid #33301F' }}>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px]" style={{ color: '#9B968A' }}>Umbral verde-amarillo</span>
                <span className="sf-mono text-xs">{hueTh}°</span>
              </div>
              <input type="range" min={50} max={110} value={hueTh} onChange={(e) => setHueTh(Number(e.target.value))} className="sf-slider w-full" />
              <p className="text-[10px] mt-1.5 leading-relaxed" style={{ color: '#6b6759' }}>
                Subilo si marca de sano tejido con clorosis leve; bajalo si deja afuera lesión con borde amarillo.
              </p>
            </div>
            <label className="flex items-center gap-2 text-[11px]" style={{ color: '#9B968A' }}>
              <input type="checkbox" checked={excludeBg} onChange={(e) => setExcludeBg(e.target.checked)} />
              Excluir fondo claro dentro del contorno
            </label>
          </div>
        )}

        {/* Acciones */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => camInputRef.current?.click()} className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium" style={{ background: '#D95334', color: '#14140F' }}>
            <Camera size={15} /> Tomar foto
          </button>
          <button onClick={() => upInputRef.current?.click()} className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium" style={{ background: '#1C1B15', border: '1px solid #33301F', color: '#F2EFE6' }}>
            <Upload size={15} /> Cargar imagen
          </button>
        </div>
        <input ref={camInputRef} type="file" accept="image/*" capture="environment" onChange={onFile} style={{ display: 'none' }} />
        <input ref={upInputRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />

        {imgLoaded && closed && (
          <div className="grid grid-cols-3 gap-2">
            <button onClick={nuevoContorno} className="flex flex-col items-center justify-center gap-1 rounded-lg py-2.5 text-[11px] font-medium" style={{ background: '#1C1B15', border: '1px solid #33301F', color: '#F2EFE6' }}>
              <Crop size={14} /> Nuevo contorno
            </button>
            <button onClick={saveReading} disabled={affected == null} className="flex flex-col items-center justify-center gap-1 rounded-lg py-2.5 text-[11px] font-medium disabled:opacity-40" style={{ background: '#1C1B15', border: '1px solid #33301F', color: saved ? '#8BC53F' : '#F2EFE6' }}>
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
              <span className="sf-mono text-[10px] tracking-widest" style={{ color: '#9B968A' }}>LECTURAS ({history.length})</span>
              <button onClick={exportCSV} className="flex items-center gap-1 sf-mono text-[10px]" style={{ color: '#D95334' }}>
                <Download size={12} /> CSV
              </button>
            </div>
            <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
              {history.map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-lg px-2.5 py-2" style={{ background: '#1C1B15', border: '1px solid #33301F' }}>
                  <img src={r.thumb} alt="" className="w-9 h-9 rounded object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sf-mono" style={{ color: '#F2EFE6' }}>
                      {r.ts.toLocaleDateString('es-AR')} {r.ts.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-[10px] capitalize truncate" style={{ color: '#6b6759' }}>{r.cultivo}{r.nota ? ` · ${r.nota}` : ''}</div>
                  </div>
                  <div className="sf-display text-lg flex-shrink-0" style={{ color: '#D95334' }}>
                    {r.affected.toFixed(1)}%
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
