import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

// Chỉ chặn người chưa đăng nhập; quyền chủ quán do layout (is_owner) và RLS kiểm tra (SRS FR-00b)
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isAdminLogin = path === "/admin/login";

  if (!user) {
    if (isAdminLogin) return response;
    return redirectTo(
      request,
      path.startsWith("/order") ? "/login" : "/admin/login",
    );
  }
  // Chỉ chủ quán mới bị chuyển khỏi /admin/login; điện thoại nhân viên vẫn thấy form (SRS FR-00b)
  if (isAdminLogin) {
    const { data: isOwner } = await supabase.rpc("is_owner");
    return isOwner ? redirectTo(request, "/admin/dashboard") : response;
  }
  return response;
}

export const config = { matcher: ["/order/:path*", "/admin/:path*"] };
