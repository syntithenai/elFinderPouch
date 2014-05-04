// CONFIGURATION FOR EDITORS
// HTML EDITOR
//pouchTransportConfig.editors={};
var pouchTransportConfig={editors:{},initEditors: function() {
	
	
}};
pouchTransportConfig.editors.HTMLEditor={
	mimes : ['text/html'],  //types to edit with tinyMCE
	load : function(textarea) {
		//console.log('EDIT',textarea,arguments);
		tinymce.execCommand('mceAddEditor', false, textarea.id);
		
	},
	close : function(textarea, instance) {
		//console.log('close',textarea,instance,arguments);
		
		tinymce.execCommand('mceRemoveEditor', false, textarea.id);
	},
	save : function(textarea, editor) {
		//console.log('save',textarea,editor,arguments);
		
		textarea.value = tinyMCE.get(textarea.id).selection.getContent({format : 'html'});
		tinymce.execCommand('mceRemoveEditor', false, textarea.id);
	}
}

// THERE ARE A FEW VARIATIONS OF CODEMIRROR
pouchTransportConfig.editors.codeMirrorPlain={
	mimes : ['text/plain'], 
	load : function(textarea) {
		console.log('LOAD CODEMIRROR',textarea.id,document.getElementById(textarea.id));
		var codeMirrorEditor = CodeMirror.fromTextArea(document.getElementById(textarea.id), {
			indentWithTabs: true,
			smartIndent: true,
			lineNumbers: true,
			matchBrackets : true,
			autofocus: true,
			extraKeys: {
				"F11": function(cm) {
				  cm.setOption("fullScreen", !cm.getOption("fullScreen"));
				},
				"Esc": function(cm) {
				  if (cm.getOption("fullScreen")) cm.setOption("fullScreen", false);
				}
			},
			foldGutter: true,
			gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
		  });
		  $('#'+textarea.id).data('editor',codeMirrorEditor)
	},
	save : function(textarea, editor) {
		console.log('SAVE CODEMIRROR');
		$(textarea).data('editor').save();
		//console.log('save',textarea,editor,arguments,$(textarea).data('editor'));
		//editor.toTextArea();
	},
}
pouchTransportConfig.editors.codeMirrorSQL=$.extend({},pouchTransportConfig.editors.codeMirrorPlain);
pouchTransportConfig.editors.codeMirrorSQL.mode='text/x-sql';
pouchTransportConfig.editors.codeMirrorSQL.mimes=["text/x-sql"];
pouchTransportConfig.editors.codeMirrorCSS=$.extend({},pouchTransportConfig.editors.codeMirrorPlain);
pouchTransportConfig.editors.codeMirrorCSS.mode='css';
pouchTransportConfig.editors.codeMirrorCSS.mimes=["text/css"];
pouchTransportConfig.editors.codeMirrorJS=$.extend({},pouchTransportConfig.editors.codeMirrorPlain);
pouchTransportConfig.editors.codeMirrorJS.mode='javascript';
pouchTransportConfig.editors.codeMirrorJS.mimes=["text/javascript"];
// SVG EDITING
pouchTransportConfig.editors.svgEditor={
	mimes : ['image/svg+xml'],
	load : function(textarea) {
		console.log('svg load');
		// append iframe to dom
		var iframe=$("<iframe id='svgeditor'  src='svg-edit/svg-editor.html?extensions=ext-xdomain-messaging.js' />");
		var ww=$(window).width();
		var wh=$(window).height();
		iframe.css({width: ww*0.95,height: wh*0.9});
		$('#'+textarea.id).hide().after(iframe);
		
		var svgInit=function() {
			console.log('editor_ready();');
			var canvas = new EmbeddedSVGEdit(iframe[0]);	
			iframe.parent().data('canvas',canvas)	
			if ($.trim($('#'+textarea.id).val())!='') {
				canvas.setSvgString($('#'+textarea.id).val());
			} else {
				canvas.setSvgString('<svg width="'+ww*0.8+'" height="'+wh*0.65+'" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg"></svg>');
			}
		}
		
		$(iframe).ready(function() {
			console.log('SVG iframe ready');
			var ifrm = iframe[0];
			// waiting for real load
			(function(){
				try {
					ifrm.contentWindow.svgEditor.ready(function() { svgInit();});
				}
				catch (Ex){
					setTimeout(svgInit, 1000);
				}
			})();
		})
		
		
	//	console.log('LOAD SVG',textarea.id,document.getElementById(textarea.id));
	  //data('editor',codeMirrorEditor)
	},
	save : function(textarea, editor) {
		var dfr=$.Deferred();
		//canvas=$(textarea).data('canvas');
		console.log('SAVE SVG',textarea);
		//var canvas=$(textarea).next('iframe.svgeditor'.parent().data('canvas');
		try {
			var canvas=$('#svgeditor').parent().data('canvas');
			console.log('try',canvas)
			var handleData = function (data,error) {
				console.log('handle data',data,errpr)
				if (false) console.log('Catch SVG value',data,error)	;
				if (error) { 
					console.log('error ' + error);
					dfr.reject();
				} else { 
					console.log('savedsvg',data); 
					//if (callback) callback(data);  
					dfr.resolve(data);
				}
			}
			canvas.getSvgString()(handleData);	
		} catch (e) {
			if (false) console.log('Failed to catch SVG value',e)	;
			dfr.reject();
		}
		$.when.apply($,[dfr]).then(function(data) {
			console.log('DDD',data,arguments);
		});
		//console.log('save',textarea,editor,arguments,$(textarea).data('editor'));
		//editor.toTextArea();
	}
};
// SHEET EDITING
var imagePath='jquery.sheet/images/';
// sheet has to be included before this file
$.sheet.menuLeft='<div><a href="#" onclick="sheetInstance.toggleFullScreen(); $(\'#lockedMenu\').toggle(); return false;" title="Toggle Full Screen"><img alt="Toggle Full Screen" src="'+imagePath+'arrow_out.png"/></a><a onclick="sheetInstance.cellUndoable.undoOrRedo(true); return false;" title="Undo"><img src="'+imagePath+'arrow_undo.png"/></a><a onclick="sheetInstance.cellUndoable.undoOrRedo(); return false;" title="Redo"><img src="'+imagePath+'arrow_redo.png"/></a><a onclick="sheetInstance.merge(); return false;" title="Merge"><img src="'+imagePath+'arrow_join.png"/></a><a onclick="sheetInstance.unmerge(); return false;" title="Unmerge"><img src="'+imagePath+'arrow_divide.png"/></a><a href="#" onclick="sheetInstance.cellStyleToggle(\'styleWrap\'); return false;" title="Wrap Text"><img  src="'+imagePath+'text_horizontalrule.png"/></a><a href="#" onclick="sheetInstance.fillUpOrDown(); return false;" title="Fill Down"><img alt="Fill Down" src="'+imagePath+'arrow_down.png"/></a><a href="#" onclick="sheetInstance.fillUpOrDown(true); return false;" title="Fill Up"><img alt="Fill Up" src="'+imagePath+'arrow_up.png"/></a></div>';
$.sheet.menuRight='<div><a class="cellStyleToggle" onclick="sheetInstance.fontReSize(\'up\');  return false;" title="Font Size -"><img src="'+imagePath+'font_add.png"/></a><a class="cellStyleToggle" onclick="sheetInstance.fontReSize(\'down\'); return false;" title="Font Size +"><img src="'+imagePath+'font_delete.png"/></a>  <a href="#" onclick="sheetInstance.cellStyleToggle(\'styleBold\'); return false;" title="Bold"><img alt="Bold" src="'+imagePath+'text_bold.png"/></a><a href="#" onclick="sheetInstance.cellStyleToggle(\'styleItalics\'); return false;" title="Italic"><img alt="Italic" src="'+imagePath+'text_italic.png"/></a><a href="#" onclick="sheetInstance.cellStyleToggle(\'styleUnderline\', \'styleLineThrough\'); return false;" title="Underline"><img alt="Underline" src="'+imagePath+'text_underline.png"/></a><a href="#" onclick="sheetInstance.cellStyleToggle(\'styleLineThrough\', \'styleUnderline\'); return false;" title="Strikethrough"><img alt="Strikethrough" src="'+imagePath+'text_strikethrough.png"/></a><a href="#" onclick="sheetInstance.cellStyleToggle(\'styleLeft\', \'styleCenter styleRight\'); return false;" title="Align Left"><img alt="Align Left" src="'+imagePath+'text_align_left.png"/></a><a href="#" onclick="sheetInstance.cellStyleToggle(\'styleCenter\', \'styleLeft styleRight\'); return false;" title="Align Center"><img alt="Align Center" src="'+imagePath+'text_align_center.png"/></a><a href="#" onclick="sheetInstance.cellStyleToggle(\'styleRight\', \'styleLeft styleCenter\'); return false;" title="Align Right"><img alt="Align Right" src="'+imagePath+'text_align_right.png"/></a><span class="colorPickers"><input title="Foreground color" class="colorPickerFont" style="background-image: url(\''+imagePath+'palette.png\') ! important; width: 16px; height: 16px;"/><input title="Background Color" class="colorPickerCell" style="background-image: url(\''+imagePath+'palette_bg.png\') ! important; width: 16px; height: 16px;"/></span></div>';
pouchTransportConfig.editors.sheetEditor={
	mimes : ['text/sheet'], 
	load : function(textarea) {
		console.log('LOAD SHEET',textarea.id,document.getElementById(textarea.id));
		var sheet=$("<div id='sheet-"+textarea.id+"' ></div>");
		var si=sheet.data('sheetInstance'); // sheet instance
		//if (si) {
			//$.sheet.dts.toTables.xml($('#'+textarea.id).val());
		//}
		console.log($('#'+textarea.id).val())
		sheet.html($.sheet.dts.toTables.xml($('#'+textarea.id).val()));
		$('#'+textarea.id).hide().after(sheet);
		sheet.sheet({
				menuLeft: function(jS) { return  $.sheet.menuLeft.replace(/sheetInstance/g, "$.sheet.instance[" + jS.I + "]"); },
				menuRight: function(jS) { 
					var menu = $.sheet.menuRight.replace(/sheetInstance/g, "$.sheet.instance[" + jS.I + "]"); menu = $(menu); menu.find('.colorPickerCell').colorPicker().change(function(){ $.sheet.instance[jS.I].cellChangeStyle('background-color', $(this).val()); }); menu.find('.colorPickerFont').colorPicker().change(function(){ $.sheet.instance[jS.I].cellChangeStyle('color', $(this).val());}); menu.find('.colorPickers').children().eq(1).css('background-image', "url('jquery.sheet/images/palette.png')");  menu.find('.colorPickers').children().eq(3).css('background-image', "url('jquery.sheet/images/palette_bg.png')");return menu;}
			});
	},
	save : function(textarea, editor) {
		var sheet=$("#sheet-"+textarea.id);
		var si=sheet.data('sheetInstance'); // sheet instance
		if (si) {
			// save in XML with formulas
			//console.log($.sheet.dts.fromTables.xml(si));
			//toSave[key]=$('<div />').html($.sheet.dts.fromTables.xml(si)+' ').html();
			// FOR NOW force to HTML with rendered values
			//var sheetClone=si.tables();
			//var toSave=$('<div />').html(sheetClone).html();
			var toSave=$('<div />').html($.sheet.dts.fromTables.xml(si)+' ').html()
			$('#'+textarea.id).val(toSave);
		}
	}
}




