const { request, response } = require("express");
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const changePassword = async (req = request, res = response) => {
    try {
      console.log(req.body);
      const { password, newPassword } = req.body;
      const userId = req.user?.id;
  
      if (!userId) {
          return res.status(401).json({
              success: false,
              message: 'User not authenticated',
          });
      }
  
      const user = await prisma.user.findUnique({
          where: { id: userId }
      });
  
      if (!user) {
          return res.status(404).json({
              success: false,
              message: 'User not found',
          });
      }
  
      const validPassword = bcrypt.compareSync(password, user.password);
  
      if (!validPassword) {
          return res.status(400).json({
              success: false,
              message: 'Old password is incorrect',
          });
      }
  
      const hashedNewPassword = bcrypt.hashSync(newPassword, bcrypt.genSaltSync());
  
      await prisma.user.update({
          where: { id: userId },
          data: { password: hashedNewPassword }
      });
  
      res.json({
          success: true,
          message: 'Password changed successfully'
      });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'An error occurred',
            error: error.message
        });
    }
}
  
  const deleteUser = async (req = request, res = response) => {
    try {
      const userId = req.user?.id;
  
      if (!userId) {
        return res.status(401).json({
          success: false,
          msg: 'User not authenticated',
        });
      }
  
      // Verificamos si el usuario existe primero (opcional pero recomendable)
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      });
  
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          msg: 'User not found',
        });
      }
  
      // Eliminamos al usuario (y todo en cascada si el esquema está bien como lo tienes)
      await prisma.user.delete({
        where: { id: userId },
      });
  
      return res.json({
        success: true,
        msg: 'User deleted successfully',
      });
    } catch (error) {
      console.error('[Delete User Error]', error);
  
      return res.status(500).json({
        success: false,
        msg: 'An error occurred while deleting the user',
        error: error.message,
      });
    }
  };
  
  
  module.exports = {
    changePassword,
    deleteUser
  };