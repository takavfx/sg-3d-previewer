import { type NextRequest } from "next/server";
import { getAssetVersions } from "@/lib/shotgrid";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  const versions = await getAssetVersions(Number(id));
  return Response.json({ versions });
}
