let chatHistory = [];
let messageKeys = [];
let selectedMessageIndex = null;

const currentUser = JSON.parse(sessionStorage.getItem('chatUser'));
const db = firebase.database();
const messagesRef = db.ref('messages');

const chatFeed = document.querySelector('#chat-feed');
const messageInput = document.querySelector('#message-input');
const sendBtn = document.querySelector('#send-btn');
const optionsModal = document.querySelector('#message-options-modal');
const closeModalBtn = document.querySelector('#close-modal-btn');
const pinMsgBtn = document.querySelector('#pin-msg-btn');
const blockUserBtn = document.querySelector('#block-user-btn');
const reactBtns = document.querySelectorAll('.react-btn'); 


// Listen for real-time updates from Firebase
messagesRef.on('value', function(snapshot){
    chatHistory = [];
    messageKeys = [];
    let data = snapshot.val();
    if(data){
        for(let key in data){
            messageKeys.push(key);
            chatHistory.push(data[key]);
        }
    }
    renderChatFeed();
});

function saveMessage(index){
    let key = messageKeys[index];
    db.ref('messages/' + key).set(chatHistory[index]);
}


async function sendMessage(){
    let text = messageInput.value.trim();
    if (text === "") return;
    if (text.length > 150) {
        alert("Message cannot exceed 150 characters.");
        return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = "Checking...";

    let finalMessageText = text;

    try{
        let url = `https://www.purgomalum.com/service/json?text=${encodeURIComponent(text)}`;
        
        let response = await fetch(url);
        let data = await response.json();
        
        finalMessageText = data.result; 
    }catch(error){
        console.error("Profanity API failed, sending original text.", error);
    }

    let newMessage = {
        senderName: currentUser.username,
        senderFlag: currentUser.flag || "", 
        text: finalMessageText,
        isPinned: false, 
        reaction: null 
    };

    messagesRef.push(newMessage);
    messageInput.value = "";

    sendBtn.disabled = false;
    sendBtn.textContent = "Send";
    
    messageInput.focus();
}

function renderChatFeed(){
    chatFeed.innerHTML = "";

    for(let i = 0; i < chatHistory.length; i++){
        let msg = chatHistory[i];
        let pinDisplay = msg.isPinned ? " [pinned]" : "";
        let reactionDisplay = msg.reaction ? ` <span style="font-size: 16px; background: white; border-radius: 10px; padding: 2px 5px; box-shadow: 0 1px 2px rgba(0,0,0,0.2); margin-left: 5px;">${msg.reaction}</span>` : "";

        let messageHTML;
        if(msg.blocked){
            messageHTML = `
                <div class="message" style="opacity: 0.5;">
                    <div class="message-header">
                        <span class="sender-name">${msg.senderName}</span>
                    </div>
                    <div class="message-bubble" style="background-color: #eee; color: #999; font-style: italic;">
                        This message is from a blocked user.
                    </div>
                </div>
            `;
        } else {
            messageHTML = `
                <div class="message" onclick="openMessageOptions(${i})" style="cursor: pointer;">
                    <div class="message-header">
                        <span class="sender-name">${msg.senderName}</span>
                        <span class="sender-flag">${msg.senderFlag}</span>
                        <span class="pin-status">${pinDisplay}</span>
                    </div>
                    <div class="message-bubble">
                        ${msg.text}${reactionDisplay}
                    </div>
                </div>
            `;
        }
        chatFeed.innerHTML += messageHTML;
    }
    chatFeed.scrollTop = chatFeed.scrollHeight;
}

sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', function(event){
    if(event.key === 'Enter'){
        sendMessage();
    }
});

function openMessageOptions(index){
    selectedMessageIndex = index;
    optionsModal.showModal();
}

function closeMessageOptions(){
    selectedMessageIndex = null;
    optionsModal.close();
}

closeModalBtn.addEventListener('click', closeMessageOptions);

pinMsgBtn.addEventListener('click', function(){
    if(selectedMessageIndex !== null){
        let msg = chatHistory[selectedMessageIndex];
        if(msg.senderName === currentUser.username){
            alert("You cannot pin your own messages.");
            return;
        }
        msg.isPinned = !msg.isPinned;
        saveMessage(selectedMessageIndex); 
        closeMessageOptions();
    }
});

blockUserBtn.addEventListener('click', function(){
    if(selectedMessageIndex !== null){
        let userToBlock = chatHistory[selectedMessageIndex].senderName;
        if(userToBlock === currentUser.username){
            alert("You cannot block yourself.");
            return;
        }
        let didConfirm = confirm(`Are you sure you want to block ${userToBlock}?`); 
        
        if(didConfirm){
            for(let i = 0; i < chatHistory.length; i++){
                if(chatHistory[i].senderName === userToBlock){
                    chatHistory[i].blocked = true;
                    saveMessage(i);
                }
            }
            closeMessageOptions();
        }
    }
});

for(let i = 0; i < reactBtns.length; i++){
    reactBtns[i].addEventListener('click', function(event){
        if(selectedMessageIndex !== null){
            chatHistory[selectedMessageIndex].reaction = event.target.textContent;
            saveMessage(selectedMessageIndex); 
            closeMessageOptions();
        }
    });
}