import Image from "next/image";
import Link from "next/link";
import { getDb } from "@/lib/db";

type PublicUser = {
  id: string; first_name: string; last_name: string;
  role: string; created_at: string;
};

export default async function ProfilePage(props: { params: Promise<{ userId: string }> }) {
  const { userId } = await props.params;
  const { queryOne } = await getDb();

  const user = await queryOne<PublicUser>(
    "SELECT id, first_name, last_name, role, created_at FROM users WHERE id = $1",
    [userId]
  );
  if (!user) {
    return <div className="mx-auto max-w-2xl pt-12"><section className="glass rounded-3xl p-6 text-center md:p-10"><h1 className="title">المستخدم غير موجود</h1><Link href="/" className="btn-secondary mt-4 inline-block">الرئيسية</Link></section></div>;
  }

  const fullName = `${user.first_name} ${user.last_name}`;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/" className="btn-secondary mb-4 inline-block">← الرجوع</Link>

      <section className="glass rounded-3xl p-6 md:p-8">
        <div className="flex items-center gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-emerald-400 text-3xl font-black text-white shadow-lg">
            {user.first_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="title">{fullName}</h1>
            <p className="subtitle">
              {user.role === "admin" ? "إدارة" : "مشتري"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
