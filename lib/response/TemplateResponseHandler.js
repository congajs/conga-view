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
                    this.container.get('logger').error(err.stack || err);
                }
                cb(err, html);
            });
        });
    }

    /**
     * Render an error response
     *
     * @param  {Request}       req
     * @param  {Response}      res
     * @param  {ErrorResponse} error
     * @return {Void}
     */
    onErrorResponse(req, res, error) {

        res.header(error.headers);
        this.onSendResponse(req, res, error.data, null, error.status);
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
            parameters: this.container.getParameters()
        };

        const tags = this.container.getTagsByName('template.helper');

        for (let tag of tags) {
            const helper = this.container.get(tag.getServiceId());
            for (let method in helper.methods) {
                data[method] = function(name) {
                    const args = Array.prototype.slice.call(arguments);
                    args.unshift(req);
                    return helper[helper.methods[method]].apply(helper, args);
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
    onSendResponse(req, res, data, body, status) {
        res.header('Content-Type', 'text/html');
        res.status(status).send(body);
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

            cb(new Error('template not found for: ' + route.controller + '::' + route.action));
            return;
        }

        cb(null, templates[route.controller][route.action]);

    }

    /**
     * Find the template for an error response
     *
     * @param  {Object}         req
     * @param  {ErrorResponse}  error
     * @param  {Function}       cb
     * @return {void}
     */
    findTemplateForError(req, error, cb) {

        // TODO : finish me ?

        const resolver = this.container.get('namespace.resolver');

        // figure out which bundle the current route is in
        this.findTemplateForRoute(req.conga.route, (err, template) => {

            if (err) {
                cb(null);
                return;
            }

            const engine = this.getEngineForTemplate(template);

            const namespace = resolver.parseNamespace(template.namespace);

            // figure out if template exists
            const templatePath = namespace + ':' + 'exception/error.html';

        });


        // look in template engine

    }

    /**
     * Get the engine for the template info
     *
     * @param  {Object}   template template info, i.e. { namespace: 'namespace:for/template', engine: 'twig' }
     * @return {TemplateEngine}
     */
    getEngineForTemplate(template) {

        return this.container.get('conga.view.engine.' + template.engine);
    }
};
