export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? process.env.ADMIN_EMAILS?.split(",")[0]?.trim() ?? "";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";
