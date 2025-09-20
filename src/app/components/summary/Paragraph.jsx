export default function Paragraph({ title = "Welcome", text = "" }) {
  return (
    <div className="surface p-3">
      <div className="h-lead mb-1">{title}</div>
      <p className="text-muted">{text}</p>
    </div>
  );
}
