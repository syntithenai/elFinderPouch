function test() {
	pouchTransport.tree.getAllChildren('pouchlocalfilesystem_1').then(function() {
	//	console.log('AA',arguments);
	});
}



var pouchTransport={
	options: {
		dbs:[
			{name : 'pouchlocalfilesystem', description: 'local pouch',connectionString : 'filesystem',syncWith:{},searchable:true,writable:false},
			//{name : 'pouchlocalfilesystem', description: 'local pouch',connectionString : 'filesystem',syncWith:{}},
			{name : 'pouchdblocalhostfilesystem', description: 'localhost pouch',connectionString : 'http://stever:wtfaid72@localhost:5984/filesystem',syncWith:{},searchable:true},
			//{name : 'irisfilesystem', description: 'iris',connectionString : 'http://stever:wtfaid72@syntithenai.iriscouch.com/filesystem',syncWith:{},searchable:false},
			//{name : 'pdouchdblocalhostfilesystem', description: 'ddlocal pouch',connectionString : 'http://localhost:5894/filesystem',syncWith:{}}
		]
	}
};

	
// INIT ELFINDER					

$(document).ready(function() {
//test();
	//return;
	tinyMCE.init({}); 
	var codeMirrorEditor;
	if ($.fn.sheet) {
			//console.log('show sheet');
			try {
				$.sheet.preLoad("/elFinderPouch/jquery.sheet/");
			} catch (e) {console.log('sheet err',e);}
	} else  {
		if (false) console.log('sheet lib not loaded');	
	}
	var codeMirrorPlain={
		mimes : ['text/plain'], 
		load : function(textarea) {
			console.log('LOAD CODEMIRROR',textarea.id,document.getElementById(textarea.id));
			codeMirrorEditor = CodeMirror.fromTextArea(document.getElementById(textarea.id), {
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
	var codeMirrorSQL=$.extend({},codeMirrorPlain);
	codeMirrorSQL.mode='text/x-sql';
	codeMirrorSQL.mimes=["text/x-sql"];
	var codeMirrorCSS=$.extend({},codeMirrorPlain);
	codeMirrorCSS.mode='css';
	codeMirrorCSS.mimes=["text/css"];
	var codeMirrorJS=$.extend({},codeMirrorPlain);
	codeMirrorJS.mode='javascript';
	codeMirrorJS.mimes=["text/javascript"];
	var svgEditor={
		mimes : ['image/svg+xml'],
		load : function(textarea) {
			console.log('svg load');
			// append iframe to dom
			var iframe=$("<iframe id='svgeditor' width='900' height='550' src='svg-edit/svg-editor.html?extensions=ext-xdomain-messaging.js' />");
			$('#'+textarea.id).hide().after(iframe);
			
			var svgInit=function() {
				console.log('editor_ready();');
				var canvas = new EmbeddedSVGEdit(iframe[0]);	
				iframe.parent().data('canvas',canvas)	
				if ($.trim($('#'+textarea.id).val())!='') {
					canvas.setSvgString($('#'+textarea.id).val());
				} else {
					canvas.setSvgString('<svg width="640" height="480" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg"></svg>');
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
	var sheetEditor={
		mimes : ['text/sheet'], 
		load : function(textarea) {
			console.log('LOAD SHEET',textarea.id,document.getElementById(textarea.id));
			var sheet=$("<div id='sheet-"+textarea.id+"' ></div>");
			sheet.html($('#'+textarea.id).val());
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
				var sheetClone=si.tables();
				var toSave=$('<div />').html(sheetClone).html();
				$('#'+textarea.id).val(toSave);
			}
		},
	}
	





	
	$('#finder').elfinder({
		// requestType : 'post',
		//archivers:{'create':['application/zip']},
		// url : 'php/connector.php',
		url : 'php/connector.php',
		transport : pouchTransport,
		lang : 'en',
		//onlyMimes : ['text'],
		commands : [
			'open', 'reload', 'home', 'up', 'back', 'forward', 'getfile', 'quicklook', 
			'download', 'rm', 'duplicate', 'rename', 'mkdir', 'mkfile', 'upload', 'copy', 
			'cut', 'paste', 'edit', 'extract', 'archive', 'search', 'info', 'view', 'help',
			'resize', 'sort'
		],
		contextmenu : {
			// navbarfolder menu
			navbar : ['open', '|', 'copy', 'cut', 'paste', 'duplicate', '|', 'rm', '|'],

			// current directory menu
			cwd    : ['reload', 'back', '|', 'upload', 'mkdir', 'mkfile', 'paste', '|'],

			// current directory file menu
			files  : [
				'getfile','|','open', 'edit',  'resize', 'rename', '|', 'download',  'archive', 'extract','|', 'copy', 'cut', 'paste', 'duplicate', '|',
				'rm'
			]
		},
		ui :['toolbar', 'places', 'tree', 'path', 'stat'],
		uiOptions : {
			// toolbar configuration
			toolbar : [
				['home', 'up','back', 'forward'],
				// ['reload'],
				// [],
				['mkdir', 'mkfile', 'upload'],
				['copy', 'cut', 'paste'],
				['search'],
				['view','quicklook'],
				['help']
			]
		},
		commandsOptions : {
			edit : {
				mimes : [], //types to edit
				editors : [{
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
				},
				codeMirrorPlain,codeMirrorCSS,codeMirrorSQL,codeMirrorJS,
				svgEditor,sheetEditor
				
				]
			},
			quicklook : {
				autoplay: false,
				//width: '70%',
			
			}
		}
		
		
	});

});




/*
commands : [
			'home', 'up', 'back', 'forward',
			'mkdir', 'mkfile', 'upload',
			'search', 'help',
			'sort'
		],
		contextmenu : {
			// navbarfolder menu
			navbar : ['open', '|', 'copy', 'cut', 'paste', 'duplicate', '|', 'rm', '|', 'info'],

			// current directory menu
			cwd    : ['back', '|', 'upload', 'mkdir', 'mkfile', 'paste', '|', 'info'],

			// current directory file menu
			files  : [
				'getfile', '|','open', 'quicklook', '|', 'download', '|', 'copy', 'cut', 'paste', 'duplicate', '|',
				'rm', '|', 'edit', 'rename', 'resize', '|', 'archive', 'extract', '|', 'info'
			]
		},
		
*/