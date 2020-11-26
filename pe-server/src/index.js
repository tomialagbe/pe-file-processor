require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const redis = require('redis');
const AWS = require('aws-sdk');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);

const utils = require('./pe_utils');
const { validateFormRequest } = require('./validation');
const { Uploader } = require('./uploader');
const { FileRepo } = require('./file_repo');
const { processPeFile } = require('./pe_file_service');

const app = express();
const port = process.env.PORT || 3000;

const multerStorage = multer.diskStorage({
    destination: 'uploads/',
    filename: function (req, file, filenameHandler) {
        filenameHandler(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const redisClient = redis.createClient({ host: process.env.REDIS_HOST || 'localhost' });
process.on('SIGINT', function() {
    redisClient.quit();
    console.log('redis client quit');
});

const fileRepo = new FileRepo(redisClient);
const uploader = new Uploader(new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
}));

app.post('/pe-file', (req, res) => {
    let upload = multer({ storage: multerStorage, fileFilter: utils.peFileFilter }).single('peFile');

    upload(req, res, async (err) => {
        try {
            let { valid, statusCode, error } = await validateFormRequest(req, res, err);
            if (!valid) {
                res.status(statusCode).json({ error: error });
                return;
            }

            let processResult = await processPeFile(req.file.path, req.file.originalname, fileRepo, uploader);
            await unlinkAsync(req.file.path);
            res.status(processResult.statusCode).json(processResult.resp);
        } catch (err) {
            res.status(500).send({ error: err });
        }
    });
});

module.exports = app.listen(port, () => console.log(`PE file processor running on port ${port}`));