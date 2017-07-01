/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const Annotation = require('@conga/annotations').Annotation;

/**
 * The @Template annotation specifies that a controller action
 * should use a template instead of returning a JSON response
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class TemplateAnnotation extends Annotation {

    /**
     * The possible targets
     *
     * (Annotation.DEFINITION, Annotation.CONSTRUCTOR, Annotation.PROPERTY, Annotation.METHOD)
     *
     * @type {Array}
     */
    static get targets() { return [Annotation.METHOD] }

    /**
     * Define the annotation string to find
     *
     * @var {String}
     */
    static get annotation() { return 'Template'; }

    constructor(data, filePath){

        super(data, filePath);

		this.path = null;
    }


	init(data){

		this.path = typeof data.value !== 'undefined' ? data.value : null;

        /**
		 * The specific template engine to use
		 *
		 * When "engine" isn't specified, the default template engine will be
		 * used. Otherwise, this one will...
		 *
		 * @var {String}
		 */
		this.engine = data.engine || null;

	}

}
