/*
 * This file is part of the conga-view module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

 /**
  * The ViewListener sets up the configured view engine, attaches helpers,
  * and handles template responses
  *
  * @author Marc Roulias <marc@lampjunkie.com>
  */
module.exports = class ViewListener {

    /**
     * Find all of the tagged view engines and register them
     *
     * @param {Container}   container
     * @param {Application} app
     * @param {Function}    cb
     * @return {void}
     */
    onRegisterMiddleware(container, app, cb) {

        const tags = container.getTagsByName('app.view.configuration');

        if (!tags || tags.length === 0){
            cb();
            return;
        }

        // just using one registered tag for now
        // not sure if there would ever be a case for using more...
        const tag = tags[0];
        const service = container.get(tag.getServiceId());
        const method = tag.getParameter('method');

        service[method].call(service, container, app, cb);
    }

    /**
     * Find all the tagged template helpers and register them
     *
     * @param {Container}   container
     * @param {Application} app
     * @param {Function}    cb
     * @return {void}
     */
    onRegisterPreMiddleware(container, app, cb) {

        const helpers = {};
        const tags = container.getTagsByName('template.helper');

        for (let tag of tags) {
            const helper = container.get(tag.getServiceId());
            for (let method in helper.methods) {
                helpers[method] = helper[helper.methods[method]].bind(helper);
            }
        }

        app.use(function(req, res, next){
            res.locals = _.merge(res.locals, helpers);
            next();
        });
    }

    /**
     * Handle a template response
     *
     * @param  {Object} req
     * @param  {Object} res
     * @param  {Object} data
     * @return {void}
     */
    handleTemplateResponse(req, res, data, status) {

        this.container.get('logger').debug('[conga-framework] - handling template response');

        // make sure we have a status if one wasn't passed in
        if (typeof status === 'undefined') {
            status = 200;
        }

        let container = this.container;
        const route = req.conga.route;

        // Check to see if request scope was added
        if (typeof res.__controller__ !== 'undefined') {
            container = res.__controller__.container;
        }

        // make sure there are templates
        if (typeof container.getParameter('conga.templates') === 'undefined'
            || container.getParameter('conga.templates').length === 0
            || !container.getParameter('conga.templates')[route.controller]) {

            container.get('logger').error('template not found for: ' + route.controller + '::' + route.action);
            res.send(500, "Internal error");
            return;
        }

        // find the template
        const template = container.getParameter('conga.templates')[route.controller][route.action];

        this.findTemplatePath(container, template, (templatePath) => {

            // render the template with the registered view engine
            res.render(templatePath, data, (err, renderedBody) => {

                // set the final body on the response
                res.body = renderedBody;

                // kernel.response
                container.get('event.dispatcher').dispatch(
                    'kernel.response', {
                    request : req, response : res, body: data, container : container },
                    () => {

                        // Clean up scope request
                        if (typeof res.__controller__ !== 'undefined') {
                            delete res.__controller__.container;
                        }

                        if (err) return req.next(err);

                        // set headers
                        const contentType = res.getHeader('content-type');
                        if (!contentType || contentType.length === 0) {
                            res.setHeader('Content-Type', 'text/html');
                        }
                        res.setHeader('Content-Length', res.body.length);
                        res.setHeader('X-Powered-By', container.getParameter('response.x-powered-by'));

                        // send final request
                        res.status(status).send(res.body);

                        return;
                    }
                );
             });
        });
    }

    /**
     * Find the real template path for a given template object
     *
     * This method checks if there is a template override for a template
     * within app/resources/[bundle-name]/[template-path]
     * and uses it, otherwise it finds the template from the actual bundle
     *
     * @param  {Object}   container
     * @param  {Object}   template
     * @param  {Function} cb
     * @return {void}
     */
    findTemplatePath(container, template, cb) {

        // check if path is already cached
        if (typeof this.templatePathCache[template.namespace] === 'undefined'){

            // check if there is an override in the app/resources directory
            const appPath = path.join(
                container.getParameter('kernel.app_path'),
                'resources',
                container.get('namespace.resolver').injectSubpath(template.namespace, 'views').replace(':', '/')
                    + '.' + container.getParameter('app.view.engine')
            );

            fs.exists(appPath, (exists) => {

                if (exists) {
                    this.templatePathCache[template.namespace] = appPath;
                } else {
                    this.templatePathCache[template.namespace] =
                        container.get('namespace.resolver').resolveWithSubpath(
                        template.namespace + '.' + container.getParameter('app.view.engine'), 'lib/resources/views');
                }

                // use the cached path
                cb(this.templatePathCache[template.namespace]);
                return;
            });

        } else {

            // use the cached path
            cb(this.templatePathCache[template.namespace]);
        }
    }

}
