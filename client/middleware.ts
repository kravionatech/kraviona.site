import { NextRequest, NextResponse } from "next/server";

const CANONICAL_HOST = "kraviona.site";
const LEGACY_HOSTS = new Set(["www.kraviona.site"]);

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const forwardedHost =
    request.headers.get("x-forwarded-host") || request.headers.get("host");
  const requestHost = (forwardedHost || url.host)
    .split(",")[0]
    .trim()
    .toLowerCase();
  const hostname = requestHost.replace(/:\d+$/, "");
  const hasTrailingSlash =
    url.pathname.length > 1 && url.pathname.endsWith("/");

  if (LEGACY_HOSTS.has(hostname)) {
    const pathname = hasTrailingSlash
      ? url.pathname.slice(0, -1)
      : url.pathname;
    return NextResponse.redirect(
      new URL(`${pathname}${url.search}`, `https://${CANONICAL_HOST}`),
      308,
    );
  }

  if (hasTrailingSlash) {
    const pathname = url.pathname.replace(/\/+$/, "");
    return NextResponse.redirect(
      new URL(`${pathname}${url.search}`, `https://${requestHost}`),
      308,
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
