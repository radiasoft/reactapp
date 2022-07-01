# reactapp
Test react app

```bash
$ npm install
$ npm start
```

then visit http://v.radia.run:3000/


![Screen Shot 2022-07-01 at 2 36 21 PM](https://user-images.githubusercontent.com/6516910/176965371-c9ad3aa1-497d-4caa-ad50-6a863e0ea12a.png)

Derived from https://github.com/radiasoft/reactapp/tree/garsuga

Proof of concept using raw React + Redux for the form and model state.

Interesting parts:

types.js which has a type factory based on the schema name. Creates a object which can validate and provide a UI component for editing. Apps can register arbiratry type classes.

myapp.scss customize bootstrap using SASS variables and css overrides

app.js Rough React parts, using react-bootstrap with fontawesome icons.
