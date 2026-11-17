/** Keep project evidence readable immediately; ambient motion must not delay copy. */
export default function SummaryParagraph({title='Welcome',tech=[],text=''}) {
  return <div className="surface p-3"><h2 className="h-lead">{title}</h2><div className="work-tags">{tech.map(tag=><span key={tag}>{tag}</span>)}</div><div className="summary__description-scroll"><p className="text-muted">{text}</p></div></div>;
}
