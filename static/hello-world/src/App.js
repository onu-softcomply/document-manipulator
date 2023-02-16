import React, {useEffect, useState} from 'react';
import {invoke, requestConfluence} from '@forge/bridge';
import ReactHtmlParser from 'react-html-parser';
import { decode } from 'he';
import DOMPurify from 'dompurify';
import '@atlaskit/css-reset';

const getPageView = async () => {
    const expand = [
        "body.view",
        "body.view.webresource.superbatch.uris.css",
        "body.view.webresource.superbatch.uris.js",
        "body.view.webresource.uris.css",
        "body.view.webresource.uris.js"
    ].join();
    const response = await requestConfluence(`/wiki/rest/api/content/65437697?expand=${expand}`,
        {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }
    );
    const renderResponse = await response.json();

    const wr = renderResponse.body.view.webresource;
    const jsDependencies = wr.superbatch.uris.js.concat(wr.uris.js || []);
    const cssDependencies = wr.superbatch.uris.css.concat(wr.uris.css || []);
    const page = {
        body: renderResponse.body.view.value,
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
        setRawHTML(await getPageView())
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
