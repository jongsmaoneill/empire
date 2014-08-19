(function (window) {
	'use strict';

	var legacyLoaded = false;
	var legacyActive = false;
	var _adjuster = 140;
	var openTimeIvl;
	var allVideosLoaded = false;
	var allVideosComplete = false;
	var l_videoTrackCurrentPosition;

	var currentTime = 0;
	var currentVolume = 0;
	var intervalID = 0;

	var active = false;
	var introDismissed = false;

	var firstTime = true;

	var videos = {
		indonesia: null,
		india: null,
		srilanka: null,
		southafrica: null,
		// corners: null,
	};

	var videoTracker = {
		indonesia: null,
		india: null,
		srilanka: null,
		southafrica: null,
	}

	/*
	important elements that we may need to refer to again
	*/
	var zContainer,
		legacyContent,
		instructions;

	//canvas variables
	var seriously,
		target,
		leg_videos,
		layers,
		remainToLoad = 0,

		maskCanvas,
		cw,
		ch,
		ctx;

	function sizer() {

		console.log("In Legacy Sizer");

		var h, w;

		if (!active) {
			return;
		}

		h = $("#legacy_top").height();
		w = $("#legacy_top").width();
		//console.log("w: "+w+ ", h: " + h);
		var padtop = h * 0.11; // top of the main title
		//console.log("padtop: " + padtop);
		var matop = 40; // top of the matrix
		//var padtop = 84; // top of the main title
		var legbottom = 70; //offset of the bottom play button on the open screen
		var body = $('html body');
		var buffer = h - legbottom;
		//console.log("buffer = "+ buffer);
		var centering = (w/2) - 70;
		//console.log("centering = "+ centering);
		if($(".legacy_top:first").height() < 780){ // if this a wee screen
			padtop = 20;
			matop = 20;
			legbottom = 20;
		}

		$(".legacy_bottom").css("height",$(".legacy_top:first").height());

		$("#legacy_title").css({ 'padding-top': padtop });

		$("#mainarea").css({ "margin-top": matop });

		$(".vertical_line").css({ 'height' : h });
		$("#legacy_wline1").css({ 'height': h/2 });
		$("#legacy_wline2").css({ 'height': h/2 });

		w = ($("#legacy_main").width() - _adjuster);
		h = ($("#legacy_main").width() - _adjuster) * 0.31;
		var vtop = (($("#legacy_main").height() - h) / 2) - 50;

		// $("#legplay").css({ "bottom": legbottom, "margin-left": ($("#legacy_main").width() / 2) - 50 }).fadeIn(4000);
		$("#legmore").css({ "margin-left": ($("#legacy_main").width() / 2) - 90 });

		$("#legacymore").css({ "top" : buffer, "left": centering }).fadeIn(4000).on('click', function() {
			body.animate({scrollTop: ($('#legacy_main').offset().top) }, 1000);
			console.log("openScreen() in legacymore");
			console.log("[Legacy: legacymore listener] if not legacyLoaded, legacy openscreen");
			if(active && !introDismissed) {
				openScreen();
			} else {
				toggleButtonDisplay();
			}
		});
	}

	function playVideos() {

		if(audioactive) {
			audiostop();
		}

		var id;

		if (!allVideosLoaded) {
			for (id in videos) {
				if (videos.hasOwnProperty(id)) {
					if (!videos[id] || videos[id].readyState < 2) {
						return;
					}
				}
			}
			allVideosLoaded = true;
		}

		if (active && introDismissed) {
			for (id in videos) {
				if (videos.hasOwnProperty(id) && videos[id]) {
					// set videos to start later for testing
					//videos[id].currentTime = videos[id].duration - 20;
					videos[id].play();
				}
			}
		}

		console.log("[videoTracker] :" + videoTracker);
	}

	var fadeInAudio = function (video) {
		//console.log("In fadeInAudio");
		if(currentVolume <= 1){
			video.volume = currentVolume ;
			currentVolume += 0.07;
			//console.log(currentVolume);
		} else{
			clearTimeout(intervalID);
			currentVolume = 0;
			return;
		}

		intervalID = setTimeout(function() {fadeInAudio(video);}, 100);
	};

	function selectVideo(selectedId) {
		var video, id, container;
		for (id in videos) {
			if (videos.hasOwnProperty(id)) {
				video = videos[id];
				if (video) {
					// video.volume = (!selectedId || selectedId === id) ? 1 : 0;

					if(!selectedId){
						//do volume upp f
						video.volume = 0.75;
					} else if(selectedId === id){
						//fading stuff
						fadeInAudio(video); 
						//video.volume = 1;
					} else{
						video.volume = 0;
					}
				}
			}
		}

		container = $('#legacy_container_' + selectedId);
		console.log(container);
		//console.log(zContainer);
		container.zoomTo({targetsize:0.9, duration:600, root: zContainer, closeclick: true });
		// container.zoomTarget();	
	}

	function attachEvents() {
		/*
		Main page navigation buttons for getting out of Legacy
		*/
		$("#cradle_lbutton").on('click', function() {
			$('html body').animate({ scrollTop: ($('#legacy_top').offset().top) }, 1000, function() {
				animateButton(0);
			});
		});

		$("#migrants_lbutton").on('click', function() {
			$('html body').animate({ scrollTop: ($('#legacy_top').offset().top) }, 1000, function() {
				animateButton(2);
			});
		});

		$("#periphery_lbutton").on('click', function() {
			$('html body').animate({ scrollTop: ($('#legacy_top').offset().top) }, 1000,function(){
			 	animateButton(3);
			});
		});

		//play button that appears after first time instructions
		$("#l_play_bg").on('click', function() {
			playVideos();
			toggleButtonDisplay();
		});

		var cornerOrder = {
			indonesia: 1,
			srilanka: 2,
			india: 3,
			southafrica: 4
		};

		zContainer.click(function(evt){
			console.log("in zoom container");
			selectVideo(null);
			zContainer.zoomTo({ targetsize:0.5, duration:600, root: zContainer });
			evt.stopPropagation();
		});


		Object.keys(videos).forEach(function (id) {
			function selectMe(evt){
				selectVideo(id);
				evt.stopPropagation();
			}

			var corner = '#corner' + cornerOrder[id];
			$(corner).click(selectMe);
			$('#legacy_container_' + id).click(selectMe);
		});

	}

	function initScrollspy() {
		instructions.scrollspy({
			min: instructions.offset().top,
			onEnter: function(element, position) {

				if(active && !introDismissed) {
					openScreen();
				} else {
					toggleButtonDisplay();
				}
			},
			onLeave: function(element, position) {
				instructions.fadeOut();
			}
		});
	}

	function toggleButtonDisplay() {
		if(videos != null) {
			Object.keys(videos).forEach(function(id) {
				if(active && videos[id].paused) {
					console.log("Toggle periphery play button on");
					$("#l_play_bg").fadeIn();
				} else {
					console.log("Toggle periphery play button off");
					$("#l_play_bg").fadeOut();
				}
			})
			
		}
	}

	function initVideos() {
		Object.keys(videos).forEach(function (id) {
			var video = document.getElementById(id + '_leg');
			video.addEventListener('canplay', function () {
				console.log('[ Legacy : Canplay Event ] ' + id + ' Video');
				// load metadata into VideoTracker object
				videoTracker[id] = {};
				videoTracker[id].totalDuration = video.duration;
				videoTracker[id].durationPlayed = 0;
				videoTracker[id].complete = false;
				console.log(videoTracker[id]);
				
			});

			video.addEventListener('ended', function (evt) {

				console.log('[ Legacy : ] ' + id + ' has ended');
				
				//zContainer.zoomTo({ targetsize:0.5, duration:600, root: zContainer });

				console.log(evt.srcElement.id);
				var string = evt.srcElement.id;
				var index = string.split('_');
				videoTracker[index[0]].complete = true;
				var count = 0;
				Object.keys(videoTracker).forEach(function (id) {
					
					if(videoTracker[id].complete){
						count++;
					}
					if(count >= 4){
						console.log('[ Legacy : ] All videos complete.');
						zContainer.zoomTo({ targetsize:0.5, duration:600, root: zContainer });
						playVideos();
						//TODO: buildEndScreen();
					}
					
				});

				//for volume
				selectVideo(null);
			});

			video.addEventListener('timeupdate', function (evt) {
				Object.keys(videoTracker).forEach(function (id) {
					//TODO - add function that keeps track of time watched for each film
					//console.log('[ Legacy : ] ' + id + ' is playing');
					//console.log(evt.srcElement.id);
					var string = evt.srcElement.id;
					var index = string.split('_');


				});
			});


			video.load();
			videos[id] = video;
		});
	}

	function initCanvas() {
		seriously = new Seriously();
		target = seriously.target('#canvas');
		leg_videos = document.querySelectorAll('.legacy-video');

		maskCanvas = document.createElement('canvas');
		maskCanvas.width = cw = target.width;
		maskCanvas.height = ch = target.height;
		ctx = maskCanvas.getContext('2d');
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, target.width, target.height);
		ctx.globalCompositeOperation = 'destination-out';
		ctx.beginPath();
		ctx.moveTo(cw / 2, 0);
		ctx.lineTo(cw, ch / 2);
		ctx.lineTo(cw / 2, ch);
		ctx.lineTo(0, ch / 2);
		ctx.lineTo(cw / 2, 0);
		ctx.fill();

		layers = seriously.effect('layers', {
			count: leg_videos.length + 1
		});

		console.log(layers);
		layers['source' + leg_videos.length] = maskCanvas;
		target.source = layers;

		Array.prototype.forEach.call(leg_videos, function (video, index) {
			var move = seriously.transform('2d'),
				crop = seriously.effect('crop'),
				reformat = seriously.transform('reformat');

			crop.source = video;
			crop.top = 10;
			crop.bottom = 32;

			// reformat node needed to make the layers node big enough
			reformat.source = crop;
			reformat.mode = 'none';
			reformat.height = target.height;
			reformat.width = Math.round(target.height  * 960 / (304 - 32 - 10));

			move.source = reformat;
			//move.scale(0.5); // optional, here if you need it

			layers['source' + index] = move;

			video.onloadedmetadata = function () {
				// we don't know how much to move the videos until we know their dimensions
				var x = (index % 2 ? 1 : -1),
					y = (index < 2 ? -1 : 1);

				move.translateX = x * crop.width / 2 * move.scaleX;
				move.translateY = y * crop.height / 2 * move.scaleY;
			};
		});

		seriously.go();
	}


	function init() {
		legacyContent = $("#legacyContent");
		zContainer = $("#z_container");
		instructions = $("#l_instructions");

		// initVideos();
		sizer();
		attachEvents();
		initScrollspy();

	}

	function openScreen() {
		instructions.fadeIn(2000);
		instructions.on('click', closeScreen);
	}

	function closeScreen() {
		instructions.fadeOut(1000, function() {
			introDismissed = true;
			playVideos();
			// if(audioactive) {
			// 	audiostop();
			// }
		});
	}

	var legacy = {
		sizer: sizer,
		init: init,
		active: function () {
			return active;
		},
		activate: function () {
			if (firstTime) {
				legacyContent.css({ 'width' : '100%', 'height' : '100%' });
				$(".legacy_top").css({ 'background' : 'none' });
				// sizer();
				initVideos();
			}

			firstTime = false;
			if (!active) {
				legacyContent.fadeIn(2000);
			}

			active = true;
			sizer();
			initCanvas();
		},
		deactivate: function () {
			var id;

			//pause all videos
			for (id in videos) {
				if (videos.hasOwnProperty(id) && videos[id]) {
					videos[id].pause();
				}
			}

			if (active) {
				legacyContent.fadeOut("fast");
			}
			active = false;
		}
	};

	window.legacy = legacy;
}(this));