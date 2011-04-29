var wrapTest = require('./helpers').wrapTest,
    assert = require('assert'),
    EventDispatcher = require('../lib/EventDispatcher.js');

// Names must be a valid object key
var name1 = 'test event';
var name2 = 89;

// Listeners can be anything that is representable in plain JSON 
var listener1 = [1, 2, 'qu"a"il', "'", { arr: ['x', 'y'] }];
var listener2 = 0;
var listener3 = 'stuff';
var listener4 = true;

// The second and third parameters sent to trigger are simply passed through
// to the callback function. They can be anything.
var value1 = 'test value';
var options1 = { option: 4 };

function makeDispatcher(onServer, triggerCallback, bindCallback) {
  EventDispatcher._.onServer = onServer;
  return new EventDispatcher(triggerCallback, bindCallback);
}

module.exports = {
  'test EventDispatcher no callbacks': function() {
    var dispatcher = makeDispatcher(false);
    dispatcher.bind(name1, listener1);
    dispatcher.trigger(name1, value1, options1);
  },
  'test EventDispatcher successful trigger in browser': wrapTest(function(done) {
    var triggerFunction = function(listener, value, options) {
          listener.should.eql(listener1);
          value.should.equal(value1);
          options.should.equal(options1);
          done();
          return true;
        },
        dispatcher = makeDispatcher(false, triggerFunction);
    dispatcher.bind(name1, listener1);
    dispatcher.trigger(name1, value1, options1);
    dispatcher.trigger(name1, value1, options1);
  }, 2),
  'test EventDispatcher no listener': wrapTest(function(done) {
    var triggerFunction = function(listener, value, options) {
          assert.isNull(listener);
          value.should.equal(value1);
          options.should.equal(options1);
          done();
          return true;
        },
        dispatcher = makeDispatcher(false, triggerFunction);
    dispatcher.bind(name1);
    dispatcher.trigger(name1, value1, options1);
    dispatcher.trigger(name1, value1, options1);
  }, 2),
  'test EventDispatcher trigger multiple listeners': function(beforeExit) {
    var counts = {},
        triggerFunction = function(listener, value, options) {
          counts[listener] = (counts[listener] || 0) + 1;
          value.should.equal(value1);
          options.should.equal(options1);
          return true;
        },
        dispatcher = makeDispatcher(false, triggerFunction);
    dispatcher.bind(name1, listener2);
    dispatcher.bind(name1, listener3);
    dispatcher.bind(name1, listener4);
    dispatcher.bind(name2, listener3);
    dispatcher.trigger(name1, value1, options1);
    dispatcher.trigger(name2, value1, options1);
    dispatcher.trigger(name2, value1, options1);
    beforeExit(function() {
      counts[listener2].should.equal(1);
      counts[listener3].should.equal(3);
      counts[listener4].should.equal(1);
    });
  },
  'test EventDispatcher remove listener after failed trigger': wrapTest(function(done) {
    var triggerFunction = function() {
          done();
          return false;
        },
        dispatcher = makeDispatcher(false, triggerFunction);
    dispatcher.bind(name1);
    dispatcher.trigger(name1);
    dispatcher.trigger(name1);
  }, 1),
  'test EventDispatcher do not trigger on server': wrapTest(function(done) {
    var triggerFunction = done,
        dispatcher = makeDispatcher(true, triggerFunction);
    dispatcher.bind(name1);
    dispatcher.trigger(name1);
  }, 0),
  'test EventDispatcher do not trigger twice after double bind': wrapTest(function(done) {
    var triggerFunction = done,
        dispatcher = makeDispatcher(false, triggerFunction);
    dispatcher.bind(name1, listener1);
    dispatcher.bind(name1, listener1);
    dispatcher.trigger(name1);
  }, 1),
  'test EventDispatcher unbind': wrapTest(function(done) {
    var triggerFunction = function() {
          done();
          return true;
        },
        dispatcher = makeDispatcher(false, triggerFunction);
    dispatcher.bind(name1, listener1);
    dispatcher.trigger(name1);
    dispatcher.trigger(name1);
    dispatcher.unbind(name1, listener1);
    dispatcher.trigger(name1);
  }, 2),
  'test EventDispatcher get and set': wrapTest(function(done) {
    var triggerFunction = function(listener, value, options) {
          listener.should.eql(listener1);
          value.should.equal(value1);
          options.should.equal(options1);
          done();
          return true;
        },
        dispatcher1 = makeDispatcher(true, triggerFunction),
        dispatcher2 = makeDispatcher(false, triggerFunction),
        data1, data2;
    
    dispatcher1.bind(name1, listener1);
    data1 = dispatcher1.get();
    
    // Make sure the object returned by get() can be turned into JSON and then
    // back into an equivalent object
    data2 = JSON.parse(JSON.stringify(data1));
    data1.should.eql(data2);
    data1.should.not.equal(data2);
    
    dispatcher2.set(data2);
    dispatcher2.trigger(name1, value1, options1);
  }, 1),
}