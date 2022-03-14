function e({type, props={}, children=[]}) {
    // TODO(e-carlin): I don't think instanceof always works
    // https://web.mit.edu/jwalden/www/isArray.html
    if(children instanceof Array) {
        return React.createElement(
            type,
            props,
            ...children
        );
    }
    return React.createElement(
        type,
        props,
        children
    );
}

export class SRComponentBase {

    app(...components) {
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

    panel(modelKey) {
        return this.div({
            props: {className: 'col-sm-12'},
            children: [
                this.div({
                    props: {className: 'panel panel-info'},
                    children: [
                        this.panelHeader(modelKey),
                        this.panelBody(modelKey)
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

    // TODO(e-carlin): sort
    editorValue() {

    }

    // TODO(e-carlin): sort
    editorField(modelKey, fieldName) {
        const m = this.APP_SCHEMA.model[modelKey][fieldName];
        return this.div({
            children: [
                this.editorLabel(m[0]),
                this.editorValue()
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
}
