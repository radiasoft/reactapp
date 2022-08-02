import React from 'react'
import AppRoot from './app.js'

const schemaPath = process.env.PUBLIC_URL + '/myapp-schema.json'


const MyAppAppRoot = (props) => {
    return (
        <AppRoot schemaPath={schemaPath} appName={'myapp'} {...props}></AppRoot>
    )
}

export default MyAppAppRoot
