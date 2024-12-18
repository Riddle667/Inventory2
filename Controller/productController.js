const { request, response } = require("express");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const createProduct = async (req = request, res = response) => {
    
    try {
    
        const { name, description, price, stock, category_id } = req.body;
        console.log(req.files);

        const category = await prisma.category.findUnique({
            where: {
                id: parseInt(category_id)
            }
        });

        if (!category) {
            return res.status(400).json({
                success: false,
                message: 'Category not found'
            });
        }

        const product = await prisma.product.create({
            data: {
                name,
                description,
                price: parseFloat(price),
                stock: parseInt(stock),
                category_id: parseInt(category_id),
                user_id: req.user.id
            }
        });
    
        res.json({
            success: true,
            message: 'Create Product',
            data: product
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

const editProduct = async (req = request, res = response) => {
        
    try {
    
        const { id } = req.params;
        const { name, description, price, category_id } = req.body;

        const category = await prisma.category.findUnique({
            where: {
                    id: category_id
            }
        });

        if (!category) {
            return res.status(400).json({
                success: false,
                message: 'Category not found'
            });
        }

        const product = await prisma.product.update({
            where: {
                id: parseInt(id)
            },
            data: {
                name,
                description,
                price,
                category_id
            }
        });

        res.json({
            success: true,
            message: 'Edit Product',
            data: product
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'An error occurred',
            error: error.message
        });
    }
}

const deleteProduct = async (req = request, res = response) => {
    
    try {
    
        const { id } = req.params;

        const product = await prisma.product.findUnique({
            where: {
                id: parseInt(id)
            },
            include: {
                order: true
            }
        });

        if (!product) {
            return res.status(400).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (product.order.length > 0) {
            await prisma.product.update({
                where: {
                    id: parseInt(id)
                },
                data: {
                    is_active: false
                }
            });
        } else {
            await prisma.product.delete({
                where: {
                    id: parseInt(id)
                }
            });
        }

        res.json({
            success: true,
            message: 'Delete Product',
            data: product
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

const getProducts = async (req = request, res = response) => {
    
    try {
    
        const products = await prisma.product.findMany(
            {
                where: {
                    user_id: req.user.id,
                    is_active: true
                },
                include: {
                    category: true
                }
            }
        );

        res.status(200).json({
            success: true,
            message: 'Get Products',
            data: products
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'An error occurred',
            error: error.message
        });
    }
}

const getProduct = async (req = request, res = response) => {
        
        try {
        
            const { id } = req.params;
    
            const product = await prisma.product.findUnique({
                where: {
                    id: parseInt(id)
                },
                include: {
                    images: true,
                    orders: {
                        include: {
                            order: {
                                include: {
                                    client: true
                                }
                            }
                        }
                    }
                }
            });
    
            res.json({
                success: true,
                message: 'Get Product',
                data: product
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

module.exports = {
    createProduct,
    editProduct,
    deleteProduct,
    getProducts,
    getProduct
}