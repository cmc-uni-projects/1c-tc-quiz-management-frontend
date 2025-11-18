// app/register/layout.tsx
"use client";

import DefaultLayout from "@/app/default-layout";

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DefaultLayout>{children}</DefaultLayout>;
}
