var iectrl = require('iectrl');
var vmNames = iectrl.IEVM.names;
var finalExports = {};

vmNames.forEach(function ( vmName ) {
	finalExports['launcher:' + vmName] = ['type', IEVMLauncher];
});

function IEVMLauncher ( id, vmName, logger, baseBrowserDecorator ) {

	var log = logger.create('launcher.ievms');

	baseBrowserDecorator(this);

	this.id = id;
	this.name = vmName;
	this.vm = iectrl.IEVM.find(this.name)[0];
	this.wasRunning = false;
	this.captured = false;

	this.start = function ( url ) {
		var vmUrl;
		var self = this;
		vmUrl = (String(url) + '?id=' + this.id).replace('localhost', iectrl.IEVM.hostIp);
		return this.vm.running().then(function ( running ) {
			self.wasRunning = running;
			if (running) {
				log.info('Opening VM ' + self.name);
				return self.vm.open(vmUrl);
			}
			return self.vm.start(true).then(function () {
				log.info('Opening VM ' + self.name);
				return self.vm.open(vmUrl);
			});
		});
	};

	this.kill = function ( done ) {
		var self = this;
		log.info('Closing VM');
		return this.vm.close().then(function () {
			if ( self.wasRunning ) {
				return done();
			}
			log.info('Stopping VM ' + self.name);
			return self.vm.stop().then(function () {
				return done();
			});
		}).catch(done);
	};

	this.forceKill = function () {
		var self = this;
		log.info('Force stopping VM ' + self.name);
		return self.kill(function () {
			self.emit('done');
		});
	};

	this.markCaptured = function () {
		this.captured = true;
	};

	this.isCaptured = function () {
		return this.captured;
	};
}

IEVMLauncher.$inject = ['id', 'name', 'logger', 'baseBrowserDecorator'];

module.exports = finalExports;
