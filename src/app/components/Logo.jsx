export default function Logo({size=28,className=''}) {
  return <span className={`portfolio-logo ${className}`} style={{width:size,height:size}} aria-hidden="true"/>;
}
