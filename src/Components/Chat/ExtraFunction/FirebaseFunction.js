import {NotificationManager} from 'react-notifications'
import Swal from 'sweetalert2'

//show challenge of tictactoe if other player sent a challenge in topBar.js
export const showChallengeTicTacToe =  (accept,decline,photo,name) =>{
    Swal.fire({
        title:"TIC TAC TOE CHALLENGE",
        imageUrl: photo,
        text:name,
        showDenyButton:true,
        confirmButtonText : "Accept",
        confirmButtonColor:"#4CAF50",
        denyButtonText:"Decline"
    }).then(result=>{
        if(result.isConfirmed){
            accept()
        }else if(result.isDenied){
            decline();
        }
    })
}
//send challenge to other user in GameContainer.js
export const sendChallengeTicTacToe = async(setChallengeButton,ref,auth,gameid,firestore,uid,name,photo,history,firebase)=>{
    setChallengeButton("Challenging");
        await ref.update({
            challenge:auth.currentUser.uid,
            challengeName : auth.currentUser.displayName,
            challengePhoto : auth.currentUser.photoURL,
            gameid : gameid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(async()=>{
            await firestore.collection('tictactoe').doc(gameid).set({
                gameid:gameid,
                isPlaying : false,
                host : {
                    uid : auth.currentUser.uid,
                    name : auth.currentUser.displayName,
                    photo : auth.currentUser.photoURL    
                },
                accepter : {
                    uid : uid,
                    name : name,
                    photo : photo,
                },
                playerturn : auth.currentUser.uid,
                button : {
                    zero : {
                        state : false,
                        value : ""
                    },
                    one : {
                        state : false,
                        value : ""
                    },
                    two : {
                        state : false,
                        value : ""
                    },
                    three : {
                        state : false,
                        value : ""
                    },
                    four : {
                        state : false,
                        value : ""
                    },
                    five : {
                        state : false,
                        value : ""
                    },
                    six : {
                        state : false,
                        value : ""
                    },
                    seven : {
                        state : false,
                        value : ""
                    },
                    eight : {
                        state : false,
                        value : ""
                    }
                },
                win : "",
                tie : false,
                online : {
                    host : "",
                    acceptor : ""
                },
                accept : ""
            }).then(()=>{
                    setChallengeButton("Challenge sent, You will be redirected to another page in 2 second");
                    history.push(`/home/tictactoe/${gameid}`);    
            })
            
        }).catch(error=>{
            setChallengeButton("Challenge");
            alert("alert challenging");
        })
}
//tic tac toe accept and decline in topbar.js
export const tictactoeDecline = (firestore,id,auth) =>{
    const query = firestore.collection("gameActive").doc(auth.currentUser.uid);
    const query1 = firestore.collection('tictactoe').doc(id);
        var batch = firestore.batch();
        batch.update(query,{'challenge':"",'challengeName':"",'challengePhoto':'','createdAt':''})
        batch.update(query1,{'accept':'decline'})
        batch.commit();
}
export const tictactoeAccept = (firestore,id,challenge,auth,history)=>{
    const query1 = firestore.collection('tictactoe').doc(id);
        const query2 = firestore.collection('gameActive').doc(auth.currentUser.uid);
        var batch=firestore.batch();
        batch.update(query1,{'isPlaying':true,'online':{'host':challenge,'accepter':auth.currentUser.uid}});
        batch.update(query2,{'challenge':"",'challengePhoto':"",'challengeName':""});

        batch.commit().then(()=>{
            history.push(`/home/tictactoe/${id}`);
        })
}
//-----------------------------------

//message sent by input box in chat
export const sentMessage = (id,formValue,setFormDisable,firestore,profileData,firebase,setFormValue,inputRef,setInputFocus) =>{
        if(formValue===""){
            NotificationManager.warning('Enter some text in the input box','',4000);
            return;
        }
        setFormDisable(true);
        var batch = firestore.batch();

        var newMessageRef = firestore.collection('messages').doc(profileData.roomid).collection('userMessages').doc();


        var roomRecentMessageRef = firestore.collection('rooms').doc(firebase.auth.currentUser.uid).collection('userRooms').doc(profileData.roomid);
        var roomRecentMessageRefOther = firestore.collection('rooms').doc(id).collection('userRooms').doc(profileData.roomid);

        batch.set(newMessageRef, {
            message : formValue,
            from : firebase.auth.currentUser.uid,
            createdAt : firebase.firebase.firestore.FieldValue.serverTimestamp(),
            photo :  firebase.auth.currentUser.photoURL,
            seen : false   
        });

        //setting the recent message in the room
        var res;
        if(formValue.length>20)
            res = formValue.slice(0, 19)+"...";
        else 
            res = formValue;
        batch.update(roomRecentMessageRef,{"message" : res,"createdAt" : firebase.firebase.firestore.FieldValue.serverTimestamp()});
        batch.update(roomRecentMessageRefOther,{"message" : res,"createdAt" : firebase.firebase.firestore.FieldValue.serverTimestamp()});

        batch.commit().then(()=>{
            setFormValue("");
            setFormDisable(false);
            inputRef.current.focus();
        }).catch(function(error){
            setFormDisable(false);
            setInputFocus(true);
            inputRef.current.focus();
            NotificationManager.error('Error sending message','',4000);
        })
}

//delete a specific message in chat
export const deleteSpecificMessage = (firestore,roomid,id,other,auth) =>{
    Swal.fire({
        text: 'Do you want to delete this message?',
        icon: 'question',
        allowOutsideClick:false,
        showCancelButton: true,
        showLoaderOnConfirm:true,
        confirmButtonText: 'Yes, Delete',
        cancelButtonText: 'No, cancel',
        preConfirm : ()=>{
             return firestore.collection('messages').doc(roomid).collection('userMessages').doc(id).delete()
            .then((response)=>{
                return response;
            }).catch(error=>{
                Swal.showValidationMessage(
                    `Request failed: ${error}`
                  )
            });
        }
      }).then((result) => {
        if (result.isConfirmed) {
            firestore.collection('messages').doc(roomid).collection('userMessages').orderBy('createdAt','desc').limit(1).get()
            .then(snap=>{
                var batch = firestore.batch();
                snap.forEach(data =>{
                    //update the rooms
                    batch.update(firestore.collection("rooms").doc(other).collection('userRooms').doc(roomid),{"message":data.data().message});
                    batch.update(firestore.collection("rooms").doc(auth.currentUser.uid).collection('userRooms').doc(roomid),{"message":data.data().message});
                })
                batch.commit().catch(err=>{
                    alert("error updating in the rooms");
                })
            })
            Swal.fire('Message Deleted','','success');
        }
      })
}

//Seen message feature
export const checkSeen = async(firestore,roomid,auth) =>{
    var query = firestore.collection('messages').doc(roomid).collection('userMessages');
    query = query.where('seen','==',false);
    await query.get().then(function(querySnapshot){
        var batch = firestore.batch();
        querySnapshot.forEach(function(Doc){
            if(Doc.data().from!==auth.currentUser.uid){
                batch.update(firestore.collection('messages').doc(roomid).collection('userMessages').doc(Doc.id),{"seen":true});
            }
        })
        batch.commit();
    }).catch(error=>{
        NotificationManager.error('Error seeing the message','',3000);
    });
};

// Delete contact and all the messages and any interaction
export const disconnectContact = async(setDisconnectDisable,setMessageDisable,setDisconnect,firestore,auth,uid,setProfileData,name,history) =>{
    setDisconnectDisable(true);
        setMessageDisable(true);
        setDisconnect("deleting");
        
        const batch = firestore.batch();

        //deleting from the logged in contacts
        const deleteContactRef= firestore.collection('contacts').doc(auth.currentUser.uid).collection('userRooms').doc(uid);
        batch.delete(deleteContactRef);
        //deleting from the other in contacts
        const deleteContactRefOther = firestore.collection('contacts').doc(uid).collection('userRooms').doc(auth.currentUser.uid);
        batch.delete(deleteContactRefOther);

        //deleting from the logged in rooms
        const deleteRoomRef = await firestore.collection('rooms').doc(auth.currentUser.uid).collection('userRooms').where('uid','==',uid).get();
        if(!deleteRoomRef.empty){
            var data = deleteRoomRef.docs[0];
            batch.delete(firestore.collection('rooms').doc(auth.currentUser.uid).collection('userRooms').doc(data.id));
            await firestore.collection('messages').doc(data.id).collection('userMessages').get().then(snapshot=>{
                snapshot.forEach(function(Doc){
                    batch.delete(firestore.collection('messages').doc(data.id).collection('userMessages').doc(Doc.id));
                })
            })
            batch.delete(firestore.collection('messages').doc(data.id));
        }
        //deleting from the other in rooms
        const deleteRoomRefOther = await firestore.collection('rooms').doc(uid).collection('userRooms').where('uid','==',auth.currentUser.uid).get();
        if(!deleteRoomRefOther.empty){
            var dataOther = deleteRoomRefOther.docs[0];
            batch.delete(firestore.collection('rooms').doc(uid).collection('userRooms').doc(dataOther.id));
        }

        Swal.fire({
            text: 'Do you want to disconnect with '+name+'?',
            icon: 'question',
            showCancelButton: true,
            showLoaderOnConfirm:true,
            confirmButtonText: 'Yes, Delete',
            cancelButtonText: 'No, cancel',
            preConfirm : ()=>{
                return batch.commit()
                .then((response)=>{
                    setProfileData({
                        name:null,
                        photo:null,
                        uid:null,
                        roomid:null
                    });
                    history.push('/home/chat');
                    return response;
                }).catch(error=>{
                    setDisconnectDisable(false);
                    setMessageDisable(false);
                    Swal.showValidationMessage(
                        `Request failed: ${error}`
                      )
                });
            },
            allowOutsideClick: () => !Swal.isLoading()
          }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire('','Disonnected','success');
            }else if(result.dismiss){
                setDisconnectDisable(false);
                setMessageDisable(false);
                setDisconnect("disconnect");
            }
          })
}

