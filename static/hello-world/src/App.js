import React, {useEffect, useState} from 'react';
import {invoke, requestConfluence} from '@forge/bridge';
import ReactHtmlParser from 'react-html-parser';
import { decode } from 'he';
import DOMPurify from 'dompurify';

const storageToView = async () => {
    const expand = [
        "webresource.superbatch.uris.css",
        "webresource.superbatch.uris.js",
        "webresource.uris.css",
        "webresource.uris.js"
    ].join();
    const storage = `<ac:structured-macro ac:name="jira" ac:schema-version="1" data-layout="full-width" ac:local-id="bbd04cc2-1d32-436b-a59c-5b5ae4538535" ac:macro-id="3d89d721-1b0c-4bee-82b2-0404ab1c2dc5"><ac:parameter ac:name="server">System JIRA</ac:parameter><ac:parameter ac:name="columns">key,summary,type,created,updated,due,assignee,reporter,priority,status,resolution</ac:parameter><ac:parameter ac:name="maximumIssues">20</ac:parameter><ac:parameter ac:name="jqlQuery">project= PerTest1 </ac:parameter><ac:parameter ac:name="serverId">13f7b4d2-45ff-3128-84f4-c948649b144a</ac:parameter></ac:structured-macro><p><ac:structured-macro ac:name="jira" ac:schema-version="1" ac:macro-id="ca5ba96e-483a-41a9-a5d0-8ff2a9aee86a"><ac:parameter ac:name="key">PERTEST1-3</ac:parameter><ac:parameter ac:name="serverId">13f7b4d2-45ff-3128-84f4-c948649b144a</ac:parameter><ac:parameter ac:name="server">System JIRA</ac:parameter></ac:structured-macro></p>`;
    const body = {
        "value": storage,
        "representation": "storage",
        "content": {
            "id": 65437697,
            "version": {"number": 5}
        }
    }
    const response = await requestConfluence(`/wiki/rest/api/contentbody/convert/view?expand=${expand}`,
        {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
        }
    );
    const renderResponse = await response.json();
    const wr = renderResponse.webresource;
    const jsDependencies = wr.superbatch.uris.js.concat(wr.uris.js || []);
    const cssDependencies = wr.superbatch.uris.css.concat(wr.uris.css || []);
    const page = {
        body: renderResponse.value,
        css: cssDependencies,
        js: jsDependencies
    }
    const allCss = page.css.map(style => `<link rel="stylesheet" href=${style} media="all">`).join('\n')
    const allJs = page.css.map(script => `<script src=${script} type="text/javascript"></script>`).join('\n')

    const htmpPage = `
<!doctype html>
<html>
<head>
    <title>My Test Page</title>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="viewport" content="width=device-width, height=device-height, initial-scale=1">
    <style>
        body.add-on {
            background-color: transparent;
        }
    </style>
</head>
<body class="add-on" style="overflow:visible">
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js"></script>
<!--<script src="{{hostScriptUrl}}" type="text/javascript"></script>-->
${allCss}

${allJs}

</body>
${page.body}
</html>
  `
    return htmpPage;
}

function App() {
    const [data, setData] = useState(null);
    const [rawHTML, setRawHTML] = useState(null);

    useEffect(async () => {
        setRawHTML(await storageToView())
        invoke('getText', {example: 'my-invoke-variable'}).then(setData);
    }, []);

    return (
        <>
            <div>
                {data ? data : 'Loading...'}
            </div>

            <div>
                { rawHTML? ReactHtmlParser(
                    DOMPurify.sanitize(decode(rawHTML))
                ): <></> }
            </div>
        </>
    );
}

export default App;
