export default function Layout({ header, main, footer }) {
  return (
    <div className="grid h-[100dvh] grid-rows-[auto_1fr_auto] bg-[--color-bg] text-[--color-fg] overflow-hidden">
      <header className="row-start-1">{header}</header>
      <main className="row-start-2 min-h-0">{main}</main>
      <footer className="row-start-3">{footer}</footer>
    </div>
  );
}
