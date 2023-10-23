import type { JSXElement } from 'solid-js';
import { For } from 'solid-js';
import * as kn from '../knowledgeBase';
import '../styles/knowledgeViewer.css';


function knowledgeAsEle(){
  const kAsStr:JSXElement[] = [];
  for(const k of kn.knowledgeList()){
    switch(k.type){
      case kn.KnowledgeType.IC:
        kAsStr.push(<>{kn.getPlayerName(k.args.player)} has {k.args.card.get('name')}</>)
        break;
      case kn.KnowledgeType.GR:
        kAsStr.push(<>{kn.getPlayerName(k.args.guesser)} Guessed {k.args.person.get('name')}-{k.args.room.get('name')}-{k.args.weapon.get('name')}<br/>
          {kn.getPlayerName(k.args.refuter)} Refuted {k.args.card !== undefined ? ' with ' + k.args.card.get('name') : ''}</>);
        break;
      case kn.KnowledgeType.GNR:
        kAsStr.push(<>{kn.getPlayerName(k.args.guesser)} Guessed {k.args.person.get('name')}-{k.args.room.get('name')}-{k.args.weapon.get('name')}<br/>No Refutation</>);
        break;
      default:
    }
  }
  return kAsStr;
}


function KnowledgeView(props:any): JSXElement{
  function clickCB(){ kn.removeKnowledge(props.idx); }

  return(
    <div class='KnowledgeView'>
      {props.knowledge}
      <button
        onClick={clickCB}
        class={'RemoveKnowledge'}
        title='Remove From Knowledgebase'
      >
        X
      </button>
    </div>
  )
}

function KnowledgeViewer(_:any): JSXElement{
  return(
    <div id='KnowledgeViewer'>
      <div id='KnowledgeViewHeader'>
        <button
          class={kn.undoStack().length > 0 ? 'enabled' : 'disabled'}
          title='Undo'
          onclick={kn.undoKnowledge}
          disabled={kn.undoStack().length > 0 ? false : true}
        >
          {'\u2190'}
        </button>
        <button
          class={kn.redoStack().length > 0 ? 'enabled' : 'disabled'}
          title='Redo'
          onclick={kn.redoKnowledge}
          disabled={kn.redoStack().length > 0 ? false : true}
        >
          {'\u2192'}
        </button>
        <span>Game Knowledge</span>
      </div>
      <div id='KnowledgeContainer'>
        <For each={Array.from(knowledgeAsEle().entries())}>{ ([i, knowledge]) =>
          <KnowledgeView idx={i} knowledge={knowledge}/>
        }</For>
    </div>
    </div>
  )
}

export { KnowledgeViewer };
