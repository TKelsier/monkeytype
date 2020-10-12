let MP = {
  state: -1,
  socket: io('localhost:3000', { autoConnect: false, reconnectionAttempts: 3 }),
  reconnectionAttempts: 0,
}

//-1 - disconnected
//1 - connected
//10 - lobby
//20 - test about to start
//21 - test active
//29 - test finished, result 

function mp_init() {
  $(".pageTribe .preloader .text").text('Connecting to Tribe');
  MP.socket.connect();
}

function mp_refreshUserList() {
  $(".pageTribe .lobby .userlist .list").empty();
  MP.room.users.forEach(user => {
    let crown = '';
    if (user.isLeader) {
      crown = '<i class="fas fa-star"></i>';
    }
    $(".pageTribe .lobby .userlist .list").append(`
    <div class='user'>${user.name} ${crown}</div>
    `)
  })
}

function mp_resetLobby(){
  $(".pageTribe .lobby .userlist .list").empty();
  $(".pageTribe .lobby .chat .messages").empty();
  $(".pageTribe .lobby .inviteLink").text('');
}

function mp_applyRoomConfig(cfg) {
  changeMode(cfg.mode);
  if (cfg.mode === "time") {
    changeTimeConfig(cfg.mode2);
  } else if (cfg.mode === "words") {
    changeWordCount(cfg.mode2);
  } else if (cfg.mode === "quote") {
    changeQuoteLength(cfg.mode2);
  }
  setDifficulty(cfg.difficulty, true);
  setBlindMode(cfg.blindMode, true);
  changeLanguage(cfg.language, true);
  activateFunbox(cfg.funbox, true);
  setStopOnError(cfg.stopOnError, true);
  setConfidenceMode(cfg.confidenceMode, true);
}

function mp_refreshConfig() {
  $(".pageTribe .lobby .currentSettings .groups").empty();

  $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Mode" data-balloon-pos="up">
    <i class="fas fa-bars"></i>${MP.room.config.mode}
    </div>
    `);
  
  if (MP.room.config.mode === "time") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Time" data-balloon-pos="up">
    <i class="fas fa-clock"></i>${MP.room.config.mode2}
    </div>
    `);
  } else if (MP.room.config.mode === "words") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Words" data-balloon-pos="up">
    <i class="fas fa-font"></i>${MP.room.config.mode2}
    </div>
    `);
  } else if (MP.room.config.mode === "quote") {

    let qstring = "all";
    let num = MP.room.config.mode2;
    if (num == 0) {
      qstring = "short";
    } else if (num == 1) {
      qstring = "medium";  
    } else if (num == 2) {
      qstring = "long";
    } else if (num == 3) {
      qstring = "thicc";
    }

    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Quote length" data-balloon-pos="up">
    <i class="fas fa-quote-right"></i>${qstring}
    </div>
    `);
  }
  
  
  
  $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Language" data-balloon-pos="up">
    <i class="fas fa-globe-americas"></i>${MP.room.config.language}
    </div>
    `);

  if (MP.room.config.difficulty === "normal") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Difficulty" data-balloon-pos="up">
    <i class="far fa-star"></i>normal
    </div>
    `);
  } else if (MP.room.config.difficulty === "expert") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Difficulty" data-balloon-pos="up">
    <i class="fas fa-star-half-alt"></i>expert
    </div>
    `);
  } else if (MP.room.config.difficulty === "master"){
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Difficulty" data-balloon-pos="up">
    <i class="fas fa-star"></i>master
    </div>
    `);
  }

  if (MP.room.config.blindMode) {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Blind mode" data-balloon-pos="up">
    <i class="fas fa-eye-slash"></i>blind
    </div>
    `);
  } else {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Blind mode" data-balloon-pos="up">
    <i class="fas fa-eye-slash"></i>off
    </div>
    `);
  }

  $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Funbox" data-balloon-pos="up">
    <i class="fas fa-gamepad"></i>${MP.room.config.funbox}
    </div>
    `);

  if (MP.room.config.confidenceMode === "off") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Confidence mode" data-balloon-pos="up">
    <i class="fas fa-backspace"></i>off
    </div>
    `);
  } else if (MP.room.config.confidenceMode === "on") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Confidence mode" data-balloon-pos="up">
    <i class="fas fa-backspace"></i>confidence
    </div>
    `);
  } else if (MP.room.config.confidenceMode === "max"){
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Confidence mode" data-balloon-pos="up">
    <i class="fas fa-backspace"></i>max
    </div>
    `);
  }

  if (MP.room.config.stopOnError === "off") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Stop on error" data-balloon-pos="up">
    <i class="fas fa-hand-paper"></i>off
    </div>
    `);
  } else {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Stop on error" data-balloon-pos="up">
    <i class="fas fa-hand-paper"></i>stop on ${MP.room.config.stopOnError}
    </div>
    `);
  }

}

