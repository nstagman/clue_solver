import type { Signal } from 'solid-js';
import { createSignal, createEffect, batch } from 'solid-js';
import type { Atomic } from './logic';
import { atomic, not, disjunction, cnf, resolve, consistent } from './logic';


// Clue Constants
const people_names = ['Mustard', 'Plum', 'Scarlet', 'White', 'Green', 'Peacock'];
const room_names = ['Ballroom', 'Kitchen', 'Library', 'Hall', 'Lounge', 'Conservatory', 'Dining Room', 'Billiard Room', 'Study'];
const weapon_names = ['Knife', 'Revolver', 'Wrench', 'Rope', 'Candlestick', 'Pipe'];
const people = people_names.map(e => atomic(e));
const rooms = room_names.map(e => atomic(e));
const weapons = weapon_names.map(e => atomic(e));
const allCards = people.concat(rooms).concat(weapons);
const game_rules = cnf(disjunction(...people), disjunction(...rooms), disjunction(...weapons));
// add exclusive property for each category
for(const p1 of people){
  for(const p2 of people){
    if(p1 === p2){ continue; }
    game_rules.add(disjunction(not(p1), not(p2)));
  }
}
for(const r1 of rooms){
  for(const r2 of rooms){
    if(r1 === r2){ continue; }
    game_rules.add(disjunction(not(r1), not(r2)));
  }
}
for(const w1 of weapons){
  for(const w2 of weapons){
    if(w1 === w2){ continue; }
    game_rules.add(disjunction(not(w1), not(w2)));
  }
}

// Knowledge State Varaiables
enum CardStatus { NotSolution=-1, Unknown, Solution };
let KBS = [new Set(game_rules), cnf(), cnf(), cnf()];
const [numPlayers, setNumPlayers] = createSignal(3, {equals: false});
// maps player names to player index
const [playerTable, setPlayerTable] = createSignal(new Map([['Player 1', 1], ['Player 2', 2], ['Player 3', 3]]));
// maps player index to number of cards in hand (these may not be equal depending on total players)
const [cardCounts, setCardCount] = createSignal(new Map([[1, 6], [2, 6], [3, 6]]));
const [allConsistent, setAllConsistent] = createSignal(true); //all KBS are consistent
// sets containing cards that each player: has, unknown to have, and known to not have
const [kbsEntails, setKBSEntails]:Signal<Set<Atomic>[]>= createSignal([new Set(), new Set(), new Set(), new Set()]);
const [kbsUnknowns, setKBSUnknowns]:Signal<Set<Atomic>[]> = createSignal([new Set(), new Set(), new Set(), new Set()]);
const [kbsNots, setKBSNots]:Signal<Set<Atomic>[]> = createSignal([new Set(), new Set(), new Set(), new Set()]);

// the following is used for undo, redo, and removing knowledge
type InitialCard = { player: number, card:Atomic }
type GuessRefuted = { guesser:number, refuter:number, person:Atomic, room:Atomic, weapon:Atomic, card:Atomic|undefined };
type GuessNotRefuted = { guesser:number, person:Atomic, room:Atomic, weapon:Atomic }
enum KnowledgeType { IC, GR, GNR };
type KnowledgeSerialize =
  { type: KnowledgeType.IC, args: InitialCard }
  | { type: KnowledgeType.GR, args: GuessRefuted }
  | { type: KnowledgeType.GNR, args: GuessNotRefuted };
const [knowledgeList, setKnowledgeList]:Signal<KnowledgeSerialize[]> = createSignal([]);
const [undoStack, setUndoStack]:Signal<KnowledgeSerialize[][]> = createSignal([]);
const [redoStack, setRedoStack]:Signal<KnowledgeSerialize[][]> = createSignal([]);


createEffect(() => {
  const players = numPlayers();

  setAllConsistent(true);
  setPlayerTable(new Map([...Array(players).keys()].map(i => [`Player ${i+1}`, i+1])));

  KBS = [new Set(game_rules)]
  const cardCounts = new Map();
  for(let i=0; i<players; ++i){
    KBS.push(cnf());
    cardCounts.set(i+1, Math.floor(18/players));
  }
  for(let i=0; i<18%players; ++i){
    cardCounts.set(i+1, cardCounts.get(i+1)+1);
  }
  setCardCount(cardCounts);
  setKnowledgeList([]);
  setUndoStack([]);
  setRedoStack([]);

  resolveAll();
});

