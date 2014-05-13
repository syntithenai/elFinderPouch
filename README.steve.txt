Pouch Transport for ElFinder

This version of elFinder has been hacked to allow pouchdb based file systems so that I can take advantage of the automatic and live synchronisation features.
In so far as possible the implementation is strictly as a transport layer so that I maintain compatibility with ftp and mysql and www local filesystems.

Better to deal with an online database via sync


CURRENT
IMAGEEDITOR

BUG ON paste - parents and attachments are ..
zip - BUG unzip all in same folder
paste


LICENSES
jquery, jquery ui - MIT
elfinder - BSD
svg-edit - MIT
mceedit - GPL
codemirror - MIT
jquery.sheet - MIT
monocle - MIT
json editor - Apache
image editor - 
	glfs - MIT
	cropzoom - MIT
zip - BSD
crypto - MIT
pouch - Apache
plucked audio editor - ?




DONE
- download needs to do object urls, create link click
- regroup buttons and tidy top toolbar
- quicklook
- thumbnails
- multi db search 
- upload by folder BUG - all in same folder
- full size edit, preview dialogs
- open needs to switch as per my preferences eg default view
- edit form buttons to top of dialog
- sheet
JSON EDITOR


BUGS
- save file on paste

TODO  release 1
-download folder (AZ ZIP)
- rename on paste
- paste
- get info (sum sizes /per file)
- epub reader
- elFInder integration back into RTE and svg edit
- svg edit
- plugin file editors
	- jquery sheet - initially only .sheet.html files
	- codemirror text editor
	- readium
	- audio editing + audio/video record webcam
- encfs lock file
- live sync

DREAMS
- editable images/svg in the RTE
- live collaboration
- revisions diff
	- merging
		- auto
- integrated media playlist
	- media management features
	- playlist management
	- music player - playlists ...folders 
- metadata based filesystem views
	- type
	- date, names, genre, ...
- paste
	- merge
- media sources - facebook, rss, twitter, html scrape ?, email, search
- email client
- modify selection model for touch so ctrl key is not required on tablet
- upload progress
- pouch connection/sync/publish settings
- sync progress
- quickdb records ??
- quickdb configuration
- animation editing ajax animator
- video editing
- presentations and layouts = add pages to svg edit
- dropbox, google docs, webdav ..
- remote transfers - currently all data runs through the browser controlling the copy. remote to remote copy should be direct if possible
-- ssh client
-FTP sync








LOG
27/4/14
most of the way through paste
bugs in zip and upload folder but mostly OK
looked at mp3 encoding/decoding 
29/4
syntithenai website to couch as couchapp
track couchapp tut

virtual host settings
redirect settings
cors settings (needed header)
30/4
looked at dropbox, epub readers
first look at security add pw to localhost and iris - need to udpate cors settings to allow credentials and add headers
1/5
search on steroids - multi database search, searchable flag in db config, tokenised search with multi tokens
document/review functions across pouchTransport
