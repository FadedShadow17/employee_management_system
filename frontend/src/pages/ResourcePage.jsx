import { Search, Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ConfirmButton } from '../components/ConfirmButton.jsx';
import { createResource, deleteResource, listResource, updateResource } from '../services/api.js';
import { formatDate, money, unwrapError } from '../utils/format.js';
import { EmptyState, LoadingSkeleton } from '../components/UI.jsx';

const roleCanManage = (user) => ['Admin', 'HR Manager'].includes(user?.role);

export const ResourcePage = ({
  title,
  resource,
  fields,
  columns,
  user,
  employeeOnlyCreate = false
}) => {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState({ page: 1, search: '' });
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);

  const canWrite = employeeOnlyCreate || roleCanManage(user);
  const selectOptions = useMemo(
    () => ({ employees, departments }),
    [employees, departments]
  );

  const load = async () => {
    setLoading(true);
    try {
      const res = await listResource(resource, query);
      setItems(res.data || []);
      setPagination(res.pagination);
    } catch (error) {
      toast.error(unwrapError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [resource, query.page]);

  useEffect(() => {
    listResource('employees', { limit: 100 })
      .then((res) => setEmployees(res.data || []))
      .catch(() => {});
    listResource('departments', { limit: 100 })
      .then((res) => setDepartments(res.data || []))
      .catch(() => {});
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [
          key,
          typeof value === 'string' && value.includes(',')
            ? value
                .split(',')
                .map((v) => v.trim())
                .filter(Boolean)
            : value
        ])
      );
      if (editing) await updateResource(resource, editing, payload);
      else await createResource(resource, payload);
      toast.success(
        editing ? `${title.slice(0, -1)} updated` : `${title.slice(0, -1)} created`
      );
      setForm({});
      setEditing(null);
      setFormVisible(false);
      load();
    } catch (error) {
      toast.error(unwrapError(error));
    }
  };

  const edit = (item) => {
    setEditing(item._id);
    setForm(
      fields.reduce(
        (acc, field) => ({
          ...acc,
          [field.name]: Array.isArray(item[field.name])
            ? item[field.name]
                .map((v) => v._id || v)
                .join(', ')
            : item[field.name]?._id || item[field.name] || ''
        }),
        {}
      )
    );
    setFormVisible(true);
    window.scrollTo(0, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{title}</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Manage and organize {title.toLowerCase()} efficiently.
        </p>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form className="flex-1" onSubmit={(e) => { e.preventDefault(); setQuery((q) => ({ ...q, page: 1 })); load(); }}>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}...`}
              className="input w-full pl-10"
              value={query.search}
              onChange={(e) => setQuery((q) => ({ ...q, search: e.target.value }))}
            />
          </div>
        </form>
        {canWrite && (
          <button
            onClick={() => {
              setEditing(null);
              setForm({});
              setFormVisible(true);
            }}
            className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus size={18} /> Add {title.slice(0, -1)}
          </button>
        )}
      </div>

      {/* Form */}
      {canWrite && formVisible && (
        <form onSubmit={submit} className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {editing ? 'Edit' : 'Create'} {title.slice(0, -1).toLowerCase()}
            </h3>
            <button
              type="button"
              onClick={() => setFormVisible(false)}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              ✕
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <Field
                key={field.name}
                field={field}
                value={form[field.name] || ''}
                setValue={(value) =>
                  setForm((old) => ({ ...old, [field.name]: value }))
                }
                options={selectOptions}
              />
            ))}
          </div>

          <div className="flex gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button type="submit" className="btn-primary">
              {editing ? 'Update' : 'Create'}
            </button>
            {editing && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setEditing(null);
                  setForm({});
                  setFormVisible(false);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <LoadingSkeleton count={5} className="p-6" />
        ) : !items.length ? (
          <div className="p-8">
            <EmptyState
              icon={Search}
              title={`No ${title.toLowerCase()} found`}
              description={`Try adjusting your search or filters.`}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                <tr>
                  {columns.map((col) => (
                    <th
                      className="px-6 py-4 font-semibold text-slate-900 dark:text-white"
                      key={col.key}
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {items.map((item) => (
                  <tr
                    key={item._id}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    {columns.map((col) => (
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300" key={col.key}>
                        {renderCell(item, col)}
                      </td>
                    ))}
                    <td className="flex gap-2 px-6 py-4">
                      {canWrite && (
                        <button
                          onClick={() => edit(item)}
                          className="inline-flex rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      {roleCanManage(user) && (
                        <ConfirmButton
                          onConfirm={async () => {
                            await deleteResource(resource, item._id);
                            toast.success('Deleted successfully');
                            load();
                          }}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Page {pagination.page} of {pagination.pages}
          </p>
          <div className="flex gap-2">
            <button
              className="btn-secondary p-2.5"
              disabled={query.page <= 1}
              onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="btn-secondary p-2.5"
              disabled={query.page >= pagination.pages}
              onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({ field, value, setValue, options }) => {
  const baseClass =
    field.type === 'textarea'
      ? 'md:col-span-2'
      : '';

  if (field.type === 'select')
    return (
      <label className={baseClass}>
        <span className="label">{field.label}</span>
        <select
          className="input mt-2"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        >
          <option value="">Select {field.label.toLowerCase()}</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );

  if (field.type === 'employee')
    return (
      <label className={baseClass}>
        <span className="label">{field.label}</span>
        <select
          className="input mt-2"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        >
          <option value="">Select employee</option>
          {options.employees.map((employee) => (
            <option key={employee._id} value={employee._id}>
              {employee.fullName}
            </option>
          ))}
        </select>
      </label>
    );

  if (field.type === 'employees')
    return (
      <label className={baseClass}>
        <span className="label">{field.label}</span>
        <select
          multiple
          className="input mt-2 min-h-28"
          value={
            Array.isArray(value)
              ? value
              : String(value)
                  .split(', ')
                  .filter(Boolean)
          }
          onChange={(e) =>
            setValue(
              Array.from(e.target.selectedOptions).map((option) => option.value)
            )
          }
        >
          {options.employees.map((employee) => (
            <option key={employee._id} value={employee._id}>
              {employee.fullName}
            </option>
          ))}
        </select>
      </label>
    );

  if (field.type === 'department')
    return (
      <label className={baseClass}>
        <span className="label">{field.label}</span>
        <select
          className="input mt-2"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        >
          <option value="">Select department</option>
          {options.departments.map((department) => (
            <option key={department._id} value={department._id}>
              {department.name}
            </option>
          ))}
        </select>
      </label>
    );

  if (field.type === 'textarea')
    return (
      <label className={baseClass}>
        <span className="label">{field.label}</span>
        <textarea
          className="input mt-2 min-h-24"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter text..."
        />
      </label>
    );

  return (
    <label className={baseClass}>
      <span className="label">{field.label}</span>
      <input
        className="input mt-2"
        type={field.type || 'text'}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`Enter ${field.label.toLowerCase()}...`}
      />
    </label>
  );
};

const renderCell = (item, col) => {
  const value = item[col.key];
  if (col.format === 'date') return formatDate(value) || '-';
  if (col.format === 'money') return money(value) || '-';
  if (Array.isArray(value))
    return (
      value.map((v) => v.fullName || v.name || v).join(', ') || '-'
    );
  if (value && typeof value === 'object')
    return value.fullName || value.name || value.title || '-';
  return value || '-';
};
