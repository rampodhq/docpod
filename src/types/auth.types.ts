export type AccountType = "organization" | "personal";

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  accountType: AccountType;
  organizationName?: string; // Only for organization accounts
  createdAt: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  image?: File;
  accountType: AccountType;
  organizationName?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  login: (data: LoginData) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  updateProfileImage: (image: File) => Promise<void>;
  isAuthenticated: boolean;
}
