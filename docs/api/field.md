---
title: Field | API
---

# Field
This is a basic class that currenlty is used for nothing, but created just to be extendable if needed

## Instance Methods

### `new Field(params)`
- **Arguments:**
  - `{object} params`
    - `{string} name`
    - `{string} [type]`
    - `{boolean} [isPrimary = false]`
- **Example:**
```javascript
const {Field} = require('hasura-om')
const idField = new Field({
    name: 'id'
})
```

## Instance Properties

### Get `this.name`
- **Type:** `string`
- **Usage:**
  This a name of table field
- **Example:**
```javascript
console.log(idField.name)
```

### Get/Set `this.type`
- **Type:** `string`
- **Usage:**
  This a type of table field
- **Example:**
```javascript
idField.type = 'integer'
console.log(idField.type)
```

### Get/Set `this.isPrimary`
- **Type:** `boolean`
- **Usage:**
  This is a toggle if the field is part of primary key or a key itself
- **Example:**
```javascript
idField.isPrimary = true
console.log(idField.isPrimary)
```

## Usage
```javascript
const {Field} = require('hasura-om')

let nameField = new Field({
    name: 'name',
    type: 'string'
})
nameField.isPrimary = false
```