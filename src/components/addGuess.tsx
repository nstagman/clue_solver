import type { JSXElement } from 'solid-js';
import { For, createEffect, createSignal } from 'solid-js';
import * as kn from '../knowledgeBase';
import { atomic } from '../logic';
import '../styles/addGuess.css'


function AddGuess(_:any): JSXElement{
  const unknown = 'Unknown';
  const [person, setPerson] = createSignal(kn.people_names[0]);
  const [room, setRoom] = createSignal(kn.room_names[0]);
  const [weapon, setWeapon] = createSignal(kn.weapon_names[0]);
  const [refuted, setRefuted] = createSignal(true);
  const [guesser, setGuesser] = createSignal(kn.playerNamesOrdered()[0]);
  const [refuter, setRefuter] = createSignal(kn.playerNamesOrdered()[0]);
  const [card, setCard] = createSignal(unknown);

  createEffect(() => {
    setRefuter(kn.playerNamesOrdered().filter(p => p !== guesser())[0]);
  });
  createEffect(() => {
    person(); room(); weapon();
    setCard(unknown);
  });

  function personSelect(event:any){ setPerson(event.target.value); }
  function roomSelect(event:any){ setRoom(event.target.value); }
  function weaponSelect(event:any){ setWeapon(event.target.value); }
  function guesserSelect(event:any){ setGuesser(event.target.value); }
  function refuterSelect(event:any){ setRefuter(event.target.value); }
  function cardSelect(event:any){ setCard(event.target.value); }
  function cardShownCB(event:any){
    setCard(unknown);
    setRefuted(event.target.checked);
  }
  function addGuessCB(){
    if(refuted()){
      kn.guessRefuted(guesser(), refuter(),
        atomic(person()), atomic(room()), atomic(weapon()),
        card() === unknown ? undefined : atomic(card())
      )
    }
    else{
      kn.guessNotRefuted(guesser(), atomic(person()), atomic(room()), atomic(weapon()));
    }
  }

  return (
    <>
      <span>Add A Guess</span>
      <div id='AddGuess'>
        <div id='AddGuessContainer'>
          <div id='GuesserContainer'>
            <label for='guesser' title='The player making the guess'>Guesser</label>
            <select onChange={guesserSelect} id='guesser'>
              <For each={kn.playerNamesOrdered()}>{ (name:string) =>
                <option value={name}>{name}</option>
              }</For>
            </select>
            <label for='person' title='The person guessed'>Person</label>
            <select onChange={personSelect} id='person'>
              <For each={Array.from(kn.people_names)}>{ (name:string) =>
                <option value={name}>{name}</option>
              }</For>
            </select>
            <label for='room' title='The room guessed'>Room</label>
            <select onChange={roomSelect} id='room'>
              <For each={Array.from(kn.room_names)}>{ (name:string) =>
                <option value={name}>{name}</option>
              }</For>
            </select>
            <label for='weapon' title='The weapon guessed'>Weapon</label>
            <select onChange={weaponSelect} id='weapon'>
              <For each={Array.from(kn.weapon_names)}>{ (name:string) =>
                <option value={name}>{name}</option>
              }</For>
            </select>
          </div>
          <div id='RefuterContainer'>
            <label title='Was the Guess Refuted?' for='cardShownToggle'>Refuted</label>
            <span id='toggleContainer'>
              <input id='cardShownToggle' onChange={cardShownCB} type='checkbox' checked/>
              <label
                id='cblabel'
                for='cardShownToggle'
                title='Was the Guess Refuted by Another Player'
              />
            </span>
            <label for='refuter' title='The player refuting the guess'>Refuter</label>
            <select onChange={refuterSelect} id='refuter' disabled={refuted() ? false : true} value={refuter()}>
              <For each={kn.playerNamesOrdered().filter(p => p !== guesser())}>{ (name:string) =>
                <option value={name}>{name}</option>
              }</For>
            </select>
            <label for='card' title='The card used to refute'>Card</label>
            <select onChange={cardSelect} id='card' disabled={refuted() ? false : true} value={card()}>
              <For each={[unknown, person(), room(), weapon()]}>{ (name:string) =>
                <option value={name}>{name}</option>
              }</For>
            </select>
          </div>
        </div>
        <button
          onClick={addGuessCB}
          title='Add Guess to Knowledgebase'
        >
          Add Guess {'\u2795'}
          </button>
      </div>
    </>
  );
}


export { AddGuess };
