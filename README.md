<h1 align="center">Welcome to babel-plugin-use-or-operator-for-destructuring-default-value 👋</h1>
<p>
  <a href="https://www.npmjs.com/package/babel-plugin-use-or-operator-for-destructuring-default-value" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/babel-plugin-use-or-operator-for-destructuring-default-value.svg">
  </a>
  <a href="#" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
  </a>
</p>

> destructuring default value use `||`, without undefined only 

## Install

```sh
yarn add babel-plugin-use-or-operator-for-destructuring-default-value
```

## why write it

### before used this babel

```js
const user = {name: 'xiaohesong', age: null, sex: ''}
const {name, age = 18, sex = 'man'} = user
console.log(name, age, sex) // xiaohesong null
```

### used

```js
const user = {name: 'xiaohesong', age: null, sex: ''}
const {name, age = 18, sex = 'man'} = user
console.log(name, age, sex) // xiaohesong 18 man
```

## Show your support

Give a ⭐️ if this project helped you!