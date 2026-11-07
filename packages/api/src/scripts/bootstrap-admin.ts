/**
 * One-time, private administrator creation command.
 *
 * Run from an interactive shell *inside the API container* using temporary
 * FORMGRID_BOOTSTRAP_EMAIL and FORMGRID_BOOTSTRAP_PASSWORD variables.
 *
 * Never put these credentials in Compose, GitHub, or a Dokploy saved env.
 */
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';

async function main(): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
        throw new Error('This bootstrap command must run with NODE_ENV=production');
    }

    const email = process.env.FORMGRID_BOOTSTRAP_EMAIL?.trim().toLowerCase() || '';
    const password = process.env.FORMGRID_BOOTSTRAP_PASSWORD || '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Set a valid FORMGRID_BOOTSTRAP_EMAIL in the current shell');
    }
    if (password.length < 16 || password.length > 1024) {
        throw new Error('FORMGRID_BOOTSTRAP_PASSWORD must contain at least 16 characters');
    }

    // Refuse to provision additional users or replace an existing account.
    // Run the command only once, from a trusted server shell.
    const existingUsers = await prisma.user.count();
    if (existingUsers !== 0) {
        throw new Error('Bootstrap refused: accounts already exist');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
        data: {
            email,
            passwordHash,
            isEmailVerified: true,
            profile: { create: {} },
        },
    });

    console.log('Initial Formgrid administrator created.');
}

main()
    .catch((error: unknown) => {
        console.error(error instanceof Error ? error.message : 'Bootstrap failed');
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
