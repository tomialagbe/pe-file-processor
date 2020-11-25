class FileRepo {
    constructor(redisClient) {
        this.redisClient = redisClient;
        this.redisClient.on('error', (err) => {
            console.error(`REDIS CLIENT ERROR: ${err}`);
        });
    }

    peFileExists(key) {
        return new Promise((resolve, reject) => {
            this.redisClient.EXISTS(key, (err, resp) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(resp);
                }
            });
        });
    }

    updateDuplicateFileCount(fileKey) {
        return new Promise((resolve, reject) => {
            const transaction = this.redisClient.MULTI();
            transaction.HINCRBY(fileKey, 'count', 1);
            transaction.EXEC((err, replies) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(replies[0]);
                }
            });
        });
    }

    savePeFileDetails(fileKey, fileDetails) {
        let { fileName, hash, originalFileName, fileSizeInBytes, url } = fileDetails;
        return new Promise((resolve, reject) => {
            const transaction = this.redisClient.MULTI();
            transaction.HMSET(
                fileKey,
                'fileName', fileName,
                'hash', hash,
                'originalFileName', originalFileName,
                'fileSize', fileSizeInBytes,
                'count', 1,
                'url', url);
            transaction.EXEC((err, replies) => {
                if (err) {
                    reject(err);
                } else {
                    const success = replies[0] == 'OK'
                    resolve(success);
                }
            });
        });
    }
}

exports.FileRepo = FileRepo;