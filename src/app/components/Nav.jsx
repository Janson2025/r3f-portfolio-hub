export default function Nav({ active = "projects", onNavigate }) {
  const LinkBtn = ({ id, label }) => (
    <button
      onClick={() => onNavigate?.(id)}
      aria-current={active === id ? "page" : undefined}
      className={`px-2 py-1 rounded-md hover:underline focus:outline focus:outline-2 focus:outline-[--color-accent] ${
        active === id ? "underline" : ""
      }`}
    >
      {label}
    </button>
  );

  return (
    <nav aria-label="Primary" className="flex items-center gap-4 sm:gap-6">
      <LinkBtn id="projects" label="Projects" />
      <LinkBtn id="about" label="About" />
      {/* External link for old portfolio */}
      <a
        href="https://jacall2016.github.io/newPortfolio/"
        target="_blank"
        rel="noopener noreferrer"
        className="px-2 py-1 rounded-md hover:underline focus:outline focus:outline-2 focus:outline-[--color-accent]"
      >
        Old Portfolio
      </a>
    </nav>
  );
}
