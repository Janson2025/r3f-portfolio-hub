import skills from "./skills.json";

export default function AboutView() {
  return (
    <div className="h-full overflow-auto p-4">
      <div
        className="
          mx-auto grid h-full min-h-0 max-w-6xl
          gap-4 lg:grid-cols-2 lg:items-stretch lg:gap-6
        "
      >
        {/* Profile image */}
        <section className="overflow-hidden rounded-xl bg-[--color-bg-elev] p-0 shadow-sm lg:h-full">
          <img
            src="/images/profile.jpg"
            alt="James Call"
            className="block h-[360px] w-full object-cover lg:h-full"
            loading="lazy"
            onError={(event) => {
              // Hide the image if the optional profile asset is unavailable.
              event.currentTarget.style.display = "none";
            }}
          />
        </section>

        {/* About information */}
        <section className="flex flex-col rounded-xl bg-[--color-bg-elev] p-4 shadow-sm sm:p-6">
          <header className="mb-4">
            <h1 className="h-title">James Call</h1>

            <p className="text-[--color-muted]">
              Web Software Engineer & Designer
            </p>
          </header>

          <div className="prose max-w-none text-[--color-fg] prose-p:my-0">
            <h2 className="h-lead mb-2">About Me</h2>

            <p className="leading-relaxed text-[--color-muted]">
              I’m a web software engineer/designer focused on interactive 3D
              experiences with React Three Fiber and Three.js. I enjoy building
              clean, modular frontends and tying them to data-driven visuals—
              whether that’s character configurators, molecule viewers, or
              educational simulations. Beyond code, I’m into 3D modeling,
              creative writing and reading history and science.
            </p>
          </div>

          {/* Skills */}
          <div className="mt-6">
            <h3 className="h-subtitle mb-2">Skills</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(skills).map(([group, list]) => (
                <div
                  key={group}
                  className="
                    rounded-lg border
                    border-[color-mix(in_srgb,currentColor,transparent_80%)]/40
                    p-3
                  "
                >
                  <div className="mb-2 font-medium text-[--color-fg]">
                    {group}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {list.map((skill) => (
                      <span
                        key={skill}
                        className="chip text-sm"
                        aria-label={skill}
                        title={skill}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4" />
        </section>
      </div>
    </div>
  );
}