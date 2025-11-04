import Image from "next/image";
import Link from "next/link";

export default function RegisterLanding() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-8 text-center text-2xl font-semibold text-zinc-900">
        Đăng ký tài khoản của bạn
      </h1>

      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-10 sm:grid-cols-2">
        <Link
          href="/register/teacher"
          className="group flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
            <Image
              src="/roles/teacher.png"
              alt="Giáo viên"
              width={220}
              height={220}
              className="h-48 w-48 rounded-lg object-cover"
              priority
            />
          </div>
          <div className="mt-3 text-base font-medium text-zinc-800">Giáo viên</div>
        </Link>

        <Link
          href="/register/student"
          className="group flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
            <Image
              src="/roles/student.png"
              alt="Học sinh"
              width={220}
              height={220}
              className="h-48 w-48 rounded-lg object-cover"
              priority
            />
          </div>
          <div className="mt-3 text-base font-medium text-zinc-800">Học sinh</div>
        </Link>
      </div>
    </div>
  );
}
