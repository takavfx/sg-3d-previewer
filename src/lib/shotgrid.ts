import axios from "axios";

type JWT = {
  token_type: String;
  access_token: String;
  expires_in: number;
  refresh_token: String;
};

type AssetData = {};

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

export async function getAssetData(assetId: number): Promise<AssetData> {
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

  const assetData = res.data;

  return assetData;
}
