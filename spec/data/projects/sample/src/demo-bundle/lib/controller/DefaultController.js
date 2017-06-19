const Controller = require('conga-framework/lib/controller/Controller');
const ErrorResponse = require('conga-framework/lib/response/ErrorResponse');

/**
 * @Route("/")
 */
module.exports = class DefaultController extends Controller {

    /**
     * @Route("/", name="default.index", methods=["GET"])
     * @Template
     */
    index(req, res) {
        res.return({foo: 'bar'});
    }

    /**
     * @Route("/hello", name="default.hello", methods=["GET"])
     * @Template
     */
    hello(req, res) {
        res.return({hello: 'world'});
    }
}
