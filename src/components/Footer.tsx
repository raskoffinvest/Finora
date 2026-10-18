export function Footer() {
  return (
    <footer className="border-t border-[var(--gridline)] px-4 py-8 text-xs text-[var(--text-muted)] sm:px-6">
      <div className="mx-auto max-w-6xl space-y-2">
        <p>
          Finora burada yalnızca bir ürün konsepti/demo olarak sunulmaktadır. Gösterilen
          şirket adları, ticker'lar ve finansal veriler tamamen kurgusaldır, gerçek bir
          şirketi temsil etmez.
        </p>
        <p>
          İçerikler yatırım tavsiyesi niteliği taşımaz; yalnızca bilgilendirme ve ürün
          tanıtımı amaçlıdır.
        </p>
        <p>© {new Date().getFullYear()} Finora</p>
      </div>
    </footer>
  )
}