MP.socket.on('connect', (f) => {
  MP.state = 1;
  MP.reconnectionAttempts = 0;
  showNotification('Connected to Tribe', 1000);
  let name = "Guest";
  if (firebase.auth().currentUser !== null) {
    name = firebase.auth().currentUser.displayName
  }
  MP.id = MP.socket.id;
  MP.name = name;
  MP.socket.emit("mp_system_name_set", { name: name });
  $(".pageTribe .lobby div").removeClass('hidden');
  $(".pageTribe .prelobby div").removeClass('hidden');
  if (MP.autoJoin) {
    MP.socket.emit("mp_room_join", { roomId: MP.autoJoin });
    MP.autoJoin = undefined;
    swapElements($(".pageTribe .preloader"), $(".pageTribe .lobby"), 250);
  } else {
    swapElements($(".pageTribe .preloader"), $(".pageTribe .prelobby"), 250);
  }
})

MP.socket.on('disconnect', (f) => {
  MP.state = -1;
  MP.room = undefined;
  showNotification('Disconnected from Tribe', 1000);
  mp_resetLobby();
  $(".pageTribe div").addClass("hidden");
  $('.pageTribe .preloader').removeClass('hidden').css('opacity',1);
  $(".pageTribe .preloader").html(`
  <i class="fas fa-fw fa-times"></i>
            <div class="text">Disconnected from tribe</div>
            `);
})

MP.socket.on('connect_failed', (f) => {
  MP.state = -1;
  MP.reconnectionAttempts++;
  if (MP.reconnectionAttempts === 4) {
    $(".pageTribe .preloader").html(`
    <i class="fas fa-fw fa-times" aria-hidden="true"></i>
    <div class="text">Connection failed.</div>
            `);
  } else {
    $(".pageTribe .preloader .text").text('Connection failed. Retrying');
  }
})

MP.socket.on('connect_error', (f) => {
  MP.state = -1;
  MP.reconnectionAttempts++;
  console.error(f);
  if (MP.reconnectionAttempts === 4) {
    $(".pageTribe .preloader").html(`
    <i class="fas fa-fw fa-times" aria-hidden="true"></i>
    <div class="text">Connection failed</div>
            `);
  } else {
    $(".pageTribe .preloader .text").text('Connection error. Retrying');
    showNotification('Tribe connection error: ' + f.message, 3000);
  }
})

MP.socket.on('mp_room_joined', data => {
  MP.room = data.room;
  if (MP.room.users.filter(user => user.socketId === MP.socket.id)[0].isLeader) {
    MP.room.isLeader = true;
  }
  mp_refreshUserList();
  if (MP.state === 10) {
    //user is already in the room and somebody joined
  } else if(MP.state === 1) {
    //user is in prelobby and joined a room
    mp_applyRoomConfig(MP.room.config);
    mp_refreshConfig();
    let link = "www.monkey-type.com/tribe" + MP.room.id.substring(4);
    $(".pageTribe .lobby .inviteLink").text(link);
    swapElements($(".pageTribe .prelobby"), $(".pageTribe .lobby"), 250, () => {
      MP.state = 10;
      // $(".pageTribe .prelobby").addClass('hidden');
    });
  }
})

MP.socket.on('mp_room_user_left', data => {
  MP.room = data.room;
  mp_refreshUserList();
})

MP.socket.on('mp_chat_message', data => {
  let cls = "message";
  let author = '';
  if (data.isSystem) {
    cls = "systemMessage";
  } else {
    author = `<div class="author">${data.from.name}</div>`;
  }
  $(".pageTribe .lobby .chat .messages").append(`
    <div class="${cls}">${author}${data.message}</div>
  `);
  let chatEl = $(".pageTribe .lobby .chat .messages");
  chatEl.animate({ scrollTop: $($(".pageTribe .lobby .chat .message")[0]).outerHeight() * 2 * $(".pageTribe .lobby .chat .messages .message").length }, 0);
})

MP.socket.on('mp_system_message', data => {
  showNotification(`Tribe: ${data.message}`,2000);
})

$(".pageTribe #createPrivateRoom").click(f => {
  activateFunbox("none");
  changeLanguage("english");
  changeMode("quote");
  let mode2;
  if (config.mode === "time") {
    mode2 = config.time;
  } else if (config.mode === "words") {
    mode2 = config.words;
  } else if (config.mode === "quote") {
    mode2 = config.quoteLength === undefined ? "-1" : config.quoteLength;
  }
  MP.socket.emit("mp_room_create", {
    config: {
      mode: config.mode,
      mode2: mode2,
      difficulty: config.difficulty,
      blindMode: config.blindMode,
      language: config.language,
      funbox: activeFunBox,
      stopOnError: config.stopOnError,
      confidenceMode: config.confidenceMode
    }
  });
})

$(".pageTribe .lobby .chat .input input").keyup(e => {
  if (e.keyCode === 13) {
    let msg = $(".pageTribe .lobby .chat .input input").val();
    MP.socket.emit('mp_chat_message',
      {
        isSystem: false,
        message: msg,
        from: {
          id: MP.socket.id,
          name: MP.name
        }
      });
    $(".pageTribe .lobby .chat .input input").val('');
  }
})