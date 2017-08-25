/*
 * This file is part of the conga-view module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Template engine placeholder
 */
module.exports = class TemplateEngine {
    /**
     * Render the template / view
     * @param {String} namespace The namespace path to the template, ex. bundle:path/file
     * @param {Object} data The template context object, this should be passed to the template
     * @param {Function} callback The callback to execute with the template data when done
     * @returns {void}
     */
    render(namespace, data, callback) {
        callback(new Error('No template engine is defined for ' + namespace));
    }

    /**
     * Render the template / view
     * @param {Object} request The conga request
     * @param {Error|*} error The error
     * @param {Function} callback The callback to execute with the template data when done
     * @returns {void}
     */
    findTemplateForError(request, error, callback) {
        callback(new Error('No template engine is defined for ' + request.originalUrl));
    }
};