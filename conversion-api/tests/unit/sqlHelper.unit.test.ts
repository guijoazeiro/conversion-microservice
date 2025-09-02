import { describe, it, expect } from 'vitest';
import { buildWhereClause } from '../../src/utils/sqlHelper';

describe('SQL Helper - buildWhereClause', () => {
  describe('Empty and null queries', () => {
    it('should return empty clause for undefined query', () => {
      const result = buildWhereClause(undefined as any);
      
      expect(result.whereClause).toBe('');
      expect(result.values).toEqual([]);
    });

    it('should return empty clause for null query', () => {
      const result = buildWhereClause(null as any);
      
      expect(result.whereClause).toBe('');
      expect(result.values).toEqual([]);
    });

    it('should return empty clause for empty object', () => {
      const result = buildWhereClause({});
      
      expect(result.whereClause).toBe('');
      expect(result.values).toEqual([]);
    });

    it('should ignore undefined and null values', () => {
      const query = {
        name: 'John',
        age: undefined,
        status: null,
        active: true
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE name ILIKE $1 AND active = $2');
      expect(result.values).toEqual(['%John%', true]);
    });
  });

  describe('String values', () => {
    it('should handle single string value with ILIKE', () => {
      const query = { name: 'John' };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE name ILIKE $1');
      expect(result.values).toEqual(['%John%']);
    });

    it('should handle multiple string values', () => {
      const query = { 
        name: 'John', 
        email: 'john@email.com' 
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE name ILIKE $1 AND email ILIKE $2');
      expect(result.values).toEqual(['%John%', '%john@email.com%']);
    });

    it('should handle empty string', () => {
      const query = { name: '' };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE name ILIKE $1');
      expect(result.values).toEqual(['%%']);
    });
  });

  describe('Exact value matches', () => {
    it('should handle boolean values', () => {
      const query = { 
        active: true, 
        deleted: false 
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE active = $1 AND deleted = $2');
      expect(result.values).toEqual([true, false]);
    });

    it('should handle number values', () => {
      const query = { 
        age: 25, 
        score: 0 
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE age = $1 AND score = $2');
      expect(result.values).toEqual([25, 0]);
    });

    it('should handle mixed types', () => {
      const query = {
        name: 'John',
        age: 25,
        active: true
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE name ILIKE $1 AND age = $2 AND active = $3');
      expect(result.values).toEqual(['%John%', 25, true]);
    });
  });

  describe('Regex operations', () => {
    it('should handle $regex with anchors', () => {
      const query = { 
        name: { $regex: '^John$' } 
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE name ILIKE $1');
      expect(result.values).toEqual(['%John%']);
    });

    it('should handle $regex without anchors', () => {
      const query = { 
        name: { $regex: 'John' } 
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE name ILIKE $1');
      expect(result.values).toEqual(['%John%']);
    });

    it('should handle $regex with partial anchors', () => {
      const query = { 
        email: { $regex: '^admin' } 
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE email ILIKE $1');
      expect(result.values).toEqual(['%admin%']);
    });
  });

  describe('$in operations', () => {
    it('should handle $in with multiple values', () => {
      const query = { 
        status: { $in: ['active', 'pending', 'inactive'] } 
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE status IN ($1, $2, $3)');
      expect(result.values).toEqual(['active', 'pending', 'inactive']);
    });

    it('should handle $in with single value', () => {
      const query = { 
        role: { $in: ['admin'] } 
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE role IN ($1)');
      expect(result.values).toEqual(['admin']);
    });

    it('should handle $in with numbers', () => {
      const query = { 
        age: { $in: [25, 30, 35] } 
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE age IN ($1, $2, $3)');
      expect(result.values).toEqual([25, 30, 35]);
    });

    it('should handle $in with empty array', () => {
      const query = { 
        status: { $in: [] } 
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE status IN ()');
      expect(result.values).toEqual([]);
    });
  });

  describe('Understanding actual behavior', () => {
    it('should debug $gt only behavior', () => {
      const query = { score: { $gt: 0 } };
      
      const result = buildWhereClause(query);
      
      expect(result.values.length).toBeGreaterThan(0);
    });

    it('should debug complex range behavior', () => {
      const query = { 
        score: { $gt: 0, $gte: 1, $lt: 100, $lte: 99 } 
      };
      
      const result = buildWhereClause(query);
      
      expect(result.values.length).toBeGreaterThan(0);
    });
  });

  describe('Range operations', () => {
    it('should handle $gte (greater than or equal)', () => {
      const query = { 
        age: { $gte: 18 } 
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE age >= $1');
      expect(result.values).toEqual([18]);
    });

    it('should handle $lte (less than or equal)', () => {
      const query = { 
        age: { $lte: 65 } 
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE age <= $1');
      expect(result.values).toEqual([65]);
    });

    it('should handle $gt (greater than)', () => {
      const query = { 
        score: { $gt: 100 } 
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE score > $1');
      expect(result.values).toEqual([100]);
    });

    it('should handle $lt (less than)', () => {
      const query = { 
        price: { $lt: 50.99 } 
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE price < $1');
      expect(result.values).toEqual([50.99]);
    });

    it('should handle range with both $gte and $lte', () => {
      const query = { 
        age: { $gte: 18, $lte: 65 } 
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE age >= $1 AND age <= $2');
      expect(result.values).toEqual([18, 65]);
    });

    it('should handle range with all operators', () => {
      const query = { 
        score: { $gt: 0, $gte: 1, $lt: 100, $lte: 99 } 
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE score >= $1 AND score <= $2 AND score < $3');
      expect(result.values).toEqual([1, 99, 100]);
    });

    it('should handle date ranges', () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      
      const query = { 
        created_at: { $gte: startDate, $lte: endDate } 
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE created_at >= $1 AND created_at <= $2');
      expect(result.values).toEqual([startDate, endDate]);
    });
  });

  describe('Complex queries', () => {
    it('should handle mixed operators on different fields', () => {
      const query = {
        name: 'John',
        age: { $gte: 18, $lte: 65 },
        status: { $in: ['active', 'pending'] },
        score: { $gt: 50 },
        active: true
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe(
        'WHERE name ILIKE $1 AND age >= $2 AND age <= $3 AND status IN ($4, $5) AND score > $6 AND active = $7'
      );
      expect(result.values).toEqual(['%John%', 18, 65, 'active', 'pending', 50, true]);
    });

    it('should handle regex and exact match on different fields', () => {
      const query = {
        email: { $regex: '^admin' },
        department: 'IT',
        level: { $in: [1, 2, 3] }
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE email ILIKE $1 AND department ILIKE $2 AND level IN ($3, $4, $5)');
      expect(result.values).toEqual(['%admin%', '%IT%', 1, 2, 3]);
    });

    it('should maintain correct parameter indexing', () => {
      const query = {
        field1: 'value1',
        field2: { $in: ['a', 'b'] },
        field3: { $gte: 10 },
        field4: 'value4'
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe(
        'WHERE field1 ILIKE $1 AND field2 IN ($2, $3) AND field3 >= $4 AND field4 ILIKE $5'
      );
      expect(result.values).toEqual(['%value1%', 'a', 'b', 10, '%value4%']);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero values', () => {
      const query = { 
        count: 0,
        percentage: 0.0 
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE count = $1 AND percentage = $2');
      expect(result.values).toEqual([0, 0.0]);
    });

    it('should handle special characters in strings', () => {
      const query = { 
        description: "It's a test with 'quotes' and \"double quotes\"" 
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE description ILIKE $1');
      expect(result.values).toEqual(["%It's a test with 'quotes' and \"double quotes\"%"]);
    });

    it('should handle object with unknown properties', () => {
      const query = {
        name: 'John',
        metadata: { unknown: 'property' }
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE name ILIKE $1 AND metadata = $2');
      expect(result.values).toEqual(['%John%', { unknown: 'property' }]);
    });

    it('should handle arrays as exact values (not $in)', () => {
      const query = {
        tags: ['tag1', 'tag2']
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE tags = $1');
      expect(result.values).toEqual([['tag1', 'tag2']]);
    });

    it('should handle nested objects without special operators', () => {
      const query = {
        metadata: { type: 'user', version: 1 }
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE metadata = $1');
      expect(result.values).toEqual([{ type: 'user', version: 1 }]);
    });
  });

  describe('SQL injection prevention', () => {
    it('should safely handle malicious strings', () => {
      const query = {
        name: "'; DROP TABLE users; --"
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE name ILIKE $1');
      expect(result.values).toEqual(["%'; DROP TABLE users; --%"]);
    });

    it('should safely handle malicious regex', () => {
      const query = {
        email: { $regex: "'; DROP TABLE users; --" }
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE email ILIKE $1');
      expect(result.values).toEqual(["%'; DROP TABLE users; --%"]);
    });

    it('should safely handle malicious $in values', () => {
      const query = {
        role: { $in: ["admin'; DROP TABLE users; --", 'user'] }
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE role IN ($1, $2)');
      expect(result.values).toEqual(["admin'; DROP TABLE users; --", 'user']);
    });
  });

  describe('Parameter indexing', () => {
    it('should correctly index parameters in complex query', () => {
      const query = {
        field1: 'value1',           
        field2: { $gte: 10 },       
        field3: { $in: ['a', 'b'] },
        field4: { $lte: 20 },       
        field5: 'value5'            
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe(
        'WHERE field1 ILIKE $1 AND field2 >= $2 AND field3 IN ($3, $4) AND field4 <= $5 AND field5 ILIKE $6'
      );
      expect(result.values).toEqual(['%value1%', 10, 'a', 'b', 20, '%value5%']);
    });

    it('should handle large $in array with correct indexing', () => {
      const query = {
        id: { $in: [1, 2, 3, 4, 5] },
        name: 'test'
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE id IN ($1, $2, $3, $4, $5) AND name ILIKE $6');
      expect(result.values).toEqual([1, 2, 3, 4, 5, '%test%']);
    });
  });

  describe('Range combinations', () => {
    it('should handle only $gte', () => {
      const query = { age: { $gte: 18 } };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE age >= $1');
      expect(result.values).toEqual([18]);
    });
    

    it('should handle $gt and $lt combination', () => {
      const query = { 
        price: { $gt: 10, $lt: 100 } 
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE price > $1 AND price < $2');
      expect(result.values).toEqual([10, 100]);
    });

    it('should handle range object with other operators mixed', () => {
      const query = {
        name: 'John',
        age: { $gte: 18, $lte: 65 },
        status: { $in: ['active'] }
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe('WHERE name ILIKE $1 AND age >= $2 AND age <= $3 AND status IN ($4)');
      expect(result.values).toEqual(['%John%', 18, 65, 'active']);
    });
  });

  describe('Real world scenarios', () => {
    it('should handle user search query', () => {
      const query = {
        name: 'João',
        age: { $gte: 18 },
        status: { $in: ['active', 'verified'] },
        department: 'Engineering'
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe(
        'WHERE name ILIKE $1 AND age >= $2 AND status IN ($3, $4) AND department ILIKE $5'
      );
      expect(result.values).toEqual(['%João%', 18, 'active', 'verified', '%Engineering%']);
    });

    it('should handle product search with price range', () => {
      const query = {
        name: 'laptop',
        price: { $gte: 500, $lte: 2000 },
        category: { $in: ['electronics', 'computers'] },
        available: true
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe(
        'WHERE name ILIKE $1 AND price >= $2 AND price <= $3 AND category IN ($4, $5) AND available = $6'
      );
      expect(result.values).toEqual(['%laptop%', 500, 2000, 'electronics', 'computers', true]);
    });

    it('should handle date range query', () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      
      const query = {
        status: 'completed',
        created_at: { $gte: startDate, $lte: endDate },
        user_id: { $in: [1, 2, 3] }
      };
      
      const result = buildWhereClause(query);
      
      expect(result.whereClause).toBe(
        'WHERE status ILIKE $1 AND created_at >= $2 AND created_at <= $3 AND user_id IN ($4, $5, $6)'
      );
      expect(result.values).toEqual(['%completed%', startDate, endDate, 1, 2, 3]);
    });
  });
});