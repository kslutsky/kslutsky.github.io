export function Footer() {
  return (
    <footer className="border-t border-stone-200 py-8 mt-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center text-sm text-stone-400">
        <p>
          Konstantin Slutsky &middot; Department of Mathematics, Iowa State
          University
        </p>
        <p className="mt-1">
          <a
            href="mailto:kslutsky@iastate.edu"
            className="hover:text-stone-600 transition-colors duration-150"
          >
            kslutsky@iastate.edu
          </a>
        </p>
      </div>
    </footer>
  );
}
