import { useEffect, useState } from 'react'
import React from 'react'

function Home({io}) {
    const [name, setName] = useState('')
    const [frndName, setFrndName] = useState('')
    const [loader, setLoader] = useState('connecting to server...')
    const [myAction, setMyAction] = useState(!1)
    // showActions is used to show the values that the players enter during each delivery
    const [showActions, setShowActions] = useState('') //{user : 0, frnd : 0} obj format
    const [myToss, setMyToss] = useState(!1)
    const [stage, setStage] = useState(-10)
    const [scores, setScores] = useState({ myScore: -1, frndScore: -1 })
  
    
    let nums = [0, 1, 2, 3, 4, 5, 6]

    let setInitialScores = (a)=>{
      // a is nothing but value of myAction
      if(a==true) setScores({...scores, myScore: 0}) //batting
      else setScores({...scores, frndScore: 0 }) //bowling
    }
    
    let reset=()=>{
      console.log('game over, reset called')
        setStage(-2)
        // it can be set when u click on play again
        // setScores({myScore:-1,frndScore:-1}) 
        setLoader('')
        setShowActions('')
    }
    
    let reset2=()=>{
      setFrndName('')
        setStage(-1)
        setScores({myScore:-1,frndScore:-1}) 
        setLoader('')
        setShowActions('')
    }

    useEffect(()=>{

   io.on('connect', () => {
     //connection to sever has been established
     setStage(-1) 
     setLoader('')
     console.log('my id is ',io.id)
     console.log('connected to server')
   })

   io.on('disconnect', () => {
     console.log('disconnected to server')
   })

   io.on('opponent_disconnected', () => {
     console.log('it seems the opponent disconnected')
    //  alert('it seems the opponent disconnected')
     reset2()
   })
     
      io.on('hello',(k)=>{
        console.log('hello ',name,'&',frndName)
      })
     
      io.on('in_game',(k)=>{
        console.log('player already joined a game')
        alert('player already joined a game')
      })
      
      io.on('play_req', (k) => {
        if(stage==-1){
          setFrndName(k.name)
          if (confirm(k.name+' has invited u for a match')) {
            let n=name
            while(n==''){
               n = prompt('plz enter ur name first','')
              setName(n)
            }
            io.emit('play_ack',{senderId:k.id, name:n})
            setLoader('waiting for '+k.name+ '\'s toss selection')
            setStage(0)
          }
        }else{     
           // i am already in a game, cant join
        }
      })
      
      io.on('play_ack', (k) => {
        if(stage==-3){
          setFrndName(k)
          setLoader('')
          let t = confirm('odd or even ?')
          // odd -> true, even -> false
          io.emit('toss', t)
          setMyToss(t)
          setStage(1)
        }else{      
          // i am already in a game, cant join
        }
      })
      
      io.on('rematch_req', (k) => {
        if(stage==-2){
          setLoader(frndName+' has invited u for a re-match. Click play_again to start match')
        }
      })
      
      io.on('rematch_started_toss',s=>{
        console.log('rematch toss')
        if(stage==-3){
          let t = confirm('odd or even ?')
          // odd -> true, even -> false
          io.emit('toss', t)
          setStage(1)
          setLoader('')
            setMyToss(t)
        }
      })
      
      io.on('rematch_started_wait',s=>{
        if(stage==-3){
          setLoader('waiting for '+frndName+ '\'s toss selection')
          setStage(0)
        }
      })
  
      io.on('toss', (k) => {
        if (stage != 1) {
          // console.log('received toss is ', k)
          setMyToss(!k)
          setStage(1)
          setLoader('')
        }
      })
  
      io.on('toss_results', (t) => {
        console.log('toss results ',t)
        setLoader('')
        if(Number.isInteger(t[name]) && Number.isInteger(t[frndName])){
          setShowActions({user:t[name], frnd:t[frndName]})
          let toss_result = true //odd
          if((t[name]+t[frndName])%2 == 0){
              toss_result=false
          }
    
         setTimeout(()=>{
          console.log(myToss , toss_result)
          if(myToss == toss_result){
            let a = confirm('U have won the toss. What do u choose bat or bowl ?')
            console.log('selected action is ',a)
            io.emit('action',a)
            setMyAction(a)
            setInitialScores(a)
            setStage(2)
          }else{
            setLoader('U have lost the toss. Waiting for '+frndName+' to decide...')
          }
         }, 1000)
        }else{
          console.log('toss_results obj is incomplete')
        }
      })
      
      io.on('action', (t) => {
        console.log('received action value ',t)
        setMyAction(!t)
        setInitialScores(!t)
        setLoader('')
        if(stage!=2) setStage(2)
        console.log('at action receeived loader value is ',loader)
      })
    
    io.on('delivery_result', (t) => {
        console.log('received delivery result ',t)
        if(myAction==true){  //batting
          setShowActions({user : t.bat, frnd : t.bowl})
          if(t.bat == t.bowl){ //out
            setLoader('OUT! OH NO.')
            if(scores.frndScore == -1){
              setTimeout(()=>{
                setLoader('Changing innings...');
                setTimeout(setLoader,1000,'')
              }, 1500);
              setTimeout(() => {
                // change innings
              io.emit('action',!myAction)
              setMyAction(!myAction)
              setScores({...scores,frndScore:0})
              setStage(2)
              }, 2500);
            }else{
              // declare win,loss,tie
              console.log('need to declare ')
              if(scores.myScore > scores.frndScore){
                setLoader('yayy u won')
              }else if(scores.myScore < scores.frndScore){
                setLoader('oops u lost')
              }else{
                setLoader('its a tie')
              }
              // io.emit('game_over','')
              setTimeout(reset,2000)
            }
          }else{ //not out, i scored some runs 
            if((scores.frndScore != -1) && (scores.myScore+t.bat > scores.frndScore)){
              //win
              setLoader('yayy u won')
              // io.emit('game_over','')
              setTimeout(reset,2000)
            }else{
              setLoader('')
              setStage(2)
            }
            setScores({...scores, myScore:scores.myScore+t.bat})
          }
        }else{ //bowling
          setShowActions({user : t.bowl, frnd : t.bat})
          if(t.bat == t.bowl){ //out
            setLoader('OUT! YESS.')
            if(scores.myScore == -1){
              setTimeout(()=>{setLoader('Changing innings...')}, 1500);
              // change innings action need not be toggled or emitted by u bcoz it will be already emitted from the batting side
              // u will receive the action and set it
              // io.emit('action',!myAction)
              // setMyAction(!myAction)
              // setScores({...scores,frndScore:0})
            }else{
              // declare win,loss,tie
              if(scores.myScore > scores.frndScore){
                setLoader('yayy u won')
              }else if(scores.myScore < scores.frndScore){
                setLoader('oops u lost')
              }else{
                setLoader('its a tie')
              }
              // io.emit('game_over','')
              setTimeout(reset,2000)
            }
          }else{ //not out , ur frnd scored some runs
              if((scores.myScore != -1) && (scores.myScore < scores.frndScore+t.bat)){
              //lost
              setLoader('oops u lost')
              // io.emit('game_over','')
              setTimeout(reset,2000)
            }else{
              setLoader('')
              setStage(2)
            }
            setScores({...scores, frndScore:scores.frndScore+t.bat})
          }
        }
        
      })
  
      // VERY IMPT. USED TO AVOID CREATING DUPLICATE EVENT LISTENERS
      return ()=>{
        console.log('destroued')
        io.off('play_req');
        io.off('play_ack');
        io.off('toss');
        io.off('toss_results');
        io.off('action');
      }
    }, [stage,myToss,name,frndName,myAction,showActions,scores])

  
    return (
      <div>
        {stage == -1 && <div>
        <input type="text" placeholder='enter ur name' value={name} onChange={(e)=>setName(e.target.value)} />
          <button onClick={() => {
             let n=name
          while(n==''){
             n = prompt('plz enter ur name first','')
            setName(n)
          }
          io.emit('play_req',n)
          setStage(-3) //indicates that i am waiting for someone to respond/join
          setLoader('Waiting for a frnd to accept ur request')
        }}>play</button>
        </div>}
  
        {stage == -2 && <div>
        {/* <input type="text" placeholder='enter ur name' value={name} onChange={(e)=>setName(e.target.value)} /> */}
          <button onClick={() => {
            setScores({myScore:-1, frndScore:-1})
          io.emit('rematch_req', name)
          setStage(-3) //indicates that i am waiting for frnd to respond/join
          setLoader('Waiting for ' +frndName+' to accept ur request')
        }}>play again</button>
        <button onClick={()=>{
          io.emit('no_rematch','')
          reset2()
        }}>exit</button>
        </div>}
  
        {loader!='' && <div>
        {loader}
          {/* <div>loading ...</div> */}
        </div>}
  
        {stage == 1 && <div>
          <h3>Toss Time :</h3>
          <div>{name} : {myToss ? 'odd' : 'even'}</div>
          <div>{frndName} : {!myToss ? 'odd' : 'even'}</div>
        </div>}
  
        {(scores.myScore!=-1 || scores.frndScore!=-1) && <div>
          <h3>Innings :</h3>
          <div>{name} (You) : {myAction ? 'batting' : 'bowling'} , {scores.myScore!=-1 && `score : ${scores.myScore}`}</div>
          <div>{frndName} : {!myAction ? 'batting' : 'bowling'} , {scores.frndScore!=-1 && `score : ${scores.frndScore}`}</div>
        </div>}
  
          {showActions!='' && <div>
          <h2>Actions</h2>
            <div>{name} :{showActions.user}</div>
            <div>{frndName} :{showActions.frnd}</div>
          </div>}
  
        {stage > 0 && <div className='numpad'>
          {nums.map((e, i) => <button className='numkey' key={i} onClick={() => {
            // depending on stage value we will know at what stage we are in
            // then emit an event
            if(stage == 1){
              io.emit('toss_value',{id:name, value:e})
            }else if(stage==2){
              if(myAction==true) io.emit('bat',e)
              else io.emit('bowl',e)
            }
              setLoader('waiting...')
            setStage(0)
          }
          }>{e}</button>)}
        </div>}
      </div>
    )
  }

export default Home