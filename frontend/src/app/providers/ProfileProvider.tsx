import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthProvider";
import { getProfileMe } from "../../features/profile/api/profile.client";
import type {
  FitnessProfile,
  Macros,
  ProfileMeResponse,
} from "../../features/profile/api/profile.dto";

type ProfileContextType = {
  profile: FitnessProfile | null;
  macros: Macros | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token } = useAuth();

  const [profile, setProfile] = useState<FitnessProfile | null>(null);
  const [macros, setMacros] = useState<Macros | null>(null);
  const [loading, setLoading] = useState<boolean>(!!token);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!token) {
      setProfile(null);
      setMacros(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res: ProfileMeResponse = await getProfileMe(token);
      setProfile(res.profile ?? null);
      setMacros(res.macros ?? null);
    } catch (err: unknown) {
      setProfile(null);
      setMacros(null);
      if (err instanceof Error) {
        setError(err.message || "Failed to load profile");
      } else {
        setError("Failed to load profile");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const value = useMemo<ProfileContextType>(
    () => ({ profile, macros, loading, error, refresh }),
    [profile, macros, loading, error]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useProfile(): ProfileContextType {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return ctx;
}
