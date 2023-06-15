/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const addGuideline = /* GraphQL */ `
  mutation AddGuideline($guideline: String!, $guidelineCode: String!) {
    addGuideline(guideline: $guideline, guidelineCode: $guidelineCode) {
      statusCode
      result
    }
  }
`;
export const removeGuideline = /* GraphQL */ `
  mutation RemoveGuideline($guidelineID: String!) {
    removeGuideline(guidelineID: $guidelineID) {
      statusCode
      result
    }
  }
`;
export const startJobRun = /* GraphQL */ `
  mutation StartJobRun($guideline: String!) {
    startJobRun(guideline: $guideline) {
      statusCode
      result
    }
  }
`;
export const loadSQL = /* GraphQL */ `
  mutation LoadSQL($sql: String!) {
    loadSQL(sql: $sql) {
      statusCode
      result
    }
  }
`;
