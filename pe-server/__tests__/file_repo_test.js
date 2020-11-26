const { FileRepo } = require('../src/file_repo');
describe('file repo test', () => {
    let fileRepo;
    let redisClient;
    let mockTxn;
    beforeEach(() => {
        mockTxn = {
            HMSET: jest.fn(),
            EXEC: jest.fn(),
            HINCRBY: jest.fn(),
        };
        redisClient = {
            on: jest.fn(),
            EXISTS: jest.fn(),
            MULTI: jest.fn(() => mockTxn),
        };
        fileRepo = new FileRepo(redisClient);
    });

    it('peFileExists returns truthy value if PE file exists', async () => {
        redisClient.EXISTS = jest.fn().mockImplementation((key, callback) => {
            callback(null, 1)
        });
        const exists = await fileRepo.peFileExists('pe:randomKey');
        expect(redisClient.EXISTS).toHaveBeenCalledWith('pe:randomKey', expect.anything());
        expect(exists).toBeTruthy();
    });

    it('peFileExists returns falsy value if PE file does not exist', async () => {
        redisClient.EXISTS = jest.fn().mockImplementation((key, callback) => {
            callback(null, 0)
        });
        const exists = await fileRepo.peFileExists('pe:randomKey');
        expect(redisClient.EXISTS).toHaveBeenCalledWith('pe:randomKey', expect.anything());
        expect(exists).toBeFalsy();
    });

    it('updateDuplicateFileCount updates and returns duplicate file count', async () => {
        mockTxn.EXEC = jest.fn().mockImplementation((callback) => {
            callback(null, [2]);
        });
        const count = await fileRepo.updateDuplicateFileCount('pe:randomKey');
        expect(redisClient.MULTI).toHaveBeenCalled();
        expect(redisClient.MULTI).toHaveReturnedWith(mockTxn);
        expect(mockTxn.HINCRBY).toHaveBeenCalledWith('pe:randomKey', 'count', 1);
        expect(mockTxn.EXEC).toHaveBeenCalled();
        expect(count).toBe(2);
    });

    it('savePeFileDetails with OK response', async () => {
        const details = {
            fileName: 'test_filename.exe',
            hash: 'randomhash',
            originalFileName: 'original_filename.exe',
            fileSizeInBytes: 100,
            url: 'http://test.url'
        };        
        mockTxn.EXEC = jest.fn().mockImplementation((callback) => {
            callback(null, ['OK']);
        });

        const success = await fileRepo.savePeFileDetails('pe:randomKey', details);
        expect(redisClient.MULTI).toHaveBeenCalled();
        expect(redisClient.MULTI).toHaveReturnedWith(mockTxn);
        expect(mockTxn.HMSET).toHaveBeenCalledWith('pe:randomKey',
            'fileName', details.fileName,
            'hash', details.hash,
            'originalFileName', details.originalFileName,
            'fileSize', details.fileSizeInBytes,
            'count', 1,
            'url', details.url);            
        expect(mockTxn.EXEC).toHaveBeenCalled();
        expect(success).toBe(true);
    });

    it('savePeFileDetails with error response', async () => {
        const details = {
            fileName: 'test_filename.exe',
            hash: 'randomhash',
            originalFileName: 'original_filename.exe',
            fileSizeInBytes: 100,
            url: 'http://test.url'
        };        
        mockTxn.EXEC = jest.fn().mockImplementation((callback) => {
            callback(null, ['ERR']);
        });

        const success = await fileRepo.savePeFileDetails('pe:randomKey', details);        
        expect(success).toBe(false);
    });
});