// set initial card in a player's hand
function initialCard(player:string, card:Atomic, resolve:boolean=true){
  hasCards(getPlayerIdx(player)!, card);
  
  if(resolve){
    resolveAll();
    setUndoStack((prev) => {
      const nk = [...prev];
      nk.push([...knowledgeList()]);
      return nk
    });
    setRedoStack([]);
  }
  
  const kn:KnowledgeSerialize = {
    type: KnowledgeType.IC,
    args: {player: getPlayerIdx(player)!, card: card}
  };
  setKnowledgeList((prev) => {
    const nk = [...prev];
    nk.push(kn);
    return nk;
  });
}

// update all kbs indicated a guess was refuted
function guessRefuted(guesser:string, refuter:string, person:Atomic, room:Atomic, weapon:Atomic, card:Atomic|undefined=undefined, resolve:boolean=true){
  const gidx = getPlayerIdx(guesser)!;
  const ridx = getPlayerIdx(refuter)!;

  for(const player of playersBetween(gidx, ridx)){
    notHaveCards(player, person);
    notHaveCards(player, room);
    notHaveCards(player, weapon);
  }

  if(card !== undefined){ hasCards(ridx, card); }
  else{ hasCards(ridx, person, room, weapon); }

  if(resolve){
    resolveAll();
    setUndoStack((prev) => {
      const nk = [...prev];
      nk.push([...knowledgeList()]);
      return nk
    });
    setRedoStack([]);
  }

  const kn:KnowledgeSerialize = {
    type: KnowledgeType.GR,
    args: {guesser: getPlayerIdx(guesser)!, refuter: getPlayerIdx(refuter)!, person: person, room: room, weapon: weapon, card: card}
  };
  setKnowledgeList((prev) => {
    const nk = [...prev];
    nk.push(kn);
    return nk;
  });
}

// update all kbs indicating a guess was not refuted
function guessNotRefuted(guesser:string, person:Atomic, room:Atomic, weapon:Atomic, resolve:boolean=true){
  const gidx = getPlayerIdx(guesser)!;

  for(const player of playersBetween(gidx)){
    notHaveCards(player, person);
    notHaveCards(player, room);
    notHaveCards(player, weapon);
  }

  hasCards(gidx, person, room, weapon);
  hasCards(0, person, room, weapon);

  if(resolve){
    resolveAll();
    setUndoStack((prev) => {
      const nk = [...prev];
      nk.push([...knowledgeList()]);
      return nk
    });
    setRedoStack([]);
  }

  const kn:KnowledgeSerialize = {
    type: KnowledgeType.GNR,
    args: {guesser: getPlayerIdx(guesser)!, person: person, room: room, weapon: weapon}
  };
  setKnowledgeList((prev) => {
    const nk = [...prev];
    nk.push(kn);
    return nk;
  });
}

function removeKnowledge(idx:number){
  const kl = knowledgeList();

  setUndoStack((prev) => {
    const nk = [...prev];
    nk.push([...knowledgeList()]);
    return nk
  });
  setRedoStack([]);
  batch(() => {
    // reset all knowledge bases
    KBS = [new Set(game_rules)]
    for(let i=0; i<numPlayers(); ++i){ KBS.push(cnf()); }
    setAllConsistent(true);
    setKnowledgeList([]);

    kl.splice(idx, 1); // remove specified knowledge
    // add each piece of knowledge to kbs
    for(const k of kl){
      switch(k.type){
        case KnowledgeType.IC:
          initialCard(getPlayerName(k.args.player), k.args.card, false)
          break;
        case KnowledgeType.GR:
          guessRefuted(getPlayerName(k.args.guesser), getPlayerName(k.args.refuter), k.args.person, k.args.room, k.args.weapon, k.args.card, false);
          break;
        case KnowledgeType.GNR:
          guessNotRefuted(getPlayerName(k.args.guesser), k.args.person, k.args.room, k.args.weapon, false);
          break;
        default:
      }
    }
    resolveAll();
  });
}

