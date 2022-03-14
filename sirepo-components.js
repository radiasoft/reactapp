function e({type, props={}, children=[]}) {
    console.log(`type=${type} props=${JSON.stringify(props)} children=${JSON.stringify(children)}`)
    return React.createElement(
        type,
        props,
        // TODO(e-carlin): for strings this exapnds to array.
        // Could that be problematic?
        ...children
    );
}

export class SRBase {

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

    header(tabs) {
        return this.div({
            props: {className: 'topnav'},
            children: tabs.map((t) => this.button({text: t}))
        });
    }
}
