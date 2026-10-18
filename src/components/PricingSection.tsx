const PLANS = [
  {
    name: 'Ücretsiz',
    price: '0 TL',
    description: 'Tüm temel piyasa ve şirket verilerine erişim.',
    features: [
      'Fiyat Skoru (ucuz/pahalı göstergesi)',
      'F-Score ile finansal sağlık taraması',
      'Z-Score ile iflas riski göstergesi',
      'TL ve $ bazlı temettü geçmişi',
    ],
  },
  {
    name: 'Pro',
    price: '₺417/ay',
    description: 'Yapay zekâ destekli derinlemesine analiz ve portföy araçları.',
    features: [
      'ProScore ile kapsamlı kalite skoru',
      'Yapay zekâ destekli şirket yorumları',
      'Gerçek Değer Analizi',
      'Portföy bazlı risk/getiri analizi',
    ],
    highlighted: true,
  },
]

export function PricingSection() {
  return (
    <section id="fiyatlandirma" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h2 className="text-2xl font-semibold tracking-tight">Fiyatlandırma</h2>
      <p className="mt-2 max-w-xl text-[var(--text-secondary)]">
        Ücretsiz katmanla başlayın, derinlemesine yapay zekâ analizine ihtiyaç
        duyduğunuzda Pro'ya geçin.
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl border p-6 ${
              plan.highlighted
                ? 'border-[var(--brand)] bg-[var(--brand)]/5'
                : 'border-[var(--border-hairline)] bg-[var(--surface-1)]'
            }`}
          >
            <h3 className="text-lg font-semibold">{plan.name}</h3>
            <p className="mt-1 text-2xl font-bold tabular-nums">{plan.price}</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{plan.description}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-0.5 text-[var(--status-good)]" aria-hidden="true">
                    ✓
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-[var(--text-muted)]">
        Fiyatlandırma örnek amaçlıdır ve yalnızca gösterim içindir.
      </p>
    </section>
  )
}
