import React from 'react'
import AppRoot from './app.js'

const schemaPath = process.env.PUBLIC_URL + '/myapp-schema.json'


const MyAppAppRoot = (props) => {
    return (
        <React.StrictMode>
            <AppRoot schemaPath={schemaPath} {...props}></AppRoot>
        </React.StrictMode>
    )
}

export default MyAppAppRoot
