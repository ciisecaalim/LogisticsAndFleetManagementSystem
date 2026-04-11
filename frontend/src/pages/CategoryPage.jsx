import { Plus, Pencil, Trash2, Boxes, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'lfms_category_items';

const CATEGORY_OPTIONS = ['Spare Parts', 'Office Supplies', 'Tools', 'Equipment', 'Other'];

const DEFAULT_CATEGORIES = [
  {
    id: 'CAT-001',
    name: 'Spare Parts',
    description: 'Vehicle and fleet replacement parts.'
  },
  {
    id: 'CAT-002',
    name: 'Office Supplies',
    description: 'Administrative and warehouse supplies.'
  },
  {
    id: 'CAT-003',
    name: 'Tools',
    description: 'Maintenance and repair tools.'
  }
];

function createEmptyForm() {
  return {
    name: '',
    description: '',
    image: '',
    categoryChoice: ''
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

function readStoredCategories() {
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

function writeStoredCategories(items) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export default function CategoryPage() {
  const [categories, setCategories] = useState(new Array());
  const [formData, setFormData] = useState(createEmptyForm);
  const [editingId, setEditingId] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    const stored = readStoredCategories();
    if (stored.length > 0) {
      setCategories(stored);
      return;
    }

    setCategories(DEFAULT_CATEGORIES);
    writeStoredCategories(DEFAULT_CATEGORIES);
  }, []);

  const openCreateForm = () => {
    setEditingId('');
    setFormData(createEmptyForm());
    setIsFormOpen(true);
  };

  const openEditForm = (item) => {
    setEditingId(item.id);
    const match = CATEGORY_OPTIONS.includes(item.name) ? item.name : 'Other';
    setFormData({
      name: item.name,
      description: item.description,
      image: item.image || '',
      categoryChoice: match
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId('');
    setFormData(createEmptyForm());
  };

  const saveCategory = (event) => {
    event.preventDefault();

    const categoryName = formData.categoryChoice === 'Other' ? formData.name.trim() : formData.categoryChoice;

    if (!categoryName) {
      return;
    }

    const nextItem = {
      id: editingId || `CAT-${String(Date.now()).slice(-6)}`,
      name: categoryName,
      description: formData.description.trim(),
      image: formData.image || ''
    };

    if (!nextItem.name) {
      return;
    }

    let nextCategories = new Array();

    if (editingId) {
      categories.forEach((item) => {
        if (item.id === editingId) {
          nextCategories.push(nextItem);
          return;
        }

        nextCategories.push(item);
      });
    } else {
      nextCategories.push(nextItem);
      categories.forEach((item) => nextCategories.push(item));
    }

    setCategories(nextCategories);
    writeStoredCategories(nextCategories);
    closeForm();
  };

  const deleteCategory = (itemId) => {
    const nextCategories = categories.filter((item) => item.id !== itemId);
    setCategories(nextCategories);
    writeStoredCategories(nextCategories);
  };

  return (
    <section className='space-y-6'>
      <div className='rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)]'>
        <div className='flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between'>
          <div>
            <div className='mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600'>
              <Boxes size={22} strokeWidth={2.2} />
            </div>
            <h1 className='m-0 text-3xl font-bold tracking-tight text-slate-900'>Category</h1>
            <p className='mt-2 max-w-2xl text-sm leading-7 text-slate-500'>
              Add, edit, and remove categories for your inventory flow. The first few items are ready to edit or delete.
            </p>
          </div>

          <button
            type='button'
            onClick={openCreateForm}
            className='inline-flex w-56 items-center justify-center gap-3 whitespace-nowrap rounded-[22px] bg-[#0f172a] px-6 py-3 text-[17px] font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:bg-[#111c33] sm:mr-10 sm:mt-1'
          >
            <span className='grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white'>
              <Plus size={19} strokeWidth={2.5} />
            </span>
            Add Category
          </button>
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-3'>
        <article className='rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]'>
          <p className='text-sm font-medium text-slate-500'>Total Categories</p>
          <h2 className='mt-3 text-3xl font-bold text-slate-900'>{categories.length}</h2>
        </article>
        <article className='rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]'>
          <p className='text-sm font-medium text-slate-500'>Latest Category</p>
          <h2 className='mt-3 text-xl font-bold text-slate-900'>
            {categories.length > 0 ? categories[0].name : 'No category yet'}
          </h2>
        </article>
        <article className='rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]'>
          <p className='text-sm font-medium text-slate-500'>Storage</p>
          <h2 className='mt-3 text-xl font-bold text-slate-900'>LocalStorage</h2>
        </article>
      </div>

      <div className='overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)]'>
        <div className='border-b border-slate-200 px-6 py-4'>
          <h3 className='text-lg font-semibold text-slate-900'>Category List</h3>
        </div>

        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-slate-200'>
            <thead className='bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'>
              <tr>
                <th className='px-6 py-4'>Image</th>
                <th className='px-6 py-4'>Name</th>
                <th className='px-6 py-4'>Description</th>
                <th className='px-6 py-4'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100'>
              {categories.map((item) => (
                <tr key={item.id} className='hover:bg-slate-50/70'>
                  <td className='px-6 py-4'>
                    <div className='flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-slate-100'>
                      {item.image ? (
                        <img src={item.image} alt={item.name} className='h-full w-full object-cover' />
                      ) : (
                        <Boxes size={18} className='text-slate-400' />
                      )}
                    </div>
                  </td>
                  <td className='px-6 py-4 text-sm font-semibold text-slate-900'>{item.name}</td>
                  <td className='px-6 py-4 text-sm text-slate-600'>{item.description || '-'}</td>
                  <td className='px-6 py-4'>
                    <div className='flex items-center gap-2'>
                      <button
                        type='button'
                        onClick={() => openEditForm(item)}
                        className='inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100'
                      >
                        <Pencil size={15} />
                        Edit
                      </button>
                      <button
                        type='button'
                        onClick={() => deleteCategory(item.id)}
                        className='inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50'
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {categories.length === 0 && (
                <tr>
                  <td className='px-6 py-10 text-center text-sm text-slate-500' colSpan={4}>
                    No categories saved yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6'>
          <div className='w-full max-w-lg rounded-[28px] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.28)]'>
            <div className='mb-5 flex items-center justify-between'>
              <h3 className='text-xl font-bold text-slate-900'>
                {editingId ? 'Edit Category' : 'Add Category'}
              </h3>
              <button
                type='button'
                onClick={closeForm}
                className='grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200'
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={saveCategory} className='space-y-4'>
              <label className='block'>
                <span className='mb-2 block text-sm font-medium text-slate-700'>Category</span>
                <select
                  value={formData.categoryChoice}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      categoryChoice: event.target.value,
                      name: event.target.value === 'Other' ? current.name : event.target.value
                    }))
                  }
                  className='w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400'
                >
                  <option value=''>Select category</option>
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              {formData.categoryChoice === 'Other' && (
                <label className='block'>
                  <span className='mb-2 block text-sm font-medium text-slate-700'>Custom Category Name</span>
                  <input
                    type='text'
                    value={formData.name}
                    onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                    className='w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400'
                  />
                </label>
              )}

              <label className='block'>
                <span className='mb-2 block text-sm font-medium text-slate-700'>Description</span>
                <textarea
                  rows='4'
                  value={formData.description}
                  onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
                  className='w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400'
                />
              </label>

              <label className='block'>
                <span className='mb-2 block text-sm font-medium text-slate-700'>Image</span>
                <input
                  type='file'
                  accept='image/*'
                  onChange={async (event) => {
                    const file = event.target.files && event.target.files[0];

                    if (!file) {
                      setFormData((current) => ({ ...current, image: '' }));
                      return;
                    }

                    const image = await fileToDataUrl(file);
                    setFormData((current) => ({ ...current, image }));
                  }}
                  className='w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white focus:border-slate-400'
                />
              </label>

              {formData.image && (
                <div className='overflow-hidden rounded-3xl border border-slate-200 bg-slate-50'>
                  <img src={formData.image} alt='Category preview' className='h-44 w-full object-cover' />
                </div>
              )}

              <div className='flex items-center justify-end gap-3 pt-2'>
                <button
                  type='button'
                  onClick={closeForm}
                  className='rounded-full border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800'
                >
                  <Plus size={16} />
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
