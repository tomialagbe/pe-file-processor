const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const server = require('../src/index');
const fs = require('fs');
const assert = require('assert');
const { FileRepo } = require('../src/file_repo');
var redis = require('mock-redis-client').createMockRedis();

chai.should();
chai.use(chaiHttp);

describe('PE file service', () => {
    let client = redis.createClient();
    const fileRepo = FileRepo(client);
});