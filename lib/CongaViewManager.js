/*
 * This file is part of the conga-view module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The CongaViewManager sets up the current templating engine, etc.
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class CongaViewManager {

	/**
	 * Construct the CongaViewManager
	 */
	constructor() {

	}

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

		// move on
		next();
	}
}
