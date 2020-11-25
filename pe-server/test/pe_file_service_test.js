const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const server = require('../src/index');
const fs = require('fs');
const assert = require('assert');

chai.should();
chai.use(chaiHttp);

describe("just a silly test", function () {
    it("checks a sum", function () {
        assert.equal(2 + 1, 4);
    });
});

describe('uploading to s3', () => {
    
    it('uploads to s3', () => { });
});