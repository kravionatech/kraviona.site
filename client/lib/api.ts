export const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:4000/api';
export async function api(path:string, options:RequestInit={}){const r=await fetch(`${API}${path}`,{...options,cache:'no-store',headers:{'Content-Type':'application/json',...options.headers}});if(!r.ok)throw new Error(`API ${r.status}`);return r.json();}
