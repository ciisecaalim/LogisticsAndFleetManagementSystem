import { ExternalLink, MapPinned, Navigation } from 'lucide-react';

const mapLinks = [
  {
    title: 'HQ to Airport Route',
    description: 'Fastest route for urgent cargo pickup.',
    href: 'https://www.google.com/maps/dir/New+York,+NY/JFK+Airport,+NY'
  },
  {
    title: 'Warehouse to Delivery Hub',
    description: 'Daily transfer route for distribution vans.',
    href: 'https://www.google.com/maps/dir/Brooklyn,+NY/Newark,+NJ'
  },
  {
    title: 'Truck Stop Locations',
    description: 'Nearby fuel and rest stops for long hauls.',
    href: 'https://www.google.com/maps/search/truck+stops+near+New+York'
  },
  {
    title: 'Service Centers Nearby',
    description: 'Authorized maintenance locations for fleet vehicles.',
    href: 'https://www.google.com/maps/search/vehicle+service+center+near+New+York'
  }
];

export default function MapLinksPage() {
  return (
    <section className='space-y-6'>
      <header className='flex items-start gap-3'>
        <span className='grid h-10 w-10 place-items-center rounded-xl bg-[#64748B]/15 text-[#1E293B]'>
          <MapPinned size={20} />
        </span>
        <div>
          <h1 className='m-0 text-3xl font-bold tracking-tight text-[#1E293B] sm:text-4xl'>Map Links</h1>
          <p className='mt-1 text-base font-medium text-[#1E293B] sm:text-lg'>Quick map shortcuts for routes and fleet operations</p>
        </div>
      </header>

      <article className='rounded-2xl border border-[#64748B]/20 bg-white p-6 shadow-lg shadow-slate-900/5'>
        <h2 className='m-0 text-xl font-semibold text-[#1E293B]'>Saved Map Shortcuts</h2>

        <div className='mt-5 grid gap-4 sm:grid-cols-2'>
          {mapLinks.map((item) => (
            <a
              key={item.title}
              href={item.href}
              target='_blank'
              rel='noreferrer'
              className='group rounded-xl border border-[#64748B]/15 bg-[#64748B]/5 p-4 transition hover:border-[#64748B]/40 hover:bg-white'
            >
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <p className='m-0 text-base font-semibold text-[#1E293B]'>{item.title}</p>
                  <p className='mt-1 text-sm text-[#64748B]'>{item.description}</p>
                </div>
                <ExternalLink size={16} className='mt-1 text-[#64748B] transition group-hover:text-[#1E293B]' />
              </div>
            </a>
          ))}
        </div>

        <div className='mt-6 rounded-xl border border-dashed border-[#64748B]/25 bg-[#64748B]/5 p-4'>
          <p className='m-0 flex items-center gap-2 text-sm text-[#1E293B]'>
            <Navigation size={15} className='text-[#10B981]' />
            Use these links to open navigation quickly in Google Maps.
          </p>
        </div>
      </article>
    </section>
  );
}
