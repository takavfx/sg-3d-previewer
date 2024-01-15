import { type NextRequest } from "next/server";
import { getVersion } from "@/lib/shotgrid";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  const version = await getVersion(Number(id));
  return Response.json({ version });
}
