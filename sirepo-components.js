function e({type, props={}, children=[]}) {
    // TODO(e-carlin): I don't think instanceof always works
    // https://web.mit.edu/jwalden/www/isArray.html
    if(children instanceof Array) {
        var elem = React.createElement(
            type,
            props,
            ...children
        );

        return elem;
    }
    var elem = React.createElement(
        type,
        props,
        children
    );
    if (type == 'button'){
        console.log('ELEM: ', elem);
    }
    return elem;
}

export class SRComponentBase {

    app(...components) {
        console.log('react is ', React)
        return this.div({
            children: [
                this.header(),
                ...components
            ]
        });
    }

    button({props={}, text}) {
        return e({
            type: 'button',
            props: props,
            children: text
        });
    };

    div({props={}, children=[]}) {
        return e({
            type: 'div',
            props: props,
            children: children
        });
    };

    h1(text) {
        return e({
            type: 'h1',
            children: text
        })
    }

    header() {
        return this.div({
            props: {className: 'topnav'},
            children: this.APP_SCHEMA.header.map(
                (t) => this.button({text: t})
            )
        });
    }

    panel(modelKey, children={}) {
        return this.div({
            props: {className: 'col-sm-12', id: 'panel'},
            children: [
                this.div({
                    props: {className: 'panel panel-info'},
                    children: [
                        this.panelHeader(modelKey),
                        this.panelBody(modelKey),
                        this.div(children),
                    ]
                })
            ]
        })
    }

    // TODO(e-carlin): sort
    editorLabel(label) {
        return e({
            type: 'label',
            children: [
                e({
                    type: 'span',
                    children: label
                })
            ]
        });
    }

    editorValue(modelKey, fieldName) {
        return e({
            type: 'input',
            props: {
                type: 'text',
                onChange: (event) => {
                    this.APP_STATE.model[modelKey][fieldName] = event.target.value;
                },
                value: this.APP_STATE.model[modelKey][fieldName]
            },
        });
    }

    // TODO(e-carlin): sort
    editorField(modelKey, fieldName) {
        const m = this.APP_SCHEMA.model[modelKey][fieldName];
        return this.div({
            children: [
                this.editorLabel(m[0]),
                this.editorValue(modelKey, fieldName)
            ]
        })
    }

    // TODO(e-carlin): sort
    editorPane(modelKey) {
        return this.div({
            children: this.APP_SCHEMA.view[modelKey].basic.map(
                (f) => this.editorField(modelKey, f)
            )
        });
    }

    panelBody(modelKey) {
        return this.div({
            props: {className: 'panel-body'},
            children: [
                this.editorPane(modelKey)
            ]
        })
    }

    panelHeader(modelKey) {
        return this.div({
            props: {className: 'panel-heading'},
            children: this.h1(this.APP_SCHEMA.view[modelKey].title)

        })
    }

    span({props={}, children=[]}) {
        return e({
            type: 'span',
            props: props,
            children: children
        });
    };

    spinner() {
        return this.div({
            props: {className: 'btn btn-lg'},
            children: [this.span({
                props: {className: 'glyphicon glyphicon-refresh spinning'}
            }
            ), '   Running Simulation...']
        })
    }
}
