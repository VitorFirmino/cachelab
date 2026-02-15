import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  const email = process.env.ADMIN_EMAIL ?? process.env.ADMIN_EMAILS?.split(",")[0]?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY in .env");
    process.exit(1);
  }

  if (!email || !password) {
    console.error("Missing ADMIN_EMAIL (or ADMIN_EMAILS) and ADMIN_PASSWORD in .env");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  console.log(`Creating admin user: ${email}`);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }

  if (data.user) {
    console.log(`\nUser created successfully!`);
    console.log(`  ID: ${data.user.id}`);
    console.log(`  Email: ${email}`);
    console.log(`\nIMPORTANT: Add this email to ADMIN_EMAILS in .env`);

    if (data.user.email_confirmed_at) {
      console.log(`  Status: Email confirmed`);
    } else {
      console.log(`  Status: Awaiting email confirmation`);
      console.log(`  → Disable "Confirm email" in Supabase Dashboard > Auth > Providers > Email`);
      console.log(`    or check inbox for confirmation link.`);
    }
  }
}

main();
