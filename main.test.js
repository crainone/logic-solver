var expect = require('chai').expect;
var app = require('./main');

describe('metatest', function() {
	it('should test', function() {
		expect(true).to.be.true;
	});
});

describe('GameBoard', function() {
	it('should create the same thing every time', function() {
		expect(typeof new GameBoard()).to.be.'GameBoard';
	});
});