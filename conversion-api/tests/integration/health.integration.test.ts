import supertest from "supertest";
import { describe, it, expect } from "vitest";
import app from "../../src/app";

describe('Health - Integration Tests', () => {
    it('should return 200', async () => {
        const response = await supertest(app).get('/health');
        expect(response.statusCode).toBe(200);
    });
});