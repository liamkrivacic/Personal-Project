import Link from "next/link";

type MiniNavProps = {
  isStatic?: boolean;
};

export function MiniNav({ isStatic }: MiniNavProps) {
  return (
    <nav
      className={`mini-nav${isStatic ? " mini-nav--static" : ""}`}
      aria-label="Site navigation"
    >
      <Link className="mini-nav-brand" href="/">
        Liam Krivacic
      </Link>
      <div className="mini-nav-links">
        <Link className="mini-nav-link" href="/#projects">
          Projects
        </Link>
        <a
          className="mini-nav-link"
          href="https://github.com/liamkrivacic"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        <a className="mini-nav-link" href="mailto:liam.krivacic@gmail.com">
          Contact
        </a>
      </div>
    </nav>
  );
}
