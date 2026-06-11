import type { ProjectSkill } from "@/data/projects";

type SkillPillsProps = {
  hard: ProjectSkill[];
  soft: string[];
};

export function SkillPills({ hard, soft }: SkillPillsProps) {
  return (
    <div className="prj-skills-row">
      {hard.length > 0 ? (
        <div className="prj-skills-group">
          <span className="prj-skills-group-label">Hard skills</span>
          <div className="prj-skills-pills">
            {hard.map((skill) => (
              <span key={skill.label} className="prj-skill-pill hard">
                <span>{skill.label}</span>
                {/* eslint-disable-next-line @next/next/no-img-element -- skill logos stay plain <img> per spec */}
                <img className="prj-skill-logo" src={skill.logo} alt={skill.logoAlt} />
              </span>
            ))}
          </div>
        </div>
      ) : null}
      <div className="prj-skills-group">
        <span className="prj-skills-group-label">Soft skills</span>
        <div className="prj-skills-pills">
          {soft.map((s) => (
            <span key={s} className="prj-skill-pill soft">
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
