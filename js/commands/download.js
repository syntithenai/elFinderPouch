"use strict";
/**
 * @class elFinder command "download". 
 * Download selected files.
 * Only for new api
 *
 * @author Dmitry (dio) Levashov, dio@std42.ru
 **/
elFinder.prototype.commands.download = function() {
	var self   = this,
		fm     = this.fm,
		filter = function(hashes) {
			return $.map(self.files(hashes), function(f) { return f.mime == 'directory' ? null : f });
		};
	
	this.shortcuts = [{
		pattern     : 'shift+enter'
	}];
	
	this.getstate = function() {
		var sel = this.fm.selected(),
			cnt = sel.length;
		
		return  !this._disabled && cnt && (!fm.UA.IE || cnt == 1) && cnt == filter(sel).length ? 0 : -1;
	}
	
	this.exec = function(hashes) {
		var fm      = this.fm,
			base    = fm.options.url,
			files   = filter(hashes),
			dfrd    = $.Deferred(),
			iframes = '',
			cdata   = '',
			i, url;
			
		if (this.disabled()) {
			return dfrd.reject();
		}
			
		if (fm.oldAPI) {
			fm.error('errCmdNoSupport');
			return dfrd.reject();
		}
		
		cdata = $.param(fm.options.customData || {});
		if (cdata) {
			cdata = '&' + cdata;
		}
		
		base += base.indexOf('?') === -1 ? '?' : '&';
		console.log('DOWNLOAD',files);
		
		function downloadLink(uri, name) {

			function eventFire(el, etype){
				if (el.fireEvent) {
					(el.fireEvent('on' + etype));
				} else {
					var evObj = document.createEvent('Events');
					evObj.initEvent(etype, true, false);
					el.dispatchEvent(evObj);
				}
			}

			var link = document.createElement("a");
			link.download = name;
			link.href = uri;
			eventFire(link, "click");

		}
		for (i = 0; i < files.length; i++) {
			console.log('DL PRE',files[i]);
			var url=base + 'cmd=file&target=' + files[i].hash+'&download=1'+cdata;
			if (pouchTransport.utils.isCouch(files[i].hash)) {
				console.log('HAVE COUCH');
				var srcParts=[pouchTransport.utils.getDatabaseConfig(files[i].hash).connectionString];
				srcParts.push(files[i]._id);
				srcParts.push('fileContent');
				console.log('open couch window',srcParts);
				window.open(srcParts.join("/"));
				//openWindow(file,srcParts.join("/"),dfrd);
				url=srcParts.join("/");
				downloadLink(url,files[i].name);
			} else if (pouchTransport.utils.isLocalPouch(files[i].hash))  {
			console.log('HAVE POUCH',files[i]);
				var pouch=JSON.parse(JSON.stringify(files[i]));
				pouchTransport.utils.getAttachment(pouch.hash).then(function(bs) {
				console.log('HAVE ATCH',bs,pouch);
					if (bs && pouch) {
						//var mimeParts=pouch.mime.split("/");
						//if (mimeParts[0]!='video') {
							//bs = new Blob([bs],{type: files[i].mime});
							//console.log('BS',bs);
							//openWindow(files[i],URL.createObjectURL(bs),dfrd);
						//} else {
							bs = new Blob([bs],{type: pouch.mime});
							url=URL.createObjectURL(bs);
							//window.open(URL.createObjectURL(bs));
							//openWindow(file,URL.createObjectURL(bs),dfrd);
						//}
						downloadLink(url,pouch.name);
					} else url='';
					
					//console.log('loaded attachment',files[i].name,files[i].hash);
				});
			} else {
				iframes += '<iframe class="downloader" id="downloader-' + files[i].hash+'" style="display:none" src="'+url+'"/>';
				$(iframes)
					.appendTo('body')
					.ready(function() {
						setTimeout(function() {
							$(iframes).each(function() {
								$('#' + $(this).attr('id')).remove();
							});
						}, fm.UA.Firefox? (20000 + (10000 * i)) : 1000); // give mozilla 20 sec + 10 sec for each file to be saved
					});
			}

		}
		fm.trigger('download', {files : files});
		return dfrd.resolve(hashes);
	}

}