<script>
// create the blob object storing the data to compress
var blob = new Blob([ "Lorem ipsum dolor sit amet, consectetuer adipiscing elit..." ], {
  type : "text/plain"
});
// creates a zip storing the file "lorem.txt" with blob as data
// the zip will be stored into a Blob object (zippedBlob)
zipBlob("lorem.txt", blob, function(zippedBlob) {
  // unzip the first file from zipped data stored in zippedBlob
  unzipBlob(zippedBlob, function(unzippedBlob) {
    // logs the uncompressed Blob
    console.log(unzippedBlob);
  });
});

function zipBlob(filename, blob, callback) {
  // use a zip.BlobWriter object to write zipped data into a Blob object
  zip.createWriter(new zip.BlobWriter("application/zip"), function(zipWriter) {
    // use a BlobReader object to read the data stored into blob variable
    zipWriter.add(filename, new zip.BlobReader(blob), function() {
      // close the writer and calls callback function
      zipWriter.close(callback);
    });
  }, onerror);
}

function unzipBlob(blob, callback) {
  // use a zip.BlobReader object to read zipped data stored into blob variable
  zip.createReader(new zip.BlobReader(blob), function(zipReader) {
    // get entries from the zip file
    zipReader.getEntries(function(entries) {
      // get data from the first file
      entries[0].getData(new zip.BlobWriter("text/plain"), function(data) {
        // close the reader and calls callback function with uncompressed data as parameter
        zipReader.close();
        callback(data);
      });
    });
  }, onerror);
}

function onerror(message) {
  console.error(message);
}	



/*(function(obj) {

	var model = (function() {
		var fs = new zip.fs.FS(), requestFileSystem = obj.webkitRequestFileSystem || obj.mozRequestFileSystem || obj.requestFileSystem, URL = obj.webkitURL
				|| obj.mozURL || obj.URL;

		function createTempFile(callback) {
			var tmpFilename = "__tmp__";
			requestFileSystem(TEMPORARY, 4 * 1024 * 1024 * 1024, function(filesystem) {
				function create() {
					filesystem.root.getFile(tmpFilename, {
						create : true
					}, function(zipFile) {
						callback(zipFile);
					});
				}

				filesystem.root.getFile(tmpFilename, null, function(entry) {
					entry.remove(create, create);
				}, create);
			});
		}

		return {
			addDirectory : function(name, parent) {
				parent.addDirectory(name);
			},
			addFile : function(name, blob, parent) {
				parent.addBlob(name, blob);
			},
			getRoot : function() {
				return fs.root;
			},
			getById : function(id) {
				return fs.getById(id);
			},
			remove : function(entry) {
				fs.remove(entry);
			},
			rename : function(entry, name) {
				entry.name = name;
			},
			exportZip : function(entry, onend, onprogress, onerror) {
				var zipFileEntry;

				function onexport(blob) {
					var blobURL;
					if (requestFileSystem)
						onend(zipFileEntry.toURL(), function() {
						});
					else {
						blobURL = URL.createObjectURL(blob);
						onend(blobURL);
					}
				}

				if (requestFileSystem)
					createTempFile(function(fileEntry) {
						zipFileEntry = fileEntry;
						entry.exportFileEntry(zipFileEntry, onexport, onprogress, onerror);
					});
				else
					entry.exportBlob(onexport, onprogress, onerror);
			},
			importZip : function(blob, targetEntry, onend, onprogress, onerror) {
				targetEntry.importBlob(blob, onend, onprogress, onerror);
			},
			getBlobURL : function(entry, onend, onprogress, onerror) {
				entry.getBlob(zip.getMimeType(entry.filename), function(blob) {
					var blobURL = URL.createObjectURL(blob);
					onend(blobURL, function() {
						URL.revokeObjectURL(blobURL);
					});
				}, onprogress, onerror);
			}
		};
	})();

	(function() {
		var progressExport = document.getElementById("progress-export-zip");
		var tree = document.getElementById("tree");
		var listing = document.getElementById("listing");
		var selectedDir, selectedFile, selectedLabel, selectedLabelValue, selectedDrag, hoveredElement;

		function onerror(message) {
			alert(message);
		}

		function getFileNode(element) {
			return element ? model.getById(element.dataset.fileId) : model.getRoot();
		}

		function getFileElement(element) {
			while (element && !element.dataset.fileId)
				element = element.parentElement;
			return element;
		}

		function stopEvent(event) {
			event.stopPropagation();
			event.preventDefault();
		}

		function expandTree(node) {
			if (!node)
				node = model.getRoot();
			if (node.directory) {
				node.expanded = true;
				node.children.forEach(function(child) {
					expandTree(child);
				});
			}
		}

		function onexport(isFile) {
			function downloadBlobURL(target, filename) {
				return function(blobURL) {
					var clickEvent = document.createEvent("MouseEvent");
					progressExport.style.opacity = 0.2;
					progressExport.value = 0;
					progressExport.max = 0;
					clickEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
					target.href = blobURL;
					target.download = filename;
					target.dispatchEvent(clickEvent);
					target.href = "";
					target.download = "";
				};
			}

			function onprogress(index, end) {
				progressExport.value = index;
				progressExport.max = end;
			}

			return function(event) {
				var filename, target = event.target, node;
				if (!target.download) {
					node = getFileNode(isFile ? selectedFile : selectedDir);
					filename = prompt("Filename", isFile ? node.name : node.parent ? node.name + ".zip" : "example.zip");
					if (filename) {
						progressExport.style.opacity = 1;
						progressExport.offsetHeight;
						if (isFile)
							model.getBlobURL(node, downloadBlobURL(target, filename), onprogress, onerror);
						else
							model.exportZip(node, downloadBlobURL(target, filename), onprogress, onerror);
						event.preventDefault();
					}
				}
			};
		}

	})();

})(this);*/
</script>