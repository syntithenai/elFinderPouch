This plugin creates an image editor that offers resize, crop and filtering.
All features are implemented without any network requests.
The filters can be cludgy on slower machines with large images.

The element that is operated on becomes the editor.
The image needs to configured in plugin options.
THIS MAY CHANGE.


!Basic Usage
    <script type="text/javascript" src="lib/jquery-ui/js/jquery.js"></script>
    <script type="text/javascript" src="lib/glfx.js"></script>
    <script type="text/javascript" src="lib/jquery-ui/js/jquery-ui.js"></script>
	<script type="text/javascript" src="lib/jquery.imageeditor.js"></script>
	<script type="text/javascript" src="lib/jquery.imageeditor.ext.js"></script>
	<link href="lib/jquery-ui/css/smoothness/jquery-ui.css" rel="Stylesheet" type="text/css" /> 
	<link href="lib/jquery.imageeditor.css" rel="Stylesheet" type="text/css" /> 
<style>

</style>
<script>
	var image= $('img.rotateresize');
	image.hide();
	var imageeditor = $('.imageeditorcontainer').imageeditor({
            width:$(window).width()*0.48,
            height:$(window).height()*0.9,
            image:{
                source:image.attr('src'),
                width:image.width(),
                height:image.height(),
            },
        });
	
	
! TODO
-image scaling. Crop operations scale to the current image view size which may be much smaller than the real image size.
Need to crop at full size.
- web workers for ImageDetails from canvas
- image as base selector for plugin - generate plugin div
- resizable editor
- set location of perspective nubs
- tidy and document
	-review design pattern.Use of $.fn.cropzoom.  for static functions.
- package as web app/bookmarklet
