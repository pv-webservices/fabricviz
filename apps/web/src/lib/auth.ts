import Cookies from 'js-cookie';

export const AUTH_TOKEN_KEY = 'token';
export const AUTH_USER_KEY = 'user';

export function setAuthToken(token: string) {
  Cookies.set(AUTH_TOKEN_KEY, token, {
    expires: 7, // 7 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}

export function removeAuthToken() {
  Cookies.remove(AUTH_TOKEN_KEY);
  Cookies.remove(AUTH_USER_KEY);
}

export function getAuthToken() {
  return Cookies.get(AUTH_TOKEN_KEY);
}

// Optionally store user info
export function setAuthUser(user: any) {
  Cookies.set(AUTH_USER_KEY, JSON.stringify(user), {
    expires: 7,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}

export function getAuthUser() {
  const user = Cookies.get(AUTH_USER_KEY);
  if (user) {
    try {
      return JSON.parse(user);
    } catch {
      return null;
    }
  }
  return null;
}
