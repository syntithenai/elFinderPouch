
//Adding touch fix

/*!
 * jQuery UI Touch Punch 0.2.2
 *
 * Copyright 2011, Dave Furfero
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Depends:
 *  jquery.ui.widget.js
 *  jquery.ui.mouse.js
 */ (function($) {

    // Detect touch support
    $.support.touch = 'ontouchend' in document;

    // Ignore browsers without touch support
    if (!$.support.touch) {
        return;
    }

    var mouseProto = $.ui.mouse.prototype,
        _mouseInit = mouseProto._mouseInit,
        touchHandled;

    /**
     * Simulate a mouse event based on a corresponding touch event
     * @param {Object} event A touch event
     * @param {String} simulatedType The corresponding mouse event
     */
    function simulateMouseEvent(event, simulatedType) {

        // Ignore multi-touch events
        if (event.originalEvent.touches.length > 1) {
            return;
        }

        event.preventDefault();

        var touch = event.originalEvent.changedTouches[0],
            simulatedEvent = document.createEvent('MouseEvents');

        // Initialize the simulated mouse event using the touch event's coordinates
        simulatedEvent.initMouseEvent(
            simulatedType, // type
            true, // bubbles
            true, // cancelable
            window, // view
            1, // detail
            touch.screenX, // screenX
            touch.screenY, // screenY
            touch.clientX, // clientX
            touch.clientY, // clientY
            false, // ctrlKey
            false, // altKey
            false, // shiftKey
            false, // metaKey
            0, // button
            null // relatedTarget
        );

        // Dispatch the simulated event to the target element
        event.target.dispatchEvent(simulatedEvent);
    }

    /**
     * Handle the jQuery UI widget's touchstart events
     * @param {Object} event The widget element's touchstart event
     */
    mouseProto._touchStart = function(event) {

        var self = this;

        // Ignore the event if another widget is already being handled
        if (touchHandled || !self._mouseCapture(event.originalEvent.changedTouches[0])) {
            return;
        }

        // Set the flag to prevent other widgets from inheriting the touch event
        touchHandled = true;

        // Track movement to determine if interaction was a click
        self._touchMoved = false;

        // Simulate the mouseover event
        simulateMouseEvent(event, 'mouseover');

        // Simulate the mousemove event
        simulateMouseEvent(event, 'mousemove');

        // Simulate the mousedown event
        simulateMouseEvent(event, 'mousedown');
    };

    /**
     * Handle the jQuery UI widget's touchmove events
     * @param {Object} event The document's touchmove event
     */
    mouseProto._touchMove = function(event) {

        // Ignore event if not handled
        if (!touchHandled) {
            return;
        }

        // Interaction was not a click
        this._touchMoved = true;

        // Simulate the mousemove event
        simulateMouseEvent(event, 'mousemove');
    };

    /**
     * Handle the jQuery UI widget's touchend events
     * @param {Object} event The document's touchend event
     */
    mouseProto._touchEnd = function(event) {

        // Ignore event if not handled
        if (!touchHandled) {
            return;
        }

        // Simulate the mouseup event
        simulateMouseEvent(event, 'mouseup');

        // Simulate the mouseout event
        simulateMouseEvent(event, 'mouseout');

        // If the touch interaction did not move, it should trigger a click
        if (!this._touchMoved) {

            // Simulate the click event
            simulateMouseEvent(event, 'click');
        }

        // Unset the flag to allow other widgets to inherit the touch event
        touchHandled = false;
    };

    /**
     * A duck punch of the $.ui.mouse _mouseInit method to support touch events.
     * This method extends the widget with bound touch event handlers that
     * translate touch events to mouse events and pass them to the widget's
     * original mouse event handling methods.
     */
    mouseProto._mouseInit = function() {

        var self = this;

        // Delegate the touch handlers to the widget's element
        self.element.bind('touchstart', $.proxy(self, '_touchStart'))
            .bind('touchmove', $.proxy(self, '_touchMove'))
            .bind('touchend', $.proxy(self, '_touchEnd'));

        // Call the original $.ui.mouse init method
        _mouseInit.call(self);
    };

})(jQuery);


