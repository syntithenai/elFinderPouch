
////////////////////////////////////////////////////////////////////////////////
// Filter definitions
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
// Filter object
////////////////////////////////////////////////////////////////////////////////
$.fn.imageeditor.webglSupport=function () { 
	try{
		var canvas = document.createElement( 'canvas' ); 
		return !! window.WebGLRenderingContext && ( 
			canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) );
	} catch( e ) { return false; } 
};

$.fn.imageeditor.Filter=function(name, func, init, update) {
	this.name = name;
	this.func = func;
	this.update = update;
	this.sliders = [];
	this.nubs = [];
	init.call(this);
}
$.fn.imageeditor.Filter.prototype.addNub = function(name, x, y) {
	this.nubs.push({ name: name, x: x, y: y });
};
$.fn.imageeditor.Filter.prototype.addSlider = function(name, label, min, max, value, step) {
	this.sliders.push({ name: name, label: label, min: min, max: max, value: value, step: step });
};
$.fn.imageeditor.Filter.prototype.setCode = function(code) {
	eval(code);
};

$.fn.imageeditor.Filter.prototype.use = function(image,target) {
	console.log('now user filter',this,image,target)
				
	//var wrapper=$('<div class="imagewrapper" />');
	//wrapper.insertBefore(image);
	//wrapper.append(image);
	//var placeholder=$('<div class="placeholder" ></div>');
	//wrapper.append(placeholder);
	try {
		canvas = fx.canvas();
	} catch (e) {
		console.log(e);
		return;
	}
	texture = canvas.texture(image.get(0));
	// ??? $('#container').css({ width: texture._.width, height: texture._.height });
	canvas.draw(texture).update();
	$(image).attr('src',canvas.toDataURL($.fn.imageeditor.defaults.outputImageMime));
	
	// NOW FILTER CONTROLS
	var controlBox=$('.imageeditor-controls',target);
	controlBox.find('.filterlabel').remove();
	// Add a row for each slider
	for (var i = 0; i < this.sliders.length; i++) {
		var slider = this.sliders[i];
		var to;
		$('<label class="filterlabel" >'+slider.label.replace(/ /g, '&nbsp;') + '<div class="filterslider" id="slider' + i + '"></div></label>').appendTo(controlBox);
		var onchange = (function(this_, slider,to) { 
			return function(event, ui) {
				 $('.loadingicon',target).show();
				clearTimeout(to); 
				to=setTimeout(function() {
					this_[slider.name] = ui.value;
					this_.update();
					var stack=target.data('undoStack');
					console.log('STAC',stack);
					if (!stack) stack=[];
					stack.push($(image).attr('src'));
					target.data('undoStack',stack);
					
					$(image).attr('src',canvas.toDataURL($.fn.imageeditor.defaults.outputImageMime));
					$('.loadingicon',target).hide();
				},500);
			}; 	
		})(this, slider,to);
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
		$(target).append('<div class="nubs" />');
	}
	// Add a div for each nub
	var nubs=$('.nubs',target);
	nubs.html('').css({position: 'absolute', left: 0, top: 0, width: image.width(), height: image.height()});
	for (var i = 0; i < this.nubs.length; i++) {
		var nub = this.nubs[i];
		var x = nub.x * canvas.width;
		var y = nub.y * canvas.height;
		var to;
		$('<div class="nub nub' + i + '"></div>').css({position: 'absolute',width: '6px',height: '6px',margin: '-5px',background: '#3F9FFF',border: '2px solid white',borderRadius: '5px',boxShadow: '0 2px 2px rgba(0, 0, 0, 0.5)',cursor: 'move'}).appendTo('.nubs',target);
		var ondrag = (function(this_, nub,to) { 
			return function(event, ui) {
				$('.loadingicon',target).show();
				clearTimeout(to); 
				to=setTimeout(function() {
					var offset = $(event.target.parentNode).offset();
					this_[nub.name] = { x: ui.offset.left - offset.left, y: ui.offset.top - offset.top };
					this_.update();
					$(image).attr('src',canvas.toDataURL($.fn.imageeditor.defaults.outputImageMime));
					$('.loadingicon',target).hide();
				},500);
			}; 	
		})(this,nub,to);
		
		
		$('.nub' + i,target).draggable({
			drag: ondrag,
			containment: target,
			scroll: false
		}).css({ left: x, top: y });
		this[nub.name] = { x: x, y: y };
	}
	
	//console.log('create d nubs');
//console.log('NOW UPDATE');
	this.update();
	$(image).attr('src',canvas.toDataURL($.fn.imageeditor.defaults.outputImageMime));
	//setTimeout(function() {$('#slider1').change(); },100);
};
////////////////////////////////////////////////////////////////////////////////
// END Filter object
////////////////////////////////////////////////////////////////////////////////

