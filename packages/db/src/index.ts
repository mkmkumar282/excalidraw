import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { DATABASE_URL } from '@repo/backend-common/config';

let _prisma: InstanceType<typeof PrismaClient> | null = null;

export function getPrisma() {
    if (!_prisma) {
        const adapter = new PrismaPg({ connectionString: DATABASE_URL });
        _prisma = new PrismaClient({ adapter });
    }
    return _prisma;
}

export { PrismaClient };

