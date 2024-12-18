const { Router } = require("express");
const { createClient, editClient, deleteClient, getClients, getClient, addBlacklist } = require("../Controller/clientController");
const { validateFields } = require("../Middleware/validate-fields");
const { check } = require("express-validator");
const { validateJWT } = require("../Middleware/validate-jwt");

const router = Router();

router.post(
    '/create-client',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('lastName', 'Lastname is required').not().isEmpty(),
        check('address', 'Address is required').not().isEmpty(),
        check('phone', 'Phone is required').not().isEmpty(),
        validateJWT,
        validateFields
    ],
    createClient
);

router.put(
    '/edit-client/:id',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('lastName', 'Last name is required').not().isEmpty(),
        check('rut', 'Rut is required').not().isEmpty(),
        check('address', 'Address is required').not().isEmpty(),
        check('phone', 'Phone is required').not().isEmpty(),
        validateJWT,
        validateFields
    ],
    editClient
);
router.delete(
    '/delete-client/:id',
    validateJWT,
    deleteClient
);

router.get('/get-clients',
    validateJWT, 
    getClients
);

router.get('/get-client/:id',
    validateJWT,
    getClient
)

router.get(
    '/add-blacklist/:id',
    validateJWT,
    addBlacklist
)

module.exports = router;