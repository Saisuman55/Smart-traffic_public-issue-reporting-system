// Replaces Firebase auth.currentUser with JWT-based equivalent

function decodeJwt(token: string): any {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function getCurrentUser(): { uid: string; getIdToken: () => Promise<string> } | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  const decoded = decodeJwt(token);
  if (!decoded) return null;
  return {
    uid: decoded.id,
    getIdToken: async () => token,
  };
}

// Reactive proxy so auth.currentUser always reflects latest token
export const auth = {
  get currentUser() {
    return getCurrentUser();
  }
};

export function signOut(_auth: typeof auth): Promise<void> {
  localStorage.removeItem('token');
  window.location.reload();
  return Promise.resolve();
}
