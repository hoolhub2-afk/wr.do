import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Only allow linux.do avatar URLs
  if (!url.startsWith("https://linux.do/") && !url.startsWith("https://cdn.linux.do/")) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Extract username from URL for fallback
  const usernameMatch = url.match(/\/user_avatar\/[^/]+\/([^/]+)\//);
  const username = usernameMatch ? usernameMatch[1] : "user";

  try {
    // Try fetching with browser-like headers
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Sec-Fetch-Dest": "image",
        "Sec-Fetch-Mode": "no-cors",
        "Sec-Fetch-Site": "cross-site",
      },
      cache: "force-cache",
    });

    if (response.ok) {
      const contentType = response.headers.get("content-type") || "image/png";
      const buffer = await response.arrayBuffer();

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=604800, immutable",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  } catch (error) {
    console.error("Avatar proxy error:", error);
  }

  // Fallback: redirect to dicebear with username
  const fallbackUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(username)}`;
  return NextResponse.redirect(fallbackUrl, 302);
}
