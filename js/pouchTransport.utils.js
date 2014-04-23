
if (pouchTransport=='undefined') pouchTransport={};
pouchTransport.utils = {
	keyFromHash : function(hash) {
		var parts=$.trim(hash).split("_");
		//console.log('KEYFROMHASH parts',parts);
		return parts[parts.length-1];
	},
	volumeFromHash : function(hash) {
		var parts=$.trim(hash).split("_");
		return parts[0];
	},
	// TODO make databases private - change plugin from object to function and return public methods
	getDatabase : function(target) {
		var p= pouchTransport.dbs[pouchTransport.utils.volumeFromHash(target)];
		console.log('GETDATABASE',p);
		return p;
	},
	initDatabases : function() {
		pouchTransport.dbs={};
		$.each(pouchTransport.options.dbs,function(key,value) {
			pouchTransport.dbs[value.name]=new PouchDB(value.connectionString);
			pouchTransport.dbs[value.name].pouchName=value.name;
			pouchTransport.dbs[value.name].connectionString=value.connectionString;
		});
		console.log('init dbs',pouchTransport.options.dbs,pouchTransport.dbs);
	}
}