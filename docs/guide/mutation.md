---
title: Making mutations | Guide
---

# Making mutations

## Mutate
There are 3 types of mutation you can call: insert, update, delete. And of course you can call them all together to any tables and also with nesting


## Insert
Scheme to call is `table_name`.`insert`.`objects` it can be an object or an array of objects. You can also insert related objects (take a look at animals table).
Also you have an ability to choose what fragment or fields will return to you. By default it is `base` fragments with all fields (this will not work with nested insert!)

::: warning
For nested inserts you should make special fragment with nested fields, if you need them
:::

```javascript
let [err, response] = await orm.mutate({
    user: {
        insert: {
            objects: [{
                name: 'Peter',
                age: 17
            }],
            fragment: 'pk'
        }
    },
    animals: {
        insert: {
            objects: [{
                type: 'dog',
                can: ['bork', 'sit'],
                species: {
                    data: [{
                        name: 'Bobby',
                        age: 1
                    }, {
                        name: 'Betty',
                        age: 3
                    }]
                }
            }]
        },
    }
})
/* 
    reponse - {
        user: [{
            id: 10
        }],
        animals: [{
            type: 'dog',
            can: bork,sit,
            ...allBaseAnimalFields
        }]
    }
*/
```

::: tip
Response in mutations also modified to return a most simple structure.
Use a setting `flatOne = false` at Hasura or query level if you want more predictable structure. 
:::

## Update
Scheme to call is `table_name`.`update`

```javascript
let [err, response] = await orm.mutate({
    user: {
        update: {
            where: { age: { _gt: 21 } },
            _set: { isAdult: true }
        }
    }
})
/* 
    response - [{
        ..allBaseUserFields
    }]
*/


let [err, response] = await orm.mutate({
    user: {
        update: {
            where: { id: { _eq: 5 } },
            _inc: { money: 100 }
        }
    },
    wallet: {
        insert: {
            objects: {
                user_id: 5,
                deposit: 100
            }
        }
    }
})
/* 
    response - {
        user: [{
            id: 5,
            money: 1100,
            ...
        }],
        wallet: [{
            id: 1003,
            user_id: 5,
            deposit: 100,
            ...
        }]
    }
*/
```
Note that last request will be made in transaction, so if one request fails - both will fail. 

## Delete
Scheme to call is `table_name`.`delete`

```javascript
const [err, response] = await orm.mutate({
    _om_test: {
        user: {
            where: { id: { _eq: 2088 } }
        },
    }
});
/* 
    response - [{
        id: 2088,
        ...userFields
    }]
*/
```

::: tip
There is no way to return affected_rows currently. If you need them, please open an issue
:::