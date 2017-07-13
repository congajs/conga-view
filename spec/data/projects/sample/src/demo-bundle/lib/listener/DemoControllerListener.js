class DemoControllerListener {

    onPreController(event, next) {

        const { request, response } = event;

        if (request.originalUrl === '/test-access-denied') {
            response.error(new Error({message: 'Access Denied'}), 401);
            return;
        }

        next();

    }

}

module.exports = DemoControllerListener;