// app/components/Layout.jsx
export default function Layout({ header, main, footer, showShell = true }) {
  return (
    <div className="grid h-[100dvh] grid-rows-[auto_1fr_auto] bg-[--color-bg] text-[--color-fg] overflow-hidden">
      {showShell && <header className="row-start-1">{header}</header>}
      <main className="row-start-2 min-h-0">{main}</main>
      {showShell && <footer className="row-start-3">{footer}</footer>}
    </div>
  );
}
