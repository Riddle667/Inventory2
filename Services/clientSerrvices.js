const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Fetches clients with installments close to their due date.
 * @param {number} limit - Maximum number of clients to fetch.
 * @returns {Promise<Array>} List of clients.
 */
const getClientsCloseInstallment = async (limit = 5) => {
    return prisma.client.findMany({
        where: {
            debt: { gt: 0 },
            orders: { some: { installments: { some: { due_date: { gt: new Date() } } } } },
        },
        select: {
            id: true,
            name: true,
            orders: { select: { installments: { where: { due_date: { gt: new Date() } }, select: { due_date: true } } } },
        },
        orderBy: {
            orders: { _min: { installments: { due_date: "asc" } } },
        },
        take: limit,
    });
};

/**
 * Fetches clients with overdue installments.
 * @param {number} limit - Maximum number of clients to fetch.
 * @returns {Promise<Array>} List of clients.
 */
const getClientsOverdueInstallment = async (limit = 5) => {
    return prisma.client.findMany({
        where: {
            debt: { gt: 0 },
            orders: { some: { installments: { some: { due_date: { lt: new Date() } } } } },
        },
        select: {
            id: true,
            name: true,
            orders: { select: { installments: { where: { due_date: { lt: new Date() } }, select: { due_date: true } } } },
        },
        orderBy: {
            orders: { _max: { installments: { due_date: "desc" } } },
        },
        take: limit,
    });
};

/**
 * Fetches aggregated statistics about clients.
 * @returns {Promise<Object>} Statistics data.
 */
const getClientStatistics = async () => {
    return prisma.client.aggregate({
        _count: { _all: true },
        _sum: { debt: true },
        where: { debt: { gt: 0 } },
    });
};

/**
 * Fetches the total count of clients without debt.
 * @returns {Promise<number>} Count of clients without debt.
 */
const getClientsWithoutDebt = async () => {
    return prisma.client.count({
        where: { debt: 0 },
    });
};

module.exports = {
    getClientsCloseInstallment,
    getClientsOverdueInstallment,
    getClientStatistics,
    getClientsWithoutDebt,
};
