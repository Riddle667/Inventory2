const { request, response } = require("express");
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const validateJWT = async (req = request, res = response, next) => {
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
        success: false,
        message: 'No token provided'
        });
    }

    try {
        const { id } = jwt.verify(token, process.env.SECRET_OR_PRIVATE_KEY);

        const user = await prisma.user.findUnique({
        where: { id }
        });

        // 🔒 Nueva verificación: validar que el token coincida con el session_token
        if (!user || user.session_token !== token) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired session'
        });
        }

        req.user = user;
        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired',
            expired: true
        });
        }

        return res.status(401).json({
        success: false,
        message: 'Invalid token',
        error
        });
    }
};

module.exports = {
    validateJWT
}