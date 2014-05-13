

	
// INIT ELFINDER					

$(document).ready(function() {
//test();
	//return;
	//pouchTransportConfig.initEditors();
	//tinyMCE.init({}); 
	console.log('docready pouchtransport.js');
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
				// ['reload'],
				// [],
				['mkdir', 'mkfile', 'upload'],
				['copy', 'cut', 'paste'],
				['home', 'up','back', 'forward'],
				['view','quicklook'],
				['search'],
				['help']
			]
		},
		commandsOptions : {
			quicklook : {
				autoplay: false,
				//width: '70%',
			
			},
			edit : {
				mimes : [], //types to edit blank for all
				// special case editors sourced from pouchTransportConfig.editors.js
				editors : [ pouchTransportConfig.editors.HTMLEditor,
				pouchTransportConfig.editors.codeMirrorPlain,pouchTransportConfig.editors.codeMirrorCSS,pouchTransportConfig.editors.codeMirrorSQL,pouchTransportConfig.editors.codeMirrorJS,
				pouchTransportConfig.editors.svgEditor,pouchTransportConfig.editors.sheetEditor
				,pouchTransportConfig.editors.imageEditor,pouchTransportConfig.editors.JSONEditor
				]
			},
		}
		
		
	});
	console.log('docready pouchtransport.js called');

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