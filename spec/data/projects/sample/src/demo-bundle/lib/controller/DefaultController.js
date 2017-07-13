const Controller = require('@conga/framework/lib/controller/Controller');
const ErrorResponse = require('@conga/framework/lib/response/ErrorResponse');

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
     * @Route("/test-layout", name="default.test.layout", methods=["GET"])
     * @Template
     */
    testLayout(req, res) {
        res.return();
    }

    /**
     * @Route("/test-include", name="default.test.include", methods=["GET"])
     * @Template
     */
    testInclude(req, res) {
        res.return();
    }

    /**
     * @Route("/test-data", name="default.test.data", methods=["GET"])
     * @Template
     */
    testData(req, res) {
        res.return({
            hello: 'world'
        });
    }

    /**
     * @Route("/test-helpers", name="default.test.helpers", methods=["GET"])
     * @Template
     */
    testHelpers(req, res) {
        res.return();
    }

    /**
     * @Route("/test-access-denied", name="default.test.access_denied", methods=["GET"])
     * @Template
     */
    testAccessDenied(req, res) {
        res.return();
    }

    /**
    * @Route("/route-with-params/:one/:two", name="default.route.with.params", methods=["GET"])
    * @Template
     */
    routeWithParams(req, res) {
        res.return();
    }
}
