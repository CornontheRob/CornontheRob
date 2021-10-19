import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-app.js";
import * as rtdb from "https://www.gstatic.com/firebasejs/9.0.2/firebase-database.js";
import * as fbauth from "https://www.gstatic.com/firebasejs/9.0.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAtRPh3V4lq2TtmH2pFNNJQ1BqyF1Df_T0",
  authDomain: "chatboxdb-7e326.firebaseapp.com",
  databaseURL: "https://chatboxdb-7e326-default-rtdb.firebaseio.com",
  projectId: "chatboxdb-7e326",
  storageBucket: "chatboxdb-7e326.appspot.com",
  messagingSenderId: "310694097575",
  appId: "1:310694097575:web:060928692bca43a79a2182"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let db = rtdb.getDatabase(app);
let chatListRef = rtdb.ref(db, "/chats");
var chatRef = rtdb.ref(db, "/chats/global"); //default to global chat
let usersRef = rtdb.ref(db, "/people");
let auth = fbauth.getAuth(app);

var myUser = "";
var myID = "";
var isAdmin = false;
var currentBoard = chatRef; //Defaults to global
$("#adminConsole").hide();
let userStart = function (peopleObject) {
  var uID = peopleObject.uid;
  myID = uID;
  let usernameGotten = rtdb.ref(db, `/people/${myID}/name`);
  let roleGotten = rtdb.ref(db, `/people/${myID}/roles/admin`);
  rtdb.get(usernameGotten).then((ss) => {
    myUser = ss.val();
    $("#userDisplayBox").html(myUser);
  });
  rtdb.get(roleGotten).then((ss) => {
    isAdmin = ss.val();
    if (isAdmin == false) {
      $("#adminConsole").hide();
      $(".adminElement").hide();
    } else {
      $("#adminConsole").show(); //may not be required, since they show anyway
      $(".adminElement").show();
    }
  });
};

//Auth Change
fbauth.onAuthStateChanged(auth, (user) => {
  if (!!user) {
    $("#loginSection").hide();
    userStart(user);
    $(".g1").show();
    $("#loginConfirm").html("Logged in");
    $("#loginConfirm").append(
      `<button type="button" id="logoutButton">Logout</button>`
    );
    $("#logoutButton").on("click", () => {
      fbauth.signOut(auth);
    });
  } else {
    $("#loginSection").show();
    $("userDisplayBox").html("");
    $(".g1").hide();
    $("#loginConfirm").html("");
  }
});

//Register Functionality
$("#registerButton").on("click", () => {
  let email = $("#emailRegister").val();
  //email = email.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let passwordA = $("#passwordARegister").val();
  //passwordA = passwordA.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let passwordB = $("#passwordBRegister").val();
  //passwordB = passwordB.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  if (passwordA != passwordB) {
    alert("Failed to Login: Passwords don't match");
    return;
  }
  var username = $("#usernameRegister").val();
  //username = username.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  fbauth
    .createUserWithEmailAndPassword(auth, email, passwordA)
    .then((datahold) => {
      let userid = datahold.user.uid;
      let usernameRef = rtdb.ref(db, `/people/${userid}/name`);
      rtdb.set(usernameRef, username);
      let userEmailRef = rtdb.ref(db, `/people/${userid}/email`);
      rtdb.set(userEmailRef, email);
      let userRoleRef = rtdb.ref(db, `/people/${userid}/roles/admin`);
      rtdb.set(userRoleRef, false);
    })
    .catch(function (error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log(errorCode);
      console.log(errorMessage);
    });
});

//Login Functionality
$("#loginButton").on("click", () => {
  let email = $("#emaillogin").val();
  //email = email.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let password = $("#passwordlogin").val();
  //password = password.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  fbauth
    .signInWithEmailAndPassword(auth, email, password)
    .then((datahold) => {
      //console.log(datahold);
    })
    .catch(function (error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log(errorCode);
      console.log(errorMessage);
    });
});

//Button Functionality
$("#sendButton").click(function () {
  let proposed = $("#message").val();
  proposed = proposed.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  var timeNow = Date().valueOf();
  var timeEdited = timeNow.split(" ");
  var timeFinal =
    timeEdited[1] +
    " " +
    timeEdited[2] +
    " " +
    timeEdited[3] +
    " " +
    timeEdited[4];
  var uname = $("#userDisplayBox").text();
  let message = {
    edited: false,
    msg: proposed,
    ownerdisplay: uname,
    time: timeFinal
  };
  rtdb.push(chatRef, message);
});

//Chat Messages Appearing After Sending A New One
rtdb.onValue(chatRef, (ss) => {
  $("#chats").empty();
  let saved = ss.val();
  if (saved == null) {
    saved = "";
  }
  let keys = Object.keys(saved);
  keys.map((pass) => {
    if (saved[pass].edited == false) {
      $("#chats").append(
        `<div class='chatsElement' data-id=${pass}>${
          saved[pass].ownerdisplay +
          " (" +
          saved[pass].time +
          "): " +
          saved[pass].msg
        }</div>`
      );
    } else {
      $("#chats").append(
        `<div class='chatsElementEdited' data-id=${pass}>${
          saved[pass].ownerdisplay +
          " (EDITED " +
          saved[pass].time +
          "): " +
          saved[pass].msg
        }</div>`
      );
    }
  });
  $(".chatsElement").click(clickElementFromList);
});

