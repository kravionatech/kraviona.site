import "./globals.css";
import "./extras.css";
import AdminNav from "../components/AdminNav";
import { PUBLIC_SITE_URL } from "../lib/site";

export const metadata = {
  title: { default: "Kraviona Studio", template: "%s · Kraviona Studio" },
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <aside>
            <div className="brand">
              kraviona.<small>Editorial studio</small>
            </div>
            <AdminNav />
            <div className="sidebar-footer">
              <span>Public website</span>
              <a target="_blank" href={PUBLIC_SITE_URL}>
                Open Kraviona ↗
              </a>
            </div>
          </aside>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
