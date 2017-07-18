$(document).ready(function() {

    var chatRooms = {
        //Intialize chatrooms
        init: function() {
            this.socket = io();
            this.eventHandlers();

        },
        
        //Get list of Chatrooms and load the list after submitting username
        getChatRooms: function() {

            $("#chatroom-details").empty().html("<h3 class='room-name'>Please Select Chatroom!!!</h3>");
            $("#chat-window").empty();
            $('#messenger-window').addClass('disabled');
            $.ajax({
                url: 'http://localhost:8080/api/rooms',
                type: 'GET',
                success: function(response) {
                    var listHtml = "";
                    for (var i = 0; i < response.length; i++) {

                        listHtml += "<li class='list-items' id='" 
                                    + response[i].id + "'>" + response[i].name + "</li>"

                    }

                    $("#rooms-list").html(listHtml);

                }
            });
        },

        //Load user details after submitting username
        loadUserDetails: function() {

            $("#user-details").html("<h3 class='username'>" + this.username + "</h3><p class='online-details'>Online <span>Now</span></p>");
            $("#messenger").show(1000).css("display", "flex");
            $("#login-container").hide("");
             
        },

        //setInterval to log online status
        intervalForOnlineStatus: function(){

            var i=0;
            this.interval = setInterval(function() {
                ++i;
                var hours = Math.floor( i / 60);
                var days = Math.floor(i/1440);
                if( i === 1)
                    $(".online-details span").text("for " + i + " Minute");
                if(i >1 && i < 60)
                    $(".online-details span").text("for " + i + " Minutes");
                if( i===60)
                    $(".online-details span").text("for "+ hours + "hour");
                if(i > 60  &&  i < 1440)
                    $(".online-details span").text("for "+ hours + "hours");
                if(i===1440)
                    $(".online-details span").text("for "+ days +  "day");
                if(i >= 1440)
                    $(".online-details span").text("for "+ days +  "days");

            },60000);


        },

        //Load messages for selected chatroom in message window
        loadChatroomMessages: function() {

            var that = this;
            $.ajax({

                'url': 'http://localhost:8080/api/rooms/' + this.chatroom_id + '/messages',
                'type': 'GET',
                'success': function(response) {
                    var html = "";
                    for (var i = 0; i < response.length; i++) {

                        if (response[i].name === that.username)

                            html += "<div class='messages'><p class='message-content active'>" +
                                    response[i].message + "</p></div>";

                        else

                            html += "<div class='messages'><p class='message-content'>" 
                                     + response[i].message +"</p><p class='message-user-name' >" 
                                     + response[i].name + "</p></div>";

                    }
                    
                    $("#chat-window").animate({
                        scrollTop: $("#chat-window")[0].scrollHeight + 5000
                    }, 100);
                
                    $('#messenger-window').removeClass('disabled');
                    $("#chat-window").html(html);

                }

            });

        },

        //Load chatroom details of selected chatroom in message window
        loadChatroomDetails: function() {
            var that = this;
            $.ajax({

                'url': 'http://localhost:8080/api/rooms/' + this.chatroom_id,
                'type': 'GET',
                'success': function(response) {
                    var html = "<h3 class='room-name'>" + response.name + "</h3>";
                    var usernameslist = "";
                    for (var i = 0; i < response.users.length; i++) {

                        if (response.users[i] === that.username)

                            usernameslist = " <span class='room-users active'>" 
                                            + response.users[i] + "</span>" + usernameslist;

                        else

                            usernameslist += " <span class='room-users'>" 
                                             + response.users[i] + "</span>";

                    }

                    $("#chatroom-details").html(html + usernameslist);
                    
                }

            });

        },
        //Post new messages to server
        postMessages: function(message) {

            var that = this;

            var data = {
                name: this.username,
                message: message
            }
            $("#user-message-input").val("");
            $.ajax({

                url: 'http://localhost:8080/api/rooms/' + this.chatroom_id + '/messages',
                type: 'POST',
                data: JSON.stringify(data),
                contentType: 'application/json',
                success: function(response) {
                    that.loadChatroomDetails();
                    that.socket.emit('chat message', [that.username, that.chatroom_id, message]);
                    return false;
                }
            });
        },

        //Retrieve messages(relatime)
        retrieveMessages: function(msg) {
            
            if (msg[1] === this.chatroom_id) {
                   
                    var html = "";
                    if (msg[0] === this.username) {

                        html += "<div class='messages'><p class='message-content active'>" 
                                + msg[2] + "</p></div>";
                    } else{

                        html += "<div class='messages'><p class='message-content'>" + msg[2] +
                                 "</p><p class='message-user-name' >" + msg[0] + "</p></div>";
                    }

                    $('#chat-window').append(html);
                    $("#chat-window").animate({
                        scrollTop: $("#chat-window")[0].scrollHeight
                    }, 200);

            }
        },

       //event handlers 
        eventHandlers: function() {

            var that = this;
             
            // click and keypress event for submitting username
            $("#login-container").on("keypress click", function(e) {
                that.username = $("#username").val();
                if (that.username.length > 0 && ((e.type === "click" && e.target.id === "user-submit") || (e.type = "keypress" && e.keyCode === 13))) {
                    that.intervalForOnlineStatus();
                    that.getChatRooms();
                    that.loadUserDetails();
                    $("#username").val("");
                }
                
            });

            /// click  event for selecting chat room
            $("ul").on("click", "li", function() {

                that.chatroom_id = $(this).attr('id');

                that.loadChatroomMessages();
                that.loadChatroomDetails();
                $(".list-items").removeClass("active");
                $(this).addClass("active");

            });

            // click and keypress event for posting message
            $("#user-message").on("keypress click", function(e) {
                var message = $("#user-message-input").val();
                if (message.length > 0 && ((e.type === "click" && e.target.id === "message-submit") || (e.type = "keypress" && e.keyCode === 13)))
                    that.postMessages(message);
            });

            // click event to logout
            $("#logout").on("click", function() {
                $("#messenger").hide();
                $("#login-container").show("slow");
                clearInterval(this.interval);
                
            });

            // checking for new messages(realtime)
            this.socket.on('chat message', function(msg) {
                 that.retrieveMessages(msg);
            });
        }
    }

    chatRooms.init();

});