//Onclick functionality for edit message
let clickElementFromList = function (evt) {
  let clickedElement = evt.currentTarget;
  let idFromDOM = $(clickedElement).attr("data-id");
  let messageGrabbed = this.innerHTML;
  let messageIndex = messageGrabbed.indexOf(" (");
  let messageWorked = messageGrabbed.slice(0, messageIndex);
  var username = $("#userDisplayBox").text();
  if (username == messageWorked || isAdmin == true) {
    $(clickedElement).after(`
    <input type="text"
      data-edit=${idFromDOM}
      class="msgedit"
      placeholder="Edit Message"/>
     <button data-done=${idFromDOM}>Apply Edit</button>`);
    $(`[data-done=${idFromDOM}]`).on("click", (evt) => {
      let editedMsg = $(`[data-edit=${idFromDOM}]`).val();
      editedMsg = editedMsg.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      sendEdit(idFromDOM, editedMsg, myID);
      $(`[data-edit=${idFromDOM}]`).remove();
      $(`[data-done=${idFromDOM}]`).remove();
    });
  } else {
    alert("You can't edit this message");
  }
};

let sendEdit = function (msgid, msgup, userid) {
  let msgRef = rtdb.child(chatRef, msgid);
  let newTime = Date().valueOf();
  var timeEdited = timeNow.split(" ");
  var timeFinal =
    timeEdited[1] +
    " " +
    timeEdited[2] +
    " " +
    timeEdited[3] +
    " " +
    timeEdited[4];
  rtdb.update(msgRef, { edited: true, msg: msgup, time: timeFinal });
};

var promoteToAdmin = function (candidate) {
  let currentCan = candidate.currentTarget;
  var currentID = $(currentCan).attr("data-id");
  let candidateRoleRef = rtdb.ref(db, `people/${currentID}/roles/admin`);
  rtdb.get(candidateRoleRef).then((ss) => {
    if (ss.val() != true) {
      rtdb.set(candidateRoleRef, true);
    }
  });
};

var betrayAdmin = function (candidate) {
  let currentCan = candidate.currentTarget;
  var currentID = $(currentCan).attr("data-id");
  let candidateRoleRef = rtdb.ref(db, `people/${currentID}/roles/admin`);
  rtdb.get(candidateRoleRef).then((ss) => {
    if (ss.val() != false) {
      rtdb.set(candidateRoleRef, false);
    }
  });
};

var createNewBoard = function (user) {
  let newBoardName = window.prompt("New Board Topic: ");
  let editBoardName = newBoardName.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\s/g, "");
  let boardObj = { name: newBoardName };
  rtdb.push(chatListRef, boardObj);
};

$("#makeNewBoard").click(createNewBoard);

//Boards List Updater
rtdb.onValue(chatListRef, (ss) => {
  $("#createdBoards").empty();
  let boardIDList = Object.keys(ss.val());
  boardIDList.map((idHold) => {
    let name = String([idHold]);
    if (name != null) {
      $("#createdBoards").append(
        `<div class="createdBoard" data-id=${idHold}>${name}</div> <button type="button" class="join" data-id=${idHold}>Join</button>`
      );
    }
    $(".join").click(joinBoard);
  });
});

var joinBoard = function (target) {
  let currentTarg = target.currentTarget;
  var currentID = $(currentTarg).attr("data-id");
  let newBoardRef = rtdb.ref(db, `/chats/${currentID}`);
  rtdb.get(newBoardRef).then((ss) => {
    $("#boardInfo").html("You are in " + currentID);
  });

  currentBoard = newBoardRef;
  if (currentBoard != chatRef) {
    //If
    rtdb.get(currentBoard).then((ss) => {
      $("#chats").empty();
      let saved = ss.val();
      if (saved == null) {
        saved = "";
      }
      let keys = Object.keys(saved);
      keys.map((pass) => {
        if (saved[pass].edited == false) {
          $("#chats").append(
            `<div class='chatsElement' data-id=${pass}>${
              saved[pass].ownerdisplay +
              " (" +
              saved[pass].time +
              "): " +
              saved[pass].msg
            }</div>`
          );
        } else {
          $("#chats").append(
            `<div class='chatsElementEdited' data-id=${pass}>${
              saved[pass].ownerdisplay +
              " (EDITED " +
              saved[pass].time +
              "): " +
              saved[pass].msg
            }</div>`
          );
        }
      });
      $(".chatsElement").click(clickElementFromList);
    });
    chatRef = rtdb.ref(db, `/chats/${currentID}`); //Fix chatRef
  }
  console.log("Joined");
};

//Users List Updater
rtdb.onValue(usersRef, (ss) => {
  $("#usersList").empty();
  if (ss.val() != null) {
    let userIDList = Object.keys(ss.val());
    userIDList.map((inTheHold) => {
      let name = JSON.stringify(ss.val()[inTheHold].name);
      let nameIn = name.replace(/"/g, "").replace(/</g, "&lt;").replace(/</g, "&rt;");
      let adminTest = ss.val()[inTheHold].roles.admin;
      if (adminTest == true) {
        $("#usersList").append(`
          <div class="g2" data-id=${inTheHold}>${nameIn + "*"}</div>
          <button type="button" class="betrayButton" data-id=${inTheHold}>Betray Admin</button>`);
      } else {
        $("#usersList").append(`
          <div class="g2" data-id=${inTheHold}>${nameIn}</div>
          <button type="button" class="promoteButton" data-id=${inTheHold}>Promote</button>`);
      }
    });
    $(".promoteButton").click(promoteToAdmin);
    $(".betrayButton").click(betrayAdmin);
  }
});
