/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getAllGuidelines = /* GraphQL */ `
  query GetAllGuidelines {
    getAllGuidelines {
      statusCode
      result
    }
  }
`;
export const getAllSyllabusMetadata = /* GraphQL */ `
  query GetAllSyllabusMetadata($offset: Int!) {
    getAllSyllabusMetadata(offset: $offset) {
      statusCode
      result
    }
  }
`;
export const getSyllabusAnalysis = /* GraphQL */ `
  query GetSyllabusAnalysis($syllabusID: String!) {
    getSyllabusAnalysis(syllabusID: $syllabusID) {
      statusCode
      result
    }
  }
`;
export const getFacultyResult = /* GraphQL */ `
  query GetFacultyResult {
    getFacultyResult {
      statusCode
      result
    }
  }
`;
export const getCampusResult = /* GraphQL */ `
  query GetCampusResult {
    getCampusResult {
      statusCode
      result
    }
  }
`;
export const getFacultyList = /* GraphQL */ `
  query GetFacultyList {
    getFacultyList {
      statusCode
      result
    }
  }
`;
export const getGuidelineCountCampus = /* GraphQL */ `
  query GetGuidelineCountCampus($campus: String!) {
    getGuidelineCountCampus(campus: $campus) {
      statusCode
      result
    }
  }
`;
export const getGuidelineCountFaculty = /* GraphQL */ `
  query GetGuidelineCountFaculty($faculty: String!) {
    getGuidelineCountFaculty(faculty: $faculty) {
      statusCode
      result
    }
  }
`;
