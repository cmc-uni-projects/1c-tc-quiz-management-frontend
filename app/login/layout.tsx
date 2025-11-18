// app/login/layout.tsx
"use client";

import DefaultLayout from "@/app/default-layout";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DefaultLayout>{children}</DefaultLayout>;
}
