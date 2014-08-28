
(function (window) {
	'use strict';

	var legacyLoaded = false;
	var legacyActive = false;
	var _adjuster = 140;
	var openTimeIvl;
	var allVideosLoaded = false;
	var allVideosComplete = false;
	var l_videoTrackCurrentPosition;

	var currTime = 0;
	var currentVolume = 0;
	var intervalID = 0;
	var insructIvl;
//	var intervalID_out = 0;
	var videoCurrentTime = 0;

	var active = false;
	var introDismissed = false;

	var firstTime = true;
	var legacyEndScreen = false;

	var videos = {
		indonesia: null,
		india: null,
		srilanka: null,
		southafrica: null,
		// corners: null,
	};

	var videoTracker = {
		indonesia: {},
		india: {},
		srilanka: {},
		southafrica: {},
	};


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

	//Raphael variables
	var diamondCanvas;

//*** OLD	
//Tracker Object
// Active
// Complete
// Total Duration
// Duration Played

//*** NEW

//Tracker Object
// StartPos
// EndPost 
// Active

	var doOnce = true;
	var count=0;

	//currentActiveVideoTracker
	var currentActiveVideoTracker = {
			indonesia: {},
			india: {},
			srilanka: {},
			southafrica: {},
		};
 // 1 Object for each video
 // 1 Object has 
  // Active - in selectVideo when video was inactive and is now active
  // StartPos - in selectVideo when video was inactive and is now active
  // EndPos - in selectVideo when video was active and is now inactive


//sessionHistory
	// Has multiple object for each video
	var sessionHistory = 	{
			india:[],
			indonesia:[],
			southafrica:[],
			srilanka:[]
		};

	function map(i, sStart, sEnd, tStart, tEnd,toInt) {
		var v = i - sStart;
		if (v >= 0) {
			if (i < sStart) {
				return tStart;
			}
			if (i > sEnd) {
				return tEnd;
			}
		} else if (i < sStart) {
			return tStart;
		} else if (i < sEnd){
			return tEnd;
		}

		var sRange = sEnd - sStart;

		if (!sRange) {
			return tStart;
		}
		
		var tMax = tEnd - tStart;
		var value =tStart + v / sRange * tMax;
		
		if(toInt){
			return parseInt(value);

		}
		else{
			return value;
		}
		
	}

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

		var canvasShift = h * 0.146;

		$("#centeringCanvas").css({ 'top': '-' + canvasShift + 'px' });

		// $(".legacy_bottom").css("height",$(".legacy_top:first").height());

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

	function initPaths() {
		diamondCanvas = new Raphael("diamond_border", 262, 262);
		diamondCanvas.path('M 0 0 L 262 0').attr({stroke: '#666', 'stroke-width': '2', 'stroke-opacity': '1.0'});
		diamondCanvas.path('M 262 0 L 262 262').attr({stroke: '#666', 'stroke-width': '3', 'stroke-opacity': '1.0'});
		diamondCanvas.path('M 262 262 L 0 262').attr({stroke: '#666', 'stroke-width': '3', 'stroke-opacity': '1.0'});
		diamondCanvas.path('M 0 262 L 0 0').attr({stroke: '#666', 'stroke-width': '2', 'stroke-opacity': '1.0'});
		//diamondCanvas.path('M' + 0 + ' 0 L' + 262 + ' 0').attr({stroke: '#fbb03b', 'stroke-width': '2', 'stroke-opacity': '1.0'});

	}

	/*
	Copy the list of which segments of the video have been viewed and save it to localStorage
	*/
	function saveSessionHistory() {
		var saved = [],
			session,
			i;

		for (i = 0; i < sessionHistory.length; i++) {
			session = sessionHistory[i];
			saved.push({
				startPos: session.startPos,
				endPos: session.endPos
			});
		}

		try {
			localStorage.setItem('lsessionHistory', JSON.stringify(saved));
		} catch (e) {}
	}

	/*
	Load list of viewed segments from loadStorage
	*/
	function loadSessionHistory() {
		var saved,
			session,
			savedSession,
			i;

		if (sessionHistory.length) {
			return;
		}

		try {
			saved = JSON.parse(window.localStorage.getItem('lsessionHistory'));
		} catch (e) {
			return;
		}

		if (saved && Array.isArray(saved)) {
			for (i = 0; i < saved.length; i++) {
				savedSession = saved[i];
				sessionHistory.push({
					// isActive: false,
					startPos: savedTracker.startPos,
					endPos: savedTracker.endPos,
					// isCrossOriginArc: true,
					// arcSegment: null
				});
			}
			//not sure if this is going to work
			//addProgressPath(id, start, end);
		}
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

		//console.log("[videoTracker] :" + videoTracker);
	}

	//Way to get videos to play after loading
	//has it been at least 7 seconds, if not return false
	//has it been 7 seconds, are all videos ready? if not, return false
	//for migrants, delete local storage and set array to empty


	var fadeInAudio = function (video) {
		//console.log("In fadeInAudio");
		if(currentVolume <= 1){
			video.volume = currentVolume ;
			currentVolume += 0.07;
			// console.log(currentVolume);
		} else{
			clearTimeout(intervalID);
			currentVolume = 0;
			return;
		}

		intervalID = setTimeout(function() {fadeInAudio(video);}, 100);
	};

	function addProgressPath(id,start, end){
		
		if(id === "srilanka"){
			var pathString ='M '+start.toString()+' 0 L '+end.toString()+' 0';
			//console.log("Srilanka "+ pathString);
			diamondCanvas.path(pathString).attr({stroke: '#fbb03b', 'stroke-width': '2', 'stroke-opacity': '1.0'});
		}
		else if(id === "southafrica"){
			// console.log("southafrica "+ pathString);
			diamondCanvas.path('M 262 '+start.toString()+' L 262 '+end.toString()).attr({stroke: '#fbb03b', 'stroke-width': '3', 'stroke-opacity': '1.0'});
		}
		else if(id === "india"){
			//  bottom \ india
			start = 262-start;
			end = 262-end;
			// console.log("india "+ pathString);
			diamondCanvas.path('M '+start.toString()+' 262 L '+end.toString()+' 262').attr({stroke: '#fbb03b', 'stroke-width': '3', 'stroke-opacity': '1.0'});
		}
		else if(id === "indonesia"){
			//  top / indonesia
			start = 262-start;
			end = 262-end
			// console.log("indonesia "+ pathString)/;
			diamondCanvas.path('M 0 '+start.toString()+' L 0 '+end.toString()).attr({stroke: '#fbb03b', 'stroke-width': '2', 'stroke-opacity': '1.0'});
		}
	}

	var debugCount = 0;

	function checkProgressLength(){
		
		var numWatched = 0;

		Object.keys(sessionHistory).forEach(function (id) {
			var fullRange = [];
			
			if(sessionHistory[id].length > 0){
				var totalAmtWatched = 0;

				for (var i = 0; i < sessionHistory[id].length; i++) {

					var curRange = _.range(Math.ceil(sessionHistory[id][i].startPos), Math.ceil(sessionHistory[id][i].endPos), 1);
					fullRange.push(curRange);

					//Not using this anymore but is there for testing
					// var duration = sessionHistory[id][i].endPos - sessionHistory[id][i].startPos;
					// totalAmtWatched += 	duration;
				}
				
					fullRange = _.flatten(fullRange);
					fullRange = _.uniq(fullRange);
					var totalDuration = videos[id].duration;
					var thresh = parseInt(totalDuration*0.9);
					
					if(fullRange.length > thresh){
						numWatched++;
						//console.log(id+" > 20%");
						videoTracker[id].watched90 = true;
					}
					
					if(!(debugCount%100)){
					// not doing this method anymore
					// console.log(id+" % : " +parseInt((((totalAmtWatched)/totalDuration))*100) );
						//console.log(id+" % : " + parseInt((((fullRange.length)/totalDuration))*100) );
						//console.log("All watched ?" + numWatched );
					}
			}
		});

		debugCount++;
		if(numWatched >= 4){
			return true;
		}
		else{
			return false;
		};

	}

	function updateSessionTracker(id){
		//console.log("here");
		var nonOverlappingSession = true;
		for (var i = 0; i < sessionHistory[id].length; i++) {
			
			if(videoTracker[id].startPos > sessionHistory[id][i].startPos &&
				videoTracker[id].endPos < sessionHistory[id][i].endPos){
				//console.log("full overlapping session ignoring");
				nonOverlappingSession = false;
				continue;
			}

			//All of this is unecessary actually as 
			//using the array flatten method to remove
			//duplicates but its here now

			if(videoTracker[id].startPos > sessionHistory[id][i].startPos &&
				videoTracker[id].startPos < sessionHistory[id][i].endPos){
		
				if(videoTracker[id].endPos > sessionHistory[id][i].endPos){

					//console.log("Start "+videoTracker[id].startPos+" within : " +sessionHistory[id][i].startPos+ " - "+sessionHistory[id][i].endPos);
					//console.log("semi overlapping session updating old session endPos");
					sessionHistory[id][i].endPos = videoTracker[id].endPos;	
					nonOverlappingSession = false;
				}
				else{
					console.log("full overlapping session ignoring");
				}

			}
			
			if(videoTracker[id].endPos > sessionHistory[id][i].startPos &&
					videoTracker[id].endPos < sessionHistory[id][i].endPos){
				if(videoTracker[id].startPos < sessionHistory[id][i].startPos){
					console.log("overlapping session updating old session startPos");
					// console.log("Endp "+videoTracker[id].startPos+" within : " sessionHistory[id][i].startPos+ " - "+sessionHistory[id][i].endPos);
					sessionHistory[id][i].startPos = videoTracker[id].startPos;	
					nonOverlappingSession = false;
				}
				else{
					console.log("full overlapping session ignoring");
				}
			}
		}

		if(nonOverlappingSession){
			//console.log("new non overlapping session");
			sessionHistory[id].push({
					startPos: videoTracker[id].startPos,
					endPos: videoTracker[id].endPos 
			});
		}
	}

	function selectVideo(selectedId) {
		var video, id, container;
		for (id in videos) {
			if (videos.hasOwnProperty(id)) {
				video = videos[id];
				
				if (video) {
					//Each video should have an array of objects
					//Each object should have a starPos and End pos
					//These start and end positions can be used to draw the progress bar.

					// video.volume = (!selectedId || selectedId === id) ? 1 : 0;
					if(!selectedId){
						
						//do volume upp for all
						video.volume = 0.75;

						if(videoTracker[id].active){
							console.log(id +" was active and is now inactive");
							updateSessionTracker(id);

							videoTracker[id].active = false;	
							// videoTracker[id].startPos = 0;
							// videoTracker[id].endPos = 0;

							var start = map(videoTracker[id].startPos,0,video.duration, 0, 262,true);
							var end = map(videoTracker[id].endPos,0,video.duration, 0, 262,true);
							addProgressPath(id,start,end);

						}
						console.log("!selectedId");
						console.log(selectedId + " is " + videoTracker[id].active);
					}
					else if(videoTracker[id].active && selectedId !== id){
						video.volume = 0;
						//$('#legacy_container_' + selectedId).css({'cursor':'pointer'});
						// console.log("videoTracker[id].active && selectedId !== id");
						// console.log("videoTracker[id] startPos: " + videoTracker[id].startPos);
						// console.log("videoTracker[id] endPos: " + videoTracker[id].endPos);
						// console.log(videoTracker[id]);
						
						videoTracker[id].endPos = video.currentTime;
						updateSessionTracker(id);
						
						videoTracker[id].active = false;
						// videoTracker[id].startPos = 0;
						// videoTracker[id].endPos = 0;

						var start = map(videoTracker[id].startPos,0,video.duration, 0, 262,true);
						var end = map(videoTracker[id].endPos,0,video.duration, 0, 262,true);
						addProgressPath(id,start,end);
					}
					else if(selectedId === id){
						if(!videoTracker[id].active){
							fadeInAudio(video); 
							$('#legacy_container_' + selectedId).css({'cursor':'default'});
							$('.directionTitle').css({'opacity':'0'});
							videoTracker[id].active = true;
							videoTracker[id].startPos = video.currentTime;
							videoTracker[id].endPos = -1;
							currentActiveVideoTracker[id].active = true;
							console.log(id +" was inactive and is now active");

							//xxx
							sessionHistory[id].push({
								startPos: videoTracker[id].startPos,
								endPos: videoTracker[id].startPos,
							});
							continue;
						}
						else{
							console.log(id +" was active and is now active");
							$('#legacy_container_' + selectedId).css({'cursor':'default'});
							$('.directionTitle').css({'opacity':'0'});
						}
					} 
					else {
						video.volume = 0;
						console.log(id +" was inactive and is now inactive");
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

	function buildEndScreen() {
		$("#l_endscreen").fadeIn();
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

			$('#legacy_container_india').css({'cursor':'pointer'});
			$('#legacy_container_indonesia').css({'cursor':'pointer'});
			$('#legacy_container_southafrica').css({'cursor':'pointer'});
			$('#legacy_container_srilanka').css({'cursor':'pointer'});
			$('.directionTitle').css({'opacity':'1'});


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
				//videoTracker[id].durationPlayed = 0;
				videoTracker[id].active = false;
				videoTracker[id].canplay = true;
				//console.log("videoTracker[id]: " + videoTracker[id]);

				currentActiveVideoTracker[id] = {};
				currentActiveVideoTracker[id].startPos = 0;
				currentActiveVideoTracker[id].endPos = 0;
				currentActiveVideoTracker[id].active = false;
				currentActiveVideoTracker[id].totalDuration = video.duration;
				//console.log("currentActiveVideoTracker[id]: " + currentActiveVideoTracker[id]);				
			});

			video.addEventListener('ended', function (evt) {

			
				//console.log(evt.srcElement.id);
				var string = evt.srcElement.id;
				var index = string.split('_');
				var id = index[0];
				//index[0] is country name
				console.log('[ Legacy : ] ' + id + ' has ended');
				if(videoTracker[id].active) {
					zContainer.zoomTo({ targetsize:0.5, duration:600, root: zContainer });
					console.log(id +" Complete updating history");
					//for volume
					selectVideo(null);
					var start = map(videoTracker[id].startPos,0,video.duration, 0, 262,true);
					var end = map(videoTracker[id].endPos,0,video.duration, 0, 262,true);
					addProgressPath(id,start,end);
				}
				video.play();
				var count = 0;

				
			});

			video.addEventListener('timeupdate', function (evt) {
				var videoID = evt.srcElement.id;
				var index = videoID.split('_')[0];
				var vid = document.getElementById(videoID);
				
				// Update progress bar for each film - TODO: change from a bar to a circle
				var currTime = Math.floor(vid.currentTime);
				//console.log("id: " + index + " currentDur : " + dur);
				if(currTime > 0) {
					var ratio = (document.getElementById(videoID).duration / currTime);
				}

				$("#" + id + "_progressDiamond").css({ "left": (640 / ratio) + 'px'});

				if(videoTracker[id].active){
					videoTracker[id].endPos = currTime;
					//xxx
					var lastElement = sessionHistory[id].pop();
					lastElement.endPos = currTime;
					//console.log("lastELement: " + lastElement.startPos);
					sessionHistory[id].push(lastElement);
				}

				checkProgressLength();

				if (checkProgressLength()) {
					legacyEndScreen = true;
					console.log('Legacy Endscreen');
					buildEndScreen();

					//Insert Skype button functionality here
				}

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
		
		var spacing = -12;
		ctx.beginPath();
		ctx.moveTo(cw / 2, 0 - spacing);
		ctx.lineTo(cw + spacing, ch / 2);
		ctx.lineTo(cw / 2, ch + spacing);
		ctx.lineTo(0 - spacing, ch / 2);
		ctx.lineTo(cw / 2, 0 - spacing);
		ctx.fill();
		
		layers = seriously.effect('layers', {
			count: leg_videos.length + 1
		});
		layers.sizeMode = leg_videos.length;

		layers['source' + leg_videos.length] = maskCanvas;
		target.source = layers;

		Array.prototype.forEach.call(leg_videos, function (video, index) {
			var move = seriously.transform('2d'),
				crop = seriously.effect('crop'),
				reformat = seriously.transform('reformat');

			crop.source = video;
			crop.top = 10;
			crop.bottom = 32;

			move.source = crop;
			move.scale(0.71); // optional, here if you need it

			layers['source' + index] = move;

			video.onloadedmetadata = function () {
				// we don't know how much to move the videos until we know their dimensions
				var x = (index % 2 ? 1 : -1),
					y = (index < 2 ? -1 : 1);

				move.translateX = x * crop.width / 2 * move.scaleX;
				move.translateY = y * crop.height / 2 * move.scaleY;
			};
		});

		seriously.go(function() {
			
			var video, id, container;
			for (id in videos) {
				if (videos.hasOwnProperty(id)) {
					video = videos[id];
			
					if (video) {
						if (videoTracker[id].watched90 ) {
						//console.log("turn off " + id + " opacity");
						buildEndScreen();

							if(id === "srilanka"){
								//console.log(id + "reached 90%");
								layers.opacity3 = 0;
								diamondCanvas.path('M 0 0 L 262 0').attr({stroke: '#fbb03b', 'stroke-width': '2', 'stroke-opacity': '1.0'});
							}
							else if(id === "southafrica"){
								//console.log(id + "reached 90%");
								layers.opacity1 = 0;							
								diamondCanvas.path('M 262 0 L 262 262').attr({stroke: '#fbb03b', 'stroke-width': '3', 'stroke-opacity': '1.0'});
							}
							else if(id === "india"){
								//console.log(id + "reached 90%");
								layers.opacity0 = 0;
								//  bottom \ india
								diamondCanvas.path('M 262 262 L 0 262').attr({stroke: '#fbb03b', 'stroke-width': '3', 'stroke-opacity': '1.0'});
							}
							else if(id === "indonesia"){
								//console.log(id + "reached 90%");
								layers.opacity2 = 0;
								//  top / indonesia
								diamondCanvas.path('M 0 262 L 0 0').attr({stroke: '#fbb03b', 'stroke-width': '2', 'stroke-opacity': '1.0'});
							}
						}
					}
				}
			}
		}); 
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
		var videosCanPlay = false;

		for(id in videoTracker){
			if(videoTracker.hasOwnProperty(id) && 
				videoTracker[id].canplay){
				videosCanPlay = true
			}
			else{
				videosCanPlay = false;
			}
		}
		if(videosCanPlay){
			instructions.fadeIn(2000);
			instructions.on('click', closeScreen);
			insructIvl = setTimeout(closeScreen, 7000);	
			console.log("videos loaded");
		}
		else{
			console.log("videos not loaded in openScreen legacy looping");
			setTimeout(openScreen, 1000);
		}
		// instructions.fadeIn(2000);
		// instructions.on('click', closeScreen);
		// insructIvl = setTimeout(closeScreen, 7000);
	}

	function closeScreen() {
		clearInterval(insructIvl);
		if(audioactive) {
			audiostop();
		}
		instructions.fadeOut(1000, function() {
			introDismissed = true;
			playVideos();
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
				initCanvas();
				initPaths();
			}

			firstTime = false;
			if (!active) {
				legacyContent.fadeIn(2000);
			}

			active = true;
			sizer();
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
				zContainer.zoomTo({ targetsize:0.5, duration:600, root: zContainer });
				legacyContent.fadeOut("fast");
			}
			active = false;
		},
		buildEndScreen: function() {
			//$("#l_endscreen").fadeIn();
			legacyEndScreen = true;
			if (legacyEndScreen) {
				//$("#diamond_border").css({'background-color': '#000'});
			}

		}
	};

	window.legacy = legacy;
}(this));