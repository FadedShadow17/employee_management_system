import { Mail, Phone, MapPin, Calendar, Briefcase, Users, Award, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useParams } from 'react-router-dom';
import { getResource } from '../services/api.js';
import { formatDate, money, unwrapError } from '../utils/format.js';
import { EmptyState, LoadingSkeleton } from '../components/UI.jsx';

export const EmployeeDetail = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getResource('employees', id)
      .then((res) => {
        setEmployee(res.data);
        setLoading(false);
      })
      .catch((e) => {
        setError(unwrapError(e));
        setLoading(false);
      });
  }, [id]);

  if (error)
    return (
      <div className="card border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-900/20">
        <div className="flex gap-3">
          <AlertCircle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
          <div>
            <p className="font-semibold text-rose-900 dark:text-rose-100">Error loading employee</p>
            <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">{error}</p>
          </div>
        </div>
      </div>
    );

  if (loading) return <LoadingSkeleton count={3} />;

  if (!employee)
    return (
      <EmptyState
        icon={Users}
        title="Employee not found"
        description="The employee you're looking for doesn't exist."
      />
    );

  const sections = [
    {
      title: 'Personal Information',
      items: [
        { label: 'Email', value: employee.email, icon: Mail },
        { label: 'Phone', value: employee.phone, icon: Phone },
        { label: 'Address', value: employee.address, icon: MapPin },
        { label: 'Date of Birth', value: formatDate(employee.dateOfBirth), icon: Calendar },
        { label: 'Gender', value: employee.gender, icon: Users }
      ]
    },
    {
      title: 'Employment Details',
      items: [
        { label: 'Employee ID', value: employee.employeeId, icon: Briefcase },
        { label: 'Department', value: employee.department?.name, icon: Users },
        { label: 'Job Title', value: employee.jobTitle, icon: Award },
        { label: 'Employment Type', value: employee.employmentType, icon: Briefcase },
        { label: 'Joining Date', value: formatDate(employee.joiningDate), icon: Calendar },
        { label: 'Manager', value: employee.manager?.fullName, icon: Users }
      ]
    },
    {
      title: 'Compensation',
      items: [
        { label: 'Salary', value: money(employee.salary), icon: Briefcase }
      ]
    },
    {
      title: 'Professional',
      items: [
        { label: 'Skills', value: employee.skills?.join(', ') || 'None', icon: Award },
        { label: 'Status', value: employee.status, icon: Users }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-8 dark:border-slate-800 dark:from-slate-800/50 dark:to-slate-900/50 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-6">
          {/* Avatar */}
          <img
            src={
              employee.profileImage ||
              'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=400'
            }
            alt={employee.fullName}
            className="h-24 w-24 rounded-xl object-cover shadow-md"
          />

          {/* Info */}
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {employee.fullName}
            </h1>
            <p className="mt-1 text-lg text-slate-600 dark:text-slate-400">
              {employee.jobTitle}
            </p>
            <p className="mt-2 inline-block rounded-lg bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
              {employee.status}
            </p>
          </div>
        </div>

        {/* Edit Button */}
        <Link
          to={`/employees/${id}/edit`}
          className="btn-primary inline-flex w-full justify-center sm:w-auto"
        >
          Edit Profile
        </Link>
      </div>

      {/* Details Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {sections.map((section, idx) => (
          <div key={idx} className="card">
            <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">
              {section.title}
            </h2>
            <div className="space-y-4">
              {section.items.map((item, itemIdx) => {
                const Icon = item.icon;
                return (
                  <div key={itemIdx} className="flex items-start gap-4">
                    <div className="mt-1 flex-shrink-0">
                      <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {item.label}
                      </p>
                      <p className="mt-1 font-medium text-slate-900 dark:text-white">
                        {item.value || '-'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
