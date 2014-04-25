function test() {
	pouchTransport.tree.getAllChildren('pouchlocalfilesystem_1').then(function() {
	//	console.log('AA',arguments);
	});
}



var pouchTransport={
	options: {
		dbs:[
			{name : 'pouchlocalfilesystem', description: 'local pouch',connectionString : 'filesystem',syncWith:{}},
			{name : 'pouchdblocalhostfilesystem', description: 'localhost pouch',connectionString : 'http://localhost:5984/filesystem',syncWith:{}},
			//{name : 'pdouchdblocalhostfilesystem', description: 'ddlocal pouch',connectionString : 'http://localhost:5894/filesystem',syncWith:{}}
		]
	}
};

	
// INIT ELFINDER					

$(document).ready(function() {
//test();
	//return;
	tinyMCE.init({ewidth:1000}); 
	
	$('#finder').elfinder({
		// requestType : 'post',

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
			navbar : ['open', '|', 'copy', 'cut', 'paste', 'duplicate', '|', 'rm', '|', 'info'],

			// current directory menu
			cwd    : ['reload', 'back', '|', 'upload', 'mkdir', 'mkfile', 'paste', '|', 'info'],

			// current directory file menu
			files  : [
				'getfile', '|','open', 'quicklook', '|', 'download', '|', 'copy', 'cut', 'paste', 'duplicate', '|',
				'rm', '|', 'edit', 'rename', 'resize', '|', 'archive', 'extract', '|', 'info'
			]
		},
		ui :['toolbar', 'places', 'tree', 'path', 'stat'],
		uiOptions : {
			// toolbar configuration
			toolbar : [
				['back', 'forward'],
				// ['reload'],
				// ['home', 'up'],
				['mkdir', 'mkfile', 'upload'],
				['copy', 'cut', 'paste'],
				['search'],
				['view','quicklook'],
				['help']
			]
		},
		commandsOptions : {
			edit : {
				mimes : ['text/plain', 'text/html', 'text/javascript'], //types to edit
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
				}]
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