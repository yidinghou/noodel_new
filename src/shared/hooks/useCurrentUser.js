import { useState, useEffect } from 'react';

export const NOODEL_LOGIN_EVENT = 'noodel-login';

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState(
    () => localStorage.getItem('noodel_username')
  );

  useEffect(() => {
    const handler = () => setCurrentUser(localStorage.getItem('noodel_username'));
    window.addEventListener(NOODEL_LOGIN_EVENT, handler);
    return () => window.removeEventListener(NOODEL_LOGIN_EVENT, handler);
  }, []);

  return currentUser;
}
