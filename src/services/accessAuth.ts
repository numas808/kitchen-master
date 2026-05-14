interface AccessSessionResponse {
  authenticated?: boolean;
  protectionEnabled?: boolean;
  error?: string;
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

export async function fetchAccessSession(): Promise<Required<Pick<AccessSessionResponse, 'authenticated' | 'protectionEnabled'>>> {
  const response = await fetch('/api/access/session', {
    credentials: 'same-origin',
  });
  const data = await readJson<AccessSessionResponse>(response);

  if (!response.ok) {
    throw new Error(data.error ?? 'アクセス状態の確認に失敗しました。');
  }

  return {
    authenticated: Boolean(data.authenticated),
    protectionEnabled: Boolean(data.protectionEnabled),
  };
}

export async function loginWithAccessPassword(password: string): Promise<void> {
  const response = await fetch('/api/access/session', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });
  const data = await readJson<AccessSessionResponse>(response);

  if (!response.ok) {
    throw new Error(data.error ?? 'パスワード認証に失敗しました。');
  }
}

export async function logoutAccessSession(): Promise<void> {
  await fetch('/api/access/session', {
    method: 'DELETE',
    credentials: 'same-origin',
  });
}
