const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { request, response } = require("express");



const createCategory = async (req = request, res = response) => {

    try {
    
        const { name } = req.body;

        const category = await prisma.category.create({
            data: {
                name,
                user_id: req.user.id
            }
        });


        res.json({
            success: true,
            message: 'Create Category',
            data: category
        });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            success: false,
            message: 'An error occurred',
            error: error.message
        });
    }
}

const editCategory = async (req = request, res = response) => {

    try {
    
        const { id } = req.params;
        const { name } = req.body;

        const category = await prisma.category.update({
            where: {
                id: parseInt(id)
            },
            data: {
                name
            }
        });

        res.json({
            success: true,
            message: 'Edit Category',
            data: category
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'An error occurred',
            error: error.message
        });
    }
}

const deleteCategory = async (req = request, res = response) => {
    try {
    
        const { id } = req.params;

        await Prisma.category.delete({
            where: {
                id
            }
        });

        res.json({
            success: true,
            message: 'Delete Category'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'An error occurred',
            error: error.message
        });
    }
}

const getCategories = async (req = request, res = response) => {
    
        try {
        
            const categories = await prisma.category.findMany(
                {
                    where: {
                        user_id: req.user.id
                    }
                }
            );
    
            res.json({
                success: true,
                message: 'Get Categories',
                data: categories
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
    createCategory,
    editCategory,
    deleteCategory,
    getCategories
}