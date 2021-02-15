# Shotgun 3D Previewer

![](docs/../doc/images/sg-3d-previewer.gif)

## Build Project

### Set Base URL

In `src/env.js`, there's declaration for Shotgun URL.

```javascript
const baseUrl = '<shotgun_url>'
```


### Credential Settings

To access to Shotgun, you have to set credential info to `src/env.js`.

Basic access uses Shotgun script/api-key info with Grant Type: `client_credentials`.

However there's other Grant Types to access with REST API. The document is [here](https://developer.shotgunsoftware.com/rest-api/#authentication).


#### Grant Type: `client_credentials`

```javascript
'use strict'

const credentialParams = {
    'client_id': '<script_name>',
    'client_secret': '<api_key>',
    'grant_type': 'client_credentials'
}

module.exports = credentialParams
```

#### Grant Type: `password`

```javascript
'use strict'

const credentialParams = {
    'username': '<your_username>',
    'password': '<your_password>',
    'grant_type': 'password'
}

module.exports = credentialParams
```


### Build

```shell
npm install
npm run build
```


### Deploy with Docker

```shell
docker build -t sg-3d-previewer .
docker run -p 9080:9080 -d sg-3d-previewer
```

Then, accessing on a browser at http://localhost:9080 .

### Prepare to use on Shotgun

1. Create `sg_preview_geometry` fileld on Version entity. 
2. Open a design page at Asset entity item page.
3. Add new URL type tab.
4. Insert URL with query:
   * Ex: http://localhost:9080/?assetId={id}&envmap=0

| Query Name   | Value | Required/Optional | Description                                          |
|:-------------|:------|:------------------|:-----------------------------------------------------|
| assetId (Int)| {id}  | Required          | Asset ID to recognize which asset will be displayed. |
| envmap (Int) | 0,1,2 | Optional          | Set default Environment map from defined set.        |


### Use the ervice

1. Create Version entity item with a preview geoemtry file [.glt, .glb, .fbx].
3. Open the tab previously created.


## Development

### Build as dev mode

```shell
npm run dev
```

### Run on Express.js Server

To test server with routing:

```shell
cd serve
npm start
```

## Spec

### GLTF File

* Currently Embded(textures) or Binary type of GLTF file is only supported, for GLTF file format.
  * Ex: https://github.com/KhronosGroup/glTF-Sample-Models/tree/master/2.0/AlphaBlendModeTest/glTF-Embedded
  * Ex: https://github.com/KhronosGroup/glTF-Sample-Models/tree/master/2.0/AlphaBlendModeTest/glTF-Binary

### FBX File

* Loading lights also works as FBX scene loading.
