var crypto = require('crypto');
const psig = require('pe-signature');
const getOffset = require('pe-signature-offset');
const fs = require('fs');
const open = require('fs-maybe-open');
const len = psig.length;

const peFileFilter = function (req, file, cb) {
    if (!file.originalname.match(/\.(acm|ax|cpl|dll|drv|efi|exe|mui|ocx|scr|sys|tsp)$/)) {
        req.fileValidationError = 'Only Portable executable (PE) files are allowed!';
        return cb(new Error('Only Portable executable (PE) files are allowed!'), false);
    }
    cb(null, true);
};

const getFileHash = function (fileBuffer) {
    var md5sum = crypto.createHash('md5');
    md5sum.update(fileBuffer);
    let digest = md5sum.digest('hex');
    return digest;
};

function checkForPeSignature(fdOrFile, done) {
    open(fdOrFile, 'r', function (err, fd, close) {
        if (err) return done(err)

        getOffset(fd, function (err, offset) {
            if (err) return close(done, err)

            fs.read(fd, Buffer(len), 0, len, offset, function (err, bytesRead, buf) {
                if (err) return close(done, err)

                close(done, null, psig.is(buf))
            })
        })
    })
}

const isPEFile = (filePath) => {
    const fd = fs.openSync(filePath, 'r');
    return new Promise((resolve, reject) => {
        checkForPeSignature(fd, (err, isPEFile) => {
            if (err) {
                reject(err);
            } else {
                resolve(isPEFile);
            }
        });
    });
}

module.exports = {
    peFileFilter: peFileFilter,
    getFileHash: getFileHash,
    isPEFile: isPEFile,
};