// app/forgot-password/layout.tsx
"use client";

import DefaultLayout from "@/app/default-layout";

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DefaultLayout>{children}</DefaultLayout>;
}
