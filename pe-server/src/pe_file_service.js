const utils = require('./pe_utils');
const fs = require('fs');

const getHashAndBuffer = (filePath) => {
    const fileBuffer = fs.readFileSync(filePath);
    const fileHash = utils.getFileHash(fileBuffer);
    return { fileBuffer: fileBuffer, fileHash: fileHash };
};

const handleDuplicatePeFile = async (fileKey) => {
    const count = await fileRepo.updateDuplicateFileCount(fileKey);
    return { statusCode: 409, resp: { count: count } };
};

const savePeFileDetails = async (args) => {
    const { fileKey, newFileName, fileHash, originalFileName, fileBuffer, url } = args;
    const saved = await fileRepo.savePeFileDetails(fileKey, {
        fileName: newFileName,
        hash: fileHash,
        originalFileName: originalFileName,
        fileSizeInBytes: fileBuffer.byteLength,
        url: url,
    });
    return { statusCode: 200, resp: { success: saved } };
}

const processPeFile = async (filePath, originalFileName, fileRepo, uploader) => {
    const { fileBuffer, fileHash } = getHashAndBuffer(filePath);
    const fileKey = `pefile:${fileHash}`;
    try {
        const exists = await fileRepo.peFileExists(fileKey);
        if (exists) {
            return await handleDuplicatePeFile(fileKey);
        } else {
            const { url, newFileName, error } = await uploader.uploadFileToS3(filePath, fileBuffer);
            if (error) throw error;

            return await savePeFileDetails({ fileKey, newFileName, fileHash, originalFileName, fileBuffer, url });
        }
    } catch (e) {
        console.log(e);
        return { statusCode: 500, resp: { error: e } };
    }
};
exports.processPeFile = processPeFile;