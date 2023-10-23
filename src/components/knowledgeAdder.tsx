import type { JSXElement } from 'solid-js';
import { Switch, Match, createSignal } from 'solid-js';
import { GameSetup } from './gameSetup';
import { AddCard } from './addCard';
import { AddGuess } from './addGuess';
import '../styles/knowledgeAdder.css'


function KnowledgeAdder(_:any): JSXElement{
  enum SelOpts { setup, card, guess };
  const [selected, setSelected] = createSignal(SelOpts.setup);
  
  function gameSetupCB(){ setSelected(SelOpts.setup); }
  function addCardCB(){ setSelected(SelOpts.card); }
  function addGuessCB(){ setSelected(SelOpts.guess); }

  return (
    <div id='KnowledgeAdder'>
      <div id='KnowledgeSelection'>
        <button
          id='setupBtn'
          class={selected() === SelOpts.setup ? 'selected': ''}
          onClick={gameSetupCB}
          title='Open Game Setup Interface'
        >
          Game Setup
        </button>
        <button
          id='CardBtn'
          class={selected() === SelOpts.card ? 'selected': ''}
          onClick={addCardCB}
          title='Open Add Card Interface'
        >
          Add Cards
        </button>
        <button
          id='GuessBtn'
          class={selected() === SelOpts.guess ? 'selected': ''}
          onClick={addGuessCB}
          title='Open Add Guess Interface'
        >
          Add Guess
        </button>
      </div>
      <Switch>
        <Match when={selected() === SelOpts.setup}>
          <GameSetup/>
        </Match>
        <Match when={selected() === SelOpts.card}>
          <AddCard/>
        </Match>
        <Match when={selected() === SelOpts.guess}>
          <AddGuess/>
        </Match>
      </Switch>
    </div>
  );
}


export { KnowledgeAdder };
