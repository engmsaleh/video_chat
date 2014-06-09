// Default cam width and height
var VIDEO_WIDTH = 320;
var VIDEO_HEIGHT = 240;

// Display variables
var rows = 6;
var camcount = 0;

// Placeholder for name
var name = '';

// OpenTok variables
var publisher;
var subscribers = [];

// Check if name is set
// First a little jQuery to get URL parameters
$.urlParam = function(name){
    var split = location.search.replace('?', '').split('=');
    return split[1] || 'undefined';
}

// After the page is done loading, check for 'camname' as a URL parameter
$(document).ready(function() {
    var camname = $.urlParam('camname'); 
    if (camname === 'undefined') {
        $("#overlay").popup('show');
    }else{
        name = camname;
    }
});

// If no name, allow user to input name and submit it
function submitName() {
    var newname = $("#camname").val();
    // Push the camname to the URL without reloading the page
    history.pushState(null, "TreesChat Cams", "?camname="+newname);
    $("#overlay").popup('hide');
}

// SESSION


// Initialize session
session = TB.initSession(sessionId);

// Add event listeners to the session
    session.addEventListener('sessionConnected', sessionConnectedHandler);
    session.addEventListener('sessionDisconnected', sessionDisconnectedHandler);
    session.addEventListener('connectionCreated', connectionCreatedHandler);
    session.addEventListener('connectionDestroyed', connectionDestroyedHandler);
    session.addEventListener('streamCreated', streamCreatedHandler);
    session.addEventListener('streamDestroyed', streamDestroyedHandler);

// Connect to session
function connect() {
    session.connect(apiKey, token);
}

// Disconnect from session
function disconnect() {
    session.disconnect();
    hide('publishLink');
    hide('unpublishLink');
}


// HANDLERS


// Subscribe to all streams currently in the session
function sessionConnectedHandler(event) {
    for (var i = 0; i < event.streams.length; i++) {
        addStream(event.streams[i]);
        camcount++;
    }
    $("#publishLink").show();
    $("#unpublishLink").hide();
    setSize();
}

// Handle disconnect from session
function sessionDisconnectedHandler(event) {
    publisher = null;
    hide('publishLink');
    hide('unpublishLink');
    camcount = "0";
}

// Subscribe to newly created streams
function streamCreatedHandler(event) {
    for (var i = 0; i < event.streams.length; i++) {
        addStream(event.streams[i]);
        camcount++;
    }
}

// Remove cam when stream is disconnected
function streamDestroyedHandler(event) {
    camcount--;
}

function connectionDestroyedHandler(event) {
}

function connectionCreatedHandler(event) {
}


// STREAM


// Cam up
function startPublishing() {
    if (!publisher) {
        var parentDiv = document.getElementById("myCamera");
        var publisherDiv = document.createElement('div'); // Create a div for the publisher to replace

        $("#myCamera").show();

        publisherDiv.setAttribute('id', 'opentok_publisher');
        parentDiv.appendChild(publisherDiv);

        var publisherProps = {width: VIDEO_WIDTH, height: VIDEO_HEIGHT, name: name, publishAudio: false, mirror: false};
        publisher = TB.initPublisher(apiKey, publisherDiv.id, publisherProps);  // Pass the replacement div id and properties

        session.publish(publisher);

        show('unpublishLink');
        hide('publishLink');
    }
}

// Cam down
function stopPublishing() {
    if (publisher) {
        session.unpublish(publisher);
    }
    publisher = null;

    $("[id^=publisher_]").remove();
    $("#myCamera").hide();

    show('publishLink');
    hide('unpublishLink');
}

// Add the rest of the streams (i.e. any stream that is not ours)
function addStream(stream) {
    if (stream.connection.connectionId == session.connection.connectionId) {
        return;
    }

    // Create the container for the subscriber
    var container = document.createElement('div');
    var containerId = "container_" + stream.streamId;

    container.className = "subscriberContainer";
    container.setAttribute("id", containerId);
    container.setAttribute('class', 'camContainer'); 
    document.getElementById("subscribers").appendChild(container);


    // Create a div for the force disconnect link
    var forceDisconnect = document.createElement('div');
    
    forceDisconnect.setAttribute('class', 'forceDisconnect'); 
    forceDisconnect.innerHTML = '<a href="#" class="fcLink"  alt="Hide" title="Hide" onClick="removeStream(\'' + stream.streamId + '\')"><i class="fa fa-times"></i><\/a>';
    
    container.appendChild(forceDisconnect);

    $(".forceDisconnect").css('left', VIDEO_WIDTH-20);
    $(".forceDisconnect").css('top', VIDEO_HEIGHT-20);

    // Create the div that will be replaced by the subscriber
    var div = document.createElement('div');
    var divId = stream.streamId;

    div.setAttribute('id', divId);
    container.appendChild(div);

    var subscriberProps = {width: VIDEO_WIDTH, height: VIDEO_HEIGHT};
    subscribers[stream.streamId] = session.subscribe(stream, divId, subscriberProps);
}

// Remove cam
function removeStream(streamId) {
    var subscriber = subscribers[streamId];
    if (subscriber) {
        var container = document.getElementById(streamId);
        session.unsubscribe(subscriber);
        delete subscribers[streamId];

        // Clean up the subscriber container
        document.getElementById("subscribers").removeChild(container);
    }
}


// RENDERING ON PAGE


$(window).resize(function() {
    setSize();
});

// Set cam size
function setSize() {
    var $window = $(window);
    var wWidth = $window.width();
    var wHeight = $window.height();
    var camAspectRatio = 1.33333333333;

    VIDEO_WIDTH = Math.floor(wWidth/rows);
    VIDEO_HEIGHT = Math.floor(VIDEO_WIDTH/camAspectRatio);

    $('#cams').css("width",VIDEO_WIDTH * rows);
    $('object[id^="subscriber_"], object[id^="publisher_"]').prop('width', VIDEO_WIDTH).prop('height', VIDEO_HEIGHT);

    $(".forceDisconnect").css('left', VIDEO_WIDTH-20);
    $(".forceDisconnect").css('top', VIDEO_HEIGHT-20);
}

// Add additional row if there aren't more than 10
function addRow() {
    if (rows < 10){
        rows++;
        setSize();
    }
}

// Remove row if more than 2
function minusRow(){
    if (rows > 2){
        rows--;
        setSize();
    }
}

function refreshCams(){
    if (publisher) {
        session.unpublish(publisher);
        publisher = null;
    }

    session.disconnect();
    session.connect(apiKey, token);
}

function show(id) {
    document.getElementById(id).style.display = 'inline';
}

function hide(id) {
    document.getElementById(id).style.display = 'none';
}
