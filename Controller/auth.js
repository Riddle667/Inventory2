const { request, response } = require("express");
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const generateJWT = require("../Helpers/generate-jwt");
const prisma = new PrismaClient();

const login = async (req = request, res = response) => {

    const { email, password } = req.body;
        
    try {
        const user = await prisma.user.findUnique({
            where: {
                email
            }
        });
    
        if (!user) {
            return res.status(400).json({
                success: false,
                msg: 'Email or password incorrect'
            });
        }
    
        const validPassword = bcrypt.compareSync(password, user.password);
    
        if (!validPassword) {
            return res.status(400).json({
                success: false,
                msg: 'Email or password incorrect'
            });
        }
    
        // Generate JWT
        const token = await generateJWT(user.id);

        const userData = {
            name: user.name,
            lastName: user.lastName,
            email: user.email,
            session_token: token
        }
    
        res.json({
            success: true,
            token
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            msg: 'An error occurred',
            error: error.message
        });
    }
    
}

module.exports = {
    login,
}