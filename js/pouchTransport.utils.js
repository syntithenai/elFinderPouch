
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
					match.name=v.name;
					match.connectionString=v.connectionString;
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
				//console.log('GET',err,attResponse);
				if (err) {
					//console.log('ERROR',err);
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
	save:function(toAdd,content) {
		//console.log('SAVE',toAdd);
		var dfr=$.Deferred();
		var db;
		function innerSave(toSave,content) {
			var idfr=$.Deferred();
			function doSave(toSave,idfr) {
				db.put(toSave,toSave._rev,function(err,putResponse) {
					console.log('INNER SAVED FILE responses',putResponse);
					if (!pouchTransport.utils.onerror(err)) {
						toSave._rev=putResponse.rev;
						if (content) {
							console.log('SAVE PUT ATTACH');
							db.putAttachment(toSave._id,'fileContent',toSave._rev,content,toSave.mime,function(err,res) {
								idfr.resolve(toSave);
								console.log('SAVE PUT ATTACH done');
							});
						} else {
							idfr.resolve(toSave);
						}
					} else {
						idfr.reject();
					}
				});
			}
			// ensure id/hash alignment and timestamp record
			toSave.hash=db.name+'_'+toSave._id;												
			toSave.ts=Date.now();
			// create thumbnails as object urls stored in record for some image types
			if (content.size>0 && (toSave.mime=="image/png" || toSave.mime=="image/jpeg" || toSave.mime=="image/gif" )) {
				//console.log('image create thumb');
				pouchTransport.utils.createThumbnail(toSave,window.URL.createObjectURL(content)).then(function(tmb) {
					toSave.tmb=tmb;
					console.log('got tmb ',tmb);
					doSave(toSave,idfr);
				});
			} else if (content.length>0 && toSave.mime=="image/svg+xml") {
				toSave.tmb=window.URL.createObjectURL(new Blob([content],{type:'image/svg+xml'}));
				//window.open(toSave.tmb);
				console.log('svg THUMB',toSave.tmb);
				doSave(toSave,idfr);
			} else {
				console.log('no thumb ',content,toSave);
				doSave(toSave,idfr);
			}
			//console.log('inner save',toSave,content);
			return idfr;
		}
		//console.log('SAVE Start save',JSON.stringify(toAdd));
		//console.log(toAdd.name)
		if (toAdd.phash && toAdd.phash.length>0) {
			if (toAdd._id && $.trim(toAdd._id).length>0) {
				console.log('just save',toAdd);
				db=pouchTransport.utils.getDatabase(toAdd.phash);
				// straight to put
				innerSave(toAdd,content).then(function(result) {
					dfr.resolve(result);
				});
			} else {
				// we need to post the record first
				db=pouchTransport.utils.getDatabase(toAdd.phash);
				var newToAdd={};
				$.each(toAdd,function(k,v) {
					if (k!='_id' && k!='_rev') newToAdd[k]=v;
				});
				console.log('initial save',newToAdd);
				
				db.post(newToAdd,function(err,postResponse) {
					if (!pouchTransport.utils.onerror(err)) {
						console.log('donoe',postResponse);
						newToAdd._id=postResponse.id;
						newToAdd._rev=postResponse.rev;
						newToAdd.hash=pouchTransport.utils.volumeFromHash(toAdd.phash)+'_'+postResponse.id;
						console.log('update with id',newToAdd,postResponse);
						innerSave(newToAdd,content).then(function(result) {
							dfr.resolve(result);
						});
					}
				});
			}
		} else {
			dfr.reject('No parent set when saving');
			console.log('No parent set when saving');
		}
		return dfr;
	},
	putAttachment : function(target,content,extraProperties) {
		var d=$.Deferred();
		console.log('DEPREC TODO FIX THISput attachment',target,content)
		return;	
		var db=pouchTransport.utils.getDatabase(target);
		if (db && target) {
			console.log('really put attachment',target,content)
			db.get(pouchTransport.utils.keyFromHash(target),function(err,response) {
				console.log('got rec',response)
				if (!pouchTransport.utils.onerror(err)) {
					response.size=content.length;
					response.ts=Date.now();
					
					//if (typeof extraProperties=='object') $.extend(response,extraProperties);
					function updateAndPutFile(response,target,content) {
						db.put(response,function(err,putResponse) {
							console.log('saved with updated size/ts/tmb',putResponse)
							if (!pouchTransport.utils.onerror(err)) {
								db.putAttachment(pouchTransport.utils.keyFromHash(target),'fileContent',putResponse.rev,new Blob([content]),response.mime,function(err,attResponse) {
									console.log('done put attachement',attResponse)
									d.resolve(response);
								});
							}
						});
					}
					console.log('PUT ATTCH RESPONSEd',response);
					if (response.mime=="image/png" || response.mime=="image/jpeg" || response.mime=="image/gif" ) {
							console.log('image create thumb');
						pouchTransport.utils.createThumbnail(response,content).then(function(tmb) {
							response.tmb=tmb;
							console.log('got tmb ',tmb);
							updateAndPutFile(response,target,content);
						});
					} else {
						updateAndPutFile(response,target,content);
					}
					
				}
			});
		}
		return d;
	},
	createThumbnail : function(target,base64Image) {
		//console.log('CT',target,base64Image) ;
		var dfr=$.Deferred();
			//fr.onload=function(e){
		var canvas = document.createElement("canvas");
		var img=new Image();
		var ctx = canvas.getContext("2d");
		var canvasCopy = document.createElement("canvas");
		var copyContext = canvasCopy.getContext("2d");
		img.onload = function() {
			//console.log('loaded',this)
			var maxWidth=60;
			var maxHeight=60;
			// Max size for thumbnail
			if(typeof(maxWidth) === 'undefined') var maxWidth = 500;
			if(typeof(maxHeight) === 'undefined') var maxHeight = 500;

			// Create and initialize two canvas
			var canvas = document.createElement("canvas");
			var ctx = canvas.getContext("2d");
			var canvasCopy = document.createElement("canvas");
			var copyContext = canvasCopy.getContext("2d");

			var ratio = 1;
			if(img.width > maxWidth) {
				ratio = maxWidth / img.width;
			} else if(img.height > maxHeight) {
				ratio = maxHeight / img.height;
			}

			//canvasCopy.width = img.width;
			//canvasCopy.height = img.height;
			//copyContext.drawImage(img, 0, 0,canvasCopy.width,canvasCopy.height);

			canvas.width = img.width * ratio;
			canvas.height = img.height * ratio;
			//console.log('TMB',ratio,img.height,img.width,canvas.height,canvas.width)
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
			dfr.resolve(canvas.toDataURL());
		};

		
			//img.src=e.target.result;
		img.src=base64Image;
		//}
		//fr.readAsDataURL(contentBlob);
		return dfr;
	},
	getDatabaseConfig : function(target) {
		var ret={};
		var volume=pouchTransport.utils.volumeFromHash(target);
		$.each(pouchTransport.options.dbs,function(k,database) {
			if ($.trim(volume)==$.trim(database.name)) {
				ret= database;
				ret.name=volume;
				ret.connectionString=database.connectionString;
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
					//console.log('got content',content);
					var path='';
					if (file.path) path=file.path;
					zipWriter.add(path+file.name, new zip.BlobReader(content), function() {
						//console.log('added to zip',addIndex);
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
		//console.log('unzip');
		// use a zip.BlobReader object to read zipped data stored into blob variable
		zip.createReader(new zip.BlobReader(blob), function(zipReader) {
		//console.log('created reader');
			// get entries from the zip file
			zipReader.getEntries(function(entries) {
				//console.log('got entrys',entries);
				// get data from the first file
				var promises=[];
				$.each(entries,function(key,entry) {
					var dfr=$.Deferred();
					//console.log('request lentry data',entry);
					entry.getData(new zip.BlobWriter("text/plain"), function(data) {
							// close the reader and calls callback function with uncompressed data as parameter
							//console.log('got entry data');
							if (typeof fileCallback=="function") fileCallback(entry,data);
							dfr.resolve(entry);
					});
					promises.push(dfr);
				});
				//console.log('called for data');
				$.when.apply($,promises).then(function() {
					//console.log('got final data',arguments);
					zipReader.close();
					if (typeof callback=="function") callback(arguments);
				})
			});
		}, onerror);
	},
	onerror : function(message) {
		if (message) {
			console.log('ERROR:',message);
			return true;
		} else {
			return false;
		}
		
	}	,
	mkSomething : function(cmd,name,target,fileContent) {
		// TODO - normalise to function utils.saveRecord for setting defaults in one place
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
			pouchTransport.utils.save(toAdd,'').then(function(savedRecord) {
				d.resolve(savedRecord);
			});
		}
		return d;
	},
	fixNameConflicts : function(targets,dst) {
		return $.Deferred().resolve(targets);
	},
	fileAsURL : function(file) {		
		var dfr=$.Deferred();
		// full couch database server direct from database
		if (pouchTransport.utils.isCouch(file.hash)) {
			var srcParts=[pouchTransport.utils.getDatabaseConfig(file.hash).connectionString];
			srcParts.push(file._id);
			url=srcParts.join("/");
			dfr.resolve(url);
		// local file, serve the whole file as a data url
		} else if (pouchTransport.utils.isLocalPouch(file.hash))  {
			var pouch=JSON.parse(JSON.stringify(file));
			pouchTransport.utils.getAttachment(pouch.hash).then(function(bs) {
				if (bs && pouch) {
					bs = new Blob([bs],{type: pouch.mime});
					url=URL.createObjectURL(bs);
					dfr.resolve(url);
				}
			});
		}
		return dfr;
	},
	encryption : function(check) {
		// PRIVATE FUNCTIONS
		var encode = function(text) {
			if (!password || password.length==0)  askKey();
			else updateTimeout();
			try {
				return CryptoJS.AES.encrypt(text, password, { format: JsonFormatter })+'';
			} catch (e) {
				console.log(e);
			}
		};
		var decode = function(encrypted) {
			if (!password || password.length==0)  askKey(encrypted);
			else updateTimeout();
			try {
				return CryptoJS.AES.decrypt(encrypted, password, { format: JsonFormatter }).toString(CryptoJS.enc.Utf8);
			} catch (e) {
				console.log(e);
			}
		}
		// PRIVATE
		var password;
		var timeout;
		var askKey = function() {
			password=prompt('Password');
			if (check) {
				if (encode('thisistheteststring')==check) {
					updateTimeout();
				} else {
					alert('wrong password');
				}
			} else {
				updateTimeout();
			}
		};
		var updateTimeout = function() {
			if (timeout) clearTimeout(timeout);
			timeout=setTimeout(function() {
				password='';
			},5000);
			return timeout;
		}
		var JsonFormatter = {
			stringify: function (cipherParams) {
				// create json object with ciphertext
				var jsonObj = {
					ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64)
				};

				// optionally add iv and salt
				if (cipherParams.iv) {
					jsonObj.iv = cipherParams.iv.toString();
				}
				if (cipherParams.salt) {
					jsonObj.s = cipherParams.salt.toString();
				}

				// stringify json object
				return JSON.stringify(jsonObj);
			},

			parse: function (jsonStr) {
				// parse json string
				var jsonObj = JSON.parse(jsonStr);

				// extract ciphertext from json object, and create cipher params object
				var cipherParams = CryptoJS.lib.CipherParams.create({
					ciphertext: CryptoJS.enc.Base64.parse(jsonObj.ct)
				});

				// optionally extract iv and salt
				if (jsonObj.iv) {
					cipherParams.iv = CryptoJS.enc.Hex.parse(jsonObj.iv)
				}
				if (jsonObj.s) {
					cipherParams.salt = CryptoJS.enc.Hex.parse(jsonObj.s)
				}

				return cipherParams;
			}
		};
		// PUBLIC
		return {
			encode :encode,
			decode : decode
		};
		
	} 
}