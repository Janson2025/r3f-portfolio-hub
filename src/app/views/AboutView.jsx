import { skillExamples, resolveSkillExample } from '../../features/about/skillExamples.js';
import { getProjects } from '../../features/projects/queries.js';
import SkillLink from '../components/about/SkillLink.jsx';
import { profile } from '../../data/profile.js';
import PortraitReveal from '../components/PortraitReveal.jsx';
import ProfessionalBackground from '../components/about/ProfessionalBackground.jsx';
import AvatarIntroduction from '../components/about/AvatarIntroduction.jsx';

export default function AboutView() {
  return <div className="portfolio-container portfolio-page about-page">
    <header className="about-profile-header"><div><p className="overline">HELLO, I’M JAMES CALL</p><h1>A builder with<br/>a designer’s curiosity<span className="accent-dot">.</span></h1><p className="page-intro">{profile.role}</p></div><PortraitReveal className="about-profile-image" /></header>
    <div className="about-flow">
      <aside className="about-avatar-float" aria-label="Animated introduction"><AvatarIntroduction floating text={profile.bio} /></aside>
      <section className="portfolio-prose"><h2>About me</h2><p>{profile.bio}</p></section>
      <section className="portfolio-prose"><h2>How I approach the work</h2><p>Clear interfaces, modular code, and a solid foundation for creative exploration. The useful parts of an experience should always be easy to reach.</p><div className="page-actions"><a className="portfolio-button" href="#/contact">Get in touch ↗</a>{profile.resume && <a className="portfolio-link" href={profile.resume}>View resume ↗</a>}</div><p><a className="portfolio-link" href={profile.previousPortfolio} target="_blank" rel="noopener noreferrer">Visit the previous portfolio ↗</a></p></section>
      <section className="about-flow-skills"><h2>Tools & skills</h2>{Object.entries(skillExamples).map(([group, list]) => <section className="skill-type-row" key={group}><h3>{group}</h3><div>{list.map(skill => {const example=resolveSkillExample(skill,getProjects(),profile.image);return example?<SkillLink key={skill.label} label={skill.label} example={example}/>:null;})}</div></section>)}</section>
      <ProfessionalBackground/>
    </div>
  </div>;
}
