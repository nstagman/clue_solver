type Atomic = Map<string, string|boolean>;
type Disjunction = Set<Atomic>;
type CNF = Set<Disjunction>;

const _Atomics_:Map<string, Atomic> = new Map();
const _Disjunctions_:Map<string, Disjunction> = new Map();

// memoize and return an atomic
function atomic(name:string, inverted=false): Atomic{
  if(_Atomics_.get(name+inverted) === undefined){
    _Atomics_.set(name+inverted, new Map<string, string|boolean>([['name', name], ['inverted', inverted]]));
  }
  return _Atomics_.get(name+inverted)!;
}

// return compliment of atomic a
function not(a:Atomic): Atomic{
  return atomic(a.get('name') as string, !a.get('inverted'));
}

function atomicAsString(a:Atomic){
  return a.get('name') + (a.get('inverted') ? '!': '');
}

function disjunction(...atomics:Atomic[]): Set<Atomic> {
  let key = '';
  const arr = [...atomics].sort((a, b) => {
    const astr = atomicAsString(a);
    const bstr = atomicAsString(b);
    return astr < bstr ? -1 : astr > bstr ? 1 : 0;
  })
  arr.forEach(a => key += atomicAsString(a) + ' ');
  if(_Disjunctions_.get(key) === undefined){
    _Disjunctions_.set(key, new Set(atomics));
  }
  return _Disjunctions_.get(key)!;
}

function cnf(...disjunctions:Disjunction[]): Set<Disjunction> {
  return new Set(disjunctions);
}

function compliments(a:Atomic, b:Atomic): boolean{
  return a.get('name') === b.get('name') && a.get('inverted') !== b.get('inverted');
}

function setUnion<T>(s1:Set<T>, s2:Set<T>){
  return new Set([...s1, ...s2]);
}

function setSubtract<T>(s1:Set<T>, s2:Set<T>){
  const s = [];
  for(const e of s1){
    if(!s2.has(e)){ s.push(e); }
  }
  return new Set(s);
}

function setIsSubset(s1:Set<any>, s2:Set<any>){
  for(const e of s1){
    if(!s2.has(e)){ return false; }
  }
  return true;
}

function setFilter<T>(s:Set<T>, predicate:(element:T) => boolean){
  const sarr = [];
  for(const e of s){
    if(predicate(e)){ sarr.push(e); }
  }
  return new Set(sarr);
}

function reduce_disjunction(d1:Disjunction, d2:Disjunction): Atomic | null{
  if(d1.size !== 1){ return null; }

  const a1:Atomic = d1.values().next().value;
  for(let a2 of d2.values()){
    if(compliments(a1, a2)){ return a2; }
  }
  return null;
}

// returns whether kb entails query using unit resolution
function resolve_unit(kb:CNF, query:Atomic): boolean{
  function infer(conjunction:CNF): boolean{
    const new_cnf = cnf();
    const prune = cnf();
    let inferred = false;
    let remove;
    const reduced = pureElim(subsumptionElim(conjunction));

    for(const clause of reduced){
      if(clause.size !== 1) { continue; }
      for(const dis of reduced){
        if(clause === dis){ continue; }
        if(setIsSubset(clause, dis)){ prune.add(dis); }
        else if(remove = reduce_disjunction(clause, dis)){
          const nd = [];
          for(const e of setSubtract(dis, (disjunction(remove)))){
            nd.push(e);
          }
          const new_knowledge = disjunction(...nd);
          if(new_knowledge.size === 0 ){ return true; }
          new_cnf.add(new_knowledge);
          prune.add(dis);
          inferred = true;
        }
      }
    }

    if(inferred === true){
      return infer(setSubtract(setUnion(reduced, new_cnf), prune));
    }
    return false;
  }

  return infer(setUnion(kb, cnf(disjunction(not(query)))));
}

// performs pure elimination on kb and returns new reduced kb
function pureElim(kb:CNF){
  const atoms:Map<Atomic, Array<Disjunction>> = new Map();

  for(const d of kb){
    for(const a of d){
      if(atoms.get(a) === undefined){ atoms.set(a, []); }
      atoms.get(a)!.push(d)
    }
  }

  const pureList:Array<Disjunction> = []
  for(const d of atoms.values()){
    if(d.length !== 1) { continue; }
    const a = d[0].values().next().value!;
    if(!atoms.get(not(a))){ pureList.push(d[0]); }
  }

  return setSubtract(kb, cnf(...pureList));
}

// performs subsumption elimination on kb and returns new reduced kb
function subsumptionElim(kb:CNF){
  const prune = cnf();

  for(const d1 of kb){
    for(const d2 of kb){
      if(d1 === d2){ continue; }
      if(setIsSubset(d1, d2)){
        prune.add(d2);
      }
    }
  }

  return setSubtract(kb, prune);
}

// returns whether kb is consistent or not
function consistent(kb:CNF): boolean{
  function infer(conjunction:CNF): boolean{
    const new_cnf = cnf();
    const prune = cnf();
    let inferred = false;
    let remove;
    const reduced = pureElim(subsumptionElim(conjunction));

    for(const clause of reduced){
      if(clause.size !== 1) { continue; }
      for(const dis of reduced){
        if(clause === dis){ continue; }
        if(setIsSubset(clause, dis)){ prune.add(dis); }
        else if(remove = reduce_disjunction(clause, dis)){
          const nd = [];
          for(const e of setSubtract(dis, (disjunction(remove)))){
            nd.push(e);
          }
          const new_knowledge = disjunction(...nd);
          if(new_knowledge.size === 0 ){ return false; }
          new_cnf.add(new_knowledge);
          prune.add(dis);
          inferred = true;
        }
      }
    }

    if(inferred === true){
      return infer(setSubtract(setUnion(reduced, new_cnf), prune))
    }
    return true;
  }

  return infer(kb);
}


export type { Atomic, Disjunction, CNF };
export { atomic, not, disjunction, cnf, resolve_unit as resolve, consistent, setUnion, setSubtract, setFilter };
