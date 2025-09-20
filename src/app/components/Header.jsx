import Logo from "./Logo.jsx";
import Nav from "./Nav.jsx";

export default function Header({ active, onNavigate }) {
  return (
    <div className="flex items-center h-14 px-3 sm:px-4 bg-[--bg-elev] shadow-[--shadow-sm]">
      {/* Left cluster: logo + title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <Logo size={28} />
        <span className="h-title truncate">James Call — Portfolio</span>
      </div>

      {/* Spacer that shrinks as viewport narrows */}
      <div className="flex-1 min-w-[8px]" />

      {/* Right cluster: nav */}
      <Nav active={active} onNavigate={onNavigate} />
    </div>
  );
}
