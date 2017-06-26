/*
 * This file is part of the conga-view module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
const fs = require('fs');
const path = require('path');

/**
 * The TemplateResponseHandler handles taking data and rendering a configured template
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class TemplateResponseHandler {

    /**
     * Construct the TemplateResponseHandler
     *
     * @param  {Container} container
     */
    constructor(container) {

        /**
         * The service container
         *
         * @type {Container}
         */
        this.container = container;

        /**
         * The conga-view config object
         *
         * @type {Object}
         */
        this.config = null;

        /**
         * Cache hash of namespaced template to it's actual file path
         *
         * @type {Object}
         */
        this.templatePathCache = {};
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
    onRenderResponse(req, res, data = {}, status, cb) {

        if (this.config === null) {
            this.config = this.container.get('config').get('view');
        }

        this.enhanceData(req, data);

        this.findTemplatePath(req.conga.route, (err, template) => {

            this.container.get('conga.view.renderer')(template, data, (err, html) => {

                if (err) {
                    console.log(err);
                }

                cb(null, html);

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
            parameters: this.container.getParameters()
        };

        const tags = this.container.getTagsByName('template.helper');
        const helpers = {};

        for (let i in tags) {

            const helper = this.container.get(tags[i].getServiceId());

            for (let method in helper.methods) {

                data[method] = function(name) {
                    const args = Array.prototype.slice.call(arguments);
                    args.unshift(req);
                    return helper[helper.methods[method]].apply(helper, args);
                }
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
        res.setHeader('Content-Type', 'text/html');
        res.status(status).send(body);
    }

    /**
     * Find the real template path for a given template object
     *
     * This method checks if there is a template override for a template
     * within app/resources/[bundle-name]/[template-path]
     * and uses it, otherwise it finds the template from the actual bundle
     *
     * @param  {Object}   route
     * @param  {Function} cb
     * @return {void}
     */
    findTemplatePath(route, cb) {

        // make sure there are templates
        if (typeof this.container.getParameter('conga.templates') === 'undefined'
            || this.container.getParameter('conga.templates').length === 0
            || !this.container.getParameter('conga.templates')[route.controller]) {

            this.container.get('logger').error('template not found for: ' + route.controller + '::' + route.action);
            //res.send(500, "Internal error");
            cb('template not found for: ' + route.controller + '::' + route.action);
            return;
        }

        // find the template
        const template = this.container.getParameter('conga.templates')[route.controller][route.action];

        return cb(null, template.namespace);

        // check if path is already cached
        if (typeof this.templatePathCache[template.namespace] === 'undefined'){

            // check if there is an override in the app/resources directory
            const appPath = path.join(
                this.container.getParameter('kernel.app_path'),
                'resources',
                this.container.get('namespace.resolver').injectSubpath(template.namespace, 'views').replace(':', '/')
                    + '.' + this.config.extension
            );

            fs.exists(appPath, (exists) => {

                if (exists) {
                    this.templatePathCache[template.namespace] = appPath;
                } else {
                    this.templatePathCache[template.namespace] =
                        this.container.get('namespace.resolver').resolveWithSubpath(
                        template.namespace + '.' + this.config.extension, 'lib/resources/views');
                }

                // use the cached path
                cb(null, this.templatePathCache[template.namespace]);
                return;
            });

        } else {

            // use the cached path
            cb(null, this.templatePathCache[template.namespace]);
        }
    }

}
