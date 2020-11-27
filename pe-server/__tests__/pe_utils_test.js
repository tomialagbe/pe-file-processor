const { peFileFilter } = require('../src/pe_utils');

describe('file repo test', () => {
    it('peFileFilter allows only PE files', () => {
        let file = {
            originalname: 'original_name.txt',
        }
        let req = {};
        let callback = jest.fn();
        peFileFilter(req, file, callback);
        expect(req).toHaveProperty('fileValidationError', 'Only Portable executable (PE) files are allowed!');
        expect(callback).toHaveBeenCalledWith(new Error('Only Portable executable (PE) files are allowed!'), false);        

        file = {
            originalname: 'original_name.exe',
        }
        req = {};
        callback = jest.fn();
        peFileFilter(req, file, callback);        
        expect(callback).toHaveBeenCalledWith(null, true);        
    });
});