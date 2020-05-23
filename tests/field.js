const test = require('ava');
const { Field } = require('../src');

test('wrong field define', (t) => {
    t.throws(
        () => {
            return new Field();
        },
        { instanceOf: Error },
    );

    t.throws(
        () => {
            return new Field({
                some_other_param: '123',
            });
        },
        { instanceOf: Error },
    );
});

test('succesful contructor', (t) => {
    var field = new Field({
        name: 'id',
    });

    t.true(field instanceof Field);
    t.is(field.name, 'id');
    t.is(field.type, null);
    t.is(field.isPrimary, false);

    var field = new Field('id');
    t.true(field instanceof Field);
    t.is(field.name, 'id');
    t.is(field.type, null);
    t.is(field.isPrimary, false);
});

test('test setters', (t) => {
    const field = new Field({
        name: 'id',
    });

    field.isPrimary = 1;
    t.is(field.isPrimary, true);

    field.isPrimary = 0;
    t.is(field.isPrimary, false);

    field.isPrimary = true;
    t.is(field.isPrimary, true);

    field.type = 'Integer';
    t.is(field.type, 'Integer');
});
