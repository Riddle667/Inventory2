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

        await prisma.user.update({
            where: { id: user.id },
            data: { session_token: token }
        });

        const data = {
            id: user.id,
            name: user.name,
            lastname: user.lastName,
            email: user.email,
            image: user.image,
            phone: user.phone,
            session_token: token,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
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

    await prisma.user.update({
      where: { id: user.id },
      data: { session_token: token }
    });

    const { id, name, lastName, email, phone, createdAt } = user;

    const data = {
      id,
      name,
      lastName,
      email,
      phone,
      session_token: token,
      createdAt
    };

    res.json({
      success: true,
      data,
      message: 'User created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'An error occurred',
      error: error.message
    });
  }
}

const logout = async (req = request, res = response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        msg: 'User not authenticated',
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { session_token: null }
    });

    res.json({
      success: true,
      msg: 'User logged out successfully'
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      msg: 'An error occurred',
      error: error.message
    });
  }
};

const resetPasswordDev = async (req = request, res = response) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        success: false,
        msg: 'Access denied in production environment'
      });
    }

    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        msg: 'Email and new password are required'
      });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, bcrypt.genSaltSync());

    const user = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      msg: `Password reset for ${email}`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: 'Error resetting password',
      error: error.message
    });
  }
};

module.exports = {
  login,
  register, 
  logout,
  resetPasswordDev,
}