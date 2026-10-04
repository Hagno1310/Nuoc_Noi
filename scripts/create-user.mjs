// Cách dùng: npm run create-user -- <owner|staff> <email> <mật khẩu | PIN 6 số>
// Chạy trên máy dev; SUPABASE_SERVICE_ROLE_KEY lấy từ .env.local (xem `npx supabase status -o env`)
import { createClient } from "@supabase/supabase-js";

const [role, email, password] = process.argv.slice(2);
const valid =
  (role === "owner" && email && password?.length >= 8) ||
  (role === "staff" && email && /^\d{6}$/.test(password ?? ""));
if (!valid) {
  console.error(
    "Cách dùng:\n  create-user owner <email> <mật khẩu ≥ 8 ký tự>\n  create-user staff <email> <PIN quán 6 số>",
  );
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (error) {
  console.error(`Không tạo được tài khoản: ${error.message}`);
  process.exit(1);
}
const { error: roleError } = await supabase
  .from("app_roles")
  .insert({ user_id: data.user.id, role });
if (roleError) {
  console.error(
    `Đã tạo tài khoản nhưng chưa gán vai trò: ${roleError.message}`,
  );
  process.exit(1);
}
console.log(`Đã tạo tài khoản ${role}: ${email}`);
