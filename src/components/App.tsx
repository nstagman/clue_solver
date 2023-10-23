import type { Component } from 'solid-js';
import { KnowledgeAdder } from './knowledgeAdder';
import { Cards } from './cards';
import { KnowledgeViewer } from './knowledgeViewer';
import '../styles/App.css';


const App: Component = () => {
  return (
    <>
      <div id='banner'>
        <div>Clue Solver</div>
      </div>
      <div id='main'>
        <KnowledgeAdder/>
        <Cards/>
        <KnowledgeViewer/>
      </div>
    </>
  );
};

export default App;
