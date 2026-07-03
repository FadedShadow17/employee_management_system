export const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '-');
export const money = (value) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(value || 0));
export const unwrapError = (error) => error?.message || 'Something went wrong';
