export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mx-auto w-full rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-8 text-center text-2xl font-semibold text-zinc-900">Quên mật khẩu</h1>

        <form className="mx-auto max-w-2xl space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-800">
              Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              className="w-full rounded-md border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-[#E33AEC] focus:outline-none focus:ring-2 focus:ring-[#E33AEC]/30"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-800">
              Nhập mật khẩu <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              className="w-full rounded-md border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-[#E33AEC] focus:outline-none focus:ring-2 focus:ring-[#E33AEC]/30"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-800">
              Nhập lại mật khẩu <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              className="w-full rounded-md border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-[#E33AEC] focus:outline-none focus:ring-2 focus:ring-[#E33AEC]/30"
              required
            />
          </div>

          <div className="pt-2 text-center">
            <button
              type="submit"
              className="mx-auto w-56 rounded-full bg-[#E33AEC] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#d22adc]"
            >
              Đăng nhập
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
