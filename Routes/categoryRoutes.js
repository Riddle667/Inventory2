const { Router } = require("express");
const { createCategory, editCategory, getCategories } = require("../Controller/categoryController");
const { validateJWT } = require("../Middleware/validate-jwt");
const { check } = require("express-validator");
const { validateFields } = require("../Middleware/validate-fields");




const router = Router();

router.post(
    '/create-category',
    [
        check('name', 'Name is required').not().isEmpty(),
        validateJWT,
        validateFields
    ] , 
    createCategory
);

router.put(
    '/edit-category/:id',
    [
        check('name', 'Name is required').not().isEmpty(),
        validateJWT,
        validateFields
    ] , 
    editCategory
);

router.get(
    '/get-categories',
    validateJWT,
    getCategories
);


module.exports = router;