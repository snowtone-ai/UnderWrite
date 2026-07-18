import { redirect } from "next/navigation";
import { getServiceClient, getSessionUser } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const db = getServiceClient();
  const { data } = await db.from("profiles").select("role").eq("id", user.id).single();
  if (data?.role !== "admin") redirect("/");

  return <>{children}</>;
}
