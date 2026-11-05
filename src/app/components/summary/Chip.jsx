export default function Chip({
  label,
  color = "#3285e8",
  textColor = "#ffffff",
  active = false,
  previewed = false,
  onClick,
  refCallback,
}) {
  return (
    <button
      ref={refCallback}
      type="button"
      aria-selected={active}
      className={[
        "project-chip",
        active ? "is-active" : "",
        previewed && !active ? "is-preview" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        "--chip-color": color,
        "--chip-text-color": textColor,
      }}
      onClick={onClick}
      title={label}
    >
      {label}
    </button>
  );
}