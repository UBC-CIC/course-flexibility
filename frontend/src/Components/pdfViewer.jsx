import React from 'react';
import { useState, useEffect } from 'react';
import { Storage } from 'aws-amplify';

// Import the styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import { Typography } from '@material-ui/core';

async function getPDFURL(url){
    // get the signed URL string
    const signedURL = await Storage.get(url); ;
    return signedURL;
}

// Uses @cyntler/react-doc-viewer to render files
function PDFLoad({ url }) {
  const [doc, setDoc] = useState(null);
  const [s3URL, setS3URL] = useState(null);

  useEffect(() => {
    getPDFURL(url).then((url) => {
      setS3URL(url);
      const docData = [{ uri: url, fileType: 'pdf' }];
      setDoc(docData);
    });
  }, [url]);

  return (
    <div>
      {doc && (
        <div>
          <Typography>You can open the file using the link below if it does not load.</Typography>
          <a href={s3URL} target="_blank" rel="noopener noreferrer">
            Open File
          </a>
          <DocViewer pluginRenderers={DocViewerRenderers} documents={doc} />
        </div>
      )}
    </div>
  );
}

export default PDFLoad; 
