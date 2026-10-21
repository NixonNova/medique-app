import { query } from '@/server/db';

type ClinicRow = {
  id: number | string;
  name: string;
};

export async function GET() {
  try {
    const rows = await query<ClinicRow>(`
      SELECT "ID" AS "id", "ClinicName" AS "name"
      FROM "clinic"
      ORDER BY "ID" ASC
    `);
    return Response.json({
      clinics: rows.map((row) => ({
        id: Number(row.id),
        name: row.name,
      })),
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Klinik tidak dapat dimuat' }, { status: 500 });
  }
}