// connect message from the active list
export const connectContact = async(roomRefAuth,uid,setMessageDisable,setMessage,setActive,setProfileData,name,picture,history,firestore,auth,firebase,setVisible) =>{
    const check = roomRefAuth.where("uid","==",uid).limit(1);
    setMessageDisable(true);
    setMessage("loading...");
    const query = await check.get();
    if(!query.empty){
        const snapshot = query.docs[0];
        setActive(1);
        setProfileData({
            name:name,
            photo:picture,
            uid:uid,
            roomid:snapshot.id
        })
        history.push(`/home/chat/${uid}`)
        NotificationManager.success('You have already initiated message with '+name,'',3000);
    }else {
        var batch = firestore.batch();

        const uniqueId = firestore.collection('rooms').doc(uid).collection('userRooms').doc();

        const refRoomOther = firestore.collection('rooms').doc(uid).collection('userRooms').doc(uniqueId.id);
        const refRoomAuth = firestore.collection('rooms').doc(auth.currentUser.uid).collection('userRooms').doc(uniqueId.id);

        batch.set(refRoomAuth,{
            username:name,
            photo:picture,
            uid : uid,
            message :"You are connected",
            createdAt : firebase.firestore.FieldValue.serverTimestamp()
        })
        batch.set(refRoomOther,{
            username : auth.currentUser.displayName,
            photo:auth.currentUser.photoURL,
            uid : auth.currentUser.uid,
            message : "You are connected",
            createdAt : firebase.firestore.FieldValue.serverTimestamp()
        })

        batch.commit().then(()=>{
            setVisible("hidden");
            setActive(1);
            setProfileData({
                name:name,
                photo:picture,
                uid:uid,
                roomid:uniqueId.id
            })
            history.push(`/home/chat/${uid}`)
            NotificationManager.success('Message Initiated with '+name,'',4000);
        }).catch(error=>{
            setMessageDisable(false);
            NotificationManager.error('Error messaging','',5000);
        })

    }
}

