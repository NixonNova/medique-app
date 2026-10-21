type SqlRow = Record<string, unknown>;

type SqlResponse<T> = {
  rows?: T[];
};

export async function query<T extends SqlRow>(sql: string, params: unknown[] = []): Promise<T[]> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const host = connectionString.match(/@([^/?]+)/)?.[1];
  if (!host) {
    throw new Error('DATABASE_URL is invalid');
  }

  const response = await fetch(`https://${host}/sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Neon-Connection-String': connectionString,
    },
    body: JSON.stringify({ query: sql, params }),
  });

  if (!response.ok) {
    throw new Error(`Database request failed (${response.status})`);
  }

  const payload = (await response.json()) as SqlResponse<T>;
  return payload.rows ?? [];
}
