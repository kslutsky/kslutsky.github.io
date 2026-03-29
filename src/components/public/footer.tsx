export function Footer() {
  return (
    <footer className="bg-[var(--bg-footer)] py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center text-sm text-[var(--text-muted)]">
        <p>
          Konstantin Slutsky &middot; Department of Mathematics, Iowa State
          University
        </p>
        <p className="mt-1">
          <a
            href="mailto:kslutsky@iastate.edu"
            className="hover:text-[var(--accent)] transition-colors duration-150"
          >
            kslutsky@iastate.edu
          </a>
        </p>
      </div>
    </footer>
  );
}
