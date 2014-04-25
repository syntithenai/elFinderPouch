
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
		var match=null;
		if (typeof pouchTransport.dbs!='Object') pouchTransport.dbs={};
		$.each(pouchTransport.options.dbs,function(k,v) {
			if (v.name==pouchTransport.utils.volumeFromHash(target)) {
				if (pouchTransport.dbs[pouchTransport.utils.volumeFromHash(target)]) {
					match=pouchTransport.dbs[pouchTransport.utils.volumeFromHash(target)];
				} else {
					match=new PouchDB(v.connectionString);
					pouchTransport.dbs[pouchTransport.utils.volumeFromHash(target)]=match;
				}
			}
		});
		//console.log('GOTDB',match);
		return match;		
		//console.log('FAILED TO CREATE DB');
	},
	getAttachment :  function(target) {
		var d=$.Deferred();
		var db=pouchTransport.utils.getDatabase(target);
		if (db &&target) {
			var key=pouchTransport.utils.keyFromHash(target);
			//console.log('get',key);
			var db=pouchTransport.utils.getDatabase(target);
			db.getAttachment(key,'fileContent',function(err,attResponse) {
				console.log('GET',err,attResponse);
				if (err) {
					console.log('ERROR',err);
					d.resolve();
				} else {
					d.resolve(attResponse);
				}
			});
		}
		return d;
	},
	getDatabaseConfig : function(target) {
		var ret={};
		var volume=pouchTransport.utils.volumeFromHash(target);
		$.each(pouchTransport.options.dbs,function(k,database) {
			if ($.trim(volume)==$.trim(database.name)) {
				ret= database;
			}
		});
		return ret;
	},
	isLocalPouch : function(target) {
		var ret=false;
		var volume=pouchTransport.utils.volumeFromHash(target);
		$.each(pouchTransport.options.dbs,function(k,database) {
			//console.log("ISL",volume,database.name,database.connectionString);
			if ($.trim(volume)==$.trim(database.name)) {
				//console.log('cs',"|"+database.connectionString.substr(0,7)+"|");
				if (database.connectionString.substr(0,7)!='http://') {
					// have config but connect string not http://
					ret=true;
				}
			}
		});
		return ret;
	},
	isCouch : function(target) {
		var ret=false;
		var volume=pouchTransport.utils.volumeFromHash(target);
		$.each(pouchTransport.options.dbs,function(k,database) {
			//console.log("ISL",volume,database.name,database.connectionString);
			if ($.trim(volume)==$.trim(database.name)) {
				//console.log('cs',"|"+database.connectionString.substr(0,7)+"|");
				if (database.connectionString.substr(0,7)=='http://') {
					// have config but connect string not http://
					ret=true;
				}
			}
		});
		return ret;
	}
}