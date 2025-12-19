export type User = {
  id: number;
  email: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};
