/*
 * This file is part of the conga-view module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The RestManager keeps track of Restful objects
 * and handles thier serialization
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class CongaViewManager {

	/**
	 * Construct the RestManager
	 */
	constructor() {

	}

	/**
	 * Parse out all of the REST annotations from objects
	 * and store the information for lookup later on
	 *
	 * @param container
	 */
	onKernelCompile(event, next) {

		const container = event.container;
		this.container = container;
		const config = container.get('config').get('rest');

		if (typeof config === 'undefined') {
			next();
			return;
		}




		// move on
		next();
	}
}
