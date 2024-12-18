const { Router } = require("express");
const { createOrder, editOrder, deleteOrder, getOrders, getOrder } = require("../Controller/orderController");
const { check } = require("express-validator");
const { validateJWT } = require("../Middleware/validate-jwt");


const router = Router();

router.post(
    '/create-order',
    check('order', 'Order is required').not().isEmpty(),
    validateJWT,
    createOrder
);

router.put(
    '/edit-order/:id',
    editOrder
);

router.delete(
    '/delete-order/:id',
    deleteOrder
);

router.get('/get-orders',
    getOrders
);

router.get('/get-order/:id',
    getOrder
)

module.exports = router;