---
title: Creating fragments | Guide
---

# Creating fragments

## An idea
Hasura offers an easy API to get/manipulate data by table name. It is used in every type, so there is only one variable that is unknown: fields and relations and most of the time I spent my time writing fragments with all needed relations. Most of them were basic, for example get new generated ID on insert or select all data from table. 
So the idea was to scaffold all queries, automaticaly generate basic fragments and leave an ability to create any fragment and reuse it.

## What are fragments?
If you are not familiar with graphql - fragments are just an interface to describe fields and reuse them in request. So the goal was to make requests more readable and reuse some parts, but I think this is a good chance to write all the code just in fragments and do not write anything else.

So here is how fragments work. For example we have basic table `user` (id, name, user_pic_id) and table `images` (id, url). Relation is `user`.`user_pic_id` -> `images`.`id` (user_pic)
```
query user {
    id
    name
    user_pic {
        url
    }
}
```

Of course I could track all first/second level relations and make this fragments too, but I think this is really bad in terms memory consumptions etc. So for now hasura-om creates 2 basic fragments 'base' and 'pk'
```
Fragment base_fragment_user on user {
    id
    name
    user_pic_id
}
Fragment pk_fragment_user on user {
    id
}

Fragment base_fragment_images on images {
    id
    url
}
Fragment pk_fragment_images on images {
    id
}
```

## How fragments are created
I have class Fragment that takes name, table and fields and generate a fragment that can be used anywhere even without link to a table
```javascript
const { Fragment } = require('hasura-om')

let baseFragment = new Fragment({
    table: 'user',
    name: 'base',
    fields: `
        id
        name
        user_pic_id
    `
})

let {
    name,
    raw,
    arguments
} = baseFragment.build()
/* 
    name - base_fragment_user
    raw - Fragment base_fragment_user on user {
        id
        name
        user_pic_id
    }
    argumets - []
*/
```

## Ways to define fields
So the main trick here is how you can define fields. So there is (function)[https://github.com/mrspartak/hasura-om/blob/master/src/utils/builders.js] that transofrm whatever you pass to string format of fields.
```javascript
//string
let fields = `
    id
    name
    user_pic {
        url
    }
`

//array
let fields = [
    'id',
    'name',
    [
        'user_pic',
        [
            'url'
        ]
    ]
]

//object
let fields = {
    'id': {},
    'name: {},
    'user_pic': {
        children: {
            'url': {}
        }
    }
}
//and children can be any format from above
```

## Extending fragment from already defined
Of course you can reuse already defined fragments
```javascript
let baseUserFragment = orm.table('user').fragment('base')
let baseImageFragment = orm.table('image').fragment('base')

orm.table('user').createFragment({
    name: 'with_profile_pic',
    fields: [
        baseUserFragment,
        [
            'user_pic',
            [
                baseImageFragment
            ]
        ]
    ]
})
```

## Fragments with nested fields with arguments
There is a way to filter nested fields
```javascript
//array
let fields = [
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

//or object
let fields = {
    'id': {},
    'name: {},
    'user_pic': {
        children: {
            'url': {}
        },
        filter: {
            limit: 'user_pic_limit'
        }
    }
}
```

This will crete fragment with arguments by nested field and also will pass arguments to operation. Here you need to provide an unique variable name for your filter and then pass this variable to a request
```
Fragment base_fragment_user on user {
    id
    name
    user_pic (limit: $user_pic_limit) {
        url
    }
}
```