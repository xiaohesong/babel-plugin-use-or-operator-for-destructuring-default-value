import React from 'react';
import logo from './logo.svg';
import './App.css';

const user = { name: 'xiaohesong', year: '' }
const [ss, second = 'defaultForNull', ...sss] = ['first', null, 'xs', 'xls']
const { ...u } = user
function App() {
  const { name, year = 4, sex = 'man' } = user
  console.log('year is', year, sss, u)
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          The personal {sex}, {name}, Learn React {year} years
        </a>
        <p>{ss}{second}</p>
      </header>
    </div>
  );
}

export default App;
