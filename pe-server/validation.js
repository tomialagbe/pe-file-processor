let utils = require('./pe_utils');
const multer = require('multer');

const validateFormRequest = async (req, res, err) => {

    if (req.fileValidationError) {
        return { valid: false, statusCode: 400, error: req.fileValidationError };
    } else if (!req.file) {
        return { valid: false, statusCode: 400, error: 'File required' };
    } else if (err instanceof multer.MulterError) {
        return { valid: false, statusCode: 400, error: err.message };
    } else if (err) {
        return { valid: false, statusCode: 500, error: err };
    } else {
        const isPEFile = await utils.isPEFile(req.file.path);
        if (!isPEFile) {
            return { valid: false, statusCode: 400, error: 'Only Portable executable (PE) files are allowed!' };
        }
    }
    return { valid: true };
};

exports.validateFormRequest = validateFormRequest;