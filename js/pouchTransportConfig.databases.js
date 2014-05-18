var pouchTransport={
	editors: {},
	options: {
		maxSizeB64:350*1024,
		dbs:[
			{name : 'pouchlocalfilesystem', description: 'local pouch',connectionString : 'filesystem',syncWith:{},searchable:true,writable:false},
			//{name : 'pouchlocalfilesystem', description: 'local pouch',connectionString : 'filesystem',syncWith:{}},
			{name : 'pouchdblocalhostfilesystem', description: 'localhost pouch',connectionString : 'http://stever:wtfaid72@localhost:5984/filesystem',syncWith:{},searchable:true},
			//{name : 'irisfilesystem', description: 'iris',connectionString : 'http://stever:wtfaid72@syntithenai.iriscouch.com/filesystem',syncWith:{},searchable:false},
			//{name : 'pdouchdblocalhostfilesystem', description: 'ddlocal pouch',connectionString : 'http://localhost:5894/filesystem',syncWith:{}}
		]
	}
};