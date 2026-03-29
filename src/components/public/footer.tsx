export function Footer() {
  return (
    <footer className="bg-[var(--bg-footer)] h-14 flex items-center">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 w-full flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>
          Iowa State University &middot;{" "}
          <a href="mailto:kslutsky@iastate.edu" className="hover:text-[var(--accent)] transition-colors duration-150">
            kslutsky@iastate.edu
          </a>
        </span>
        <span>
          Venti Technologies &middot;{" "}
          <a href="mailto:kostya@ventitechnologies.com" className="hover:text-[var(--accent)] transition-colors duration-150">
            kostya@ventitechnologies.com
          </a>
        </span>
      </div>
    </footer>
  );
}
