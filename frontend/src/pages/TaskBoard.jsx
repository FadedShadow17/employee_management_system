import { Clock, AlertCircle, CheckCircle, Circle } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listResource, updateResource } from '../services/api.js';
import { formatDate, unwrapError } from '../utils/format.js';
import { EmptyState } from '../components/UI.jsx';

const statuses = ['To Do', 'In Progress', 'Review', 'Completed'];

const statusIcons = {
  'To Do': Circle,
  'In Progress': Clock,
  'Review': AlertCircle,
  'Completed': CheckCircle
};

const statusColors = {
  'To Do': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'Review': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'Completed': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
};

export const TaskBoard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listResource('tasks', { limit: 100 })
      .then((res) => {
        setTasks(res.data || []);
        setLoading(false);
      })
      .catch((e) => {
        toast.error(unwrapError(e));
        setLoading(false);
      });
  }, []);

  const move = async (task, status) => {
    try {
      await updateResource('tasks', task._id, {
        status,
        progress: status === 'Completed' ? 100 : task.progress
      });
      setTasks((items) =>
        items.map((item) => (item._id === task._id ? { ...item, status } : item))
      );
      toast.success('Task moved');
    } catch (error) {
      toast.error(unwrapError(error));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Kanban Board
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Organize and track your tasks across different stages
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <div
                  key={j}
                  className="h-32 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800"
                />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-4">
          {statuses.map((status) => {
            const statusTasks = tasks.filter((task) => task.status === status);
            const StatusIcon = statusIcons[status];

            return (
              <section key={status} className="space-y-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-900/50">
                {/* Header */}
                <div className="flex items-center gap-2">
                  <StatusIcon size={20} className={statusColors[status]} />
                  <h2 className="font-semibold text-slate-900 dark:text-white">
                    {status}
                  </h2>
                  <span className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {statusTasks.length}
                  </span>
                </div>

                {/* Tasks */}
                <div className="space-y-3">
                  {statusTasks.length ? (
                    statusTasks.map((task) => (
                      <article
                        key={task._id}
                        className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-800"
                      >
                        <p className="font-medium text-slate-900 dark:text-white">
                          {task.title}
                        </p>

                        {/* Priority & Due Date */}
                        <div className="mt-3 flex items-center gap-2 text-xs">
                          <span
                            className={`rounded-full px-2 py-1 font-medium ${
                              task.priority === 'Urgent'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                                : task.priority === 'High'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                  : task.priority === 'Medium'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {task.priority}
                          </span>
                          <span className="text-slate-600 dark:text-slate-400">
                            {formatDate(task.dueDate)}
                          </span>
                        </div>

                        {/* Progress */}
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                            <span>Progress</span>
                            <span className="font-medium">{task.progress || 0}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all"
                              style={{ width: `${task.progress || 0}%` }}
                            />
                          </div>
                        </div>

                        {/* Status Dropdown */}
                        <select
                          className="input mt-3 w-full text-sm"
                          value={task.status}
                          onChange={(e) => move(task, e.target.value)}
                        >
                          {statuses.map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-lg border-2 border-dashed border-slate-200 p-4 text-center dark:border-slate-800">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        No tasks yet
                      </p>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};
