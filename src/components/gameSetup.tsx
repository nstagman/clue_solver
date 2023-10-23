import type { JSXElement } from 'solid-js';
import { For, Index } from 'solid-js';
import * as kn from '../knowledgeBase';
import '../styles/gameSetup.css'


function GameSetup(_:any): JSXElement{
  const nums = [3,4,5,6];
  const numStrTable = new Map([
    [1,'1st:'], [2,'2nd:'], [3,'3rd:'], [4,'4th:'], [5,'5th:'], [6,'6th:']
  ]);
  let numPlayers = kn.numPlayers().toString();

  function selectNumPlayers(event:any){ numPlayers = event.target.value; }
  function newGame(){ kn.setNumPlayers(parseInt(numPlayers)); }

  function unfocusCB(event:any){
    // ignore if player name is already assigned
    if(kn.playerTable().get(event.target.value)){ return; }

    // set new name to player index and remove old name
    kn.setPlayerTable((oldTable) => {
      let oldPlayer = '';
      let position = 0;
      for(const [k,v] of oldTable.entries()){
        if(v === parseInt(event.target.id.slice(-1))){
          oldPlayer = k;
          position = v;
          break;
        }
      }
      const newTable:Map<string, number> = new Map(oldTable);
      newTable.set(event.target.value, position);
      newTable.delete(oldPlayer);
      return newTable;
    });
  }

  return(
    <>
    <span>Initial Game Setup</span>
    <div id='gameSetup'>
      <div id='playerCountContainer'>
        <span>
          <label
            for='numPlayers'
            title='Select number of players'
          >
            #Players
          </label>
          <select onChange={selectNumPlayers} id='numPlayers'>
            <For each={nums}>{ (num:number) =>
              <option value={num} selected={kn.numPlayers() === num ? true : false}>{num}</option>
            }</For>
          </select>
        </span>
        <div>
          <button
            onClick={newGame}
            title='Start a New Game'
            id='NewGameBtn'
          >
            New Game
          </button>
        </div>
      </div>
      <div id='playerGrid'>
        <span
          class='gridHeader'
          title='Assign players in the order that they are playing the game'
        >
          Order
        </span>
        <span 
          class='gridHeader'
          title='Rename players'
        >
          Name
        </span>
        <span 
          class='gridHeader'
          title='Number of cards in each players hand'
        >
          #Cards
        </span>
        <Index each={kn.playerNamesOrdered()}>{ (player, i) =>
          <>
            <label
              for={`Player${i+1}`}
              title={`Player going ${numStrTable.get(i+1)?.slice(0,-1)}`}
            >
              {numStrTable.get(i+1)}
            </label>
            <input id={`Player${i+1}`} type='text' value={player()} onfocusout={unfocusCB}></input>
            <span
              title={`${player()} Should Have ${kn.cardCounts().get(i+1)} Cards`}
            >
              {kn.cardCounts().get(i+1)}
            </span>
          </>
        }</Index>
      </div>
    </div>
    </>
  );
}


export { GameSetup };
