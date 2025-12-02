const API_URL = 'http://localhost:4000';

export type User = {
  id: number;
  email: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.headers) {
    const optHeaders = options.headers as Record<string, string>;
    for (const [key, value] of Object.entries(optHeaders)) {
      baseHeaders[key] = value;
    }
  }

  if (token) {
    baseHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: baseHeaders,
  });

  if (!res.ok) {
    const text = await res.text();
    let message = `Request failed with status ${res.status}`;
    try {
      const json = JSON.parse(text) as { message?: string };
      if (json.message) {
        message = json.message;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export function loginRequest(email: string, password: string) {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function registerRequest(email: string, password: string) {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export type Macros = {
  tdee: number;
  targetCalories: number;
  proteinGrams: number;
  fatGrams: number;
  carbGrams: number;
};

export type FitnessProfile = {
  id: number;
  userId: number;
  gender: string;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: string;
  goalType: string;
  trainingDays: string;
};

export type ProfileMeResponse = {
  profile: FitnessProfile | null;
  macros: Macros | null;
};

export function getProfileMe(token: string) {
  return request<ProfileMeResponse>('/profile/me', {}, token);
}

export type UpsertProfileRequest = {
  gender: 'male' | 'female';
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: 'light' | 'moderate' | 'high';
  goalType: 'LOSE_FAT' | 'GAIN_MUSCLE' | 'MAINTAIN';
  trainingDays: string;
};

export type UpsertProfileResponse = {
  profile: FitnessProfile;
  macros: Macros;
};

export function upsertProfile(token: string, data: UpsertProfileRequest) {
  return request<UpsertProfileResponse>(
    '/profile/upsert',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    token
  );
}
