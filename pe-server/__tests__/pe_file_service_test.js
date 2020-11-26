// const chai = require('chai');
// const chaiHttp = require('chai-http');
// const sinon = require('sinon');
// const server = require('../src/index');
// const fs = require('fs');
// const assert = require('assert');
const { FileRepo } = require('../src/file_repo');
const { Uploader } = require('../src/uploader');
const { processPeFile } = require('../src/pe_file_service');
const fs = require('fs');
const { resolve } = require('path');
// const { expect } = require('chai');
// let redis = require('mock-redis-client').createMockRedis();

// chai.should();
// chai.use(chaiHttp);

describe('PE file service', () => {
    let fileRepo;
    let uploader;
    beforeEach(() => {
        fileRepo = {
            peFileExists: jest.fn(),
            updateDuplicateFileCount: jest.fn(),
            savePeFileDetails: jest.fn()
        };

        uploader = {
            uploadFileToS3: jest.fn(),
        };
    });

    it('processes new PE file', async () => {
        const sampleBuffer = Buffer.from('sample buffer');
        jest.spyOn(fs, 'readFileSync').mockImplementation((path) => {
            return sampleBuffer;
        });

        uploader.uploadFileToS3 = jest.fn((path, buffer) => {
            return { url: 'http://mock.com', newFileName: 'newFileName.exe', error: null };
        });
        fileRepo.peFileExists = jest.fn(key => false);
        fileRepo.savePeFileDetails = jest.fn((key, details) => {
            return new Promise((res, rej) => {
                res(true);
            });
        });

        const result = await processPeFile('/test_path', 'file_name.exe', fileRepo, uploader);
        expect(fileRepo.peFileExists).toHaveBeenCalled();
        expect(uploader.uploadFileToS3).toHaveBeenCalledWith('/test_path', sampleBuffer);
        expect(fileRepo.savePeFileDetails).toHaveBeenCalled();
        expect(result).toHaveProperty('statusCode', 200);
        expect(result).toHaveProperty('resp', { success: true });
    });

    it('processes duplicate PE file', async () => {
        fileRepo.peFileExists = jest.fn().mockReturnValue(true);
        fileRepo.updateDuplicateFileCount = jest.fn().mockReturnValue(2);

        const result = await processPeFile('/test_path', 'file_name.exe', fileRepo, uploader);
        expect(fileRepo.peFileExists).toHaveBeenCalled();
        expect(fileRepo.peFileExists).toHaveReturnedWith(true);
        expect(fileRepo.updateDuplicateFileCount).toHaveBeenCalled();
        expect(fileRepo.savePeFileDetails).toBeCalledTimes(0);
        expect(result).toHaveProperty('statusCode', 409);
        expect(result).toHaveProperty('resp', { count: 2 });
    });

    it('handles unexpected errors', async () => {
        const err = new Error('Upload error occurred');
        fileRepo.peFileExists = jest.fn().mockReturnValue(false);
        uploader.uploadFileToS3 = jest.fn((path, buffer) => {
            throw err;
        });
        const result = await processPeFile('/test_path', 'file_name.exe', fileRepo, uploader);
        expect(result).toHaveProperty('statusCode', 500);
        expect(result).toHaveProperty('resp', { error: err });
    });

});