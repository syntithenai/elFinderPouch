
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
					d.resolve(new Blob(['']));
				} else {
					d.resolve(attResponse);
				}
			});
		} else {
			d.resolve(new Blob(['']));
		}
		return d;
	},
	putAttachment : function(target,content,extraProperties) {
		var d=$.Deferred();
		var db=pouchTransport.utils.getDatabase(target);
		if (db && target && content) {
			db.get(pouchTransport.utils.keyFromHash(target),function(err,response) {
				response.size=content.length;
				response.ts=Date.now();
				//if (typeof extraProperties=='object') $.extend(response,extraProperties);
				db.put(response,function(err,putResponse) {
					db.putAttachment(pouchTransport.utils.keyFromHash(target),'fileContent',putResponse.rev,new Blob([content]),response.mime,function(err,attResponse) {
						d.resolve(response);
					});
				});
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
				var p=database.connectionString.substr(0,7);
				if (p!='http://' && p!='https:/') {
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
				var p=database.connectionString.substr(0,7);
				if (p=='http://' || p=='https:/') {
					// have config but connect string not http://
					ret=true;
				}
			}
		});
		return ret;
	},
	zipFiles : function (files, getContent, oninit, onadd, onprogress, onend) {
		var addIndex = 0;
		var zipWriter;
		function nextFile() {
			var file = files[addIndex];
			onadd(file);
			if (file && file.name) {
				getContent(file).then(function(content) {
					console.log('got content',content);
					var path='';
					if (file.path) path=file.path;
					zipWriter.add(path+file.name, new zip.BlobReader(content), function() {
						console.log('added to zip',addIndex);
						addIndex++;
						if (addIndex < files.length)
							nextFile();
						else {
							zipWriter.close(onend);
						}
					}, onprogress);
				});
			} else {
				//onend
			}
		}

		function createZipWriter() {
			zip.createWriter(writer, function(writer) {
				zipWriter = writer;
				oninit();
				nextFile();
			}, onerror);
		}

		if (zipWriter)
			nextFile();
		else {
			writer = new zip.BlobWriter("application/zip");
			createZipWriter();
		}
	},
	unzipFiles : function (blob, fileCallback, callback) {
		console.log('unzip');
		// use a zip.BlobReader object to read zipped data stored into blob variable
		zip.createReader(new zip.BlobReader(blob), function(zipReader) {
		console.log('created reader');
			// get entries from the zip file
			zipReader.getEntries(function(entries) {
				console.log('got entrys',entries);
				// get data from the first file
				var promises=[];
				$.each(entries,function(key,entry) {
					var dfr=$.Deferred();
					console.log('request lentry data',entry);
					try {
						entry.getData(new zip.BlobWriter("text/plain"), function(data) {
								// close the reader and calls callback function with uncompressed data as parameter
								console.log('got entry data');
								if (typeof fileCallback=="function") fileCallback(entry,data);
								dfr.resolve(entry);
						});
					} catch (e) {
						console.log(e);
						dfr.resolve();
					}
					promises.push(dfr);
				});
				console.log('called for data');
				$.when.apply($,promises).then(function() {
					console.log('got final data',arguments);
					zipReader.close();
					if (typeof callback=="function") callback(arguments);
				})
			});
		}, onerror);
	},
	onerror : function(message) {
	  console.error(message);
	}	,
	mkSomething : function(cmd,name,target) {
		var d=$.Deferred();
		if (cmd && name && target) {
			//	console.log('MK have pars')
			var toAdd={
				name: name,
				phash : target,
				locked : 0,
				mime : 'directory',
				type : 'directory',
				read : 1,
				write:1,
				size :0,
				ts:Date.now()
			};
			if (cmd=='mkfile') {
				// TODO set mime by file extension
				toAdd.mime=MimeConverter.lookupMime(toAdd.name);
				toAdd.type='file';
			} 
			var db=pouchTransport.utils.getDatabase(toAdd.phash);
		//	console.log('MK ',toAdd,db)
			if (db) {
				db.post(toAdd,function(err,postResponse) {
					if (err) {
						console.log('ERROR',err);
					} else {
						toAdd._id=postResponse.id;
						toAdd._rev=postResponse.rev;
						toAdd.hash=pouchTransport.utils.volumeFromHash(target)+'_'+toAdd._id;
						db.put(toAdd,function(err,putResponse) {
							if (err) {
								console.log('ERROR',err);
								d.reject();
							} else {
								d.resolve(toAdd);
							}
						});
					}
				});
			}
		}
		return d;
	},
	fixNameConflicts : function(targets,dst) {
		return $.Deferred().resolve(targets);
	}
}