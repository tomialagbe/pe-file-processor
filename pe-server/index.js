const express = require('express');
const multer = require('multer');
const utils = require('./pe_utils');
const { validateFormRequest } = require('./validation');
const fs = require('fs');
const path = require('path');
const redis = require('redis');
const { v4: uuidv4 } = require('uuid');
const { FileRepo } = require('./file_repo');
const AWS = require('aws-sdk');

const app = express();
const port = process.env.PORT || 3000;

const multerStorage = multer.diskStorage({
    destination: 'uploads/',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

let redisClient = redis.createClient({host: 'redis'});
let fileRepo = new FileRepo(redisClient);

app.post('/pe-file', (req, res) => {
    let upload = multer({ storage: multerStorage, fileFilter: utils.peFileFilter }).single('peFile');

    upload(req, res, async (err) => {
        const { valid, statusCode, error } = await validateFormRequest(req, res, err);
        if (!valid) {
            res.status(statusCode).json({ error: error });
            return;
        }

        const fileBuffer = fs.readFileSync(req.file.path);
        const fileSizeBytes = fileBuffer.length;
        const fileHash = utils.getFileHash(fileBuffer);
        console.log(`CHECKSUM: ${fileHash}`);

        // check if the file has already been received (checksum match)
        const fileKey = `pefile:${fileHash}`;

        try {
            if (await fileRepo.peFileExists(fileKey)) {
                const count = await fileRepo.updateDuplicateFileCount(fileKey)
                res.status(409).json({ count: count });
            } else {
                const { url, newFileName, error } = await uploadFileToS3(req.file.path, fileBuffer);
                if (error) {
                    res.status(500).json({ error: error });
                    return;
                }

                const saved = await fileRepo.savePeFileDetails(fileKey, {
                    fileName: newFileName,
                    hash: fileHash,
                    originalFileName: req.file.originalname,
                    fileSizeInBytes: fileSizeBytes,
                    url: url,
                });
                res.status(200).json({ success: saved });
            }
        } catch (err) {
            res.status(500).send({ error: err });
        }
    });
});

const BUCKET_NAME = 'pefile-bucket';
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,// || 'AKIAIOQQ4BWJIR7XLJMQ',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY// || '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'
});

const uploadFileToS3 = async (filePath, fileContents) => {
    return new Promise((resolve, reject) => {
        const newFileName = `pefile-${uuidv4()}${path.extname(filePath)}`;
        const params = {
            Bucket: BUCKET_NAME,
            Key: newFileName,
            Body: fileContents
        };
        s3.upload(params, (err, data) => {
            if (err) {
                reject({ url: null, newFileName: null, error: err });
            } else {
                resolve({ url: data.Location, newFileName: newFileName, error: null });
            }
        });
    });
};

module.exports = app.listen(port, () => console.log(`PE file processor running on port ${port}`));