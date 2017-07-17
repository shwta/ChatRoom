$(document).ready(function() {

    var chatRooms = {
        //Intialize chatrooms
        init: function() {
            this.socket = io();
            this.eventHandlers();
            this.retrieveMessages();
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
            var i = 0;

            if (i < 60) {
                var minuteIntervalinterval = setInterval(function() {
                    ++i;

                    if (i == 1)

                        $(".online-details span").text("for " + i + " Minute");

                    else

                        $(".online-details span").text("for " + i + " Minutes");

                }, 60000);
            }


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

        //Retrieve messages in relatime
        retrieveMessages: function() {
            var that = this;
            this.socket.on('chat message', function(msg) {

                if (msg[1] === that.chatroom_id) {
                   
                    var html = "";

                    $("#chat-window").animate({
                        scrollTop: $("#chat-window")[0].scrollHeight
                    }, 200);

                    if (msg[0] === that.username) {


                        html += "<div class='messages'><p class='message-content active'>" 
                                + msg[2] + "</p></div>";
                    } else

                        html += "<div class='messages'><p class='message-content'>" + msg[2] +
                                 "</p><p class='message-user-name' >" + msg[0] + "</p></div>";

                    $('#chat-window').append(html);
                }

            });
        },

       //event handlers 
        eventHandlers: function() {

            var that = this;

            $("#login-container").on("keypress click", function(e) {
                that.username = $("#username").val();
                if (that.username.length > 0 && ((e.type === "click" && e.target.id === "user-submit") || (e.type = "keypress" && e.keyCode === 13))) {

                    that.getChatRooms();
                    that.loadUserDetails();
                    $("#username").val("");
                }
                
            });

            $("ul").on("click", "li", function() {

                that.chatroom_id = $(this).attr('id');

                that.loadChatroomMessages();
                that.loadChatroomDetails();
                $(".list-items").removeClass("active");
                $(this).addClass("active");

            });

            $("#user-message").on("keypress click", function(e) {
                var message = $("#user-message-input").val();
                if (message.length > 0 && ((e.type === "click" && e.target.id === "message-submit") || (e.type = "keypress" && e.keyCode === 13)))
                    that.postMessages(message);
            });

            $("#logout").on("click", function() {
                $("#messenger").hide();
                $("#login-container").show("slow");
                
            });
        }
    }

    chatRooms.init();

});
