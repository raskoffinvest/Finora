const STATS = [
  { label: 'Taranan BIST şirketi', value: '400+' },
  { label: 'Hesaplanan skor modeli', value: '4' },
  { label: 'Ücretsiz / Pro katman', value: '2' },
]

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:px-6">
      <div className="max-w-2xl">
        <p className="mb-3 inline-block rounded-full bg-[var(--brand)]/10 px-3 py-1 text-xs font-medium text-[var(--brand-ink)]">
          BIST için yapay zekâ destekli temel analiz
        </p>
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Bilançoyu okumak yerine{' '}
          <span className="text-[var(--brand)]">skoru okuyun</span>
        </h1>
        <p className="mt-4 text-lg text-[var(--text-secondary)]">
          Finora; fiyat, kalite ve finansal sağlık skorlarını bir araya getirip hangi
          hissenin ucuz, sağlam ve temettüsü büyüyen olduğunu saniyeler içinde gösterir.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="#tarama"
            className="rounded-lg bg-[var(--brand)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--brand-ink)]"
          >
            Hisseleri Taramaya Başla
          </a>
          <a
            href="#fiyatlandirma"
            className="rounded-lg border border-[var(--border-hairline)] px-5 py-2.5 text-sm font-medium hover:bg-black/[0.03]"
          >
            Pro Özellikleri Gör
          </a>
        </div>
      </div>
      <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-[var(--gridline)] pt-6 sm:max-w-xl">
        {STATS.map((stat) => (
          <div key={stat.label}>
            <dt className="text-xs text-[var(--text-muted)]">{stat.label}</dt>
            <dd className="text-xl font-semibold tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
