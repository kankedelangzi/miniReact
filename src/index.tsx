/** @jsxRuntime classic */
/** @jsx React.createElement */
import React from './react/index'
import ReactDOM from './reactDom/index';
import { useState } from './react/hooks'

// import React, { useState } from 'react'
// import ReactDOM from 'react-dom'

// import 'index.css'
function Counter() {
  const [count, setCount] = useState(1)
  setTimeout(() => { 
    setCount(count+1)
    console.log('updateCount')
  }, 4000)
  return <div style={{background: 'red'}}>{count}次</div>
}
const node = <div>
    <p>mini react </p>
    <span style={{background: 'red'}}>hello</span>
    <Counter />
  </div>
// 
ReactDOM.render(
node,
  document.getElementById('root')
);


