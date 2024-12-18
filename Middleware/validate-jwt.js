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
            where: {
                id
            }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'invalid token'
            });
        }

        req.user = user;
        next();


    } catch (error) {
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'token expired',
                expired: true
            });
        }

        return res.status(401).json({
            success: false,
            message: 'invalid token',
            error
        });
    }
}

module.exports = {
    validateJWT
}