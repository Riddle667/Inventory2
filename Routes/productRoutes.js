const { Router } = require("express");
const { createProduct, getProducts, getProduct, editProduct, deleteProduct } = require("../Controller/productController");
const { validateFields } = require("../Middleware/validate-fields");
const { validateJWT } = require("../Middleware/validate-jwt");
const { check } = require("express-validator");


const router = Router();

router.post(
    '/create-product',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('description', 'Description is required').not().isEmpty(),
        check('price', 'Price is required').not().isEmpty(),
        check('stock', 'Stock is required').not().isEmpty(),
        check('category_id', 'Category is required').not().isEmpty(),
        validateFields,
        validateJWT
    ], 
    createProduct

)

router.put(
    '/update-product/:id',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('description', 'Description is required').not().isEmpty(),
        check('price', 'Price is required').not().isEmpty(),
        check('stock', 'Stock is required').not().isEmpty(),
        check('category_id', 'Category is required').not().isEmpty(),
        validateFields,
        validateJWT
    ],
    editProduct
)

router.delete(
    '/delete-product/:id',
    validateJWT,
    deleteProduct
)

router.get(
    '/get-product/:id',
    validateJWT,
    getProduct
)

router.get(
    '/get-products',
    validateJWT,
    getProducts
)

module.exports = router;