(function(global) {
'use strict';
/**
 *     ______            _          
 *    / ____/___  ____ _(_)___  ___ 
 *   / __/ / __ \/ __ `/ / __ \/ _ \
 *  / /___/ / / / /_/ / / / / /  __/
 * /_____/_/ /_/\__, /_/_/ /_/\___/ 
 *             /____/               
 */

var Engine = {};

var _started = false;
var _paused = false;
var _debugOverlay = null;


var _loadFunction = null;
var _tickFunction = null;
var _renderFunction = null;

var _loadOptions = null;
var _minWidth = 200;
var _minHeight = 150;
var _maxWidth = null;
var _maxHeight = null;
var _debug = false;
var _debugText = null;

Engine.setOptions = function(options) {
    _loadOptions = options;
}

Engine.load = function(callback) {
    _loadFunction = callback;
}

Engine.tick = function(callback) {
    _tickFunction = callback;
}

Engine.init = function() {
    _init();
}

Engine.render = function(callback) {
    _renderFunction = callback;
}

Engine.pause = function() {
    _paused = true;
}

Engine.resume = function() {
    _paused = false;
}

Engine.setDebugText = function(e) {
    _debugText = e;
}

var _init = function() {
    if (_started == true) return;
    _started = true;

    if (!_loadOptions || typeof(_loadOptions.containerElement) != 'string') {
        throw new Error('Initialize: Specify the container element id via optionsObject.containerElement in Engine.setOptions(optionsObject).');
    }

    var container = document.getElementById(_loadOptions.containerElement);
    if (!container) throw new Error('Initialize: Element with id ' + _loadOptions.containerElement + ' not found.');

    Screen.containerElement = container;
    container.innerHTML = '';

    // Shows error and abandons execution
    if (!_checkBrowserRequirements()) return;

    if (Utils.isNumber(_loadOptions.minWidth)) _minWidth = _loadOptions.minWidth;
    if (Utils.isNumber(_loadOptions.minHeight)) _minHeight = _loadOptions.minHeight;
    if (Utils.isNumber(_loadOptions.maxWidth)) _maxWidth = _loadOptions.maxWidth;
    if (Utils.isNumber(_loadOptions.maxHeight)) _maxHeight = _loadOptions.maxHeight;
    if (_loadOptions.debug) _debug = true;

    container.style.position = 'relative';
    container.style.overflow = 'hidden';

    Input.setMouseTarget(Screen.containerElement);

    if (_debug) {
        _debugOverlay = new Canvas(120, 60, 100);
    }

    // Resize container
    _onResize();

    // Start loops
    requestAnimationFrame(_renderLoop);
    _tickLoop();

    // Start the user's load function
    if (_loadFunction != null) _loadFunction();
}


/**
 * Tick
 */
var _doTick = function() {
    if (_paused) return;

    UIManager.tick();

    if (_tickFunction != null) _tickFunction();
}

/**
 * Render
 */
var _doRender = function() {
    if (_paused) return;

    UIManager.render();
    
    if (_renderFunction != null) _renderFunction();
}

/**
 * Called on errors
 */
var _reset = function() {
    UIManager.clear();

    Engine.pause();
}

/**
 * Render loop
 */
var _renderLoop = function() {
    requestAnimationFrame(_renderLoop);

    var startTime = _getNow();

    _doRender();

    var endTime = _getNow();
    _fpsRenderTime = (endTime - startTime);
    _doFps();
}

/**
 * Fps measurement
 */
var _fpsFrames = 0,
    _fpsFramesTotal = 0,
    _fpsLastTime = 0,
    _fpsRenderTime = 0;
var _doFps = function() {
    _fpsFrames++;
    if (_fpsLastTime == 0) _fpsLastTime = _getNow();
    if (_getNow() - _fpsLastTime >= 1000) {
        _fpsLastTime += 1000;
        _fpsFramesTotal = _fpsFrames;
        _fpsFrames = 0;
    }

    if (_debug) {
        var debugCanvas = _debugOverlay;
        debugCanvas.clear();
        debugCanvas.fillRect(0, 0, debugCanvas.width, debugCanvas.height, '#fff');
        debugCanvas.fillText(_fpsFramesTotal + ' fps', 5, 5, '#000', 12);
        debugCanvas.fillText(_fpsRenderTime.toFixed(1) + ' ms', 5, 20, '#000', 12);
        if (_debugText != null) {
            debugCanvas.fillText(_debugText, 5, 35, '#000', 12);
        }
    }
}

/**
 * Tick loop
 */
var _tickUnprocessed = 0,
    _tickLastTime = 0;
var _tickLoop = function() {
    if (_tickLastTime == 0) _tickLastTime = _getNow();

    _tickUnprocessed += (_getNow() - _tickLastTime) / (1000 / 60);

    // After sleep etc. browser may hang
    if (_tickUnprocessed > 600) _tickUnprocessed = 0;

    while (_tickUnprocessed >= 1) {
        _tickUnprocessed -= 1;
        _doTick();
    }

    _tickLastTime = _getNow();

    setTimeout(_tickLoop, 1000 / 60);
}

var _getNow = function() {
    if (global.performance != undefined && global.performance.now != undefined) return performance.now();
    return Date.now();
}

/**
 * Resize handling
 */
var _onResize = function() {
    Screen.width = document.documentElement.clientWidth;
    Screen.height = document.documentElement.clientHeight;
    
    if (Screen.width < _minWidth) Screen.width = _minWidth;
    if (Screen.height < _minHeight) Screen.height = _minHeight;
    if (_maxWidth != null && Screen.width > _maxWidth) Screen.width = _maxWidth;
    if (_maxHeight != null && Screen.height > _maxHeight) Screen.height = _maxHeight;

    // Rounding errors can be avoided by making the dimensions divisible by two
    if (Screen.width % 2 != 0) Screen.width--;
    if (Screen.height % 2 != 0) Screen.height--;

    Screen.containerElement.style.width = (Screen.width) + 'px';
    Screen.containerElement.style.height = (Screen.height) + 'px';

    UIManager.onResize();
}

/**
 * Check browser requirements for the Engine
 * @return {boolean} true if this browser has the required functions, false otherwise
 */
var _checkBrowserRequirements = function() {
    var canvas = document.createElement('canvas');
    if (!canvas.getContext || !canvas.getContext('2d')) {
        _showBrowserNotSupportedError();
        return false;
    }

    if (typeof(global.localStorage) == 'undefined') {
        _showBrowserNotSupportedError();
        return false;
    }

    return true;
}

var _showBrowserNotSupportedError = function() {
    Engine.handleError('This browser is not supported.<br>' + 
        '<a href="http://browsehappy.com/">More info</a>');
}

/**
 * Global exception handling, overrides all onerror events
 */
global.onerror = function(err, file, line) {
    Engine.handleError(err, file, line);
}

var _crashed = false;
/**
 * Handle global error by creating a screen for the user with a crash message
 * @param  {Error | String} error
 * @param  {String} [file]
 * @param  {String} [line]
 * @param  {Stacktrace} [stack]
 */
Engine.handleError = function(error, file, line, stack) {
    if (_crashed) return;

    if (!Screen.containerElement) return;
    _crashed = true;
    _reset();

    if (error instanceof Error) {
        file = error.fileName || '';
        line = error.lineNumber || '';
        stack = error.stack || '';
    } else {
        if (file == undefined) file = '';
        if (line == undefined) line = '';
        if (stack == undefined) stack = '';
    }

    Screen.containerElement.innerHTML = '';

    var elem = document.createElement('div');
    elem.className = 'engine-error';
    elem.style.margin = '30px 0 0 0';
    elem.style.padding = '0 100px 0 100px';

    var title = document.createElement('div');
    title.innerHTML = '<h3>:(<br>Crash!</h3>';
    title.style.fontSize = '42px';
    title.style.textAlign = 'center';
    title.style.fontWeight = 'normal';

    elem.appendChild(title);

    if (stack == '') elem.innerHTML += error;
    if (file != '' && line != '') elem.innerHTML += '<br><br>' + file + ':' + line + '.'; 
    if (stack != '') elem.innerHTML += stack.replace(/\n/g, '<br>&nbsp;&nbsp;&nbsp;&nbsp;');

    Screen.containerElement.appendChild(elem);

    return;
}

try {
    global.addEventListener('resize', _onResize);
} catch(err) {
    // Check for <IE9 so that an error can by displayed if there is no canvas support
}

global.Engine = Engine;


})(global);