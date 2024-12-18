const { Router } = require("express");
const { validateFields } = require("../Middleware/validate-fields");
const { validateArchiveUpload } = require("../Middleware/validate-archive");
const { uploadImageCloudinary } = require("../Controller/uploadController");
const { validateJWT } = require("../Middleware/validate-jwt");




const router = Router();


// actualiza la imagen.
router.put('/:collection/:id',[
    validateArchiveUpload,
    validateFields,
    validateJWT
], uploadImageCloudinary);



module.exports = router;