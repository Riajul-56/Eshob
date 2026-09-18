import { type NextRequest } from "next/server";
import QRCode from "qrcode";

export const runtime = "nodejs";

/**
 * GET /api/qr?data=<url>
 * Returns a PNG QR code for the given data. Used to render/download campaign
 * QR codes in the dashboard.
 */
export async function GET(req: NextRequest) {
  const data = req.nextUrl.searchParams.get("data");
  if (!data) {
    return new Response("Missing 'data' query param", { status: 400 });
  }

  const png = await QRCode.toBuffer(data, {
    width: 320,
    margin: 1,
    color: { dark: "#16171B", light: "#ffffff" },
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
