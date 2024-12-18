const { request, response } = require("express");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const createClient = async (req = request, res = response) => {
    try {
        const { name, lastName, rut, phone, address } = req.body;

        const client = await prisma.client.create({
            data: {
                name,
                lastName,
                rut,
                address,
                phone,
                user_id: req.user.id
            }
        });        
        
        res.json({
            success: true,
            message: 'Client created',
            data: client
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'An error occurred',
            error: error.message
        });
    }
}

const editClient = async (req = request, res = response) => {
    try {
        const { name, lastName, rut, phone, address } = req.body;
        const { id } = req.params;

        const client = await prisma.client.update({
            where: {
                id: parseInt(id)
            },
            data: {
                name,
                lastName,
                address,
                rut,
                phone
            }
        });

        res.json({
            success: true,
            message: 'Client updated',
            data: client
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'An error occurred',
            error: error.message
        });
    }
}

const deleteClient = async (req = request, res = response) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'id is required'
            });
        }

        await prisma.client.delete({
            where: {
                id: id
            }
        });

        res.json({
            success: true,
            message: 'Client deleted'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'An error occurred',
            error: error.message
        });
    }
}

const getClients = async (req = request, res = response) => {
    try {
        const clients = await prisma.client.findMany({
            where: {
                user_id: req.user.id
            }
        });

        res.json({
            success: true,
            data: clients
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'An error occurred',
            error: error.message
        });
    }
}

const purchasedProducts = async (req = request, res = response) => { 
    try {
        const { id } = req.params;

        const products = await prisma.order.findMany({
            where: {
                client_id: id
            },
            include: {
                order_product: {
                    include: {
                        product: true
                    }
                },
                installments: true
            }
        });

        res.json({
            success: true,
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

const getClient = async (req = request, res = response) => {
    try {
        const { id } = req.params; // Extraer el ID de los parámetros de la ruta

        const client = await prisma.client.findUnique({
            where: {
                id: parseInt(id), // Asegúrate de que este campo exista en tu modelo de Prisma
            },
            include: {

                orders: {
                    include: {
                        products: {
                            include: {
                                product: true
                            }
                        }
                    }
                }
            }
        });

        if (!client) {
            return res.status(404).json({
                success: false,
                message: "Cliente no encontrado",
            });
        }

        res.json({
            success: true,
            data: client,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Ocurrió un error",
            error: error.message,
        });
    }
};

const addBlacklist = async (req = request, res = response) => {
    try {
        const { id } = req.params;

        // Obtén el cliente actual
        const client = await prisma.client.findUnique({
            where: {
                id: parseInt(id)
            }
        });

        // Verifica si el cliente existe
        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        // Alterna el valor de isBlackList
        const updatedClient = await prisma.client.update({
            where: {
                id: parseInt(id)
            },
            data: {
                isBlackList: !client.isBlackList // Cambia a su opuesto
            }
        });

        res.json({
            success: true,
            message: `Client ${updatedClient.isBlackList ? 'added to' : 'removed from'} blacklist`,
            data: updatedClient
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'An error occurred',
            error: error.message
        });
    }
};



module.exports = {
    createClient,
    editClient,
    deleteClient,
    getClients,
    purchasedProducts,
    getClient,
    addBlacklist
}