import { ArrowRight, Filter, MapPin, Route } from 'lucide-react';

const filterOptions = [
  { key: 'all', label: 'All Vehicles' },
  { key: 'active', label: 'Active Only' },
  { key: 'idle', label: 'Idle Only' }
];

export default function InfoPanel({
  searchTerm,
  onSearchTermChange,
  filterMode,
  onFilterModeChange,
  metrics,
  visibleCount,
  totalCount,
  routeStart,
  routeEnd
}) {
  return (
    <aside className='space-y-4 text-[1em]'>
      <div className='rounded-2xl border border-[#64748B]/15 bg-white p-5 shadow-lg shadow-slate-900/5'>
        <div className='grid grid-cols-[40px_1fr] items-start gap-3'>
          <span className='grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#64748B]/15 text-[#1E293B]'>
            <MapPin size={18} />
          </span>
          <div>
            <p className='m-0 text-[0.75em] font-bold uppercase tracking-[0.24em] text-[#64748B]'>Fleet Tracking Map</p>
            <h2 className='mt-1 text-[1.1em] font-semibold text-[#1E293B]'>Overview</h2>
          </div>
        </div>

        <label className='mt-4 grid grid-cols-[auto_1fr] items-center gap-2 rounded-xl border border-[#64748B]/20 bg-slate-50 px-3 py-2 text-[1em] text-[#64748B]'>
          <Filter size={14} />
          <input
            type='text'
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder='Search location, vehicle, or driver'
            className='w-full bg-transparent text-[1em] text-[#1E293B] outline-none placeholder:text-[#94A3B8]'
          />
        </label>

        <div className='mt-4 grid gap-2 sm:grid-cols-3 lg:max-w-md'>
          {filterOptions.map((option) => (
            <button
              key={option.key}
              type='button'
              onClick={() => onFilterModeChange(option.key)}
              className={`rounded-full px-3 py-2 text-[0.85em] font-semibold transition ${
                filterMode === option.key
                  ? 'bg-[#1E293B] text-white shadow-sm'
                  : 'bg-[#64748B]/10 text-[#1E293B] hover:bg-[#64748B]/15'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className='mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'>
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <div key={metric.label} className='grid min-h-28 grid-cols-[1fr_auto] items-center gap-4 rounded-xl border border-[#64748B]/15 bg-[#64748B]/5 p-4'>
                <div>
                  <p className='m-0 text-[0.75em] font-semibold uppercase tracking-[0.18em] text-[#64748B]'>{metric.label}</p>
                  <p className='mt-2 text-[1.2em] font-bold text-[#1E293B]'>{metric.value}</p>
                </div>
                <span className='grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#1E293B] shadow-sm'>
                  <Icon size={18} />
                </span>
              </div>
            );
          })}
        </div>

        <div className='mt-5 rounded-xl border border-dashed border-[#64748B]/20 bg-[#64748B]/5 p-4'>
          <div className='grid grid-cols-[1fr_auto_1fr] items-center gap-3'>
            <div>
              <p className='m-0 text-[0.75em] font-semibold uppercase tracking-[0.18em] text-[#64748B]'>Route</p>
              <p className='mt-1 text-[1em] font-semibold text-[#1E293B]'>{routeStart}</p>
            </div>
            <ArrowRight size={16} className='justify-self-center text-[#64748B]' />
            <div className='text-right'>
              <p className='m-0 text-[0.75em] font-semibold uppercase tracking-[0.18em] text-[#64748B]'>Destination</p>
              <p className='mt-1 text-[1em] font-semibold text-[#1E293B]'>{routeEnd}</p>
            </div>
          </div>
          <div className='mt-3 grid grid-cols-[auto_1fr] items-center gap-2 text-[1em] text-[#64748B]'>
            <Route size={15} className='text-[#10B981]' />
            {visibleCount} of {totalCount} vehicles visible
          </div>
        </div>
      </div>

    </aside>
  );
}
