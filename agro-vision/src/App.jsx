import React, { useState } from 'react';
import Home from './Home.jsx';
import CobCal from './tools/CobCal.jsx';
import DensidadSiembra from './tools/DensidadSiembra.jsx';
import SeveridadFoliar from './tools/SeveridadFoliar.jsx';

export default function App() {
  const [view, setView] = useState('home');

  if (view === 'cobcal') return <CobCal onBack={() => setView('home')} />;
  if (view === 'densidad') return <DensidadSiembra onBack={() => setView('home')} />;
  if (view === 'severidad') return <SeveridadFoliar onBack={() => setView('home')} />;
  return <Home onSelect={setView} />;
}
