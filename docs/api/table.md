---
title: Table | API
---

# Table

## Instance Methods

### `new Table( parameters )`
```Type``` is not used anywhere yet
- **Arguments:**
  - ```{object} parameters```
    - ```{string} name```
    - ```{string} [type]```
- **Example:**
```javascript
const {Table} = require('hasura-om')
const userTable = new Table({
    name: 'user'
})
```

### `this.generateBaseFragments()`
- **Usage**
    This method creates 2 fragments from fields. Fragments are: 'base' (all table fields) and 'pk' (only primary keys)
- **Example:**
```javascript
userTable.generateBaseFragments()
```

### `this.createField( parameters )`
This a [```Field```](/api/field) constructor
- **Arguments:**
  - ```{object} parameters```
    - ```{string} name```
    - ```{string} [type]```
    - ```{boolean} [isPrimary]```
- **Returns:** current [```{Table}```](/api/table) instance
- **Example:**
```javascript
userTable.createField({
    name: 'id'
})
```

### `this.field( name )`
- **Arguments:**
  - ```{string} name``` of the field
- **Returns:** [```{Field}```](/api/field) Instance
- **Example:**
```javascript
console.log(userTable.field('id').isPrimary)
```

### `this.setPrimarykey( parameters )`
- **Arguments:**
  - ```{object | string} parameters``` if it is a ```{string}``` it is a name
    - ```{string} name``` - a name of key is PK
- **Example:**
```javascript
userTable.setPrimarykey('id')
```

### `this.createFragment( name = 'base', fields = false )`
- **Arguments:**
  - ```{string} name```
  - ```{string | array | object} fields```
- **Example:**
```javascript
userTable.createFragment('avatar', ['id', 'userpic_url'])
```


::: warning
Methods below are used from Hasura class to generate table specific query/mutation from parameters
This section could be useful if you want to generate queries by yourself, but I think they need to be refactored, so I'll skip documentation for now
:::

### this.buildQuery(parameters)
### this.build_select(parameters)
### this.build_aggregate(parameters)

### this.buildMutation(parameters)
### this.build_insert(parameters)
### this.build_update(parameters)
### this.build_delete(parameters)

### this.getFieldsFromParams(parameters)
### this.getFieldsFromAggregate(parameters)
### this.buildArguments(parameters)