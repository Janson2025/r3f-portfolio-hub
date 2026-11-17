import { useEffect, useRef } from 'react';

export default function DetailDialog({ service, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement, overflow = document.body.style.overflow;
    const element = dialog.current;
    element.showModal(); document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); };
  }, []);
  const trapFocus = event => {
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.current.querySelectorAll('button:not(:disabled),a[href]')];
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  return <dialog className="service-dialog" ref={dialog} aria-labelledby="service-title" onKeyDown={trapFocus} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === dialog.current) { const r = dialog.current.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) onClose(); } }}>
    <button autoFocus className="dialog-close" onClick={onClose} aria-label="Close service details">×</button>
    <p className="overline">LET’S MAKE SOMETHING</p><h2 id="service-title">{service.title}</h2><p>{service.details}</p><h3>Possible scope</h3><ul>{service.scope.map(item => <li key={item}>{item}</li>)}</ul><p className="content-note">Scope, timing, and availability are discussed individually.</p><a className="portfolio-button" href="#/contact" onClick={onClose}>Discuss a project ↗</a>
  </dialog>;
}
