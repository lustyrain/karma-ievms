var iectrl = require('iectrl');
var vmNames = iectrl.IEVM.names;
var finalExports = {};

vmNames.forEach(function (vmName) {
	finalExports['launcher:' + vmName] = ['type', IEVMLauncher];
});

function IEVMLauncher(id, vmName, logger, baseBrowserDecorator) {

	var log = logger.create('launcher.ievms');

	baseBrowserDecorator(this);

	this.id = id;
	this.name = vmName;
	this.vm = iectrl.IEVM.find(this.name)[0];
	this.wasRunning = false;
	this.captured = false;

	var wasRunning = this.wasRunning;
	var name = this.name;
	var vm = this.vm;

	this.start = function (url) {
		var vmUrl;
		var self = this;
		vmUrl = (String(url) + '?id=' + this.id).replace('localhost', iectrl.IEVM.hostIp);
		return this.vm.running().then(function (running) {
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


	this.on('kill', function (done) {
		log.info('Closing VM');
		return vm.close().then(function () {
			if (wasRunning) {
				return done();
			}
			log.info('Stopping VM ' + name);
			return vm.stop().then(function () {
				return done();
			});
		}).catch(done);
	});
	this.markCaptured = function () {
		this.captured = true;
	};

	this.isCaptured = function () {
		return this.captured;
	};
}

IEVMLauncher.$inject = ['id', 'name', 'logger', 'baseBrowserDecorator'];

module.exports = finalExports;
