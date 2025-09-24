// src/app/views/AboutView.jsx
import profile from "../../../public/images/profile.jpg"; // or use "/profile.jpg" if in public/
import skills from "./skills.json";

export default function AboutView() {
  return (
    <div className="h-full p-4 overflow-auto">
      {/* Two equal columns on lg+, stacked on mobile */}
      <div className="mx-auto max-w-6xl grid h-full min-h-0 gap-4 lg:gap-6 lg:grid-cols-2 lg:items-stretch">
        
        {/* Left: full-bleed profile photo fills its half */}
        <section className="rounded-xl overflow-hidden bg-[--color-bg-elev] shadow-sm p-0 lg:h-full">
          <img
            src={profile}
            alt="James Call"
            className="block h-[360px] w-full object-cover lg:h-full" // 360px on mobile; full height on desktop
            loading="lazy"
          />
        </section>

        {/* Right: summary + skills */}
        <section className="rounded-xl bg-[--color-bg-elev] shadow-sm p-4 sm:p-6 flex flex-col">
          <header className="mb-4">
            <h1 className="h-title">James Call</h1>
            <p className="text-[--color-muted]">Web Software Engineer & Designer</p>
          </header>

          <div className="prose max-w-none text-[--color-fg] prose-p:my-0">
            <h2 className="h-lead mb-2">About Me</h2>
            <p className="text-[--color-muted] leading-relaxed">
              I’m a web software engineer/designer focused on interactive 3D experiences with
              React Three Fiber and Three.js. I enjoy building clean, modular frontends and tying
              them to data-driven visuals—whether that’s character configurators, molecule viewers,
              or educational simulations. Beyond code, I’m into 3D modeling, creative writing
              and reading history and science.
            </p>
          </div>

          <div className="mt-6">
            <h3 className="h-subtitle mb-2">Skills</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(skills).map(([group, list]) => (
                <div
                  key={group}
                  className="rounded-lg border border-[color-mix(in_srgb,currentColor,transparent_80%)]/40 p-3"
                >
                  <div className="mb-2 font-medium text-[--color-fg]">{group}</div>
                  <div className="flex flex-wrap gap-2">
                    {list.map((s) => (
                      <span key={s} className="chip text-sm" aria-label={s} title={s}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Spacer to keep padding at bottom when content is short */}
          <div className="mt-4" />
        </section>
      </div>
    </div>
  );
}
