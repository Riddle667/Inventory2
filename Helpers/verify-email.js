const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const verifyEmailLogin = async (email) => {
    const existEmail = await prisma.user.findUnique({ where: { email } });

    if (!existEmail) {
        throw new Error('Email not exists in the system.');
    }
}


const verifyEmail = async (email) => {
    const existEmail = await prisma.user.findUnique({ where: { email } });

    if (existEmail) {
        throw new Error('This email already exists');
    }
}


module.exports = {
    verifyEmailLogin,
    verifyEmail,
};