const { Uploader } = require('../src/uploader');

describe('file repo test', () => {
    let uploader;
    let s3;

    beforeEach(() => {
        s3 = {
            upload: jest.fn()
        };
        uploader = new Uploader(s3);
    });

    it('should call s3 to upload file', async () => {
        const mockFileContents = Buffer.from('sample buffer');
        s3.upload = jest.fn((params, callback) => {
            callback(null, { Location: 'test/location/in/s3' });
        });

        const result = await uploader.uploadFileToS3('test/file/path.exe', mockFileContents);
        expect(s3.upload).toHaveBeenCalled();
        expect(result).toHaveProperty('url', 'test/location/in/s3');
        expect(result).toHaveProperty('newFileName', expect.any(String));
        expect(result).toHaveProperty('error', null);
    });

    it('should handle upload errors', async () => {
        const mockFileContents = Buffer.from('sample buffer');
        s3.upload = jest.fn((params, callback) => {
            callback('Failed to upload file to S3 bucket', null);
        });

        const action = async () => {
            await uploader.uploadFileToS3('test/file/path.exe', mockFileContents);
        }
        expect(action()).rejects.toThrow({ url: null, newFileName: null, error: 'Failed to upload file to S3 bucket' });
        expect(s3.upload).toHaveBeenCalled();
    });
});