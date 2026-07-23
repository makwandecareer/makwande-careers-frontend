import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const BACKEND_API_URL = process.env.BACKEND_API_URL?.replace(/\/+$/, "");

async function proxy(request: NextRequest, context: RouteContext) {
  try {
    if (!BACKEND_API_URL) {
      return NextResponse.json(
        {
          detail:
            "BACKEND_API_URL is not configured in the frontend environment.",
        },
        { status: 500 },
      );
    }

    const { path } = await context.params;

    if (!Array.isArray(path) || path.length === 0) {
      return NextResponse.json(
        { detail: "A backend API path is required." },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("makwande_access_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          detail: "Authentication required. Please log in again.",
        },
        { status: 401 },
      );
    }

    const backendPath = path
      .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
      .join("/");

    const target = `${BACKEND_API_URL}/${backendPath}${request.nextUrl.search}`;

    const headers = new Headers();

    headers.set("Accept", request.headers.get("accept") || "application/json");
    headers.set("Authorization", `Bearer ${token}`);

    const contentType = request.headers.get("content-type");

    if (contentType) {
      headers.set("Content-Type", contentType);
    }

    const hasBody =
      request.method !== "GET" &&
      request.method !== "HEAD" &&
      request.method !== "OPTIONS";

    const body = hasBody ? await request.arrayBuffer() : undefined;

    const backendResponse = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
    });

    const responseHeaders = new Headers();

    const forwardedHeaders = [
      "content-type",
      "content-disposition",
      "location",
    ];

    for (const headerName of forwardedHeaders) {
      const value = backendResponse.headers.get(headerName);

      if (value) {
        responseHeaders.set(headerName, value);
      }
    }

    responseHeaders.set("Cache-Control", "no-store");

    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Backend proxy error:", error);

    return NextResponse.json(
      {
        detail: "The frontend could not communicate with the backend.",
      },
      { status: 502 },
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;