/*
 * This file is part of the conga-view module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

 /**
  * The UrlHelper provides view helps to deal with routing URLs
  *
  * @author Marc Roulias <marc@lampjunkie.com>
  */
module.exports = class UrlHelper {

    constructor(router) {
        this.router = router;

        this.methods = {
          'url_for': 'urlFor'
      };
    }

    /**
     * Build a full URL for a route name and parameters
     *
     * @param  {String} route  the route name
     * @param  {Object} params hash of parameter keys/values
     * @return {String}
     */
    urlFor(route, params) {
        return this.router.generateUrl(route, params);
    }
}
