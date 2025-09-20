export default function Chip({ label, active = false, onClick }) {
  return (
    <button
      type="button"
      aria-selected={active ? "true" : "false"}
      className={`chip hover:scale-[1.02] transition ${
        active ? "aria-selected:true" : ""
      }`}
      onClick={onClick}
      title={label}
    >
      {label}
    </button>
  );
}
