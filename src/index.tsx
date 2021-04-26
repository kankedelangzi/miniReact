/** @jsxRuntime classic */
/** @jsx React.createElement */
import React from './react/index'
import ReactDOM from './reactDom/index';
// import 'index.css'
function Counter() {
  const count = 1
  return <div>{count}次</div>
}
const node = <div>
    <p>mini react </p>
    <span>hello</span>
    <Counter />
  </div>
// 
ReactDOM.render(
node,
  document.getElementById('root')
);


