module.exports = {
    port: 4000,
    base: '/hasura-om/',
    title: 'Hasura ORM',
    description: 'Fragment oriented hasura ORM for backends with many stuff "from the box"',
    themeConfig: {
        repo: 'mrspartak/hasura-om',
        docsRepo: 'mrspartak/hasura-om',
        docsDir: 'docs',
        docsBranch: 'master',

        logo: '/hasura_icon_blue.svg',
        nav: [
            { text: 'Guide', link: '/guide/' },
            { text: 'API', link: '/api/' },
        ],
        sidebar: [
            {
                title: 'Guide',
                collapsable: false,
                children: [
                    ['/guide/', 'Introduction'],
                    ['/guide/getting-started', 'Getting started'],
                    ['/guide/create-fragment', 'Creating fragment']
                ]
            },
            {
                title: 'Api',
                collapsable: false,
                children: [
                    ['/api/', 'Introduction'],
                    ['/api/hasura', 'Hasura'],
                    ['/api/table', 'Table'],
                    ['/api/field', 'Field'],
                    ['/api/fragment', 'Fragment'],
                ]
            }
        ]
    }
}