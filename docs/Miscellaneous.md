# Miscellaneous Information

### `public` folder in S3 bucket
AWS Amplify automatically generates a filepath prefix, which by default is named `public`. 

E.g., filepath WITHOUT prefix: `UBCO/2023/syllabus.pdf` 

E.g., filepath WITH prefix: `public/UBCO/2023/syllabus.pdf` 

The folder named `public` in the S3 bucket is created to simply match the generated filepath. The name `public` does not mean that the contents within that folder are publicly accessible.  
