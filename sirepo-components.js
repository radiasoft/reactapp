const {connect, Provider} = ReactRedux;
const {createStore, compose} = Redux;

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
    return elem;
}

function editorType(val) {
    if (typeof(val) == 'number') {
        return 'number';
    } else if (typeof(val) == 'boolean') {
        return 'checkbox';
    } else {
        return 'text';
    }
 }

export class SRComponentBase extends React.Component {
    constructor(props) {
        super(props);
    }



    app(...components) {
        return this.div({
            children: [
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

    header(children={}) {
        return this.div({
            props: {className: 'topnav'},
            children: children,
        });
    }

    panel(modelKey, children={}) {
        return this.div({
            props: {className: 'col-sm-12'},
            children: [
                this.div({
                    props: {className: 'panel panel-info'},
                    children: [
                        this.panelHeader(modelKey),
                        this.panelBody(modelKey),
                        this.div(children),
                        this.footer(),
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
                type: editorType(this.APP_STATE.model[modelKey][fieldName]),
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

    footer() {
        return this.div({
            props: {
                className: 'panel-footer'
            },
        })
    }

    input(id){
        return e({
            type: 'input',
            props: {
                type: 'checkbox',
                id: id
            },
        });
    }

    label(text, id){
        return e({
            type: 'label',
            props: {
                for: id,
            },
            children: text,
        });
    }

    checkBox(text, id){
        return this.div( {
            children: [
                this.label(text, id),
                this.input(id),
                ]
            }
        )
    }

    tabSelector(tabList, defaultTab) {

        const l = [];
        tabList.forEach((t) => {
            if (t == defaultTab) {
                l.push(
                    this.div({props: {id: t}, children: this[t]()}) // this[t]() means that the tab elements have to be defined by child app class
                )
            } else {
                l.push(
                    this.div({props: {id: t}})
                )
            }
        })

        const renderTargetTab = (targetTab) => { // can put logic in the component
            tabList.forEach((h) => {
                if (h != targetTab) {
                    ReactDOM.render('', document.getElementById(h));
                }
            })
            ReactDOM.render(this[targetTab](), document.getElementById(targetTab));
        }

        return e({
            type: 'div',
            children: [
                this.header([
                    tabList.map(
                        (t) => this.button({text: t, props: {
                            onClick: () => {
                                renderTargetTab(t);
                            },
                        }
                        })
                )]),
                ...l
            ]
        })
    }
}
