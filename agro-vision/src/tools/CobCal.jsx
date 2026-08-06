import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeft, Camera, Upload, Layers, Save, Download, RotateCcw, Leaf } from 'lucide-react';

const MAX_DIM = 900;

export default function CobCalWeb({ onBack }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [threshold, setThreshold] = useState(20);
  const [coverage, setCoverage] = useState(null);
  const [showMask, setShowMask] = useState(true);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const srcCanvasRef = useRef(null);
  const displayCanvasRef = useRef(null);
  const camInputRef = useRef(null);
  const upInputRef = useRef(null);

  const classify = useCallback((th, mask) => {
    const src = srcCanvasRef.current;
    const disp = displayCanvasRef.current;
    if (!src || !src.width) return;
    const sctx = src.getContext('2d');
    const dctx = disp.getContext('2d');
    const w = src.width, h = src.height;
    const imgData = sctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    let vegCount = 0;

    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const exg = 2 * g - r - b;
      const isVeg = exg > th;
      mask[p] = isVeg ? 1 : 0;
      if (isVeg) vegCount++;
    }

    setCoverage((vegCount / mask.length) * 100);

    dctx.drawImage(src, 0, 0);
    if (showMask) {
      const overlay = dctx.getImageData(0, 0, w, h);
      const od = overlay.data;
      for (let p = 0, i = 0; p < mask.length; p++, i += 4) {
        if (mask[p]) {
          od[i]     = Math.round(od[i]     * 0.22 + 139 * 0.78);
          od[i + 1] = Math.round(od[i + 1] * 0.22 + 197 * 0.78);
          od[i + 2] = Math.round(od[i + 2] * 0.22 + 63  * 0.78);
        }
      }
      dctx.putImageData(overlay, 0, 0);
    }
  }, [showMask]);

  const maskRef = useRef(null);

  const loadImageToCanvas = useCallback(async (file) => {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      let bitmap;
      try {
        bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      } catch {
        bitmap = await createImageBitmap(file);
      }
      const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
      const w = Math.round(bitmap.width * scale);
      const h = Math.round(bitmap.height * scale);

      const src = srcCanvasRef.current;
      src.width = w;
      src.height = h;
      src.getContext('2d').drawImage(bitmap, 0, 0, w, h);

      const disp = displayCanvasRef.current;
      disp.width = w;
      disp.height = h;

      maskRef.current = new Uint8Array(w * h);
      setImgLoaded(true);
      classify(threshold, maskRef.current);
    } catch (e) {
      setError('No se pudo leer la imagen. Probá con otra foto.');
    } finally {
      setBusy(false);
    }
  }, [classify, threshold]);

  useEffect(() => {
    if (imgLoaded && maskRef.current) classify(threshold, maskRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold, showMask, imgLoaded]);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (f) loadImageToCanvas(f);
    e.target.value = '';
  };

  const saveReading = () => {
    if (coverage == null) return;
    const thumb = displayCanvasRef.current.toDataURL('image/jpeg', 0.5);
    setHistory((h) => [{ id: Date.now(), ts: new Date(), coverage, threshold, thumb }, ...h]);
    setSaved(true);
  };

  const exportCSV = () => {
    if (history.length === 0) return;
    const rows = [['fecha_hora', 'cobertura_%', 'umbral_exg']];
    history.slice().reverse().forEach((r) => {
      rows.push([r.ts.toISOString(), r.coverage.toFixed(2), r.threshold]);
    });
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cobcal_lecturas_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setImgLoaded(false);
    setCoverage(null);
    setSaved(false);
    maskRef.current = null;
    const disp = displayCanvasRef.current;
    if (disp) disp.getContext('2d').clearRect(0, 0, disp.width, disp.height);
  };

  return (
    <div className="min-h-screen w-full" style={{ background: '#14140F' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
        .cc-root { font-family: 'Inter', sans-serif; color: #F2EFE6; }
        .cc-mono { font-family: 'JetBrains Mono', monospace; }
        .cc-display { font-family: 'Archivo Black', sans-serif; letter-spacing: -0.02em; }
        .cc-slider { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; background: #33301F; }
        .cc-slider::-webkit-slider-thumb {
          -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
          background: #8BC53F; border: 3px solid #14140F; box-shadow: 0 0 0 1px #8BC53F; cursor: pointer; margin-top: -7px;
        }
        .cc-slider::-webkit-slider-runnable-track { height: 4px; border-radius: 2px; background: #33301F; }
        .cc-slider::-moz-range-thumb {
          width: 16px; height: 16px; border-radius: 50%; background: #8BC53F; border: 3px solid #14140F; cursor: pointer;
        }
      `}</style>

      <div className="cc-root max-w-md mx-auto px-4 py-6 flex flex-col gap-4">

        <header className="flex items-center gap-2 pb-1">
          <button onClick={onBack} className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ background: '#1C1B15', border: '1px solid #33301F' }}>
            <ArrowLeft size={16} color="#9B968A" />
          </button>
          <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ background: '#1C1B15', border: '1px solid #33301F' }}>
            <Leaf size={16} color="#8BC53F" />
          </div>
          <div>
            <div className="cc-mono text-[10px] tracking-widest" style={{ color: '#9B968A' }}>COBCAL WEB</div>
            <div className="text-sm font-medium leading-tight">Estimador de cobertura vegetal</div>
          </div>
        </header>

        {/* Panel de imagen */}
        <div
          className="w-full aspect-square rounded-lg overflow-hidden relative flex items-center justify-center"
          style={{ background: '#1C1B15', border: '1px solid #33301F' }}
        >
          <canvas ref={srcCanvasRef} style={{ display: 'none' }} />
          {!imgLoaded && (
            <div className="flex flex-col items-center gap-2 px-8 text-center">
              <Camera size={28} color="#5C7A2E" />
              <p className="text-xs" style={{ color: '#9B968A' }}>
                Sacá una foto del lote o cargá una imagen para estimar el % de cobertura verde.
              </p>
            </div>
          )}
          <canvas
            ref={displayCanvasRef}
            className="w-full h-full object-contain"
            style={{ display: imgLoaded ? 'block' : 'none' }}
          />
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center cc-mono text-xs" style={{ background: 'rgba(20,20,15,0.75)', color: '#8BC53F' }}>
              PROCESANDO…
            </div>
          )}
        </div>

        {error && (
          <div className="text-xs cc-mono px-3 py-2 rounded" style={{ background: '#231512', color: '#C1662F', border: '1px solid #4a2a1f' }}>
            {error}
          </div>
        )}

        {/* Readout */}
        <div className="rounded-lg px-4 py-3" style={{ background: '#1C1B15', border: '1px solid #33301F' }}>
          <div className="flex items-baseline justify-between mb-2">
            <span className="cc-mono text-[10px] tracking-widest" style={{ color: '#9B968A' }}>COBERTURA VEGETAL</span>
            <span className="cc-display text-3xl" style={{ color: '#8BC53F' }}>
              {coverage != null ? coverage.toFixed(1) : '––'}<span className="text-lg">%</span>
            </span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#33301F' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${coverage ?? 0}%`, background: '#8BC53F' }}
            />
          </div>
        </div>

        {/* Sensibilidad */}
        <div className="rounded-lg px-4 py-3" style={{ background: '#1C1B15', border: '1px solid #33301F' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: '#9B968A' }}>Sensibilidad (umbral ExG)</span>
            <span className="cc-mono text-xs" style={{ color: '#F2EFE6' }}>{threshold}</span>
          </div>
          <input
            type="range"
            min={-30}
            max={80}
            step={1}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="cc-slider w-full"
          />
          <p className="text-[10px] mt-2 leading-relaxed" style={{ color: '#6b6759' }}>
            Clasifica cada píxel como vegetación cuando 2G−R−B supera este umbral. Subilo si marca de más (sombras, residuo oscuro), bajalo si deja afuera vegetación clara.
          </p>
        </div>

        {/* Acciones sobre imagen */}
        {imgLoaded && (
          <button
            onClick={() => setShowMask((s) => !s)}
            className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium"
            style={{ background: showMask ? '#2a3a15' : '#1C1B15', border: '1px solid #33301F', color: '#F2EFE6' }}
          >
            <Layers size={15} color="#8BC53F" />
            {showMask ? 'Ocultar máscara' : 'Mostrar máscara'}
          </button>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => camInputRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium"
            style={{ background: '#8BC53F', color: '#14140F' }}
          >
            <Camera size={15} />
            Tomar foto
          </button>
          <button
            onClick={() => upInputRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium"
            style={{ background: '#1C1B15', border: '1px solid #33301F', color: '#F2EFE6' }}
          >
            <Upload size={15} />
            Cargar imagen
          </button>
        </div>
        <input ref={camInputRef} type="file" accept="image/*" capture="environment" onChange={onFile} style={{ display: 'none' }} />
        <input ref={upInputRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />

        {imgLoaded && (
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={saveReading}
              className="flex flex-col items-center justify-center gap-1 rounded-lg py-2.5 text-[11px] font-medium"
              style={{ background: '#1C1B15', border: '1px solid #33301F', color: saved ? '#8BC53F' : '#F2EFE6' }}
            >
              <Save size={14} />
              {saved ? 'Guardada' : 'Guardar'}
            </button>
            <button
              onClick={exportCSV}
              disabled={history.length === 0}
              className="flex flex-col items-center justify-center gap-1 rounded-lg py-2.5 text-[11px] font-medium disabled:opacity-40"
              style={{ background: '#1C1B15', border: '1px solid #33301F', color: '#F2EFE6' }}
            >
              <Download size={14} />
              CSV
            </button>
            <button
              onClick={reset}
              className="flex flex-col items-center justify-center gap-1 rounded-lg py-2.5 text-[11px] font-medium"
              style={{ background: '#1C1B15', border: '1px solid #33301F', color: '#F2EFE6' }}
            >
              <RotateCcw size={14} />
              Nueva foto
            </button>
          </div>
        )}

        {/* Historial */}
        {history.length > 0 && (
          <div className="mt-2">
            <div className="cc-mono text-[10px] tracking-widest mb-2" style={{ color: '#9B968A' }}>
              LECTURAS GUARDADAS ({history.length})
            </div>
            <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
              {history.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-lg px-2.5 py-2"
                  style={{ background: '#1C1B15', border: '1px solid #33301F' }}
                >
                  <img src={r.thumb} alt="" className="w-9 h-9 rounded object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs cc-mono" style={{ color: '#F2EFE6' }}>
                      {r.ts.toLocaleDateString('es-AR')} {r.ts.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-[10px]" style={{ color: '#6b6759' }}>umbral {r.threshold}</div>
                  </div>
                  <div className="cc-display text-lg flex-shrink-0" style={{ color: '#8BC53F' }}>
                    {r.coverage.toFixed(1)}%
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
