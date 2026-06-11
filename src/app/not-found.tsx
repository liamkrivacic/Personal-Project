import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-glow" aria-hidden="true" />
      <div className="not-found-content">
        <p className="not-found-code">404</p>
        <h1 className="not-found-title">PAST THE EVENT HORIZON</h1>
        <p className="not-found-sub">This page didn&apos;t escape. Nothing does.</p>
        <Link href="/" className="hero-link primary-link">
          Return to safety
        </Link>
      </div>
    </main>
  );
}
