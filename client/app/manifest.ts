import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest { return { name: 'Kraviona', short_name: 'Kraviona', description: 'Clear ideas for better work.', start_url: '/', display: 'standalone', background_color: '#f7f3e8', theme_color: '#101820', icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }] }; }
