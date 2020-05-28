---
title: Fragment | API
---

# Fragment
This is a class that build Fragments from fields for tables. The fields parameter is tricky and will be described on another page later.

## Instance Methods

### `new Fragment(params)`
- **Arguments:**
  - `{object} params`
    - `{string} name`
    - `{string} table`
    - `{string | array | object} fields`
- **Example:**
```javascript
const {Fragment} = require('hasura-om')
const withAvatarFragment = new Fragment({
    name: 'withAvatar',
    table: 'user',
    fields: [
        'id',
        'name',
        [
            'avatar',
            [
                'url'
            ]
        ]
    ]
})
```

### `this.rawFields()`
- **Returns:** 
  - `{string | array | object}` returns fields that passed to constructor
- **Example:**
```javascript
console.log(withAvatarFragment.rawFields())
/* 
    [
        'id',
        'name',
        [
            'avatar',
            [
                'url'
            ]
        ]
    ]
*/
```

### `this.fields()`
- **Returns:** 
  - `{string}` generated text of fields without Fragment declaration
- **Example:**
```javascript
console.log(withAvatarFragment.fields())
/* 
    `id
    name
    avatar {
        url
    }`
*/
```

### `this.arguments()`
- **Returns:** 
  - `{array}` this an array for Operation declaration if you pass argument to filter nested data
- **Example:**
```javascript
console.log(withAvatarFragment.arguments())
/* 
   []
*/
```

### `this.name()`
- **Returns:** 
  - `{string}` generated name of the fragment
- **Example:**
```javascript
console.log(withAvatarFragment.name())
/* 
   `withAvatar_fragment_user`
*/
```

### `this.fragment()`
- **Returns:** 
  - `{string}` generated Fragment
- **Example:**
```javascript
console.log(withAvatarFragment.name())
/* 
   `Fragment withAvatar_fragment_user on user {
       id
        name
        avatar {
            url
        }
   }`
*/
```

### `this.build()`
This can change if we will need to change arguments behavior
- **Returns:** 
  - `{object}`
    - `{string} name` - generated name of the fragment
    - `{string} raw` - a generated fragment
    - `{string} arguments` - an array of variable declaration
- **Example:**
```javascript
console.log(withAvatarFragment.build())
/* 
   {
        name: `withAvatar_fragment_user`,
        raw: `Fragment withAvatar_fragment_user on user {
            id
            name
            avatar {
                url
            }
        }`,
        arguments: []
   }
*/
```

## Usage
```javascript
const {Fragment} = require('hasura-om')

let baseFragment = new Fragment({
    name: 'base',
    table: 'user',
    fields: [
        'id',
        'name'
    ]
})

console.log(baseFragment.fields())
/* 
    id
    name
*/

console.log(baseFragment.fragment())
/* 
Fragment base_fragment_user on user {
    id
    name
}
*/
```