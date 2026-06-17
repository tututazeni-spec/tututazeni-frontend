"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeQueryClient } from "../lib/queryClient";

export default function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Um QueryClient por montagem do app (estável entre renders, sem partilhar
  // cache entre utilizadores no SSR). A config (cache/retry/backoff) vive em
  // lib/queryClient.ts.
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
