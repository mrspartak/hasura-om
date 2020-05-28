---
title: Introduction | API
---

# Introduction

## What is return by hasura-om
This can change in the futere, but all basic blocks are returned for any needs
```javascript
const { Hasura, Table, Fragment, Field } = require('hasura-om')
```

## Basic initialization
You can initialize automatically - orm will get data from Hasura to crate all tables/views and create base Fragments
```javascript
const { Hasura } = require('hasura-om')
const orm = new Hasura({
    graphqlUrl: '',
    adminSecret: ''
})
await orm.generateTablesFromAPI()
```

Or you can do everything manually
```javascript
const { Hasura, Table, Fragment, Field } = require('hasura-om')
const orm = new Hasura({
    graphqlUrl: '',
    adminSecret: ''
})

/*
    Here we are creating table user with fields id and name and id field is primary key
*/
orm.createTable({  name: 'user' })
    .createField({name: 'id', 'isPrimary': true})
    .createField({name: 'name'})
    .generateBaseFragments()
```