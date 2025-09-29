const isVercel = import.meta.env.VERCEL === '1';
const isProduction = import.meta.env.VERCEL_ENV === 'production';

export default isVercel && isProduction;