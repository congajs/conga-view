/*
 * This file is part of the conga-view module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// core libs
const path = require('path');

 /**
  * The PathHelper provides view helpers to deal with asset paths in templates
  */
module.exports = class PathHelper {
    /**
     *
     * @param {Container} container The service container
     */
    constructor(container) {
        this.container = container;

        this.methods = {
            path: path
        }
    }

    /**
     * Get the relative web path for an asset url
     *
     * @param  {Request} req
     * @param  {String}  name
     * @return {String}
     */
    path(req, name) {
        return path.join('/', name);
    }
};
