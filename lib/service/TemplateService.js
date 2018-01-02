/*
 * This file is part of the conga-view module.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class TemplateService {
    /**
     *
     * @param {Container} container The service container
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

        /**
         * Mapping of templates by namespace (rather than controller route)
         * @type {Object}
         */
        this.templateNamespaces = {};
    }

    /**
     * Get the registered conga template objects
     * @returns {Object}
     */
    getTemplates() {
        if (!this.container.hasParameter('conga.templates')) {
            return {};
        }
        return this.container.getParameter('conga.templates');
    }

    /**
     * Build the final data hash to pass to renderer
     *
     * This adds the request, container parameters, etc.
     *
     * @param {Request} request The request object
     * @param {Object} data The data from the controller
     * @return {void}
     */
    enhanceData(request, data) {

        data.conga = {
            request: request,
            security: request && request.conga && request.conga.security,
            parameters: this.container.getParameters()
        };

        const tags = this.container.getTagsByName('template.helper');

        for (const tag of tags) {
            const helper = this.container.get(tag.getServiceId());
            for (const method in helper.methods) {
                data[method] = function(name) {
                    const args = Array.prototype.slice.call(arguments);
                    return helper[helper.methods[method]].call(helper, request, ...args);
                };
            }
        }
    }

    /**
     * Find the real template path for a given template object
     *
     * This method checks if there is a template override for a template
     * within app/resources/[bundle-name]/[template-path]
     * and uses it, otherwise it finds the template from the actual bundle
     *
     * @param {Object|String} template The template view object or string namespace
     * @param {Function} cb The callback function
     * @return {void}
     */
    findTemplatePath(template, cb) {

        // template can be a template object or the template namespace string
        if (typeof template === 'string') {
            this.findTemplateForNamespace(template, (err, template) => {
                if (err) {
                    cb(err, null);
                    return;
                }
                this.findTemplatePath(template, cb);
            });
            return;
        }

        let engine = this.container.getParameter('app.view.engine');

        if (template.engine) {
            engine = template.engine;
        }

        const namespace = template.namespace;

        // use the cached path
        if (namespace in this.templatePathCache) {
            cb(this.templatePathCache[namespace]);
            return;
        }

        const namespaceResolver = this.container.get('namespace.resolver');

        // check if there is an override in the app/resources directory
        const appPath = path.join(
            this.container.getParameter('kernel.app_path'),
            'resources',
            namespaceResolver
                .injectSubpath(namespace, 'views').replace(':', '/') + '.' + engine
        );

        fs.access(appPath, err => {
            if (err) {
                appPath = namespaceResolver
                    .resolveWithSubpath(namespace + '.' + engine, 'lib/resources/views');
            }
            this.templatePathCache[namespace] = appPath;
            cb(appPath);
        });
    }

    /**
     * Find a template object by its namespace
     * @param {String} namespace The namespace path to the template
     * @returns {Object|null}
     */
    findTemplateForNamespace(namespace, cb) {

        if (namespace in this.templateNamespaces) {
            cb(null, this.templateNamespaces[namespace]);
        }

        const templates = this.getTemplates();

        for (const group in templates) {
            for (const key in templates[group]) {
                const template = templates[group][key];
                if (template.namespace === namespace) {
                    this.templateNamespaces[namespace] = template;
                    cb(null, template);
                    return;
                }
            }
        }

        cb(new Error('Template not found for: ' + namespace), null);
    }

    /**
     * Find the template info for a given route object
     *
     * This method checks if there is a template override for a template
     * within app/resources/[bundle-name]/[template-path]
     * and uses it, otherwise it finds the template from the actual bundle
     *
     * @param {{controller:String, action:String}} route The route object
     * @param {Function} cb The error-first callback function
     * @return {Object|null}
     */
    findTemplateForRoute(route, cb) {

        // make sure the template exists
        const templates = this.getTemplates();

        const { controller, action } = route;

        if (controller in templates &&
            action in templates[controller] &&
            templates[controller][action]
        ) {
            cb(null, templates[controller][action]);
            return;
        }

        cb(new Error('Template not found for: ' + controller + '::' + action), null);
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

        const status = error && error.status || 500;
        const templates = this.getTemplates();

        if (templates && templates.exception && templates.exception['error' + status]) {
            cb(null, templates.exception['error' + status]);
            return;
        }

        this.findTemplateForRoute(req.conga && req.conga.route, (err, template) => {

            if (!template) {
                cb(err, null);
                return;
            }


            this.getEngineForTemplate(template)
                .findTemplateForError(req, error, cb);
        });
    }

    /**
     * Get the engine for the template info
     *
     * @param  {Object}   template template info, i.e. { namespace: 'namespace:for/template', engine: 'twig' }
     * @return {TemplateEngine}
     */
    getEngineForTemplate(template) {

        const config = this.container.get('config').get('view');
        const defaultEngine = config['default.engine'] || '_error';

        const sidErr = 'conga.view.engine._error';

        let sid = sidErr;

        if (template) {
            const engine = template.engine || defaultEngine;
            sid = 'conga.view.engine.' + engine;
            if (!this.container.has(sid)) {
                sid = sidErr;
            }
        }

        return this.container.get(sid);
    }

    /**
     * Render a template
     * @param {String|Object} template The template object or namespace string
     * @param {Object} context The data you want to pass to the template
     * @param {Function} cb The error-first callback function
     */
    renderTemplate(template, context, cb) {

        if (typeof template === 'string') {
            this.findTemplateForNamespace(template, (err, template) => {
                if (err) {
                    cb(err, null);
                    return;
                }
                this.renderTemplate(template, context, cb);
            });
            return;
        }

        this.getEngineForTemplate(template)
            .render(template.namespace, context || {}, cb);
    }

    /**
     * Render a template for (or within) a request - calls enhance data with the request object
     * @param {Object} request The conga (express) request object
     * @param {String|Object} template The template object or namespace string
     * @param {Object} context The data you want to pass to the template
     * @param {Function} cb The error-first callback function
     */
    renderTemplateForRequest(request, template, context, cb) {
        this.enhanceData(request, context);
        this.renderTemplate(template, context, cb);
    }
}

module.exports = TemplateService;