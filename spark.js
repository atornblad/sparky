(function () {
    
    // There is no good way of knowing the actual physical DPI
    // All devices report 96, but most are around 144, so let's just use that!
    var dpi = 144;
    
    // Current display mode (sparky, pixels, centimeters or inches)
    var currentMode = '';
    
    // Keeps track of all current points of touch on the screen
    var touches = {};
    
    // Change to the next display mode
    // This function gets called once upon app start
    var changeMode = function (e) {
        if (e) e.preventDefault();
        
        if (currentMode == "sparky") {
            currentMode = "pixels";
        } else if (currentMode == "pixels") {
            currentMode = "centimeters";
        } else if (currentMode == "centimeters") {
            currentMode = "inches";
        } else {
            currentMode = "sparky";
        }
        
        document.getElementById("changeMode").innerHTML = currentMode;
        document.body.className = currentMode;
    };
    
    // Calculate the size and rotation of one div, starting at one touch, ending at other touch
    var setStyle = function (div, oneTouch, otherTouch) {
        // Starting touch must be to the left of ending touch
        if (oneTouch.x > otherTouch.x) {
            // If not, just call myself with arguments reversed
            return setStyle(div, otherTouch, oneTouch);
        }
        
        // Distance between touches becomes the width of the div
        var dist = Math.sqrt((oneTouch.x - otherTouch.x) * (oneTouch.x - otherTouch.x) + (oneTouch.y - otherTouch.y) * (oneTouch.y - otherTouch.y));
        var distFixed = dist.toFixed(0);
        
        // Angle becomes the css transform of the div
        var angle;
        if (otherTouch.x == oneTouch.x) {
            angle = (otherTouch.y > oneTouch.y) ? 90.0 : 270.0;
        } else {
            angle = 180.0 + 180.0 * Math.atan((otherTouch.y - oneTouch.y) / (otherTouch.x - oneTouch.x)) / Math.PI;
        }
        if (otherTouch.x > oneTouch.x) {
            angle += 180.0;
        }
        
        // Assign values to some style properties
        div.style['position'] = 'absolute';
        div.style['display'] = 'block';
        div.style['left'] = (oneTouch.x - 8) + 'px';
        div.style['top'] = (oneTouch.y) + "px";
        div.style['height'] = '16px';
        div.style['width'] = distFixed + 'px';
        div.style['backgroundPosition'] = '' + (Math.random() * 100.0).toFixed(0) + '% 0%';
        div.style['transform'] = 'rotate(' + angle.toFixed(1) + 'deg)';
        
        // Apply the current display mode
        if (currentMode == 'pixels') {
            // For "pixels" mode, just show the number of pixels inside the div
            div.textContent = distFixed + 'px';
        } else if (currentMode == 'inches') {
            // For "inches" mode, show the number of inches inside the div
            var inches = dist / dpi;
            div.textContent = inches.toFixed(2) + '\u2033';
        } else if (currentMode == 'centimeters') {
            // For "centimeters" mode, show the number of centimeters inside the div
            var cm = dist / dpi * 2.54;
            div.textContent = cm.toFixed(2) + 'cm';
        } else {
            // For "sparky" mode, empty the div!
            div.textContent = '';
        }
    };
    
    // Finds a div by its supposed id
    // If such does not exist, creates a div and adds it to document.body
    var findOrCreateDiv = function (id) {
        var div = document.getElementById(id);
        if (div) return div;

        div = document.createElement("DIV");
        div.id = id;
        document.body.appendChild(div);

        return div;
    }
    
    // Creates an id for a div going from one touch to another touch
    // This must be unambiguous, always rendering the same id, regardless of which touch is first and which is second!
    var getDivId = function (oneId, otherId) {
        if (oneId > otherId) {
            return oneId + otherId;
        } else {
            return otherId + oneId;
        }
    };
    
    // Updates styles for all divs that start or end at a given touch
    var updateDivsForId = function (touchId) {
        for (var otherId in touches) {
            if (otherId != touchId) {
                var divId = getDivId(touchId, otherId);
                var div = findOrCreateDiv(divId);
                setStyle(div, touches[touchId], touches[otherId]);
            }
        }
    };
    
    // Deletes every div element that starts or ends at a given touch
    var deleteDivsForId = function (touchId) {
        for (var otherId in touches) {
            if (otherId != touchId) {
                var divId = getDivId(touchId, otherId);
                var div = findOrCreateDiv(divId);
                div.parentNode.removeChild(div);
            }
        }
    };
    
    // Adds a new touch and creates divs accordingly
    var addTouch = function (id, x, y) {
        touches[id] = { x: x, y: y };
        updateDivsForId(id);
    };
    
    // Updates information for a touch and updates all divs accordingly
    var changeTouch = function (id, x, y) {
        if (touches[id]) {
            touches[id].x = x;
            touches[id].y = y;
            updateDivsForId(id);
        }
    };
    
    // Removes a touch and deletes all div elements that start or end at that touch
    var removeTouch = function (id) {
        if (touches[id]) {
            delete touches[id];
            deleteDivsForId(id);
        }
    };
    
    // touchstart event handler
    var touchStart = function (e) {
        e.preventDefault();
        for (var i = 0; i < e.changedTouches.length; ++i) {
            var touch = e.changedTouches[i];
            addTouch('t'+touch.identifier, touch.clientX, touch.clientY);
        }
    };
    
    // touchmove event handler
    var touchMove = function (e) {
        e.preventDefault();
        for (var i = 0; i < e.changedTouches.length; ++i) {
            var touch = e.changedTouches[i];
            changeTouch('t'+touch.identifier, touch.clientX, touch.clientY);
        }
    };
    
    // touchend event handler
    var touchEnd = function (e) {
        e.preventDefault();
        for (var i = 0; i < e.changedTouches.length; ++i) {
            var touch = e.changedTouches[i];
            removeTouch('t'+touch.identifier);
        }
    };
    
    // Helper event handler for hiding events that we don't want the browser to get
    var stopEvent = function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
    };
    
    // Helper event handler for allowing clicks on links to work without them going
    // through to the touch handling of this app
    var dontPropagate = function (e) {
        e.stopPropagation();
    };
    
    // Ten times per second, change the "sparky" divs randomly
    var timerTick = function () {
        if (currentMode == "sparky") {
            var divs = document.getElementsByTagName("DIV");
            for (var i = 0; i < divs.length; ++i) {
                divs[i].style.backgroundPosition = "" + (Math.random() * 100.0).toFixed(0) + "% 0%";
            }
        }
        
        window.setTimeout(timerTick, 100);
    };
    
    // Hook up everything!
    window.addEventListener('load', function () {
        var body = document.body;
        
        if (!'ontouchstart' in document.documentElement) {
            body.textContent = 'Sorry, this demonstration requires a touch-enabled device to work.';
            return;
        }
        
        // Touching these links should not trigger the sparky code...
        var changeModeElement = document.getElementById('changeMode');
        var linkHolderElement = document.getElementById('linkHolder');
        
        changeModeElement.addEventListener('touchstart', changeMode);
        linkHolderElement.addEventListener('touchstart', dontPropagate);
        linkHolderElement.addEventListener('touchend', dontPropagate);
        
        // Hooking up the touch things
        body.addEventListener('touchstart', touchStart);
        body.addEventListener('touchmove', touchMove);
        body.addEventListener('touchend', touchEnd);
        body.addEventListener('gesturechange', stopEvent);
        
        // Mouse events are ignored!
        window.addEventListener('mousedown', stopEvent);
        window.addEventListener('mousemove', stopEvent);
        
        // Start sparking...
        timerTick.call(window);
        
        // Go to "sparky" mode
        changeMode();
    });
    
})();