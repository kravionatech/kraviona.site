// Admin links must point to a valid public deployment in production.
export const PUBLIC_SITE_URL = (process.env.NEXT_PUBLIC_CLIENT_URL || 'https://kraviona.site').replace(/\/$/, '');
