
pouchTransportConfig.readers={};
// This will be called when the Epub object is fully initialized and
// ready to get passed to the Monocle.Reader.
pouchTransportConfig.readers.createReader=function(bookDataBlob,domElement) {
	// create monocle reader in domELement
//	var domId=domElement.id;
	console.log('CREATE READER',bookDataBlob,domElement)
	var doRead = function(bookData) {
		console.log('doread',domElement.attr('id'),bookData,domElement);
		Monocle.Reader(domElement.attr('id'), bookData,  // The id of the reader element and the book data.
			{ flipper: Monocle.Flippers.Instant,  // The rest is just fanciness:
			  panels: Monocle.Panels.Magic },     // No animation and click anywhere
			function (reader) {                   // to turn pages.
				console.log('READER CALLBACK',reader);
				var stencil = new Monocle.Controls.Stencil(reader);  // Make internal links work.
				reader.addControl(stencil);
				var toc = Monocle.Controls.Contents(reader);         // Add a table of contents.
				reader.addControl(toc, 'popover', { hidden: true });
				pouchTransportConfig.readers.createBookTitle(reader, { start: function () { reader.showControl(toc); } });
				$(domElement).css({height: $(domElement).parent().parent().height()*0.95,zindex:999});
			}
		);
	}
	var epub = new Epub(bookDataBlob, doRead);    
	console.log('sent epub request');
}

// This adds the book title to the top of each page.
pouchTransportConfig.readers.createBookTitle=function(reader, contactListeners) {
	console.log('create book title');
    var bt = {}
    bt.createControlElements = function () {
        cntr = document.createElement('div');
        cntr.className = "bookTitle";
        runner = document.createElement('div');
        runner.className = "runner";
        runner.innerHTML = reader.getBook().getMetaData('title');
        cntr.appendChild(runner);
        if (contactListeners) {
            Monocle.Events.listenForContact(cntr, contactListeners);
        }
        return cntr;
    }
    reader.addControl(bt, 'page');
    return bt;
}
