import Link from 'next/link'
import { CheckCircle2, ChefHat, LayoutGrid, ShoppingCart, Wifi, Zap } from 'lucide-react'

const FEATURES = [
  { icon: ShoppingCart, title: 'POS + KDS Realtime', desc: 'Kasir dan dapur terhubung langsung. Order masuk, dapur langsung tahu.' },
  { icon: ChefHat, title: 'QR Order Mandiri', desc: 'Customer scan QR di meja, pesan sendiri. Tidak perlu antri ke kasir.' },
  { icon: LayoutGrid, title: 'Denah Visual', desc: 'Atur layout meja secara drag-drop. Lihat status meja sekilas.' },
  { icon: Wifi, title: 'Mode Offline', desc: 'Internet mati? POS tetap jalan. Order tersimpan, sync otomatis saat online.' },
  { icon: Zap, title: 'Marketplace Sync', desc: 'Terima order GoFood & GrabFood langsung ke KDS. Tanpa input manual.' },
  { icon: CheckCircle2, title: 'Laporan Lengkap', desc: 'Revenue, HPP, margin per menu, waste tracking — semua dalam satu dashboard.' },
]

const PLANS = [
  {
    name: 'Basic',
    price: '199',
    period: 'bulan',
    color: 'border-border',
    features: ['1 outlet', '5 user', 'POS & KDS', 'QR Order', 'Laporan dasar'],
    cta: 'Mulai Gratis 14 Hari',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '499',
    period: 'bulan',
    color: 'border-primary',
    features: ['5 outlet', '20 user', 'Semua Basic', 'Inventori & PO', 'Loyalty & Voucher', 'Reservasi', 'Ekspor PDF/Excel'],
    cta: 'Coba Pro Gratis',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    color: 'border-border',
    features: ['Outlet tak terbatas', 'User tak terbatas', 'Semua Pro', 'Dapur Pusat', 'Marketplace Sync', 'WhatsApp & Kampanye', 'API Akses'],
    cta: 'Hubungi Kami',
    highlight: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navbar */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-xl font-bold text-blue-700">LARIS</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">Masuk</Link>
            <Link href="/login" className="text-sm bg-blue-700 text-white px-4 py-1.5 rounded-full hover:bg-blue-800 transition-colors">
              Coba Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-3xl mx-auto">
          <div className="inline-block mb-4 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold tracking-wide">
            Platform F&B SaaS #1 Indonesia
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5 text-gray-900">
            Sistem Kasir Modern<br />untuk Bisnis F&B Kamu
          </h1>
          <p className="text-lg text-gray-500 mb-8 leading-relaxed">
            POS, KDS, QR Order, Inventory, Loyalty — semua dalam satu platform. Mulai dari warung kecil sampai chain restoran.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login" className="bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-800 transition-colors text-sm">
              Coba Gratis 14 Hari
            </Link>
            <a href="#fitur" className="border border-gray-200 text-gray-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm">
              Lihat Fitur →
            </a>
          </div>
          <p className="mt-4 text-xs text-gray-400">Tidak perlu kartu kredit · Setup 5 menit</p>
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-3">Fitur Lengkap untuk Operasional Sehari-hari</h2>
          <p className="text-gray-500 text-center text-sm mb-12">Dari kasir hingga laporan keuangan — LARIS punya semuanya</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
                  <f.icon className="h-5 w-5 text-blue-700" />
                </div>
                <h3 className="font-semibold mb-1 text-sm">{f.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-3">Harga Transparan, Tanpa Biaya Tersembunyi</h2>
          <p className="text-gray-500 text-center text-sm mb-12">Semua paket sudah termasuk support & update fitur</p>
          <div className="grid sm:grid-cols-3 gap-6">
            {PLANS.map(p => (
              <div key={p.name} className={`bg-white rounded-2xl border-2 p-6 flex flex-col ${p.color} ${p.highlight ? 'shadow-lg relative' : ''}`}>
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-700 text-white text-xs rounded-full font-semibold">
                    Paling Populer
                  </div>
                )}
                <div className="mb-5">
                  <p className="font-semibold text-gray-500 text-sm">{p.name}</p>
                  <div className="flex items-end gap-1 mt-1">
                    {p.price === 'Custom' ? (
                      <span className="text-2xl font-bold">Custom</span>
                    ) : (
                      <>
                        <span className="text-3xl font-extrabold">Rp {p.price}rb</span>
                        <span className="text-gray-400 text-sm pb-0.5">/{p.period}</span>
                      </>
                    )}
                  </div>
                </div>
                <ul className="space-y-2 flex-1 mb-6">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={`text-center text-sm py-2.5 rounded-xl font-semibold transition-colors ${
                    p.highlight
                      ? 'bg-blue-700 text-white hover:bg-blue-800'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-blue-700 text-white text-center">
        <h2 className="text-2xl font-bold mb-3">Siap Upgrade Bisnis F&B Kamu?</h2>
        <p className="text-blue-200 text-sm mb-8">Bergabung dengan ratusan restoran & cafe yang sudah pakai LARIS</p>
        <Link href="/login" className="bg-white text-blue-700 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors text-sm">
          Mulai Gratis Sekarang
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t text-center text-xs text-gray-400">
        © 2026 LARIS — Layanan, Antrian, Reservasi, Inventory & Sales · larisapp.id
      </footer>
    </div>
  )
}