function undoKnowledge(){
  if(undoStack().length === 0){ return; }

  setRedoStack((prev) => {
    const nrs = [...prev];
    nrs.push([...knowledgeList()]);
    return nrs;
  });
  
  const uds = [...undoStack()];
  const kl = uds.pop()!;
  setUndoStack(uds);
  batch(() => {
    // reset all knowledge bases
    KBS = [new Set(game_rules)]
    for(let i=0; i<numPlayers(); ++i){ KBS.push(cnf()); }
    setAllConsistent(true);
    setKnowledgeList([]);

    // add each piece of knowledge to kbs
    for(const k of kl){
      switch(k.type){
        case KnowledgeType.IC:
          initialCard(getPlayerName(k.args.player), k.args.card, false)
          break;
        case KnowledgeType.GR:
          guessRefuted(getPlayerName(k.args.guesser), getPlayerName(k.args.refuter), k.args.person, k.args.room, k.args.weapon, k.args.card, false);
          break;
        case KnowledgeType.GNR:
          guessNotRefuted(getPlayerName(k.args.guesser), k.args.person, k.args.room, k.args.weapon, false);
          break;
        default:
      }
    }
    resolveAll();
  });
}

function redoKnowledge(){
  if(redoStack().length === 0) { return; }
  const rds = [...redoStack()];
  const kl = rds.pop()!;

  setRedoStack((prev) => {
    const nrs = [...prev];
    nrs.pop();
    return nrs;
  });
  setUndoStack((prev) => {
    const nus = [...prev];
    nus.push([...knowledgeList()]);
    return nus;
  });
  batch(() => {
    // reset all knowledge bases
    KBS = [new Set(game_rules)]
    for(let i=0; i<numPlayers(); ++i){ KBS.push(cnf()); }
    setAllConsistent(true);
    setKnowledgeList([]);

    // add each piece of knowledge to kbs
    for(const k of kl){
      switch(k.type){
        case KnowledgeType.IC:
          initialCard(getPlayerName(k.args.player), k.args.card, false)
          break;
        case KnowledgeType.GR:
          guessRefuted(getPlayerName(k.args.guesser), getPlayerName(k.args.refuter), k.args.person, k.args.room, k.args.weapon, k.args.card, false);
          break;
        case KnowledgeType.GNR:
          guessNotRefuted(getPlayerName(k.args.guesser), k.args.person, k.args.room, k.args.weapon, false);
          break;
        default:
      }
    }
    resolveAll();
  });
}

//
// get kb index for player from name
function getPlayerIdx(player:string){
  return playerTable().get(player);
}

// reverse lookup player name - needed this to let user change player names after knowledge has been added
function getPlayerName(idx:number){
  for(const [name, i] of playerTable().entries()){
    if(idx === i){ return name; }
  }
  return '';
}

// generator to return all players 'between' 2 players
function* playersBetween(start:number, end:number|undefined=undefined){
  end = end!==undefined ? end : start;
  let next = (start % numPlayers()) + 1;
  while(next != end){
    yield next;
    next = (next % numPlayers()) + 1;
  }
}

// update all kbs indicating that kb has a disjunction of cards
function hasCards(kb:number, ...cards:Atomic[]){
  KBS[kb].add(disjunction(...cards));

  for(let i=0; i<numPlayers()+1; ++i){
    if(i !== kb){ notHaveCards(i, ...cards); }
  }
}

// update kb indicating it does not have a disjunction of cards
function notHaveCards(kb:number, ...cards:Atomic[]){
  const notCards = cards.map(card => not(card));
  KBS[kb].add(disjunction(...notCards));
}

