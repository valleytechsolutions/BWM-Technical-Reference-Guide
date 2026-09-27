import React, {useState, useEffect} from 'react';
import {Sun, Moon} from 'lucide-react';
import {appAsset} from './runtime.mjs';

// Stylesheets reach the brand mark through this variable, so the path follows the app's base URL.
document.documentElement.style.setProperty('--bw-mark', `url("${appAsset('brand/black-wire-red.png')}")`);

/* Section label above each page title, e.g. "BWM Reference / Power". */
export function Kicker({children}) {
  return <div className="page-kicker"><span className="kicker-lead" aria-hidden="true"/>BWM Reference<span className="kicker-sep" aria-hidden="true">/</span><span>{children}</span></div>;
}

export function BrandMark({alt = 'Black Wire logo', ...props}) {
  return <picture className="brand-mark" {...props}>
    <img className="brand-dark" src={appAsset('brand/black-wire-red.png')} alt={alt}/>
    <img className="brand-light" src={appAsset('brand/black-wire.png')} alt={alt}/>
  </picture>;
}

export function ThemeSwitch() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
  const [temporary, setTemporary] = useState(false);
  useEffect(() => {
    const sync = e => { if (e.key === 'blackwire-theme') apply(e.newValue === 'light' ? 'light' : 'dark', false); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  function apply(value, persist = true) {
    setTheme(value);
    document.documentElement.dataset.theme = value;
    document.documentElement.style.colorScheme = value;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', value === 'dark' ? '#0a0808' : '#fbfaf8');
    if (persist) {
      try { localStorage.setItem('blackwire-theme', value); setTemporary(false); }
      catch { setTemporary(true); }
    }
  }
  return <div className="theme-control">
    <div className="theme-switch" role="group" aria-label="Color theme">
      <button type="button" aria-label="Dark mode" aria-pressed={theme === 'dark'} onClick={() => apply('dark')} title="Dark mode"><Moon size={15}/><span>Dark</span></button>
      <button type="button" aria-label="Light mode" aria-pressed={theme === 'light'} onClick={() => apply('light')} title="Light mode"><Sun size={15}/><span>Light</span></button>
    </div>
    {temporary && <span className="theme-storage-note" role="status">Theme applies to this visit; browser storage is unavailable.</span>}
  </div>;
}
