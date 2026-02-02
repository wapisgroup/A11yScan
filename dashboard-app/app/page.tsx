"use client";

import { PrivateRoute } from "@/utils/private-router";

export default function Home() {


  return (
    <PrivateRoute>
      <h1>No-page</h1>
    </PrivateRoute>
  )
}
