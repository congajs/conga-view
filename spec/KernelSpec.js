const fs = require('fs');
const path = require('path');
const request = require('request');
const Kernel = require('conga-framework/lib/kernel/TestKernel');

describe("Kernel", () => {

    let kernel;

    beforeAll((done) => {

        const p = path.join(__dirname, '..', 'spec', 'data', 'projects', 'sample', 'var', 'data', 'nedb', 'articles.db');

        kernel = new Kernel(
            path.join(__dirname, '..', 'spec', 'data', 'projects', 'sample'),
            'app',
            'test',
            {}
        );

        kernel.addBundlePaths({
            'demo-bundle': path.join(__dirname, '..', 'spec', 'data', 'projects', 'sample', 'src', 'demo-bundle'),
            'conga-view': path.join(__dirname, '..')
        });

        kernel.boot(() => {
            done();
        });
    });

    it("should render return a valid response with a rendered template", (done) => {

        request({
            uri: 'http://localhost:5555/',
            method: 'GET'

        }, (error, response, body) => {
            expect(response.statusCode).toEqual(200);
            expect(response.headers['content-type']).toEqual('text/html; charset=utf-8');
            expect(body).toEqual("<h1>Hello bar</h1>\n");
            done();
        });


    });


});
