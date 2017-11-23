/*
 * This file is part of the conga-view module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The TemplateResponseHandler handles taking data and rendering a configured template
 */
module.exports = class TemplateResponseHandler {
    /**
     * Construct the TemplateResponseHandler
     *
     * @param  {Container} container The service container
     */
    constructor(container) {

        /**
         * The service container
         * @type {Container}
         */
        this.container = container;

        /**
         * Cache hash of namespaced template to it's actual file path
         * @type {Object}
         */
        this.templatePathCache = {};
    }

    /**
     * The conga-view config object
     * @type {Object}
     */
    get config() {
        if (!this.__config) {
            this.__config = this.container.get('config').get('view');
        }
        return this.__config;
    }

    /**
     * Render the final response
     *
     * @param  {Request}   req
     * @param  {Response}  res
     * @param  {Object}    data
     * @param  {Number}    status
     * @param  {Function}  cb
     * @return {void}
     */
    onRenderResponse(req, res, data, status, cb) {
        if (!data) {
            data = {};
        }

        this.enhanceData(req, data);

        this.findTemplateForRoute(req.conga.route, (err, template) => {
            if (err) {
                cb(err, null);
                return;
            }
            this.getEngineForTemplate(template).render(template.namespace, data, (err, html) => {
                if (err) {
                    cb(err, null);
                }
                cb(err, html);
            });
        });
    }

    /**
     * Respond to a redirect
     *
     * @param  {Request}   req
     * @param  {Response}  res
     * @param  {String}    location the new location to redirect to
     * @param  {Number}    status the status to send
     * @param  {Function}  cb
     * @return {void}
     */
    onRedirectResponse(req, res, location, status, cb) {
        cb(null);
    }

    /**
     * Render an error response
     *
     * @param  {Request}       req
     * @param  {Response}      res
     * @param  {ErrorResponse} error
     * @param  {Function}      cb
     * @return {void}
     */
    onErrorResponse(req, res, error, cb) {

        if (error.hasHeaders()) {
            res.header(error.getHeaders());
        }

        if (error.hasHeader('location')) {
            const status = error.status || 302;
            if (status >= 300 && status <= 308) {
                res.sendStatus(status);
                cb(null, null);
                return;
            }
        }

        const data = { error: error.data };
        this.enhanceData(req, data);

        this.findTemplateForError(req, error, (err, template) => {
            if (err) {
                cb(err, null);
                return;
            }
            this.getEngineForTemplate(template).render(template.namespace, data, (err, html) => {
                cb(err, html);
            });
        });
    }

    /**
     * Build the final data hash to pass to renderer
     *
     * This adds the request, container parameters, etc.
     *
     * @param  {Request} req  the request object
     * @param  {Object}  data the data from the controller
     * @return {void}
     */
    enhanceData(req, data) {

        data.conga = {
            request: req,
            security: req.conga && req.conga.security,
            parameters: this.container.getParameters()
        };

        const tags = this.container.getTagsByName('template.helper');

        for (const tag of tags) {
            const helper = this.container.get(tag.getServiceId());
            for (const method in helper.methods) {
                data[method] = function(name) {
                    const args = Array.prototype.slice.call(arguments);
                    return helper[helper.methods[method]].call(helper, req, ...args);
                };
            }
        }
    }

    /**
     * Send the final response
     *
     * @param  {Response}  res
     * @param  {Object}    data
     * @param  {String}    body
     * @param  {Number}    status
     * @param  {Function}  cb
     * @return {void}
     */
    onSendResponse(req, res, data, body, status, cb) {
        if (res.headersSent) {
            cb(null);
            return;
        }
        res.header('Content-Type', 'text/html');
        res.status(status).send(body);
        cb(null);
    }

    /**
     * Send the final redirect
     *
     * @param  {Request}   req
     * @param  {Response}  res
     * @param  {String}    location the new location to redirect to
     * @param  {Number}    status the status to send
     * @param  {Function}  cb
     */
    onSendRedirect(req, res, location, status, cb) {
        if (res.headersSent) {
            cb(null);
            return;
        }
        res.redirect(status, location);
        cb(null);
    }

    /**
     * Find the template info for a given route object
     *
     * This method checks if there is a template override for a template
     * within app/resources/[bundle-name]/[template-path]
     * and uses it, otherwise it finds the template from the actual bundle
     *
     * @param  {Object}   route
     * @param  {Function} cb
     * @return {void}
     */
    findTemplateForRoute(route, cb) {

        // make sure there are templates
        const templates = this.container.getParameter('conga.templates');
        if (!(templates instanceof Object) ||
            !(route.controller in templates) ||
            !(route.action in templates[route.controller])
        ) {
            this.container.get('logger').error(
                'template not found for: ' + route.controller + '::' + route.action);

            cb(new Error('Template not found for: ' + route.controller + '::' + route.action));
            return;
        }

        cb(null, templates[route.controller][route.action]);
    }

    /**
     * Find the template for an error response
     *
     * @param  {Request}        req
     * @param  {ErrorResponse}  error
     * @param  {Function}       cb
     * @return {void}
     */
    findTemplateForError(req, error, cb) {

        const container = this.container;

        // figure out which bundle the current route is in
        this.findTemplateForRoute(req.conga.route, (err, template) => {

            if (err) {
                cb(err, null);
                return;
            }

            const engine = this.getEngineForTemplate(template);

            const status = error && error.status || 500;
            const templates = container.hasParameter('conga.templates') &&
                container.getParameter('conga.templates');

            if (templates && templates.exception && templates.exception['error' + status]) {
                cb(null, templates.exception['error' + status]);
                return;
            }

            engine.findTemplateForError(req, error, cb);
        });
    }

    /**
     * Get the engine for the template info
     *
     * @param  {Object}   template template info, i.e. { namespace: 'namespace:for/template', engine: 'twig' }
     * @return {TemplateEngine}
     */
    getEngineForTemplate(template) {

        let sid = 'conga.view.engine.' + template.engine;

        if (!this.container.has(sid)) {
            sid = 'conga.view.engine._error';
        }

        return this.container.get(sid);
    }
};
