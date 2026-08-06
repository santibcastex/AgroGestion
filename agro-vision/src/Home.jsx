import React from 'react';
import { Leaf, Sprout, Bug, ChevronRight } from 'lucide-react';

const TOOLS = [
  {
    id: 'cobcal',
    icon: Leaf,
    color: '#8BC53F',
    title: 'CobCal',
    subtitle: 'Cobertura vegetal',
    desc: 'Estimá el % de cobertura verde de un lote a partir de una foto.',
  },
  {
    id: 'densidad',
    icon: Sprout,
    color: '#8BC53F',
    title: 'Densidad de Siembra',
    subtitle: 'Plantas por metro lineal',
    desc: 'Contá plantas en 1 metro de surco y calculá densidad por hectárea.',
  },
  {
    id: 'severidad',
    icon: Bug,
    color: '#D95334',
    title: 'Severidad Foliar',
    subtitle: 'Área afectada',
    desc: 'Marcá el contorno de una hoja y estimá % de área afectada por enfermedad.',
  },
];

export default function Home({ onSelect }) {
  return (
    <div className="min-h-screen w-full" style={{ background: '#14140F' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
        .av-root { font-family: 'Inter', sans-serif; color: #F2EFE6; }
        .av-mono { font-family: 'JetBrains Mono', monospace; }
        .av-display { font-family: 'Archivo Black', sans-serif; letter-spacing: -0.02em; }
        .av-card { transition: border-color .15s, transform .1s; }
        .av-card:active { transform: scale(0.98); }
      `}</style>

      <div className="av-root max-w-md mx-auto px-4 py-8 flex flex-col gap-6">
        <header>
          <div className="av-mono text-[10px] tracking-widest mb-1" style={{ color: '#9B968A' }}>AGRO VISION</div>
          <div className="av-display text-2xl">Herramientas de campo</div>
        </header>

        <div className="flex flex-col gap-3">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => onSelect(t.id)}
                className="av-card flex items-center gap-3 rounded-lg px-4 py-4 text-left"
                style={{ background: '#1C1B15', border: '1px solid #33301F' }}
              >
                <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#14140F', border: '1px solid #33301F' }}>
                  <Icon size={20} color={t.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{t.title}</div>
                  <div className="text-[11px]" style={{ color: '#9B968A' }}>{t.subtitle}</div>
                  <div className="text-[10px] mt-0.5 leading-relaxed" style={{ color: '#6b6759' }}>{t.desc}</div>
                </div>
                <ChevronRight size={18} color="#6b6759" className="flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
