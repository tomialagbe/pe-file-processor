const utils = require('./pe_utils');
const fs = require('fs');

const processPeFile = async (req, fileRepo, uploader) => {
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileSizeBytes = fileBuffer.byteLength;
    const fileHash = utils.getFileHash(fileBuffer);
    console.log(`CHECKSUM: ${fileHash}`);

    // check if the file has already been received (checksum match)
    const fileKey = `pefile:${fileHash}`;
    try {
        const exists = await fileRepo.peFileExists(fileKey);
        if (exists) {
            const count = await fileRepo.updateDuplicateFileCount(fileKey);
            return { statusCode: 409, resp: { count: count } };
        } else {
            const { url, newFileName, error } = await uploader.uploadFileToS3(req.file.path, fileBuffer);
            if (error) {
                return { statusCode: 500, resp: { error: error } };
            }

            const saved = await fileRepo.savePeFileDetails(fileKey, {
                fileName: newFileName,
                hash: fileHash,
                originalFileName: req.file.originalname,
                fileSizeInBytes: fileSizeBytes,
                url: url,
            });
            return { statusCode: 200, resp: { success: saved } };
        }
    } catch (e) {
        console.log(e);
        return { statusCode: 500, resp: { error: e } };
    }

};
exports.processPeFile = processPeFile;