export default function AdminHomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="mt-4 w-full rounded-md bg-[#E33AEC]/50 px-4 py-4">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-base font-medium text-zinc-900">Vào phòng? Nhập mã phòng</p>
          <div className="flex w-full max-w-md items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-sm">
            <input
              type="text"
              inputMode="numeric"
              placeholder="123 456"
              className="w-full bg-transparent text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200" aria-label="Tìm phòng">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M10 2a8 8 0 105.293 14.293l3.707 3.707a1 1 0 001.414-1.414l-3.707-3.707A8 8 0 0010 2zm-6 8a6 6 0 1110.392 4.242A6 6 0 014 10z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <div className="py-16 text-center">
        <h1 className="text-xl font-medium text-zinc-900 sm:text-2xl">
          Hãy thử thách trí tuệ cùng QuizzZone.
        </h1>
      </div>
    </div>
  );
}
