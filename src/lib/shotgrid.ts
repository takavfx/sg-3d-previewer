import axios from "axios";

type JWT = {
  token_type: String;
  access_token: String;
  expires_in: number;
  refresh_token: String;
};

export type Version = {
  id: number;
  name: string;
  type: string;
};

export type VersionGroup = {
  versions: {
    data: Version[];
    links: { self: string };
  };
};

export async function getAccessToken(): Promise<JWT> {
  const res = await axios.request({
    url: `${process.env.SG_URL}/api/v1/auth/access_token`,
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    params: {
      grant_type: "client_credentials",
      client_id: process.env.SG_SCRIPT_NAME,
      client_secret: process.env.SG_API_KEY,
    },
  });
  const token: JWT = res.data;

  return token;
}

export async function refreshAccessToken(refresh_token: string): Promise<JWT> {
  const res = await axios.request({
    url: `${process.env.SG_URL}/api/v1/auth/access_token`,
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    params: {
      grant_type: "refresh_token",
      refresh_token: refresh_token,
    },
  });

  const token: JWT = res.data;

  return token;
}

export async function getAssetVersions(assetId: number): Promise<VersionGroup> {
  const token = await getAccessToken();

  const res = await axios.request({
    url: `${process.env.SG_URL}/api/v1/entity/assets/${assetId}/relationships/sg_versions?field[*]`,
    method: "GET",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `${token.token_type} ${token.access_token}`,
      Accept: "application/json",
    },
  });

  return res.data;
}

export async function getVersion(versionId: number): Promise<Version> {
  const token = await getAccessToken();

  const res = await axios.request({
    url: `${process.env.SG_URL}/api/v1/entity/versions/${versionId}?field[*]`,
    method: "GET",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `${token.token_type} ${token.access_token}`,
      Accept: "application/json",
    },
  });

  return res.data;
}
