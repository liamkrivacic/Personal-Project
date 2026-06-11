type SiteFooterProps = {
  showResume: boolean;
};

export function SiteFooter({ showResume }: SiteFooterProps) {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-links">
          <a
            className="site-footer-link"
            href="https://github.com/liamkrivacic"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <a
            className="site-footer-link"
            href="https://www.linkedin.com/in/liam-krivacic-475157358/"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
          <a className="site-footer-link" href="mailto:liam.krivacic@gmail.com">
            Email
          </a>
          {showResume && (
            <a
              className="site-footer-link"
              href="/liam-krivacic-resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              Resume
            </a>
          )}
        </div>
        <p className="site-footer-copy">
          © 2026 Liam Krivacic · Built with Next.js + WebGL ·{" "}
          <a
            className="site-footer-src"
            href="https://github.com/liamkrivacic/Personal-Project"
            target="_blank"
            rel="noopener noreferrer"
          >
            Source
          </a>
        </p>
      </div>
    </footer>
  );
}
