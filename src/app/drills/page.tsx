import { redirect } from "next/navigation";

export default async function DrillsRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const chat = params.chat;
  const query = typeof chat === "string" ? `?chat=${chat}` : "";
  redirect(`/drill-qa${query}`);
}
