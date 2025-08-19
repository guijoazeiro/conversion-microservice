export function buildWhereClause(query: Record<string, any>): {
  whereClause: string;
  values: any[];
} {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (!query || Object.keys(query).length === 0) {
    return { whereClause: '', values: [] };
  }

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      if (typeof value === 'string') {
        conditions.push(`${key} ILIKE $${paramIndex}`);
        values.push(`%${value}%`);
      } else if (typeof value === 'object' && value.$regex) {
        const regexValue = value.$regex.replace(/^\^|\$$/g, '');
        conditions.push(`${key} ILIKE $${paramIndex}`);
        values.push(`%${regexValue}%`);
      } else if (typeof value === 'object' && value.$in) {
        const placeholders = value.$in.map(() => `$${paramIndex++}`).join(', ');
        paramIndex--;
        conditions.push(`${key} IN (${placeholders})`);
        values.push(...value.$in);
      } else if (
        typeof value === 'object' &&
        (value.$gte || value.$lte || value.$gt || value.$lt)
      ) {
        if (value.$gte) {
          conditions.push(`${key} >= $${paramIndex}`);
          values.push(value.$gte);
          paramIndex++;
        }
        if (value.$lte) {
          conditions.push(`${key} <= $${paramIndex}`);
          values.push(value.$lte);
          paramIndex++;
        }
        if (value.$gt) {
          conditions.push(`${key} > $${paramIndex}`);
          values.push(value.$gt);
          paramIndex++;
        }
        if (value.$lt) {
          conditions.push(`${key} < $${paramIndex}`);
          values.push(value.$lt);
          paramIndex++;
        }
        continue;
      } else {
        conditions.push(`${key} = $${paramIndex}`);
        values.push(value);
      }
      paramIndex++;
    }
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  return { whereClause, values };
}
