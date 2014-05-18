// CONFIGURATION FOR EDITORS
var pouchTransportConfig={editors:{}};
pouchTransportConfig.editors.JSONEditor={
	mimes : ['application/json'],  
	load : function(textarea) {
		console.log('EDIT',textarea,arguments, $('#'+textarea.id).val());
		var editorDiv=$("<div id='jsoneditor-"+textarea.id+"' ></div>");
		var ww=$(window).width();
		var wh=$(window).height();
		editorDiv.css({width: ww*0.95,height: wh*0.9});
		$('#'+textarea.id).hide().after(editorDiv);
		var val= $('#'+textarea.id).val();
		if ($.trim(val)=='') val='{}';
		try {
			val=JSON.stringify(JSON.parse(val));
		} catch (e) {
			val='{"ERROR":'+e.toString()+'}';
		}
		var editor = new jsoneditor.JSONEditor(editorDiv.get(0), {
			mode: 'tree',
			modes: ['code', 'form', 'text', 'tree', 'view'], // allowed modes
			error: function (err) {
			  console.log(err);
			}
		},val);	
		$('#'+textarea.id).data('jsoneditor',editor);
	},
	close : function(textarea, instance) {
		//console.log('close',textarea,instance,arguments);
	},
	save : function(textarea, editor) {
		//console.log('save',textarea,editor,arguments);		
		var editor=$('#'+textarea.id).data('jsoneditor');
		textarea.value = editor.get();
	}
}
pouchTransportConfig.editors.imageEditor={
	dmimes : ['image/jpeg','image/gif','image/png'],  
	load : function(textarea) {
		//console.log('EDIT',textarea,arguments);
		tinymce.init({});
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
// HTML EDITOR
pouchTransportConfig.editors.HTMLEditor={
	mimes : ['text/html'],  //types to edit with tinyMCE
	init : function() {
	},
	load : function(textarea) {
		CKEDITOR.replace(textarea.id,{
			filebrowserBrowseUrl:'fileselector.html',
			filebrowserVideoBrowseUrl:'fileselector.html?fileType=video',
			filebrowserImageBrowseUrl:'fileselector.html?fileType=image',
			extraPlugins: 'video',
			extraAllowedContent: 'video[*]{*}',
			toolbar_Full : [
				 { name: 'links', items: [ 'Link', 'Unlink', 'Anchor' ] },
				{ name: 'insert', items: [  'Symbol', 'Iframe', 'InsertPre' , 'Blockquote', 'CreateDiv','NumberedList', 'BulletedList','HorizontalRule', 'PageBreak', 'Image', 'Table','Video','Youtube','leaflet','EqnEditor','CodeSnippet','qrc','Templates'] },
				{ name: 'forms', items: [ 'Form', 'Checkbox', 'Radio', 'TextField', 'Textarea', 'Select', 'Button', 'ImageButton', 'HiddenField' ] },
				'/',
				{ name: 'basicstyles', groups: [ 'basicstyles', 'cleanup','styles' ], items: [ 'RemoveFormat','Format','Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript' , 'TransformTextSwitcher'] },
				{ name: 'paragraph',   groups: [ 'list', 'indent', 'blocks', 'align' ], items: [ 'Outdent', 'Indent', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock' ] },
				{ name: 'editing',     groups: [ 'find'], items: [ 'Find', 'Replace' ] },
				{ name: 'translate' ,items:['xdsoft_translater_settings','xdsoft_translater','xdsoft_translater_reverse'] },
				{ name: 'document',   items: [  'Maximize', 'Source','ShowBlocks'] },
			],
			toolbar :"Full"
			
		});
	},
	close : function(textarea, instance) {
		if (CKEDITOR.instances[textarea.id]) CKEDITOR.instances[textarea.id].destroy();
	},
	save : function(textarea, editor) {
		//console.log('save',textarea,editor,arguments);
		var data = CKEDITOR.instances[textarea.id].getData();
		console.log('save',textarea,editor,data);
		CKEDITOR.instances[textarea.id].destroy();
	}
}
/*
pouchTransportConfig.editors.tinyMCEHTMLEditor={
	mimes : ['text/html'],  //types to edit with tinyMCE
	init : function() {
		tinymce.init({
			plugins: [
				"table advlist autolink lists link image charmap print preview hr anchor pagebreak media",
				"searchreplace wordcount visualblocks visualchars code fullscreen",
				"media nonbreaking save contextmenu",
				"template paste fullpage",
			],
			toolbar1: "removeformat | formatselect bold italic underline strikethrough subscript superscript | alignleft aligncenter alignright alignjustify  | table blockquote | bullist numlist link unlink anchor image media hr charmap template pagebreak | searchreplace print code",
			contextmenu: "cut copy paste",
			image_advtab: true,
			menubar:false,
			toolbar_items_size:'large',
			//object_resizing : 'table',
			//webkit_fake_resize : 1,
			inline:1,
			paste_data_images: true,
			paste_as_text: true,
			browser_spellcheck : true,
			image_advtab:false,
			file_browser_callback: function (field_name, url, type, win) {
			  tinymce.activeEditor.windowManager.open({
				file: '/elfinderPouch/fileselector.html',// use an absolute path!
				title: 'elFinder',
				width: 900,  
				height: 450,
				resizable: 'yes'
			  }, {
				setUrl: function (url) {
				  win.document.getElementById(field_name).value = url;
				}
			  });
			  return false;
			}
		});
	},
	load : function(textarea) {
		tinymce.execCommand('mceAddEditor', false, textarea.id);
	},
	close : function(textarea, instance) {
		tinymce.execCommand('mceRemoveEditor', false, textarea.id);
	},
	save : function(textarea, editor) {
		//console.log('save',textarea,editor,arguments);
		
		textarea.value = tinyMCE.get(textarea.id).selection.getContent({format : 'html'});
		tinymce.execCommand('mceRemoveEditor', false, textarea.id);
	}
}
*/
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
		console.log('svg load',textarea.id);
		// append iframe to dom
		var iframe=$("<iframe id='svgeditor-"+textarea.id+"'  src='lib/svg-edit/svg-editor.html?extensions=ext-xdomain-messaging.js' />");
		var ww=$(window).width();
		var wh=$(window).height();
		iframe.css({width: ww*0.95,height: wh*0.9});
		$('#'+textarea.id).hide().after(iframe);
		
		var svgInit=function(ifrm) {
			console.log('editor_ready();');
			var canvas = new EmbeddedSVGEdit(ifrm);	
			$(ifrm).parent().data('canvas',canvas)	;
			if ($.trim($('#'+textarea.id).val())!='') {
				canvas.setSvgString($('#'+textarea.id).val());
			} else {
				canvas.setSvgString('<svg width="'+ww*0.8+'" height="'+wh*0.65+'" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg"></svg>');
			}
		}
		
		$(iframe).ready(function() {
			console.log('SVG iframe ready');
			var ifrm = $('#svgeditor-'+textarea.id).get(0);
			// waiting for real load
			(function(){
				try {
					ifrm.contentWindow.svgEditor.ready(function() { svgInit(ifrm);});
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
var imagePath='lib/jquery.sheet/images/';
pouchTransportConfig.editors.sheetEditor={
	mimes : ['text/sheet'], 
	init : function () {
		
		// sheet has to be included before this file
		$.sheet.menuLeft='<div><a href="#" onclick="sheetInstance.toggleFullScreen(); $(\'#lockedMenu\').toggle(); return false;" title="Toggle Full Screen"><img alt="Toggle Full Screen" src="'+imagePath+'arrow_out.png"/></a><a onclick="sheetInstance.cellUndoable.undoOrRedo(true); return false;" title="Undo"><img src="'+imagePath+'arrow_undo.png"/></a><a onclick="sheetInstance.cellUndoable.undoOrRedo(); return false;" title="Redo"><img src="'+imagePath+'arrow_redo.png"/></a><a onclick="sheetInstance.merge(); return false;" title="Merge"><img src="'+imagePath+'arrow_join.png"/></a><a onclick="sheetInstance.unmerge(); return false;" title="Unmerge"><img src="'+imagePath+'arrow_divide.png"/></a><a href="#" onclick="sheetInstance.cellStyleToggle(\'styleWrap\'); return false;" title="Wrap Text"><img  src="'+imagePath+'text_horizontalrule.png"/></a><a href="#" onclick="sheetInstance.fillUpOrDown(); return false;" title="Fill Down"><img alt="Fill Down" src="'+imagePath+'arrow_down.png"/></a><a href="#" onclick="sheetInstance.fillUpOrDown(true); return false;" title="Fill Up"><img alt="Fill Up" src="'+imagePath+'arrow_up.png"/></a></div>';
		$.sheet.menuRight='<div><a class="cellStyleToggle" onclick="sheetInstance.fontReSize(\'up\');  return false;" title="Font Size -"><img src="'+imagePath+'font_add.png"/></a><a class="cellStyleToggle" onclick="sheetInstance.fontReSize(\'down\'); return false;" title="Font Size +"><img src="'+imagePath+'font_delete.png"/></a>  <a href="#" onclick="sheetInstance.cellStyleToggle(\'styleBold\'); return false;" title="Bold"><img alt="Bold" src="'+imagePath+'text_bold.png"/></a><a href="#" onclick="sheetInstance.cellStyleToggle(\'styleItalics\'); return false;" title="Italic"><img alt="Italic" src="'+imagePath+'text_italic.png"/></a><a href="#" onclick="sheetInstance.cellStyleToggle(\'styleUnderline\', \'styleLineThrough\'); return false;" title="Underline"><img alt="Underline" src="'+imagePath+'text_underline.png"/></a><a href="#" onclick="sheetInstance.cellStyleToggle(\'styleLineThrough\', \'styleUnderline\'); return false;" title="Strikethrough"><img alt="Strikethrough" src="'+imagePath+'text_strikethrough.png"/></a><a href="#" onclick="sheetInstance.cellStyleToggle(\'styleLeft\', \'styleCenter styleRight\'); return false;" title="Align Left"><img alt="Align Left" src="'+imagePath+'text_align_left.png"/></a><a href="#" onclick="sheetInstance.cellStyleToggle(\'styleCenter\', \'styleLeft styleRight\'); return false;" title="Align Center"><img alt="Align Center" src="'+imagePath+'text_align_center.png"/></a><a href="#" onclick="sheetInstance.cellStyleToggle(\'styleRight\', \'styleLeft styleCenter\'); return false;" title="Align Right"><img alt="Align Right" src="'+imagePath+'text_align_right.png"/></a><span class="colorPickers"><input title="Foreground color" class="colorPickerFont" style="background-image: url(\''+imagePath+'palette.png\') ! important; width: 16px; height: 16px;"/><input title="Background Color" class="colorPickerCell" style="background-image: url(\''+imagePath+'palette_bg.png\') ! important; width: 16px; height: 16px;"/></span></div>';
		if ($.fn.sheet) {
				//console.log('show sheet');
				try {
					$.sheet.preLoad("lib/jquery.sheet/");
				} catch (e) {console.log('sheet err',e);}
		} else  {
			if (false) console.log('sheet lib not loaded');	
		}
	},
	load : function(textarea) {
		//console.log('LOAD SHEET',textarea.id,document.getElementById(textarea.id));
		var sheet=$("<div id='sheet-"+textarea.id+"' ></div>");
		var si=sheet.data('sheetInstance'); // sheet instance
		sheet.html($.sheet.dts.toTables.xml($('#'+textarea.id).val()));
		$('#'+textarea.id).hide().after(sheet);
		sheet.sheet({
				menuLeft: function(jS) { return  $.sheet.menuLeft.replace(/sheetInstance/g, "$.sheet.instance[" + jS.I + "]"); },
				menuRight: function(jS) { 
					var menu = $.sheet.menuRight.replace(/sheetInstance/g, "$.sheet.instance[" + jS.I + "]"); menu = $(menu); menu.find('.colorPickerCell').colorPicker().change(function(){ $.sheet.instance[jS.I].cellChangeStyle('background-color', $(this).val()); }); menu.find('.colorPickerFont').colorPicker().change(function(){ $.sheet.instance[jS.I].cellChangeStyle('color', $(this).val());}); menu.find('.colorPickers').children().eq(1).css('background-image', "url('"+imagePath+"palette.png')");  menu.find('.colorPickers').children().eq(3).css('background-image', "url('"+imagePath+"palette_bg.png')");return menu;}
			});
	},
	save : function(textarea, editor) {
		var sheet=$("#sheet-"+textarea.id);
		var si=sheet.data('sheetInstance'); // sheet instance
		if (si) {
			var toSave=$('<div />').html($.sheet.dts.fromTables.xml(si)+' ').html()
			$('#'+textarea.id).val(toSave);
		}
	}
}
$(document).ready(function() {
	$.each(pouchTransportConfig.editors,function(key,val) {
		if (typeof val.init=='function') {
			val.init();
		}
	});

});