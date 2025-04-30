const { Router } = require("express");
const { login, register, resetPasswordDev, logout } = require("../Controller/authController");
const { check } = require("express-validator");
const { verifyEmail, verifyEmailLogin } = require("../Helpers/verify-email");
const { validateFields } = require("../Middleware/validate-fields");
const { validateJWT } = require("../Middleware/validate-jwt");


const router = Router();


router.post('/login',[
    check('email', 'Email is required').isEmail(),
    check('password', 'Password is required').not().isEmpty(),
    check('email').custom(verifyEmailLogin),
    validateFields
    ], 
    login 
);

router.post('/logout', validateJWT, logout);

router.post('/register',[
    check('email').custom(verifyEmail),
    check('name', 'Name is required').not().isEmpty(),
    check('lastname', 'Last name is required').not().isEmpty(),
    check('email', 'Email is required').isEmail(),
    check('phone', 'Phone is required').not().isEmpty(),   
    check('password', 'Password is required').not().isEmpty(),
    validateFields
], register );

router.post('/reset-password-dev', resetPasswordDev);


module.exports = router;