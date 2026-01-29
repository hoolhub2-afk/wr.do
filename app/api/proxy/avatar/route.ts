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

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://linux.do/",
      },
    });

    if (!response.ok) {
      // Fallback to dicebear avatar
      const fallbackUrl = `https://api.dicebear.com/9.x/initials/svg?seed=user`;
      return NextResponse.redirect(fallbackUrl);
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    // Fallback to dicebear avatar on error
    const fallbackUrl = `https://api.dicebear.com/9.x/initials/svg?seed=user`;
    return NextResponse.redirect(fallbackUrl);
  }
}
