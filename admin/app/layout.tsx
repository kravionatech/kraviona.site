import './globals.css';
import './extras.css';
import AdminNav from '../components/AdminNav';
export const metadata={title:{default:'Kraviona Studio',template:'%s · Kraviona Studio'},robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body><div className="shell"><aside><div className="brand">kraviona.<small>Editorial studio</small></div><AdminNav/><div className="sidebar-footer"><span>Public website</span><a target="_blank" href={process.env.NEXT_PUBLIC_CLIENT_URL||'http://localhost:3000'}>Open Kraviona ↗</a></div></aside><main>{children}</main></div></body></html>}
