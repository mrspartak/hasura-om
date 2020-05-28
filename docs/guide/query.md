---
title: Making request | Guide
---

# Making request

## Approach
I really love chaining, but the main idea was to send request declaration between srvices, so one of them could make a transaction. That's why we have ugly? way to write what we want.

## Query
So there is 2 types of queries you can send: select and aggregate. Select is default, so if you are only selecting, you can skip its declaration.
```javascript
let [error, adults] = await orm.query({
    user: {
        where: { age: { _gt: 21 } }
    }
})
/* 
adults = [{
    ...userFields
},...]
*/
```

Of course you can group queries and make aggregations at the same time
```javascript
let [error, response] = await orm.query({
    user: {
        select: {
            where: { age: { _gt: 21 } }
        },
        aggregate: {
            where: { age: { _gt: 21 } },
            count: {},
            avg: ['age']
        }
    },
    pets: {
        limit: 5,
        order_by: {age: 'desc'}
    }
})
/* 
response = {
    user: {
        select: [{
            ...userFields
        },...],
        aggregate: {
            count: 30,
            avg: {age: 34.3333333}
        }
    },
    pets: [{
        ...petsFields
    },...]
}
*/
```

::: tip
Notice how in the first example result was avialable at `response` level and in the bottom example `response.user.select`
So if this is not convinient behavior for you, please set a setting `flatOne = false` at Hasura or query level
[Read more in API](../api/hasura#this-flatgqlresponse-flatsettings-settings-parameters)
:::

## Query with nested field argumets
This is stupid example, but I hope you'll get how it works
```javascript
orm.table('user').createFragment({
    name: 'with_profile_pic',
    fields: [
        'id',
        'name',
        [
            'user_pic',
            [
                'url'
            ],
            {
                limit: 'user_pic_limit'
            }
        ]
    ]
})

let [error, response] = await orm.query({
    user: {
        where: { age: { _gt: 21 } },
        fragment: 'with_profile_pic',
        variables: {
            'user_pic_limit': 1
        }
    },
})
```