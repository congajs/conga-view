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

        const service = this.container.get('conga.view.template');
        const container = this.container;

        service.findTemplateForRoute(req.conga.route, (err, template) => {
            if (err) {
                cb(err, null);
                return;
            }

            const stopwatch = container.has('profiler.stopwatch') &&
                container.get('profiler.stopwatch').request(req).start('template.render', 'view');

            service.renderTemplateForRequest(req, template, data, (err, html) => {
                stopwatch && stopwatch.stop();
                if (err) {
                    cb(err, null);
                    return;
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

        const service = this.container.get('conga.view.template');

        service.findTemplateForError(req, error, (err, template) => {
            if (err) {
                cb(err, null);
                return;
            }
            service.renderTemplateForRequest(req, template, data, cb);
        });
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
};
