const { request, response } = require("express");
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const generateJWT = require("../Helpers/generate-jwt");

const login = async (req = request, res = response) => {
        
    try {
        
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: {
                email
            }
        });
    
        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Email or password incorrect',
            });
        }
    
        const validPassword = bcrypt.compareSync(password, user.password);
    
        if (!validPassword) {
            return res.status(400).json({
                success: false,
                error: 'Email or password incorrect',
            });
        }
    
        // Generate JWT
        const token = await generateJWT(user.id);

        const data = {
            id: user.id,
            name: user.name,
            lastname: user.lastName,
            email: user.email,
            image: user.image,
            phone: user.phone,
            session_token: token
        }
    
        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            msg: 'An error occurred',
            error: error.message
        });
    }
    
}

const register = async (req = request, res = response) => {
    
    console.log(req.body);
    try {
        
        const { name: namereq, lastname: lastnamereq, email: emailreq, password: passwordreq, phone: phonereq } = req.body;
        console.log(req.body);

        // Hashear la contraseña antes de crear el usuario
        const salt = bcrypt.genSaltSync();
        const hashedPassword = bcrypt.hashSync(passwordreq, salt);

        // Crear el usuario con la contraseña hasheada
        const user = await prisma.user.create({
            data: {
                name: namereq,
                lastName: lastnamereq,
                email: emailreq,
                phone: phonereq,
                password: hashedPassword
            }
        });

        // Generar el token JWT
        const token = await generateJWT(user.id);

        const { id, name, lastName, email, phone } = user;

        const data = {
            id,
            name,
            lastName,
            email,
            phone,
            session_token: token
        };

        res.json({
            success: true,
            data,
            message: 'User created successfully'
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
    register
}