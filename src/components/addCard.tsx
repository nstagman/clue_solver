import type { JSXElement } from 'solid-js';
import { For } from 'solid-js';
import * as kn from '../knowledgeBase';
import { atomic } from '../logic';
import '../styles/addCard.css'


function AddCard(_:any): JSXElement{
  const players = kn.playerNamesOrdered();
  let player = players[0];
  let card = kn.people_names[0];

  function selectPlayer(event:any){ player = event.target.value; }
  function selectCard(event:any){ card = event.target.value; }
  function addCardCB(){ kn.initialCard(player, atomic(card)) }

  return(
    <>
      <span>Add Your Cards</span>
      <div id='AddCard'>
        <label for='player' title='The player holding card'>player</label>
          <select onChange={selectPlayer} id='player'>
            <For each={kn.playerNamesOrdered()}>{ (name:string) =>
              <option value={name}>{name}</option>
            }</For>
          </select>
          <label for='card' title='The card being held'>card</label>
          <select onChange={selectCard} id='card'>
            <optgroup label='People'>
              <For each={Array.from(kn.people_names)}>{ (name:string) =>
                <option value={name}>{name}</option>
              }</For>
            </optgroup>
            <optgroup label='Rooms'>
              <For each={Array.from(kn.room_names)}>{ (name:string) =>
                <option value={name}>{name}</option>
              }</For>
            </optgroup>
            <optgroup label='Weapons'>
              <For each={Array.from(kn.weapon_names)}>{ (name:string) =>
                <option value={name}>{name}</option>
              }</For>
            </optgroup>
          </select>
        <button 
          onClick={addCardCB}
          title='Add Card to Knowledgebase'
        >
          Add Card {'\u2795'}
        </button>
      </div>
    </>
  );
}


export { AddCard };
