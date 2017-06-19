/*
 * This file is part of the conga-view module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

 const path = require('path');

 /**
  * The PathHelper provides view helps to deal with asset paths in templates
  *
  * @author Marc Roulias <marc@lampjunkie.com>
  */
module.exports = class PathHelper {

    constructor(container) {
        this.container = container;

        this.methods = {
            path: path
        }
    }

    /**
     * Get the relative web path for an asset url
     *
     * @param {String} name
     * @return {String}
     */
    path(name) {
      return path.join('/', name);
    }
}
