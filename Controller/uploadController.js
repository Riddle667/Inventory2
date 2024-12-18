const { request, response } = require("express");
const cloudinary = require('cloudinary').v2;
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Función para subir una imagen a Cloudinary
const uploadToCloudinary = async (filePath, folder) => {
    return await cloudinary.uploader.upload(filePath, { folder });
};

// Función para eliminar una imagen de Cloudinary
const deleteFromCloudinary = async (public_id) => {
    await cloudinary.uploader.destroy(public_id);
};

const uploadImageCloudinary = async (req = request, res = response) => {
    try {
        const { collection, id } = req.params;

        if (collection === 'users') {
            const user = await prisma.user.findUnique({
                where: { id: req.user.id }
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Eliminar imagen anterior
            if (user.image) {
                const public_id = user.image.split('/').pop().split('.')[0];
                await deleteFromCloudinary(`AppInventory/users/${user.name}/${public_id}`);
            }

            // Subir nueva imagen a Cloudinary
            const { tempFilePath } = req.files.archive;
            const { secure_url } = await uploadToCloudinary(tempFilePath, `AppInventory/users/${user.name}`);

            // Actualizar imagen en la base de datos
            await prisma.user.update({
                where: { id: req.user.id },
                data: { image: secure_url }
            });

            return res.status(201).json({
                success: true,
                message: 'User image uploaded and updated',
                data: secure_url
            });

        } else if (collection === 'products') {
            const product = await prisma.product.findUnique({
                where: { id: parseInt(id) }
            });

            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            // Verificar que el usuario autenticado es el creador del producto
            if (product.user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized to update this product images'
                });
            }

            const files = Array.isArray(req.files.archive) ? req.files.archive : [req.files.archive];
            if (files.length > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'The maximum number of images is 5'
                });
            }

            // Obtener el nombre del usuario creador del producto
            const user = await prisma.user.findUnique({
                where: { id: req.user.id }
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'User associated with the product not found'
                });
            }

            // Eliminar todas las imágenes antiguas del producto
            const oldImages = await prisma.image.findMany({
                where: { product_id: parseInt(id) }
            });

            await Promise.all(oldImages.map(async (image) => {
                const public_id = image.url.split('/').pop().split('.')[0];
                await deleteFromCloudinary(`AppInventory/users/${user.name}/productos/${public_id}`);
                await prisma.image.delete({ where: { id: image.id } });
            }));

            // Subir nuevas imágenes
            const uploadedImageUrls = await Promise.all(files.map(async (file) => {
                const { tempFilePath } = file;
                const { secure_url } = await uploadToCloudinary(tempFilePath, `AppInventory/users/${user.name}/productos`);
                
                await prisma.image.create({
                    data: {
                        url: secure_url,
                        product: { connect: { id: parseInt(id) } }
                    }
                });

                return secure_url;
            }));

            return res.status(201).json({
                success: true,
                message: 'Product images uploaded and saved',
                data: uploadedImageUrls
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'The collection option is not valid'
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while uploading the image(s)',
            error: error.message
        });
    }
};

module.exports = {
    uploadImageCloudinary
};
