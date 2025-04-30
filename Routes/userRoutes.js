const { Router } = require("express");
const { changePassword, deleteUser } = require("../Controller/userController");
const { check } = require("express-validator");
const { validateFields } = require("../Middleware/validate-fields");
const { validateJWT } = require("../Middleware/validate-jwt");



const router = Router();


router.post('/change-password', [
    check('password', 'Password is required').not().isEmpty(),
    check('newPassword', 'New password is required').not().isEmpty(),
    validateJWT,
    validateFields
], changePassword);

router.delete('/delete-user', [
    validateJWT,
], deleteUser);


module.exports = router;