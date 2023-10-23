import type { JSXElement, JSX } from 'solid-js';
import { For, Show, createSignal } from 'solid-js';
import { Atomic } from '../logic';
import * as kn from '../knowledgeBase';
import '../styles/cards.css';


interface CProps extends JSX.HTMLAttributes<any> { card: Atomic };
function Card(props:CProps): JSXElement{
  return(
    <div class='Card'>
      {props.card.get('name')}
    </div>
  );
}

interface CGProps extends JSX.HTMLAttributes<any> {
  status: Set<Atomic>, population: Atomic[]
};
function CardGroups(props:CGProps): JSXElement{
  return(
    <div class='CardGroup'>
      <For each={Array.from(props.status)}>{ (card) =>
        <Show
          when={props.population.includes(card)}
        >
          <Card
            card={card}
          />
        </Show>
      }</For>
    </div>
  );
}

interface CRProps extends JSX.HTMLAttributes<any> { rank: kn.CardStatus };
function CardRank(props:CRProps): JSXElement{
  const header = props.rank===1 ? 'Solution' : props.rank===0 ? 'Possible Solution' : 'Not Solution';
  const status = props.rank===1 ? kn.kbsEntails : props.rank===0 ? kn.kbsUnknowns : kn.kbsNots;
  
  return(
    <div class='CardRank' id={'i'+props.rank}>
      <span>{header}</span>
      <div class='RankContainer'>
        <CardGroups
          status={status()[0]}
          population={kn.people}
        />
        <CardGroups
          status={status()[0]}
          population={kn.rooms}
        />
        <CardGroups
          status={status()[0]}
          population={kn.weapons}
        />
      </div>
    </div>
  );
}

function HandView(_:any){
  const header = 'Not Solution';
  return (
    <div id='HandViewContainer'>
      <span>{header}</span>
      <div id='HandView'>
        <For each={Array.from(kn.playerNamesOrdered())}>{ (player) =>
          <div class='HandContainer'>
            <span>{`${player}'s Hand`}</span>
            <CardGroups
              status={kn.kbsEntails()[kn.playerTable().get(player)!]}
              population={kn.allCards}
            />
          </div>
        }</For>
      </div>
    </div>
  );
}

function Cards(_:any): JSXElement{
  const [handView, setHandView] = createSignal(true);

  function hvtCB(event:any){ setHandView(event.target.checked); }

  return(
    <div id='Cards'>
      {!kn.allConsistent() ? <div id='Inconsistent'>The Knowledge Base is Inconsistent</div> : ''}
      <CardRank
        rank={kn.CardStatus.Solution}
      />
      <CardRank
        rank={kn.CardStatus.Unknown}
      />
      <div id='NotSolAnchor'>
        <Show
          when={handView()}
          fallback={<CardRank rank={kn.CardStatus.NotSolution}/>}
        >
          <HandView/>
        </Show>
        <div id='HVTContainer'>
          <label title='Hand View' for='hvToggle'>Hand View</label>
          <span id='hvtoggleContainer'>
            <input id='hvToggle' onChange={hvtCB} type='checkbox' checked/>
            <label
              id='hvlabel'
              for='hvToggle'
              title='Hand View'
            />
          </span>
        </div>
      </div>
    </div>
  );
}


export { Cards };