////////////////////////////////////////////////////////////////////////////////
// Filter definitions
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
// Filter object
////////////////////////////////////////////////////////////////////////////////
$.fn.cropzoom.Filter=function(name, func, init, update) {
	this.name = name;
	this.func = func;
	this.update = update;
	this.sliders = [];
	this.nubs = [];
	init.call(this);
}
$.fn.cropzoom.Filter.prototype.addNub = function(name, x, y) {
	this.nubs.push({ name: name, x: x, y: y });
};
$.fn.cropzoom.Filter.prototype.addSlider = function(name, label, min, max, value, step) {
	this.sliders.push({ name: name, label: label, min: min, max: max, value: value, step: step });
};
$.fn.cropzoom.Filter.prototype.setCode = function(code) {
	eval(code);
};

$.fn.cropzoom.Filter.prototype.use = function(image,target) {
	console.log('now user filter',this,image)
	var wrapper=$('<div class="imagewrapper" />');
	wrapper.insertBefore(image);
	wrapper.append(image);
	var placeholder=$('<div class="placeholder" ></div>');
	wrapper.append(placeholder);
	try {
		canvas = fx.canvas();
	} catch (e) {
		placeholder.innerHTML = e;
		return;
	}
	texture = canvas.texture(image.get(0));
	// ??? $('#container').css({ width: texture._.width, height: texture._.height });
	canvas.draw(texture).update();
	$(image).attr('src',canvas.toDataURL('image/png'));
	
	// NOW FILTER CONTROLS
	var controlBox=$('.cropzoom-controls',target);
	controlBox.find('.filterlabel').remove();
	// Add a row for each slider
	for (var i = 0; i < this.sliders.length; i++) {
		var slider = this.sliders[i];
		$('<div class="filterlabel" >'+slider.label.replace(/ /g, '&nbsp;') + '<div class="filterslider" id="slider' + i + '"></div></div>').appendTo(controlBox);
		var onchange = (function(this_, slider) {  console.log('change',this_,slider); return function(event, ui) {
			this_[slider.name] = ui.value;
			console.log('applied affect, now update');
			this_.update();
			$(image).attr('src',canvas.toDataURL('image/png'));
		}; })(this, slider);
		//console.log('create slider ',i,slider,onchange,controlBox)
		$('#slider' + i).slider({
			slide: onchange,
			change: onchange,
			min: slider.min,
			max: slider.max,
			value: slider.value,
			step: slider.step
		});
		this[slider.name] = slider.value;
	}
	// ANY NUBS FOR THIS FILTER ?
	if ($('.nubs',target).length==0) {
		$(target).append('<div class="nubs">');
	}
	// Add a div for each nub
	var nubs=$('.nubs',target);
	nubs.html('').css({zIndex:999});
	for (var i = 0; i < this.nubs.length; i++) {
		var nub = this.nubs[i];
		var x = nub.x * canvas.width;
		var y = nub.y * canvas.height;
		$('<div class="nub nub' + i + '"></div>').appendTo('.nubs',target);
		var ondrag = (function(this_, nub) { return function(event, ui) {
			var offset = $(event.target.parentNode).offset();
			this_[nub.name] = { x: ui.offset.left - offset.left, y: ui.offset.top - offset.top };
			this_.update();
		}; })(this, nub);
		$('.nub' + i,target).draggable({
			drag: ondrag,
			containment: target,
			scroll: false
		}).css({ left: x, top: y });
		this[nub.name] = { x: x, y: y };
	}
//console.log('NOW UPDATE');
	this.update();
};
////////////////////////////////////////////////////////////////////////////////
// END Filter object
////////////////////////////////////////////////////////////////////////////////
$.fn.cropzoom.icons={};
$.fn.cropzoom.icons.rotate='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAHsSURBVDjLtZPpTlpRFIV5Dt7AOESr1kYNThGnSomIihPoNVi5Qp3RgBgvEERpRW1BRBAcMEDUtIkdjKk4otK0Jdr2vgxZ3kA0MYoaG3+cX2evb529zt4sAKz/OawnASgCBNm5LaE7vjVDutkA4mMdLV4TkvcCuvba2Iqd1pDhWA33mQU+2oXVv07YfpoxuNWFuqVXoeqFCnZcgJwRm04p+Gk3Fs9t8PyZx/K5Hfbf03CGLRj62g2+rSR0K0D+vZXUB1Xw/ou5usJWjAaU0Gz3w/rjHey/ZjDLvKTD34KSyXzyBkC2JaYd4feMqyNa3OQTREQePlXjrqSq5ssj5hMjTMd66ALDKDLm0jcA0s+NID6JIFmvQaNXANEKX3l5x7NyqTcb7Zg8GYtCOLoXuPcbha6XV0VlU4WUzE9gPKjF2CGFbE3G3QAmafDnShETF3iKTZyIblcNza4Syi/deD6USscFCJwV6Fwn8NonQak5Hy1L9TAcjkJ/oAG1p0a1hYdnfcnkrQCBoxyyNYLp1YCJoB7GIwqGgxGod/oZsQoNDiHSepNCceeAN8uF1CvGxJE25rofc+3blKPqQ2VUnKxIYN85yty3eWh216LeKUTOSCayVGlIH0g5S+1JJB+8Cxxt1rWkH7WNTNIPAlwA9Gm7OcXUHxUAAAAASUVORK5CYII=';
$.fn.cropzoom.icons.zoom='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAI6SURBVDjLpZJbaJJxGMaHgdcFXURdBLtZrGitiFh0uhjRVRTVWI1as7mQakhjyyEkRAcaHSCrj0xrWGuuoVsr25qzfeYObh6yJJdzavoZs3Sy8PhJ8vR9EoHkotXFA/+b3+//vC9vEYCi/8mvh8H7nTM8kyF0LpoacCazLxzxbM/bb1S3OUo8GQtz/iggGfi1O0NaAzS8kQwCURqBORrTX9LQf5jHQ3KWlA1RnAUFeneGsATSoKIZOGdTsAWSMPuTsFNJeL7SEOoF4GtrUKuuShUUvJpKUd4wnYMtDDj5KQGTN4FRTyInOvH8MDonL6BKuRcFBey8fqYyC0/4Ehhn4JGZOBp1AtT1VkOkrYfMKIKgsxq7b+zErssV0TyBxjaf9UVomBh4jPnVyMCG6ThbGfKRVtwebsK1wdO4+JIPce8xbBGXI0+gMkWoqZ/137jjIBlY/zEGnqoO+2R7wGvfj/N9x3FAWonNojKUCUtTeQKlMUT02+fgCqVzs7OwzhnLyd4HU2xlCLsOYlPz+sI7uK8Pcu4O+EnNRAhWfwKOzym8Y2LyxCAf9GGHZDvKm9Zha2NptudcRUnBQ7rZ5+G0aVzEpS4nJelwZMXt9myL3Bpskyq9FmUzQuZu2B63QCXcEH50ak3Jb4KF0i+p5D5r3aYeJeoRNCgwfq8BCv7q8F8L2Dw9u5HbcWateuj6IXi0V0HUrsCiBGweNBRzZbxVasXJYkhrll1ZtIDNnaPLl9w6snRlwSX+a34AgPPwSZzC+6wAAAAASUVORK5CYII=';
$.fn.cropzoom.cropZoomFilters = {
    'None': [new $.fn.cropzoom.Filter('None', 'none', function() {
        }, function() {
            this.setCode('console.log("APPLY BC"); canvas.draw(texture).update();');
        })],
	'Adjust': [
        new $.fn.cropzoom.Filter('Brightness / Contrast', 'brightnessContrast', function() {
            this.addSlider('brightness', 'Brightness', -1, 1, 0, 0.01);
            this.addSlider('contrast', 'Contrast', -1, 1, 0, 0.01);
        }, function() {
            this.setCode('console.log("APPLY BC"); canvas.draw(texture).brightnessContrast(' + this.brightness + ', ' + this.contrast + ').update();');
        }),
        new $.fn.cropzoom.Filter('Hue / Saturation', 'hueSaturation', function() {
            this.addSlider('hue', 'Hue', -1, 1, 0, 0.01);
            this.addSlider('saturation', 'Saturation', -1, 1, 0, 0.01);
        }, function() {
            this.setCode('canvas.draw(texture).hueSaturation(' + this.hue + ', ' + this.saturation + ').update();');
        }),
        new $.fn.cropzoom.Filter('Vibrance', 'vibrance', function() {
            this.addSlider('amount', 'Amount', -1, 1, 0.5, 0.01);
        }, function() {
            this.setCode('canvas.draw(texture).vibrance(' + this.amount + ').update();');
        }),
        new $.fn.cropzoom.Filter('Denoise', 'denoise', function() {
            this.addSlider('exponent', 'Exponent', 0, 50, 20, 1);
        }, function() {
            this.setCode('canvas.draw(texture).denoise(' + this.exponent + ').update();');
        }),
        new $.fn.cropzoom.Filter('Unsharp Mask', 'unsharpMask', function() {
            this.addSlider('radius', 'Radius', 0, 200, 20, 1);
            this.addSlider('strength', 'Strength', 0, 5, 2, 0.01);
        }, function() {
            this.setCode('canvas.draw(texture).unsharpMask(' + this.radius + ', ' + this.strength + ').update();');
        }),
        new $.fn.cropzoom.Filter('Noise', 'noise', function() {
            this.addSlider('amount', 'Amount', 0, 1, 0.5, 0.01);
        }, function() {
            this.setCode('canvas.draw(texture).noise(' + this.amount + ').update();');
        }),
        new $.fn.cropzoom.Filter('Sepia', 'sepia', function() {
            this.addSlider('amount', 'Amount', 0, 1, 1, 0.01);
        }, function() {
            this.setCode('canvas.draw(texture).sepia(' + this.amount + ').update();');
        }),
        new $.fn.cropzoom.Filter('Vignette', 'vignette', function() {
            this.addSlider('size', 'Size', 0, 1, 0.5, 0.01);
            this.addSlider('amount', 'Amount', 0, 1, 0.5, 0.01);
        }, function() {
            this.setCode('canvas.draw(texture).vignette(' + this.size + ', ' + this.amount + ').update();');
        })
    ],
    'Blur': [
        new $.fn.cropzoom.Filter('Zoom Blur', 'zoomBlur', function() {
            this.addNub('center', 0.5, 0.5);
            this.addSlider('strength', 'Strength', 0, 1, 0.3, 0.01);
        }, function() {
            this.setCode('canvas.draw(texture).zoomBlur(' + this.center.x + ', ' + this.center.y + ', ' + this.strength + ').update();');
        }),
        new $.fn.cropzoom.Filter('Triangle Blur', 'triangleBlur', function() {
            this.addSlider('radius', 'Radius', 0, 200, 50, 1);
        }, function() {
            this.setCode('canvas.draw(texture).triangleBlur(' + this.radius + ').update();');
        }),
        new $.fn.cropzoom.Filter('Tilt Shift', 'tiltShift', function() {
            this.addNub('start', 0.15, 0.75);
            this.addNub('end', 0.75, 0.6);
            this.addSlider('blurRadius', 'Blur Radius', 0, 50, 15, 1);
            this.addSlider('gradientRadius', 'Gradient Radius', 0, 400, 200, 1);
        }, function() {
            this.setCode('canvas.draw(texture).tiltShift(' + this.start.x + ', ' + this.start.y + ', ' + this.end.x + ', ' + this.end.y + ', ' + this.blurRadius + ', ' + this.gradientRadius + ').update();');
        }),
        new $.fn.cropzoom.Filter('Lens Blur', 'lensBlur', function() {
            this.addSlider('radius', 'Radius', 0, 50, 10, 1);
            this.addSlider('brightness', 'Brightness', -1, 1, 0.75, 0.01);
            this.addSlider('angle', 'Angle', -Math.PI, Math.PI, 0, 0.01);
        }, function() {
            this.setCode('canvas.draw(texture).lensBlur(' + this.radius + ', ' + this.brightness + ', ' + this.angle + ').update();');
        }, 'lighthouse.jpg')
    ],
    'Warp': [
        new $.fn.cropzoom.Filter('Swirl', 'swirl', function() {
            this.addNub('center', 0.5, 0.5);
            this.addSlider('angle', 'Angle', -25, 25, 3, 0.1);
            this.addSlider('radius', 'Radius', 0, 600, 200, 1);
        }, function() {
            this.setCode('canvas.draw(texture).swirl(' + this.center.x + ', ' + this.center.y + ', ' + this.radius + ', ' + this.angle + ').update();');
        }),
        new $.fn.cropzoom.Filter('Bulge / Pinch', 'bulgePinch', function() {
            this.addNub('center', 0.5, 0.5);
            this.addSlider('strength', 'Strength', -1, 1, 0.5, 0.01);
            this.addSlider('radius', 'Radius', 0, 600, 200, 1);
        }, function() {
            this.setCode('canvas.draw(texture).bulgePinch(' + this.center.x + ', ' + this.center.y + ', ' + this.radius + ', ' + this.strength + ').update();');
        }),
        new $.fn.cropzoom.Filter('Perspective', 'perspective', function() {
			// TODO THESE NUMBER NEED TO MATCH UP TO CURRENT IMAGE
            var w = 640, h = 425;
			var perspectiveNubs=[175, 156, 496, 55, 161, 279, 504, 330];
            this.addNub('a', perspectiveNubs[0] / w, perspectiveNubs[1] / h);
            this.addNub('b', perspectiveNubs[2] / w, perspectiveNubs[3] / h);
            this.addNub('c', perspectiveNubs[4] / w, perspectiveNubs[5] / h);
            this.addNub('d', perspectiveNubs[6] / w, perspectiveNubs[7] / h);
        }, function() {
            var perspectiveNubs=[175, 156, 496, 55, 161, 279, 504, 330];
            var before = perspectiveNubs;
            var after = [this.a.x, this.a.y, this.b.x, this.b.y, this.c.x, this.c.y, this.d.x, this.d.y];
            this.setCode('canvas.draw(texture).perspective([' + before + '], [' + after + ']).update();');
        })
    ],
    'Fun': [
        new $.fn.cropzoom.Filter('Ink', 'ink', function() {
            this.addSlider('strength', 'Strength', 0, 1, 0.25, 0.01);
        }, function() {
            this.setCode('canvas.draw(texture).ink(' + this.strength + ').update();');
        }),
        new $.fn.cropzoom.Filter('Edge Work', 'edgeWork', function() {
            this.addSlider('radius', 'Radius', 0, 200, 10, 1);
        }, function() {
            this.setCode('canvas.draw(texture).edgeWork(' + this.radius + ').update();');
        }),
        new $.fn.cropzoom.Filter('Hexagonal Pixelate', 'hexagonalPixelate', function() {
            this.addNub('center', 0.5, 0.5);
            this.addSlider('scale', 'Scale', 10, 100, 20, 1);
        }, function() {
            this.setCode('canvas.draw(texture).hexagonalPixelate(' + this.center.x + ', ' + this.center.y + ', ' + this.scale + ').update();');
        }),
        new $.fn.cropzoom.Filter('Dot Screen', 'dotScreen', function() {
            this.addNub('center', 0.5, 0.5);
            this.addSlider('angle', 'Angle', 0, Math.PI / 2, 1.1, 0.01);
            this.addSlider('size', 'Size', 3, 20, 3, 0.01);
        }, function() {
            this.setCode('canvas.draw(texture).dotScreen(' + this.center.x + ', ' + this.center.y + ', ' + this.angle + ', ' + this.size + ').update();');
        }),
        new $.fn.cropzoom.Filter('Color Halftone', 'colorHalftone', function() {
            this.addNub('center', 0.5, 0.5);
            this.addSlider('angle', 'Angle', 0, Math.PI / 2, 0.25, 0.01);
            this.addSlider('size', 'Size', 3, 20, 4, 0.01);
        }, function() {
            this.setCode('canvas.draw(texture).colorHalftone(' + this.center.x + ', ' + this.center.y + ', ' + this.angle + ', ' + this.size + ').update();');
        })
    ]
};
 $.fn.cropzoom.defaults = {
	width: 500,
	height: 375,
	bgColor: '#000',
	overlayColor: '#000',
	selector: {
		x: 0,
		y: 0,
		w: 229,
		h: 100,
		aspectRatio: false,
		centered: false,
		borderColor: 'yellow',
		borderColorHover: 'red',
		bgInfoLayer: '#FFF',
		infoFontSize: 10,
		infoFontColor: 'blue',
		showPositionsOnDrag: true,
		showDimetionsOnDrag: true,
		maxHeight: null,
		maxWidth: null,
		startWithOverlay: false,
		hideOverlayOnDragAndResize: true,
		onSelectorDrag: null,
		onSelectorDragStop: null,
		onSelectorResize: null,
		onSelectorResizeStop: null
	},
	image: {
		source: '',
		rotation: 0,
		width: 0,
		height: 0,
		minZoom: 10,
		maxZoom: 150,
		startZoom: 0,
		x: 0,
		y: 0,
		useStartZoomAsMinZoom: false,
		snapToContainer: false,
		onZoom: null,
		onRotate: null,
		onImageDrag: null
	},
	enableRotation: true,
	enableZoom: true,
	enableFilters:true,
	zoomSteps: 1,
	rotationSteps: 10,
	expose: {
		slidersOrientation: 'horizontal',
		zoomElement: '',
		rotationElement: '',
		elementMovement: '',
		movementSteps: 5
	}
};