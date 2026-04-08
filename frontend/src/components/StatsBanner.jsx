const toneClasses = {
  slate: 'from-slate-500 to-slate-600 text-white',
  emerald: 'from-emerald-500 to-emerald-600 text-white',
  blue: 'from-sky-500 to-cyan-500 text-white',
  amber: 'from-amber-500 to-orange-500 text-white'
};

export default function StatsBanner({ items, error }) {
  return (
    <section className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      {items.map((item) => (
        <article
          key={item.key}
          className='flex items-center justify-between rounded-[24px] border border-[#e2e8f0] bg-white px-5 py-4 shadow-sm'
        >
          <div>
            <p className='text-[10px] font-semibold uppercase tracking-[0.3em] text-[#94a3b8]'>{item.label}</p>
            <p className='mt-2 text-3xl font-bold text-[#0f172a]'>{item.value ?? '0'}</p>
            <p className='mt-1 text-sm font-medium text-[#475569]'>{item.helper}</p>
          </div>
          <div
            className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br shadow ${toneClasses[item.tone] || toneClasses.slate}`}
          >
            <item.icon size={24} />
          </div>
        </article>
      ))}

      {error ? (
        <div className='lg:col-span-4'>
          <p className='rounded-xl border border-[#fecaca] bg-[#fff1f0] px-4 py-2 text-sm text-[#b45309]'>{error}</p>
        </div>
      ) : null}
    </section>
  );
}
