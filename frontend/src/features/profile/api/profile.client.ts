import { request } from "../../../shared/api/http";
import type {
  ProfileMeResponse,
  UpsertProfileRequest,
  UpsertProfileResponse,
} from "./profile.dto";

export function getProfileMe(token: string) {
  return request<ProfileMeResponse>("/profile/me", {}, token);
}

export function upsertProfile(token: string, data: UpsertProfileRequest) {
  return request<UpsertProfileResponse>(
    "/profile/upsert",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token
  );
}