//add to contacts list
export const addToContact = async(setDisable,setButtonText,firestore,userRef,uid,username,photo,auth,firebase,setPresent) =>{
    setDisable(true);
        setButtonText("Adding...");
        var batch = firestore.batch();

        batch.set(userRef.doc(uid),{username: username,photo:photo,uid:uid});
        batch.set(firestore
            .collection('contacts')
            .doc(uid)
            .collection('userRooms')
            .doc(auth.currentUser.uid),
            {username:auth.currentUser.displayName,photo:auth.currentUser.photoURL,uid:auth.currentUser.uid});
        
        await batch.commit()
                .then(async()=>{
                    //adding to notification
                    await firestore.collection('notification').doc(uid).collection('userNotification')
                    .add({
                        text:username+" added you into their contact list",
                        createdAt : Date.now()
                    })
                    const increment = firebase.firestore.FieldValue.increment(1);
                    await firestore.collection('notificationCount').doc(uid).update({
                        count : increment
                    })
                    setPresent(true);
                    NotificationManager.success(username+' added to contacts','',3000);
                }).catch(error=>{
                    alert("error in adding friends"+error);
                })
}

//Toggle online and offline in Game.js
export const toggleOnlineOffline = (checkBox,query) =>{
    var text = checkBox?"offline":"online";
        //taking a final confirmation
        Swal.fire({
            text: 'Do you want to be '+text+"?",
            icon: 'question',
            allowOutsideClick:false,
            showCancelButton: true,
            showLoaderOnConfirm:true,
            confirmButtonText: 'Yes, Do it',
            cancelButtonText: 'No, cancel',
            preConfirm : ()=>{
                 return query.update({ online : !checkBox })
                .then((response)=>{
                    return response;
                }).catch(error=>{
                    Swal.showValidationMessage(
                        `Request failed: ${error}`
                      )
                });
            }
          }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire('','You are '+text,'success');
            }
          })
}
//initialise offline when the user is new in game.js
export const initiateOnlineOffline = async(query,auth)=>{
    await query.get().then(data=>{
        if(!data.exists){
            query.set({
                online : false,
                name : auth.currentUser.displayName,
                uid : auth.currentUser.uid,
                photo : auth.currentUser.photoURL,
                accept : "",
                challenge : "",
                challengeName : "",
                challengePhoto : "",
                score : 1500
            }).catch(err=>{
                alert("error adding new game active")
            })
        }
    }).catch(err=>{
        alert("alert inserting new data in the game active");
    })
}

