import { BarChart3, Download } from 'lucide-react';

export default function ReportsPage() {
  return (
    <section className='space-y-6'>
      <header className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <h1 className='m-0 text-3xl font-bold tracking-tight text-[#1E293B] sm:text-4xl'>Reports</h1>
          <p className='mt-1 text-base font-medium text-[#1E293B] sm:text-lg'>View and export fleet performance reports</p>
        </div>

        <button
          type='button'
          className='inline-flex items-center gap-2 rounded-xl bg-[#020617] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1E293B]'
        >
          <Download size={17} />
          Export
        </button>
      </header>

      <article className='rounded-2xl border border-[#64748B]/20 bg-white p-6 shadow-lg shadow-slate-900/5'>
        <div className='flex items-center gap-3'>
          <BarChart3 className='text-[#10B981]' size={22} />
          <p className='m-0 text-base font-semibold text-[#1E293B]'>Monthly reports are ready to review.</p>
        </div>
      </article>
    </section>
  );
}
