import { redirect } from "next/navigation";
import {
  fetchAdminUserSummaries,
  isCurrentUserAdmin,
} from "~/lib/supabase/admin-repo";

export default async function AdminPage() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/");
  }

  const users = await fetchAdminUserSummaries();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-16">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold tracking-widest text-brand uppercase">
          Admin
        </span>
        <h1 className="text-3xl font-bold tracking-tight uppercase sm:text-4xl">
          Users & Drills
        </h1>
        <p className="text-muted-foreground">
          {users.length} {users.length === 1 ? "user" : "users"} registered.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="font-bold">{user.email}</span>
              <span className="text-xs text-muted-foreground">
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
            {user.drills.length === 0 ? (
              <p className="text-sm text-muted-foreground">No drills yet.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {user.drills.map((drill) => (
                  <li
                    key={drill.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="w-fit rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold tracking-widest text-brand-foreground uppercase">
                      {drill.difficulty}
                    </span>
                    <span>{drill.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
