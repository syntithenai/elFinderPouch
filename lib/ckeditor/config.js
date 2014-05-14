/**
 * @license Copyright (c) 2003-2013, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.html or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function( config ) {
	// Define changes to default configuration here.
	// For complete reference see:
	// http://docs.ckeditor.com/#!/api/CKEDITOR.config
config.dtoolbarGroups = [
    { name: 'all',   groups: [ 'document','other' ] }
];
config.ftoolbar = [
		{ name: 'document', items: [ 'Source','Maximise','Print', 'Show Blocks','Find','Replace', 'Templates' ] },
		
		//'/',
		//{ name: 'content', items: [ 'Link','Unlink','Anchor','Insert Bulleted List','Insert Numbered List','Image','Insert All Medias','Table','Create Div Container','Blockquote','IFrame','Insert Horizontal Rule','Insert Page Break for Printing','Insert Symbol','Insert code snippet','Insert Equation','Embed Youtube Video','Leaflet Map','Insert a ZS Google QR-Code picture','Templates'] },
		//{ name: 'form', items: ['Form','Text Field','Textarea','Button','Image Button','Selection Field','Radio Button','Checkbox','Hidden Field'] },
		//'/',
		//{ name: 'formatting', items: [ 'Remove Format','Align Right','Align Left','Center','Justify','Increase Indent','Decrease Indent','Italic','Bold','Underline','Strike Through','Subscript','Superscript'] }
	];
/*

'Insert All Medias','Insert Symbol','Insert code snippet','Insert Equation','Embed Youtube Video','Leaflet Map','Insert a ZS Google QR-Code picture','Templates'] },


styles
insert special

*/



	// The toolbar groups arrangement, optimized for two toolbar rows.
};
