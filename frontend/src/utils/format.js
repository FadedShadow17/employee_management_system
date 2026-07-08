export const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '-');
export const money = (value) => new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR' }).format(Number(value || 0));
export const unwrapError = (error) => error?.message || 'Something went wrong';