$.fn.imageeditor.imageeditorFilters = {
    'None': [new $.fn.imageeditor.Filter('None', 'none', function() {
        }, function() {
            this.setCode('console.log("APPLY BC",canvas,texture); canvas.draw(texture).update(); console.log("APPLY BC done");');
        })],
	'Adjust': [
        new $.fn.imageeditor.Filter('Brightness / Contrast', 'brightnessContrast', function() {
            this.addSlider('brightness', 'Brightness', -1, 1, 0, 0.01);
            this.addSlider('contrast', 'Contrast', -1, 1, 0, 0.01);
        }, function() {
            this.setCode('console.log("APPLY BC",canvas,texture); canvas.draw(texture).brightnessContrast(' + this.brightness + ', ' + this.contrast + ').update();console.log("APPLY BC done");');
        }),
        new $.fn.imageeditor.Filter('Hue / Saturation', 'hueSaturation', function() {
            this.addSlider('hue', 'Hue', -1, 1, 0, 0.01);
            this.addSlider('saturation', 'Saturation', -1, 1, 0, 0.01);
        }, function() {
            this.setCode('canvas.draw(texture).hueSaturation(' + this.hue + ', ' + this.saturation + ').update();');
        }),
        new $.fn.imageeditor.Filter('Vibrance', 'vibrance', function() {
            this.addSlider('amount', 'Amount', -1, 1, 0, 0.01);
        }, function() {
            this.setCode('canvas.draw(texture).vibrance(' + this.amount + ').update();');
        }),
        new $.fn.imageeditor.Filter('Denoise', 'denoise', function() {
            this.addSlider('exponent', 'Exponent', 0, 50, 20, 1);
        }, function() {
            this.setCode('canvas.draw(texture).denoise(' + this.exponent + ').update();');
        }),
        new $.fn.imageeditor.Filter('Unsharp Mask', 'unsharpMask', function() {
            this.addSlider('radius', 'Radius', 0, 200, 20, 1);
            this.addSlider('strength', 'Strength', 0, 5, 2, 0.01);
        }, function() {
            this.setCode('canvas.draw(texture).unsharpMask(' + this.radius + ', ' + this.strength + ').update();');
        }),
        new $.fn.imageeditor.Filter('Noise', 'noise', function() {
            this.addSlider('amount', 'Amount', 0, 1, 0.5, 0.01);
        }, function() {
            this.setCode('canvas.draw(texture).noise(' + this.amount + ').update();');
        }),
        new $.fn.imageeditor.Filter('Sepia', 'sepia', function() {
            this.addSlider('amount', 'Amount', 0, 1, 1, 0.01);
        }, function() {
            this.setCode('canvas.draw(texture).sepia(' + this.amount + ').update();');
        }),
        new $.fn.imageeditor.Filter('Vignette', 'vignette', function() {
            this.addSlider('size', 'Size', 0, 1, 0.5, 0.01);
            this.addSlider('amount', 'Amount', 0, 1, 0.5, 0.01);
        }, function() {
            this.setCode('canvas.draw(texture).vignette(' + this.size + ', ' + this.amount + ').update();');
        })
    ],
    'Blur': [
        new $.fn.imageeditor.Filter('Zoom Blur', 'zoomBlur', function() {
            this.addNub('center', 0.5, 0.5);
            this.addSlider('strength', 'Strength', 0, 1, 0.3, 0.01);
        }, function() {
            this.setCode('canvas.draw(texture).zoomBlur(' + this.center.x + ', ' + this.center.y + ', ' + this.strength + ').update();');
        }),
        new $.fn.imageeditor.Filter('Triangle Blur', 'triangleBlur', function() {
            this.addSlider('radius', 'Radius', 0, 200, 50, 1);
        }, function() {
            this.setCode('canvas.draw(texture).triangleBlur(' + this.radius + ').update();');
        }),
        new $.fn.imageeditor.Filter('Tilt Shift', 'tiltShift', function() {
            this.addNub('start', 0.15, 0.75);
            this.addNub('end', 0.75, 0.6);
            this.addSlider('blurRadius', 'Blur Radius', 0, 50, 15, 1);
            this.addSlider('gradientRadius', 'Gradient Radius', 0, 400, 200, 1);
        }, function() {
            this.setCode('canvas.draw(texture).tiltShift(' + this.start.x + ', ' + this.start.y + ', ' + this.end.x + ', ' + this.end.y + ', ' + this.blurRadius + ', ' + this.gradientRadius + ').update();');
        }),
        new $.fn.imageeditor.Filter('Lens Blur', 'lensBlur', function() {
            this.addSlider('radius', 'Radius', 0, 50, 10, 1);
            this.addSlider('brightness', 'Brightness', -1, 1, 0.75, 0.01);
            this.addSlider('angle', 'Angle', -Math.PI, Math.PI, 0, 0.01);
        }, function() {
            this.setCode('canvas.draw(texture).lensBlur(' + this.radius + ', ' + this.brightness + ', ' + this.angle + ').update();');
        }, 'lighthouse.jpg')
    ],
    'Warp': [
        new $.fn.imageeditor.Filter('Swirl', 'swirl', function() {
            this.addNub('center', 0.5, 0.5);
            this.addSlider('angle', 'Angle', -25, 25, 3, 0.1);
            this.addSlider('radius', 'Radius', 0, 600, 200, 1);
        }, function() {
            this.setCode('canvas.draw(texture).swirl(' + this.center.x + ', ' + this.center.y + ', ' + this.radius + ', ' + this.angle + ').update();');
        }),
        new $.fn.imageeditor.Filter('Bulge / Pinch', 'bulgePinch', function() {
            this.addNub('center', 0.5, 0.5);
            this.addSlider('strength', 'Strength', -1, 1, 0.5, 0.01);
            this.addSlider('radius', 'Radius', 0, 600, 200, 1);
        }, function() {
            this.setCode('canvas.draw(texture).bulgePinch(' + this.center.x + ', ' + this.center.y + ', ' + this.radius + ', ' + this.strength + ').update();');
        }),
        new $.fn.imageeditor.Filter('Perspective', 'perspective', function() {
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
        new $.fn.imageeditor.Filter('Ink', 'ink', function() {
            this.addSlider('strength', 'Strength', 0, 1, 0.25, 0.01);
        }, function() {
            this.setCode('canvas.draw(texture).ink(' + this.strength + ').update();');
        }),
        new $.fn.imageeditor.Filter('Edge Work', 'edgeWork', function() {
            this.addSlider('radius', 'Radius', 0, 200, 10, 1);
        }, function() {
            this.setCode('canvas.draw(texture).edgeWork(' + this.radius + ').update();');
        }),
        new $.fn.imageeditor.Filter('Hexagonal Pixelate', 'hexagonalPixelate', function() {
            this.addNub('center', 0.5, 0.5);
            this.addSlider('scale', 'Scale', 10, 100, 20, 1);
        }, function() {
            this.setCode('canvas.draw(texture).hexagonalPixelate(' + this.center.x + ', ' + this.center.y + ', ' + this.scale + ').update();');
        }),
        new $.fn.imageeditor.Filter('Dot Screen', 'dotScreen', function() {
            this.addNub('center', 0.5, 0.5);
            this.addSlider('angle', 'Angle', 0, Math.PI / 2, 1.1, 0.01);
            this.addSlider('size', 'Size', 3, 20, 3, 0.01);
        }, function() {
            this.setCode('canvas.draw(texture).dotScreen(' + this.center.x + ', ' + this.center.y + ', ' + this.angle + ', ' + this.size + ').update();');
        }),
        new $.fn.imageeditor.Filter('Color Halftone', 'colorHalftone', function() {
            this.addNub('center', 0.5, 0.5);
            this.addSlider('angle', 'Angle', 0, Math.PI / 2, 0.25, 0.01);
            this.addSlider('size', 'Size', 3, 20, 4, 0.01);
        }, function() {
            this.setCode('canvas.draw(texture).colorHalftone(' + this.center.x + ', ' + this.center.y + ', ' + this.angle + ', ' + this.size + ').update();');
        })
    ]
};
 $.fn.imageeditor.defaults = {
	width: 500,
	height: 375,
	bgColor: '',
	overlayColor: '#000',
	outputImageMime: 'image/png',  // image/jpeg
	selector: {
		x: 0,
		y: 0,
		w: 25,
		h: 25,
		aspectRatio: false,
		centered: false,
		borderColor: 'yellow',
		borderColorHover: 'red',
		bgInfoLayer: '#FFF',
		infoFontSize: 13,
		infoFontColor: 'blue',
		showPositionsOnDrag: true,
		showDimensionsOnDrag: true,
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
		maxZoom: 180,
		startZoom: 100,
		x: 0,
		y: 0,
		useStartZoomAsMinZoom: false,
		snapToContainer: false,
		dontScaleUp:true,
		onZoom: null,
		onRotate: null,
		onImageDrag: null
	},
	enableRotation: true,
	enableZoom: true,
	enableFilters:true,
	zoomSteps: 2,
	rotationSteps: 10,
	expose: {
		slidersOrientation: 'horizontal',
		zoomElement: '',
		rotationElement: '',
		elementMovement: '',
		movementSteps: 5
	}
};




$.fn.imageeditor.icons={};
$.fn.imageeditor.icons.rotate='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAHsSURBVDjLtZPpTlpRFIV5Dt7AOESr1kYNThGnSomIihPoNVi5Qp3RgBgvEERpRW1BRBAcMEDUtIkdjKk4otK0Jdr2vgxZ3kA0MYoaG3+cX2evb529zt4sAKz/OawnASgCBNm5LaE7vjVDutkA4mMdLV4TkvcCuvba2Iqd1pDhWA33mQU+2oXVv07YfpoxuNWFuqVXoeqFCnZcgJwRm04p+Gk3Fs9t8PyZx/K5Hfbf03CGLRj62g2+rSR0K0D+vZXUB1Xw/ou5usJWjAaU0Gz3w/rjHey/ZjDLvKTD34KSyXzyBkC2JaYd4feMqyNa3OQTREQePlXjrqSq5ssj5hMjTMd66ALDKDLm0jcA0s+NID6JIFmvQaNXANEKX3l5x7NyqTcb7Zg8GYtCOLoXuPcbha6XV0VlU4WUzE9gPKjF2CGFbE3G3QAmafDnShETF3iKTZyIblcNza4Syi/deD6USscFCJwV6Fwn8NonQak5Hy1L9TAcjkJ/oAG1p0a1hYdnfcnkrQCBoxyyNYLp1YCJoB7GIwqGgxGod/oZsQoNDiHSepNCceeAN8uF1CvGxJE25rofc+3blKPqQ2VUnKxIYN85yty3eWh216LeKUTOSCayVGlIH0g5S+1JJB+8Cxxt1rWkH7WNTNIPAlwA9Gm7OcXUHxUAAAAASUVORK5CYII=';
$.fn.imageeditor.icons.zoom='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAI6SURBVDjLpZJbaJJxGMaHgdcFXURdBLtZrGitiFh0uhjRVRTVWI1as7mQakhjyyEkRAcaHSCrj0xrWGuuoVsr25qzfeYObh6yJJdzavoZs3Sy8PhJ8vR9EoHkotXFA/+b3+//vC9vEYCi/8mvh8H7nTM8kyF0LpoacCazLxzxbM/bb1S3OUo8GQtz/iggGfi1O0NaAzS8kQwCURqBORrTX9LQf5jHQ3KWlA1RnAUFeneGsATSoKIZOGdTsAWSMPuTsFNJeL7SEOoF4GtrUKuuShUUvJpKUd4wnYMtDDj5KQGTN4FRTyInOvH8MDonL6BKuRcFBey8fqYyC0/4Ehhn4JGZOBp1AtT1VkOkrYfMKIKgsxq7b+zErssV0TyBxjaf9UVomBh4jPnVyMCG6ThbGfKRVtwebsK1wdO4+JIPce8xbBGXI0+gMkWoqZ/137jjIBlY/zEGnqoO+2R7wGvfj/N9x3FAWonNojKUCUtTeQKlMUT02+fgCqVzs7OwzhnLyd4HU2xlCLsOYlPz+sI7uK8Pcu4O+EnNRAhWfwKOzym8Y2LyxCAf9GGHZDvKm9Zha2NptudcRUnBQ7rZ5+G0aVzEpS4nJelwZMXt9myL3Bpskyq9FmUzQuZu2B63QCXcEH50ak3Jb4KF0i+p5D5r3aYeJeoRNCgwfq8BCv7q8F8L2Dw9u5HbcWateuj6IXi0V0HUrsCiBGweNBRzZbxVasXJYkhrll1ZtIDNnaPLl9w6snRlwSX+a34AgPPwSZzC+6wAAAAASUVORK5CYII=';
$.fn.imageeditor.icons.undo='data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%06%00%00%00%1F%F3%FFa%00%00%00%04gAMA%00%00%AF%C87%05%8A%E9%00%00%00%19tEXtSoftware%00Adobe%20ImageReadyq%C9e%3C%00%00%02%2CIDAT8%CB%A5%93%5DHSa%18%C7%CF%28%12%AF%A2b%84%08~%5C%D8%07%156%98%08-Cf%89%DE4%29%A2%AC%B4l%E4%FCHv%A1%08%C3F%B6%11%A5%23w%C6J%17%B9l%E9%A9m%A2%09%D3%A8%91%86%13k%DB%B1%96"%D50%8BeX%A4ua%93m%EA%E1%DF%D9%B9%18%19KNt%F1%DC%BC%BC%BF%DF%FF%7D%9F%E7%7D%09%00%C4%FF%14%EF%8D%9F%9D%99%89Sv%D97%AF%B1%88q%93%871a%CE%FC%F8%A1%2B%2B%89%B7%C0o-%C2%3B%AA%0A%A1%80%07%E1%19%1A%DE%9BR%B84%A2%5E%BE%E9%08N%3E%4080%8A%C8%CC%18W%A1%A9AxH%19%C3%0B%0E%7F%1FA%F8%93%15%D3%BD%17%10%F4Q%5CE%05%B4%F1h%88%17%BC%12t%60%D1_%81%9F%3E%25%5E%9B%8B1%DD%5D%0B%8FA%865%9B%B8%0A~%7F%16%C17%07%B1%F4%A3%05%B3%FD%25%F0%EB%25Xs%0A%F1%E0z%DB%01%9C%EF%10%AD%82%E3%0A%9E%91%DB%E3%26%D7X%C4%B8%EC8%89%E3%A6%1D%7F%17%3Ci%DA%86%85%D9%21%0EVR9Pve%A3%F2%9E%18r%F3%5E%5C%7Cx%0Cv%DA%80%BAn%19%0E%E9%B7.%E7%E86%09b%02%93%3C--%0A%07%E8%3E%B8m%0A.%B9%BA3%1B%7D%AFZ%D1%F3%F2%06%07Zi%12%E4%D3%3AX%5E4%A3%82%CAG%D6%D5%84%E5%3DZ%81%80%13%18kR%B0%10pc%E9%CB8%06%D4b%8C%DC%12A%CE%DE7%0A%B78%95hz%5C%8D%2B%8F%CA%D1%E8%28%83f%40%01%93K%8B%D3w%F7%23%E3%12%11%89%09"%EC%EB%9A%B7%97%E1%AB%29%17.%85%10%A7n%EF%84%CDK%82r_%87%E5y3%EE%8C%5Ec%25UhsiPN%15%20%5DM%BCMV%11%89%9C%A0X%BA%19%93%ED%25X%F4%DD%C7%BC%CF%86a%5D%01%8E%B4%A5%A3%D0%90%CC%E4%E9%85%8CD%B7%91%29%ED%D8%87%D6%E1F%9C%EB%CCG%AA%9A%18OR%11%09%B1%1E%9C%C8%DD%82R%A9%10%ED%95%19%E8%AF%DF%0D%A7N%D2%F3%E7tvi%05sg%2CyHm%20%C6Xx%C3%3F%FFF%F6%C8s%29%0D%EB%20T%11%EB%7F_%FF%05%A5_%C9%CE%A5%3D%EC%B8%00%00%00%00IEND%AEB%60%82';
$.fn.imageeditor.icons.restore='data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%06%00%00%00%1F%F3%FFa%00%00%00%04gAMA%00%00%AF%C87%05%8A%E9%00%00%00%19tEXtSoftware%00Adobe%20ImageReadyq%C9e%3C%00%00%01%EBIDAT8%CB%8D%93%B1k%13a%18%87%13%B5%19%14%27%FF%00%07%D1A%1C%14%FCSt%E8%2C%0A.%C6E%10%2CB%15%9D%1C%5C%2A%28%AD%84%88%C1%06%C4%A0D%B8%0C%1ASc%BD%23%A1%E1rx%5C%B8p%21%1C%29w%E6%B8%2F%5CL%8CC%1F%87%2F%9AK%A5%B6%C3o%F8%3Ex%1E~%BC%BCo%02H%ECJ%128%0C%A4hwNN%DF%89%BD2%FFQ%8F%924%06%170%BDO8%EE%0E%9D.X-0%AD1%86%F9%15%C3%BC%8Fn%9CG%B3%17%D0%EC%85y%816%3AD%23%B8D%AB%05a%08%E3%09%8C%C60%1C%81%18%80%1F%80n%EC%60ZP7%05%9B%963%2F%D8%1C%9D%A1%DD%01E%01U%05%CF%93%82h%08"%92%92P%C8%F8%01%BC.%FD%98%17%94%1B%25%EA%5B%12%08%85%04%86%23%18%C4%E0%40%40%10B%3F%80%FC%1Bf%02M%A4%D0%9A%13%2A%1BP%AD%82mC%14%C9%84%7F%E0%10%FAS%D8%EFC.%1F%13lt.%D34de%21%C0v%24%2Cv%C1~%00%5E%1F%3C%1F%5E%E4b%82%8A%FE%99%C2%5B%A8T%E4%D4%7B%DB%12%8EW%F6%FB%12v%B7%C1%B2a5%13%13%E8%B6%27%81%10%9C%0E%D4j%12%88W%F6%7C%29%2F%16%E1%E1%BA%CERF%9D%09%BE8%1F%B0L9y1%E0%AF%2C%5E%B9i%40%B6%00W%F2i%D2%F9%B3%DC%29%9C%9E%09%8A%D6%29%B2%B5%BB%BC%AC%AA%14%D4%EF%28%B5%21%EE%B4r%D7%85w%1Fa%293%21%BD%B6%C8%F5jr%AFML%02Gh%04%C7%29Y%CBX%DF%C0%EDA%B9%0C%B7%D7%9Fq%B5xt%FFU%86%04%EF%BB%17%A9j%BFp%7B%D0%D0%E1%C1%AB-%D2%A5s%07%BB%05%C59%86b%3D%C74%E5%A4%1F%ADF%DC%CA%2F%1E%FC%98%14%FD%04%8A%E6%60%B7%E1%F1%D3%9F%DC%C8.%FF%0F%FEW%90%B3R%AC%A87%B9%F7%04%AE%AD%AD%EC%07%03%89%DF%3C%95L%82V%11%D5%7F%00%00%00%00IEND%AEB%60%82';
$.fn.imageeditor.icons.download='data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%06%00%00%00%1F%F3%FFa%00%00%00%04gAMA%00%00%AF%C87%05%8A%E9%00%00%00%19tEXtSoftware%00Adobe%20ImageReadyq%C9e%3C%00%00%01uIDAT%18%19%A5%C1%3Dk%14Q%14%80%E1%F7%DC%B9%B3Y%C7%8D%AC%10TH%10%1B%11%2B%21h%04K%D3%06%04%3B%B1%96%B0U~A%BA%94%11%2C%ADD%04%11%7B%BB%80%D8%08Q%24%C1B%B0R%C9%87%60%165%CC%92%D9%9D%99%3B%E7%88%B0%81%DB%CF%F3%88%99%D1%86%A3%25GK%9E%C8%DA%D3%2F6%3B%03E%158%DF%EB%F0%F3h%8C8%E8e%09j%C2%DF%7C%CC%DB%DD%C3%DB%DF_%DE%FF%C8%94%272.%26%DC%5D%BA%C6%BD%C5%1Eo%B6%0FX%7Fx%9D%D8%8BwCT%E5%03%20L9"EY%F3g%14%F8o%EB%D3%2FNM%02%E4%25%0C%8F%2BD%94%98%27%E2%9C%90%18%D4%8D%F2x%B0%88%AAa%40%82%91y%28%CB%92%FC%A4"%E6%89tS%C7%A4%AC%D9x%FD%03%27%10%1AE%1B%C5%003%03%83%2CUb%9EHP%A3l%02%89K%01Ch%10%11L%0D3%25%84%9A%AA%0A%C4%3C%91QQ%93%8Ag%B02K%D0%0Ap%60%60%A2t%7D%87%CDW%7B%FC%CEO%88y"%8D%1A%09%29%CA%98g%3B%AB%CCe%97%11%1C%C3b%9FG%B7%9E%E0%E8R%94%151O%C4%FB%84%2B%97%E0bo%C4%F2%8D%25%FA%9Dypp%3C%99%E7%C2%D9%40%D6%01%2FBL%CC%8CS7%07%5B%EF%AF.%9C%B9%D3%9F%E9%D3%F5%E7%08Z%23%AA%885%A8%14%7C%DD%FB%C6Q%5E%F3%F9%F9%03aJ%CC%8C6%1C-9Z%FA%07%F7%CB%A2V%E0za%B8%00%00%00%00IEND%AEB%60%82';
$.fn.imageeditor.icons.apply='data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%10%00%00%00%10%08%06%00%00%00%1F%F3%FFa%00%00%00%04gAMA%00%00%AF%C87%05%8A%E9%00%00%00%19tEXtSoftware%00Adobe%20ImageReadyq%C9e%3C%00%00%01%FDIDAT8%CB%95%93Ak%13Q%10%C7%13%B59%28%9E%FC%00%1ED%0F%E2A%C1%8Fb%C1%9E%03%E2%A9%15%0F%82%97b%0D%82%A5-%85J%05%15%14%DA%9B%17C%03A%0A%B5mj%8C%1B%126%AC%A1%CB%86%0D%1Bv%97%5Dv%7DK6%A4R%EB%A1%3F%0Fom%8C5%D0%1E%E6%F0%DE%CC%FF73o%E6%A5%80%D4%91%A9q%065z%80n%81%E6-%0F%F9F%D8%F0%85%E6%5D%A2i%5B%C4%3D%D0%CD%9F%A8%CE%CC%E9%00%AA%B8%80%16%BC%C5%F7%21%EE%81f%F6%A9%BA%13%27%07%40%0A%25%BA%CDn%EB%17Q%17B%01%8A%A9%B2%E9%DF8%09%20%0D%9C%A3%B3%7F%91%9A3%83%EB%C8%2Al%1B%CA%D6k6%BC%F3%A3%01jp%85%BA%3F%CD7Oa%D7%F9%8Ef%ED%21z%D0%8D%A5%19%16%94%F5%03%B6%F4%09%3Ex%E9%E3%80%BA%F3%09%CF%818%86%FE%1E%F4%FAR%18%C5%10uAD%60%3B%A0%EA%907%A6%28%E8%D7%C97%AF%0E%00%9A%19%10%F7d%B0%D5%81ZM%F6%2F%12q%28%20%08%25%A4%D1%80b%5D%A3PU%06%80%CD%C6g%F2kP%2A%81%D1%02%D7%93%B00%82%20%11%FB%01x%BE%F4%99mx%B7%CA%00%B0a%8ESo%C8%D2%A3%AE%0C%E8%C6%12%E0%87%E0%05%E0%26b%DB%95%95%2C%BD%FC%0B%B0.2%EC%28%07l%95%A0%5C%86V%2B%E9%5D%24Y%7Dp%12q%C7%01%CB%86%B9%25%86%C7X%AC%AES%AEp4%FFP%C8%FE%3D%1F%9C%24k%C7%96o%D4%B6%E0%F9%C2%3F%80%F7%DE5%2A%0A%14%3FB%A5"E"%92%D9%FF%88%DB%1Dh%B5%A1%A9%C3%E3%F9%1F%C3%80%15%F7%0C%2B%8D%3B%14%0A%60%18R%1C%08%092L%F8%A2%C0%EC%E2%21%B9Y%C8%E6b%EE%E6%AC%E3%AB%FC%CAH3_%BF%C5%DC%DA6oV%0Fy%B1%0C%D3O%E0%E1%A3%7D%EEO%7D%E5%DEd%8E%EC%E4M%C6%9F%8E%91%5D%18%FB%FF_%90%2B%7D%16%C8%F0l%F1rr%1E%F9%99~%03%F1LIy%D1v%24%B7%00%00%00%00IEND%AEB%60%82';
$.fn.imageeditor.icons.loading='data:image/gif,GIF89a%20%00%20%00%F6%00%00%FF%FF%FF%00%00%00%FA%FA%FA%E2%E2%E2%D2%D2%D2%D4%D4%D4%EE%EE%EE%FC%FC%FC%F6%F6%F6%B8%B8%B8lllDDDNNN%88%88%88%D6%D6%D6%F4%F4%F4%C6%C6%C6LLL%04%04%04%1E%1E%1E%E0%E0%E0%EA%EA%EA%9E%9E%9E%A6%A6%A6%F2%F2%F2%8A%8A%8A%1A%1A%1A666%BA%BA%BA%DE%DE%DE%DA%DA%DAzzz%3C%3C%3C%28%28%28%2C%2C%2C%A8%A8%A8vvv%0E%0E%0E"""%AA%AA%AAVVV%EC%EC%EC%86%86%86%20%20%20%0C%0C%0C%AC%AC%AC%1C%1C%1C%C8%C8%C8%16%16%16%0A%0A%0A%26%26%26%84%84%84%C2%C2%C2%3E%3E%3E%12%12%12ttt%92%92%92%90%90%90%18%18%18%8C%8C%8C%B6%B6%B6000%BC%BC%BC%94%94%94BBB%D8%D8%D8%A4%A4%A4%C0%C0%C0%CA%CA%CA%CC%CC%CCZZZ%24%24%24%8E%8E%8E~~~rrr%80%80%80%08%08%08%BE%BE%BE%AE%AE%AE%7C%7C%7C%96%96%96hhhjjj%B4%B4%B4%DC%DC%DC%60%60%60%B2%B2%B2%B0%B0%B0xxx%CE%CE%CE%82%82%82XXX222%C4%C4%C4%E4%E4%E4%F8%F8%F8%F0%F0%F0%E6%E6%E6%2A%2A%2Abbb%5E%5E%5E%E8%E8%E8ppp%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%21%FF%0BNETSCAPE2.0%03%01%00%00%00%21%FE%1ACreated%20with%20ajaxload.info%00%21%F9%04%09%0A%00%00%00%2C%00%00%00%00%20%00%20%00%00%07%FF%80%00%82%83%84%85%86%87%88%89%8A%8B%8C%8D%8D%07%86%08%29%02%8E%86%29%044%05%29%83%02%1C3%04%95%84%1E%2A%0C5%0C%0DA%90%089%40%09%A1%82%15%1F%2B%12%B4%26%1F%15%07%07%0E%3C%15%85%15%1D%0F%89%02%09%20%B4%C6%1B%09%90%00%B9%84%29KFN%08%88%0F%16%21%C6%B5%16%D2%87%04%1B%25%0A%06%88%08%17"%D7%12%21%27%94%87%15%CF%D1%88%07%04%0C%2C%D7%0CD%CA%EA%1E%C1%89%06%23%0B%1A6.%0B%84%60xU%E8%00%06%0F-T%90%D8%E1%03%1C%C1A%08%20d%20%91%81%C3%00%03%E9%1C1%E3%94%20%82%86%12%00_%BCr%60%C1%02%85A%03%14%94%BB%91%AFQ%85%27%13L%ECpH%60A%B9%05%BD%1CQ0BKA%CE%02%0C%CA1%C8%D9%08%03%94%1A%0BF%0C%04%60%A0%C1%04c.pdld%80%08%11%87%CB%1C%28%D8%60b%03%89%93%0F%0BR%E0p"%81%03%8Ca%0F%3Dxa%21%07%2F%7B%89%986%BA%83%80B%C6%04%10%3F6%C5%25b%81%C6Ru%24%60%18%032%24.%87%1A.6dC%D4%01E%0Cc%21F%28C%80A%1BS%12%25hE%A1%82%A8%82%82%CC%B4%40%F8%00%20%A0%08%92%24%27rbP%01%83I%09%29D%0Bv%D4%A0%A3%C7%8C%01%BA%8C%C0%28%D1%C3%02%B8wFj%18%992%B5%D0%83%043%3EX%E8p%40%9C%0CcF%3C%08%3A%E0%A1I%01%CB%88%04T%A8%90%0F%81%90%23%B4JD%27%047%14%01%DD%BC-%FCMK%9A%C6%0C%25%26%D9%17%12%60%80%BB%A3%40%00%21%F9%04%09%0A%00%00%00%2C%00%00%00%00%20%00%20%00%00%07%FF%80%00%82%83%84%83%07%15TT%29%07%85%8D%8E%8E%0F%10I%28%28K%2F%0F%8F%99%8D%024F%1A%12%12%1AF%10%02%9A%A6%00%15K%13%A0%A0%13I%15%A7%85%06%0E%04%15%02AFL%AC%A0FA%B1%82%07%0E%0D%28%0CXMDF%BB%12%25%BD%BF%00%03%24%AB%12%3A%28NI%D2%A0.%AF%82%15%15%8C%8F%02%3C%1B%BB%13%19%3C%280%A06%5BC%A5%A9I%03%99%08B%21%CA%24%15EZ%0C%0C3%04%08%DCQ%A28%C8%24%C0%CA8V%2Br%60B%90"%05%82o%00n%05%29%95%89%82%92O%12%600%80%E0L%DE%8B%27%0C"%28H%80%A1c%23%0C%05%86%10%09B%A0%D6%3F%93%84081%B2%00%85%05%5B0%0B%1D%18%12%A1%04%A8%0D%27%20%C6B%00%C1%02%01%8A%0F~%60%2BA%02%93%B3%0EFB%28%80%05%E0%01%8E%A5M%3Bz%88"%83D%3C%00%07%9A%F4%94%C0bC%0B%A1%A7%10t1J%11%80%01%27U%9Cj%DE%CC%89%16%00%CA%21%04%0C%E4%D4%24%E0%80%00%0C%0F%EA%EEu%CB%01%09%14%7F%A7%1E8%E4%7Be%C1%8A%23Q%B2%08%1E%94%C2%02%89%11%25%1FUP%90N%C2%11%28N%1D%1D%B0%D2%A3D%8D%26%15%A3%B0%9A%80%24s%C4%B6%60G%98%90%C0eJ%26%0C8D0%81%B1%20A%A9%03%05%84%08%29%D0%B6%83%92%08K%BEj%C6%11E%CA%15%BD%00%3CH1%B1"%0A%15B%15j%99%3A%80%81%02N%B0%3Cz%80%EA%C1c%B2%C9%21%20%40%81%18b%BEc%85%1C%21sP%1D%8C%BDH%91%F9%F4%07%07%02%00%21%F9%04%09%0A%00%00%00%2C%00%00%00%00%20%00%20%00%00%07%FF%80%00%82%83%84%85%00%07%86%89%8A%89%07%15E%5DA%0F%8B%93%86%07%0EK%0B5F%23%15%94%9E%00%14O%2B%12%12%25%40-%92%07%0F%18%08%9E%0F%03%05%03%08%02%3E%40L%A4%12%3A%1F%03%18D%168%27%0E%02%8B%18N%0A%5B%0A%3C%15-%5C%B8%A5Q%04%27%5B"%26%1B%0A%2F_%89%B4%0B%25%25%3A%0C%09M%11%CE.O%17%11%25%B8.%0AT%89%06%0D%3A%B8%269A%2AG%A4%2C%11N%19%26%CE%12%0B%1C%10%15J%91%04%06.%0D%19%0CT%B0%60%84%C1%87.%15%96%C4s%B6%A1%C5%B0B%08Np%89%21%81%09%08%27%88%0E%28%C4%00%E0%01%94%7B%B8X%00%F1q%B1P%05%15%0BzD%C81%40Q%17%146%E4%7D%E8%A0%08A%85%26-%86T%10h%08%C3%15%23%3DBl%B8A%A4%95%21%04%18B%12%EDY%C0%89%10%1E%14%A6%0A%C2%40%40%88%90%02-%3D%21%98%A5%AD%C9%96%102%8C%40%F8THU%B6A%06%B5Th%20%A5A%8BS%B6%00%3C%40qb%60P%05%12%E9J%29%B8%CB%96%06%8A%5D%83%10X%E0%D2m%83%85%B0%9F%2AphJ%A8%02%0E%23F%2C%D4%C4%3B%E9%40%0A%0F%0E%3Aq%1EM%DA%13%06%03ZK%0F%3A%40%00%C9%12%1F%92%28%A5%20%E0%255%A1%0EQ4%C0%00%08%B9%D0%83%1C5%94P%98%04a%03%29%13Pb%2BJ%A1%00F%84"%93%82l%81Q%E2%E3%DD%07%14%86%0E%12pE%0A%14%D1%8A%1E8%89%92y3%00%0C%23%A2%24%21%40%D4%27IJ%08%28%04%E9%3B%C8%C1%B8%239%DE%AB%26T%80A%89%238%E8%B7%9F%20%06%5C%A0%1E%7B%03%16%82Av%84%25HZ%20%00%21%F9%04%09%0A%00%00%00%2C%00%00%00%00%20%00%20%00%00%07%FF%80%00%82%83%84%85%07%02%07%85%8A%8B%8C%82%06%04SM%14%89%8D%95%85%0F%17%5B%1B%40K%04%94%96%95%07D%0C%25%12%12b%19%15%A0%8A%08%60%08%82%08-b%A6%12%25Q%0E%02%15E%10A%0F%96%03-%19%17A%02%08N"%B4%B6%05%04%2A%0C%0BQ-%29%8D%15%2A%1B%1A%3DI%1D%07%1Ec0%B5%1B%16%2FXG%A6%25%11S%AF%8BE%0B%B45%09%00%08M%0A%0B%0C%16%1E%3C5%B4%12%1AI%AA%8B%2F5%98%98%DA%60E%D0%81%0A%1D%28%3C%10%D0%A2%87%3E%5B%1E%18UP%60%A2%84%89%28%04%185YP%CA%94%89%19%FE%14%1Dx%A1%C2%C8%92%26%BE%16%0D%D0%D2%23%86%04%18%288%A4%5Bt%D0A%85%99%8A%048%C8a%84%81%02%21AR%E0%5C%B5%08C%90.Wp%2C%C9pe%C0%270%1D%06%0C%B5t%00%82%82%1E.L%00A%E2o%00%8E-FZ%18%20%0A%A0%02%09%17%FA6%5C%00%20%60%0A%88%97%0C%B52%12%25%90O%1F%0C%05%F0%2C%84%18%E8%83%2C%01%87%0F%C9%008%40%03%C5%84%23%0A%82%90%0D%12%81%85%3E%1DI%04%A5%E0%D1%00%07%91%A9%8D%1E%E4hi%0A%06%83%21%83%10%A40%F0%89%A8%87%1D%0Bzl%88re%2CYF%07%BB8%99B%00%C3kP%07J%2B%AAP%20%8CnF%88%40uX%B2%40%81%27KA%90%24%C0%3C%E8%C0%15.%A7%2C%A4l%94%60%81%0A%D7%B0%7DD%D0%01%E4%CAL%01%29l%13%02FD%80%A5%14-H%08%09%29%E0E%03%0B%21%05%05%07%85%A0%C2%83O%06T%1C%89%D0%E5%F7%EDA%0FXP%03F%FFUB%01%07%2F%88W%20p%FE-X%60%20%00%21%F9%04%09%0A%00%00%00%2C%00%00%00%00%20%00%20%00%00%07%FF%80%00%82%83%84%85%86%87%88%89%00%18ADA%0F%8A%91%85%0F%3CQ%11%0A%3C%18%92%92%07%05F0%120QE%07%83%A5%9B%08%0F%A7%07%3E%1B%12%AF%40%3C%02%00%08%1DEA%9A%89%07%0E%17%16D%90%07%2F%11%25%12%25%0C%5D%02%06%09%0A%0CQ%23%15%89%1DX%3D2Q%10%A5%15%3F%40b%0B%16%15%08C%5B%3A%A1%0BV%90%87C5%AF%3D%16%E7%15%1C%16M%D0%18%3F2%AF%12%2B3%D0%86%07D%C3%12%1BN%9C%13t%0A%80%81%1CG%EE%B9x2%00Q%0A%0B%28"4%E8P%B0%10%02%1E%0BJ0%29%01BH.~%15%88%D0%18P%D1P%05%0B%0C6D%D8AQ%D1%81%92%87%04Txa%85%07%81%01%18%60n%02%99%60%C7%12%0B%04%10%14z%B9s%10%82%16%28Lh%10%A1%80%C0%A9%07D%2CX%D9%B7%B3%83%11b%AFLdH%01%60%97%021%20.%0C%94%04%A1%C7%BDbF%3At%85%B0%40%82%0B%15%5C%C8w%12qu%AFD%14%2A%82%3C%24%A9%C1%60%8A%D0%9D%03%A2%8C%7B%25%06I.%01%1D%7C%BC0P%94V%82%2A%5CB%80HR%A0%E0%01%01%3A%11%1D0%10%04B%0B%28%3FZ%04%99%D5%98%10%02%029%A2%A0P%60%C1A%CE%D2%85%82%60%11%F1%0A%C6%02%21q%0F%1D%E8%F0%C2Kf%04%1660%B9%27%8A%00iC%1D%3E%2C%40B%B5%90%01-%83%EF%81%B0r%BC%10%81-%13%14%A8%3D%94bI%F4W5%A6T%27T%E1%C2%8DL%84%04%BC%06%CE%E5%AC%0E%23%A4%12%3D%F8%96%FE%05PAA%9E%F4%B0QBC%04%DC%A5%3D%00%91%13%A5%08P%00%0EQ%18%A1%C0%09%CD%ED%24%80%7D%0E%98R%81%03%05P%F0Qi%02%A8%02%DB%86%1Cv%18%08%00%21%F9%04%09%0A%00%00%00%2C%00%00%00%00%20%00%20%00%00%07%FF%80%00%82%83%84%85%86%87%88%89%82%07%0F_%8A%8F%87%18%2FBS%14%02%90%98%07%5DF%3D%409%03%98%90%0FP%26%12%25%5BD%07%83%07%AA%90%07%97%83%0F%162%A6F%04%AA%07%14%2FD%15%AD%88%06%5DWA%B0%02Ef%20%0C%16%15%00%07%04J%0B%113A%BE%85%02%09%5B%20I%1E%83%08%0ES%10%BD%00%29H%B4%12%1BB%18%88%18%0D%13%12%0B%3E%D4%85%14%0A%25%12%12%2BZ%CB%87%08-%11%3D%0A%B7%12UhP%8A%05%17e%02%AFX%E8%F2%40%11%02%08R6%D4%C0B%00%D6%A1%03%080XL%F4%80%C0%15%1E%0E%1A%86%CA%C4%EA%C1%83%8D%23%11%21%08r%E5%C4%0B%03%84%0E%60%A8%80%20%25%00%01%10%A2p%E9%91%0C%26%B3%0ABf4%11%19j%C0%93v%A6P%40%10%84%60%08%0A%19%1F%40%8D%24%80%A2%9E%BD%1E%27%06%11P%10%01%8A%BEPA%A2Xe%02%82%07%B7%02%5D%A4%8EL%21%04%88%0E%18"%C9%3Et%28%14%CF%D5%03%0F%16%A2D%D9Q%A4%A6%CDA%02%06%F8%18%D1%A2%0B%01%02%15P%A6%3C%10%24%C3%82%1E%20n0%7CT%B7P%0A%0B%1B%ECI%08%91d%AE%40%1E%04%FC%02%00S%60%D7%80%2F%05%A2%C0%D0%2C%21%C2%90%CA7%870%C8P%86%19%85%1F%0C%B8%80P%90%A0IU%D6%0B%9A%C0f%8Cd%0A%86%03%150k%9E%60%E4%C2%8D%15%9AaD%21%A0%E8%40%8A%868%7Fk%96%91%A1E%95%23%3A%26D%B8%90"%94%00%1E5XK%80%81%C5%C1%90%1D%0A%92L%F9%0AI%40%93%08LX%EB%98A%B3B%87%0A%E9%A4%14%84%12.h%16%03%08-%10%F5%17%00%0F4a%84%09%25%C0%00%82%0A%9E-%18%CB%0B%19D%A1%C4%05%1D%28VH%20%00%21%F9%04%09%0A%00%00%00%2C%00%00%00%00%20%00%20%00%00%07%FF%80%00%82%83%84%85%86%87%88%89%8A%8B%8C%02%15%1D%29%07%8C%93%82%05%19%0A%16%15%94%8C%08%16%1B%1A%28%10%92%9B%89%9D"%25%0B4%A3%00%18%14%14%0F%8C%18a%B0%83%04IFP%9A%82%15%16R%0AN%29%8A%06WZ%3C%18%83%08%14%05%15%02%82%07%5D%0C0.FD%CD%88%04FG%0AA%8A%0F%23%21%12%125%3C%08%89%03%2A%11H%03%8A%CF%0C.%26QE%AB%86%02%0E%1CA%D6%89%06N%24O%C6%8B%07%04%CCK%F4%80%C2%00Z%A4%12%2A%EC6%80%82%81%81%00%20N%AA%20%24J%94%1F%1EV%3Dp%00A%D7%A6%07N%80%C0%90%B0%01%8A%81A%03vDi"1Q%85%0C.%C2%95%88BeP%8A%13%3B%08%B4Dd%E0%078%09.%94xdU%A1%1C%A9%03%2F%A2%F4%10%81%A2%C51C%01w%1Az%00%E1G%0E%1EC%05%09%A0%E0c%C4%15%02%27%17%09%10%80%20E%05%84%83%EA%A9X%C0eC%94%2Ba%D1%0F%A5%28%92%A0c%CB%0AHz%94%08%A7%C1%08%8D%7C%84%2A%8C0R%83A%8E%0E%10%0F%D0%40%11%AEq%88%1C%15%0E%80%F1R%14%00%02%0E%11F%96%D8%60%21X%21%04Sj%C4h%2CA%03%16%074T%18%C1%14%A4%02%94%9F%12t%28%E9%00u%08%03%D2%12V%2C%99b%C4D%89%12%5CT%10%B1%D0%A3%F1%84%0F%B4%0Dyxb%82%89%CC%05%162%C8%20%BD%A0%05%07%23.J%C0%002".%21%04C%A2p%99%10"%02%94%21%24t%90%16aa%C0%14%29%28%8CX%A0%90%08%C3%F0%199%A6%B8%9A%B1%82%F4%86%16%08%60%40%40%17%04D%C6%0E%06%15%A4P%CE%03%3C%2C%B0WnR%100H%40%0B%A5%60%C1%16%1B%D4%A0%C0%10h-%24%88%7DWp%D0%81Q%8A%04%02%00%21%F9%04%09%0A%00%00%00%2C%00%00%00%00%20%00%20%00%00%07%FF%80%00%82%83%84%85%86%87%88%89%8A%8B%8C%00%07_%07%8D%92%00%0F%04%3E%1D%91%93%8BAO%28P%15%9A%8BD%28%21%1F%03%84%0F%06%0F%8D%8F%99%82%15%16O%3C%18%83%15-%0D-%A0%8A%02%1D%3E%03%AE%02%29%14%B4%82%02C%0C%26%0C%09%08%8A%06%16%5B-%C4%88%08N%5C%12%1B%17%AB%89%0FM%3BD%CC%89%07%05%0A%11%24%04%AE%88%18%15%DA%8A%08%96%04%EC%85%07%02%08%02%07%E8%BB%F6%E9%0E%3EV%5D%14%02B%1Dz0%04K%04%20%28vx%C0%B7%E8%00%06%0C%01%01%08%20%12e%85%04%09%25D%E4%D0%D5%C8%9D%85%1C%3E%40%A5%B0%D0%E3%A2%C9%08D%18"%0A%82E%C4%91-%1C%10%0C%F8%E0%C2%E4E.%1CT%1A%3A0d%C1E1%3F%0CTh%60%C2%A6%04%10M"6%24%60DG%09%10B%1E%3C%B8%12%A1%84I%18%0A%16%B2J1"%0A%8A%0C%0E%EEu%40Rc%02%0C%19%0C%A6HkT%81H%97%0E%E0%E0x%9DP%81E%85%05%1F%05%2A%28et%CF%D0%83%0A%05N%7C%D8%12%05%07%81%BD%85%04T%E8%A07%11%82%17Q%8E%94%80%C1EK%87iDv%28%C8%F0%0DQ%0A%1CGl%02%99%02%8E%D0%01%07X%24%1FQP%40e%85%27%3Al%8A%B0P%21E%10%02TV%09%F0%E1%F3%E2%02%1E%A5%09U%C8P%F4"%93%0D%23%82%5C%90%82%E2C%13%0C%08%86T%C5%B8%C0G%F0A%0880%D0%C1D%C2%EA%26%23%16%C0%90%60"%CA%8B%07%1DTl0%B1a%89%D6C%B6%A2D%60%40%82%03%01%9A%26%B9X0%80%A0%80%85%25%16%10p%9Di%15%10%C0A%13%0E%D8%A6Dl%17%F5%00%85%01%00%20P%01%05%8D-"%C0%85%91%C0%D2Cw%25D%C0C%3C%02EX%C0%12%40p%C1%80%05%14%84h%08%2FW%5C%10%92N%84%04%02%00%3B%00%00%00%00%00%00%00%00%00';



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