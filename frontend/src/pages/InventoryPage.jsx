import {
  AlertTriangle,
  ArrowDownWideNarrow,
  Boxes,
  MoreHorizontal,
  Package,
  PackagePlus,
  Pencil,
  Search,
  Trash2,
  TriangleAlert,
  X,
  Layers3
} from 'lucide-react';
import axios from 'axios';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'lfms_inventory_items';
const CATEGORY_STORAGE_KEY = 'lfms_category_items';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const inventoryApi = axios.create({ baseURL: API_BASE_URL });

function createEmptyForm() {
  return {
    name: '',
    sku: '',
    category: '',
    quantity: '',
    image: ''
  };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });
}

function readStoredInventory() {
  if (typeof window === 'undefined') {
    return new Array();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : new Array();
  } catch {
    return new Array();
  }
}

function readStoredCategories() {
  if (typeof window === 'undefined') {
    return new Array();
  }

  try {
    const raw = window.localStorage.getItem(CATEGORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : new Array();
  } catch {
    return new Array();
  }
}

function getCategoryOptions() {
  const categories = new Array('All Categories');
  const storedCategories = readStoredCategories();

  storedCategories.forEach((item) => {
    if (item && item.name && categories.indexOf(item.name) === -1) {
      categories.push(item.name);
    }
  });

  return categories;
}

function writeStoredInventory(items) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function normalizeInventoryItem(item) {
  return {
    id: item._id || item.id || item.inventoryId,
    name: item.name,
    sku: item.sku,
    category: item.category,
    quantity: Number(item.quantity || 0),
    image: item.image || ''
  };
}

function getStockStatus(quantity) {
  if (quantity <= 0) {
    return 'Out of Stock';
  }

  if (quantity <= 10) {
    return 'Low Stock';
  }

  return 'In Stock';
}

function statusClasses(status) {
  if (status === 'In Stock') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (status === 'Low Stock') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  return 'border-rose-200 bg-rose-50 text-rose-700';
}

export default function InventoryPage() {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [inventoryItems, setInventoryItems] = useState(new Array());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [formData, setFormData] = useState(createEmptyForm);
  const [imagePreview, setImagePreview] = useState('');
  const [activeMenuId, setActiveMenuId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadInventory = async () => {
      try {
        const stored = readStoredInventory();

        if (stored.length > 0) {
          if (isMounted) {
            setInventoryItems(stored.map(normalizeInventoryItem));
            setError('');
          }
          return;
        }

        const response = await inventoryApi.get('/inventory');
        const data = response.data?.data ?? response.data ?? response;
        if (!isMounted) {
          return;
        }

        const normalized = Array.isArray(data) ? data.map(normalizeInventoryItem) : new Array();
        setInventoryItems(normalized);
        writeStoredInventory(normalized);
        setError('');
      } catch {
        if (isMounted) {
          setError('Unable to load inventory from the backend. Showing local data.');
          setInventoryItems(readStoredInventory());
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInventory();

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = getCategoryOptions();

  const rows = inventoryItems.filter((item) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesSearch =
      !normalizedQuery ||
      item.name.toLowerCase().includes(normalizedQuery) ||
      item.sku.toLowerCase().includes(normalizedQuery);

    const matchesCategory = categoryFilter === 'All Categories' || item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const totalStock = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockCount = inventoryItems.filter((item) => getStockStatus(item.quantity) === 'Low Stock').length;
  const inStockCount = inventoryItems.filter((item) => item.quantity > 0).length;

  const openCreateForm = () => {
    setEditingId('');
    const categoryOptions = getCategoryOptions();
    setFormData({
      ...createEmptyForm(),
      category: categoryOptions.length > 1 ? categoryOptions[1] : ''
    });
    setImagePreview('');
    setIsFormOpen(true);
    setActiveMenuId('');
  };

  const openEditForm = (item) => {
    setEditingId(item._id || item.id);
    setFormData({
      name: item.name,
      sku: item.sku,
      category: item.category,
      quantity: String(item.quantity),
      image: item.image
    });
    setImagePreview(item.image || '');
    setIsFormOpen(true);
    setActiveMenuId('');
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId('');
    setFormData(createEmptyForm());
    setImagePreview('');
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setFormData((current) => ({ ...current, image: dataUrl }));
      setImagePreview(dataUrl);
    } catch {
      setError('Unable to read the selected image.');
    } finally {
      event.target.value = '';
    }
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();

    const quantity = Number(formData.quantity);

    if (!formData.name.trim() || !formData.sku.trim() || !formData.category.trim() || Number.isNaN(quantity)) {
      return;
    }

    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim(),
      category: formData.category,
      quantity,
      image: formData.image.trim()
    };

    const saveItem = async () => {
      const currentItems = readStoredInventory();
      let normalized = payload;

      if (editingId) {
        const nextItems = currentItems.map((item) => (item.id === editingId ? { ...item, ...payload, id: editingId } : item));
        writeStoredInventory(nextItems);
        normalized = nextItems.find((item) => item.id === editingId) || payload;
      } else {
        const nextItem = { ...payload, id: `INV-${String(Date.now()).slice(-6)}` };
        const nextItems = new Array();
        nextItems.unshift(nextItem);
        currentItems.forEach((item) => nextItems.push(item));
        writeStoredInventory(nextItems);
        normalized = nextItem;
      }

      setInventoryItems((current) => {
        if (editingId) {
          return current.map((item) => (item.id === editingId ? { ...item, ...normalized } : item));
        }

        const next = current.slice();
        next.unshift(normalized);
        return next;
      });

      closeForm();
    };

    saveItem().catch(() => {
      setError('Unable to save the inventory item right now.');
    });
  };

  const deleteItem = (itemId) => {
    const currentItems = readStoredInventory();
    const nextItems = currentItems.filter((item) => item.id !== itemId);
    writeStoredInventory(nextItems);
    setInventoryItems(nextItems);
    setActiveMenuId('');
  };

  const summaryCards = [
    {
      label: 'Total Items in Stock',
      value: totalStock,
      tone: 'slate',
      badge: '2m',
      icon: Package,
      iconTone: 'slate'
    },
    {
      label: 'Low Stock Alerts',
      value: lowStockCount,
      tone: 'amber',
      badge: '2m',
      icon: AlertTriangle,
      iconTone: 'amber'
    },
    {
      label: 'Categories',
      value: categories.length - 1,
      tone: 'sky',
      badge: '2m',
      icon: Layers3,
      iconTone: 'sky'
    },
    {
      label: 'In Stock',
      value: inStockCount,
      tone: 'emerald',
      badge: '2m',
      icon: ArrowDownWideNarrow,
      iconTone: 'emerald'
    }
  ];

  return (
    <section className='space-y-6 rounded-3xl bg-gray-50 p-5 sm:p-6'>
      <header className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight text-slate-800'>Inventory Management</h1>
          <p className='mt-1 text-sm text-slate-500'>Track and control all inventory assets and consumables.</p>
        </div>

        <button
          type='button'
          onClick={openCreateForm}
          className='inline-flex items-center gap-2 rounded-[18px] border border-slate-950/90 bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)] transition hover:bg-slate-900'
        >
          <span className='grid h-6 w-6 place-items-center rounded-full bg-white/10'>
            <PackagePlus size={14} />
          </span>
          Add New Item
        </button>
      </header>

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {summaryCards.map((card) => (
          <article
            key={card.label}
            className={`rounded-[22px] border-t-[3px] border px-5 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ${
              card.tone === 'amber'
                ? 'border-amber-300 bg-white text-amber-700'
                : 'border-slate-200 bg-white text-slate-800'
            }`}
            style={{ borderTopColor: card.tone === 'amber' ? '#f59e0b' : card.tone === 'emerald' ? '#10b981' : card.tone === 'sky' ? '#64748b' : '#64748b' }}
          >
            <div className='flex items-start gap-4'>
              <div
                className={`grid h-16 w-16 place-items-center rounded-2xl ${
                  card.iconTone === 'amber'
                    ? 'bg-amber-100 text-amber-600'
                    : card.iconTone === 'sky'
                      ? 'bg-sky-100 text-sky-600'
                      : card.iconTone === 'emerald'
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-slate-100 text-slate-500'
                }`}
              >
                <card.icon size={30} strokeWidth={2.1} />
              </div>

              <div className='min-w-0 flex-1'>
                <p className='m-0 text-[0.98rem] font-medium text-slate-500'>{card.label}</p>
                <p className='mt-1 text-[2em] font-extrabold leading-none tracking-tight text-slate-900'>
                  {card.value}
                </p>
                <div className='mt-2 flex items-center justify-between gap-3'>
                  <span className='text-xs font-medium text-slate-500'>Updated recently</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      card.tone === 'amber'
                        ? 'bg-amber-100 text-amber-700'
                        : card.tone === 'emerald'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {card.badge}
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {error ? (
        <p className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700'>{error}</p>
      ) : null}

      <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
        <div className='flex flex-wrap items-center gap-3'>
          <label className='relative w-full max-w-md'>
            <Search size={16} className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
            <input
              type='text'
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className='w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-slate-400'
            />
          </label>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400'
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-slate-200'>
            <thead className='bg-slate-50'>
              <tr>
                <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500'>
                  Item Name & Image
                </th>
                <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500'>
                  SKU / Part Number
                </th>
                <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500'>
                  Category
                </th>
                <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500'>
                  Quantity
                </th>
                <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500'>
                  Status
                </th>
                <th className='px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500'>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className='divide-y divide-slate-100 bg-white'>
              {loading ? (
                <tr>
                  <td colSpan={6} className='px-4 py-10 text-center text-sm text-slate-500'>
                    Loading inventory...
                  </td>
                </tr>
              ) : null}

              {!loading && rows.map((item) => {
                const status = getStockStatus(item.quantity);
                return (
                  <tr key={item._id || item.id} className='hover:bg-slate-50'>
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-3'>
                        <img
                          src={item.image}
                          alt={item.name}
                          className='h-10 w-10 rounded-lg border border-slate-200 object-cover'
                        />
                        <span className='font-medium text-slate-800'>{item.name}</span>
                      </div>
                    </td>
                    <td className='px-4 py-3 text-sm text-slate-600'>{item.sku}</td>
                    <td className='px-4 py-3 text-sm text-slate-600'>{item.category}</td>
                    <td className='px-4 py-3 text-sm font-semibold text-slate-700'>{item.quantity}</td>
                    <td className='px-4 py-3'>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(status)}`}>
                        {status}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-right'>
                      <div className='relative inline-flex items-center justify-end'>
                        <button
                          type='button'
                          aria-label={`Actions for ${item.name}`}
                          onClick={() => setActiveMenuId((current) => (current === (item._id || item.id) ? '' : (item._id || item.id)))}
                          className='rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700'
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {activeMenuId === (item._id || item.id) ? (
                          <div className='absolute right-0 top-10 z-20 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg'>
                            <button
                              type='button'
                              onClick={() => openEditForm(item)}
                              className='flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50'
                            >
                              <Pencil size={14} />
                              Edit
                            </button>
                            <button
                              type='button'
                              onClick={() => deleteItem(item.id)}
                              className='flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50'
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className='px-4 py-10 text-center text-sm text-slate-500'>
                    No inventory items match your search.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6'>
          <div className='w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.28em] text-slate-400'>Inventory Item</p>
                <h2 className='mt-1 text-2xl font-bold text-slate-800'>{editingId ? 'Edit Item' : 'Add New Item'}</h2>
              </div>
              <button
                type='button'
                onClick={closeForm}
                className='rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700'
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className='mt-6 grid gap-4 md:grid-cols-2'>
              <label className='grid gap-2 text-sm font-medium text-slate-600'>
                Item Name
                <input
                  value={formData.name}
                  onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                  className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400'
                />
              </label>

              <label className='grid gap-2 text-sm font-medium text-slate-600'>
                SKU / Part Number
                <input
                  value={formData.sku}
                  onChange={(event) => setFormData((current) => ({ ...current, sku: event.target.value }))}
                  className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400'
                />
              </label>

              <label className='grid gap-2 text-sm font-medium text-slate-600'>
                Category
                <select
                  value={formData.category}
                  onChange={(event) => setFormData((current) => ({ ...current, category: event.target.value }))}
                  className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400'
                >
                  <option value=''>Select category</option>
                  {categories
                    .filter((category) => category !== 'All Categories')
                    .map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                </select>
              </label>

              <label className='grid gap-2 text-sm font-medium text-slate-600'>
                Quantity
                <input
                  type='number'
                  min='0'
                  value={formData.quantity}
                  onChange={(event) => setFormData((current) => ({ ...current, quantity: event.target.value }))}
                  className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400'
                />
              </label>

              <label className='grid gap-2 text-sm font-medium text-slate-600 md:col-span-2'>
                Upload Image
                <input
                  type='file'
                  accept='image/*'
                  onChange={handleImageUpload}
                  className='rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 outline-none focus:border-slate-400'
                />
              </label>

              <div className='md:col-span-2'>
                <div className='flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-3'>
                  <div className='h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-white'>
                    {imagePreview ? (
                      <img src={imagePreview} alt='Selected item preview' className='h-full w-full object-cover' />
                    ) : (
                      <div className='grid h-full w-full place-items-center text-xs text-slate-400'>
                        Preview
                      </div>
                    )}
                  </div>
                  <div className='text-sm text-slate-500'>
                    Upload an image file. It will be stored with the item and shown in the table.
                  </div>
                </div>
              </div>

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
                  className='rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900'
                >
                  {editingId ? 'Update Item' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