// repeatedly resolve and update all kbs until no more knowledge can be inferred
// 1 - perform resolution for all cards on each kb
// 2 - check if the contents of an entire player hand is known
// 3 - check if there remains only one kb that can possess any one card
function resolveAll(){
  // updating resolution strategy
  let runResolve;
  do{
    runResolve = false;
    resolveEach();
    runResolve ||= checkHandFull();
    runResolve ||= checkOneRemaining();
  }while(runResolve)

  // check consistency of all kbs
  let kbsConsistent = true;
  for(let i=0; i<numPlayers(); ++i){
    kbsConsistent &&= consistent(KBS[i]);
  }
  setAllConsistent(kbsConsistent);
  if(!kbsConsistent){ return; }

  // set signals for all cards in each kb
  const entails:Set<Atomic>[] = [];
  const unknowns:Set<Atomic>[] = [];
  const nots:Set<Atomic>[] = [];
  for(let i=0; i<numPlayers()+1; ++i){
    entails.push(new Set());
    unknowns.push(new Set());
    nots.push(new Set());
  }
  for(const [i, kb] of KBS.entries()){
    for(const card of allCards){
      if(resolve(kb, card)){ entails[i].add(card); }
      else if(!resolve(kb, not(card))){ unknowns[i].add(card); }
      else{ nots[i].add(card); }
    }
  }
  batch(() => {
    setKBSEntails(entails);
    setKBSUnknowns(unknowns);
    setKBSNots(nots);
  });
}

// continually infer knowledge through resolution until no more knowledge can be inferred
// if any kb is found to entail a card - update all kbs and run again
function resolveEach(){
  const resolvents:Set<Atomic>[] = []
  for(let i=0; i<numPlayers()+1; ++i){ resolvents.push(new Set()); }
  let kbUpdated = true;
  while(kbUpdated){
    kbUpdated = false;

    for(const [i, kb] of KBS.entries()){
      for(const card of allCards){
        if(!resolvents[i].has(card) && resolve(kb, card)){
          kbUpdated = true;
          resolvents[i].add(card);
        }
      }
    }

    for(const [kb, resolution] of resolvents.entries()){
      for(const card of resolution){
        hasCards(kb, card);
      }
    }
  }
}

// Check if the entire hand of a player is known
// if all cards are known for a player, flag remaining cards as not belonging to that player
function checkHandFull(){
  let updated = false;
  for(const [i, kb] of KBS.entries()){
    if(i === 0){ continue; } // skip solution kb
    const cards = new Set();
    for(const e of kb){
      // add disjunctions of one atomic and the atomic is not inverted
      if(e.size === 1 && !e.values().next().value!.get('inverted')){
        cards.add(e);
      }
    }
    //if player i hand is full
    if(cards.size === cardCounts().get(i)){
      for(const card of allCards){
        if(cards.has(disjunction(card))){ continue; }
        if(!kb.has(disjunction(not(card)))){
          updated = true;
          notHaveCards(i, card);
        }
      }
    }
  }
  return updated;
}

// find all instances where there is one remaining kb that can possess a card
// update all kbs to reflect this
function checkOneRemaining(){
  let updated = false;
  //populate a map of {card: set()} where the set contains each kb that does not possess the card
  const notPossess:Map<Atomic, Set<number>> = new Map()
  for(const card of allCards){ notPossess.set(card, new Set()); }
  for(const [i, kb] of KBS.entries()){
    for(const card of allCards){
      if(kb.has(disjunction(not(card))) || resolve(kb, not(card))){
        notPossess.get(card)!.add(i);
      }
    }
  }

  const kbsIDX = new Set([...Array(numPlayers()+1).keys()]);
  for(const [card, notPossessors] of notPossess){
    const possible = new Set([...kbsIDX].filter(e => !notPossessors.has(e)));
    if(possible.size === 1){
      const idx = possible.values().next().value;
      if(!KBS[idx].has(disjunction(card))){
        updated = true;
        hasCards(idx, card);
      }
    }
  }
  return updated;
}

// return array of players names sorted by the order in which they play
function playerNamesOrdered(){
  const names = Array.from(playerTable().keys()).sort((a, b) => {
    return playerTable().get(a)! < playerTable().get(b)! ? -1 : 1
  });
  return names;
}

export{
  numPlayers, setNumPlayers, playerTable, setPlayerTable, allConsistent, cardCounts,
  initialCard, guessRefuted, guessNotRefuted,
  kbsEntails, kbsUnknowns, kbsNots, playerNamesOrdered,
  KnowledgeType, knowledgeList, removeKnowledge, getPlayerName,
  people, rooms, weapons, allCards,
  people_names, room_names, weapon_names, CardStatus,
  undoKnowledge, redoKnowledge, undoStack, redoStack
};

export type { KnowledgeSerialize };
