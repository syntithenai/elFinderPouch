/*
 imageeditor v1.2
 Release Date: April 17, 2010

 Copyright (c) 2010 Gaston Robledo
 */
;
(function ($) {

    $.fn.imageeditor = function (options) {

        return this
            .each(function () {
				// invoked on target container
                var _self = null;
                var tMovement = null;
				var $selector = null;
                var $image = null;
                var $svg = null;

                var $options = $.extend(true, $.fn.imageeditor.defaults, options);
				console.log('PLUGIN IN INTI OPTIONS',options);
					
                // Check for the plugins needed
                if (!$.isFunction($.fn.draggable)
                    || !$.isFunction($.fn.resizable)
                    || !$.isFunction($.fn.slider)) {
                    alert("You must include ui.draggable, ui.resizable and ui.slider to use imageeditor");
                    return;
                }

                if ($options.image.source == ''
                    || $options.image.width == 0
                    || $options.image.height == 0) {
                    alert('You must set the source, witdth and height of the image element');
                    return;
                }

                _self = $(this);
                 //Preserve options
                setData('options', $options);
                _self.empty();
                _self.css({
                    'width': $options.width,
                    'height': $options.height,
                    'background-color': $options.bgColor,
                    'overflow': 'hidden',
                    'position': 'relative',
                    'border': '2px solid #333'
                });

                setData('image', {
                    h: $options.image.height,
                    w: $options.image.width,
                    posY: $options.image.y,
                    posX: $options.image.x,
                    scaleX: 0,
                    scaleY: 0,
                    rotation: $options.image.rotation,
                    source: $options.image.source,
                    bounds: [ 0, 0, 0, 0 ],
                    id: 'image_to_crop_' + _self[0].id
                });
				console.log('PRE',getData('image'));
                calculateFactor();
                getCorrectSizes();
				console.log('POST',getData('image'));
                setData(
                    'selector',
                    {
                        x: $options.selector.x,
                        y: $options.selector.y,
                        w: ($options.selector.maxWidth != null ? ($options.selector.w > $options.selector.maxWidth ? $options.selector.maxWidth
                            : $options.selector.w)
                            : $options.selector.w),
                        h: ($options.selector.maxHeight != null ? ($options.selector.h > $options.selector.maxHeight ? $options.selector.maxHeight
                            : $options.selector.h)
                            : $options.selector.h)
                    });


                $container = $("<div />").attr("id", "k").css({
                    'width': $options.width,
                    'height': $options.height,
                    'position': 'absolute'
                });

                $image = $('<img />');

                $image.attr('src', $options.image.source);

                $($image).css({
                    'position': 'absolute',
                    'left': getData('image').posX,
                    'top': getData('image').posY,
                    'width': getData('image').w,
                    'height': getData('image').h
                });

                var ext = getExtensionSource();
                if (ext == 'png' || ext == 'gif')
                    $image.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"
                        + $options.image.source
                        + "',sizingMethod='scale');";

                $container.append($image);
                _self.append($container);
				
                calculateTranslationAndRotation();

                // adding draggable to the image
                $($image).draggable({
                    refreshPositions: true,
					//containment: _self,
                    drag: function (event, ui) {

                        getData('image').posY = ui.position.top
                        getData('image').posX = ui.position.left

                        if ($options.image.snapToContainer)
                            limitBounds(ui);
                        else
                            calculateTranslationAndRotation();
                        // Fire the callback
                        if ($options.image.onImageDrag != null)
                            $options.image.onImageDrag($image);

                    },
                    stop: function (event, ui) {
                        if ($options.image.snapToContainer)
                            limitBounds(ui);
                    }
                });

                // Create the selector
                createSelector($image);
                // Add solid color to the selector
                _self.find('.ui-icon-gripsmall-diagonal-se').css({
                    'background': '#FFF',
                    'border': '1px solid #000',
                    'width': 15,
                    'height': 15
                });
                // Create the dark overlay
                createOverlay();

                if ($options.selector.startWithOverlay) {
                    /* Make Overlays at Start */
                    var ui_object = {
                        position: {
                            top: $selector.position().top,
                            left: $selector.position().left
                        }
                    };
                    makeOverlayPositions(ui_object);
                }
                /* End Make Overlay at start */
				if ($options.enableZoom || $options.enableRotation || $options.enableFilters) {
					var imageeditorControls=$('<div class="imageeditor-controls"></div>');
					imageeditorControls.css({
						//'position': 'absolute',
						//'top': 5,
						//'right': 200,
						//'width':200,
						'float': 'right',
						'border' : '1px solid black',
						'backgroundColor':'#CCC',
						'padding': '10px',
						'marginTop' : '15px',
						'opacity': 0.9,
						zIndex:99
					});
					_self.append(imageeditorControls);
				}
               if ($options.enableZoom || $options.enableRotation || $options.enableFilters) {
					createApplyCropCancelButtons();
				}
				// Create zoom control
                if ($options.enableZoom)
                    createZoomSlider();
                // Create rotation control
                if ($options.enableRotation)
                    createRotationSlider();
                if ($options.expose.elementMovement != '')
                    createMovementControls();
				 if ($options.enableFilters) {
					createFilterControls();
				}
				_self.append($("<img  class='loadingicon' src='"+$.fn.imageeditor.icons.loading+"'/>").hide().css({'position':'absolute',marginLeft:100,marginTop:100,zIndex:99}));
				

				function createFilterControls() {
					if (!$.fn.imageeditor.webglSupport()) return; 
					var html = '';
					var filters=$.fn.imageeditor.imageeditorFilters;
					//console.log('create filters',filters);
					for (var category in filters) {
						var list = filters[category];
						html += '<option disabled="true">---- ' + category + ' -----</option>';
						for (var i = 0; i < list.length; i++) {
							html += '<option>' + list[i].name + '</option>';
						}
					}
					var label=$('<label class= "filterslist" >Filters</label>');
					var filtersList=$('<select class="filters">'+html+'</select>').css({
                          //  'position': 'absolute',
                           // 'top': 5,
                           // 'right': 5,
                           // 'opacity': 0.6
						   margin: 10,
						   marginTop:25
                        });
					
					//console.log('init filters');
					// Call use() on the currently selected filter when the selection is changed
					var select = filtersList[0];
					function switchToFilter(index) {
						//console.log('swith to filter',index);
						if (select.selectedIndex != index) select.selectedIndex = index;
						for (var category in filters) {
							index--;
							var list = filters[category];
							for (var i = 0; i < list.length; i++) {
								if (index-- == 0) list[i].use($image,_self);
							}
						}
					}
					filtersList.change(function() {
						switchToFilter(select.selectedIndex);
					});
					var controlPanel=_self.find('.imageeditor-controls');
					controlPanel.find('label.filterslist').remove();
					controlPanel.find('label.filterlabel').remove();
					controlPanel.append(label.append(filtersList));
				} 
				function dselectImage() {
					console.log('select image internal');
					_self.setSelector(0,0,$image.width(),$image.height(),true);
				}
				function createApplyCropCancelButtons() {
					var apply=$("<a class='applybutton' ><img  src='"+$.fn.imageeditor.icons.apply+"' alt='Apply' title='Apply' ></a>").button().css({
						'opacity': 0.8
					});
					var save=$("<a class='savebutton'><img  src='"+$.fn.imageeditor.icons.download+"'  alt='Download' title='Download' ></a>").button().css({
						'marginLeft' : '43px',
						'opacity': 0.8
					});
					var undo=$("<a class='undobutton'><img  src='"+$.fn.imageeditor.icons.undo+"'  alt='Undo' title='Undo' ></a>").button().css({
						//'marginLeft' : '30px',
						'opacity': 0.8
					});
					var restore=$("<a class='restorebutton'><img  src='"+$.fn.imageeditor.icons.restore+"' alt='Restore' title='Restore'  ></a>").button().css({
						//'marginLeft' : '30px',
						'opacity': 1
					});
					apply.click(function(){ 
						var custom={};
						console.log('SI',_self.data());
						//_self.setSelector(0,0,$image.width(),$image.height(),true);
						var stack=getData('undoStack');
						if (!stack) stack=[];
						stack.push([$image.attr('src')]);
						setData('undoStack',stack);
						//$(this).parent().find('.restore').enable();
						console.log('APPLY',stack);
						$.fn.applyRotateZoom.apply(_self,[$image,custom,function(rta){
						}]);
						return false;
					});
					save.click(function(){
						console.log('SAVE');
						var name;
						var saveForm=$("<div><form><input type='text' name='filename' /></form></div>");
						_self.append(saveForm);
						console.log('SAVE1');
						function doSave() {
							console.log('SAVE I' );
							name=$('input',this).val();
							if ($.trim(name).length==0) name='image';
							//name=name+'.png';
							var newLink=$('<a download="'+name+'" />');
							newLink.attr('href',$image.attr('src'));
							$('.imageeditor-controls').append(newLink);
							var event = document.createEvent('MouseEvents');
							 event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
							 newLink.get(0).dispatchEvent(event);
							 setTimeout(function() {newLink.remove();},10);
						}
						saveForm.dialog({title: 'Save as',buttons:{'Save':doSave}}).submit(doSave);
						
						return false;
					});
					restore.click(function(){
						console.log('RESTORE',getData('undoStack'));
						if (getData('undoStack') && getData('undoStack').length>0) {
							var lastImageData=getData('undoStack').pop();
							var lastImage=lastImageData[0];
							$image.attr('src',lastImage);
							//$image.css({'top':0,'left':0});
						}
						console.log('reset image pos',$('img.ui-draggable'));
						$('img.ui-draggable').css({'top':0,'left':0});
						var ri=$('img.ui-draggable').get(0);
						ri.x=0; ri.y=0;ri.offsetLeft=0,ri.offsetTop=0;
						console.log('reset image pos d',$('img.ui-draggable'));
						$('#zoomSlider').slider('value',100);
						$('#rotationSlider').slider('value',0);
						createFilterControls();
						console.log('reset slider',$('#rotationSlider').val(),$('#zoomSlider').val());
						//getData('image').rotation =0;
						//calculateTranslationAndRotation();
							
						//$.fn.restore.apply(_self,[]);v
						//$image.attr('src',$options.image.source);
					});
					var buttonSet=$('<div/>').addClass('ui-widget-header').addClass('ui-corner-all');
					buttonSet.append(apply);
					buttonSet.append(restore);
					buttonSet.append(save);
					//buttonSet.append(undo);
					_self.find('.imageeditor-controls').append(buttonSet);
					return false;
				}

                function limitBounds(ui) {
                    if (ui.position.top > 0)
                        getData('image').posY = 0;
                    if (ui.position.left > 0)
                        getData('image').posX = 0;

                    var bottom = -(getData('image').h - ui.helper.parent()
                        .parent().height()), right = -(getData('image').w - ui.helper
                        .parent().parent().width());
                    if (ui.position.top < bottom)
                        getData('image').posY = bottom;
                    if (ui.position.left < right)
                        getData('image').posX = right;
                    calculateTranslationAndRotation();
                }

                function getExtensionSource() {
                    var parts = $options.image.source.split('.');
                    return parts[parts.length - 1];
                }
                ;

                function calculateFactor() {
                    getData('image').scaleX = ($options.width / getData('image').w);
                    getData('image').scaleY = ($options.height / getData('image').h);
                }
                ;

                function getCorrectSizes() {
                    if (false && $options.image.startZoom != 0) {
                        var scaleX = getData('image').scaleX;
                        var scaleY = getData('image').scaleY;
						console.log('scale',scaleX,scaleY,$options.image.dontScaleUp);
						var zoomInPx_width = (($options.image.width * Math
                            .abs($options.image.startZoom)) / 100);
                        var zoomInPx_height = (($options.image.height * Math
                            .abs($options.image.startZoom)) / 100);
                        getData('image').h = zoomInPx_height;
                        getData('image').w = zoomInPx_width;
                        //Checking if the position was set before
                        if (getData('image').posY != 0
                            && getData('image').posX != 0) {
                            if (getData('image').h > $options.height)
                                getData('image').posY = Math
                                    .abs(($options.height / 2)
                                        - (getData('image').h / 2));
                            else
                                getData('image').posY = (($options.height / 2) - (getData('image').h / 2));
                            if (getData('image').w > $options.width)
                                getData('image').posX = Math
                                    .abs(($options.width / 2)
                                        - (getData('image').w / 2));
                            else
                                getData('image').posX = (($options.width / 2) - (getData('image').w / 2));
                        }
                    } else {
                        var scaleX = getData('image').scaleX;
                        var scaleY = getData('image').scaleY;
						console.log('scale',scaleX,scaleY,$options.image.dontScaleUp);
						if (scaleY < scaleX) {
							if ($options.image.dontScaleUp && scaleY>1) {
								console.log('refuse shrink y');
							} else {	
								console.log('shrink y');
								getData('image').h = $options.height;
								getData('image').w = Math.round(getData('image').w * scaleY);
							}
						} else {
							if ($options.image.dontScaleUp && scaleX>1) {
							console.log('refuse shrink x');
							} else {
							console.log('shrink x');
								getData('image').h = Math
									.round(getData('image').h * scaleX);
								getData('image').w = $options.width;
							}
						}
                    }

                    // Disable snap to container if is little
                    if (getData('image').w < $options.width
                        && getData('image').h < $options.height) {
                        $options.image.snapToContainer = false;
                    }
                    calculateTranslationAndRotation();

                }
                ;

                function calculateTranslationAndRotation() {

                    $(function () {
                        adjustingSizesInRotation();
                        // console.log(imageData.id);
                        rotation = "rotate(" + getData('image').rotation + "deg)";

                        $($image).css({
                            'transform': rotation,
                            '-webkit-transform': rotation,
                            '-ms-transform': rotation,
                            'msTransform': rotation,
                            'top': getData('image').posY,
                            'left': getData('image').posX
                        });
                    });
                }
                ;

				
                function createRotationSlider() {
					//console.log('create rotation slider');
                    var rotationContainerSlider = $("<div />").attr('id',
                            'rotationContainer').mouseover(function () {
                            $(this).css('opacity', 1);
                        }).mouseout(function () {
                            $(this).css('opacity', 0.6);
                        });
						

                    var rotMin = $('<div />').attr('id', 'rotationMin')
                        .html("0");
                    var rotMax = $('<div />').attr('id', 'rotationMax')
                        .html("360");

                    var $slider = $("<div />").attr('id', 'rotationSlider');

                    // Apply slider
                    var orientation = 'vertical';
                    var value = Math.abs(360 - $options.image.rotation);

                    if ($options.expose.slidersOrientation == 'horizontal') {
                        orientation = 'horizontal';
                        value = $options.image.rotation;
                    }
					function doSlide(event, ui) {
					   console.log(' rotation slider slide');
							getData('image').rotation = (value == 360 ? Math
							.abs(360 - ui.value)
							: Math.abs(ui.value));
						calculateTranslationAndRotation();
						// update selection to full image size
						//$.fn.selectImage.apply(_self);
						//console.log('ROTATE',[getData('image').rotX,getData('image').rotY,getData('image').rotW,getData('image').rotH,false]);
						//$.fn.setSelector.apply(_self,[0,getData('image').rotY,getData('image').rotW+getData('image').rotX,getData('image').rotH,false]);
						if ($options.image.onRotate != null)
							$options.image.onRotate($slider,
								getData('image').rotation);
					}
                    $slider
                        .slider({
                            orientation: orientation,
                            value: value,
                            range: "max",
                            min: 0,
                            max: 360,
                            step: (($options.rotationSteps > 360 || $options.rotationSteps < 0) ? 1
                                : $options.rotationSteps),
                            slide: doSlide,
							change: doSlide
                        });

                    rotationContainerSlider.append(rotMin);
                    rotationContainerSlider.append($slider);
                    rotationContainerSlider.append(rotMax);
					rotationContainerSlider.prepend($('<img/>').attr('src',$.fn.imageeditor.icons.rotate).css({'float':'left', paddingTop:'5px'}));
                    if ($options.expose.rotationElement != '') {
                        $slider
                            .addClass($options.expose.slidersOrientation);
                        rotationContainerSlider
                            .addClass($options.expose.slidersOrientation);
                        rotMin.addClass($options.expose.slidersOrientation);
                        rotMax.addClass($options.expose.slidersOrientation);
                        $($options.expose.rotationElement).empty().append(
                            rotationContainerSlider);
                    } else {
                        $slider.addClass('horizontal').css({width: '120px'}); //.css({width: 80});
                        rotationContainerSlider.addClass('horizontal');
                        rotMin.addClass('horizontal');
                        rotMax.addClass('horizontal');
                        rotationContainerSlider.css({
                         //   'position': 'absolute',
                         //   'top': 35,
                         //   'right': 45,
						'marginTop': '20px',
							height: '22px',
							padding: '5px',
							width: '200px',
                           //padding: 10,
						 //width: 200,
                            'opacity': 0.6
                        });
						//console.log('now append rot slider to self',rotationContainerSlider);
                        _self.find('.imageeditor-controls').append(rotationContainerSlider);
                    }
                }
                ;

                function createZoomSlider() {
					//console.log('PLUGIN IN INTI OPTIONS',options,$options);

                    var zoomContainerSlider = $("<div />").attr('id',
                            'zoomContainer').mouseover(function () {
                            $(this).css('opacity', 1);
                        }).mouseout(function () {
                            $(this).css('opacity', 0.6);
                        });
					

                    var zoomMin = $('<div />').attr('id', 'zoomMin').html(
                        "<b>-</b>");
                    var zoomMax = $('<div />').attr('id', 'zoomMax').html(
                        "<b>+</b>");

                    var $slider = $("<div />").attr('id', 'zoomSlider');
					//console.log('making zoom slider',$options);
                    // Apply Slider
					function doSlide(event, ui) {
						console.log('zoom slider slide');
						var value = ($options.expose.slidersOrientation == 'vertical' ? ($options.image.maxZoom - ui.value)
							: ui.value);
						var zoomInPx_width = ($options.image.width * Math.abs(value) / 100);
						var zoomInPx_height = ($options.image.height * Math.abs(value) / 100);

						$($image).css({
							'width': zoomInPx_width + "px",
							'height': zoomInPx_height + "px"
						});
						var difX = (getData('image').w / 2) - (zoomInPx_width / 2);
						var difY = (getData('image').h / 2) - (zoomInPx_height / 2);

						var newX = (difX > 0 ? getData('image').posX
							+ Math.abs(difX)
							: getData('image').posX
							- Math.abs(difX));
						var newY = (difY > 0 ? getData('image').posY
							+ Math.abs(difY)
							: getData('image').posY
							- Math.abs(difY));
						getData('image').posX = newX;
						getData('image').posY = newY;
						getData('image').w = zoomInPx_width;
						getData('image').h = zoomInPx_height;
						calculateFactor();
						calculateTranslationAndRotation();
						// update selection to full image size
						//$.fn.selectImage.apply(_self);
						console.log('zoom',[getData('image'),getData('image').posX,getData('image').posY,getData('image').rotX,getData('image').rotY,getData('image').rotW,getData('image').rotH,false]);
						var di=getData('image');
						var dix=di.posX;
						var diy=di.posY;
						var dw=di.rotW;
						var dh=di.rotH;
						if (dix<0) {
							console.log('adaptx ');
							dix=0;
							dw=dw+dix;
						}
						if (diy<0) {
						console.log('adapty ');
							diy=0;
							dh=dh+diy;
						}
						
						
						$.fn.setSelector.apply(_self,[dix,diy,dw,dh,false]);
						showInfo();
						//console.log('zoom');
						if ($options.image.onZoom != null) {
							$options.image.onZoom($image,
								getData('image'));
						}
					}
                    $slider
                        .slider({
                            orientation: ($options.expose.zoomElement != '' ? $options.expose.slidersOrientation
                                : 'horizontal'),
                            value: ($options.image.startZoom != 0 ? $options.image.startZoom
                                : getPercentOfZoom(getData('image'))),
                            min: ($options.image.useStartZoomAsMinZoom ? $options.image.startZoom
                                : $options.image.minZoom),
                            max: $options.image.maxZoom,
                            step: (($options.zoomSteps > $options.image.maxZoom || $options.zoomSteps < 0) ? 1
                                : $options.zoomSteps),
                            slide: doSlide,
							change : doSlide
                        });

                    if ($options.expose.slidersOrientation == 'vertical') {
                        zoomContainerSlider.append(zoomMax);
                        zoomContainerSlider.append($slider);
                        zoomContainerSlider.append(zoomMin);
                    } else {
                        zoomContainerSlider.append(zoomMin);
                        zoomContainerSlider.append($slider);
                        zoomContainerSlider.append(zoomMax);
                    }
					zoomContainerSlider.prepend($('<img/>').attr('src',$.fn.imageeditor.icons.zoom).css({'float':'left', paddingTop:'5px'}));;
                    if ($options.expose.zoomElement != '') {
                        zoomMin
                            .addClass($options.expose.slidersOrientation);
                        zoomMax
                            .addClass($options.expose.slidersOrientation);
                        $slider
                            .addClass($options.expose.slidersOrientation);
                        zoomContainerSlider
                            .addClass($options.expose.slidersOrientation);
                        $($options.expose.zoomElement).empty().append(
                            zoomContainerSlider);
                    } else {
                        zoomMin.addClass('horizontal');
                        zoomMax.addClass('horizontal');
                        $slider.addClass('horizontal').css({width: '130px'});
                        zoomContainerSlider.addClass('horizontal');
                        zoomContainerSlider.css({
							'marginTop': '20px',
							height: '22px',
							padding: '5px',
							width: '200px',
                            //'position': 'absolute',
                            //'top': 35,
                            //'right': 5,
                            'opacity': 0.6
                        });
						
                        _self.find('.imageeditor-controls').append(zoomContainerSlider);
                    }
                }
                ;

                function getPercentOfZoom() {
                    var percent = 0;
                    if (getData('image').w > getData('image').h) {
                        percent = $options.image.maxZoom
                            - ((getData('image').w * 100) / $options.image.width);
                    } else {
                        percent = $options.image.maxZoom
                            - ((getData('image').h * 100) / $options.image.height);
                    }
                    return percent;
                }
                ;

                function createSelector(image) {
					console.log('CREATE SELECTOR',image);
                    if (image) {
						console.log('CREATE SELECTORREALLY',image.height());
						getData('selector').x=0;
						getData('selector').y=0;
						getData('selector').w=image.width();
						getData('selector').h=image.height();
					} else	if ($options.selector.centered) {
                        getData('selector').y = ($options.height / 2)
                            - (getData('selector').h / 2);
                        getData('selector').x = ($options.width / 2)
                            - (getData('selector').w / 2);
                    }

                    $selector = $('<div/>')
                        .attr('id', _self[0].id + '_selector')
                        .css(
                        {
                            'width': getData('selector').w,
                            'height': getData('selector').h,
                            'top': getData('selector').y
                                + 'px',
                            'left': getData('selector').x
                                + 'px',
                            'border': '1px dashed '
                                + $options.selector.borderColor,
                            'position': 'absolute',
                            'cursor': 'move'
                        })
                        .mouseover(
                        function () {
                            $(this)
                                .css(
                                {
                                    'border': '1px dashed '
                                        + $options.selector.borderColorHover
                                })
                        })
                        .mouseout(
                        function () {
                            $(this)
                                .css(
                                {
                                    'border': '1px dashed '
                                        + $options.selector.borderColor
                                })
                        });
                    // Add draggable to the selector
                    $selector
                        .draggable({
                            containment: 'parent',
                            iframeFix: true,
                            refreshPositions: true,
                            drag: function (event, ui) {
                                // Update position of the overlay
                                getData('selector').x = ui.position.left;
                                getData('selector').y = ui.position.top;
                                makeOverlayPositions(ui);
                                showInfo();
                                if ($options.selector.onSelectorDrag != null)
                                    $options.selector.onSelectorDrag(
                                        $selector,
                                        getData('selector'));
                            },
                            stop: function (event, ui) {
                                // hide overlay
                                if ($options.selector.hideOverlayOnDragAndResize)
                                    hideOverlay();
                                if ($options.selector.onSelectorDragStop != null)
                                    $options.selector
                                        .onSelectorDragStop(
                                            $selector,
                                            getData('selector'));
                            }
                        });
                    $selector
                        .resizable({
                            aspectRatio: $options.selector.aspectRatio,
                            maxHeight: $options.selector.maxHeight,
                            maxWidth: $options.selector.maxWidth,
                            minHeight: $options.selector.h,
                            minWidth: $options.selector.w,
                            containment: 'parent',
                            resize: function (event, ui) {
                                // update ovelay position
                                getData('selector').w = $selector
                                    .width();
                                getData('selector').h = $selector
                                    .height();
                                makeOverlayPositions(ui);
                                showInfo();
                                if ($options.selector.onSelectorResize != null)
                                    $options.selector.onSelectorResize(
                                        $selector,
                                        getData('selector'));
                            },
                            stop: function (event, ui) {
                                if ($options.selector.hideOverlayOnDragAndResize)
                                    hideOverlay();
                                if ($options.selector.onSelectorResizeStop != null)
                                    $options.selector
                                        .onSelectorResizeStop(
                                            $selector,
                                            getData('selector'));
                            }
                        });

                    showInfo($selector);
                    // add selector to the main container
                    _self.append($selector);
                }
                ;

                function showInfo() {
				console.log('showInfo',$selector);
                    var _infoView = null;
                    var alreadyAdded = false;
                    if ($selector.find("#infoSelector").length > 0) {
                        _infoView = $selector.find("#infoSelector");
                    } else {
                        _infoView = $('<div />')
                            .attr('id', 'infoSelector')
                            .css(
                            {
                                'position': 'absolute',
                                'top': 0,
                                'left': 0,
                                'background': $options.selector.bgInfoLayer,
                                'opacity': 0.6,
                                'font-size': $options.selector.infoFontSize
                                    + 'px',
                                'font-family': 'Arial',
                                'color': $options.selector.infoFontColor,
                                'width': '100%'
                            });
                    }
                    if ($options.selector.showPositionsOnDrag) {
                        _infoView.html("X:" + Math.round(getData('selector').x)
                            + "px - Y:" + Math.round(getData('selector').y) + "px");
                        alreadyAdded = true;
                    }
                    if ($options.selector.showDimensionsOnDrag) {
                        if (alreadyAdded) {
                            _infoView.html(_infoView.html() + " | W:"
                                + Math.round(getData('selector').w) + "px - H:"
                                + Math.round(getData('selector').h) + "px");
                        } else {
                            _infoView.html("W:" + Math.round(getData('selector').w)
                                + "px - H:" + Math.round(getData('selector').h)
                                + "px");
                        }
                    }
                    $selector.append(_infoView);
                }
                ;

                function createOverlay() {
                    var arr = [ 't', 'b', 'l', 'r' ];
                    $.each(arr, function () {
                        var divO = $("<div />").attr("id", this).css({
                            'overflow': 'hidden',
                            'background': $options.overlayColor,
                            'opacity': 0.6,
                            'position': 'absolute',
                            'z-index': 2,
                            'visibility': 'visible'
                        });
                        _self.append(divO);
                    });
                }
                ;

                function makeOverlayPositions(ui) {

                    _self.find("#t").css({
                        "display": "block",
                        "width": $options.width,
                        'height': ui.position.top,
                        'left': 0,
                        'top': 0
                    });
                    _self.find("#b").css(
                        {
                            "display": "block",
                            "width": $options.width,
                            'height': $options.height,
                            'top': (ui.position.top + $selector
                                .height())
                                + "px",
                            'left': 0
                        });
                    _self.find("#l").css({
                        "display": "block",
                        'left': 0,
                        'top': ui.position.top,
                        'width': ui.position.left,
                        'height': $selector.height()
                    });
                    _self.find("#r").css(
                        {
                            "display": "block",
                            'top': ui.position.top,
                            'left': (ui.position.left + $selector
                                .width())
                                + "px",
                            'width': $options.width,
                            'height': $selector.height() + "px"
                        });
                }
                ;

                _self.makeOverlayPositions = makeOverlayPositions;

                function hideOverlay() {
                    _self.find("#t").hide();
                    _self.find("#b").hide();
                    _self.find("#l").hide();
                    _self.find("#r").hide();
                }

                function setData(key, data) {
                    _self.data(key, data);
                }
                ;

                function getData(key) {
                    return _self.data(key);
                }
                ;

                function adjustingSizesInRotation() {
                    var angle = getData('image').rotation * Math.PI / 180;
                    var sin = Math.sin(angle);
                    var cos = Math.cos(angle);

                    // (0,0) stays as (0, 0)

                    // (w,0) rotation
                    var x1 = cos * getData('image').w;
                    var y1 = sin * getData('image').w;

                    // (0,h) rotation
                    var x2 = -sin * getData('image').h;
                    var y2 = cos * getData('image').h;

                    // (w,h) rotation
                    var x3 = cos * getData('image').w - sin * getData('image').h;
                    var y3 = sin * getData('image').w + cos * getData('image').h;

                    var minX = Math.min(0, x1, x2, x3);
                    var maxX = Math.max(0, x1, x2, x3);
                    var minY = Math.min(0, y1, y2, y3);
                    var maxY = Math.max(0, y1, y2, y3);

                    getData('image').rotW = maxX - minX;
                    getData('image').rotH = maxY - minY;
                    getData('image').rotY = minY;
                    getData('image').rotX = minX;
                };

                function createMovementControls() {
                    var table = $('<table>\
                                    <tr>\
                                    <td></td>\
                                    <td></td>\
                                    <td></td>\
                                    </tr>\
                                    <tr>\
                                    <td></td>\
                                    <td></td>\
                                    <td></td>\
                                    </tr>\
                                    <tr>\
                                    <td></td>\
                                    <td></td>\
                                    <td></td>\
                                    </tr>\
                                    </table>');
                    var btns = [];
                    btns.push($('<div />').addClass('mvn_no mvn'));
                    btns.push($('<div />').addClass('mvn_n mvn'));
                    btns.push($('<div />').addClass('mvn_ne mvn'));
                    btns.push($('<div />').addClass('mvn_o mvn'));
                    btns.push($('<div />').addClass('mvn_c'));
                    btns.push($('<div />').addClass('mvn_e mvn'));
                    btns.push($('<div />').addClass('mvn_so mvn'));
                    btns.push($('<div />').addClass('mvn_s mvn'));
                    btns.push($('<div />').addClass('mvn_se mvn'));
					
					for (var i = 0; i < btns.length; i++) {
						// for each buttons that were created above,
						// attach action listeners
                        btns[i].mousedown(function () {
                            moveImage(this);
                        }).mouseup(function () {
                            clearTimeout(tMovement);
                        }).mouseout(function () {
                            clearTimeout(tMovement);
                        });
						// find the correct position in the placeholder table and add them
                        table.find('td:eq(' + i + ')').append(btns[i]);
                    }
					
					// find the container in the view, empty it up and append the table
					$($options.expose.elementMovement).empty().append(table);
                }
                ;

                function moveImage(obj) {

                    if ($(obj).hasClass('mvn_no')) {
                        getData('image').posX = (getData('image').posX - $options.expose.movementSteps);
                        getData('image').posY = (getData('image').posY - $options.expose.movementSteps);
                    } else if ($(obj).hasClass('mvn_n')) {
                        getData('image').posY = (getData('image').posY - $options.expose.movementSteps);
                    } else if ($(obj).hasClass('mvn_ne')) {
                        getData('image').posX = (getData('image').posX + $options.expose.movementSteps);
                        getData('image').posY = (getData('image').posY - $options.expose.movementSteps);
                    } else if ($(obj).hasClass('mvn_o')) {
                        getData('image').posX = (getData('image').posX - $options.expose.movementSteps);
                    } else if ($(obj).hasClass('mvn_c')) {
                        getData('image').posX = ($options.width / 2)
                            - (getData('image').w / 2);
                        getData('image').posY = ($options.height / 2)
                            - (getData('image').h / 2);
                    } else if ($(obj).hasClass('mvn_e')) {
                        getData('image').posX = (getData('image').posX + $options.expose.movementSteps);
                    } else if ($(obj).hasClass('mvn_so')) {
                        getData('image').posX = (getData('image').posX - $options.expose.movementSteps);
                        getData('image').posY = (getData('image').posY + $options.expose.movementSteps);
                    } else if ($(obj).hasClass('mvn_s')) {
                        getData('image').posY = (getData('image').posY + $options.expose.movementSteps);
                    } else if ($(obj).hasClass('mvn_se')) {
                        getData('image').posX = (getData('image').posX + $options.expose.movementSteps);
                        getData('image').posY = (getData('image').posY + $options.expose.movementSteps);
                    }
                    if ($options.image.snapToContainer) {
                        if (getData('image').posY > 0) {
                            getData('image').posY = 0;
                        }
                        if (getData('image').posX > 0) {
                            getData('image').posX = 0;
                        }

                        var bottom = -(getData('image').h - _self.height());
                        var right = -(getData('image').w - _self.width());
                        if (getData('image').posY < bottom) {
                            getData('image').posY = bottom;
                        }
                        if (getData('image').posX < right) {
                            getData('image').posX = right;
                        }
                    }
                    calculateTranslationAndRotation();
                    tMovement = setTimeout(function () {
                        moveImage(obj);
                    }, 100);
                };
				
				// CLASS METHODS DEFINED HERE FOR TIMELY DEFINITION AND USE
				// and access to _self ??
                $.fn.imageeditor.updateOverlayPosition = function(ui){
                    _self.makeOverlayPositions(ui);
					_self.showInfo();
                };

                $.fn.imageeditor.getParameters = function (_self, custom) {
                    var image = _self.data('image');
                    var selector = _self.data('selector');
                    var fixed_data = {
                        'viewPortW': _self.width(),
                        'viewPortH': _self.height(),
                        'imageX': image.posX,
                        'imageY': image.posY,
                        'imageRotate': image.rotation,
                        'imageW': image.w,
                        'imageH': image.h,
                        'imageSource': image.source,
                        'selectorX': selector.x,
                        'selectorY': selector.y,
                        'selectorW': selector.w,
                        'selectorH': selector.h
                    };
                    return $.extend(fixed_data, custom);
                };

                $.fn.imageeditor.getSelf = function () {
                    return _self;
                }
                /*$.fn.imageeditor.getOptions = function() {
                 return _self.getData('options');
                 }*/

                // Maintein Chaining
                return this;
            });

    };


    // Css Hooks
    /*
     * jQuery.cssHooks["MsTransform"] = { set: function( elem, value ) {
     * elem.style.msTransform = value; } };
     */
	// EXTRA FUNCTIONS ADDED TO THE JQUERY NAMESPACE UGH //TODO
    $.fn.extend({
		// TODO ALLOw for zoom and rotation
		selectImage : function()  {
			// used outside plugin so needs to be called with apply in some cases to explicity control 'this'
			// should be plugin instance
			var _self = $(this);
			console.log('select image fnextend',_self.data('image'),_self); //.imageeditor.getParameters(_self,{}));
			//return
			//var image=$('img.ui-draggable',_self);
			//console.log('img',image);
			//var i=image.get(0);
			var i=_self.data('image');
			if (i.length>0) {
			//$.fn.setSelector.apply(_self,[i.offsetLeft,i.offsetTop,(i.width+i.offsetLeft),(i.height+i.offsetTop)]);
				$.fn.setSelector.apply(_self,[i.rotX,i.rotY,i.i.rotW,i.RotH]);
			}
		},
        // Function to set the selector position and sizes
        setSelector: function (x, y, w, h, animate) {
			console.log('set selector',x,y,w,h)
            var _self = $(this);
            _self.data('selector', {
                x: x,
                y: y,
                w: w,
                h: h
            });
            var ui_object = {
                position : {
                    top : y,
                    left : x
                }
            };
            if (animate != undefined && animate == true) {
                _self.find('#' + _self[0].id + '_selector').animate({
                    'top': y,
                    'left': x,
                    'width': w,
                    'height': h
                }, 'slow', function(){
                    if (_self.data('options').selector.startWithOverlay) {
                        _self.imageeditor.updateOverlayPosition(ui_object);
                    }
                } );
            } else {
                _self.find('#' + _self[0].id + '_selector').css({
                    'top': y,
                    'left': x,
                    'width': w,
                    'height': h
                });
                if ($(this).data('options').selector.startWithOverlay) {
					console.log('set selector done update overlay');
                   _self.imageeditor.updateOverlayPosition(ui_object);
                }
			}
			

        },
        // Restore the Plugin
        restore: function () {
		console.log('restore');
            var obj = $(this);
            var $options = obj.data('options');
            obj.empty();
            obj.data('image', {});
            obj.data('selector', {});
            if ($options.expose.zoomElement != "") {
                $($options.expose.zoomElement).empty();
            }
            if ($options.expose.rotationElement != "") {
                $($options.expose.rotationElement).empty();
            }
            if ($options.expose.elementMovement != "") {
                $($options.expose.elementMovement).empty();
            }
            obj.imageeditor($options);

        },
        // Send the Data to the Server
        send: function (url, type, custom, onSuccess) {
            var _self = $(this);
            var response = "";
            $.ajax({
                url: url,
                type: type,
                data: (_self.imageeditor.getParameters(_self, custom)),
                success: function (r) {
                    _self.data('imageResult', r);
                    if (onSuccess !== undefined && onSuccess != null)
                        onSuccess(r);
                }
            });
        },
		// resize/rotate the image data locally
		applyRotateZoom: function(oldImage,custom,onSuccess) {
			var _self = $(this);
			console.log('D',_self.data('options'),this);
				
			var $options=_self.data('options');
			var params=_self.imageeditor.getParameters(_self, custom);
			console.log('apply start',oldImage,params);
			var offsetX=oldImage.x;
			var offsetY=oldImage.y
			var image=new Image();
			image.src=oldImage.attr('src');
			image.onload=function() {
				//$.fn.selectImage.apply(_self);
				
				//console.log('image onload',image.src);
				 dataURLtoBlob= function(data) {
					var mimeString = data.split(',')[0].split(':')[1].split(';')[0];
					var byteString = atob(data.split(',')[1]);
					var ab = new ArrayBuffer(byteString.length);
					var ia = new Uint8Array(ab);
					for (var i = 0; i < byteString.length; i++) {
						ia[i] = byteString.charCodeAt(i);
					}
					var bb = (window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder);
					if (bb) {
						bb = new (window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder)();
						bb.append(ab);
						return bb.getBlob(mimeString);
					} else {
						//    console.log('Blob');  
						bb = new Blob([ab], {
							'type': (mimeString)
						});
						return bb;
					}
				}
				var canvas = document.createElement('canvas');
				canvas.width = params.viewPortW;
				canvas.height = params.viewPortH;
				var panel=canvas.getContext("2d");
				panel.translate(params.imageX+(params.imageW*0.5),params.imageY+(params.imageH*0.5));
				panel.rotate(params.imageRotate*Math.PI/180,(params.imageX+(params.imageW*0.5)),(params.imageY+(params.imageH*0.5)));
				panel.drawImage(image,-1*(params.imageW*0.5),-1*(params.imageH*0.5),params.imageW,params.imageH);
				var finalCanvas=document.createElement('canvas');
				finalCanvas.width = params.selectorW;
				finalCanvas.height = params.selectorH;
				var finalPanel=finalCanvas.getContext("2d");
				finalPanel.drawImage(canvas,params.selectorX,params.selectorY,params.selectorW,params.selectorH,0,0,params.selectorW,params.selectorH);
				var slider=$('#rotationSlider');
				slider.slider('value',0);
				slider.change();
				//slider=$('#zoomSlider');
				//slider.slider('value',100);
				//slider.change();
				//var $options = _self.data('options');
				//showInfo();
				/*
				var ij=$('<img>').attr('src',finalCanvas.toDataURL()).bind('load',function() {
					console.log('new image loaded',ij);
					_self.data('options').image.source=ij.get(0).src;
					_self.data('options').image.width=ij.width();
					_self.data('options').image.height=ij.height();
					$.fn.imageeditor.apply(_self,[_self.data('options')]);
				});
				// reload, call plugin constructor with new image
				var i=new Image();
				image.src=finalCanvas.toDataURL();
				_self.data('options').image.source=finalCanvas.toDataURL();
				_self.data('options').image.width=i.width;
				_self.data('options').image.height=i.height;
				//_self.imageeditor(_self.data('options'));
				*/
				_self.empty();
				_self.data('image', {});
				_self.data('selector', {});
				var options=$.fn.imageeditor.defaults;
				options.image.source=finalCanvas.toDataURL($.fn.imageeditor.defaults.outputImageMime);
				options.image.width=params.selectorW;
				options.image.height=params.selectorH;
				_self.imageeditor(options);
			
			/*
				oldImage.bind('load',function() {
					//console.log('replaced image',this);
					$.fn.setSelector.apply(_self,[offsetX,offsetY,this.width,this.height,false]);
				});
				oldImage.attr('src',finalCanvas.toDataURL());				
				
				
				//console.log('SUCCESS',onSuccess);
				if (typeof onSuccess=="function") {
					//console.log('SUCCESS');
					if (custom.blob) { 
						onSuccess(dataURLtoBlob(finalCanvas.toDataURL()));
					} else {
						onSuccess(finalCanvas.toDataURL());
					}
				}
				
				*/
			}
			$(image).load();
		}
    });

})(jQuery);
