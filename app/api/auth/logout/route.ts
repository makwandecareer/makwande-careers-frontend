import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const token = (await cookies()).get("makwande_access_token")?.value;
  if (token) {
    await fetch(`${process.env.BACKEND_API_URL}/api/account/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }).catch(() => undefined);
  }
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set("makwande_access_token", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0),
  });
  return response;
}
