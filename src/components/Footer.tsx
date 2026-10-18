export function Footer({ sources }: { sources: string[] }) {
  return (
    <footer className="border-t border-[var(--gridline)] px-4 py-8 text-xs text-[var(--text-muted)] sm:px-6">
      <div className="mx-auto max-w-6xl space-y-2">
        <p>
          Piyasa ve finansal tablo verileri halka açık kaynaklardan otomatik derlenir; gecikmeli veya
          hatalı olabilir.{sources.length > 0 && ` Kaynaklar: ${sources.join(' · ')}.`}
        </p>
        <p>
          Burada yer alan bilgi, skor ve analizler yatırım danışmanlığı kapsamında değildir; yalnızca
          bilgilendirme amaçlıdır.
        </p>
        <p>© {new Date().getFullYear()} Finora</p>
      </div>
    </footer>
  )
}
