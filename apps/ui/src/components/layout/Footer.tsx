export function Footer() {
  return (
    <footer className="h-12 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
      <div className="h-full px-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
        <div>
          <span>CityReach Innovation Labs v1.0</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/docs"
            className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            Documentation
          </a>
          <a
            href="/support"
            className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            Support
          </a>
        </div>
      </div>
    </footer>
  );
}
