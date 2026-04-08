const toneStyles = {
  slate: { iconBg: '#edf2f7', border: '#475569', iconColor: '#475569' },
  emerald: { iconBg: '#dcfce7', border: '#10b981', iconColor: '#047857' },
  blue: { iconBg: '#dbf4ff', border: '#38bdf8', iconColor: '#0f172a' },
  amber: { iconBg: '#fff7ed', border: '#f97316', iconColor: '#92400e' }
};

export default function StatsBanner({ items, error }) {
  return (
    <section className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      {items.map((item) => {
        const tone = toneStyles[item.tone] || toneStyles.slate;
        return (
          <article
            key={item.key}
            className='flex items-start justify-between rounded-[24px] bg-white px-5 py-4 shadow-sm'
            style={{ border: '1px solid #e2e8f0', borderTop: `3px solid ${tone.border}` }}
          >
            <div>
              <p className='text-[11px] font-semibold uppercase tracking-[0.12em] text-[#94a3b8]'>{item.label}</p>
              <p className='mt-3 font-bold text-[#0f172a]' style={{ fontSize: '2em' }}>
                {item.value ?? '0'}
              </p>
              <p className='mt-1 text-sm font-medium text-[#475569]'>{item.helper}</p>
            </div>
            <div
              className='grid h-14 w-14 place-items-center rounded-2xl shadow'
              style={{ backgroundColor: tone.iconBg, color: tone.iconColor }}
            >
              <item.icon size={24} />
            </div>
          </article>
        );
      })}
      {error ? (
        <div className='lg:col-span-4'>
          <p className='rounded-xl border border-[#fecaca] bg-[#fff1f0] px-4 py-2 text-sm text-[#b45309]'>{error}</p>
        </div>
      ) : null}
    </section>
  );
}
