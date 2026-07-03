import { ResourcePage } from './ResourcePage.jsx';

const employeeFields = [
  { name: 'fullName', label: 'Full name' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'phone', label: 'Phone' },
  { name: 'address', label: 'Address' },
  { name: 'profileImage', label: 'Profile image URL' },
  { name: 'dateOfBirth', label: 'Date of birth', type: 'date' },
  { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
  { name: 'department', label: 'Department', type: 'department' },
  { name: 'jobTitle', label: 'Job title' },
  { name: 'employmentType', label: 'Employment type', type: 'select', options: ['Full Time', 'Part Time', 'Contract', 'Intern'] },
  { name: 'joiningDate', label: 'Joining date', type: 'date' },
  { name: 'salary', label: 'Salary', type: 'number' },
  { name: 'manager', label: 'Manager', type: 'employee' },
  { name: 'skills', label: 'Skills comma separated' },
  { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
];

export const Employees = ({ user }) => <ResourcePage title="Employees" resource="employees" user={user} fields={employeeFields} columns={[
  { key: 'employeeId', label: 'ID' }, { key: 'fullName', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'department', label: 'Department' }, { key: 'jobTitle', label: 'Job title' }, { key: 'employmentType', label: 'Type' }, { key: 'status', label: 'Status' }
]} />;

export const Departments = ({ user }) => <ResourcePage title="Departments" resource="departments" user={user} fields={[
  { name: 'name', label: 'Name' }, { name: 'description', label: 'Description', type: 'textarea' }, { name: 'manager', label: 'Manager', type: 'employee' }
]} columns={[{ key: 'name', label: 'Name' }, { key: 'description', label: 'Description' }, { key: 'manager', label: 'Manager' }, { key: 'employeeCount', label: 'Employees' }, { key: 'isActive', label: 'Active' }]} />;

export const Tasks = ({ user }) => <ResourcePage title="Tasks" resource="tasks" user={user} fields={[
  { name: 'title', label: 'Title' }, { name: 'description', label: 'Description', type: 'textarea' }, { name: 'assignedTo', label: 'Assign employees', type: 'employees' }, { name: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High', 'Urgent'] }, { name: 'status', label: 'Status', type: 'select', options: ['To Do', 'In Progress', 'Review', 'Completed'] }, { name: 'startDate', label: 'Start date', type: 'date' }, { name: 'dueDate', label: 'Due date', type: 'date' }, { name: 'progress', label: 'Progress', type: 'number' }
]} columns={[{ key: 'title', label: 'Title' }, { key: 'assignedTo', label: 'Assigned' }, { key: 'priority', label: 'Priority' }, { key: 'status', label: 'Status' }, { key: 'dueDate', label: 'Due', format: 'date' }, { key: 'progress', label: 'Progress' }]} />;

export const Attendance = ({ user }) => <ResourcePage title="Attendance" resource="attendance" user={user} fields={[
  { name: 'employee', label: 'Employee', type: 'employee' }, { name: 'date', label: 'Date', type: 'date' }, { name: 'checkIn', label: 'Check in', type: 'datetime-local' }, { name: 'checkOut', label: 'Check out', type: 'datetime-local' }, { name: 'workingHours', label: 'Working hours', type: 'number' }, { name: 'status', label: 'Status', type: 'select', options: ['Present', 'Absent', 'Late', 'Half Day', 'Leave'] }, { name: 'notes', label: 'Notes' }
]} columns={[{ key: 'employee', label: 'Employee' }, { key: 'date', label: 'Date', format: 'date' }, { key: 'checkIn', label: 'Check in', format: 'date' }, { key: 'checkOut', label: 'Check out', format: 'date' }, { key: 'workingHours', label: 'Hours' }, { key: 'status', label: 'Status' }]} />;

export const Leaves = ({ user }) => <ResourcePage title="Leave requests" resource="leaves" user={user} employeeOnlyCreate fields={[
  { name: 'employee', label: 'Employee', type: 'employee' }, { name: 'type', label: 'Type', type: 'select', options: ['Annual', 'Sick', 'Unpaid', 'Maternity', 'Paternity', 'Other'] }, { name: 'startDate', label: 'Start date', type: 'date' }, { name: 'endDate', label: 'End date', type: 'date' }, { name: 'reason', label: 'Reason', type: 'textarea' }, { name: 'status', label: 'Status', type: 'select', options: ['Pending', 'Approved', 'Rejected'] }
]} columns={[{ key: 'employee', label: 'Employee' }, { key: 'type', label: 'Type' }, { key: 'startDate', label: 'Start', format: 'date' }, { key: 'endDate', label: 'End', format: 'date' }, { key: 'status', label: 'Status' }, { key: 'remainingBalance', label: 'Balance' }]} />;

export const Payroll = ({ user }) => <ResourcePage title="Payroll" resource="payroll" user={user} fields={[
  { name: 'employee', label: 'Employee', type: 'employee' }, { name: 'basicSalary', label: 'Basic salary', type: 'number' }, { name: 'allowance', label: 'Allowance', type: 'number' }, { name: 'bonus', label: 'Bonus', type: 'number' }, { name: 'deduction', label: 'Deduction', type: 'number' }, { name: 'tax', label: 'Tax', type: 'number' }, { name: 'month', label: 'Month', type: 'number' }, { name: 'year', label: 'Year', type: 'number' }, { name: 'paymentStatus', label: 'Payment status', type: 'select', options: ['Pending', 'Paid'] }
]} columns={[{ key: 'employee', label: 'Employee' }, { key: 'basicSalary', label: 'Basic', format: 'money' }, { key: 'allowance', label: 'Allowance', format: 'money' }, { key: 'deduction', label: 'Deduction', format: 'money' }, { key: 'tax', label: 'Tax', format: 'money' }, { key: 'netSalary', label: 'Net', format: 'money' }, { key: 'paymentStatus', label: 'Status' }]} />;

export const Performance = ({ user }) => <ResourcePage title="Performance reviews" resource="performance" user={user} fields={[
  { name: 'employee', label: 'Employee', type: 'employee' }, { name: 'rating', label: 'Rating', type: 'number' }, { name: 'feedback', label: 'Feedback', type: 'textarea' }, { name: 'goals', label: 'Goals comma separated' }, { name: 'reviewDate', label: 'Review date', type: 'date' }
]} columns={[{ key: 'employee', label: 'Employee' }, { key: 'rating', label: 'Rating' }, { key: 'feedback', label: 'Feedback' }, { key: 'goals', label: 'Goals' }, { key: 'reviewDate', label: 'Review date', format: 'date' }, { key: 'reviewer', label: 'Reviewer' }]} />;

export const Announcements = ({ user }) => <ResourcePage title="Announcements" resource="announcements" user={user} fields={[
  { name: 'title', label: 'Title' }, { name: 'body', label: 'Body', type: 'textarea' }, { name: 'audience', label: 'Audience', type: 'select', options: ['All', 'Admin', 'HR Manager', 'Employee'] }
]} columns={[{ key: 'title', label: 'Title' }, { key: 'body', label: 'Body' }, { key: 'audience', label: 'Audience' }, { key: 'publishedBy', label: 'Published by' }]} />;
