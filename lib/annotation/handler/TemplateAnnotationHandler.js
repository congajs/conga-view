/*
 * This file is part of the conga-view module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// native modules
const path = require('path');

/**
 * The TemplateAnnotationHandler handles all the @Template annotations
 * that are found within a controller and sets the information on the
 * applications DIC container
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class TemplateAnnotationHandler {

	/**
	 * Get the annotation paths that should be parsed
	 *
	 * @return {Array}
	 */
	getAnnotationPaths() {
		return [
			path.join(__dirname, '..', 'TemplateAnnotation')
		];
	}

	/**
	 * Handle all of the routing annotations on a controller
	 *
	 * @param  {Container} container
	 * @param  {Reader}    reader
	 * @param  {Object}    controller
	 * @return {Array}
	 */
	handleAnnotations(container, reader, controller) {

		// parse the templates from the controller
		const templates = this.parseTemplatesFromFile(container, reader, controller);

		// make sure that container has templates object
		if (!container.hasParameter('conga.templates')) {
			container.setParameter('conga.templates', {});
		}

		// store routes for express to use later on
		for (let i in templates) {
			container.getParameter('conga.templates')[i] = templates[i];
		}

		// make sure that container has response handlers hash
		if (!container.hasParameter('conga.response.handlers')) {
			container.setParameter('conga.response.handlers', {});
		}

		const handlers = container.getParameter('conga.response.handlers');

		for (let controllerServiceId in templates) {

			for (let action in templates[controllerServiceId]) {

				if (typeof handlers[controllerServiceId] === 'undefined') {
					handlers[controllerServiceId] = {};
				}

				if (typeof handlers[controllerServiceId][action] === 'undefined') {
					handlers[controllerServiceId][action] = {};
				}

				handlers[controllerServiceId][action] = container.get('conga.template.response.handler');

			}

		}

		container.setParameter('conga.response.handlers', handlers);
	}

	/**
	 * Find the annotations in a controller and create a mapping
	 * of controllers/actions to their templates
	 *
	 * Sets an object with the following format on the Container:
	 *
	 * {
	 *    controller.id : {
	 *          action: {
	 *            namespace: 'namespace:of/template',
	 *            engine: 'engine-to-use'
	 *          }
	 *      }
	 * }
	 *
	 * @param  {Container} container
	 * @param  {Reader} reader
	 * @param  {Object} controller
	 * @return {Object}
	 */
	parseTemplatesFromFile(container, reader, controller) {

		const config = container.get('config').get('view');
		const defaultEngine = config['default.engine'];

		// set up return object
		const templates = {};

		// parse the annotations
		reader.parse(controller.filePath);

		// get the annotations
		const methodAnnotations = reader.methodAnnotations;

		// find method annotations
		methodAnnotations.forEach((annotation) => {

			// @Template annotation
			if (annotation.constructor.name === 'TemplateAnnotation') {

				// add service id to template hash
				if (typeof templates[controller.serviceId] === 'undefined') {
					templates[controller.serviceId] = {};
				}

				// build the template namespace
				const namespace = controller.bundle + ':' +
								require('path').basename(controller.filePath)
									.replace('Controller.js', '').toLowerCase() + '/' +
								annotation.target;

				templates[controller.serviceId][annotation.target] = {
					namespace: annotation.path !== null ? annotation.path : namespace,
					engine: annotation.engine !== null ? annotation.engine : defaultEngine
				};
			}
		});

		return templates;
	}
}
