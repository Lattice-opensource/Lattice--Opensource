const AUTH_KEY = "lattice_demo_auth";

export function isAuthenticated(): boolean {
  try {
    return localStorage.getItem(AUTH_KEY) === "1";
  } catch {
    return false;
  }
}

export function login(username: string, password: string): boolean {
  if (username === "admin" && password === "admin123") {
    try {
      localStorage.setItem(AUTH_KEY, "1");
    } catch {
      /* ignore */
    }
    return true;
  }
  return false;
}

export function logout(): void {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch {
    /* ignore */
  }
}