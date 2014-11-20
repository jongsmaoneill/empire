(function (window) {
	'use-strict';
	var _trackingon = false;
	var controlsActive = false;
	var mouseXTracking = false;
	var flipside = false;
	var flipangle = 0;
	var flipblock = false;
	var lazywidth = 0;
	
	var active = false;
	var isPlaying = false;
	var firstTime = true;
	var allVideosLoaded = false;
	var introDismissed = false;

	var videoCurrentTime = 0;

	var sideTracker = {};
	var _transitiontimerIvl = new Number();
	var soundivl = new Number();
	var openIvl = new Number();
	var currentVideoId = 1;
	var currentVidesPos = 0;
	var instructions, outerOuter, container, controls, cradleContent;

	var topUrl = 'http://dalcr8izwrdz8.cloudfront.net/cradle/',
		sources = {
			schiphol: 'CradleMorgueLow.mp4',
			spotters: 'CradleSpottersLow.mp4'
		},
		videos = {
			schiphol: null,
			spotters: null
		};

	function map(i, sStart, sEnd, tStart, tEnd) {
			var v = i-sStart;
			if (v>=0) {
					if (i < sStart) { return tStart;}
					else if (i > sEnd) {return tEnd;}
			} else {
					if (i < sStart) {return tStart;}
					else if (i < sEnd){return tEnd;}
			}
			var sRange = sEnd - sStart;
			if (sRange == 0) {return tStart;}
			var tMax = tEnd - tStart;
			var val = tStart + v / sRange * tMax;
			//console.log("In map " + val);
			return parseInt(val);
	}

	$.fn.isOnScreen = function(){
	    
	    var win = $(window);
	    
	    var viewport = {
	        top : win.scrollTop(),
	        left : win.scrollLeft()
	    };
	    viewport.right = viewport.left + win.width();
	    viewport.bottom = viewport.top + win.height();
	    
	    var bounds = this.offset();
	    bounds.right = bounds.left + this.outerWidth();
	    bounds.bottom = bounds.top + this.outerHeight();
	    
	    return (!(viewport.right < bounds.left || viewport.left > bounds.right || viewport.bottom < bounds.top || viewport.top > bounds.bottom));
	    
	};
	function togglePlayIcon(){
		if(videos.schiphol.paused || videos.spotters.paused){
			$("#c_playElement").addClass('playYellow').removeClass('playWhite').removeClass('pauseWhite').removeClass('pauseYellow');
		} 
		else {
			$("#c_playElement").addClass('pauseYellow').removeClass('pauseWhite').removeClass('playWhite').removeClass('playYellow');
		}
	}

	function attachEvents() {
		$("#c_playElement")
			.on('click', function () {
				playButton();
				console.log("Cradle playButton #c_playElement");
				if( !videos.schiphol.paused ){
					toggleButtonDisplay();
				}
			})
			.on('mouseover', function (){
				if(videos.schiphol.paused || videos.spotters.paused){
					$("#c_playElement").addClass('playWhite').removeClass('playYellow').removeClass('pauseWhite').removeClass('pauseYellow');
				} else {
					$("#c_playElement").addClass('pauseWhite').removeClass('pauseYellow').removeClass('playWhite').removeClass('pauseYellow');
				}
			})
			.on('mouseout',togglePlayIcon);

		$("#c_refresh")
			.on('click', restartVideos)
			.on('mouseover', function() {
				$("#c_refresh").css({'background-image':'url(../../art/cradle/refresh_white.png'});
			})
			.on('mouseout', function() {
				$("#c_refresh").css({'background-image':'url(../../art/cradle/refresh_yellow.png'});
			});

		instructions.on('click', function () { 
			closeScreen(); 
			//console.log("[Cradle] instructions closeScreen");
		});

		$("#c_play_bg")
			.on('click', function() {
				playButton();
				console.log("Cradle playButton #c_play_bg");
				toggleButtonDisplay();
			});

		$("#c_play_bg_back")
			.on('click', function() {
				playButton();
				console.log("Cradle playButton #c_play_bg_back");
				toggleButtonDisplay();
			});
		
		$("#legacy_cbutton")
			.on('click', function() { pauseVideos();
				$('html body').animate({ scrollTop: ($('#cradle_top').offset().top) }, 1000, function() {
					animateButton(1);
				});
			});

		$("#migrants_cbutton")
			.on('click', function() {
				pauseVideos();
				$('html body').animate({ scrollTop: ($('#cradle_top').offset().top) }, 1000, function() {
					animateButton(2);
				});
			});

		$("#periphery_cbutton")
			.on('click', function() {
				pauseVideos();
				$('html body').animate({ scrollTop: ($('#cradle_top').offset().top) }, 1000,function(){
		 			animateButton(3);
				});
			});
	}

	function sizer(){
		var w = $("#cradle_top").width();
		var h = $("#cradle_top").height();
		//console.log("[cradle] " + w + " : " + h);
		var matop = ($("#cradle_top").height() / 2) - 220; // top of the matrix
		var maStructure = matop;
		var padtop = h * 0.11; // top of the main title
		var legbottom = 70; //offset of the bottom play button on the open screen
		var buffer = h - legbottom;
		var centering = (w/2) - 70;
		var body = $('html body');

		if($("#cradle_top").height() < 780){ // if this a wee screen
			padtop = 20;
			matop = 120;
			legbottom = 20;
		} 

		if($("#cradle_top").height() > 830){
			matop = ($("#cradle_top").height() / 2) * 0.4;
		}

		if($("#cradle_top").height() <= 700) {
			outerOuter.css({ 'padding-top': (($("#cradle_top").height() / 2) - ($("#c_outerinner").height() * 0.55 )) });
			maStructure = 65;
		} else {
			outerOuter.css({ 'padding-top': (($("#cradle_top").height() / 2) - ($("#c_outerinner").height() / 2)) });
		}
		$("#cradle_bottom").css("height",$("#cradle_top").height());
		$('#cradle_line').css({ 'top': matop, 'height': ($("#cradle_top").height() ), 'left': (($("#cradle_top").width() / 2) - 7) });
		$("#cradle_linewhite").css({ 'height': $("#cradle_main").height(), 'left': (($("#cradle_top").width() / 2) - 7) });
		$('#cradle_bottomline').css({ 'top': 0, 'height': ($("#cradle_bottom").height() - 160), 'left': (($("#cradle_top").width() / 2) - 7) });
		$("#cradle_title").css({ 'padding-top': padtop });
		$("#cradle_structure").css({ 'margin-top': maStructure, 'left': (($("#cradle_top").width() / 2) - 370) });
		$("#cbottom_structure").css({ 'margin-top': ((($("#cradle_bottom").height() - 160) / 2) - 235), 'left': (($("#cradle_top").width() / 2) - 465) - 5 });
		$("#c_legmore").css({ "margin-left": ($("#cradle_main").width() / 2) - 70 }).on('click', function() {
			body.animate({scrollTop: ($("#cradle_bottom").offset().top)}, 1000);
		});
		$("#cradlemore").css({"top": buffer, "left": centering }).fadeIn(4000).on('click', function() {
			body.animate({scrollTop: ($('#cradle_main').offset().top) }, 1000);
				if(videos.schiphol.currentTime == 0) {
					openScreen();
					//console.log("[Cradle] cradlemore openScreen");
				} 
				else {
					toggleButtonDisplay();
				} 	
		});
		 $("#cradle_returnTop").css({'margin-top': ((($("#cradle_bottom").height() - 160) / 2) - 330), "margin-left": ($("#cradle_bottom").width() / 2) - 70 }).fadeIn(4000).click(function() {
		 	body.animate({scrollTop: ($('#cradle_top').offset().top) }, 1000);
		 });
	}
	function enableControls () {

		controlsActive = true;
		container
		.on('mousemove', function () {
			if(mouseXTracking && ($("#c_controls").isOnScreen())) { trackon();}
		})
		.on('mouseleave', function () {
			trackoff();
		});

		$("#rightbutton").on('click', function () {
			if(!flipside){
				flipper();
			}
		});
	}
	function disableControls () {
		outerOuter.unbind("mouseenter");
		outerOuter.unbind("mouseleave");
		$("#leftbutton").unbind("click");
		$("#rightbutton").unbind("click");
		controlsActive = false;
		// mouseXTracking = false;
		// console.log("controls are: " + controlsActive);
	}
	function openScreen () {
		if(active && videos.schiphol.paused) {
			instructions.fadeIn(2000);
			//console.log("[Cradle] instructions openScreen");
			openIvl = setTimeout(function() {
			closeScreen();
			//console.log("Cradle closeScreen timeout");
		}
		, 10000);
		}

	}

	function closeScreen () {
		clearInterval(openIvl);
		instructions.fadeOut(1000, function() {
			introDismissed = true;
			if(active && videos.schiphol.paused) {
			 	playButton();	
			 	trackon();
			 	console.log("Cradle playButton closeScreen");	
			}
		});
	}
	function playButton(){
		if(active) {
			mouseXTracking = true;
			if(videos.schiphol.paused || videos.spotters.paused){
				playVideos();
				console.log('schiphol or spotters is paused');
			}
			else{
				pauseVideos();
			}
		}
	}
	function initScrollspy(){
		instructions.scrollspy({
		min: instructions.offset().top,
		onEnter: function(element, position) {
			if(videos.schiphol.currentTime == 0) {
				openScreen();
				//console.log("[Cradle] initScrollspy openScreen");
			} else {
				toggleButtonDisplay();
			}
		},
		onLeave: function(element, position) {
			instructions.fadeOut();
		}
	});
	}

	function trackon () {
		_trackingon = true;
		$(document).on('mousemove', function(e){
			if(!flipblock){
				var x = e.pageX;
				var threshold = lazywidth/2;
				if(x < (threshold)){
					if(flipside){
						flipper(false);
					}
				} else {
					if(!flipside){
						flipper(true);

					}
				}
			}
			
		});
	}
	function trackoff () {
		_trackingon = false;
		$(document).unbind("swipeleft");
		$(document).unbind("swiperight");
		$(document).unbind('mousemove');
		$(document).unbind('mouseenter');
	  	$(document).unbind('mouseleave');
	}

	function flipper (isright){
		var translatePos;
		syncTime();
		
		if(flipside){		
			flipside = false;
			flipangle = 0;
			translatePos = 0;
			$("#leftbutton").removeClass('buttonon').addClass('buttonoff');
			$("#rightbutton").removeClass('buttonoff').addClass('buttonon');
		} 
		else {
			flipside = true;
			flipangle = 180;
			translatePos = 960;
			$("#rightbutton").removeClass('buttonon').addClass('buttonoff');
			$("#leftbutton").removeClass('buttonoff').addClass('buttonon');
		}
		// $("#card").css({ '-webkit-transform': 'rotateY( ' + flipangle + 'deg) translateX('+ translatePos + 'px)', 'transform': 'rotateY( ' + flipangle + 'deg) translateX('+ translatePos + 'px)' });
			$("#card").css({ '-webkit-transform': 'rotateY( ' + flipangle + 'deg)', 'transform': 'rotateY( ' + flipangle + 'deg)' });

	}

	function syncTime() {
		if(videos.spotters.readyState > 1 && videos.schiphol.readyState > 1) {
			
			var videoTrackCurrentPosition  = videos.schiphol.currentTime;
			
			if(!flipside) {
				//console.log("videos.spotters.currentTime: " + videos.spotters.currentTime);
				//console.log("videos.schiphol.currentTime: " + videos.schiphol.currentTime);
				videos.spotters.currentTime = videoTrackCurrentPosition;
				//console.log("videos.spotters.currentTime: " + videos.spotters.currentTime);
				//console.log("videos.schiphol.currentTime: " + videos.schiphol.currentTime);
			}
		}
	}

	function restartVideos() {	
		//console.log("Restarting cradle videos");
		videos.schiphol.currentTime = 0;
		videos.spotters.currentTime = 0;
		videos.spotters.volume = 0;
		videos.schiphol.play();
		videos.spotters.play();
		isPlaying = true;
	}

	function initVideos() {

		Object.keys(videos).forEach(function (id) {
			var video = videos[id];
			video.addEventListener('timeupdate',scrubberUpdater,true);
			video.addEventListener('emptied',function(){console.log("videos are empty");},true);
			video.addEventListener("ended", endVideos, true);
			video.addEventListener('canplay', function () {
				console.log('video ' + id + ' loaded');
			});
			video.addEventListener('loadedmetadata', function () {
				if (videoCurrentTime) {
					video.currentTime = videoCurrentTime;
				}
			});
		});
	}

	function removeListeners() {
		Object.keys(videos).forEach(function (id) {
			var video = videos[id];
			if (video) {
				video.removeEventListener('timeupdate', scrubberUpdater, true);
				video.removeEventListener('ended'), endVideos, true;
				console.log("removing listeners");
			}
		});
	}

	function playVideos(){

		var id;
		if (!allVideosLoaded) {
			for (id in videos) {
				if (videos.hasOwnProperty(id)) {
					if (!videos[id] || videos[id].readyState < 2) {
						//console.log('[Cradle play videos] Videos not loaded');
						return;
					}
				}
			}
			allVideosLoaded = true;
		}

		for (id in videos) {
			if (videos.hasOwnProperty(id) && videos[id]) {
				if(id ==2){
					videos[id].volume =0;	
				}
				//videos[id].currentTime = videoCurrentTime;
				videos[id].play();
				isPlaying = true;
			}
		}

		console.log("playVideos");
	}

	function pauseVideos(){
		for (id in videos) {
			if (videos.hasOwnProperty(id) && videos[id]) {
				videos[id].pause();
				isPlaying = false;
			}
		}
	}

	function endVideos(){
		buildEndScreen();
	}

	function sounddown () {
		clearInterval(soundivl);
		soundivl = setInterval(function () {
			var thisvol = document.getElementById('mobileisgreat').volume - .2;
			document.getElementById('mobileisgreat').volume = thisvol;
			if(thisvol < .1){
				clearInterval(soundivl);
			}
		}, 50);
	}

	function soundup () {
		clearInterval(soundivl);
		soundivl = setInterval(function () {
			var thisvol = document.getElementById('mobileisgreat').volume + .2;
			if(thisvol > .5){
				clearInterval(soundivl);
				thisvol = .6;
			}
			document.getElementById('mobileisgreat').volume = thisvol;
		}, 50);
	}	

	function scrubberUpdater (){

		if(isPlaying) {
			var dur = Math.floor(document.getElementById(currentVideoId).currentTime);
			
			if(dur > 0){
				var ratio = (document.getElementById(currentVideoId).duration / dur);
			}

			videoCurrentTime = document.getElementById(currentVideoId).currentTime;

			$("#c_progress").css({ "width": (885 / ratio) + 'px' });
			//console.log("im on flipside  " + flipside);

			sideTracker[Math.floor(document.getElementById(currentVideoId).currentTime)] = flipside;
			//console.log(sideTracker);
		}


	}

	function toggleButtonDisplay(){

		if(videos.schiphol){
			if(videos.schiphol.paused ){
				$("#c_play_bg").fadeIn();
				$("#c_play_bg_back").fadeIn();
			}
			else{
				$("#c_play_bg").fadeOut();
				$("#c_play_bg_back").fadeOut();
			}
		}
	}

	function buildEndScreen () {
		container.hide();
		controls.hide();
		$("#c_endscreen").fadeIn();
		$("#c_legmore").fadeIn();

		// now the drawing
		var outputstring = new String();
		var nowtop = 0;
		var multiplier = 1.21;

		for(var x = 0; x < 446; x++){
			// for(var x = 0; x < 286; x++){
			var i = map(x, 0, 446,0, Object.keys(sideTracker).length ) ;
			Object.keys(sideTracker).length;
			outputstring += '<div style="width: 445px; ';
			var rightnow = sideTracker[i];
			var accum = 1;
			//console.log(sideTracker[i]);
			//console.log(i);
			while(sideTracker[x] == rightnow){
				accum++;
				x++;	
				if(x > 445){
					break;
				}
			}
			outputstring += 'height: ' + (accum * multiplier) + 'px';
			
			if(rightnow == false){
				outputstring += '; left: 445';
			}
			outputstring += '; top: ' + nowtop + '"></div>';
			nowtop = nowtop + (accum * multiplier);
		}

		$("#c_people_data").html(outputstring);
		$("#c_person_overlay").click(function () {
			sideTracker = {};
			$("#c_endscreen").fadeOut();
			$("#c_legmore").fadeOut();
			videos.schiphol.currentTime = 0;
			videos.spotters.currentTime = 0;
			container.fadeIn();
			controls.fadeIn();
			playVideos();

			$("#c_playElement").css({'background':'url(../../art/cradle/playWhite.png)'})	
			//console.log("buildEndScreen c_playState: " + c_playState);					
		});
	}

	function setVideoSources() {
		Object.keys(sources).forEach(function (key) {
			var video = videos[key],
				src = sources[key];

			video.src = topUrl + src;
			video.load();
		});
	}

	function clearVideoSources() {
		Object.keys(videos).forEach(function (key) {
			var video = videos[key];
			if (video) {
				video.removeAttribute('src');
				video.load();
			}
		});
	}

	function init(){
		Object.keys(videos).forEach(function (id) {
			var video = document.getElementById(id);
			videos[id] = video;
		});

		instructions = $("#c_instructions");
		outerOuter = $("#c_outerouter");
		container = $("#c_container");
		cradleContent = $("#cradleContent");
		controls = $("#c_controls");
		initScrollspy();
		cradleContent.css({'width': '100%', 'height': '100%'});
   		$(".cradle_top").css({'background': 'none'});

		//addListeners();
		attachEvents();
		sizer();
		
		lazywidth = outerOuter.width();
		currentVideoId = 'schiphol';
	}

	var cradle = {
		sizer:sizer,
		init:init,
		pauseVideos: pauseVideos,
		playVideos: playVideos,
		togglePlayIcon: togglePlayIcon,
		toggleButtonDisplay: toggleButtonDisplay,

		active:function(){
			return active;
		},
		isPlaying: function(){
			return isPlaying;
		},
		activate:function(){
			if(!active){
				cradleContent.fadeIn(2000);	
			}

			if(firstTime ) {
				cradleContent.css({'width': '100%', 'height': '100%'});
				$(".cradle_top").css({'background': 'none'});
				sizer();
				lazywidth = outerOuter.width();
				currentVideoId = 'schiphol';
			 	firstTime = false;
			} else {
				toggleButtonDisplay();
			}

			initVideos();
			setVideoSources();

			enableControls();
			active = true;
			
			if( videos.schiphol.currentTime > 0 ) {
				console.log("current time is greater than zero");
				toggleButtonDisplay();
			}

		},
		deactivate:function(){
			cradleContent.fadeOut("fast");
			
		 	pauseVideos();
		 	removeListeners();
			clearVideoSources();
		 	disableControls();
		 	active = false;

		}
	}
	window.cradle = cradle;
}(this));