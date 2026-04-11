import { CircleCheckBig, Clock3, PackagePlus, Pencil, Plus, TimerReset, Truck, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'lfms_order_fulfillment_items';

const INITIAL_ORDERS = [
  {
    id: 'ORD-0012',
    date: 'Today at 10:30 AM',
    priority: 'Urgent',
    itemsCount: 12,
    stage: 'Pending'
  },
  {
    id: 'ORD-0013',
    date: 'Today at 11:15 AM',
    priority: 'Standard',
    itemsCount: 8,
    stage: 'Picking'
  },
  {
    id: 'ORD-0014',
    date: 'Today at 01:20 PM',
    priority: 'Standard',
    itemsCount: 20,
    stage: 'Packed'
  },
  {
    id: 'ORD-0015',
    date: 'Today at 02:05 PM',
    priority: 'Urgent',
    itemsCount: 5,
    stage: 'Ready'
  }
];

const STAGE_SEQUENCE = ['Pending', 'Picking', 'Packed', 'Ready', 'Shipped'];
const FILTERS = ['All', 'Pending', 'Picking', 'Packed', 'Shipped'];

function createEmptyForm() {
  return {
    orderId: '',
    priority: 'Standard',
    itemsCount: '1',
    stage: 'Pending'
  };
}

function readStoredOrders() {
  if (typeof window === 'undefined') {
    return new Array();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : INITIAL_ORDERS;
  } catch {
    return INITIAL_ORDERS;
  }
}

function writeStoredOrders(items) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function priorityClasses(priority) {
  if (priority === 'Urgent') {
    return 'bg-rose-100 text-rose-700';
  }

  return 'bg-slate-100 text-slate-600';
}

function stageClasses(stage) {
  if (stage === 'Shipped' || stage === 'Ready') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (stage === 'Packed') {
    return 'bg-sky-100 text-sky-700';
  }

  if (stage === 'Picking') {
    return 'bg-amber-100 text-amber-700';
  }

  return 'bg-slate-100 text-slate-600';
}

function nextStage(stage) {
  const index = STAGE_SEQUENCE.indexOf(stage);

  if (index === -1 || index === STAGE_SEQUENCE.length - 1) {
    return stage;
  }

  return STAGE_SEQUENCE[index + 1];
}

function getMetrics(items) {
  return {
    newOrders: items.filter((item) => item.stage === 'Pending').length,
    processing: items.filter((item) => item.stage === 'Picking' || item.stage === 'Packed').length,
    ready: items.filter((item) => item.stage === 'Ready').length,
    delayed: items.filter((item) => item.priority === 'Urgent' && item.stage !== 'Shipped').length
  };
}

export default function OrderFulfillmentPage() {
  const [orders, setOrders] = useState(new Array());
  const [filter, setFilter] = useState('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState(createEmptyForm);

  useEffect(() => {
    const stored = readStoredOrders();
    setOrders(stored);
  }, []);

  const persistOrders = (items) => {
    setOrders(items);
    writeStoredOrders(items);
  };

  const openCreateForm = () => {
    setFormData(createEmptyForm());
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormData(createEmptyForm());
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedOrderId = formData.orderId.trim();
    const itemsCount = Number(formData.itemsCount);

    if (!trimmedOrderId || Number.isNaN(itemsCount) || itemsCount <= 0) {
      return;
    }

    const nextOrder = {
      id: trimmedOrderId,
      date: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      priority: formData.priority,
      itemsCount,
      stage: formData.stage
    };

    persistOrders([nextOrder, ...orders]);
    closeForm();
  };

  const processOrder = (orderId) => {
    const nextOrders = orders.map((order) => {
      if (order.id !== orderId) {
        return order;
      }

      return {
        ...order,
        stage: nextStage(order.stage)
      };
    });

    persistOrders(nextOrders);
  };

  const filteredOrders = orders.filter((order) => filter === 'All' || order.stage === filter);
  const metrics = getMetrics(orders);

  return (
    <section className='space-y-6 rounded-3xl bg-gray-50 p-5 sm:p-6'>
      <header className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.28em] text-slate-400'>Order Fulfillment Dashboard</p>
          <h1 className='mt-1 text-3xl font-bold tracking-tight text-slate-800'>Order Fulfillment Queue</h1>
          <p className='mt-1 text-sm text-slate-500'>Track order progress from pending to shipped in a simple queue view.</p>
        </div>

        <button
          type='button'
          onClick={openCreateForm}
          className='inline-flex items-center gap-2 rounded-[18px] border border-slate-950/90 bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)] transition hover:bg-slate-800'
        >
          <span className='grid h-6 w-6 place-items-center rounded-full bg-white/10'>
            <Plus size={14} />
          </span>
          Create Order
        </button>
      </header>

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <article className='rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]'>
          <p className='text-sm font-medium text-slate-500'>New Orders</p>
          <h2 className='mt-3 text-3xl font-bold text-slate-900'>{metrics.newOrders}</h2>
        </article>

        <article className='rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]'>
          <p className='text-sm font-medium text-slate-500'>Currently Processing</p>
          <h2 className='mt-3 text-3xl font-bold text-slate-900'>{metrics.processing}</h2>
          <p className='mt-1 text-sm text-slate-500'>Picking / Packing</p>
        </article>

        <article className='rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]'>
          <p className='text-sm font-medium text-slate-500'>Ready for Dispatch</p>
          <h2 className='mt-3 text-3xl font-bold text-emerald-600'>{metrics.ready}</h2>
        </article>

        <article className='rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]'>
          <p className='text-sm font-medium text-slate-500'>Delayed/Issues</p>
          <h2 className='mt-3 text-3xl font-bold text-rose-600'>{metrics.delayed}</h2>
        </article>
      </div>

      <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
        <div className='flex flex-wrap gap-2'>
          {FILTERS.map((item) => (
            <button
              key={item}
              type='button'
              onClick={() => setFilter(item)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === item
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className='overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)]'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-slate-200'>
            <thead className='bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'>
              <tr>
                <th className='px-6 py-4'>Order ID & Date</th>
                <th className='px-6 py-4'>Priority</th>
                <th className='px-6 py-4'>Items Count</th>
                <th className='px-6 py-4'>Fulfillment Stage</th>
                <th className='px-6 py-4'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100'>
              {filteredOrders.map((order) => (
                <tr key={order.id} className='hover:bg-slate-50/70'>
                  <td className='px-6 py-4'>
                    <p className='text-sm font-semibold text-slate-900'>{order.id}</p>
                    <p className='mt-1 text-sm text-slate-500'>{order.date}</p>
                  </td>
                  <td className='px-6 py-4'>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityClasses(order.priority)}`}>
                      {order.priority}
                    </span>
                  </td>
                  <td className='px-6 py-4 text-sm font-semibold text-slate-700'>{order.itemsCount}</td>
                  <td className='px-6 py-4'>
                    <div className='flex items-center gap-2'>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${stageClasses(order.stage)}`}>
                        {order.stage}
                      </span>
                      <div className='h-2 w-24 overflow-hidden rounded-full bg-slate-200'>
                        <div
                          className='h-full rounded-full bg-slate-900'
                          style={{ width: `${(STAGE_SEQUENCE.indexOf(order.stage) + 1) * 20}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4'>
                    <button
                      type='button'
                      onClick={() => processOrder(order.id)}
                      className='inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100'
                    >
                      <Pencil size={14} />
                      Process
                    </button>
                  </td>
                </tr>
              ))}

              {filteredOrders.length === 0 && (
                <tr>
                  <td className='px-6 py-10 text-center text-sm text-slate-500' colSpan={5}>
                    No orders match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6'>
          <div className='w-full max-w-2xl rounded-3xl bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.28)]'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.28em] text-slate-400'>Order Queue</p>
                <h2 className='mt-1 text-2xl font-bold text-slate-800'>Create Order</h2>
              </div>
              <button
                type='button'
                onClick={closeForm}
                className='rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700'
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className='mt-6 grid gap-4 md:grid-cols-2'>
              <label className='grid gap-2 text-sm font-medium text-slate-600'>
                Order ID
                <input
                  type='text'
                  value={formData.orderId}
                  onChange={(event) => setFormData((current) => ({ ...current, orderId: event.target.value }))}
                  placeholder='#ORD-0016'
                  className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400'
                />
              </label>

              <label className='grid gap-2 text-sm font-medium text-slate-600'>
                Priority
                <select
                  value={formData.priority}
                  onChange={(event) => setFormData((current) => ({ ...current, priority: event.target.value }))}
                  className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400'
                >
                  <option value='Standard'>Standard</option>
                  <option value='Urgent'>Urgent</option>
                </select>
              </label>

              <label className='grid gap-2 text-sm font-medium text-slate-600'>
                Items Count
                <input
                  type='number'
                  min='1'
                  value={formData.itemsCount}
                  onChange={(event) => setFormData((current) => ({ ...current, itemsCount: event.target.value }))}
                  className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400'
                />
              </label>

              <label className='grid gap-2 text-sm font-medium text-slate-600'>
                Fulfillment Stage
                <select
                  value={formData.stage}
                  onChange={(event) => setFormData((current) => ({ ...current, stage: event.target.value }))}
                  className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400'
                >
                  <option value='Pending'>Pending</option>
                  <option value='Picking'>Picking</option>
                  <option value='Packed'>Packed</option>
                  <option value='Ready'>Ready</option>
                  <option value='Shipped'>Shipped</option>
                </select>
              </label>

              <div className='md:col-span-2 flex items-center justify-end gap-3 pt-2'>
                <button
                  type='button'
                  onClick={closeForm}
                  className='rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800'
                >
                  <PackagePlus size={16} />
                  Save Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}