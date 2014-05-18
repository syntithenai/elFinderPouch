// GET VALUE
if (false) console.log('save svg data');
	var canvas=$('.form-'+key+' iframe.svgeditor',plugin.formTarget).parent().data('canvas');
	if (false) console.log(canvas);
	try {
		var handleData = function (data,error) {
			if (false) console.log('Catch SVG value',data,error)	;
			if (error) { console.log('error ' + error);} else { console.log('savedsvg',data); if (callback) callback(data); }
		}
		canvas.getSvgString()(handleData);	
	} catch (e) {
		if (false) console.log('Failed to catch SVG value',e)	;
	}
} else if (value.type=='sheet') {
	var si=$('.form-'+key,plugin.formTarget).data('sheetInstance'); // sheet instance
	if (si) {
		// save in XML with formulas
		//console.log($.sheet.dts.fromTables.xml(si));
		//toSave[key]=$('<div />').html($.sheet.dts.fromTables.xml(si)+' ').html();
		// FOR NOW force to HTML with rendered values
		var sheetClone=si.tables();
		toSave[key]=$('<div />').html(sheetClone).html();
		callback(toSave[key]);
	}
}


//// PUT VALUE
} else if (fieldType=='svg') {
							formInput="<iframe class='form-editingdata svgeditor' width='900' height='550' src='"+plugin.settings.libPath+"svg-edit/svg-editor.html' />";
							results.svg=true;
					}  else if (fieldType=='sheet') {
						// ensure empty sheet 
						if ($.trim(recordValue)=='') {
							recordValue='<table><tr><td></td></tr></table>';
						}
						results.addInputWrapperClass='sheet'
						results.hideLabel=true;
						formInput=recordValue;
					



// INIT


	// svg
		$.each(svgEditors,function(i,fieldKey) {
		if (false) console.log('SVG '+fieldKey);
			var iframe=document.querySelector('.form-'+fieldKey+' iframe.svgeditor',formTarget);
			
			var quickDBSvgInit=function() {
				//console.log('editor_ready();');
				var svgCanvas = new embedded_svg_edit(iframe);	
				$(iframe).parent().data('canvas',svgCanvas)	
				//console.log('SET SVG');
				if (record[fieldKey] && $.trim(record[fieldKey])!='') {
					svgCanvas.setSvgString(record[fieldKey]);
				} else {
					svgCanvas.setSvgString('<svg width="640" height="480" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg"></svg>');
				}
			}
			
			$(iframe).ready(function() {
			//console.log('SVG iframe ready');
				var ifrm = iframe[0];
				// waiting for real load
				(function(){
							try {
								ifrm.contentWindow.svgEditor.ready(function() { quickDBSvgInit();});
							}
							catch (Ex){
								setTimeout(quickDBSvgInit, 1000);
							}
						})();
			})
			
			
		});
		
		
		
		if ($.fn.sheet) {
			//console.log('show sheet');
			try {
				$.sheet.preLoad("../lib/jquery.sheet/");
				$('.sheet',plugin).sheet({
					menuLeft: function(jS) { return  $.sheet.menuLeft.replace(/sheetInstance/g, "$.sheet.instance[" + jS.I + "]"); },
					menuRight: function(jS) { 
						var menu = $.sheet.menuRight.replace(/sheetInstance/g, "$.sheet.instance[" + jS.I + "]"); menu = $(menu); menu.find('.colorPickerCell').colorPicker().change(function(){ $.sheet.instance[jS.I].cellChangeStyle('background-color', $(this).val()); }); menu.find('.colorPickerFont').colorPicker().change(function(){ $.sheet.instance[jS.I].cellChangeStyle('color', $(this).val());}); menu.find('.colorPickers').children().eq(1).css('background-image', "url('"+plugin.settings.libPath+"jquery.sheet/images/palette.png')");  menu.find('.colorPickers').children().eq(3).css('background-image', "url('"+plugin.settings.libPath+"jquery.sheet/images/palette_bg.png')");return menu;}
				});
				//return;
			} catch (e) {console.log('sheet err',e);}
		} else  {
			if (false) console.log('sheet lib not loaded');	
		}