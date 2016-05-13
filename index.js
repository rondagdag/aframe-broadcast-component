var debug = AFRAME.utils.debug;
var io = require('socket.io-client');

var info = debug('aframe-broadcast-component:info');

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

AFRAME.registerSystem('broadcast', {
  init: function () {
    var sceneEl = this.sceneEl;
    var url = sceneEl.getAttribute('broadcast').url;
    this.socket = io(url);

    this.socket.on('connect', function () {
      info('Connected', url);
    });

    this.socket.on('broadcast', function (data) {
      data.forEach(function syncState (entity) {
        var el = sceneEl.querySelector('#' + entity.id);
        entity.components.forEach(function setAttribute (component) {
          console.log(component[0], component[1]);
          el.setAttribute(component[0], component[1]);
        });
      });
    });

    this.receiveHandlers = [];
    this.sendQueue = [];
  },

  addSend: function (el, sendComponents) {
    this.sendQueue.push(function send () {
      return {
        id: el.getAttribute('id'),
        components: sendComponents.map(function getAttribute (componentName) {
          return [componentName, el.getComputedAttribute(componentName)];
        })
      };
    });
  },

  tick: function () {
    this.socket.emit('broadcast', this.sendQueue.map(function call (getSend) {
      return getSend();
    }));
  }
});

/**
 * Broadcast component for A-Frame.
 */
AFRAME.registerComponent('broadcast', {
  schema: {
    url: {type: 'string'},
    receive: {type: 'array'},
    send: {type: 'array'}
  },

  init: function () {
    var data = this.data;
    var el = this.el;
    var system = this.system;

    if (data.send.length) {
      system.addSend(el, data.send);
    }
  }
});
