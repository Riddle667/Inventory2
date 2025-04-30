const { request, response } = require("express");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const getAlerts = async (req = request, res = response) => {
    try {
        const { id } = req.user;
        const alerts = await prisma.alert.findMany({
            where: {
                user_id: id
            },
            orderBy: {
                createdAt: 'desc' // Cambiado de created_at a createdAt
            }
        });

        res.json({
            success: true,
            message: 'Get Alerts',
            data: alerts
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'An error occurred',
            error: error.message
        });
    }
}


module.exports = {
    getAlerts
}