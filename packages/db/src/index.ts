import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/excalidraw?sslmode=disable";

let _prisma: InstanceType<typeof PrismaClient> | null = null;

export function getPrisma() {
    if (!_prisma) {
        const adapter = new PrismaPg({ connectionString: DATABASE_URL });
        _prisma = new PrismaClient({ adapter });
    }
    return _prisma;
}

export { PrismaClient };

