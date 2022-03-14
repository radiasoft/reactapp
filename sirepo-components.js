function e({type, props={}, children=[]}) {
    return React.createElement(
        type,
        props,
        children
    );
}

export class SRComponentBase {

    app(...components) {
        return this.div({children: components});
    }

    button({props={}, text=''}) {
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
            children: this.APP_SCHEMA.header.map((t) => this.button({text: t}))
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
        const c = this.APP_SCHEMA.view[modelKey].basic.map((f) => {
            return this.editorField(modelKey, f)
        })
        return this.div({children: c});
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
            props: {className: 'panel-heading'}, // TODO(e-carlin): className
            children: [
                this.h1(this.APP_SCHEMA.view[modelKey].title) // TODO(e-carlin): convert modelKey to title
            ]
        })
    }
}
