class CongaHelper {
    /**
	 *
     * @param {Container} container The service container
     */
	constructor(container) {
		this.container = container;
		this.methods = {
			conga_init: 'init'
		};
	}

	init() {
		let config = this.container.get('config').get('client');
		if (config && config[group] !== undefined) {
			config = config[group];
		} else {
			config = {};
		}
        return `
			<script type="text/javascript">
				var conga = (function(Conga) {
				    try {
				        return new Conga( (${JSON.stringify(config)}) );
				    } catch (e) {
				        console.error(e.stack || e);
				        return new Conga({});
				    }
				}(Conga));
			</script>
		`;
	}
}

module.exports = CongaHelper;