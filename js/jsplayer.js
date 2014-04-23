var jsplayer = function (vars) {
	var player, rc, media, params, getNodePos = function (el) {
		var pos = {'x' : 0, 'y' : 0};
		if (el.offsetParent) {
			do {
				pos.x += el.offsetLeft;
				pos.y += el.offsetTop;
				el = el.offsetParent;
			} while(el);
		}
		return pos;
	}, getMousePos = function (e) {
		var o = e || window.event, pos = {'x': 0, 'y' : 0};
		if (e.pageX || e.pageY) {
			pos = {'x' : e.pageX, 'y' : e.pageY};
		} else if (e.clientX || e.clientY) {
			pos = {'x': e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft, 'y': e.clientY + document.body.scrollTop + document.documentElement.scrollTop};
		}
		return pos;
	}, secondsToMinutes = function (s) {
		var o = {'hour' : 0, 'min' : 0, 'sec' : 0};	
		if (typeof s !== 'number' || isNaN(s)) {
			s = 0;
		}
		o.min = Math.floor(s / 60);
		o.sec = Math.floor(s % 60);
		if (o.sec < 10) {
			o.sec = '0' + o.sec;
		}
		return o.min + ':' + o.sec;
	}, onUpdateTime = function () {
		player.querySelector('.time').innerHTML = secondsToMinutes(media.currentTime);
		if (media.duration) {
			player.querySelector('.duration').innerHTML = '/' + secondsToMinutes(media.duration);
			player.querySelector('.passed').style.width = Math.round(media.currentTime * player.querySelector('.timer').clientWidth / media.duration, 2) + 'px';
		}
	}, onSeeked = function () {
		params.status.innerHTML     = '';
		params.status.style.display = 'none';
		if (params.media.play) {
			media.play();
			player.querySelector('.play').innerHTML       = 'pause';
			player.querySelector('.volume').style.display = '';
		} else {
			media.pause();
			player.querySelector('.play').innerHTML       = 'play';
			player.querySelector('.volume').style.display = 'none';
		}
		onUpdateTime();
	}, onSeeking = function () {
		params.status.innerHTML     = 'Seeking...';
		params.status.style.display = '';
	}, onWait = function () {
		params.status.innerHTML  = 'Buffering...';
		params.status.style.display = '';
	}, onPlay = function() {
		if (media.paused) {
			params.media.play = true;
			media.play();
			params.status.innerHTML     = '';
			params.status.style.display = 'none';
			rc.querySelector('.play').innerHTML = 'pause';
			rc.querySelector('.volume').style.display = '';
			onUpdateTime();
		} else {
			params.media.play = false;
			media.pause();
			rc.querySelector('.play').innerHTML    = 'play';
			rc.querySelector('.volume').style.display = 'none';
		}	
	}, remoteControl = function(event) {
		var k = event.target.className.match(/(^|\s)(up|down|mute|rewind|play|timer|passed|zoom)(\s|$)/);
		if (k === null) {
			return;
		}
		switch (k[2]) {
			case 'zoom':
				if (parseInt(player.style.width, 10) !== params.width) {
					player.style.width  = params.width + 'px';
					player.style.height = params.dim.player - 10 + 'px';
					media.style.width   = params.width + 'px';
					media.style.height  = params.dim.media + 'px';
					event.target.style.textDecoration = '';

				} else {
					if (params.dim === undefined) {
						params.dim = {
							'media' : media.offsetHeight,
							'rc' : rc.offsetHeight,
							'player' : player.offsetHeight
						};
					}
					player.style.width  = params.width * 1.5 + 'px';
					player.style.height = params.dim.media * 1.5 + params.dim.rc + 'px';
					media.style.width  = params.width * 1.5 + 'px';
					media.style.height = params.dim.media * 1.5 + 'px';
					event.target.style.textDecoration = 'line-through';
				}
				break;
			case 'up':
				if (media.volume < 1.00) {
					var vol = media.volume + 0.1;
					if (vol > 1.0) {
						vol = 1.0;
					}
					media.volume = vol;
					if (media.volume === 1.0) {
						event.target.style.display = 'none';
					}
					rc.querySelector('.down').style.display = '';
					rc.querySelector('.mute').style.display = '';
				}
				break;
			case 'down':
				if (media.volume > 0.00) {
					var vol = media.volume - 0.1;
					if (vol < 0.0) {
						vol = 0.0;
					}
					media.volume = vol;
					if (media.volume === 0.0) {
						event.target.style.display = 'none';
						rc.querySelector('.mute').style.display = 'none';
					}
					rc.querySelector('.up').style.display = '';
				}
				break;
			case 'mute':
				if (media.muted === false) {
					media.muted = true;
					rc.querySelector('.up').style.display   = 'none';
					rc.querySelector('.down').style.display = 'none';
					event.target.style.textDecoration = 'line-through'; 
				} else {
					media.muted = false; 
					rc.querySelector('.up').style.display   = '';
					rc.querySelector('.down').style.display = '';
					event.target.style.textDecoration = ''; 
				}
				break;
			case 'rewind':
				media.currentTime = 0.00;
				break;
			case 'timer':
			case 'passed':
				var mouse = getMousePos(event), pos = getNodePos(rc.querySelector('.timer')), length = mouse.x - pos.x, width = rc.querySelector('.timer').clientWidth;
				if (length <= width && length > 0) {
					media.currentTime = Math.round(length * media.duration / width, 2);
					media.play();
					params.status.innerHTML     = '';
					params.status.style.display = 'none';
					rc.querySelector('.play').innerHTML = 'pause';
					rc.querySelector('.volume').style.display = '';
					onUpdateTime();			
				}
				break;
			case 'play':
				onPlay();
				break;
		}
	};

	this.init = function (v) {
		if (v.id === undefined) {
			alert('somes variables are not correctly specify please follow the instructions');
			return;
		}
		params = v;
		player = document.getElementById(params.id);
		var showInfo = player.getElementsByTagName('object').length == 0 && player.getElementsByTagName('embed').length == 0;
		//browsers that do not support querySelector exits here (ie: Opera 9-)
		if (!document.querySelector) {
			if (showInfo) {
				player.innerHTML = '<p>Your browser does not support <strong><code style="font-size:1.1em">querySelector<\/code><\/strong><\/p>';
			}
			return;
		}
		//browsers that do not support addEventListener exits here (ie: IE8-)
		if (!document.addEventListener) {
			if (showInfo) {
				player.innerHTML = '<p>Your browser does not support <strong><code style="font-size:1.1em">addEventListener<\/code><\/strong><\/p>';
			}
			return;
		}
		media = player.querySelector('audio, video');
		//browsers that do not support the media tags exit here...
		if (media.src === undefined) {
			if (showInfo) {
				player.innerHTML = '<p>Your browser does not support <a href="https://developer.mozilla.org/En/Using_audio_and_video_in_Firefox" target="blank">HTML media tag<\/a><\/p>'; 
			}
			return;
		}
                //clean hack to remove a bug? features in FF 3.1 beta 3
		if (/AUDIO/.test(media.nodeName)) {
			media.style.height = '0px';
		}
		if (v.width == undefined || parseInt(v.width,10) === 0) {
			v.width = (/AUDIO/.test(media.nodeName)) ? 400 : ((media.offsetWidth < 400) ? 400 : media.offsetWidth);
		}
		player.className += (player.className === '') ? 'mplayer' : ' mplayer';
		player.style.width = params.width + 'px';
		media.className  += (media.className === '') ? 'media' : ' media';
		rc = document.createElement('DIV'); // here we use the W3C method otherwise innerHTML just block the script :(
		rc.className = 'controls';
		player.appendChild(rc);
		//clean hack to remove a bug in FF 3.1 beta 2
		var o = player.querySelector('object'), txt = [];
		if (o) {
			o.parentNode.removeChild(o);
		}
		txt.push('<span class="timer"><span class="passed"><\/span><\/span>');
		txt.push('<span class="controller">');
		txt.push('<span class="btn play">play<\/span>&nbsp;|');
		txt.push('<span class="btn rewind">rewind<\/span>');
		if (/^video$/i.test(media.nodeName)) {
			txt.push('|&nbsp;<span class="btn zoom">zoom<\/span>');
		}
		txt.push('<span class="volume">&nbsp;|&nbsp;Volume : <span class="btn up">up&nbsp;<\/span><span class="btn down">down&nbsp;<\/span><span class="btn mute">mute<\/span><\/span>');
		txt.push('</span>');
		txt.push('<span class="timing"><span class="time">-:--<\/span><span class="duration">/-:--<\/span><\/span>');
		txt.push('<span class="seeking"><\/span>');
		rc.innerHTML = txt.join('\n');
		//the events are set..here and that's all!!!
		media.autoplay = false;
		media.controls = false;
		media.volume   = 0.50;
		media.addEventListener('click', onPlay , false);
		media.addEventListener('durationchange', onUpdateTime , false);
		media.addEventListener('timeupdate', onUpdateTime , false);
		media.addEventListener('seeked', onSeeked, false);
		media.addEventListener('seeking', onSeeking, false);
		media.addEventListener('waiting', onWait, false);
		params.status = player.querySelector('.seeking');
		params.status.style.display = 'none';
		params.media = {'play' : false};
		rc.addEventListener('click', remoteControl, false);
	};
	this.init(vars);
};