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
	tinyMCE.init({ewidth:1000}); 
	
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
				}]
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