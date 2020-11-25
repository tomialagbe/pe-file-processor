const { v4: uuidv4 } = require('uuid');
const path = require('path');

const BUCKET_NAME = 'pefile-bucket';

class Uploader {
    constructor(s3) {
        this.s3 = s3;
    }

    uploadFileToS3 = (filePath, fileContents) => {
        return new Promise((resolve, reject) => {
            const newFileName = `pefile-${uuidv4()}${path.extname(filePath)}`;
            const params = {
                Bucket: BUCKET_NAME,
                Key: newFileName,
                Body: fileContents
            };
            this.s3.upload(params, (err, data) => {
                if (err) {
                    reject({ url: null, newFileName: null, error: err });
                } else {
                    resolve({ url: data.Location, newFileName: newFileName, error: null });
                }
            });
        });
    }
}

exports.Uploader = Uploader;

// const uploadFileToS3 = async (filePath, fileContents) => {
//     return new Promise((resolve, reject) => {
//         const newFileName = `pefile-${uuidv4()}${path.extname(filePath)}`;
//         const params = {
//             Bucket: BUCKET_NAME,
//             Key: newFileName,
//             Body: fileContents
//         };
//         s3.upload(params, (err, data) => {
//             if (err) {
//                 reject({ url: null, newFileName: null, error: err });
//             } else {
//                 resolve({ url: data.Location, newFileName: newFileName, error: null });
//             }
//         });
//     });
// };
// exports.uploadFileToS3 = uploadFileToS3;