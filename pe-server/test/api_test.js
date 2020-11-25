const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const server = require('../index');
const fs = require('fs');

chai.should();
chai.use(chaiHttp);

describe('API', () => {

    describe('POST /pe-file', () => {
        // it('should handle PE file', (done) => {
        //     chai.request(server)            
        //     .post('/pe-file')
        //     .attach('peFile', fs.readFileSync('./sample-file.dll'))
        // });
    });
});