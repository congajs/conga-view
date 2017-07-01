/*
 * This file is part of the conga-view module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The CongaViewManager sets up all the registered view engines
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class CongaViewManager {

	/**
	 * Set up currently configured templating engine
	 *
	 * @param container
	 */
	onKernelCompile(event, next) {

		const container = event.container;
		const config = container.get('config').get('view');

		if (typeof config === 'undefined') {
			next();
			return;
		}

		this.registerViewEngines(container, null, next);

	}

	/**
     * Find all of the tagged view engines and register them
     *
     * @param  {Container} container
     * @param  {Application} app
     * @param  {Function} cb
     * @return {void}
     */
    registerViewEngines(container, app, cb) {

        const tags = container.getTagsByName('app.view.configuration');

        if (!tags || tags.length === 0){
            cb();
            return;
        }

        tags.forEach((tag) => {

	        const service = container.get(tag.getServiceId());
	        const method = tag.getParameter('method');

	        service[method].call(
				service,
				container,
				cb
			);
		});

    }

}
