export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-[var(--border-hairline)] bg-[var(--surface-1)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand)] font-bold text-white">
            F
          </div>
          <span className="text-lg font-semibold tracking-tight">Finora</span>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-[var(--text-secondary)] sm:flex">
          <a href="#tarama" className="hover:text-[var(--text-primary)]">
            Hisse Taraması
          </a>
          <a href="#fiyatlandirma" className="hover:text-[var(--text-primary)]">
            Fiyatlandırma
          </a>
          <a href="#sss" className="hover:text-[var(--text-primary)]">
            SSS
          </a>
        </nav>
        <button
          type="button"
          className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-ink)]"
        >
          Ücretsiz Başla
        </button>
      </div>
    </header>
  )
}
