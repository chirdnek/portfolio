interface Experience {
  role: string;
  company: string;
  period: string;
  description: string;
}

export default function ExperienceTimeline({ experiences }: { experiences: Experience[] }) {
  return (
    <section className="py-24 sm:py-32">
      <div className="container-custom">
        <div className="max-w-3xl mb-14">
          <h2 className="dd-section-title">
            <span className="dd-section-title__mark" aria-hidden>✦</span>
            Experience
          </h2>
          <p className="mt-4 dd-body" style={{ fontSize: "1rem" }}>
            A brief timeline of the work that shaped my craft.
          </p>
        </div>

        <ol className="relative max-w-3xl border-l border-[rgba(255,106,0,0.25)] pl-8 space-y-12">
          {experiences.map((exp) => (
            <li key={exp.role + exp.company} className="relative">
              {/* Timeline dot */}
              <span
                aria-hidden
                className="absolute -left-[37px] top-1.5 w-3 h-3 rounded-full bg-[#ff6a00]"
                style={{ boxShadow: "0 0 12px rgba(255,106,0,0.7)" }}
              />

              <div className="dd-year-stamp mb-3">{exp.period}</div>
              <h3 className="dd-education-degree mb-1">{exp.role}</h3>
              <p className="dd-education-school" style={{ marginTop: 0 }}>
                {exp.company}
              </p>
              <p className="dd-education-desc">{exp.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
